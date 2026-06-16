let chartInstance = null;

/**
 * Inicializa un gráfico de Chart.js con configuraciones estéticas de alta calidad.
 * @param {string} canvasId - El ID del elemento canvas en el DOM.
 * @param {string} label - Etiqueta descriptiva para el conjunto de datos.
 * @param {Array} dataPoints - Arreglo de objetos { timestamp, value }.
 * @param {string} unit - Unidad de medida para mostrar en los tooltips.
 * @returns {Object} Instancia del gráfico creado.
 */
export function initChart(canvasId, label, dataPoints, unit) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const ctx = canvas.getContext('2d');
  
  // Destruir la instancia previa para evitar sobreexposición de gráficos
  if (chartInstance) {
    chartInstance.destroy();
  }
  
  const labels = dataPoints.map(p => p.timestamp);
  const values = dataPoints.map(p => p.value);
  
  // Crear degradado elegante para el área bajo la curva
  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
  gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

  // Configuración de Chart.js
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: label,
        data: values,
        borderColor: '#10b981',
        borderWidth: 2,
        backgroundColor: gradient,
        fill: true,
        tension: 0.4, // Suaviza la línea
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#080c0a',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#34d399',
        pointHoverBorderColor: '#080c0a',
        pointHoverBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(14, 22, 17, 0.95)',
          titleColor: '#9ca3af',
          titleFont: {
            family: 'Plus Jakarta Sans',
            size: 11,
            weight: 'normal'
          },
          bodyColor: '#f3f4f6',
          bodyFont: {
            family: 'Plus Jakarta Sans',
            size: 14,
            weight: 'bold'
          },
          borderColor: 'rgba(16, 185, 129, 0.25)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            label: function(context) {
              return ` ${context.parsed.y} ${unit}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.03)',
            drawBorder: false
          },
          ticks: {
            color: '#9ca3af',
            font: {
              family: 'Plus Jakarta Sans',
              size: 11
            }
          }
        },
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.04)',
            drawBorder: false
          },
          ticks: {
            color: '#9ca3af',
            font: {
              family: 'Plus Jakarta Sans',
              size: 11
            }
          }
        }
      }
    }
  });

  return chartInstance;
}

/**
 * Actualiza el gráfico con nuevos puntos de datos sin rediseñarlo completamente.
 * @param {Array} dataPoints - Arreglo de objetos { timestamp, value }.
 */
export function updateChart(dataPoints) {
  if (!chartInstance) return;
  
  chartInstance.data.labels = dataPoints.map(p => p.timestamp);
  chartInstance.data.datasets[0].data = dataPoints.map(p => p.value);
  
  // Usamos 'none' para que no haya parpadeos abruptos y se actualice suavemente
  chartInstance.update('none');
}
