import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { getFirestore } from 'firebase/firestore'
import { getDatabase } from 'firebase/database'

// ✅ Detect Platform (Web vs Capacitor/Android)
const isCapacitor = () => typeof window !== 'undefined' && !!window.Capacitor
const isAndroid = () => isCapacitor() && window.Capacitor?.platform?.name === 'Android'
const isWeb = () => !isCapacitor()

// ✅ Firebase Config - Je nach Platform
const getFirebaseConfig = () => {
  if (isAndroid()) {
    // Android Config
    return {
      apiKey: import.meta.env.VITE_FIREBASE_ANDROID_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_ANDROID_APP_ID || import.meta.env.VITE_FIREBASE_APP_ID,
      databaseURL: `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseio.com`,
    }
  } else {
    // Web Config
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      databaseURL: `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseio.com`,
    }
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
    console.warn('Fehlende oder leere Werte in .env.local:')
    requiredKeys.forEach(key => {
      const value = firebaseConfig[key]
      if (!value || String(value).trim() === '') {
        console.warn(`  ❌ ${key}`)
      } else {
        console.log(`  ✅ ${key}`)
      }
    })
    return false
  }
  
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
    
    app = initializeApp(firebaseConfig)
    console.log('✅ Firebase App initialisiert')
    
    // Auth
    auth = getAuth(app)
    googleProvider = new GoogleAuthProvider()
    
    // Für Capacitor/Android Google Sign-In
    if (isAndroid()) {
      googleProvider.setDefaultLanguage('de')
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
  console.error('❌ Firebase konnte nicht initialisiert werden - .env.local nicht korrekt konfiguriert')
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
      console.warn('ℹ️ Um FCM Web Push zu aktivieren:')
      console.log('  1. Gehe zu Firebase Console -> Project Settings -> Cloud Messaging')
      console.log('  2. Kopiere den "Web Push Certificate" Public Key')
      console.log('  3. Setze VITE_FIREBASE_VAPID_KEY in .env.local')
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
      
      // Firebase zeigt Notification nur im Hintergrund automatisch
      // Im Vordergrund müssen wir selbst zeigen:
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
    // Mit @capacitor/push-notifications
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
  isCapacitor
}

export default {
  app,
  auth,
  googleProvider,
  messaging,
  db,
  rtdb,
  isFirebaseConfigured,
  requestFCMToken,
  onForegroundMessage,
  getAndroidFCMToken,
  isAndroid,
  isWeb,
  isCapacitor
}
