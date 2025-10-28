// ==============================
// CONFIGURAÇÃO GERAL
// ==============================
const perguntasOrdenadas = [
  { id: "q1", texto: "1. Como você se sente com o projeto?" },
  { id: "q2", texto: "2. Como você considera sua participação na equipe?" },
  { id: "q3", texto: "3. Analisando de forma geral, o que você acha da frequência das reuniões?" },
  { id: "q4", texto: "4. Como você se sente referente à liderança?" },
  { id: "q5", texto: "5. Como você avalia a comunicação entre os membros da equipe?" },
  { id: "q6", texto: "6. Você sente que suas ideias são ouvidas e consideradas?" },
  { id: "q7", texto: "7. O ambiente de trabalho é positivo e acolhedor?" },
  { id: "q8", texto: "8. Você acredita que está se desenvolvendo profissionalmente neste projeto?" }
];

let nomeDoParticipante = "Anônimo";
let querSeIdentificar = null;

// Configuração Firebase
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


// ==============================
// FUNÇÕES DE IDENTIFICAÇÃO
// ==============================

function definirIdentificacao(valor) {
  querSeIdentificar = valor;

  const nomeWrapper = document.getElementById("nomeWrapper");
  const nomeInput = document.getElementById("lobbyNomeInput");
  const btnComecar = document.getElementById("btnComecar");
  const btnIdentificar = document.getElementById("btnIdentificar");
  const btnAnonimo = document.getElementById("btnAnonimo");
  const aviso = document.getElementById("nomeAviso");

  // Reseta estilo dos botões
  btnIdentificar.classList.remove("ativo");
  btnAnonimo.classList.remove("ativo");

  if (valor === true) {
    nomeWrapper.style.display = "block";
    btnIdentificar.classList.add("ativo");

    nomeInput.value = "";
    aviso.textContent = "Digite seu nome e clique em OK.";
    aviso.style.color = "#000";
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
  if (!nomeInput) return;

  if (nomeInput.value.trim() === "") {
    aviso.textContent = "Digite seu nome e clique em OK.";
    aviso.style.color = "#000";
  } else {
    aviso.textContent = "Pressione OK para confirmar seu nome.";
    aviso.style.color = "#000";
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


// ==============================
// ENTRAR / VOLTAR
// ==============================

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
  const resultDiv = document.getElementById("result");
  if (resultDiv) resultDiv.innerHTML = "";
  window.scrollTo(0, 0);
}


// ==============================
// VALIDAÇÃO DO FORMULÁRIO
// ==============================

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


// ==============================
// ANÁLISE INDIVIDUAL
// ==============================

function analisar() {
  if (!validarFormulario()) return;

  const sugestao = document.getElementById("sugestaoInput").value.trim();
  const selects = [...document.querySelectorAll("select[name^='q']")];
  let pro = 0;
  let contra = 0;
  const respostas = {};
  const contrasLista = [];

  selects.forEach((el) => {
    const val = el.value;
    const text = el.options[el.selectedIndex].text;
    const question = el.previousElementSibling.textContent;
    const nameAttr = el.getAttribute("name");

    respostas[nameAttr] = { pergunta: question, resposta: text, valor: val };
    if (val === "pro") pro++;
    if (val === "contra") {
      contrasLista.push({ pergunta: question, resposta: text });
      contra++;
    }
  });

  respostas["sugestao"] = {
    pergunta: "Sugestão de melhoria",
    resposta: sugestao || "(sem sugestão)",
    valor: "neutro"
  };

  // Salva no Firestore
  db.collection("respostas").add({
    nome: nomeDoParticipante,
    data: new Date().toISOString(),
    respostas: respostas
  });

  const total = pro + contra;
  const pctPro = total ? Math.round((pro * 100) / total) : 0;
  const pctContra = 100 - pctPro;

  const linhasTabela = Object.values(respostas)
    .map(
      (item) => `
      <tr>
        <td>${item.pergunta}</td>
        <td>${item.resposta}</td>
      </tr>`
    )
    .join("");

  const sugestoesHTML =
    contrasLista.length > 0
      ? `<div class="suggestions">
          <strong>Pontos de atenção:</strong>
          <ul>
            ${contrasLista
              .map(
                (item) =>
                  `<li><strong>${item.pergunta}</strong>: "${item.resposta}"</li>`
              )
              .join("")}
          </ul>
        </div>`
      : "";

  document.getElementById("result").innerHTML = `
    <div class="dashboard-card">
      <h2>Resultado Individual</h2>
      <div>
        ${pctPro}% Satisfeito • ${pctContra}% Insatisfeito<br/>
        Participante: ${nomeDoParticipante}
      </div>
      <div class="grafico-wrapper"><canvas id="graficoPizza"></canvas></div>
      <table>${linhasTabela}</table>
      ${sugestoesHTML}
    </div>
  `;

  new Chart(document.getElementById("graficoPizza"), {
    type: "pie",
    data: {
      labels: ["Satisfeito", "Insatisfeito"],
      datasets: [{ data: [pctPro, pctContra], backgroundColor: ["#2ecc71", "#e74c3c"] }]
    },
    options: { responsive: false, maintainAspectRatio: false }
  });
}


// ==============================
// ANÁLISE DO GRUPO
// ==============================

function mostrarGrupo() {
  const senha = prompt("Digite a senha para acessar os dados do grupo:");
  if (senha !== "1234") {
    alert("Senha incorreta.");
    return;
  }

  db.collection("respostas")
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        alert("Nenhum dado encontrado.");
        return;
      }

      let totalPro = 0;
      let totalContra = 0;
      let participantes = 0;
      let blocosParticipantes = "";

      snapshot.forEach((doc) => {
        const { nome, respostas } = doc.data();
        let pro = 0;
        let contra = 0;

        let linhasPessoa = "";

        Object.values(respostas).forEach((resp) => {
          linhasPessoa += `
            <tr>
              <td>${resp.pergunta}</td>
              <td>${resp.resposta || "-"}</td>
            </tr>
          `;

          if (resp.valor === "pro") pro++;
          if (resp.valor === "contra") contra++;
        });

        const totalLocal = pro + contra;
        if (totalLocal > 0) {
          totalPro += Math.round((pro * 100) / totalLocal);
          totalContra += Math.round((contra * 100) / totalLocal);
          participantes++;
        }

        blocosParticipantes += `
          <div style="margin-bottom:20px;">
            <div style="font-weight:600; margin-bottom:8px; color:#111;">
              ${nome}
            </div>
            <table>${linhasPessoa}</table>
          </div>
        `;
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
          datasets: [
            { data: [mediaPro, mediaContra], backgroundColor: ["#2ecc71", "#e74c3c"] }
          ]
        },
        options: { responsive: false, maintainAspectRatio: false }
      });
    });
}


// ==============================
// LIMPAR DADOS (SENHA)
// ==============================

function limparDadosProtegido() {
  const senha = prompt("Digite a senha para APAGAR TODOS os dados:");
  if (senha !== "1234") {
    alert("Senha incorreta.");
    return;
  }

  if (!confirm("Tem certeza que deseja apagar TODOS os dados?")) return;

  db.collection("respostas")
    .get()
    .then((snapshot) => {
      const batch = db.batch();
      snapshot.forEach((doc) => batch.delete(doc.ref));
      return batch.commit();
    })
    .then(() => {
      alert("Todos os dados foram apagados.");
      document.getElementById("result").innerHTML = "";
    });
}
