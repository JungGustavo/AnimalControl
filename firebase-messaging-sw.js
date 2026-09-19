// Importa as bibliotecas do Firebase dentro do Service Worker
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

// 1. FORÇA A ATIVAÇÃO IMEDIATA DO SERVICE WORKER (Fica no escopo raiz do arquivo)
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);

// 2. ESCUTA NOTIFICAÇÕES EM SEGUNDO PLANO (Com a aba ou app fechado)
messaging.onBackgroundMessage((payload) => {
  console.log("[sw.js] Notificação recebida em segundo plano:", payload);

  const notificationTitle = payload.notification?.title || "🐰 AnimalControl";
  const notificationOptions = {
    body:
      payload.notification?.body || payload.data?.mensagem || "Novo lembrete!",
    icon: "https://cdn-icons-png.flaticon.com/512/3069/3069172.png",
    badge: "https://cdn-icons-png.flaticon.com/512/3069/3069172.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
