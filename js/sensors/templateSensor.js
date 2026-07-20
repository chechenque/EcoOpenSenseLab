/**
 * TEMPLATE SENSOR MODULE
 *
 * Copy this file to create a new sensor definition.
 * Update the fields marked with TODO comments.
 */
export const templateSensor = {
  // Unique identifier (must be lowercase, no spaces)
  id: 'yourSensorId', // TODO: replace with sensor id

  // Human readable name displayed in UI
  name: 'Nombre del Sensor', // TODO: replace with sensor name

  // Category used for grouping (e.g., "Calidad del Aire", "Metereología")
  category: 'Categoria', // TODO: replace with category

  // Short description shown on the cards
  description: 'Descripción breve del sensor y su propósito.', // TODO: replace description

  // Icon name from Lucide (https://lucide.dev)
  icon: 'cpu', // TODO: choose appropriate icon

  // Unit of measurement shown with the value
  unit: 'unidad', // TODO: replace with measurement unit (e.g., "°C", "ppm")

  // Metadata provides technical specs for the detail panel
  metadata: {
    sensorModel: 'Modelo del Sensor', // TODO
    accuracy: 'Precisión', // TODO
    range: 'Rango de Medición', // TODO
    recommendedPins: 'Pines recomendados (ej. I2C SDA: GPIO21, SCL: GPIO22)', // TODO
  },

  // Path to the schematic/diagram (relative to the project root)
  schematic: 'assets/schematics/placeholder.svg', // TODO: place a real schematic in assets/schematics

  // Tags used for filtering on the sensors index view
  tags: ['tag1', 'tag2', 'tag3'], // TODO: add relevant tags (lowercase, no spaces)

  // Array of HTML strings with step‑by‑step connection instructions
  setupInstructions: [
    '<strong>Alimentación (VCC):</strong> Conecta VCC a 3.3V o 5V según el sensor.',
    '<strong>Tierra (GND):</strong> Conecta GND a tierra de la placa.',
    '<strong>Bus (ej. I2C SDA/SCL):</strong> Conecta los pines de datos al ESP32 o microcontrolador.',
    // TODO: add more specific steps for the sensor
  ],

  // Example Arduino sketch (copy‑paste into Arduino IDE)
  arduinoCode: `/*
   * Sketch de ejemplo para {{NAME}}
   * Reemplaza las configuraciones según tu hardware.
   */
  #include <Wire.h>
  // TODO: incluye la librería del sensor
  
  void setup() {
    Serial.begin(115200);
    // TODO: inicializa el sensor
  }
  
  void loop() {
    // TODO: lee los valores y envíalos por Serial
    delay(1000);
  }`,

  // Internal state for live simulation (optional, can be removed)
  currentBaseValue: 0,

  // Returns a single live value (used by the mockup on the home screen)
  getLiveValue() {
    // TODO: implement a realistic random variation or return a real reading
    return this.currentBaseValue;
  },

  // Generates mock historic data for the detail view chart
  async getData(timeframe) {
    const data = [];
    const now = new Date();
    // Simple stub: returns 24 hourly points for "day"
    if (timeframe === 'day') {
      for (let i = 23; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 3600000);
        const hour = time.getHours().toString().padStart(2, '0');
        data.push({ timestamp: `${hour}:00`, value: this.currentBaseValue });
      }
    }
    // Add more sophisticated simulation for 'live' and 'week' if needed
    return data;
  },
};
