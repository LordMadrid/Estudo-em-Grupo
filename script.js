
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
    respostas[nameAttr] = { pergunta: question, resposta: text, valor: val };

    if (val === 'pro') pro++;
    if (val === 'contra') contrasLista.push({ pergunta: question, resposta: text });
    if (val === 'contra') contra++;
  });

  respostas["sugestao"] = {
    pergunta: "Sugestão de melhoria",
    resposta: sugestao,
    valor: "neutro"
  };

  db.collection("respostas").add({
    nome: userName,
    data: new Date().toISOString(),
    respostas: respostas
  });

  const total = pro + contra;
  const pctPro = total ? Math.round((pro * 100) / total) : 0;
  const pctContra = 100 - pctPro;

  let tabelaHTML = `<table><thead><tr><th>Pergunta</th><th>Resposta</th></tr></thead><tbody>`;
  Object.values(respostas).forEach(item => {
    tabelaHTML += `<tr><td>${item.pergunta}</td><td>${item.resposta}</td></tr>`;
  });
  tabelaHTML += `</tbody></table>`;

  let sugestoesHTML = "";
  if (contrasLista.length > 0) {
    sugestoesHTML = `<div class="suggestions"><strong>Sugestões de melhoria:</strong><ul>`;
    contrasLista.forEach(item => {
      sugestoesHTML += `<li><strong>${item.pergunta}</strong>: Considere discutir com a equipe sobre melhorias neste ponto.</li>`;
    });
    sugestoesHTML += `</ul></div>`;
  }

  document.getElementById("result").innerHTML = `
    <h2>Resultado da Análise</h2>
    <p><strong>${pctPro}% Satisfeito</strong> vs <strong>${pctContra}% Insatisfeito</strong></p>
    <canvas id="graficoPizza" width="300" height="300"></canvas>
    ${tabelaHTML}
    ${sugestoesHTML}
  `;

  new Chart(document.getElementById("graficoPizza"), {
    type: "pie",
    data: {
      labels: ["Satisfeito", "Insatisfeito"],
      datasets: [{
        data: [pctPro, pctContra],
        backgroundColor: ["#3498db", "#e74c3c"]
      }]
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
    if (snapshot.empty) return alert("Nenhum dado encontrado.");

    let totalPro = 0, totalContra = 0, participantes = 0;
    let html = `<h2>Análise do Grupo</h2><table><thead><tr><th>Nome</th>`;

    const respostasObj = snapshot.docs[0].data().respostas;
    const perguntasKeys = Object.keys(respostasObj)
      .filter(k => k !== 'sugestao')
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .concat('sugestao');

    const perguntas = perguntasKeys.map(key => respostasObj[key].pergunta);
    perguntas.forEach(p => html += `<th>${p}</th>`);
    html += `</tr></thead><tbody>`;

    snapshot.forEach(doc => {
      const { nome, respostas } = doc.data();
      let pro = 0, contra = 0;
      html += `<tr><td>${nome}</td>`;

      perguntasKeys.forEach(key => {
        const resp = respostas[key];
        html += `<td>${resp?.resposta || '-'}</td>`;
        if (resp?.valor === "pro") pro++;
        if (resp?.valor === "contra") contra++;
      });

      const total = pro + contra;
      if (total > 0) {
        totalPro += Math.round((pro * 100) / total);
        totalContra += Math.round((contra * 100) / total);
        participantes++;
      }

      html += `</tr>`;
    });

    html += `</tbody></table><canvas id="graficoGrupo" width="200" height="200" style="margin-top:30px;"></canvas>`;

    const mediaPro = Math.round(totalPro / participantes);
    const mediaContra = 100 - mediaPro;

    document.getElementById("result").innerHTML = html;

    new Chart(document.getElementById("graficoGrupo"), {
      type: "pie",
      data: {
        labels: ["Satisfeito", "Insatisfeito"],
        datasets: [{
          data: [mediaPro, mediaContra],
          backgroundColor: ["#2ecc71", "#e74c3c"]
        }]
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
  }).then(() => alert("Todos os dados foram apagados."));
}
