import { getSensors, getSensorById } from './js/sensorRegistry.js';
import { initChart, updateChart } from './js/chartHelper.js';

// --- ESTADO DE LA APLICACIÓN ---
let activeSensor = null;
let currentTimeframe = 'live';
let homeIntervalId = null;
let detailIntervalId = null;
let detailDataBuffer = []; // Mantiene los datos en memoria para actualizar el gráfico en tiempo real

// --- ELEMENTOS DEL DOM ---
const homeView = document.getElementById('homeView');
const detailView = document.getElementById('detailView');
const sensorsGrid = document.getElementById('sensorsGrid');
const backToHomeBtn = document.getElementById('backToHomeBtn');

// Detalle del Sensor
const detailTitle = document.getElementById('detailTitle');
const detailCategory = document.getElementById('detailCategory');
const detailIconWrapper = document.getElementById('detailIconWrapper');
const detailLiveValue = document.getElementById('detailLiveValue');
const detailLiveUnit = document.getElementById('detailLiveUnit');
const technicalSpecs = document.getElementById('technicalSpecs');
const arduinoCodeSnippet = document.getElementById('arduinoCodeSnippet');
const copyCodeBtn = document.getElementById('copyCodeBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');

// Notificaciones
const toastNotification = document.getElementById('toastNotification');
const toastMessage = document.getElementById('toastMessage');

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
  renderHomeGrid();
  startHomeLiveUpdates();
  setupEventListeners();
  
  // Procesar iconos iniciales de Lucide
  lucide.createIcons();
});

// --- FUNCIONES DE INTERFAZ ---

/**
 * Renderiza la lista de sensores en la pantalla de inicio.
 */
function renderHomeGrid() {
  sensorsGrid.innerHTML = '';
  const sensors = getSensors();

  sensors.forEach(sensor => {
    const card = document.createElement('div');
    card.className = 'glass-card sensor-card';
    card.setAttribute('data-id', sensor.id);
    
    // Obtener valor de inicio
    const val = sensor.getLiveValue();

    card.innerHTML = `
      <span class="activity-dot"></span>
      <div class="sensor-header">
        <div class="sensor-icon-wrapper">
          <i data-lucide="${sensor.icon}"></i>
        </div>
        <span class="sensor-badge">${sensor.metadata.sensorModel}</span>
      </div>
      <div class="sensor-meta">
        <h2>${sensor.name}</h2>
        <p>${sensor.description}</p>
      </div>
      <div class="sensor-reading">
        <span class="sensor-value" id="home-val-${sensor.id}">${val}</span>
        <span class="sensor-unit">${sensor.unit}</span>
      </div>
    `;

    card.addEventListener('click', () => {
      openSensorDetail(sensor.id);
    });

    sensorsGrid.appendChild(card);
  });
}

/**
 * Actualiza los valores en tiempo real del Home para dar sensación de dinamismo.
 */
function startHomeLiveUpdates() {
  if (homeIntervalId) clearInterval(homeIntervalId);
  
  homeIntervalId = setInterval(() => {
    const sensors = getSensors();
    sensors.forEach(sensor => {
      const valEl = document.getElementById(`home-val-${sensor.id}`);
      if (valEl) {
        const newVal = sensor.getLiveValue();
        
        // Micro-animación al cambiar el valor
        valEl.style.transition = 'color 0.2s ease';
        valEl.style.color = '#34d399'; // Brillo verde
        valEl.textContent = newVal;
        
        setTimeout(() => {
          valEl.style.color = 'var(--text-primary)';
        }, 300);
      }
    });
  }, 4000); // Cada 4 segundos
}

/**
 * Detiene las actualizaciones del Home.
 */
function stopHomeLiveUpdates() {
  if (homeIntervalId) {
    clearInterval(homeIntervalId);
    homeIntervalId = null;
  }
}

/**
 * Abre la vista de detalle de un sensor e inicializa sus gráficos.
 * @param {string} sensorId - El ID del sensor seleccionado.
 */
