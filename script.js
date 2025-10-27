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
    resposta: sugestao,
    valor: "neutro"
  };

  // Salvar no Firestore
  db.collection("respostas").add({
    nome: userName,
    data: new Date().toISOString(),
    respostas: respostas
  });

  const total = pro + contra;
  const pctPro = total ? Math.round((pro * 100) / total) : 0;
  const pctContra = 100 - pctPro;

  // Montar tabela com as respostas individuais
  let tabelaHTML = `
    <table>
      <thead>
        <tr>
          <th>Pergunta</th>
          <th>Resposta</th>
        </tr>
      </thead>
      <tbody>
  `;
  Object.values(respostas).forEach(item => {
    tabelaHTML += `
      <tr>
        <td>${item.pergunta}</td>
        <td>${item.resposta}</td>
      </tr>
    `;
  });
  tabelaHTML += `</tbody></table>`;

  // Montar caixa de sugestões (pontos marcados como "contra")
  let sugestoesHTML = "";
  if (contrasLista.length > 0) {
    sugestoesHTML = `
      <div class="suggestions">
        <strong>Sugestões de melhoria:</strong>
        <ul>
    `;
    contrasLista.forEach(item => {
      sugestoesHTML += `
        <li><strong>${item.pergunta}</strong>: Considere discutir com a equipe sobre melhorias neste ponto.</li>
      `;
    });
    sugestoesHTML += `</ul></div>`;
  }

  // Renderizar tudo no #result com visual de card
  document.getElementById("result").innerHTML = `
    <div class="dashboard-card">
      <h2>Resultado da Análise</h2>
      <p><strong>${pctPro}% Satisfeito</strong> vs <strong>${pctContra}% Insatisfeito</strong></p>

      <div class="grafico-wrapper">
        <canvas id="graficoPizza"></canvas>
      </div>

      ${tabelaHTML}
      ${sugestoesHTML}
    </div>
  `;

  // Criar gráfico de pizza individual (tamanho controlado pelo CSS .grafico-wrapper)
  new Chart(document.getElementById("graficoPizza"), {
    type: "pie",
    data: {
      labels: ["Satisfeito", "Insatisfeito"],
      datasets: [{
        data: [pctPro, pctContra],
        backgroundColor: ["#3498db", "#e74c3c"]
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

    // Começa a montar a tabela do grupo
    let htmlTabela = `<h2>Análise do Grupo</h2><table><thead><tr><th>Nome</th>`;

    // Usa o primeiro documento pra descobrir quais perguntas existem e manter as colunas consistentes
    const respostasObj = snapshot.docs[0].data().respostas;

    // Garante ordem q1, q2, q3... q8, depois sugestao
    const perguntasKeys = Object
      .keys(respostasObj)
      .filter(k => k !== 'sugestao')
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .concat('sugestao');

    const perguntas = perguntasKeys.map(key => respostasObj[key].pergunta);

    // Cabeçalho da tabela com todas as perguntas
    perguntas.forEach(p => {
      htmlTabela += `<th>${p}</th>`;
    });
    htmlTabela += `</tr></thead><tbody>`;

    // Para cada resposta salva no banco, cria uma linha
    snapshot.forEach(doc => {
      const { nome, respostas } = doc.data();
      let pro = 0, contra = 0;

      htmlTabela += `<tr><td>${nome}</td>`;

      perguntasKeys.forEach(key => {
        const resp = respostas[key];
        htmlTabela += `<td>${resp?.resposta || '-'}</td>`;
        if (resp?.valor === "pro") pro++;
        if (resp?.valor === "contra") contra++;
      });

      // calcula % individual e acumula pra média
      const total = pro + contra;
      if (total > 0) {
        totalPro += Math.round((pro * 100) / total);
        totalContra += Math.round((contra * 100) / total);
        participantes++;
      }

      htmlTabela += `</tr>`;
    });

    htmlTabela += `</tbody></table>`;

    // médias gerais do grupo
    const mediaPro = participantes > 0 ? Math.round(totalPro / participantes) : 0;
    const mediaContra = 100 - mediaPro;

    // injeta o card completo no #result
    document.getElementById("result").innerHTML = `
      <div class="dashboard-card">
        ${htmlTabela}

        <div class="grafico-wrapper" style="margin-top:30px;">
          <canvas id="graficoGrupo"></canvas>
        </div>
      </div>
    `;

    // gráfico do grupo
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

