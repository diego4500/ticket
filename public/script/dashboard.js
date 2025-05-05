let graficoApresentacoes = null;
let graficoClientesAtivos = null;

let dadosApiGlobal = [];


function getCorPorMes(dataString, opacidade = 0.8) {
    const data = new Date(dataString);
    const mes = data.getMonth();
  
    if (mes === 3) return `rgba(0, 102, 255, ${opacidade})`; // Abril
    if (mes === 4) return `rgba(0, 0, 255, ${opacidade})`;   // Maio
    return `rgba(0, 153, 255, ${opacidade})`;                // Padrão
  }
  
  
  
  

async function buscarEDesenharGrafico() {
  try {
    const ctx = document.getElementById("graficoBarras").getContext("2d");
    const resposta = await fetch("/dados-apresentacoes-semana");
    const dadosApi = await resposta.json();
    dadosApiGlobal = dadosApi; // atualiza global para animação usar

    const labels = dadosApi.map(item => item.label);
    const dados = dadosApi.map(item => item.total);
    const cores = dadosApi.map(item => getCorPorMes(item.dataRef));

    if (graficoApresentacoes) {
      graficoApresentacoes.data.labels = labels;
      graficoApresentacoes.data.datasets[0].data = dados;
      graficoApresentacoes.data.datasets[0].backgroundColor = cores;
      graficoApresentacoes.update();
    } else {
      graficoApresentacoes = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Nº de Apresentações por Semana',
            data: dados,
            backgroundColor: cores,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: { color: 'white' },
              grid: { color: '#999999' }
            },
            x: {
              ticks: { color: 'white' },
              grid: { display: false }
            }
          },
          plugins: {
            legend: {
              labels: { color: 'white' }
            },
            datalabels: {
              color: 'white',
              anchor: 'end',
              align: 'start',
              font: { size: 22, weight: 'bold' },
              formatter: value => value === 0 ? '' : value
            }
          }
        },
        plugins: [ChartDataLabels]
      });
    }
  } catch (erro) {
    console.error("❌ Erro ao atualizar gráfico:", erro);
  }
}



// ✅ ANIMAÇÃO DA ÚLTIMA BARRA
let opacidadeAtual = 1;
let diminuindo = true;

setInterval(() => {
  if (!graficoApresentacoes || !dadosApiGlobal.length) return;

  opacidadeAtual += diminuindo ? -0.05 : 0.05;
  if (opacidadeAtual <= 0.4) diminuindo = false;
  if (opacidadeAtual >= 1) diminuindo = true;

  const novasCores = dadosApiGlobal.map((item, index, arr) => {
    const opacidade = index === arr.length - 1 ? opacidadeAtual : 0.8;

    return getCorPorMes(item.dataRef, opacidade);
  });

  graficoApresentacoes.data.datasets[0].backgroundColor = novasCores;
  graficoApresentacoes.update('none');
}, 150);


// gráfico clientes ativos do mês

async function desenharGraficoClientesAtivos() {
    try {
      const ctx = document.getElementById("graficoClientes").getContext("2d");
      const resposta = await fetch("/clientes-ativos-mensal");
      const dados = await resposta.json();
  
      const labels = dados.map(item => {
        const data = new Date(item.data_cadastro);
        return data.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
      });
  
      const valores = dados.map(item => item.resultado);
  
      if (graficoClientesAtivos) {
        graficoClientesAtivos.data.labels = labels;
        graficoClientesAtivos.data.datasets[0].data = valores;
        graficoClientesAtivos.update();
      } else {
        graficoClientesAtivos = new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: 'Clientes Ativos por Mês',
              data: valores,
              backgroundColor: 'rgba(44, 52, 201, 0.8)',
              borderColor: 'rgba(44, 52, 201, 1)',
              tension: 0.3,
              fill: true,
              pointRadius: 5,
              pointHoverRadius: 7
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                ticks: { color: 'white' },
                grid: { color: '#999' }
              },
              x: {
                ticks: { color: 'white' },
                grid: { display: false }
              }
            },
            plugins: {
              legend: {
                labels: { color: 'white' }
              },
              datalabels: {
                color: 'white',
                anchor: 'end',
                align: 'top',
                font: { size: 14, weight: 'bold' },
                formatter: value => value === 0 ? '' : value
              }
            }
          },
          plugins: [ChartDataLabels]
        });
      }
  
    } catch (err) {
      console.error("Erro ao gerar gráfico de clientes ativos:", err);
    }
  }
  
  

  

  async function carregarTicketsAbertosDiego() {
    try {
      const resposta = await fetch("/tickets-abertos-diego");
      const dados = await resposta.json();
  
      const span = document.getElementById("diego");
      if (span) span.textContent = dados.total;
    } catch (erro) {
      console.error("❌ Erro ao carregar tickets abertos do Diego:", erro);
    }
  }

  async function carregarTicketsAbertosCassio() {
    try {
      const resposta = await fetch("/tickets-abertos-cassio");
      const dados = await resposta.json();
  
      const span = document.getElementById("cassio");
      if (span) span.textContent = dados.total;
    } catch (erro) {
      console.error("❌ Erro ao carregar tickets abertos do Cassio:", erro);
    }
  }

  async function carregarClientesDoMes() {
    try {
      const resposta = await fetch("/clientes-mes");
      const dados = await resposta.json();
  
      const span = document.getElementById("clienteMes");
      if (span) span.textContent = dados.total;
    } catch (erro) {
      console.error("❌ Erro ao carregar clientes do mês:", erro);
    }
  }

  async function carregarChurnsDoMes() {
    try {
      const resposta = await fetch("/churns-mes");
      const dados = await resposta.json();
  
      const span = document.getElementById("churnMes");
      if (span) span.textContent = dados.total;
    } catch (erro) {
      console.error("❌ Erro ao carregar churns do mês:", erro);
    }
  }

  function atualizarDashboard() {
    buscarEDesenharGrafico();
    desenharGraficoClientesAtivos();
    carregarTicketsAbertosDiego();
    carregarTicketsAbertosCassio();
    carregarClientesDoMes();
    carregarChurnsDoMes();
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    atualizarDashboard(); // executa na primeira vez
  
    setInterval(atualizarDashboard, 10000); // repete a cada 10 segundos
  });
  
  
  