/* global importScripts, firebase, clients */
// Firebase Messaging Service Worker für Background Push Notifications
// Diese Datei muss im Root der Web-App liegen (public/)

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase Konfiguration - MUSS mit deiner .env.local übereinstimmen
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBrlDiaISY2hajF7LBvFkgdEcUMsRzQneQ",
  authDomain: "task-rai.firebaseapp.com",
  projectId: "task-rai",
  storageBucket: "task-rai.firebasestorage.app",
  messagingSenderId: "99376901660",
  appId: "1:99376901660:web:87dac908af8143968d79d9"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/assets/icon/icon.png' // Passe diesen Pfad zu deinem App-Icon an
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

