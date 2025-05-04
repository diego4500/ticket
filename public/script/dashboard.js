let graficoApresentacoes = null;

async function buscarEDesenharGrafico() {
  try {
    const ctx = document.getElementById("graficoBarras").getContext("2d");
    const resposta = await fetch("/dados-apresentacoes-semana");
    const dadosApi = await resposta.json();

    const labels = dadosApi.map(item => item.label);
    const dados = dadosApi.map(item => item.total);
    const cores = dadosApi.map(item => getCorPorMes(item.dataRef));

    if (graficoApresentacoes) {
      // Atualiza o gráfico existente
      graficoApresentacoes.data.labels = labels;
      graficoApresentacoes.data.datasets[0].data = dados;
      graficoApresentacoes.data.datasets[0].backgroundColor = cores;
      graficoApresentacoes.update();
    } else {
      // Cria o gráfico se ainda não existir
      graficoApresentacoes = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
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

function getCorPorMes(dataString) {
  const data = new Date(dataString);
  const mes = data.getMonth();
  if (mes === 3) return '#F2A80D'; // Abril
  if (mes === 4) return '#FF6600'; // Maio
  return '#FFD700';
}

// Inicializa e atualiza a cada 60 segundos
document.addEventListener("DOMContentLoaded", () => {
  buscarEDesenharGrafico();
  setInterval(buscarEDesenharGrafico, 10000); // 60 segundos
});
