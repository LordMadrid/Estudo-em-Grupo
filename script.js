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
  // valor === true -> identificar / valor === false -> anônimo
  querSeIdentificar = valor;

  const nomeWrapper      = document.getElementById("nomeWrapper");
  const nomeInput        = document.getElementById("lobbyNomeInput");
  const btnComecar       = document.getElementById("btnComecar");
  const btnIdentificar   = document.getElementById("btnIdentificar");
  const btnAnonimo       = document.getElementById("btnAnonimo");
  const aviso            = document.getElementById("nomeAviso");

  // limpa estado visual dos dois botões
  btnIdentificar.classList.remove("ativo");
  btnAnonimo.classList.remove("ativo");

  if (valor === true) {
    // modo "quero me identificar"

    // mostra o campo de nome
    nomeWrapper.style.display = "block";

    // botão azul fica marcado como ativo
    btnIdentificar.classList.add("ativo");

    // limpa o campo e reseta mensagem
    nomeInput.value = "";
    aviso.textContent = "Digite seu nome e clique em OK.";
    aviso.style.color = "#000";

    // NÃO deixa começar ainda
    btnComecar.style.display = "none";

  } else {
    // modo "quero ficar anônimo"

    // esconde o campo de nome
    nomeWrapper.style.display = "none";

    // botão cinza fica marcado
    btnAnonimo.classList.add("ativo");

    // define nome como "Anônimo"
    nomeDoParticipante = "Anônimo";

    // libera o botão de começar
    btnComecar.style.display = "inline-block";
  }
}

function atualizarDisponibilidadeEntrada() {
  const nomeInput = document.getElementById("lobbyNomeInput");
  const aviso = document.getElementById("nomeAviso");
  if (!nomeInput) return;
  if (nomeInput.value.trim() === "") {
    aviso.textContent = "Digite seu nome e clique em OK.";
  } else {
    aviso.textContent = "Pressione OK para confirmar seu nome.";
  }
}

function confirmarNome() {
  const nomeInput  = document.getElementById("lobbyNomeInput");
  const btnComecar = document.getElementById("btnComecar");
  const aviso      = document.getElementById("nomeAviso");

  const nomeDigitado = nomeInput.value.trim();

  if (nomeDigitado === "") {
    // erro: não digitou nada
    aviso.textContent = "Por favor, insira um nome válido.";
    aviso.style.color = "#e74c3c";
    btnComecar.style.display = "none";
    return;
  }

  // salva o nome
  nomeDoParticipante = nomeDigitado;

  // feedback visual
  aviso.textContent = "Nome confirmado: " + nomeDoParticipante;
  aviso.style.color = "#2ecc71";

  // libera botão pra continuar
  btnComecar.style.display = "inline-block";
}


function entrarNoQuestionario() {
  // tem que ter escolhido uma opção
  if (querSeIdentificar === null) {
    alert("Escolha se você quer se identificar ou responder como anônimo.");
    return;
  }

  // se escolheu se identificar, precisa confirmar nome antes
  if (
    querSeIdentificar === true &&
    document.getElementById("lobbyNomeInput").value.trim() === ""
  ) {
    alert("Por favor, confirme seu nome clicando em OK.");
    return;
  }

  // troca de tela
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
      <div>${pctPro}% Satisfeito • ${pctContra}% Insatisfeito<br>Participante: ${nomeDoParticipante}</div>
      <div class="grafico-wrapper"><canvas id="graficoPizza"></canvas></div>
      <table>${linhasTabela}</table>
      ${sugestoesHTML}
    </div>
  `;

  new Chart(document.getElementById("graficoPizza"), {
    type: "pie",
    data: {
      labels: ["Satisfeito", "Insatisfeito"],
      datasets: [{
        data: [pctPro, pctContra],
        backgroundColor: ["#2ecc71", "#e74c3c"]
      }]
    },
    options: { responsive: false, maintainAspectRatio: false }
  });
}

// =========================
// GRUPO
// =========================
function mostrarGrupo() {
  const senha = prompt("Digite a senha para acessar os dados do grupo:");
  if (senha !== "1234") {
    alert("Senha incorreta.");
    return;
  }

  db.collection("respostas").get().then(snapshot => {
    if (snapshot.empty) {
      alert("Nenhum dado encontrado.");
      return;
    }

    let totalPro = 0, totalContra = 0, participantes = 0;
    let blocosParticipantes = "";

    snapshot.forEach(doc => {
      const { nome, respostas } = doc.data();
      let pro = 0, contra = 0;
      let linhas = "";

      Object.values(respostas).forEach(r => {
        linhas += `<tr><td>${r.pergunta}</td><td>${r.resposta}</td></tr>`;
        if (r.valor === "pro") pro++;
        if (r.valor === "contra") contra++;
      });

      const totalLocal = pro + contra;
      if (totalLocal > 0) {
        totalPro += Math.round((pro * 100) / totalLocal);
        totalContra += Math.round((contra * 100) / totalLocal);
        participantes++;
      }

      blocosParticipantes += `<div style="margin-bottom:20px;"><strong>${nome}</strong><table>${linhas}</table></div>`;
    });

    const mediaPro = participantes > 0 ? Math.round(totalPro / participantes) : 0;
    const mediaContra = 100 - mediaPro;

    document.getElementById("result").innerHTML = `
      <div class="dashboard-card">
        <h2>Análise do Grupo</h2>
        <div>${mediaPro}% Satisfeito • ${mediaContra}% Insatisfeito</div>
        <div class="grafico-wrapper"><canvas id="graficoGrupo"></canvas></div>
        ${blocosParticipantes}
      </div>
    `;

    new Chart(document.getElementById("graficoGrupo"), {
      type: "pie",
      data: {
        labels: ["Satisfeito", "Insatisfeito"],
        datasets: [{ data: [mediaPro, mediaContra], backgroundColor: ["#2ecc71", "#e74c3c"] }]
      },
      options: { responsive: false, maintainAspectRatio: false }
    });
  });
}

// =========================
// LIMPAR
// =========================
function limparDadosProtegido() {
  const senha = prompt("Digite a senha para APAGAR TODOS os dados:");
  if (senha !== "1234") {
    alert("Senha incorreta.");
    return;
  }
  if (!confirm("Tem certeza que deseja apagar TODOS os dados?")) return;

  db.collection("respostas").get().then(snapshot => {
    const batch = db.batch();
    snapshot.forEach(doc => batch.delete(doc.ref));
    return batch.commit();
  }).then(() => {
    alert("Todos os dados foram apagados.");
    document.getElementById("result").innerHTML = "";
  });
}