async function openSensorDetail(sensorId) {
  stopHomeLiveUpdates();
  activeSensor = getSensorById(sensorId);
  if (!activeSensor) return;

  currentTimeframe = 'live';

  // Configurar elementos de texto e iconos
  detailTitle.textContent = activeSensor.name;
  detailCategory.textContent = activeSensor.category;
  detailIconWrapper.innerHTML = `<i data-lucide="${activeSensor.icon}" style="width: 32px; height: 32px;"></i>`;
  detailLiveUnit.textContent = activeSensor.unit;
  
  // Especificaciones técnicas
  technicalSpecs.innerHTML = `
    <div><strong>Modelo:</strong> ${activeSensor.metadata.sensorModel}</div>
    <div><strong>Precisión:</strong> ${activeSensor.metadata.accuracy}</div>
    <div><strong>Rango:</strong> ${activeSensor.metadata.range}</div>
    <div><strong>Pines recomendados:</strong> ${activeSensor.metadata.recommendedPins}</div>
  `;

  // Código Arduino
  arduinoCodeSnippet.textContent = activeSensor.arduinoCode;

  // Restaurar pestañas a la inicial (Guía)
  switchTab('guide');
  
  // Limpiar clases activas en los botones de rango y poner 'Tiempo Real' activo
  document.querySelectorAll('.timeframe-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-timeframe') === 'live') {
      btn.classList.add('active');
    }
  });

  // Mostrar la pantalla de detalle y ocultar Home
  homeView.style.display = 'none';
  detailView.style.display = 'block';

  // Forzar actualización de iconos de Lucide
  lucide.createIcons();

  // Obtener datos históricos simulados iniciales e iniciar gráfico
  detailDataBuffer = await activeSensor.getData('live');
  
  // Establecer lectura actual
  const lastPoint = detailDataBuffer[detailDataBuffer.length - 1];
  detailLiveValue.textContent = lastPoint ? lastPoint.value : '--';

  // Inicializar Chart.js
  initChart('sensorChart', activeSensor.name, detailDataBuffer, activeSensor.unit);

  // Iniciar ciclo de actualización en vivo para el detalle
  startDetailLiveUpdates();
}

/**
 * Cierra la vista detallada y regresa al Home.
 */
function closeSensorDetail() {
  stopDetailLiveUpdates();
  
  detailView.style.display = 'none';
  homeView.style.display = 'block';
  
  activeSensor = null;
  
  // Reanudar actualizaciones en Home
  startHomeLiveUpdates();
  // Recargar iconos en el Home
  lucide.createIcons();
}

/**
 * Inicia el loop de actualización en tiempo real en la pantalla de detalle.
 */
function startDetailLiveUpdates() {
  if (detailIntervalId) clearInterval(detailIntervalId);

  detailIntervalId = setInterval(() => {
    if (!activeSensor || currentTimeframe !== 'live') return;

    // Obtener nuevo valor en tiempo real
    const newVal = activeSensor.getLiveValue();
    detailLiveValue.textContent = newVal;

    // Agregar al búfer de datos
    const now = new Date();
    const newPoint = {
      timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      value: newVal
    };

    detailDataBuffer.push(newPoint);
    
    // Mantener sólo los últimos 15 puntos en pantalla
    if (detailDataBuffer.length > 15) {
      detailDataBuffer.shift();
    }

    // Actualizar el gráfico de forma limpia
    updateChart(detailDataBuffer);
  }, 3000); // Cada 3 segundos
}

/**
 * Detiene el loop de actualización en tiempo real del detalle.
 */
function stopDetailLiveUpdates() {
  if (detailIntervalId) {
    clearInterval(detailIntervalId);
    detailIntervalId = null;
  }
}

/**
 * Cambia el período del gráfico (tiempo real, diario, semanal).
 * @param {string} timeframe - 'live' | 'day' | 'week'
 */
