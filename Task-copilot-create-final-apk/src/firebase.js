import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { getFirestore } from 'firebase/firestore'
import { getDatabase } from 'firebase/database'

// ✅ Detect Platform (Web vs Capacitor/Android)
const isCapacitor = () => typeof window !== 'undefined' && !!window.Capacitor
const isAndroid = () => isCapacitor() && window.Capacitor?.platform?.name === 'Android'
const isWeb = () => !isCapacitor()

// ✅ Firebase Config - HARDCODED für Android & Environment Variables für Web
const getFirebaseConfig = () => {
  // ✅ HARDCODED VALUES (funktionieren auf Android!)
  const hardcodedConfig = {
    apiKey: "AIzaSyBrlDiaISY2hajF7LBvFkgdEcUMsRzQneQ",
    authDomain: "task-rai.firebaseapp.com",
    projectId: "task-rai",
    storageBucket: "task-rai.appspot.com", // <-- korrigiert
    messagingSenderId: "99376901660",
    appId: "1:99376901660:web:87dac908af8143968d79d9",
    databaseURL: "https://task-rai.firebaseio.com",
  }

  // Für Web: Versuche .env.local zu laden, fallback auf hardcoded
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
    // Für Android: Immer hardcoded (Environment vars funktionieren nicht in APK)
    return hardcodedConfig
  }
}

const firebaseConfig = getFirebaseConfig()

// ✅ Überprüfe ob alle Firebase Config Werte gesetzt sind
export const isFirebaseConfigured = () => {
  const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId']
  
  const allValuesSet = requiredKeys.every(key => {
    const value = firebaseConfig[key]
    return value && String(value).trim() !== ''
  })
  
  if (!allValuesSet) {
    console.warn('⚠️ Firebase ist nicht vollständig konfiguriert!')
    console.warn('🔧 Platform:', isAndroid() ? 'Android/Capacitor' : isWeb() ? 'Web/Browser' : 'Unbekannt')
    console.warn('Fehlende oder leere Werte:')
    requiredKeys.forEach(key => {
      const value = firebaseConfig[key]
      if (!value || String(value).trim() === '') {
        console.warn(`  ❌ ${key}`)
      } else {
        console.log(`  ✅ ${key}: ${String(value).substring(0, 20)}...`)
      }
    })
    return false
  }
  
  console.log('✅ Alle Firebase Config Werte sind gesetzt!')
  return true
}

// ✅ Initialisiere Firebase nur wenn vollständig konfiguriert
let app = null
let auth = null
let googleProvider = null
let messaging = null
let db = null
let rtdb = null

if (isFirebaseConfigured()) {
  try {
    console.log('🚀 Starte Firebase Initialisierung...')
    console.log('📱 Platform:', isAndroid() ? 'Android/Capacitor' : isWeb() ? 'Web/Browser' : 'Unbekannt')
    console.log('🔐 Verwende:', isAndroid() ? 'HARDCODED Config (Android APK)' : 'ENV + Fallback Config')
    
    app = initializeApp(firebaseConfig)
    console.log('✅ Firebase App initialisiert')
    
    // Auth
    auth = getAuth(app)
    googleProvider = new GoogleAuthProvider()
    
    // ✅ WICHTIG für Android: Google Provider Konfiguration
    googleProvider.setCustomParameters({
      'prompt': 'select_account'
    })
    
    if (isAndroid()) {
      googleProvider.setDefaultLanguage('de')
      console.log('✅ Google Provider für Android konfiguriert (mit Custom Parameters)')
    }
    
    console.log('✅ Firebase Auth & Google Provider initialisiert')
    
    // Firestore
    try {
      db = getFirestore(app)
      console.log('✅ Firestore initialisiert')
    } catch (err) {
      console.warn('⚠️ Firestore nicht verfügbar:', err.message)
    }
    
    // Realtime Database
    try {
      rtdb = getDatabase(app)
      console.log('✅ Realtime Database initialisiert')
    } catch (err) {
      console.warn('⚠️ Realtime Database nicht verfügbar:', err.message)
    }
    
    // Firebase Cloud Messaging nur im Browser initialisieren
    if (isWeb()) {
      try {
        messaging = getMessaging(app)
        console.log('✅ Firebase Cloud Messaging (FCM) aktiviert')
      } catch (err) {
        console.warn('⚠️ Firebase Messaging nicht verfügbar:', err.message)
      }
    } else if (isAndroid()) {
      console.log('ℹ️ FCM wird nativ auf Android verwaltet')
    }
    
    console.log('✅ Firebase vollständig initialisiert!')
    
  } catch (error) {
    console.error('❌ Fehler bei Firebase Initialisierung:', error)
    console.error('Error Details:', error.message)
  }
} else {
  console.error('❌ Firebase konnte nicht initialisiert werden - Config ist unvollständig!')
}

// ===== GOOGLE SIGN-IN WRAPPER =====

/**
 * ✅ Wrapper für signInWithPopup mit Android Support
 * Auf Android wird native Google Sign-In verwendet wenn verfügbar
 */
