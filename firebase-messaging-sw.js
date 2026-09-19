importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js",
);

const firebaseConfig = {
  apiKey: "AIzaSyBAiMP11gBfJuWKdo7qyIwHSk7L6Bb0BZ4",
  authDomain: "animalcontrol-3e82d.firebaseapp.com",
  projectId: "animalcontrol-3e82d",
  storageBucket: "animalcontrol-3e82d.firebasestorage.app",
  messagingSenderId: "314778179089",
  appId: "1:314778179089:web:fe34e43f218b90ecea03b0",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Instalação e ativação imediata do Service Worker
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);

// Escuta ÚNICA de segundo plano via Firebase SDK
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Notificação recebida:", payload);

  const notificationTitle =
    payload.notification?.title || payload.data?.title || "🐰 AnimalControl";
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || "Novo lembrete!",
    icon: "https://cdn-icons-png.flaticon.com/512/3069/3069172.png",
    badge: "https://cdn-icons-png.flaticon.com/512/3069/3069172.png",
    vibrate: [200, 100, 200],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
