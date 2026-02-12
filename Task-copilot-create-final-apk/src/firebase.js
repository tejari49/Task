import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean)

let auth = null
let googleProvider = null
let messaging = null

if (isFirebaseConfigured) {
  const app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  googleProvider = new GoogleAuthProvider()
  
  // Messaging nur im Browser initialisieren (nicht in Capacitor/Android)
  if (typeof window !== 'undefined' && !window.Capacitor) {
    try {
      messaging = getMessaging(app)
    } catch (err) {
      console.warn('Firebase Messaging nicht verfügbar:', err)
    }
  }
}

// FCM Token für Web anfordern
export async function requestFCMToken() {
  if (!messaging) {
    console.log('Messaging nicht initialisiert oder Capacitor-Umgebung')
    return null
  }

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.log('Notification permission nicht erteilt')
      return null
    }

    // WICHTIG: VAPID Key muss in Firebase Console generiert werden
    // Cloud Messaging -> Web configuration -> Web Push certificates
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
    
    if (!vapidKey) {
      console.warn('VITE_FIREBASE_VAPID_KEY fehlt in .env.local')
      return null
    }

    const token = await getToken(messaging, { vapidKey })
    console.log('FCM Token (Web):', token)
    return token
  } catch (error) {
    console.error('Fehler beim Abrufen des FCM Tokens:', error)
    return null
  }
}

// Foreground Messages für Web empfangen
export function onForegroundMessage(callback) {
  if (!messaging) {
    console.log('Messaging nicht verfügbar')
    return () => {}
  }

  const unsubscribe = onMessage(messaging, (payload) => {
    console.log('Foreground message empfangen:', payload)
    callback(payload)
  })

  return unsubscribe
}

export { auth, googleProvider, messaging }