async function changeTimeframe(timeframe) {
  if (!activeSensor) return;
  currentTimeframe = timeframe;

  // Actualizar clases de botones
  document.querySelectorAll('.timeframe-btn').forEach(btn => {
    if (btn.getAttribute('data-timeframe') === timeframe) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Ocultar o mostrar valor en vivo según el contexto
  const liveLabel = document.querySelector('.live-stat .label');
  if (timeframe === 'live') {
    liveLabel.textContent = 'Lectura Actual';
    startDetailLiveUpdates();
  } else {
    liveLabel.textContent = timeframe === 'day' ? 'Promedio diario' : 'Promedio semanal';
    stopDetailLiveUpdates();
  }

  // Obtener los datos correspondientes
  detailDataBuffer = await activeSensor.getData(timeframe);

  // Mostrar promedio en la tarjeta si no es tiempo real
  if (timeframe !== 'live') {
    const sum = detailDataBuffer.reduce((acc, p) => acc + p.value, 0);
    const avg = sum / (detailDataBuffer.length || 1);
    detailLiveValue.textContent = avg.toFixed(1);
  } else {
    const lastPoint = detailDataBuffer[detailDataBuffer.length - 1];
    detailLiveValue.textContent = lastPoint ? lastPoint.value : '--';
  }

  // Re-inicializar el gráfico para ajustar escalas y grids
  initChart('sensorChart', activeSensor.name, detailDataBuffer, activeSensor.unit);
}

/**
 * Cambia entre pestañas de documentación en el panel de detalle.
 * @param {string} tabId - 'guide' | 'code'
 */
function switchTab(tabId) {
  // Desactivar todas las pestañas y contenidos
  document.querySelectorAll('.doc-tab').forEach(tab => {
    if (tab.getAttribute('data-tab') === tabId) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  document.querySelectorAll('.doc-tab-content').forEach(content => {
    if (content.id === `tabContent-${tabId}`) {
      content.classList.add('active');
    } else {
      content.classList.remove('active');
    }
  });
}

/**
 * Muestra una notificación emergente estilizada.
 * @param {string} message - Mensaje a mostrar.
 */
function showToast(message) {
  toastMessage.textContent = message;
  toastNotification.classList.add('show');
  
  setTimeout(() => {
    toastNotification.classList.remove('show');
  }, 2500);
}

/**
 * Copia el código Arduino al portapapeles del usuario.
 */
function copyArduinoCode() {
  if (!activeSensor) return;
  
  navigator.clipboard.writeText(activeSensor.arduinoCode)
    .then(() => {
      showToast('¡Código copiado al portapapeles!');
    })
    .catch(err => {
      console.error('Error al copiar: ', err);
    });
}

/**
 * Exporta el búfer de datos actual en formato CSV.
 */
function exportDataToCsv() {
  if (!activeSensor || !detailDataBuffer.length) return;

  let csvContent = 'data:text/csv;charset=utf-8,';
  
  // Encabezados (fomentando la etapa de Organización)
  csvContent += 'Marca de Tiempo,Valor,Unidad\r\n';

  // Filas
  detailDataBuffer.forEach(row => {
    csvContent += `"${row.timestamp}",${row.value},"${activeSensor.unit}"\r\n`;
  });

  // Crear elemento de descarga y activarlo
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  
  // Nombre del archivo indicando sensor y rango
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `datos_${activeSensor.id}_${currentTimeframe}_${dateStr}.csv`);
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('¡Datos exportados a CSV!');
}

// --- CONFIGURACIÓN DE LISTENERS DE EVENTOS ---
function setupEventListeners() {
  // Botón Volver
  backToHomeBtn.addEventListener('click', closeSensorDetail);

  // Botones de Timeframe
  document.querySelectorAll('.timeframe-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tf = e.currentTarget.getAttribute('data-timeframe');
      changeTimeframe(tf);
    });
  });

  // Pestañas de Documentación
  document.querySelectorAll('.doc-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const tabId = e.currentTarget.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Copiar código
  copyCodeBtn.addEventListener('click', copyArduinoCode);

  // Exportar datos
  exportCsvBtn.addEventListener('click', exportDataToCsv);
}
