/**
 * Sensor de Temperatura
 */
export const temperatureSensor = {
  id: 'temperature',
  name: 'Temperatura Ambiental',
  category: 'Metereología',
  description: 'Monitorea la energía térmica del aire. Fundamental para entender microclimas y la termorregulación de especies.',
  icon: 'thermometer',
  unit: '°C',
  metadata: {
    sensorModel: 'DHT22 / AM2302',
    accuracy: '±0.5°C',
    range: '-40 a 80°C',
    recommendedPins: 'GPIO 4 (ESP32) o Pin 2 (Arduino)'
  },
  
  // Código de ejemplo para la sección de Documentación
  arduinoCode: `/*
  EcoOpenSenseLab - Conexión de Sensor de Temperatura DHT22
  Etapa: Recolección y Documentación
*/

#include "DHT.h"

#define DHTPIN 4     // Pin digital conectado al sensor DHT22 (GPIO 4 en ESP32)
#define DHTTYPE DHT22   // Tipo de sensor dht

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  Serial.println(F("Iniciando sensor DHT22..."));
  dht.begin();
}

void loop() {
  // Esperar 2 segundos entre mediciones
  delay(2000);

  // Leer la temperatura en Celsius (por defecto)
  float t = dht.readTemperature();

  // Verificar si la lectura falló
  if (isnan(t)) {
    Serial.println(F("Error al leer del sensor DHT22!"));
    return;
  }

  // Imprimir en consola en formato serializable (JSON)
  Serial.print("{ \\"sensor\\": \\"temperatura\\", \\"valor\\": ");
  Serial.print(t);
  Serial.println(" }");
}`,

  // Estado local para valor en tiempo real
  currentBaseValue: 23.5,

  /**
   * Obtiene un valor individual simulado con variaciones realistas
   * @returns {number} Valor actual de temperatura
   */
  getLiveValue() {
    // Pequeño cambio aleatorio entre -0.15 y +0.15 para simular fluctuación real
    const delta = (Math.random() - 0.5) * 0.3;
    this.currentBaseValue = Math.min(32, Math.max(15, this.currentBaseValue + delta));
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
        // Simular valor que fluctúa alrededor del valor actual
        const val = this.currentBaseValue + (Math.sin(i / 2) * 0.2) + (Math.random() - 0.5) * 0.1;
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
        
        // Simular ciclo diario térmico: temperatura máxima a las 3 PM (15:00), mínima a las 6 AM (06:00)
        // Usamos una función seno desfasada
        const rad = ((hour - 6) / 24) * 2 * Math.PI;
        const thermalCycle = Math.sin(rad - Math.PI / 2) * 4; // Variación de ±4 grados
        const noise = (Math.random() - 0.5) * 0.6;
        const val = 22.0 + thermalCycle + noise;

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
        
        // Temperatura media diaria fluctuando aleatoriamente entre 20 y 26 grados
        const val = 23.0 + (Math.sin(i) * 1.5) + (Math.random() - 0.5) * 1.0;
        data.push({
          timestamp: dayName,
          value: parseFloat(val.toFixed(1))
        });
      }
    }

    return data;
  }
};
