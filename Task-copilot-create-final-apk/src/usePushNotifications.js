import { useEffect, useState } from 'react';
import { requestFCMToken, onForegroundMessage } from './firebase';

// Capacitor Push Notifications (für Android)
// Installiere zuerst: npm install @capacitor/push-notifications
let PushNotifications;
try {
  PushNotifications = require('@capacitor/push-notifications').PushNotifications;
} catch (err) {
  console.log('Capacitor Push Notifications nicht verfügbar');
}

/**
 * Custom Hook für Push Notifications
 * Funktioniert sowohl im Web (FCM) als auch in Android (Capacitor + FCM)
 */
export function usePushNotifications({ onNotificationReceived, onTokenReceived }) {
  const [token, setToken] = useState(null);
  const [permission, setPermission] = useState('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    initializePushNotifications();
  }, []);

  const initializePushNotifications = async () => {
    // Prüfe ob wir in Capacitor (Android) oder Browser sind
    const isCapacitor = !!window.Capacitor;

    if (isCapacitor && PushNotifications) {
      // === ANDROID (CAPACITOR) ===
      await setupCapacitorPush();
    } else if ('Notification' in window && 'serviceWorker' in navigator) {
      // === WEB (BROWSER) ===
      await setupWebPush();
    } else {
      console.log('Push Notifications werden nicht unterstützt');
      setIsSupported(false);
    }
  };

  // Android Push Setup
  const setupCapacitorPush = async () => {
    try {
      // Permission anfragen
      const result = await PushNotifications.requestPermissions();
      
      if (result.receive === 'granted') {
        setPermission('granted');
        setIsSupported(true);
        
        // Registrieren
        await PushNotifications.register();

        // Token Listener
        PushNotifications.addListener('registration', (token) => {
          console.log('Android Push Token:', token.value);
          setToken(token.value);
          if (onTokenReceived) {
            onTokenReceived(token.value, 'android');
          }
        });

        // Registration Error
        PushNotifications.addListener('registrationError', (error) => {
          console.error('Android Push Registration Error:', error);
        });

        // Foreground Notification (App ist offen)
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Android Push empfangen (foreground):', notification);
          if (onNotificationReceived) {
            onNotificationReceived(notification, 'android');
          }
        });

        // Notification Click (App wird geöffnet)
        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('Android Push geklickt:', notification);
          if (onNotificationReceived) {
            onNotificationReceived(notification.notification, 'android-click');
          }
        });
      } else {
        setPermission('denied');
        console.log('Push Permission verweigert');
      }
    } catch (error) {
      console.error('Fehler bei Android Push Setup:', error);
      setIsSupported(false);
    }
  };

  // Web Push Setup
  const setupWebPush = async () => {
    try {
      setIsSupported(true);

      // Service Worker registrieren
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          console.log('Service Worker registriert:', registration);
        } catch (err) {
          console.warn('Service Worker Registrierung fehlgeschlagen:', err);
        }
      }

      // FCM Token anfordern
      const fcmToken = await requestFCMToken();
      if (fcmToken) {
        setToken(fcmToken);
        setPermission('granted');
        if (onTokenReceived) {
          onTokenReceived(fcmToken, 'web');
        }
      } else {
        setPermission(Notification.permission);
      }

      // Foreground Messages für Web
      const unsubscribe = onForegroundMessage((payload) => {
        console.log('Web Push empfangen (foreground):', payload);
        
        if (onNotificationReceived) {
          onNotificationReceived({
            title: payload.notification?.title,
            body: payload.notification?.body,
            data: payload.data
          }, 'web');
        }

        // Notification anzeigen
        if (Notification.permission === 'granted' && payload.notification) {
          new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: '/vite.svg',
            data: payload.data
          });
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Fehler bei Web Push Setup:', error);
      setIsSupported(false);
    }
  };

  // Manuelle Permission Anfrage (für UI Button)
  const requestPermission = async () => {
    const isCapacitor = !!window.Capacitor;
    
    if (isCapacitor && PushNotifications) {
      return setupCapacitorPush();
    } else {
      return setupWebPush();
    }
  };

  return {
    token,
    permission,
    isSupported,
    requestPermission,
  };
}

export default usePushNotifications;
