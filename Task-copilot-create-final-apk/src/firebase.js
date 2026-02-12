import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, setPersistence, browserLocalPersistence, signInWithCredential } from 'firebase/auth'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { getFirestore } from 'firebase/firestore'
import { getDatabase } from 'firebase/database'

// ===== Platform helpers (improved) =====
const isCapacitor = () => typeof window !== 'undefined' && !!window.Capacitor
const getCapacitorPlatform = () => {
  try {
    if (typeof window === 'undefined' || !window.Capacitor) return null
    if (typeof window.Capacitor.getPlatform === 'function') return window.Capacitor.getPlatform()
    return window.Capacitor?.platform?.name || null
  } catch (e) {
    console.warn('Error while reading Capacitor platform:', e)
    return null
  }
}
const isAndroid = () => {
  const p = getCapacitorPlatform()
  return p === 'android' || p === 'Android'
}
const isWeb = () => !isCapacitor()

console.log('🔍 Firebase helper init — Capacitor present:', Boolean(typeof window !== 'undefined' && window.Capacitor), 'Capacitor.getPlatform():', getCapacitorPlatform())

const getFirebaseConfig = () => {
  const hardcodedConfig = {
    apiKey: "AIzaSyBrlDiaISY2hajF7LBvFkgdEcUMsRzQneQ",
    authDomain: "task-rai.firebaseapp.com",
    projectId: "task-rai",
    storageBucket: "task-rai.appspot.com", // KORREKT!
    messagingSenderId: "99376901660",
    appId: "1:99376901660:web:87dac908af8143968d79d9",
    databaseURL: "https://task-rai.firebaseio.com",
  }
  if (isWeb()) {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || hardcodedConfig.apiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || hardcodedConfig.authDomain,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || hardcodedConfig.projectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || hardcodedConfig.storageBucket,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || hardcodedConfig.messagingSenderId,
      appId: import.meta.env.VITE_FIREBASE_APP_ID || hardcodedConfig.appId,
      databaseURL: hardcodedConfig.databaseURL,
    }
  } else {
    return hardcodedConfig
  }
}

const firebaseConfig = getFirebaseConfig()

export const isFirebaseConfigured = () => {
  const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId']
  const allValuesSet = requiredKeys.every(key => {
    const value = firebaseConfig[key]
    return value && String(value).trim() !== ''
  })
  if (!allValuesSet) {
    console.warn('⚠️ Firebase ist nicht vollständig konfiguriert!')
    console.warn('🔧 Platform:', isAndroid() ? 'Android/Capacitor' : isWeb() ? 'Web/Browser' : 'Unbekannt')
    requiredKeys.forEach(key => {
      const value = firebaseConfig[key]
      if (!value || String(value).trim() === '') {
        console.warn(`  ❌ ${key}`)
      }
    })
    return false
  }
  return true
}

// Firebase init
let app = null
let auth = null
let googleProvider = null
let messaging = null
let db = null
let rtdb = null

if (isFirebaseConfigured()) {
  try {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    googleProvider = new GoogleAuthProvider()
    googleProvider.setCustomParameters({
      'prompt': 'select_account'
    })
    if (isAndroid() && typeof googleProvider.setDefaultLanguage === 'function') {
      googleProvider.setDefaultLanguage('de')
    }
    db = getFirestore(app)
    rtdb = getDatabase(app)
    if (isWeb()) {
      messaging = getMessaging(app)
    }
  } catch (error) {
    console.error('❌ Fehler bei Firebase Initialisierung:', error)
  }
}

// ===== GOOGLE SIGN-IN WRAPPER (Block Popup on Android!) =====

export async function googleSignIn() {
  console.log('🔐 Google Sign-In gestartet...')
  console.log('📱 Platform detection -> isCapacitor:', isCapacitor(), 'isAndroid():', isAndroid())
  const hasGoogleAuthPlugin = typeof window !== 'undefined' && !!window.Capacitor?.Plugins?.GoogleAuth
  console.log('🔎 GoogleAuth plugin present:', hasGoogleAuthPlugin)

  // Native GoogleAuth flow
  if (isAndroid() && hasGoogleAuthPlugin) {
    try {
      const GoogleAuth = window.Capacitor.Plugins.GoogleAuth
      await GoogleAuth.initialize({
        clientId: import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID_WEB || '99376901660-4su6836vocq97tj87rgibkpkj512hgsd.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      })
      const result = await GoogleAuth.signIn()
      if (result.authentication?.idToken) {
        const credential = googleProvider.credential(null, result.authentication.idToken)
        // Modular Firebase Auth
        const authResult = await signInWithCredential(auth, credential)
        return authResult
      }
      throw new Error('Kein idToken von GoogleAuth erhalten!')
    } catch (error) {
      console.error('❌ Nativer Android Google Sign-In fehlgeschlagen:', error)
      throw new Error('Native Google Sign-In fehlgeschlagen: ' + error.message)
    }
  }

  // BLOCK POPUP on Android/Capacitor (no Web-Popup fallback)
  if (!isWeb()) {
    throw new Error('Native GoogleAuth-Integration ist nicht verfügbar. Bitte Plugin installieren und npx cap sync android ausführen. Web-Popup ist in Android-Apps NICHT möglich.');
  }

  // Web-Popup-Flow (nur Browser)
  try {
    await setPersistence(auth, browserLocalPersistence)
    googleProvider.setCustomParameters({ 'prompt': 'select_account' })
    const result = await signInWithPopup(auth, googleProvider)
    return result
  } catch (error) {
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Google Sign-In Fenster wurde geschlossen. Bitte versuche es erneut.')
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Pop-up wurde blockiert. Bitte erlaube Pop-ups für diese App.')
    } else if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Google Sign-In ist nicht aktiviert. Kontaktiere den Administrator.')
    } else {
      throw new Error('Google Sign-In fehlgeschlagen: ' + error.message)
    }
  }
}

// ===== FCM, DB, EXPORT =====

export async function requestFCMToken() {
  if (!messaging) {
    return null
  }
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
    if (!vapidKey) return null
    const token = await getToken(messaging, { vapidKey })
    return token
  } catch (error) {
    return null
  }
}

export function onForegroundMessage(callback) {
  if (!messaging) return () => {}
  try {
    const unsubscribe = onMessage(messaging, (payload) => {
      callback(payload)
      if (payload.notification) {
        new Notification(payload.notification.title || 'TaskRai', {
          body: payload.notification.body,
          icon: payload.notification.icon,
          badge: '/firebase-messaging-sw.js',
        })
      }
    })
    return unsubscribe
  } catch (error) {
    return () => {}
  }
}

export async function getAndroidFCMToken() {
  if (!isAndroid()) return null
  try {
    if (window.Capacitor?.Plugins?.PushNotifications) {
      const push = window.Capacitor.Plugins.PushNotifications
      const result = await push.getDeliveredNotifications()
      return result
    }
  } catch (error) {}
  return null
}

export {
  app,
  auth,
  googleProvider,
  messaging,
  db,
  rtdb,
  isAndroid,
  isWeb,
  isCapacitor,
  firebaseConfig
}

export default {
  app,
  auth,
  googleProvider,
  messaging,
  db,
  rtdb,
  isFirebaseConfigured,
  googleSignIn,
  requestFCMToken,
  onForegroundMessage,
  getAndroidFCMToken,
  isAndroid,
  isWeb,
  isCapacitor,
  firebaseConfig
}
