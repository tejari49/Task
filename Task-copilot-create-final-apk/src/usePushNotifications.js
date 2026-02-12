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
  const onNotificationReceivedRef = useRef(null);
  const onTokenReceivedRef = useRef(null);
  const initializationPromiseRef = useRef(null);
  const pushNotificationsRef = useRef(null);
  const foregroundUnsubscribeRef = useRef(null);
  const capacitorListenersRef = useRef([]);

  useEffect(() => {
    onNotificationReceivedRef.current = onNotificationReceived;
  }, [onNotificationReceived]);

  useEffect(() => {
    onTokenReceivedRef.current = onTokenReceived;
  }, [onTokenReceived]);

  const loadPushNotifications = useCallback(async () => {
    if (pushNotificationsRef.current) {
      return pushNotificationsRef.current;
    }
    try {
      const module = await import('@capacitor/push-notifications');
      pushNotificationsRef.current = module.PushNotifications;
      return pushNotificationsRef.current;
    } catch (error) {
      console.error('Failed to load Capacitor push notifications module. Ensure @capacitor/push-notifications is installed:', error);
      return null;
    }
  }, []);

  // Android Push Setup
  const clearForegroundSubscription = useCallback(() => {
    if (foregroundUnsubscribeRef.current) {
      foregroundUnsubscribeRef.current();
      foregroundUnsubscribeRef.current = null;
    }
  }, []);

  const clearCapacitorListeners = useCallback(() => {
    capacitorListenersRef.current.forEach((listener) => {
      if (listener?.remove) {
        listener.remove();
      }
    });
    capacitorListenersRef.current = [];
  }, []);

  const setupCapacitorPush = useCallback(async (pushNotifications) => {
    try {
      clearCapacitorListeners();
      // Permission anfragen
      const result = await pushNotifications.requestPermissions();
      
      if (result.receive === 'granted') {
        setPermission('granted');
        setIsSupported(true);
        
        // Registrieren
        await pushNotifications.register();

        // Token Listener
        const registrationListener = await pushNotifications.addListener('registration', (token) => {
          console.log('Android Push Token:', token.value);
          setToken(token.value);
          if (onTokenReceivedRef.current) {
            onTokenReceivedRef.current(token.value, 'android');
          }
        });

        // Registration Error
        const registrationErrorListener = await pushNotifications.addListener('registrationError', (error) => {
          console.error('Android Push Registration Error:', error);
        });

        // Foreground Notification (App ist offen)
        const foregroundListener = await pushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Android Push empfangen (foreground):', notification);
          if (onNotificationReceivedRef.current) {
            onNotificationReceivedRef.current(notification, 'android');
          }
        });

        // Notification Click (App wird geöffnet)
        const actionListener = await pushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('Android Push geklickt:', notification);
          if (onNotificationReceivedRef.current) {
            onNotificationReceivedRef.current(notification.notification, 'android-click');
          }
        });
        capacitorListenersRef.current = [
          registrationListener,
          registrationErrorListener,
          foregroundListener,
          actionListener
        ];
        return true;
      } else {
        setPermission('denied');
        console.log('Push Permission verweigert');
        return false;
      }
    } catch (error) {
      console.error('Fehler bei Android Push Setup:', error);
      setIsSupported(false);
      return false;
    }
  }, [clearCapacitorListeners]);

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
      clearForegroundSubscription();
      foregroundUnsubscribeRef.current = onForegroundMessage((payload) => {
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

      return Notification.permission === 'granted' && Boolean(fcmToken);
    } catch (error) {
      console.error('Fehler bei Web Push Setup:', error);
      setIsSupported(false);
      return false;
    }
  }, [clearForegroundSubscription]);

  const initializePushNotifications = useCallback(async () => {
    // Prüfe ob wir in Capacitor (Android) oder Browser sind
    const isCapacitor = !!window.Capacitor;
    const pushNotifications = isCapacitor ? await loadPushNotifications() : null;

    if (isCapacitor && pushNotifications) {
      // === ANDROID (CAPACITOR) ===
      const permissionGranted = await setupCapacitorPush(pushNotifications);
      if (!permissionGranted) {
        console.log('Push permission not granted (android).');
      }
    } else if ('Notification' in window && 'serviceWorker' in navigator) {
      // === WEB (BROWSER) ===
      const permissionGranted = await setupWebPush();
      if (!permissionGranted) {
        console.log('Push permission not granted (web).');
      }
    } else {
      console.log('Push Notifications werden nicht unterstützt');
      setIsSupported(false);
    }
  }, [loadPushNotifications, setupCapacitorPush, setupWebPush]);

  useEffect(() => {
    if (initializationPromiseRef.current) {
      return;
    }
    initializationPromiseRef.current = initializePushNotifications().catch((error) => {
      console.error('Push notification initialization failed. Check browser compatibility and Firebase configuration:', error);
      setIsSupported(false);
      initializationPromiseRef.current = null;
    });
  }, [initializePushNotifications]);

  useEffect(() => {
    return () => {
      clearForegroundSubscription();
      clearCapacitorListeners();
    };
  }, [clearForegroundSubscription, clearCapacitorListeners]);

  useEffect(() => {
    return () => {
      initializationPromiseRef.current = null;
    };
  }, []);

  // Manuelle Permission Anfrage (für UI Button)
  const requestPermission = useCallback(async () => {
    const isCapacitor = !!window.Capacitor;
    
    if (isCapacitor) {
      const pushNotifications = await loadPushNotifications();
      if (pushNotifications) {
        return setupCapacitorPush(pushNotifications);
      }
      setIsSupported(false);
      return false;
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
