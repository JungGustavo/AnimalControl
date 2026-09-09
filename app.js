// Importando as funções do SDK do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
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
// MÓDULO 1: COELHOS
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

// 1. Apenas salva a cobertura (sem gerar o parto ainda)
formCobertura.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("btn-cadastrar-cobertura");
  btn.innerText = "Salvando...";
  btn.disabled = true;

  try {
    await addDoc(collection(db, "coberturas"), {
      femea: document.getElementById("cobertura-femea").value,
      macho: document.getElementById("cobertura-macho").value,
      dataCobertura: document.getElementById("data-cobertura").value,
      partoConfirmado: false, // FLAG que diz se já gerou parto ou não
      dataCadastro: new Date(),
    });
    formCobertura.reset();
    formCobertura.classList.add("escondido");
  } catch (e) {
    alert("Erro ao salvar cobertura!");
  } finally {
    btn.innerText = "Salvar Cobertura";
    btn.disabled = false;
  }
});

// 2. Leitura de Coberturas (Com Botão de Confirmar)
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

    snapshot.forEach((docSnap) => {
      const cob = docSnap.data();
      const idCob = docSnap.id;
      const dataCob = cob.dataCobertura.split("-").reverse().join("/");

      // Verifica se o parto já foi confirmado para mostrar botão ou uma tag verde
      let areaAcao = "";
      if (!cob.partoConfirmado) {
        // Passa os dados para a função do modal
        areaAcao = `<button class="btn-acao btn-pequeno" onclick="prepararConfirmacaoParto('${idCob}', '${cob.femea}', '${cob.macho}', '${cob.dataCobertura}')">Confirmar Parto</button>`;
      } else {
        areaAcao = `<span class="tag-notificacao tag-sucesso" style="margin-top:10px;">✅ Prenhez Confirmada</span>`;
      }

      const div = document.createElement("div");
      div.classList.add("cartao-cobertura");
      div.innerHTML = `
                <strong>❤️ Acasalamento: ${dataCob}</strong>
                <span style="margin-top:8px;"><strong>Mãe:</strong> ${cob.femea}</span>
                <span><strong>Pai:</strong> ${cob.macho}</span>
                <div>${areaAcao}</div>
            `;
      listaCoberturas.appendChild(div);
    });
  });
}

// 3. Lógica do Modal de Dupla Confirmação
let dadosPartoPendente = null; // Guarda os dados temporariamente
const modalConfirmacao = document.getElementById("modal-confirmacao");

window.prepararConfirmacaoParto = function (id, femea, macho, dataCruz) {
  dadosPartoPendente = { id, femea, macho, dataCruz };
  modalConfirmacao.classList.remove("escondido");
};

document.getElementById("btn-cancelar-modal").addEventListener("click", () => {
  modalConfirmacao.classList.add("escondido");
  dadosPartoPendente = null;
});

document
  .getElementById("btn-confirmar-modal")
  .addEventListener("click", async () => {
    if (!dadosPartoPendente) return;

    const btn = document.getElementById("btn-confirmar-modal");
    btn.innerText = "Aguarde...";
    btn.disabled = true;

    try {
      // Calcula a data +30 dias
      const dataPrevista = new Date(dadosPartoPendente.dataCruz);
      dataPrevista.setDate(dataPrevista.getDate() + 30);
      const stringDataPrevista = dataPrevista.toISOString().split("T")[0];

      // Cria o Parto
      await addDoc(collection(db, "partos"), {
        coberturaId: dadosPartoPendente.id,
        femea: dadosPartoPendente.femea,
        macho: dadosPartoPendente.macho,
        dataCruzamento: dadosPartoPendente.dataCruz,
        dataPrevistaParto: stringDataPrevista,
        status: "Aguardando Nascimento",
        dataCadastro: new Date(),
      });

      // Atualiza a cobertura, dizendo que o parto foi confirmado (esconde o botão)
      const cobRef = doc(db, "coberturas", dadosPartoPendente.id);
      await updateDoc(cobRef, { partoConfirmado: true });

      modalConfirmacao.classList.add("escondido");
    } catch (e) {
      alert("Erro ao confirmar parto.");
    } finally {
      btn.innerText = "Confirmar";
      btn.disabled = false;
      dadosPartoPendente = null;
    }
  });

// --- LÓGICA INTELIGENTE DE PARTOS E DESMAME ---
const listaPartos = document.getElementById("lista-partos");
const formRegistroParto = document.getElementById("form-registro-parto");
const formRegistroDesmame = document.getElementById("form-registro-desmame");
const textoAjudaPartos = document.getElementById("texto-ajuda-partos");

function obterDataDeHoje() {
  const data = new Date();
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}

