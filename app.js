import { getSensors, getSensorById } from './js/sensorRegistry.js';
import { initChart, updateChart } from './js/chartHelper.js';

// --- ESTADO DE LA APLICACIÓN ---
let activeSensor = null;
let currentTimeframe = 'live';
let mockupIntervalId = null;
let detailIntervalId = null;
let detailDataBuffer = []; 

// Instancia separada para el gráfico destacado del Home
let featuredChartInstance = null;

// --- ELEMENTOS DEL DOM ---
const mainViews = {
  homeView: document.getElementById('homeView'),
  proyectoView: document.getElementById('proyectoView'),
  datosView: document.getElementById('datosView'),
  recursosView: document.getElementById('recursosView'),
  sensorsIndexView: document.getElementById('sensorsIndexView'),
  detailView: document.getElementById('detailView')
};

// Navegación
const navLinks = document.querySelectorAll('.nav-links a');
const navSensoresLink = document.getElementById('navSensoresLink');

// Mockup Físico de Pantalla
const mockTemp = document.getElementById('mock-temp');
const mockHum = document.getElementById('mock-hum');
const mockCo2 = document.getElementById('mock-co2');
const mockTvoc = document.getElementById('mock-tvoc');

// Tabla de Datasets Recientes
const recentDatasetsTableBody = document.getElementById('recentDatasetsTableBody');

// Gráfico Destacado del Home
const featuredVariableSelect = document.getElementById('featuredVariableSelect');
const featuredChartCaption = document.getElementById('featuredChartCaption');
const seeAllVizBtn = document.getElementById('seeAllVizBtn');

// Detalle del Sensor (Panel individual)
const detailTitle = document.getElementById('detailTitle');
const detailCategory = document.getElementById('detailCategory');
const detailIconWrapper = document.getElementById('detailIconWrapper');
const detailLiveValue = document.getElementById('detailLiveValue');
const detailLiveUnit = document.getElementById('detailLiveUnit');
const technicalSpecs = document.getElementById('technicalSpecs');
const arduinoCodeSnippet = document.getElementById('arduinoCodeSnippet');
const copyCodeBtn = document.getElementById('copyCodeBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const backToHomeBtn = document.getElementById('backToHomeBtn');

// Notificaciones
const toastNotification = document.getElementById('toastNotification');
const toastMessage = document.getElementById('toastMessage');

// --- DATOS SIMULADOS PARA TABLA DE SITIOS ---
const recentDatasets = [
  { site: 'Laguna A', date: '12/08/2026', variables: ['Temperatura', 'Humedad', 'eCO2'], sensorIds: ['temperature', 'humidity', 'airquality'] },
  { site: 'Bosque B', date: '19/08/2026', variables: ['TVOC', 'eCO2', 'Temperatura'], sensorIds: ['airquality', 'temperature'] },
  { site: 'Humedad C', date: '26/08/2026', variables: ['Temperatura', 'Humedad'], sensorIds: ['temperature', 'humidity'] },
  { site: 'Parque D', date: '02/09/2026', variables: ['Temperatura', 'Humedad', 'TVOC'], sensorIds: ['temperature', 'humidity', 'airquality'] },
  { site: 'Río E', date: '10/09/2026', variables: ['pH', 'Temperatura', 'Conductividad'], sensorIds: ['temperature'] }
];

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupNavigation();
  renderHomeTable();
  initFeaturedChart();
  renderSensorsIndexGrid();
  startMockupUpdates();
  setupEventListeners();
  
  // Procesar iconos iniciales de Lucide
  lucide.createIcons();
});

// --- FUNCIONES DE NAVEGACIÓN ---

/**
 * Configura la navegación de tipo Single Page Application (SPA).
 */
function setupNavigation() {
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('data-target');
      if (target) {
        switchView(target);
        
        // Actualizar clase activa en navbar
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    });
  });

  // Botón "Sensores" de la barra de navegación (redirige a la lista general)
  navSensoresLink.addEventListener('click', (e) => {
    e.preventDefault();
    switchView('sensorsIndexView');
    navLinks.forEach(l => l.classList.remove('active'));
    navSensoresLink.classList.add('active');
  });
}

/**
 * Alterna la visibilidad de los diferentes paneles de contenido.
 * @param {string} viewId - El ID de la vista a mostrar.
 */
