importScripts("https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCvNwbM1B-ySP6gNWz1A9ESk5IvNQy0wgY",
  authDomain: "pung-pong.firebaseapp.com",
  projectId: "pung-pong",
  storageBucket: "pung-pong.firebasestorage.app",
  messagingSenderId: "742806617606",
  appId: "1:742806617606:web:f1643d069b9e1b4c118d87",
});

const messaging = firebase.messaging();
messaging.onBackgroundMessage(p => {
  const { title, body } = p.notification || {};
  self.registration.showNotification(title || "Pung Pong", {
    body: body || "", icon: "/pung-pong/icons/icon-192.png",
    badge: "/pung-pong/icons/icon-192.png", tag: p.data?.type || "default", data: p.data,
  });
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const chatId = e.notification.data?.chatId;
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      for (const c of list) { if ("focus" in c) { if (chatId) c.postMessage({ type: "NAV", chatId }); return c.focus(); } }
      return clients.openWindow(chatId ? `/pung-pong/#/chat/${chatId}` : "/pung-pong/");
    })
  );
});
