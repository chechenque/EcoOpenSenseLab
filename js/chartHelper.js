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
  
  // Obtener variables de colores de CSS dinámicamente
  const computedStyle = getComputedStyle(document.documentElement);
  const gridColor = computedStyle.getPropertyValue('--chart-grid').trim() || 'rgba(0, 0, 0, 0.05)';
  const ticksColor = computedStyle.getPropertyValue('--chart-ticks').trim() || '#64748b';
  const tooltipBg = computedStyle.getPropertyValue('--tooltip-bg').trim() || '#0f172a';
  const tooltipBorder = computedStyle.getPropertyValue('--tooltip-border').trim() || 'rgba(16, 185, 129, 0.2)';
  const accentPrimary = computedStyle.getPropertyValue('--accent-primary').trim() || '#059669';
  const textPrimary = computedStyle.getPropertyValue('--text-primary').trim() || '#0f172a';
  
  // Crear degradado elegante para el área bajo la curva
  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, accentPrimary + '40'); // ~25% de opacidad
  gradient.addColorStop(1, accentPrimary + '00'); // 0% de opacidad

  // Configuración de Chart.js
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: label,
        data: values,
        borderColor: accentPrimary,
        borderWidth: 2.5,
        backgroundColor: gradient,
        fill: true,
        tension: 0.4, // Suaviza la línea
        pointBackgroundColor: accentPrimary,
        pointBorderColor: computedStyle.getPropertyValue('--bg-surface').trim() || '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: accentPrimary,
        pointHoverBorderColor: computedStyle.getPropertyValue('--bg-surface').trim() || '#ffffff',
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
          backgroundColor: tooltipBg,
          titleColor: ticksColor,
          titleFont: {
            family: 'Plus Jakarta Sans',
            size: 11,
            weight: 'normal'
          },
          bodyColor: computedStyle.getPropertyValue('--text-primary').trim() || '#ffffff',
          bodyFont: {
            family: 'Plus Jakarta Sans',
            size: 14,
            weight: 'bold'
          },
          borderColor: tooltipBorder,
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
            color: gridColor,
            drawBorder: false
          },
          ticks: {
            color: ticksColor,
            font: {
              family: 'Plus Jakarta Sans',
              size: 11
            }
          }
        },
        y: {
          grid: {
            color: gridColor,
            drawBorder: false
          },
          ticks: {
            color: ticksColor,
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
