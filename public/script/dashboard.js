document.addEventListener("DOMContentLoaded", async function () {
    const ctx = document.getElementById("graficoBarras").getContext("2d");
  
    function getCorPorMes(dataString) {
      const data = new Date(dataString);
      const mes = data.getMonth(); // 0 = jan, 4 = maio
      if (mes === 3) return '#F2A80D'; // Abril
      if (mes === 4) return '#FF6600'; // Maio
      return '#FFD700'; // padrão
    }
  
    try {
      const resposta = await fetch("/dados-apresentacoes-semana");
      const dadosApi = await resposta.json(); // [{ label, total, dataRef }]
  
      const labels = dadosApi.map(item => item.label);
      const dados = dadosApi.map(item => item.total);
      const cores = dadosApi.map(item => getCorPorMes(item.dataRef));
  
      new Chart(ctx, {
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
              font: {
                size: 22,
                weight: 'bold'
              },
              formatter: function (value) {
                return value === 0 ? '' : value;}

            }
          }
        },
        plugins: [ChartDataLabels]
      });
    } catch (erro) {
      console.error("❌ Erro ao carregar gráfico:", erro);
    }
  });
  