// =========================
// ESTADO GLOBAL
// =========================
let nomeDoParticipante = "Anônimo";
let querSeIdentificar = null;

// =========================
// FIREBASE
// =========================
const firebaseConfig = {
  apiKey: "AIzaSyAGCBI060-xyJOhmIqQETLGp6CAGuCIwQU",
  authDomain: "estudo-de-caso-4d8cb.firebaseapp.com",
  projectId: "estudo-de-caso-4d8cb",
  storageBucket: "estudo-de-caso-4d8cb.appspot.com",
  messagingSenderId: "129615747041",
  appId: "1:129615747041:web:188394b09de01e9f3d64a0"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// =========================
// LOBBY
// =========================
function definirIdentificacao(valor) {
  querSeIdentificar = valor;

  const nomeWrapper = document.getElementById("nomeWrapper");
  const nomeInput = document.getElementById("lobbyNomeInput");
  const btnComecar = document.getElementById("btnComecar");
  const btnIdentificar = document.getElementById("btnIdentificar");
  const btnAnonimo = document.getElementById("btnAnonimo");
  const aviso = document.getElementById("nomeAviso");

  btnIdentificar.classList.remove("ativo");
  btnAnonimo.classList.remove("ativo");

  if (valor === true) {
    nomeWrapper.style.display = "block";
    btnIdentificar.classList.add("ativo");
    nomeInput.value = "";
    aviso.textContent = "Digite seu nome e clique em OK.";
    btnComecar.style.display = "none";
  } else {
    nomeWrapper.style.display = "none";
    btnAnonimo.classList.add("ativo");
    nomeDoParticipante = "Anônimo";
    btnComecar.style.display = "inline-block";
  }
}

function atualizarDisponibilidadeEntrada() {
  const nomeInput = document.getElementById("lobbyNomeInput");
  const aviso = document.getElementById("nomeAviso");

  if (nomeInput.value.trim() === "") {
    aviso.textContent = "Digite seu nome e clique em OK.";
  } else {
    aviso.textContent = "Pressione OK para confirmar seu nome.";
  }
}

function confirmarNome() {
  const nomeInput = document.getElementById("lobbyNomeInput");
  const btnComecar = document.getElementById("btnComecar");
  const aviso = document.getElementById("nomeAviso");

  const nomeDigitado = nomeInput.value.trim();

  if (nomeDigitado === "") {
    aviso.textContent = "Por favor, insira um nome válido.";
    aviso.style.color = "#e74c3c";
    btnComecar.style.display = "none";
    return;
  }

  nomeDoParticipante = nomeDigitado;
  aviso.textContent = "Nome confirmado: " + nomeDoParticipante;
  aviso.style.color = "#2ecc71";
  btnComecar.style.display = "inline-block";
}

function entrarNoQuestionario() {
  if (querSeIdentificar === null) {
    alert("Escolha se você quer se identificar ou responder como anônimo.");
    return;
  }

  if (querSeIdentificar === true && document.getElementById("lobbyNomeInput").value.trim() === "") {
    alert("Por favor, confirme seu nome clicando em OK.");
    return;
  }

  document.getElementById("lobbyWrapper").style.display = "none";
  document.getElementById("questionarioSection").style.display = "block";
  window.scrollTo(0, 0);
}

function voltarLobby() {
  document.getElementById("questionarioSection").style.display = "none";
  document.getElementById("lobbyWrapper").style.display = "flex";
  document.getElementById("result").innerHTML = "";
  window.scrollTo(0, 0);
}

// =========================
// VALIDAÇÃO
// =========================
function validarFormulario() {
  const selects = [...document.querySelectorAll("#reflectionForm select[name^='q']")];
  for (const sel of selects) {
    if (sel.value.trim() === "") {
      alert("Por favor, responda todas as perguntas antes de continuar.");
      sel.focus();
      return false;
    }
  }
  return true;
}

// =========================
// ANALISAR
// =========================
function analisar() {
  if (!validarFormulario()) return;

  const sugestao = document.getElementById('sugestaoInput').value.trim();
  const selects = [...document.querySelectorAll("select[name^='q']")];
  let pro = 0, contra = 0;
  const respostas = {};
  const contrasLista = [];

  selects.forEach((el) => {
    const val = el.value;
    const text = el.options[el.selectedIndex].text;
    const question = el.previousElementSibling.textContent;
    const nameAttr = el.getAttribute("name");

    respostas[nameAttr] = { pergunta: question, resposta: text, valor: val };
    if (val === 'pro') pro++;
    if (val === 'contra') { contrasLista.push({ pergunta: question, resposta: text }); contra++; }
  });

  respostas["sugestao"] = {
    pergunta: "Sugestão de melhoria",
    resposta: sugestao || "(sem sugestão)",
    valor: "neutro"
  };

  db.collection("respostas").add({
    nome: nomeDoParticipante,
    data: new Date().toISOString(),
    respostas: respostas
  });

  const total = pro + contra;
  const pctPro = total ? Math.round((pro * 100) / total) : 0;
  const pctContra = 100 - pctPro;

  const linhasTabela = Object.values(respostas).map(item => `
    <tr>
      <td>${item.pergunta}</td>
      <td>${item.resposta}</td>
    </tr>
  `).join('');

  const sugestoesHTML = contrasLista.length > 0
    ? `<div class="suggestions"><strong>Pontos de atenção:</strong><ul>${contrasLista.map(item => `<li><strong>${item.pergunta}</strong>: "${item.resposta}"</li>`).join('')}</ul></div>`
    : "";

  document.getElementById("result").innerHTML = `
    <div class="dashboard-card">
      <h2>Resultado Individual</h2>
      <div>${pctPro}% S
