import { useCallback, useEffect, useRef, useState } from 'react';
import { requestFCMToken, onForegroundMessage } from './firebase';

/**
 * Custom Hook für Push Notifications
 * Funktioniert sowohl im Web (FCM) als auch in Android (Capacitor + FCM)
 */
export function usePushNotifications({ onNotificationReceived, onTokenReceived }) {
  const [token, setToken] = useState(null);
  const [permission, setPermission] = useState('default');
  const [isSupported, setIsSupported] = useState(false);
  const onNotificationReceivedRef = useRef(onNotificationReceived);
  const onTokenReceivedRef = useRef(onTokenReceived);

  useEffect(() => {
    onNotificationReceivedRef.current = onNotificationReceived;
  }, [onNotificationReceived]);

  useEffect(() => {
    onTokenReceivedRef.current = onTokenReceived;
  }, [onTokenReceived]);

  const loadPushNotifications = useCallback(async () => {
    try {
      const module = await import('@capacitor/push-notifications');
      return module.PushNotifications;
    } catch (error) {
      console.error('Capacitor Push Notifications nicht verfügbar:', error);
      return null;
    }
  }, []);

  // Android Push Setup
  const setupCapacitorPush = useCallback(async (pushNotifications) => {
    try {
      // Permission anfragen
      const result = await pushNotifications.requestPermissions();
      
      if (result.receive === 'granted') {
        setPermission('granted');
        setIsSupported(true);
        
        // Registrieren
        await pushNotifications.register();

        // Token Listener
        pushNotifications.addListener('registration', (token) => {
          console.log('Android Push Token:', token.value);
          setToken(token.value);
          if (onTokenReceivedRef.current) {
            onTokenReceivedRef.current(token.value, 'android');
          }
        });

        // Registration Error
        pushNotifications.addListener('registrationError', (error) => {
          console.error('Android Push Registration Error:', error);
        });

        // Foreground Notification (App ist offen)
        pushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Android Push empfangen (foreground):', notification);
          if (onNotificationReceivedRef.current) {
            onNotificationReceivedRef.current(notification, 'android');
          }
        });

        // Notification Click (App wird geöffnet)
        pushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('Android Push geklickt:', notification);
          if (onNotificationReceivedRef.current) {
            onNotificationReceivedRef.current(notification.notification, 'android-click');
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
  }, []);

  // Web Push Setup
  const setupWebPush = useCallback(async () => {
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
        if (onTokenReceivedRef.current) {
          onTokenReceivedRef.current(fcmToken, 'web');
        }
      } else {
        setPermission(Notification.permission);
      }

      // Foreground Messages für Web
      const unsubscribe = onForegroundMessage((payload) => {
        console.log('Web Push empfangen (foreground):', payload);
        
        if (onNotificationReceivedRef.current) {
          onNotificationReceivedRef.current({
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
  }, []);

  const initializePushNotifications = useCallback(async () => {
    // Prüfe ob wir in Capacitor (Android) oder Browser sind
    const isCapacitor = !!window.Capacitor;
    const pushNotifications = isCapacitor ? await loadPushNotifications() : null;

    if (isCapacitor && pushNotifications) {
      // === ANDROID (CAPACITOR) ===
      await setupCapacitorPush(pushNotifications);
    } else if ('Notification' in window && 'serviceWorker' in navigator) {
      // === WEB (BROWSER) ===
      await setupWebPush();
    } else {
      console.log('Push Notifications werden nicht unterstützt');
      setIsSupported(false);
    }
  }, [loadPushNotifications, setupCapacitorPush, setupWebPush]);

  useEffect(() => {
    initializePushNotifications();
  }, [initializePushNotifications]);

  // Manuelle Permission Anfrage (für UI Button)
  const requestPermission = useCallback(async () => {
    const isCapacitor = !!window.Capacitor;
    
    if (isCapacitor) {
      const pushNotifications = await loadPushNotifications();
      if (pushNotifications) {
        return setupCapacitorPush(pushNotifications);
      }
      setIsSupported(false);
      return null;
    }
    return setupWebPush();
  }, [loadPushNotifications, setupCapacitorPush, setupWebPush]);

  return {
    token,
    permission,
    isSupported,
    requestPermission,
  };
}

export default usePushNotifications;
