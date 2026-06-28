import { temperatureSensor } from './sensors/temperature.js';
import { humiditySensor } from './sensors/humidity.js';
import { airQualitySensor } from './sensors/airquality.js';

const registry = [
  temperatureSensor,
  humiditySensor,
  airQualitySensor
];

/**
 * Retorna todos los sensores registrados.
 * @returns {Array} Lista de sensores.
 */
export function getSensors() {
  return registry;
}

/**
 * Busca un sensor por su ID.
 * @param {string} id - El ID del sensor a buscar.
 * @returns {Object|undefined} El sensor correspondiente o undefined.
 */
export function getSensorById(id) {
  return registry.find(sensor => sensor.id === id);
}
