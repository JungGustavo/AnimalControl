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

// Força o Service Worker a assumir o controle imediatamente
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);

// Captura o Push nativo do Android/iOS mesmo com o navegador suspenso
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title =
      payload.notification?.title || payload.data?.title || "🐰 AnimalControl";
    const options = {
      body:
        payload.notification?.body || payload.data?.body || "Novo lembrete!",
      icon: "https://cdn-icons-png.flaticon.com/512/3069/3069172.png",
      badge: "https://cdn-icons-png.flaticon.com/512/3069/3069172.png",
      vibrate: [200, 100, 200],
      data: payload.data || {},
    };

    // O waitUntil obriga o celular a exibir a notificação antes de fechar o processo
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error("Erro ao processar evento de push:", err);
  }
});
