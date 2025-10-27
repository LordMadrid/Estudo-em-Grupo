// Configuração do Firebase
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

function analisar() {
  const userName = document.getElementById('userName').value.trim();
  const sugestao = document.getElementById('sugestaoInput').value.trim();
  if (!userName) return alert('Por favor, insira seu nome.');

  const selects = [...document.querySelectorAll("select[name^='q']")];
  let pro = 0, contra = 0;
  const respostas = {};
  const contrasLista = [];

  // coleta respostas
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

  // sugestão aberta
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

  // calcula % de satisfação individual
  const total = pro + contra;
  const pctPro = total ? Math.round((pro * 100) / total) : 0;
  const pctContra = 100 - pctPro;

  // monta linhas da tabela Pergunta | Resposta
  const linhasTabela = Object.values(respostas).map(item => `
    <tr>
      <td class="pergunta-col">${item.pergunta}</td>
      <td class="resposta-col">${item.resposta}</td>
    </tr>
  `).join('');

  // bloco de sugestões (só se tiver "contra")
  const sugestoesHTML = contrasLista.length > 0 ? `
    <div class="suggestions">
      <strong>Pontos de atenção:</strong>
      <ul>
        ${contrasLista.map(item => `
          <li><strong>${item.pergunta}</strong>: "${item.resposta}"</li>
        `).join('')}
      </ul>
    </div>
  ` : "";

  // renderiza resultado no card
  document.getElementById("result").innerHTML = `
    <div class="dashboard-card">
      <h2>Resultado Individual</h2>
      <div class="resumo-percentual">
        ${pctPro}% Satisfeito • ${pctContra}% Insatisfeito
      </div>

      <!-- gráfico agora vem primeiro -->
      <div class="grafico-wrapper" style="margin: 12px auto 24px auto;">
        <canvas id="graficoPizza"></canvas>
      </div>

      <!-- tabela de respostas -->
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

  // cria o gráfico de pizza (pequeno e centralizado)
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

    // vamos usar o primeiro doc pra saber quais perguntas existem
    const respostasObjExemplo = snapshot.docs[0].data().respostas;

    const perguntasKeys = Object
      .keys(respostasObjExemplo)
      .filter(k => k !== 'sugestao')
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .concat('sugestao');

    // gerar bloco de cada participante com tabela Pergunta | Resposta
    let blocosParticipantes = "";

    snapshot.forEach(doc => {
      const { nome, respostas } = doc.data();
      let pro = 0, contra = 0;

      // monta tabela vertical dessa pessoa
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

      // bloco dessa pessoa
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

    // média geral do grupo
    const mediaPro = participantes > 0 ? Math.round(totalPro / participantes) : 0;
    const mediaContra = 100 - mediaPro;

    // *** AQUI VEM A MUDANÇA IMPORTANTE ***
    // gráfico agora vai sozinho lá em cima, e os blocos vêm DEPOIS
    document.getElementById("result").innerHTML = `
      <div class="dashboard-card">
        <h2>Análise do Grupo</h2>
        <div class="resumo-percentual">
          Média do grupo: ${mediaPro}% Satisfeito • ${mediaContra}% Insatisfeito
        </div>

        <!-- gráfico AGORA FICA EM CIMA -->
        <div class="grafico-wrapper" style="margin: 12px auto 24px auto;">
          <canvas id="graficoGrupo"></canvas>
        </div>

        <!-- depois do gráfico, um bloco por participante -->
        ${blocosParticipantes}
      </div>
    `;

    // cria gráfico pizza da média do grupo
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
