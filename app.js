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
let todosCoelhos = [];
let fotoComprimidaBase64 = "";

// Elementos dos filtros
const filtroNome = document.getElementById("filtro-nome");
const filtroRaca = document.getElementById("filtro-raca");
const filtroSexo = document.getElementById("filtro-sexo");
const filtroNascimento = document.getElementById("filtro-nascimento");
const btnLimparFiltros = document.getElementById("btn-limpar-filtros");

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
      document.getElementById("foto-texto").style.display = "none";
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
      sexo: document.getElementById("sexo").value,
      nascimento: document.getElementById("nascimento").value,
      observacoes: document.getElementById("observacoes").value,
      foto: fotoComprimidaBase64,
      dataCadastro: new Date(),
    });

    form.reset();
    previewFoto.style.display = "none";
    previewFoto.src = "";
    document.getElementById("foto-texto").style.display = "block";
    fotoComprimidaBase64 = "";
  } catch (e) {
    console.error("Erro: ", e);
    alert("Erro ao cadastrar!");
  } finally {
    btn.innerText = "Cadastrar Coelho";
    btn.disabled = false;
  }
});
function lerCoelhos() {
  const q = query(collection(db, "coelhos"), orderBy("dataCadastro", "desc"));

  onSnapshot(q, (snapshot) => {
    todosCoelhos = []; // Zera a lista antes de atualizar

    snapshot.forEach((doc) => {
      // Guarda os dados e o ID do documento
      todosCoelhos.push({ id: doc.id, ...doc.data() });
    });

    // Após pegar do banco, chama a função que aplica os filtros
    aplicarFiltros();
  });
}

// Função que filtra e joga na tela
function aplicarFiltros() {
  const termoNome = filtroNome.value.toLowerCase();
  const termoRaca = filtroRaca.value.toLowerCase();
  const termoNasc = filtroNascimento.value;
  const termoSexo = filtroSexo.value;

  const coelhosFiltrados = todosCoelhos.filter((coelho) => {
    // As proteções (|| "") garantem que, se o dado for antigo/nulo, vira um texto vazio e não quebra o JS
    const nomeBanco = (coelho.nome || "").toLowerCase();
    const racaBanco = (coelho.raca || "").toLowerCase();
    const nascBanco = coelho.nascimento || "";
    const sexoBanco = coelho.sexo || "";

    const bateNome = nomeBanco.includes(termoNome);
    const bateRaca = racaBanco.includes(termoRaca);
    const bateNasc = termoNasc === "" ? true : nascBanco === termoNasc;
    const bateSexo = termoSexo === "" ? true : sexoBanco === termoSexo;

    return bateNome && bateRaca && bateNasc && bateSexo;
  });

  renderizarNaTela(coelhosFiltrados);
}

// Função que desenha o HTML na tela
function renderizarNaTela(lista) {
  listaCoelhos.innerHTML = "";

  if (lista.length === 0) {
    listaCoelhos.innerHTML =
      '<p style="text-align:center; color:#7f8c8d;">Nenhum coelho encontrado.</p>';
    return;
  }

  lista.forEach((coelho) => {
    // Proteção para data de nascimento
    let dataNasc = "Não informada";
    if (coelho.nascimento) {
      dataNasc = coelho.nascimento.split("-").reverse().join("/");
    }

    const div = document.createElement("div");
    div.classList.add("cartao-coelho");

    // Novo formato: Foto do lado esquerdo, e uma div "info-coelho" do lado direito
    div.innerHTML = `
            <img src="${coelho.foto || ""}" class="foto-lista" alt="Foto de ${coelho.nome || "Coelho"}" onerror="this.style.display='none'">
            
            <div class="info-coelho">
                <strong>#${coelho.numero || "S/N"} - ${coelho.nome || "Sem nome"}</strong>
                <span><strong>Raça:</strong> ${coelho.raca || "Não informada"}</span>
                <span><strong>Sexo:</strong> ${coelho.sexo || "Não informado"}</span>
                <span><strong>Nascimento:</strong> ${dataNasc}</span>
                ${coelho.observacoes ? `<p class="obs"><strong>Obs:</strong> ${coelho.observacoes}</p>` : ""}
            </div>
        `;
    listaCoelhos.appendChild(div);
  });
}

// Eventos (Listeners) para quando o usuário digitar ou mudar a data nos filtros
filtroNome.addEventListener("input", aplicarFiltros);
filtroRaca.addEventListener("input", aplicarFiltros);
filtroNascimento.addEventListener("change", aplicarFiltros);
filtroSexo.addEventListener("change", aplicarFiltros);
// Botão de limpar filtros
btnLimparFiltros.addEventListener("click", () => {
  filtroNome.value = "";
  filtroRaca.value = "";
  filtroNascimento.value = "";
  filtroSexo.value = "";
  aplicarFiltros(); // Atualiza a tela mostrando todos novamente
});

// Inicia o sistema
lerCoelhos();
