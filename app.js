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
  deleteDoc,
  where,
  getDocs,
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
let todosPartos = [];
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
const filtroStatus = document.getElementById("filtro-status");
if (filtroStatus) filtroStatus.addEventListener("change", aplicarFiltros);

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
  // Pega os valores digitados nos filtros
  const tNome = filtroNome.value.toLowerCase();
  const tRaca = filtroRaca.value.toLowerCase();
  const tNasc = filtroNasc.value;
  const tSexo = filtroSexo.value;

  // Pega o filtro de Status (Vivo/Óbito/Todos). Se não existir ainda na tela, o padrão é "Vivo"
  const filtroStatus = document.getElementById("filtro-status");
  const tStatus = filtroStatus ? filtroStatus.value : "Vivo";

  // Filtra a lista de coelhos
  const filtrados = todosCoelhos.filter((c) => {
    // Se o coelho for antigo e não tiver status salvo no banco, consideramos "Vivo"
    const cStatus = c.status || "Vivo";

    const bateNome = (c.nome || "").toLowerCase().includes(tNome);
    const bateRaca = (c.raca || "").toLowerCase().includes(tRaca);
    const bateNasc = tNasc === "" ? true : c.nascimento === tNasc;
    const bateSexo = tSexo === "" ? true : c.sexo === tSexo;

    // Filtro de status (Se o filtro estiver vazio "", mostra todos)
    const bateStatus = tStatus === "" ? true : cStatus === tStatus;

    return bateNome && bateRaca && bateNasc && bateSexo && bateStatus;
  });

  // Limpa a tela antes de desenhar os novos resultados
  listaCoelhos.innerHTML = "";

  // Se não achar ninguém, mostra mensagem
  if (filtrados.length === 0) {
    listaCoelhos.innerHTML =
      '<p style="text-align:center; color:#7f8c8d; margin-top:20px;">Nenhum coelho encontrado.</p>';
    return;
  }

  // Desenha cada coelho na tela
  filtrados.forEach((c) => {
    const isObito = c.status === "Óbito";
    let dataNasc = c.nascimento
      ? c.nascimento.split("-").reverse().join("/")
      : "-";

    // Se o coelho estiver morto, monta a tag de data de óbito
    let tagsObito = isObito
      ? `<span class="tag-obito">✝️ Falecido em ${c.dataObito ? c.dataObito.split("-").reverse().join("/") : "Data desconhecida"}</span><br>`
      : "";

    // Se o coelho estiver vivo, mostra o botão "Óbito". Se já estiver morto, esconde esse botão.
    let btnObito = !isObito
      ? `<button class="btn-obito" onclick="registrarObito('${c.id}')">✝️ Marcar Óbito</button>`
      : "";

    const div = document.createElement("div");
    div.classList.add("cartao-coelho");

    // Adiciona a classe cinza se for óbito
    if (isObito) {
      div.classList.add("coelho-obito");
    }

    // Monta o HTML do cartão
    div.innerHTML = `
            <img src="${c.foto || ""}" class="foto-lista" onerror="this.style.display='none'" alt="Foto de ${c.nome}">
            <div class="info-coelho" style="width:100%;">
                <strong>#${c.numero || "S/N"} - ${c.nome || "S/N"}</strong><br>
                ${tagsObito}
                <span><strong>Raça:</strong> ${c.raca || "-"}</span>
                <span><strong>Sexo:</strong> ${c.sexo || "-"}</span>
                <span><strong>Nascimento:</strong> ${dataNasc}</span>
                ${c.observacoes ? `<p class="obs">Obs: ${c.observacoes}</p>` : ""}
                
                <!-- Área dos Botões (Óbito e Excluir) -->
                <div class="botoes-acao-lista">
                    ${btnObito}
                    <button class="btn-excluir" onclick="excluirCoelho('${c.id}')" style="margin-top:0;">🗑️ Excluir</button>
                </div>
            </div>
        `;

    // Adiciona o cartão pronto na lista
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
    // Ignora coelhos em óbito na hora de acasalar!
    if (c.status !== "Óbito") {
      const option = document.createElement("option");
      option.value = `${c.nome} | #${c.numero || "S/N"}`;
      option.innerText = `${c.nome} | #${c.numero || "S/N"}`;
      if (c.sexo === "Fêmea") selFemea.appendChild(option);
      if (c.sexo === "Macho") selMacho.appendChild(option);
    }
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
                <button class="btn-mini-excluir" onclick="excluirCobertura('${idCob}')" title="Excluir Cobertura">🗑️</button>
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
      todosPartos.push(p);
      let classeExtra = "";
      let tagVisual = "";
      let botaoAcao = "";

      const formataData = (dataBase) =>
        dataBase ? dataBase.split("-").reverse().join("/") : "";

      // 1. Bloco Fixo: Cobertura
      let htmlTimeline = `
                <div style="margin-bottom: 8px; font-size: 15px;">
                    <strong>Mãe:</strong> ${p.femea} <br>
                    <strong>Pai:</strong> ${p.macho}
                </div>
                <div style="margin-bottom: 5px; font-size: 14px; color: #555;">
                    ❤️ <strong>Cobertura:</strong> ${formataData(p.dataCruzamento)}
                </div>
            `;

      // 2. Bloco: Parto (Previsão ou Realizado)
      if (p.status === "Aguardando Nascimento") {
        htmlTimeline += `
                    <div style="margin-bottom: 5px; font-size: 14px; color: #555;">
                        ⏳ <strong>Previsão Parto:</strong> ${formataData(p.dataPrevistaParto)}
                    </div>
                `;

        if (p.dataPrevistaParto <= hoje) {
          classeExtra =
            p.dataPrevistaParto === hoje ? "parto-hoje" : "parto-atrasado";
          tagVisual = `<span class="tag-notificacao tag-alerta">🚨 ${p.dataPrevistaParto === hoje ? "É HOJE!" : "ATRASADO!"}</span>`;
        } else {
          tagVisual = `<span class="tag-notificacao">⏳ Aguardando Parto</span>`;
        }
        botaoAcao = `<button class="btn-registrar-parto" onclick="abrirFormParto('${id}')">Registrar Nascimento</button>`;
      } else {
        htmlTimeline += `
                    <div style="margin-bottom: 5px; font-size: 14px; color: #27ae60;">
                        🐰 <strong>Parto:</strong> ${formataData(p.dataNascimentoReal)} 
                        <br> <span style="padding-left:20px; font-size:13px;">${p.vivos} Vivos | ${p.mortos} Mortos</span>
                    </div>
                `;
      }

      // 3. Bloco: Desmame (Previsão ou Realizado)
      if (p.status === "Aguardando Desmame" || p.status === "Concluído") {
        htmlTimeline += `
                    <div style="margin-bottom: 5px; font-size: 14px; color: #555;">
                        ⏳ <strong>Previsão Desmame:</strong> ${formataData(p.dataPrevistaDesmame)}
                    </div>
                `;

        // O botão agora SEMPRE aparece assim que o parto acontece
        botaoAcao = `<button class="btn-desmame" onclick="abrirFormDesmame('${id}', '${hoje}')">Registrar Desmame</button>`;

        if (p.dataPrevistaDesmame <= hoje) {
          classeExtra = "desmame-hoje";
          tagVisual = `<span class="tag-notificacao tag-info">🍼 Hora do Desmame!</span>`;
        } else {
          tagVisual = `<span class="tag-notificacao" style="background:#e0e0e0; color:#333;">🍼 Em amamentação</span>`;
        }
      } else if (p.status === "Desmame Concluído") {
        classeExtra = "ciclo-encerrado";
        htmlTimeline += `
                    <div style="margin-bottom: 5px; font-size: 14px; color: #2980b9;">
                        🍼 <strong>Desmame:</strong> ${formataData(p.dataDesmameReal)} 
                        <br> <span style="padding-left:20px; font-size:13px;"><strong>${p.desmamados}</strong> Qtd | <strong>${p.pesoMedio}</strong> Peso Méd.</span>
                        ${p.obsDesmame ? `<br> <span style="padding-left:20px; font-size:13px; color:#666;">Obs: ${p.obsDesmame}</span>` : ""}
                    </div>
                `;
        tagVisual = `<span class="tag-notificacao" style="background:#8e44ad; color:white;">✨ Ciclo Finalizado</span>`;
      }

      // --- MONTA O CARTÃO FINAL ---
      const div = document.createElement("div");
      div.classList.add("cartao-parto");
      if (classeExtra) div.classList.add(classeExtra);

      // Note a inclusão do botão excluir passando o p.coberturaId
      div.innerHTML = `
                <button class="btn-mini-excluir" onclick="excluirParto('${id}', '${p.coberturaId}')" title="Excluir Parto">🗑️</button>
                ${htmlTimeline}
                <div style="margin-top: 10px;">
                    ${tagVisual}
                    ${botaoAcao}
                </div>
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

const formFinanceiro = document.getElementById("form-financeiro");
document
  .getElementById("btn-mostrar-form-financeiro")
  .addEventListener("click", () => {
    document.getElementById("fin-data").value = obterDataDeHoje(); // Preenche com data de hoje
    formFinanceiro.classList.remove("escondido");
  });
document
  .getElementById("btn-cancelar-financeiro")
  .addEventListener("click", () => formFinanceiro.classList.add("escondido"));

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
      pesoMedio: document.getElementById("peso-medio").value, // NOVO: Salva o peso no banco
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

// ==========================================
// MÓDULO 4: FINANCEIRO
// ==========================================

let todasFinancas = [];
const listaFinanceiro = document.getElementById("lista-financeiro");

// Filtros Financeiros
const filFinMes = document.getElementById("filtro-fin-mes");
const filFinTipo = document.getElementById("filtro-fin-tipo");
const filFinCat = document.getElementById("filtro-fin-categoria");

// Função rápida para transformar número em R$ 0,00
const formatarMoeda = (valor) => {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

// 1. Cadastrar Lançamento
formFinanceiro.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("btn-salvar-fin");
  btn.innerText = "Salvando...";
  btn.disabled = true;

  try {
    await addDoc(collection(db, "financeiro"), {
      tipo: document.getElementById("fin-tipo").value,
      data: document.getElementById("fin-data").value,
      valor: Number(document.getElementById("fin-valor").value),
      categoria: document.getElementById("fin-categoria").value,
      descricao: document.getElementById("fin-descricao").value,
      dataCadastro: new Date(),
    });
    formFinanceiro.reset();
    formFinanceiro.classList.add("escondido");
  } catch (e) {
    alert("Erro ao salvar lançamento financeiro.");
  } finally {
    btn.innerText = "Salvar Lançamento";
    btn.disabled = false;
  }
});

// 2. Leitura
function lerFinanceiro() {
  const q = query(collection(db, "financeiro"), orderBy("data", "desc"));
  onSnapshot(q, (snapshot) => {
    todasFinancas = [];
    snapshot.forEach((docSnap) => {
      todasFinancas.push({ id: docSnap.id, ...docSnap.data() });
    });
    aplicarFiltrosFin(); // Chama o filtro para exibir
  });
}

// 3. Aplicar Filtros e Resumo
function aplicarFiltrosFin() {
  const tMes = filFinMes.value; // ex: "2026-09"
  const tTipo = filFinTipo.value;
  const tCat = filFinCat.value;

  const filtrados = todasFinancas.filter((f) => {
    // A data salva é "YYYY-MM-DD", então 'startsWith' funciona perfeito para checar o Mês/Ano!
    const bateMes = tMes === "" ? true : (f.data || "").startsWith(tMes);
    const bateTipo = tTipo === "" ? true : f.tipo === tTipo;
    const bateCat = tCat === "" ? true : f.categoria === tCat;
    return bateMes && bateTipo && bateCat;
  });

  renderizarFinanceiro(filtrados);
}

// Adiciona eventos aos filtros
[filFinMes, filFinTipo, filFinCat].forEach((f) =>
  f.addEventListener("input", aplicarFiltrosFin),
);
document
  .getElementById("btn-limpar-filtros-fin")
  .addEventListener("click", () => {
    filFinMes.value = "";
    filFinTipo.value = "";
    filFinCat.value = "";
    aplicarFiltrosFin();
  });

// 4. Renderizar e Calcular Dashboard
function renderizarFinanceiro(lista) {
  listaFinanceiro.innerHTML = "";

  let totalEntradas = 0;
  let totalSaidas = 0;

  if (lista.length === 0) {
    listaFinanceiro.innerHTML =
      '<p style="text-align:center;">Nenhuma movimentação registrada.</p>';
  }

  lista.forEach((f) => {
    // Calcula Totais
    if (f.tipo === "Entrada") totalEntradas += f.valor;
    else totalSaidas += f.valor;

    const dataFormat = f.data ? f.data.split("-").reverse().join("/") : "";
    const classeCor = f.tipo === "Entrada" ? "entrada" : "saida";
    const sinal = f.tipo === "Entrada" ? "+ " : "- ";

    const div = document.createElement("div");
    div.classList.add("cartao-financa", classeCor);
    div.innerHTML = `
            <div class="financa-info">
                <h4>${f.categoria}</h4>
                <span>📅 ${dataFormat}</span>
                <span>📝 ${f.descricao}</span>
            </div>
            <div class="financa-valor ${classeCor}" style="display:flex; align-items:center; justify-content:flex-end;">
                ${sinal}${formatarMoeda(f.valor)}
                <button class="btn-excluir-financa" title="Excluir" onclick="excluirFinanca('${f.id}')">🗑️</button>
            </div>
        `;
    listaFinanceiro.appendChild(div);
  });

  // Atualiza Caixinhas de Resumo
  document.getElementById("resumo-entradas").innerText =
    formatarMoeda(totalEntradas);
  document.getElementById("resumo-saidas").innerText =
    formatarMoeda(totalSaidas);

  const saldo = totalEntradas - totalSaidas;
  const divSaldo = document.querySelector(".caixa-resumo.saldo");
  document.getElementById("resumo-saldo").innerText = formatarMoeda(saldo);

  // Deixa o fundo do Saldo Verde (Lucro) ou Vermelho (Prejuízo)
  if (saldo > 0) divSaldo.style.backgroundColor = "#27ae60";
  else if (saldo < 0) divSaldo.style.backgroundColor = "#e74c3c";
  else divSaldo.style.backgroundColor = "#2c3e50"; // Neutro
}

window.registrarObito = async function (id) {
  if (
    confirm(
      "Deseja marcar este coelho como Óbito? Ele sairá da lista de vivos, mas seu histórico será mantido.",
    )
  ) {
    const dataHoje = obterDataDeHoje(); // Usamos a mesma função de data que criamos antes
    await updateDoc(doc(db, "coelhos", id), {
      status: "Óbito",
      dataObito: dataHoje,
    });
  }
};

window.excluirCobertura = async function (id) {
  if (
    confirm(
      "Excluir esta cobertura? Se houver um parto agendado para ela, ele também será excluído.",
    )
  ) {
    // 1. Busca se tem algum parto atrelado a essa cobertura
    const qPartos = query(
      collection(db, "partos"),
      where("coberturaId", "==", id),
    );
    const partosSnaps = await getDocs(qPartos);

    // 2. Exclui os partos atrelados (Exclusão Encadeada)
    partosSnaps.forEach(async (docParto) => {
      await deleteDoc(doc(db, "partos", docParto.id));
    });

    // 3. Exclui a cobertura em si
    await deleteDoc(doc(db, "coberturas", id));
  }
};

window.excluirParto = async function (idParto, idCobertura) {
  if (
    confirm(
      "Excluir este parto? A cobertura dele voltará para o status de 'Pendente'.",
    )
  ) {
    // 1. Exclui o Parto
    await deleteDoc(doc(db, "partos", idParto));

    // 2. Restaura a cobertura para poder ser confirmada de novo
    if (idCobertura) {
      await updateDoc(doc(db, "coberturas", idCobertura), {
        partoConfirmado: false,
      });
    }
  }
};

window.excluirFinanca = async function (id) {
  if (
    confirm(
      "Excluir este lançamento financeiro? O valor será recalculado automaticamente.",
    )
  ) {
    await deleteDoc(doc(db, "financeiro", id));
  }
};

// ==========================================
// MÓDULO 5: RELATÓRIOS
// ==========================================

const modalRelatorios = document.getElementById("modal-relatorios");
const areaRelatorio = document.getElementById("area-resultado-relatorio");

// Abrir e Fechar Modal
document
  .getElementById("btn-abrir-relatorios")
  .addEventListener("click", () => {
    modalRelatorios.classList.remove("escondido");
    areaRelatorio.innerHTML =
      '<p style="color:#7f8c8d; text-align:center; margin-top:30px;">Selecione um relatório acima.</p>';
  });
document
  .getElementById("btn-fechar-relatorios")
  .addEventListener("click", () => {
    modalRelatorios.classList.add("escondido");
  });

// 1. RELATÓRIO DE PLANTEL
document.getElementById("btn-rel-plantel").addEventListener("click", () => {
  const vivos = todosCoelhos.filter((c) => c.status !== "Óbito");
  const machos = vivos.filter((c) => c.sexo === "Macho").length;
  const femeas = vivos.filter((c) => c.sexo === "Fêmea").length;

  areaRelatorio.innerHTML = `
        <h4 style="margin-bottom:15px; color:#2c3e50;">🐇 Inventário Atual (Ativos)</h4>
        <div class="linha-relatorio"><span>Total de Coelhos Vivos:</span> <strong>${vivos.length}</strong></div>
        <div class="linha-relatorio"><span>Fêmeas (Matrizes):</span> <strong style="color:#e84393;">${femeas}</strong></div>
        <div class="linha-relatorio"><span>Machos (Reprodutores):</span> <strong style="color:#0984e3;">${machos}</strong></div>
    `;
});

// 2. RELATÓRIO DE REPRODUÇÃO
document.getElementById("btn-rel-reproducao").addEventListener("click", () => {
  const partosConcluidos = todosPartos.filter(
    (p) => p.status === "Desmame Concluído",
  );

  if (partosConcluidos.length === 0) {
    areaRelatorio.innerHTML =
      "<p>Nenhum ciclo de reprodução foi totalmente concluído (desmamado) ainda.</p>";
    return;
  }

  let totalVivos = 0,
    totalMortos = 0,
    totalDesmamados = 0;

  partosConcluidos.forEach((p) => {
    totalVivos += p.vivos || 0;
    totalMortos += p.mortos || 0;
    totalDesmamados += p.desmamados || 0;
  });

  const taxaSobrevivencia =
    totalVivos > 0 ? ((totalDesmamados / totalVivos) * 100).toFixed(1) : 0;
  const mediaPorParto = (totalDesmamados / partosConcluidos.length).toFixed(1);

  areaRelatorio.innerHTML = `
        <h4 style="margin-bottom:15px; color:#2c3e50;">🍼 Desempenho (Partos Finalizados)</h4>
        <div class="linha-relatorio"><span>Ciclos Concluídos:</span> <strong>${partosConcluidos.length}</strong></div>
        <div class="linha-relatorio"><span>Total Nascidos Vivos:</span> <strong>${totalVivos}</strong></div>
        <div class="linha-relatorio"><span>Total Nascidos Mortos:</span> <strong>${totalMortos}</strong></div>
        <div class="linha-relatorio"><span>Total Desmamados:</span> <strong style="color:#27ae60;">${totalDesmamados}</strong></div>
        <div class="linha-relatorio" style="background:#fff3cd; padding:10px;">
            <span>Taxa de Sobrevivência (Nascimento ao Desmame):</span> 
            <strong>${taxaSobrevivencia}%</strong>
        </div>
        <div class="linha-relatorio" style="background:#e8f4f8; padding:10px;">
            <span>Média de filhotes desmamados por parto:</span> 
            <strong>${mediaPorParto}</strong>
        </div>
    `;
});

// 3. RELATÓRIO FINANCEIRO (Agrupado por Categoria)
document.getElementById("btn-rel-financas").addEventListener("click", () => {
  let entradas = 0,
    saidas = 0;
  let gastosPorCategoria = {};

  todasFinancas.forEach((f) => {
    if (f.tipo === "Entrada") {
      entradas += f.valor;
    } else {
      saidas += f.valor;
      // Agrupa os gastos
      if (!gastosPorCategoria[f.categoria]) gastosPorCategoria[f.categoria] = 0;
      gastosPorCategoria[f.categoria] += f.valor;
    }
  });

  const saldo = entradas - saidas;
  const corSaldo = saldo >= 0 ? "#27ae60" : "#e74c3c";

  // Monta a lista de categorias gastas
  let htmlCategorias =
    '<h5 style="margin-top:15px; margin-bottom:5px; color:#555;">Despesas por Categoria:</h5>';
  for (let cat in gastosPorCategoria) {
    htmlCategorias += `<div class="linha-relatorio"><span>${cat}:</span> <strong style="color:#e74c3c;">R$ ${gastosPorCategoria[cat].toFixed(2).replace(".", ",")}</strong></div>`;
  }

  areaRelatorio.innerHTML = `
        <h4 style="margin-bottom:15px; color:#2c3e50;">💰 Balanço Geral</h4>
        <div class="linha-relatorio"><span>Total de Receitas:</span> <strong style="color:#27ae60;">R$ ${entradas.toFixed(2).replace(".", ",")}</strong></div>
        <div class="linha-relatorio"><span>Total de Despesas:</span> <strong style="color:#e74c3c;">R$ ${saidas.toFixed(2).replace(".", ",")}</strong></div>
        <div class="linha-relatorio" style="background:#ecf0f1; padding:10px; font-size:16px;">
            <span>Saldo Atual:</span> <strong style="color:${corSaldo};">R$ ${saldo.toFixed(2).replace(".", ",")}</strong>
        </div>
        ${saidas > 0 ? htmlCategorias : ""}
    `;
});

// Inicia as leituras
lerCoelhos();
lerCoberturas();
lerPartos();
lerFinanceiro();