function switchView(viewId) {
  // Detener ciclos de actualización detallados
  stopDetailLiveUpdates();

  // Ocultar todas las vistas
  for (const key in mainViews) {
    if (mainViews[key]) {
      mainViews[key].style.display = 'none';
    }
  }

  // Mostrar la vista objetivo
  if (mainViews[viewId]) {
    // Si la vista es la del detalle, se muestra como grid o flex segun la clase css, si no, block.
    if (viewId === 'detailView') {
      mainViews[viewId].style.display = 'grid';
    } else {
      mainViews[viewId].style.display = 'block';
    }
  }

  // Reanudar o pausar el loop del mockup en base a si estamos en el Home
  if (viewId === 'homeView') {
    startMockupUpdates();
    // Re-iniciar gráfico destacado al volver al home
    setTimeout(() => {
      initFeaturedChart();
    }, 100);
  } else {
    stopMockupUpdates();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
  lucide.createIcons();
}

// --- LOGICA DE PANTALLA MOCKUP DEL DISPOSITIVO ---

/**
 * Actualiza los valores en la pantalla LCD digital simulada del Hero.
 */
function startMockupUpdates() {
  if (mockupIntervalId) clearInterval(mockupIntervalId);

  mockupIntervalId = setInterval(() => {
    const tempSensor = getSensorById('temperature');
    const humSensor = getSensorById('humidity');
    const co2Sensor = getSensorById('airquality');

    if (mockTemp && tempSensor) mockTemp.textContent = tempSensor.getLiveValue();
    if (mockHum && humSensor) mockHum.textContent = humSensor.getLiveValue();
    if (mockCo2 && co2Sensor) {
      const co2Val = co2Sensor.getLiveValue();
      mockCo2.textContent = co2Val;
      // Estimar TVOC correlacionado (eCO2 * 0.2 + variaciones)
      if (mockTvoc) {
        const tvocVal = Math.round(co2Val * 0.2 + (Math.random() - 0.5) * 15);
        mockTvoc.textContent = Math.max(10, tvocVal);
      }
    }
  }, 3000);
}

function stopMockupUpdates() {
  if (mockupIntervalId) {
    clearInterval(mockupIntervalId);
    mockupIntervalId = null;
  }
}

// --- TABLA DE DATOS RECIENTES ---

/**
 * Renderiza la tabla de datos recientes en la primera columna del Dashboard.
 */
function renderHomeTable() {
  if (!recentDatasetsTableBody) return;
  recentDatasetsTableBody.innerHTML = '';

  recentDatasets.forEach((dataset, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${dataset.site}</strong></td>
      <td>${dataset.date}</td>
      <td style="font-size: 0.75rem; color: var(--text-muted);">${dataset.variables.join(', ')}</td>
      <td style="text-align: right;">
        <button class="btn-csv" data-index="${index}">CSV</button>
      </td>
    `;
    recentDatasetsTableBody.appendChild(row);
  });

  // Vincular botones de descarga CSV en la tabla
  recentDatasetsTableBody.querySelectorAll('.btn-csv').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.getAttribute('data-index'));
      downloadSiteCsv(recentDatasets[index]);
    });
  });
}

/**
 * Genera y descarga un archivo CSV con datos simulados del sitio seleccionado.
 */
function downloadSiteCsv(dataset) {
  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent += 'Sitio,Marca de Tiempo,Variable,Valor,Unidad\r\n';

  const now = new Date();
  
  // Agregar datos simulados para cada variable registrada
  dataset.variables.forEach(varName => {
    let unit = '°C';
    let baseVal = 22;
    if (varName === 'Humedad') { unit = '%'; baseVal = 55; }
    else if (varName === 'eCO2') { unit = 'ppm'; baseVal = 500; }
    else if (varName === 'TVOC') { unit = 'ppb'; baseVal = 100; }
    else if (varName === 'pH') { unit = 'pH'; baseVal = 7.2; }
    else if (varName === 'Conductividad') { unit = 'uS/cm'; baseVal = 300; }

    // Generar 10 lecturas pasadas
    for (let i = 9; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 3600000);
      const timeStr = time.toISOString().replace('T', ' ').substring(0, 19);
      const val = (baseVal + (Math.sin(i) * (baseVal * 0.15)) + (Math.random() - 0.5) * (baseVal * 0.05)).toFixed(1);
      csvContent += `"${dataset.site}","${timeStr}","${varName}",${val},"${unit}"\r\n`;
    }
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `datos_${dataset.site.toLowerCase().replace(' ', '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast(`¡Datos de ${dataset.site} descargados!`);
}

// --- GRÁFICO DESTACADO DEL HOME ---

/**
 * Inicializa el gráfico central de visualización destacada en el Home.
 */
async function initFeaturedChart() {
  const canvas = document.getElementById('featuredChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const selectedVar = featuredVariableSelect.value;
  const sensor = getSensorById(selectedVar);
  if (!sensor) return;

  // Actualizar subtítulo
  featuredChartCaption.innerHTML = `Laguna A - ${sensor.name}`;

  // Obtener datos históricos de 24 horas (modo 'day')
  const chartData = await sensor.getData('day');
  
  if (featuredChartInstance) {
    featuredChartInstance.destroy();
  }

  const computedStyle = getComputedStyle(document.documentElement);
  const accentPrimary = computedStyle.getPropertyValue('--accent-primary').trim() || '#059669';
  const gridColor = computedStyle.getPropertyValue('--chart-grid').trim() || 'rgba(0, 0, 0, 0.05)';
  const ticksColor = computedStyle.getPropertyValue('--chart-ticks').trim() || '#64748b';

  const gradient = ctx.createLinearGradient(0, 0, 0, 180);
  gradient.addColorStop(0, accentPrimary + '30');
  gradient.addColorStop(1, accentPrimary + '00');

  featuredChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartData.map(d => d.timestamp),
      datasets: [{
        label: sensor.name,
        data: chartData.map(d => d.value),
        borderColor: accentPrimary,
        borderWidth: 2,
        backgroundColor: gradient,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: accentPrimary,
        pointRadius: 2,
        pointHoverRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { color: gridColor, drawBorder: false },
          ticks: { color: ticksColor, font: { size: 10 } }
        },
        y: {
          grid: { color: gridColor, drawBorder: false },
          ticks: { color: ticksColor, font: { size: 10 } }
        }
      }
    }
  });
}

// --- RENDERIZADO DEL ANTERIOR HOME (INDEX DE SENSORES) ---

/**
 * Renderiza el catálogo completo de sensores (el antiguo Home).
 */
function renderSensorsIndexGrid() {
  const grid = document.getElementById('sensorsGrid');
  if (!grid) return;
  
  grid.innerHTML = '';
  const sensors = getSensors();

  sensors.forEach(sensor => {
    const card = document.createElement('div');
    card.className = 'glass-card sensor-card';
    card.setAttribute('data-id', sensor.id);
    
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
        <span class="sensor-value" id="index-val-${sensor.id}">${val}</span>
        <span class="sensor-unit">${sensor.unit}</span>
      </div>
    `;

    card.addEventListener('click', () => {
      openSensorDetail(sensor.id);
    });

    grid.appendChild(card);
  });
}

// --- VISTA DETALLADA INDIVIDUAL (COMPATIBILIDAD) ---

/**
 * Abre la pantalla de detalles de un sensor.
 */
async function openSensorDetail(sensorId) {
  activeSensor = getSensorById(sensorId);
  if (!activeSensor) return;

  currentTimeframe = 'live';

  // Configurar metadatos
  detailTitle.textContent = activeSensor.name;
  detailCategory.textContent = activeSensor.category;
  detailIconWrapper.innerHTML = `<i data-lucide="${activeSensor.icon}" style="width: 32px; height: 32px;"></i>`;
  detailLiveUnit.textContent = activeSensor.unit;
  
  technicalSpecs.innerHTML = `
    <div><strong>Modelo:</strong> ${activeSensor.metadata.sensorModel}</div>
    <div><strong>Precisión:</strong> ${activeSensor.metadata.accuracy}</div>
    <div><strong>Rango:</strong> ${activeSensor.metadata.range}</div>
    <div><strong>Pines recomendados:</strong> ${activeSensor.metadata.recommendedPins}</div>
  `;

  arduinoCodeSnippet.textContent = activeSensor.arduinoCode;

  // Restaurar pestañas y selectores
  switchTab('guide');
  document.querySelectorAll('.timeframe-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-timeframe') === 'live') btn.classList.add('active');
  });

  // Mostrar vista de detalle
  switchView('detailView');

  // Obtener historial en vivo e iniciar gráfico
  detailDataBuffer = await activeSensor.getData('live');
  const lastPoint = detailDataBuffer[detailDataBuffer.length - 1];
  detailLiveValue.textContent = lastPoint ? lastPoint.value : '--';

  initChart('sensorChart', activeSensor.name, detailDataBuffer, activeSensor.unit);

  // Iniciar loop de actualización en tiempo real en la vista detallada
  startDetailLiveUpdates();
}

function startDetailLiveUpdates() {
  if (detailIntervalId) clearInterval(detailIntervalId);

  detailIntervalId = setInterval(() => {
    if (!activeSensor || currentTimeframe !== 'live') return;

    const newVal = activeSensor.getLiveValue();
    detailLiveValue.textContent = newVal;

    const now = new Date();
    const newPoint = {
      timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      value: newVal
    };

    detailDataBuffer.push(newPoint);
    if (detailDataBuffer.length > 15) {
      detailDataBuffer.shift();
    }

    updateChart(detailDataBuffer);
  }, 3000);
}

function stopDetailLiveUpdates() {
  if (detailIntervalId) {
    clearInterval(detailIntervalId);
    detailIntervalId = null;
  }
}

async function changeTimeframe(timeframe) {
  if (!activeSensor) return;
  currentTimeframe = timeframe;

  document.querySelectorAll('.timeframe-btn').forEach(btn => {
    if (btn.getAttribute('data-timeframe') === timeframe) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  const liveLabel = document.querySelector('.live-stat .label');
  if (timeframe === 'live') {
    liveLabel.textContent = 'Lectura Actual';
    startDetailLiveUpdates();
  } else {
    liveLabel.textContent = timeframe === 'day' ? 'Promedio diario' : 'Promedio semanal';
    stopDetailLiveUpdates();
  }

  detailDataBuffer = await activeSensor.getData(timeframe);

  if (timeframe !== 'live') {
    const sum = detailDataBuffer.reduce((acc, p) => acc + p.value, 0);
    const avg = sum / (detailDataBuffer.length || 1);
    detailLiveValue.textContent = avg.toFixed(1);
  } else {
    const lastPoint = detailDataBuffer[detailDataBuffer.length - 1];
    detailLiveValue.textContent = lastPoint ? lastPoint.value : '--';
  }

  initChart('sensorChart', activeSensor.name, detailDataBuffer, activeSensor.unit);
}

function switchTab(tabId) {
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

function showToast(message) {
  toastMessage.textContent = message;
  toastNotification.classList.add('show');
  
  setTimeout(() => {
    toastNotification.classList.remove('show');
  }, 2500);
}

function copyArduinoCode() {
  if (!activeSensor) return;
  navigator.clipboard.writeText(activeSensor.arduinoCode)
    .then(() => showToast('¡Código copiado al portapapeles!'))
    .catch(err => console.error('Error al copiar: ', err));
}

function exportDataToCsv() {
  if (!activeSensor || !detailDataBuffer.length) return;

  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent += 'Marca de Tiempo,Valor,Unidad\r\n';

  detailDataBuffer.forEach(row => {
    csvContent += `"${row.timestamp}",${row.value},"${activeSensor.unit}"\r\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `datos_${activeSensor.id}_${currentTimeframe}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('¡Datos exportados a CSV!');
}

// --- CONFIGURACIÓN DE LISTENERS DE EVENTOS ---
function setupEventListeners() {
  // Botón volver del detalle
  backToHomeBtn.addEventListener('click', () => {
    switchView('homeView');
    // Actualizar clase activa en navbar
    navLinks.forEach(l => l.classList.remove('active'));
    document.querySelector('.nav-links a[data-target="homeView"]').classList.add('active');
  });

  // Botones del Hero
  document.getElementById('heroExploreBtn').addEventListener('click', () => switchView('datosView'));
  document.getElementById('heroDocBtn').addEventListener('click', () => switchView('recursosView'));
  document.getElementById('heroSensorsBtn').addEventListener('click', () => switchView('sensorsIndexView'));

  // Cambiar variable en gráfico destacado
  featuredVariableSelect.addEventListener('change', initFeaturedChart);

  // Botón ver más visualizaciones del gráfico destacado
  seeAllVizBtn.addEventListener('click', () => {
    switchView('sensorsIndexView');
  });

  // Enlace "Ver todos" en columna de sensores
  document.getElementById('seeAllSensorsLink').addEventListener('click', (e) => {
    e.preventDefault();
    switchView('sensorsIndexView');
  });

  // Botones "Más información" en columna de sensores
  document.querySelectorAll('.sensor-mini-card button').forEach(btn => {
    btn.addEventListener('click', () => {
      const sensorId = btn.getAttribute('data-sensor-id');
      openSensorDetail(sensorId);
    });
  });

  // Rango de gráficos de detalle
  document.querySelectorAll('.timeframe-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tf = e.currentTarget.getAttribute('data-timeframe');
      changeTimeframe(tf);
    });
  });

  // Pestañas de documentación de detalle
  document.querySelectorAll('.doc-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const tabId = e.currentTarget.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Copiar código y descargar datos en detalle
  copyCodeBtn.addEventListener('click', copyArduinoCode);
  exportCsvBtn.addEventListener('click', exportDataToCsv);
}

// --- SOPORTE DE TEMAS (CLARO Y OSCURO) ---

function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
  
  // Si estamos en el home y hay un gráfico destacado, re-inicializar
  if (mainViews.homeView.style.display !== 'none') {
    initFeaturedChart();
  }
  
  // Si hay un gráfico de detalle activo, re-inicializar
  if (activeSensor && detailDataBuffer.length && mainViews.detailView.style.display !== 'none') {
    initChart('sensorChart', activeSensor.name, detailDataBuffer, activeSensor.unit);
  }
}

function updateThemeIcon(theme) {
  const sunIcon = document.querySelector('.sun-icon');
  const moonIcon = document.querySelector('.moon-icon');
  if (theme === 'dark') {
    if (sunIcon) sunIcon.style.display = 'block';
    if (moonIcon) moonIcon.style.display = 'none';
  } else {
    if (sunIcon) sunIcon.style.display = 'none';
    if (moonIcon) moonIcon.style.display = 'block';
  }
}
