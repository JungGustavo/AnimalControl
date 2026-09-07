// Importando as funções do SDK do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBAiMP11gBfJuWKdo7qyIwHSk7L6Bb0BZ4",
  authDomain: "animalcontrol-3e82d.firebaseapp.com",
  projectId: "animalcontrol-3e82d",
  storageBucket: "animalcontrol-3e82d.firebasestorage.app",
  messagingSenderId: "314778179089",
  appId: "1:314778179089:web:fe34e43f218b90ecea03b0",
};

// Inicializando Firebase e Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Selecionando elementos da tela
const form = document.getElementById("form-coelho");
const listaCoelhos = document.getElementById("lista-coelhos");
const fotoInput = document.getElementById("foto");
const previewFoto = document.getElementById("preview-foto");

let fotoComprimidaBase64 = "";

fotoInput.addEventListener("change", function (event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = function (e) {
    const img = new Image();
    img.src = e.target.result;
    img.onload = function () {
      const canvas = document.createElement("canvas");
      const MAX_WIDTH = 800; // Limite de largura
      const MAX_HEIGHT = 800; // Limite de altura
      let width = img.width;
      let height = img.height;

      // Calcula a nova proporção
      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      // Comprime para JPEG com 70% de qualidade (0.7)
      fotoComprimidaBase64 = canvas.toDataURL("image/jpeg", 0.7);

      // Mostra a prévia no formulário
      previewFoto.src = fotoComprimidaBase64;
      previewFoto.style.display = "block";
    };
  };
});
// Função para salvar um coelho no banco de dados
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!fotoComprimidaBase64) {
    alert("Aguarde a foto carregar ou selecione uma imagem válida.");
    return;
  }

  const btn = document.getElementById("btn-cadastrar");
  btn.innerText = "Cadastrando...";
  btn.disabled = true;

  try {
    await addDoc(collection(db, "coelhos"), {
      numero: document.getElementById("numero").value,
      nome: document.getElementById("nome").value,
      raca: document.getElementById("raca").value,
      nascimento: document.getElementById("nascimento").value,
      observacoes: document.getElementById("observacoes").value,
      foto: fotoComprimidaBase64,
      dataCadastro: new Date(),
    });

    form.reset();
    previewFoto.style.display = "none";
    fotoComprimidaBase64 = ""; // Limpa a variável
  } catch (e) {
    console.error("Erro: ", e);
    alert("Erro ao cadastrar!");
  } finally {
    btn.innerText = "Cadastrar Coelho";
    btn.disabled = false;
  }
});
// Função para escutar as mudanças no banco e atualizar a tela em TEMPO REAL
function lerCoelhos() {
  // Ordena pelos cadastros mais recentes
  const q = query(collection(db, "coelhos"), orderBy("dataCadastro", "desc"));

  onSnapshot(q, (snapshot) => {
    listaCoelhos.innerHTML = "";

    if (snapshot.empty) {
      listaCoelhos.innerHTML = "<p>Nenhum coelho cadastrado ainda.</p>";
      return;
    }

    snapshot.forEach((doc) => {
      const coelho = doc.data();

      // Formata a data de YYYY-MM-DD para DD/MM/YYYY
      const dataNasc = coelho.nascimento.split("-").reverse().join("/");

      const div = document.createElement("div");
      div.classList.add("cartao-coelho");
      div.innerHTML = `
                <img src="${coelho.foto}" class="foto-lista" alt="Foto de ${coelho.nome}">
                <strong>#${coelho.numero} - ${coelho.nome}</strong>
                <span><strong>Raça:</strong> ${coelho.raca}</span>
                <span><strong>Nascimento:</strong> ${dataNasc}</span>
                ${coelho.observacoes ? `<p class="obs"><strong>Obs:</strong> ${coelho.observacoes}</p>` : ""}
            `;
      listaCoelhos.appendChild(div);
    });
  });
}

lerCoelhos();
