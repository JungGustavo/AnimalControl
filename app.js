// Importando as funções do SDK do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBAiMP11gBfJuWKdo7qyIwHSk7L6Bb0BZ4",
  authDomain: "animalcontrol-3e82d.firebaseapp.com",
  projectId: "animalcontrol-3e82d",
  storageBucket: "animalcontrol-3e82d.firebasestorage.app",
  messagingSenderId: "314778179089",
  appId: "1:314778179089:web:fe34e43f218b90ecea03b0",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- NAVEGAÇÃO ENTRE ABAS ---
const tabCoelhos = document.getElementById("tab-coelhos");
const tabReproducao = document.getElementById("tab-reproducao");
const secCoelhos = document.getElementById("sec-coelhos");
const secReproducao = document.getElementById("sec-reproducao");

tabCoelhos.addEventListener("click", () => {
  tabCoelhos.classList.add("aba-ativa");
  tabReproducao.classList.remove("aba-ativa");
  secCoelhos.classList.remove("escondido");
  secReproducao.classList.add("escondido");
});

tabReproducao.addEventListener("click", () => {
  tabReproducao.classList.add("aba-ativa");
  tabCoelhos.classList.remove("aba-ativa");
  secReproducao.classList.remove("escondido");
  secCoelhos.classList.add("escondido");
});

// --- EXIBIR / ESCONDER FORMULÁRIOS ---
const formCoelho = document.getElementById("form-coelho");
document
  .getElementById("btn-mostrar-form-coelho")
  .addEventListener("click", () => formCoelho.classList.remove("escondido"));
document
  .getElementById("btn-cancelar-coelho")
  .addEventListener("click", () => formCoelho.classList.add("escondido"));

const formReproducao = document.getElementById("form-reproducao");
document
  .getElementById("btn-mostrar-form-parto")
  .addEventListener("click", () =>
    formReproducao.classList.remove("escondido"),
  );
document
  .getElementById("btn-cancelar-parto")
  .addEventListener("click", () => formReproducao.classList.add("escondido"));

// --- VARIÁVEIS GLOBAIS ---
let todosCoelhos = [];
let fotoComprimidaBase64 = "";

// ==========================================
// MÓDULO 1: COELHOS
// ==========================================

// Compressão de Foto
const fotoInput = document.getElementById("foto");
const previewFoto = document.getElementById("preview-foto");

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
      let width = img.width,
        height = img.height;
      if (width > height) {
        if (width > 800) {
          height *= 800 / width;
          width = 800;
        }
      } else {
        if (height > 800) {
          width *= 800 / height;
          height = 800;
        }
      }

      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);

      fotoComprimidaBase64 = canvas.toDataURL("image/jpeg", 0.7);
      document.getElementById("foto-texto").style.display = "none";
      previewFoto.src = fotoComprimidaBase64;
      previewFoto.style.display = "block";
    };
  };
});

// Cadastro de Coelho
formCoelho.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!fotoComprimidaBase64) {
    alert("Aguarde a foto carregar.");
    return;
  }

  const btn = document.getElementById("btn-cadastrar-coelho");
  btn.innerText = "Salvando...";
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

    formCoelho.reset();
    previewFoto.style.display = "none";
    document.getElementById("foto-texto").style.display = "block";
    fotoComprimidaBase64 = "";
    formCoelho.classList.add("escondido"); // Esconde ao salvar
  } catch (e) {
    alert("Erro ao cadastrar!");
  } finally {
    btn.innerText = "Salvar Coelho";
    btn.disabled = false;
  }
});

// Leitura e Filtros de Coelhos
const filtroNome = document.getElementById("filtro-nome");
const filtroRaca = document.getElementById("filtro-raca");
const filtroNasc = document.getElementById("filtro-nascimento");
const filtroSexo = document.getElementById("filtro-sexo");
const listaCoelhos = document.getElementById("lista-coelhos");

function lerCoelhos() {
  const q = query(collection(db, "coelhos"), orderBy("dataCadastro", "desc"));
  onSnapshot(q, (snapshot) => {
    todosCoelhos = [];
    snapshot.forEach((doc) => {
      todosCoelhos.push({ id: doc.id, ...doc.data() });
    });

    atualizarSelectFemeas(); // Atualiza a lista de mães na aba de reprodução
    aplicarFiltros();
  });
}

