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
    sensorModel: 'DHT22 / AM2302',
    accuracy: '±2% HR',
    range: '0 a 100% HR',
    recommendedPins: 'GPIO 4 (ESP32) o Pin 2 (Arduino)'
  },
  
  // Código de ejemplo para la sección de Documentación
  arduinoCode: `/*
  EcoOpenSenseLab - Conexión de Sensor de Humedad DHT22
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

  // Leer la humedad relativa (%)
  float h = dht.readHumidity();

  // Verificar si la lectura falló
  if (isnan(h)) {
    Serial.println(F("Error al leer del sensor DHT22!"));
    return;
  }

  // Imprimir en consola en formato serializable (JSON)
  Serial.print("{ \\"sensor\\": \\"humedad\\", \\"valor\\": ");
  Serial.print(h);
  Serial.println(" }");
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
