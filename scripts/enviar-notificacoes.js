const admin = require("firebase-admin");

// Inicializa o SDK do Firebase Admin usando a chave salva no GitHub
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const messaging = admin.messaging();

async function processarNotificacoes() {
  console.log("🔍 Verificando notificações pendentes para o disparo...");

  // Pega a data de hoje no fuso horário do Brasil (YYYY-MM-DD)
  const hoje = new Date().toLocaleDateString("sv-SE", {
    timeZone: "America/Sao_Paulo",
  });

  try {
    // Busca lembretes com data igual ou anterior a hoje e que ainda não foram exibidos
    const snapshot = await db
      .collection("notificacoes")
      .where("dataAgendada", "<=", hoje)
      .where("exibido", "==", false)
      .get();

    if (snapshot.empty) {
      console.log("✅ Nenhum lembrete pendente para hoje.");
      return;
    }

    console.log(`📋 Encontrados ${snapshot.size} lembrete(s) para enviar.`);

    for (const doc of snapshot.docs) {
      const notif = doc.data();

      // Se a notificação tiver um token FCM gravado, envia a Push Notification
      if (notif.tokenFcm) {
        const message = {
          notification: {
            title: "🐰 AnimalControl - Lembrete",
            body: notif.mensagem,
          },
          token: notif.tokenFcm,
        };

        try {
          await messaging.send(message);
          console.log(`🚀 Push enviado com sucesso para: "${notif.mensagem}"`);
        } catch (err) {
          console.error(
            `❌ Erro ao enviar Push do token (${notif.tokenFcm}):`,
            err.message,
          );
        }
      }

      // Marca o lembrete como exibido no banco para não repetir nos próximos disparos
      await doc.ref.update({ exibido: true });
    }

    console.log("✨ Processamento concluído com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao processar notificações no Firestore:", error);
    process.exit(1);
  }
}

processarNotificacoes();
