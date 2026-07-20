/**
 * Sensor de Humedad Relativa
 */
export const humiditySensor = {
  id: 'humidity',
  name: 'Humedad Relativa',
  category: 'Metereología',
  description: 'Mide el porcentaje de vapor de agua en el aire. Vital para estudiar la evapotranspiración y el confort biológico.',
  icon: 'droplets',
  unit: '%',
  metadata: {
    sensorModel: 'AHT21',
    accuracy: '±2% HR',
    range: '0 a 100% HR',
    recommendedPins: 'I2C (SDA: GPIO 21, SCL: GPIO 22 en ESP32)'
  },
  schematic: 'assets/schematics/sensorGases_esp32_bb.svg',
  tags: ['humedad', 'clima', 'meteorología', 'aht21', 'i2c', 'esp32', 'aula', 'campo'],
  setupInstructions: [
    '<strong>Alimentación (VCC):</strong> Conecta el pin <strong>VCC / VIN</strong> del módulo de sensores al pin de <strong>3.3V</strong> de la placa ESP32.',
    '<strong>Tierra (GND):</strong> Conecta el pin <strong>GND</strong> del módulo al pin de tierra <strong>GND</strong> de la placa ESP32.',
    '<strong>Bus I2C (SDA):</strong> Conecta el pin <strong>SDA</strong> del módulo al pin digital <strong>GPIO 21</strong> de la placa ESP32.',
    '<strong>Bus I2C (SCL):</strong> Conecta el pin <strong>SCL</strong> del módulo al pin digital <strong>GPIO 22</strong> de la placa ESP32.',
    '<strong>Conexión Compartida:</strong> Al ser sensores I2C, el ENS160 y el AHT21 comparten el mismo bus físico. Se conectan a los mismos pines en paralelo.'
  ],
  
  // Código de ejemplo para la sección de Documentación
  arduinoCode: `/*
  EcoOpenSenseLab - Conexión de Sensor de Temperatura y Humedad AHT21
  Etapa: Recolección y Documentación
*/

#include <Adafruit_AHTX0.h>

Adafruit_AHTX0 aht;

void setup() {
  Serial.begin(115200);
  Serial.println("Iniciando sensor AHT21...");

  if (!aht.begin()) {
    Serial.println("No se pudo encontrar el sensor AHT21. ¡Verifica las conexiones!");
    while (1) delay(10);
  }
  Serial.println("Sensor AHT21 inicializado con éxito.");
}

void loop() {
  sensors_event_t humidity, temp;
  aht.getEvent(&humidity, &temp); // Obtener eventos de lectura

  // Imprimir en consola en formato serializable (JSON)
  Serial.print("{ \\"sensor\\": \\"humedad\\", \\"valor\\": ");
  Serial.print(humidity.relative_humidity);
  Serial.println(" }");

  delay(2000); // Esperar 2 segundos entre lecturas
}`,

  // Estado local para valor en tiempo real
  currentBaseValue: 58.0,

  /**
   * Obtiene un valor individual simulado con variaciones realistas
   * @returns {number} Valor actual de humedad
   */
  getLiveValue() {
    // Pequeño cambio aleatorio entre -0.3% y +0.3%
    const delta = (Math.random() - 0.5) * 0.6;
    this.currentBaseValue = Math.min(95, Math.max(20, this.currentBaseValue + delta));
    return parseFloat(this.currentBaseValue.toFixed(1));
  },

  /**
   * Genera historial de datos simulados según el período solicitado
   * @param {string} timeframe - 'live' | 'day' | 'week'
   * @returns {Promise<Array>} Lista de puntos { timestamp, value }
   */
  async getData(timeframe) {
    const data = [];
    const now = new Date();

    if (timeframe === 'live') {
      // Últimos 15 puntos (cada 10 segundos atrás en el tiempo)
      for (let i = 14; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 10000);
        const val = this.currentBaseValue + (Math.sin(i / 1.5) * 0.3) + (Math.random() - 0.5) * 0.15;
        data.push({
          timestamp: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          value: parseFloat(val.toFixed(1))
        });
      }
    } else if (timeframe === 'day') {
      // Últimas 24 horas (una lectura por hora)
      for (let i = 23; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 3600000);
        const hour = time.getHours();
        
        // Simular ciclo diario de humedad (inverso a temperatura: máxima al amanecer 6 AM, mínima en la tarde 3 PM)
        const rad = ((hour - 6) / 24) * 2 * Math.PI;
        // Invertimos el seno para que suba cuando la temperatura baja
        const humidityCycle = -Math.sin(rad - Math.PI / 2) * 12; // Variación de ±12%
        const noise = (Math.random() - 0.5) * 1.5;
        const val = 62.0 + humidityCycle + noise;

        data.push({
          timestamp: `${hour.toString().padStart(2, '0')}:00`,
          value: parseFloat(val.toFixed(1))
        });
      }
    } else {
      // 'week': Últimos 7 días
      const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      for (let i = 6; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 86400000);
        const dayName = days[time.getDay()];
        
        // Humedad promedio diaria con variaciones según patrones climáticos simulados
        const val = 58.0 - (Math.sin(i) * 3) + (Math.random() - 0.5) * 2.5;
        data.push({
          timestamp: dayName,
          value: parseFloat(val.toFixed(1))
        });
      }
    }

    return data;
  }
};