function aplicarFiltros() {
  const tNome = filtroNome.value.toLowerCase(),
    tRaca = filtroRaca.value.toLowerCase();
  const tNasc = filtroNasc.value,
    tSexo = filtroSexo.value;

  const filtrados = todosCoelhos.filter((c) => {
    const bateNome = (c.nome || "").toLowerCase().includes(tNome);
    const bateRaca = (c.raca || "").toLowerCase().includes(tRaca);
    const bateNasc = tNasc === "" ? true : c.nascimento === tNasc;
    const bateSexo = tSexo === "" ? true : c.sexo === tSexo;
    return bateNome && bateRaca && bateNasc && bateSexo;
  });

  listaCoelhos.innerHTML = "";
  if (filtrados.length === 0) {
    listaCoelhos.innerHTML = "<p>Nenhum coelho encontrado.</p>";
    return;
  }

  filtrados.forEach((c) => {
    let dataNasc = c.nascimento
      ? c.nascimento.split("-").reverse().join("/")
      : "Não informada";
    const div = document.createElement("div");
    div.classList.add("cartao-coelho");
    div.innerHTML = `
            <img src="${c.foto || ""}" class="foto-lista" onerror="this.style.display='none'">
            <div class="info-coelho">
                <strong>#${c.numero || "S/N"} - ${c.nome || "Sem nome"}</strong>
                <span><strong>Raça:</strong> ${c.raca || "-"}</span>
                <span><strong>Sexo:</strong> ${c.sexo || "-"}</span>
                <span><strong>Nascimento:</strong> ${dataNasc}</span>
                ${c.observacoes ? `<p class="obs"><strong>Obs:</strong> ${c.observacoes}</p>` : ""}
            </div>
        `;
    listaCoelhos.appendChild(div);
  });
}

[filtroNome, filtroRaca, filtroNasc, filtroSexo].forEach((f) =>
  f.addEventListener("input", aplicarFiltros),
);
document.getElementById("btn-limpar-filtros").addEventListener("click", () => {
  filtroNome.value = "";
  filtroRaca.value = "";
  filtroNasc.value = "";
  filtroSexo.value = "";
  aplicarFiltros();
});

// ==========================================
// MÓDULO 2: REPRODUÇÃO
// ==========================================

// Preenche o Select com as Fêmeas cadastradas
function atualizarSelectFemeas() {
  const select = document.getElementById("parto-femea");
  select.innerHTML = '<option value="">Selecione a fêmea...</option>';

  const femeas = todosCoelhos.filter((c) => c.sexo === "Fêmea");
  femeas.forEach((f) => {
    const option = document.createElement("option");
    // O valor salvo no banco será o Nome e o Número da fêmea para facilitar a leitura depois
    option.value = `${f.nome} | #${f.numero}`;
    option.innerText = `${f.nome} | #${f.numero}`;
    select.appendChild(option);
  });
}

// Cadastro de Reprodução/Parto
formReproducao.addEventListener("submit", async (e) => {
  e.preventDefault();

  const btn = document.getElementById("btn-cadastrar-parto");
  btn.innerText = "Salvando...";
  btn.disabled = true;

  // Pega a data de cruzamento
  const dataCruzamento = document.getElementById("data-reproducao").value;

  // Calcula a data prevista do parto (Data do cruzamento + 30 dias)
  const dataPrevista = new Date(dataCruzamento);
  dataPrevista.setDate(dataPrevista.getDate() + 30);
  // Formata de volta para YYYY-MM-DD para salvar no banco
  const stringDataPrevista = dataPrevista.toISOString().split("T")[0];

  try {
    await addDoc(collection(db, "reproducoes"), {
      femea: document.getElementById("parto-femea").value,
      dataCruzamento: dataCruzamento,
      dataPrevistaParto: stringDataPrevista,
      notificar: document.getElementById("notificar-parto").checked,
      dataCadastro: new Date(),
    });

    formReproducao.reset();
    formReproducao.classList.add("escondido");
  } catch (e) {
    alert("Erro ao agendar parto!");
  } finally {
    btn.innerText = "Salvar Parto";
    btn.disabled = false;
  }
});

// Leitura da lista de Partos
const listaPartos = document.getElementById("lista-partos");

function lerPartos() {
  const q = query(
    collection(db, "reproducoes"),
    orderBy("dataCruzamento", "desc"),
  );
  onSnapshot(q, (snapshot) => {
    listaPartos.innerHTML = "";
    if (snapshot.empty) {
      listaPartos.innerHTML = "<p>Nenhum parto programado.</p>";
      return;
    }

    snapshot.forEach((doc) => {
      const p = doc.data();

      // Formatar datas para padrão brasileiro (DD/MM/YYYY)
      const cruzamentoStr = p.dataCruzamento.split("-").reverse().join("/");
      const previstaStr = p.dataPrevistaParto.split("-").reverse().join("/");

      const div = document.createElement("div");
      div.classList.add("cartao-parto");
      div.innerHTML = `
                <h3>Mãe: ${p.femea}</h3>
                <span><strong>Cruzamento:</strong> ${cruzamentoStr}</span>
                <span><strong>Data Prevista p/ Parto:</strong> ${previstaStr}</span>
                ${p.notificar ? `<span class="tag-notificacao">🔔 Alerta ativado para 30 dias</span>` : ""}
            `;
      listaPartos.appendChild(div);
    });
  });
}

// Inicia as leituras
lerCoelhos();
lerPartos();
