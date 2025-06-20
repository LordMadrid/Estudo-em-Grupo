
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
  if (!userName) return alert('Por favor, insira seu nome.');

  const selects = [...document.querySelectorAll("select")];
  let pro = 0, contra = 0;
  const respostas = {};
  const contrasLista = [];

  selects.forEach((el, i) => {
    const val = el.value;
    const text = el.options[el.selectedIndex].text;
    const question = el.previousElementSibling.textContent;
    respostas['q' + (i+1)] = { pergunta: question, resposta: text, valor: val };

    if (val === 'pro') pro++;
    if (val === 'contra') contrasLista.push({ pergunta: question, resposta: text });
    if (val === 'contra') contra++;
  });

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

    const perguntas = Object.values(snapshot.docs[0].data().respostas).map(r => r.pergunta);
    perguntas.forEach(p => html += `<th>${p}</th>`);
    html += `</tr></thead><tbody>`;

    snapshot.forEach(doc => {
      const { nome, respostas } = doc.data();
      let pro = 0, contra = 0;
      html += `<tr><td>${nome}</td>`;

      Object.values(respostas).forEach(resp => {
        html += `<td>${resp.resposta}</td>`;
        if (resp.valor === "pro") pro++;
        if (resp.valor === "contra") contra++;
      });

      const total = pro + contra;
      if (total > 0) {
        totalPro += Math.round((pro * 100) / total);
        totalContra += Math.round((contra * 100) / total);
        participantes++;
      }

      html += `</tr>`;
    });

    html += `</tbody></table><canvas id="graficoGrupo" width="300" height="300" style="margin-top:30px;"></canvas>`;

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

// fundo animado
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');
let balls = [];
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
for (let i = 0; i < 60; i++) {
  balls.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, r: Math.random()*15+5, dx: Math.random()*0.5-0.25, dy: Math.random()*0.5-0.25 });
}
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let b of balls) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, 2*Math.PI);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fill();
    b.x += b.dx; b.y += b.dy;
    if (b.x < 0 || b.x > canvas.width) b.dx *= -1;
    if (b.y < 0 || b.y > canvas.height) b.dy *= -1;
  }
  requestAnimationFrame(animate);
}
animate();
