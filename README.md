# EcoOpenSenseLab 🌿

Repositorio dedicado al proyecto de **Sensores de bajo costo y repositorios abiertos en la enseñanza de ecología**. 

Este sistema busca que el estudiantado participe de manera activa en todas las etapas del trabajo científico con datos ambientales: **Recolección**, **Documentación**, **Organización**, **Procesamiento**, **Visualización** e **Interpretación**.

---

## 🗺️ Mapa del Sitio (Sitemap & Estructura)

El portal está estructurado como una Aplicación de Página Única (SPA). A continuación se muestra el flujo de navegación y secciones del sitio (soportado de forma nativa en GitHub mediante Mermaid):

```mermaid
graph TD
    %% Estilos de nodos
    classDef main fill:#0d3c26,stroke:#10b981,stroke-width:2px,color:#ffffff;
    classDef page fill:#059669,stroke:#0d3c26,stroke-width:1px,color:#ffffff;
    classDef section fill:#f8fafc,stroke:#cbd5e1,stroke-width:1px,color:#0f172a;
    classDef action fill:#e0f2fe,stroke:#0284c7,stroke-width:1px,color:#0369a1;

    Nav[Barra de Navegación Superior]:::main
    ThemeBtn[Alternador de Tema]:::action
    GH[Enlace GitHub]:::action
    
    Home[Inicio / Dashboard Principal]:::page
    Proyecto[Sobre el Proyecto]:::page
    SensorsList[Catálogo de Sensores]:::page
    Datos[Repositorio de Datos]:::page
    Recursos[Recursos del Aula]:::page
    Detail[Vista Detallada de Sensor]:::page

    Nav --> Home
    Nav --> Proyecto
    Nav --> SensorsList
    Nav --> Datos
    Nav --> Recursos
    Nav --> ThemeBtn
    Nav --> GH

    subgraph "Sección Inicio"
        Hero[Hero: Simulador LCD Nodo Físico]:::section
        Pillars[4 Pilares Metodológicos]:::section
        RecentData[Tabla de Datos Recientes]:::section
        FeaturedChart[Gráfico Destacado Interactivo]:::section
        SensorsSummary[Fichas Rápidas de Sensores]:::section
        EduResources[Recursos Educativos]:::section
    end
    
    Home --> Hero
    Home --> Pillars
    Home --> RecentData
    Home --> FeaturedChart
    Home --> SensorsSummary
    Home --> EduResources

    RecentData -->|Descargar| CSVFile[Archivo CSV de Sitio]:::action
    FeaturedChart -->|Cambiar Variable| UpdateChart[Actualizar Gráfico]:::action
    SensorsSummary -->|Más información| Detail
    SensorsList -->|Seleccionar Tarjeta| Detail

    subgraph "Vista Detalle de Sensor"
        DetailChart[Gráfico Histórico Dinámico]:::section
        LiveValue[Lectura en Vivo]:::section
        Specs[Especificaciones Técnicas]:::section
        ArduinoTab[Pestaña: Código Arduino / ESP32]:::section
        GuideTab[Pestaña: Guía de Conexión]:::section
    end

    Detail --> DetailChart
    Detail --> LiveValue
    Detail --> Specs
    Detail --> ArduinoTab
    Detail --> GuideTab
    
    Specs -->|Exportar| CSVData[Exportar CSV]:::action
    ArduinoTab -->|Copiar| Clipboard[Copiar Sketch]:::action
    
    Detail -->|Volver a la lista| SensorsList
```

---

## 🛠️ Estructura del Proyecto

La organización del código fuente en la raíz es la siguiente:

```
EcoOpenSenseLab/
├── index.html          # Estructura e interfaz principal del portal (Dashboard y SPA)
├── style.css           # Estilos generales (Temas Claro Científico / Oscuro Glassmorphic)
├── app.js              # Controlador principal (Navegación, simulación y eventos)
├── hero_background.png # Imagen de fondo del Hero
└── js/
    ├── sensorRegistry.js   # Módulo de registro central para sensores activos
    ├── chartHelper.js      # Integración estética y configuración de Chart.js
    └── sensors/            # Módulos modulares individuales de sensores
        ├── temperature.js  # Sensor de Temperatura AHT21 (Datos y código)
        ├── humidity.js     # Sensor de Humedad AHT21 (Datos y código)
        └── airquality.js   # Sensor de Calidad del Aire EN160 (Datos y código)
```

---

## 🚀 Ejecución y Visualización Local

Al ser una aplicación web estática pura (HTML5/CSS3/JavaScript ES6), no requiere procesos de compilación complejos. Para visualizarla localmente:

1. Clona el repositorio:
   ```bash
   git clone https://github.com/chechenque/EcoOpenSenseLab.git
   cd EcoOpenSenseLab
   ```
2. Inicia un servidor local simple (por ejemplo, con Python):
   ```bash
   python3 -m http.server 8000
   ```
3. Abre tu navegador de preferencia e ingresa a:
   [http://localhost:8000](http://localhost:8000)

---

## 📦 Tecnologías y Librerías Utilizadas

* **Estructura y Estilos:** HTML5 semántico y CSS Vanilla personalizado (con variables dinámicas de tema).
* **Gráficos:** [Chart.js](https://www.chartjs.org/) (cargado vía CDN) para la graficación reactiva.
* **Iconografía:** [Lucide Icons](https://lucide.dev/) para iconos vectoriales limpios.
* **Fuente:** *Plus Jakarta Sans* y *Courier Prime* desde Google Fonts.
