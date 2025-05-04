document.addEventListener("DOMContentLoaded", function () {
    const ctx = document.getElementById("graficoBarras").getContext("2d");
  
    const hoje = new Date();
    const labels = [];
    const dados = [12, 19, 10, 5, 8, 13, 7, 15];
    const cores = [];
  
    function getCorPorMes(data) {
      const mes = data.getMonth(); // 0 = jan, 4 = maio
      if (mes === 3) return '#F2A80D'; // Abril - amarelo
      if (mes === 4) return '#FF6600'; // Maio - vermelho escuro
      return '#FFD700'; // cor padrão para outros meses
    }
  
    for (let i = 7; i >= 0; i--) {
      const dataRef = new Date();
      dataRef.setDate(hoje.getDate() - i * 7);
  
      const label = i === 0 ? "Essa Semana" : `há ${i} semanas`;
      labels.push(label);
      cores.push(getCorPorMes(dataRef));
    }
  
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
            color: 'black',
            anchor: 'end',
            align: 'start',
            font: {
              size: 22,
              weight: 'bold'
            }
          }
        }
      },
      plugins: [ChartDataLabels]
    });
  });
  