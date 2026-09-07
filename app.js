// Importando as funções do SDK do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  onSnapshot,
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

// Função para salvar um coelho no banco de dados
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const btn = document.getElementById("btn-cadastrar");
  btn.innerText = "Cadastrando...";
  btn.disabled = true;

  const nome = document.getElementById("nome").value;
  const raca = document.getElementById("raca").value;
  const idade = document.getElementById("idade").value;

  try {
    await addDoc(collection(db, "coelhos"), {
      nome: nome,
      raca: raca,
      idade: idade,
      dataCadastro: new Date(),
    });
    form.reset();
  } catch (e) {
    console.error("Erro ao adicionar coelho: ", e);
    alert("Erro ao cadastrar!");
  } finally {
    btn.innerText = "Cadastrar Coelho";
    btn.disabled = false;
  }
});

// Função para escutar as mudanças no banco e atualizar a tela em TEMPO REAL
function lerCoelhos() {
  onSnapshot(collection(db, "coelhos"), (snapshot) => {
    listaCoelhos.innerHTML = ""; // Limpa a lista antes de atualizar

    if (snapshot.empty) {
      listaCoelhos.innerHTML = "<p>Nenhum coelho cadastrado ainda.</p>";
      return;
    }

    snapshot.forEach((doc) => {
      const coelho = doc.data();
      const div = document.createElement("div");
      div.classList.add("cartao-coelho");
      div.innerHTML = `
                <strong>🐰 ${coelho.nome}</strong>
                <span>Raça: ${coelho.raca}</span>
                <span>Idade: ${coelho.idade} meses</span>
            `;
      listaCoelhos.appendChild(div);
    });
  });
}

// Inicia a leitura dos dados assim que a página carrega
lerCoelhos();
