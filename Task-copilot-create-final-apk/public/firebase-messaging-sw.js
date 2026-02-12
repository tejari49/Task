// Firebase Messaging Service Worker für Background Push Notifications
// Diese Datei muss im Root der Web-App liegen (public/)

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase Konfiguration - MUSS mit deiner .env.local übereinstimmen
// WICHTIG: Ersetze die Platzhalter (VITE_FIREBASE_*) mit den Werten aus deiner .env.local, da .env hier nicht verfügbar ist
firebase.initializeApp({
  apiKey: "VITE_FIREBASE_API_KEY",
  authDomain: "VITE_FIREBASE_AUTH_DOMAIN",
  projectId: "VITE_FIREBASE_PROJECT_ID",
  storageBucket: "VITE_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "VITE_FIREBASE_MESSAGING_SENDER_ID",
  appId: "VITE_FIREBASE_APP_ID"
});

const messaging = firebase.messaging();

// Background Message Handler
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background Message empfangen:', payload);
  
  const notificationTitle = payload.notification?.title || 'TaskRai';
  const notificationOptions = {
    body: payload.notification?.body || 'Neue Benachrichtigung',
    icon: '/vite.svg',
    badge: '/vite.svg',
    tag: payload.data?.taskId || 'task-notification',
    data: payload.data,
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Öffnen'
      },
      {
        action: 'close',
        title: 'Schließen'
      }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // App öffnen oder fokussieren
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Wenn App bereits offen ist, fokussieren
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Sonst neue Tab öffnen
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