export async function googleSignIn() {
  console.log('🔐 Google Sign-In gestartet...')
  console.log('📱 Platform:', isAndroid() ? 'Android (native)' : 'Web (popup)')
  
  // ✅ Versuche zuerst native Android Google Sign-In
  if (isAndroid() && window.Capacitor?.Plugins?.GoogleAuth) {
    try {
      console.log('🔑 Versuche native Android Google Sign-In...')
      const GoogleAuth = window.Capacitor.Plugins.GoogleAuth
      
      // Initialisiere Google Auth Plugin
      await GoogleAuth.initialize({
        clientId: '99376901660-4su6836vocq97tj87rgibkpkj512hgsd.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      })
      
      const result = await GoogleAuth.signIn()
      console.log('✅ Native Android Google Sign-In erfolgreich!')
      console.log('User:', result.email)
      
      // Jetzt mit Firebase Auth anmelden
      if (result.authentication?.idToken) {
        console.log('🔐 Anmeldung mit Firebase Auth...')
        const credential = googleProvider.credential(null, result.authentication.idToken)
        const authResult = await auth.signInWithCredential(credential)
        console.log('✅ Firebase Auth erfolgreich!')
        return authResult
      }
    } catch (error) {
      console.error('❌ Nativer Android Google Sign-In fehlgeschlagen:', error)
      console.log('📱 Fallback zu Web Popup...')
      // Fallback auf Web Popup
    }
  }
  
  // ✅ Web Popup (oder Fallback für Android)
  try {
    console.log('🔐 Verwende Web Popup für Google Sign-In...')

    // === PATCH: Auth Persistenz robust setzen! ===
    try {
      await setPersistence(auth, browserLocalPersistence)
    } catch (err) {
      console.warn('⚠️ Konnte Auth-Persistenz nicht setzen:', err)
    }
    // === PATCH ENDE ===

    // Setze Custom Parameter für besseres UX
    googleProvider.setCustomParameters({
      'prompt': 'select_account'
    })
    
    const result = await signInWithPopup(auth, googleProvider)
    console.log('✅ Web Popup Google Sign-In erfolgreich!')
    console.log('User:', result.user.email)
    return result
    
  } catch (error) {
    console.error('❌ Web Popup Google Sign-In fehlgeschlagen:', error)
    
    // Bessere Error Messages
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

// ===== FCM FUNCTIONS =====

// FCM Token für Web anfordern
export async function requestFCMToken() {
  if (!messaging) {
    console.log('ℹ️ Messaging nicht initialisiert (Web-only Feature)')
    return null
  }

  try {
    const permission = await Notification.requestPermission()
    
    if (permission === 'default') {
      console.log('ℹ️ Notification permission: User hat nicht entschieden')
      return null
    }
    
    if (permission !== 'granted') {
      console.log('❌ Notification permission nicht erteilt')
      return null
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
    
    if (!vapidKey || String(vapidKey).trim() === '') {
      console.warn('⚠️ VITE_FIREBASE_VAPID_KEY fehlt oder ist leer in .env.local')
      return null
    }

    const token = await getToken(messaging, { vapidKey })
    console.log('✅ FCM Token erhalten:', token.substring(0, 20) + '...')
    return token
  } catch (error) {
    console.error('❌ Fehler beim FCM Token abrufen:', error.message)
    return null
  }
}

// Foreground Messages für Web empfangen
export function onForegroundMessage(callback) {
  if (!messaging) {
    console.log('ℹ️ Messaging nicht verfügbar für Foreground Messages')
    return () => {}
  }

  try {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('📨 Foreground message empfangen:', payload)
      
      if (payload.notification) {
        new Notification(payload.notification.title || 'TaskRai', {
          body: payload.notification.body,
          icon: payload.notification.icon,
          badge: '/firebase-messaging-sw.js',
        })
      }
      
      callback(payload)
    })

    return unsubscribe
  } catch (error) {
    console.error('❌ Fehler bei onForegroundMessage:', error.message)
    return () => {}
  }
}

// ===== ANDROID FCM =====

// Für Capacitor/Android - FCM Token vom System abrufen
export async function getAndroidFCMToken() {
  if (!isAndroid()) {
    return null
  }
  
  try {
    if (window.Capacitor?.Plugins?.PushNotifications) {
      const push = window.Capacitor.Plugins.PushNotifications
      const result = await push.getDeliveredNotifications()
      console.log('✅ Android FCM Token abrufen erfolgreich')
      return result
    }
  } catch (error) {
    console.error('❌ Fehler beim Android FCM Token:', error.message)
  }
  return null
}

// ===== EXPORTS =====

export { 
  app, 
  auth, 
  googleProvider, 
  messaging,
  db,           // Firestore
  rtdb,         // Realtime Database
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
  googleSignIn,  // ✅ NEU!
  requestFCMToken,
  onForegroundMessage,
  getAndroidFCMToken,
  isAndroid,
  isWeb,
  isCapacitor,
  firebaseConfig
}