// LER PARTOS
function lerPartos() {
  const q = query(collection(db, "partos"), orderBy("dataCadastro", "desc"));
  onSnapshot(q, (snapshot) => {
    listaPartos.innerHTML = "";
    if (snapshot.empty) {
      listaPartos.innerHTML = "<p>Nenhum registro encontrado.</p>";
      return;
    }

    const hoje = obterDataDeHoje();

    snapshot.forEach((docSnap) => {
      const p = docSnap.data();
      const id = docSnap.id;

      let classeExtra = "";
      let tagVisual = "";
      let botaoAcao = "";
      let detalhesExtra = "";

      // 1. ESTÁGIO: AGUARDANDO PARTO
      if (p.status === "Aguardando Nascimento") {
        const dataPrevStr = p.dataPrevistaParto.split("-").reverse().join("/");
        detalhesExtra = `<h3>Nascimento previsto: ${dataPrevStr}</h3>`;

        if (p.dataPrevistaParto <= hoje) {
          classeExtra =
            p.dataPrevistaParto === hoje ? "parto-hoje" : "parto-atrasado";
          tagVisual = `<span class="tag-notificacao tag-alerta">🚨 ${p.dataPrevistaParto === hoje ? "É HOJE!" : "ATRASADO!"}</span>`;
          botaoAcao = `<button class="btn-registrar-parto" onclick="abrirFormParto('${id}')">Registrar Nascimento</button>`;
        } else {
          tagVisual = `<span class="tag-notificacao">⏳ Aguardando Parto</span>`;
        }
      }
      // 2. ESTÁGIO: PARTO ACONTECEU, AGUARDANDO DESMAME
      else if (p.status === "Aguardando Desmame" || p.status === "Concluído") {
        const dataPrevDesmameStr = p.dataPrevistaDesmame
          .split("-")
          .reverse()
          .join("/");
        detalhesExtra = `
                    <h3>Desmame previsto: ${dataPrevDesmameStr}</h3>
                    <span style="color:#27ae60; font-size:13px;">✅ Nasceram: ${p.vivos} Vivos | ${p.mortos} Mortos</span>
                `;

        if (p.dataPrevistaDesmame <= hoje) {
          classeExtra = "desmame-hoje";
          tagVisual = `<span class="tag-notificacao tag-info">🍼 Hora do Desmame!</span>`;
          // Passa a data de hoje para já preencher o formulário
          botaoAcao = `<button class="btn-desmame" onclick="abrirFormDesmame('${id}', '${hoje}')">Registrar Desmame</button>`;
        } else {
          tagVisual = `<span class="tag-notificacao" style="background:#e0e0e0;">🍼 Em amamentação</span>`;
        }
      }
      // 3. ESTÁGIO: DESMAME FINALIZADO (FIM DO CICLO)
      else if (p.status === "Desmame Concluído") {
        classeExtra = "ciclo-encerrado";
        detalhesExtra = `
                    <h3 style="color:#8e44ad;">Ciclo Encerrado</h3>
                    <span style="font-size:13px;">✅ Nascidos Vivos: ${p.vivos}</span>
                    <span style="font-size:13px; color:#2980b9;">🐇 Desmamados: ${p.desmamados}</span>
                    ${p.obsDesmame ? `<p class="obs" style="margin-top:5px;">Destino: ${p.obsDesmame}</p>` : ""}
                `;
        tagVisual = `<span class="tag-notificacao" style="background:#8e44ad; color:white;">✨ Finalizado</span>`;
      }

      const div = document.createElement("div");
      div.classList.add("cartao-parto");
      if (classeExtra) div.classList.add(classeExtra);

      div.innerHTML = `
                ${detalhesExtra}
                <div style="margin-top:8px; margin-bottom:8px;">
                    <span><strong>Mãe:</strong> ${p.femea}</span>
                    <span><strong>Pai:</strong> ${p.macho}</span>
                </div>
                ${tagVisual}
                ${botaoAcao}
            `;
      listaPartos.appendChild(div);
    });
  });
}

// FUNÇÕES DE ABRIR/FECHAR FORMS
window.abrirFormParto = function (id) {
  document.getElementById("id-parto-atual").value = id;
  formRegistroParto.classList.remove("escondido");
  formRegistroDesmame.classList.add("escondido");
  textoAjudaPartos.classList.add("escondido");
  window.scrollTo(0, 0);
};

window.abrirFormDesmame = function (id, hoje) {
  document.getElementById("id-parto-desmame").value = id;
  document.getElementById("data-desmame").value = hoje; // Pré-preenche com hoje
  formRegistroDesmame.classList.remove("escondido");
  formRegistroParto.classList.add("escondido");
  textoAjudaPartos.classList.add("escondido");
  window.scrollTo(0, 0);
};

document
  .getElementById("btn-cancelar-registro")
  .addEventListener("click", () => {
    formRegistroParto.classList.add("escondido");
    textoAjudaPartos.classList.remove("escondido");
  });
document
  .getElementById("btn-cancelar-desmame")
  .addEventListener("click", () => {
    formRegistroDesmame.classList.add("escondido");
    textoAjudaPartos.classList.remove("escondido");
  });

// SALVAR REGISTRO DE PARTO
formRegistroParto.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("id-parto-atual").value;
  const dataNascimento = obterDataDeHoje();

  // Calcula Desmame (35 dias após o nascimento)
  const dataDesmame = new Date(dataNascimento);
  dataDesmame.setDate(dataDesmame.getDate() + 35);
  const dataPrevistaDesmame = dataDesmame.toISOString().split("T")[0];

  try {
    await updateDoc(doc(db, "partos", id), {
      status: "Aguardando Desmame",
      vivos: Number(document.getElementById("qtd-vivos").value),
      mortos: Number(document.getElementById("qtd-mortos").value),
      dataNascimentoReal: dataNascimento,
      dataPrevistaDesmame: dataPrevistaDesmame,
    });
    formRegistroParto.reset();
    formRegistroParto.classList.add("escondido");
    textoAjudaPartos.classList.remove("escondido");
  } catch (err) {
    alert("Erro ao registrar nascimento.");
  }
});

// SALVAR REGISTRO DE DESMAME
formRegistroDesmame.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("id-parto-desmame").value;

  try {
    await updateDoc(doc(db, "partos", id), {
      status: "Desmame Concluído",
      desmamados: Number(document.getElementById("qtd-desmamados").value),
      dataDesmameReal: document.getElementById("data-desmame").value,
      obsDesmame: document.getElementById("obs-desmame").value,
    });
    formRegistroDesmame.reset();
    formRegistroDesmame.classList.add("escondido");
    textoAjudaPartos.classList.remove("escondido");
  } catch (err) {
    alert("Erro ao registrar desmame.");
  }
});

// Inicia as leituras
lerCoelhos();
lerCoberturas();
lerPartos();
