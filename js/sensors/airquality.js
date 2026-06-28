/**
 * Sensor de Calidad del Aire (eCO2)
 */
export const airQualitySensor = {
  id: 'airquality',
  name: 'Calidad del Aire (eCO2)',
  category: 'Calidad del Aire',
  description: 'Mide la concentración de Dióxido de Carbono equivalente (eCO2) en el ambiente. Clave para evaluar la ventilación y la salud ambiental.',
  icon: 'wind',
  unit: 'ppm',
  metadata: {
    sensorModel: 'EN160 / SGP30',
    accuracy: '±10% de la lectura',
    range: '400 a 60000 ppm',
    recommendedPins: 'I2C (SDA: GPIO 21, SCL: GPIO 22 en ESP32)'
  },
  
  // Código de ejemplo para la sección de Documentación
  arduinoCode: `/*
  EcoOpenSenseLab - Conexión de Sensor de Calidad del Aire EN160 (eCO2/TVOC)
  Etapa: Recolección y Documentación
*/

#include <Wire.h>
#include "Adafruit_SGP30.h" // El chip interno EN160 funciona de manera similar al SGP30

Adafruit_SGP30 sgp;

void setup() {
  Serial.begin(115200);
  Serial.println("Inicializando sensor de Calidad del Aire EN160/SGP30...");

  if (! sgp.begin()){
    Serial.println("Sensor no encontrado :(");
    while (1);
  }
  Serial.print("Encontrado sensor SGP30 con número de serie: ");
  Serial.print(sgp.serialnumber[0], HEX);
  Serial.print(sgp.serialnumber[1], HEX);
  Serial.println(sgp.serialnumber[2], HEX);
}

int contador = 0;
void loop() {
  if (! sgp.IAQmeasure()) {
    Serial.println("Medición fallida");
    return;
  }
  
  // Imprimir valores en formato JSON
  Serial.print("{ \\"sensor\\": \\"airquality\\", \\"eCO2\\": ");
  Serial.print(sgp.eCO2);
  Serial.print(", \\"TVOC\\": ");
  Serial.print(sgp.TVOC);
  Serial.println(" }");

  delay(1000); // Medir cada segundo
}`,

  // Estado local para valor en tiempo real
  currentBaseValue: 532.0,

  /**
   * Obtiene un valor individual simulado con variaciones realistas.
   * El CO2 se acumula en interiores y fluctúa en el aire libre con el viento.
   * @returns {number} Valor actual de eCO2 en ppm
   */
  getLiveValue() {
    // Pequeño cambio aleatorio entre -8 y +8 ppm
    const delta = (Math.random() - 0.5) * 16;
    this.currentBaseValue = Math.min(2000, Math.max(400, this.currentBaseValue + delta));
    return Math.round(this.currentBaseValue);
  },

  /**
   * Genera historial de datos simulados según el período solicitado.
   * @param {string} timeframe - 'live' | 'day' | 'week'
   * @returns {Promise<Array>} Lista de puntos { timestamp, value }
   */
  async getData(timeframe) {
    const data = [];
    const now = new Date();

    if (timeframe === 'live') {
      // Últimos 15 puntos (cada 10 segundos)
      for (let i = 14; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 10000);
        const val = this.currentBaseValue + (Math.sin(i / 1.5) * 10) + (Math.random() - 0.5) * 5;
        data.push({
          timestamp: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          value: Math.round(val)
        });
      }
    } else if (timeframe === 'day') {
      // Últimas 24 horas (una lectura por hora)
      // Simular acumulación de CO2 durante horas pico de ocupación humana o fotosíntesis vegetal invertida
      for (let i = 23; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 3600000);
        const hour = time.getHours();
        
        // El CO2 suele subir por la noche en la naturaleza (respiración de plantas sin fotosíntesis)
        // O durante el día en salones de clase. Asumiremos ciclo natural: pico a las 4 AM, mínimo a las 4 PM.
        const rad = ((hour - 4) / 24) * 2 * Math.PI;
        const co2Cycle = Math.sin(rad + Math.PI / 2) * 150; // Variación de ±150 ppm
        const noise = (Math.random() - 0.5) * 20;
        const val = 550.0 + co2Cycle + noise;

        data.push({
          timestamp: `${hour.toString().padStart(2, '0')}:00`,
          value: Math.round(val)
        });
      }
    } else {
      // 'week': Últimos 7 días
      const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      for (let i = 6; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 86400000);
        const dayName = days[time.getDay()];
        
        // Promedio diario con fluctuaciones normales alrededor de 520 ppm
        const val = 525.0 + (Math.sin(i) * 25) + (Math.random() - 0.5) * 15;
        data.push({
          timestamp: dayName,
          value: Math.round(val)
        });
      }
    }

    return data;
  }
};
