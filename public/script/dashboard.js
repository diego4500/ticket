let graficoApresentacoes = null;
let dadosApiGlobal = [];

function getCorPorMes(dataString, opacidade = 1) {
    const data = new Date(dataString);
    const mes = data.getMonth();
  
    if (mes === 3) return `rgba(0, 102, 255, ${opacidade})`; // Abril (#0066FF)
    if (mes === 4) return `rgba(0, 0, 255, ${opacidade})`;    // Maio (#0000FF)
    return `rgba(0, 153, 255, ${opacidade})`;                 // padrão (#0099FF)
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

document.addEventListener("DOMContentLoaded", () => {
  buscarEDesenharGrafico();
  setInterval(buscarEDesenharGrafico, 10000); // atualiza dados a cada 10s
});

// ✅ ANIMAÇÃO DA ÚLTIMA BARRA
let opacidadeAtual = 1;
let diminuindo = true;

setInterval(() => {
  if (!graficoApresentacoes || !dadosApiGlobal.length) return;

  opacidadeAtual += diminuindo ? -0.05 : 0.05;
  if (opacidadeAtual <= 0.4) diminuindo = false;
  if (opacidadeAtual >= 1) diminuindo = true;

  const novasCores = dadosApiGlobal.map((item, index, arr) => {
    const opacidade = index === arr.length - 1 ? opacidadeAtual : 1;
    return getCorPorMes(item.dataRef, opacidade);
  });

  graficoApresentacoes.data.datasets[0].backgroundColor = novasCores;
  graficoApresentacoes.update('none');
}, 150);
