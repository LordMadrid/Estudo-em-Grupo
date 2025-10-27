// =========================
// ESTADO GLOBAL
// =========================

let nomeDoParticipante = "Anônimo"; // usado ao salvar e exibir
let querSeIdentificar = false;      // true = vai informar nome, false = anônimo


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
// TELA INICIAL (LOBBY)
// =========================

// Chamada ao clicar em "Quero me identificar"
function definirIdentificacao(valor) {
  // valor: true (identificar) ou false (anônimo)
  querSeIdentificar = valor;

  const nomeWrapper = document.getElementById("nomeWrapper");

  if (querSeIdentificar) {
    // mostra o campo de nome
    nomeWrapper.style.display = "block";
  } else {
    // esconde o campo de nome e limpa
    nomeWrapper.style.display = "none";
    const nomeInput = document.getElementById("lobbyNomeInput");
    if (nomeInput) nomeInput.value = "";
  }
}

// Chamada ao clicar em "Começar questionário"
function entrarNoQuestionario() {
  if (querSeIdentificar) {
    // se a pessoa escolheu se identificar, precisamos do nome
    const nomeDigitado = document.getElementById("lobbyNomeInput").value.trim();
    if (!nomeDigitado) {
      alert("Por favor, insira seu nome ou escolha responder como anônimo.");
      return;
    }
    nomeDoParticipante = nomeDigitado;
  } else {
    nomeDoParticipante = "Anônimo";
  }

  // Esconde a tela inicial e mostra o questionário
  document.getElementById("lobbySection").style.display = "none";
  document.getElementById("questionarioSection").style.display = "block";

  // Sobe pro topo quando mudar de tela
  window.scrollTo(0, 0);
}


// =========================
/* ANALISAR (RESULTADO INDIVIDUAL)
   - Lê respostas do formulário
   - Salva no Firestore
   - Monta o dashboard individual com gráfico e tabela
*/
// =========================
function analisar() {
  // Nome já está decidido no lobby
  const userName = nomeDoParticipante;

  const sugestao = document.getElementById('sugestaoInput').value.trim();

  // pega todos os <select name="q1"...>
  const selects = [...document.querySelectorAll("select[name^='q']")];

  let pro = 0;
  let contra = 0;
  const respostas = {};
  const contrasLista = []; // perguntas marcadas como "contra"

  selects.forEach((el) => {
    const val = el.value; // "pro", "contra", "neutro"
    const text = el.options[el.selectedIndex].text; // texto visível ("Satisfeito", etc)
    const question = el.previousElementSibling.textContent; // texto da <label>
    const nameAttr = el.getAttribute("name"); // "q1", "q2", ...

    respostas[nameAttr] = {
      pergunta: question,
      resposta: text,
      valor: val
    };

    if (val === 'pro') {
      pro++;
    }
    if (val === 'contra') {
      contrasLista.push({ pergunta: question, resposta: text });
      contra++;
    }
  });

  // inclui sugestão aberta como mais uma "pergunta"
  respostas["sugestao"] = {
    pergunta: "Sugestão de melhoria",
    resposta: sugestao || "(sem sugestão)",
    valor: "neutro"
  };

  // salva no Firestore
  db.collection("respostas").add({
    nome: userName,
    data: new Date().toISOString(),
    respostas: respostas
  });

  // calcula % satisfação individual
  const total = pro + contra;
  const pctPro = total ? Math.round((pro * 100) / total) : 0;
  const pctContra = 100 - pctPro;

  // monta tabela Pergunta | Resposta
  const linhasTabela = Object.values(respostas).map(item => `
    <tr>
      <td class="pergunta-col">${item.pergunta}</td>
      <td class="resposta-col">${item.resposta}</td>
    </tr>
  `).join('');

  // bloco adicional para pontos de atenção (respostas "contra")
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

  // renderiza o resultado individual no container #result
  document.getElementById("result").innerHTML = `
    <div class="dashboard-card">
      <h2>Resultado Individual</h2>
      <div class="resumo-percentual">
        ${pctPro}% Satisfeito • ${pctContra}% Insatisfeito<br/>
        Participante: ${userName}
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

  // gráfico individual
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
/* MOSTRAR GRUPO
   - Pede senha
   - Busca todos do Firestore
   - Calcula média de satisfação
   - Mostra gráfico + cada pessoa com suas respostas
*/
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

    let totalPro = 0;
    let totalContra = 0;
    let participantes = 0;

    // pega as chaves das perguntas a partir do primeiro registro
    const respostasObjExemplo = snapshot.docs[0].data().respostas;
    const perguntasKeys = Object
      .keys(respostasObjExemplo)
      .filter(k => k !== 'sugestao')
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .concat('sugestao');

    // blocosParticipantes terá um bloco (tabela) por pessoa
    let blocosParticipantes = "";

    snapshot.forEach(doc => {
      const { nome, respostas } = doc.data();
      let pro = 0;
      let contra = 0;

      // constrói linhas "Pergunta | Resposta" dessa pessoa
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

      // calcula % individual dessa pessoa e acumula na média
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

    // calcula a média geral do grupo
    const mediaPro = participantes > 0 ? Math.round(totalPro / participantes) : 0;
    const mediaContra = 100 - mediaPro;

    // renderiza painel do grupo
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

    // gráfico da média do grupo
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
// LIMPAR DADOS DO FIRESTORE
// =========================
function limparDados() {
  if (!confirm("Tem certeza que deseja apagar todos os dados?")) return;

  db.collection("respostas").get().then(snapshot => {
    const batch = db.batch();
    snapshot.forEach(doc => batch.delete(doc.ref));
    return batch.commit();
  }).then(() => {
    alert("Todos os dados foram apagados.");
  });
}
