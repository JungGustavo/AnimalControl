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

// --- NAVEGAÇÃO INTELIGENTE DE ABAS ---
const abas = ["coelhos", "cobertura", "partos", "financeiro"];
abas.forEach((aba) => {
  document.getElementById(`tab-${aba}`).addEventListener("click", () => {
    abas.forEach((a) => {
      document
        .getElementById(`tab-${a}`)
        .classList.toggle("aba-ativa", a === aba);
      document
        .getElementById(`sec-${a}`)
        .classList.toggle("escondido", a !== aba);
    });
  });
});

// --- EXIBIR / ESCONDER FORMULÁRIOS ---
const formCoelho = document.getElementById("form-coelho");
document
  .getElementById("btn-mostrar-form-coelho")
  .addEventListener("click", () => formCoelho.classList.remove("escondido"));
document
  .getElementById("btn-cancelar-coelho")
  .addEventListener("click", () => formCoelho.classList.add("escondido"));

const formCobertura = document.getElementById("form-cobertura");
document
  .getElementById("btn-mostrar-form-cobertura")
  .addEventListener("click", () => formCobertura.classList.remove("escondido"));
document
  .getElementById("btn-cancelar-cobertura")
  .addEventListener("click", () => formCobertura.classList.add("escondido"));

// --- VARIÁVEIS GLOBAIS ---
let todosCoelhos = [];
let fotoComprimidaBase64 = "";

// ==========================================
// MÓDULO 1: COELHOS (Mantido idêntico)
// ==========================================
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
    formCoelho.classList.add("escondido");
  } catch (e) {
    alert("Erro ao cadastrar!");
  } finally {
    btn.innerText = "Salvar Coelho";
    btn.disabled = false;
  }
});

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
    atualizarSelectsCobertura(); // Atualiza Machos e Fêmeas
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
    listaCoelhos.innerHTML = "<p>Nenhum coelho.</p>";
    return;
  }
  filtrados.forEach((c) => {
    let dataNasc = c.nascimento
      ? c.nascimento.split("-").reverse().join("/")
      : "-";
    const div = document.createElement("div");
    div.classList.add("cartao-coelho");
    div.innerHTML = `
            <img src="${c.foto || ""}" class="foto-lista" onerror="this.style.display='none'">
            <div class="info-coelho">
                <strong>#${c.numero || "S/N"} - ${c.nome || "S/N"}</strong>
                <span><strong>Raça:</strong> ${c.raca || "-"}</span>
                <span><strong>Sexo:</strong> ${c.sexo || "-"}</span>
                <span><strong>Nascimento:</strong> ${dataNasc}</span>
                ${c.observacoes ? `<p class="obs">Obs: ${c.observacoes}</p>` : ""}
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
// MÓDULO 2: COBERTURA E AUTOMAÇÃO DE PARTOS
// ==========================================

function atualizarSelectsCobertura() {
  const selFemea = document.getElementById("cobertura-femea");
  const selMacho = document.getElementById("cobertura-macho");
  selFemea.innerHTML = '<option value="">Selecione a fêmea...</option>';
  selMacho.innerHTML = '<option value="">Selecione o macho...</option>';

  todosCoelhos.forEach((c) => {
    const option = document.createElement("option");
    option.value = `${c.nome} | #${c.numero || "S/N"}`;
    option.innerText = `${c.nome} | #${c.numero || "S/N"}`;

    if (c.sexo === "Fêmea") selFemea.appendChild(option);
    if (c.sexo === "Macho") selMacho.appendChild(option);
  });
}

formCobertura.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("btn-cadastrar-cobertura");
  btn.innerText = "Salvando...";
  btn.disabled = true;

  const femea = document.getElementById("cobertura-femea").value;
  const macho = document.getElementById("cobertura-macho").value;
  const dataCruz = document.getElementById("data-cobertura").value;

  try {
    // 1. Salva o histórico de Cobertura
    const coberturaRef = await addDoc(collection(db, "coberturas"), {
      femea: femea,
      macho: macho,
      dataCobertura: dataCruz,
      dataCadastro: new Date(),
    });

    // 2. AUTOMAÇÃO: Gera o Parto somando 30 dias
    const dataPrevista = new Date(dataCruz);
    dataPrevista.setDate(dataPrevista.getDate() + 30);
    const stringDataPrevista = dataPrevista.toISOString().split("T")[0]; // Formato YYYY-MM-DD

    await addDoc(collection(db, "partos"), {
      // Mudamos a collection para 'partos' para ficar mais claro
      coberturaId: coberturaRef.id,
      femea: femea,
      macho: macho,
      dataCruzamento: dataCruz,
      dataPrevistaParto: stringDataPrevista,
      status: "Aguardando Nascimento", // Status que usaremos depois na sua atualização
      dataCadastro: new Date(),
    });

    formCobertura.reset();
    formCobertura.classList.add("escondido");
    alert("Cobertura salva e Parto agendado automaticamente!"); // Alerta para confirmar a automação
  } catch (e) {
    alert("Erro ao agendar cobertura!");
  } finally {
    btn.innerText = "Salvar Cobertura";
    btn.disabled = false;
  }
});

// Leitura de Coberturas
const listaCoberturas = document.getElementById("lista-coberturas");
function lerCoberturas() {
  const q = query(
    collection(db, "coberturas"),
    orderBy("dataCobertura", "desc"),
  );
  onSnapshot(q, (snapshot) => {
    listaCoberturas.innerHTML = "";
    if (snapshot.empty) {
      listaCoberturas.innerHTML = "<p>Nenhuma cobertura registrada.</p>";
      return;
    }

    snapshot.forEach((doc) => {
      const cob = doc.data();
      const dataCob = cob.dataCobertura.split("-").reverse().join("/");
      const div = document.createElement("div");
      div.classList.add("cartao-cobertura");
      div.innerHTML = `
                <strong>❤️ Acasalamento: ${dataCob}</strong>
                <span style="margin-top:8px;"><strong>Mãe:</strong> ${cob.femea}</span>
                <span><strong>Pai:</strong> ${cob.macho}</span>
            `;
      listaCoberturas.appendChild(div);
    });
  });
}

// Leitura de Partos
const listaPartos = document.getElementById("lista-partos");
function lerPartos() {
  // Agora lendo da collection "partos" (os antigos não aparecerão aqui, os novos sim)
  const q = query(
    collection(db, "partos"),
    orderBy("dataPrevistaParto", "asc"),
  );
  onSnapshot(q, (snapshot) => {
    listaPartos.innerHTML = "";
    if (snapshot.empty) {
      listaPartos.innerHTML = "<p>Nenhum parto programado.</p>";
      return;
    }

    snapshot.forEach((doc) => {
      const p = doc.data();
      const dataPrevStr = p.dataPrevistaParto.split("-").reverse().join("/");

      const div = document.createElement("div");
      div.classList.add("cartao-parto");
      div.innerHTML = `
                <h3>Nascimento: ${dataPrevStr}</h3>
                <span><strong>Mãe:</strong> ${p.femea}</span>
                <span><strong>Pai:</strong> ${p.macho}</span>
                <span class="tag-notificacao">${p.status}</span>
            `;
      listaPartos.appendChild(div);
    });
  });
}

// Inicia as leituras
lerCoelhos();
lerCoberturas();
lerPartos();
