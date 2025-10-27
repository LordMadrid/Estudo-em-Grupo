// =========================
// ESTADO GLOBAL
// =========================
let nomeDoParticipante = "Anônimo";
let querSeIdentificar = null; // null = ainda não escolheu


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
// CONTROLE DO LOBBY
// =========================

// usuário clicou "Quero me identificar" OU "Quero ficar anônimo"
function definirIdentificacao(valor) {
  // valor = true (identificar) ou false (anônimo)
  querSeIdentificar = valor;

  const nomeWrapper = document.getElementById("nomeWrapper");

  if (querSeIdentificar === true) {
    // precisa mostrar campo nome
    nomeWrapper.style.display = "block";
  } else {
    // anônimo: esconde campo e limpa
    nomeWrapper.style.display = "none";
    const nomeInput = document.getElementById("lobbyNomeInput");
    if (nomeInput) nomeInput.value = "";
  }
}

// botão "Começar questionário"
function entrarNoQuestionario() {
  // precisa ter escolhido uma das duas opções
  if (querSeIdentificar === null) {
    alert("Escolha se você quer se identificar ou responder como anônimo.");
    return;
  }

  if (querSeIdentificar === true) {
    // precisa ter preenchido o nome
    const nomeDigitado = document.getElementById("lobbyNomeInput").value.trim();
    if (!nomeDigitado) {
      alert("Por favor, insira seu nome.");
      return;
    }
    nomeDoParticipante = nomeDigitado;
  } else {
    nomeDoParticipante = "Anônimo";
  }

  document.getElementById("lobbyWrapper").style.display = "none";
  document.getElementById("questionarioSection").style.display = "block";

  window.scrollTo(0, 0);
}


// =========================
// VALIDAÇÃO DAS RESPOSTAS
// =========================
function validarFormulario() {
  const selects = [...document.querySelectorAll("#reflectionForm select[name^='q']")];

  for (const sel of selects) {
    const valor = sel.value.trim();

    // se ficou vazio (não escolheu) -> bloqueia
    if (valor === "") {
      alert("Por favor, responda todas as perguntas antes de continuar.");
      sel.focus();
      return false;
    }

    // se escolheu "nenhum" -> bloqueia
    if (valor === "nenhum") {
      alert("Uma ou mais perguntas foram marcadas como 'Nenhum / Prefiro não responder'. Todas as perguntas são obrigatórias.");
      sel.focus();
      return false;
    }
  }

  return true;
}


// =========================
// ANALISAR (RESULTADO INDIVIDUAL)
// =========================
function analisar() {
  // trava se não respondeu tudo corretamente
  if (!validarFormulario()) {
    return;
  }

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

    respostas[nameAttr] = {
      pergunta: question,
      resposta: text,
      valor: val
    };

    if (val === 'pro') pro++;
    if (val === 'contra') {
      contrasLista.push({ pergunta: question, resposta: text });
      contra++;
    }
  });

  respostas["sugestao"] = {
    pergunta: "Sugestão de melhoria",
    resposta: sugestao || "(sem sugestão)",
    valor: "neutro"
  };

  // salva respostas no Firestore com o nome escolhido / Anônimo
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
      <td class="pergunta-col">${item.pergunta}</td>
      <td class="resposta-col">${item.resposta}</td>
    </tr>
  `).join('');

  const sugestoesHTML = contrasLista.length > 0
    ? `
      <div class="suggestions">
        <strong>Pontos de atenção:</strong>
        <ul>
          ${contrasLista.map(item => `
            <li><strong>${item.pergunta}</strong>: "${item.resposta}"</li>
          `).join('')}
        </ul>
      </div>
    `
    : "";

  document.getElementById("result").innerHTML = `
    <div class="dashboard-card">
      <h2>Resultado Individual</h2>
      <div class="resumo-percentual">
        ${pctPro}% Satisfeito • ${pctContra}% Insatisfeito<br/>
        Participante: ${nomeDoParticipante}
      </div>

      <div class="grafico-wrapper">
        <canvas id="graficoPizza"></canvas>
      </div>

      <div class="table-wrapper">
        <table class="survey-table">
          <thead>
            <tr>
              <th class="pergunta-col">Pergunta</th>
              <th>Resposta</th>
            </tr>
          </thead>
          <tbody>
            ${linhasTabela}
          </tbody>
        </table>
      </div>

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
    options: {
      responsive: false,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 12,
            font: { size: 12 }
          }
        }
      }
    }
  });
}


// =========================
// MOSTRAR GRUPO (com senha)
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

    const respostasObjExemplo = snapshot.docs[0].data().respostas;
    const perguntasKeys = Object
      .keys(respostasObjExemplo)
      .filter(k => k !== 'sugestao')
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .concat('sugestao');

    let blocosParticipantes = "";

    snapshot.forEach(doc => {
      const { nome, respostas } = doc.data();
      let pro = 0, contra = 0;

      let linhasPessoa = "";
      perguntasKeys.forEach(key => {
        const resp = respostas[key];
        if (!resp) return;

        linhasPessoa += `
          <tr>
            <td class="pergunta-col">${resp.pergunta}</td>
            <td class="resposta-col">${resp.resposta || '-'}</td>
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
        <div style="margin-bottom:24px;">
          <div style="font-weight:600; font-size:0.95rem; margin-bottom:8px; color:#111;">
            ${nome}
          </div>
          <div class="table-wrapper">
            <table class="survey-table">
              <thead>
                <tr>
                  <th class="pergunta-col">Pergunta</th>
                  <th>Resposta</th>
                </tr>
              </thead>
              <tbody>
                ${linhasPessoa}
              </tbody>
            </table>
          </div>
        </div>
      `;
    });

    const mediaPro = participantes > 0 ? Math.round(totalPro / participantes) : 0;
    const mediaContra = 100 - mediaPro;

    document.getElementById("result").innerHTML = `
      <div class="dashboard-card">
        <h2>Análise do Grupo</h2>
        <div class="resumo-percentual">
          Média do grupo: ${mediaPro}% Satisfeito • ${mediaContra}% Insatisfeito
        </div>

        <div class="grafico-wrapper">
          <canvas id="graficoGrupo"></canvas>
        </div>

        ${blocosParticipantes}
      </div>
    `;

    new Chart(document.getElementById("graficoGrupo"), {
      type: "pie",
      data: {
        labels: ["Satisfeito", "Insatisfeito"],
        datasets: [{
          data: [mediaPro, mediaContra],
          backgroundColor: ["#2ecc71", "#e74c3c"]
        }]
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              boxWidth: 12,
              font: { size: 12 }
            }
          }
        }
      }
    });
  });
}


// =========================
// LIMPAR DADOS (com senha)
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
