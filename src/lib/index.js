/**
 * Sun Tracking Library
 * Main export file for all sun calculation functionality
 */

// Solar Calculator exports
export {
  validateCoordinates,
  calculateSunPosition,
  calculateSunrise,
  calculateSunset,
  calculateSolarNoon,
  normalizeDate
} from './solar-calculator.js';

// Sun Times exports
export {
  calculateGoldenHour,
  calculateBlueHour,
  calculateTwilightPeriods,
  generateSunPath,
  calculateSunTimes,
  generateVisibleSunPath,
  getSunPositionAtTime,
  getDayNightStatus
} from './sun-times.js';

// Timezone Handler exports
export {
  getTimezoneForCoordinates,
  convertUTCToTimezone,
  convertTimezoneToUTC,
  isDSTActive,
  getTimezoneInfo,
  convertSunTimesToTimezone
} from './timezone-handler.js';

// Geolocation Service exports
export {
  getCurrentPosition,
  watchPosition,
  clearWatch,
  validateManualLocation,
  getLocationWithFallback,
  checkGeolocationPermission,
  requestGeolocationPermission,
  getAccuracyLevel,
  formatLocationForDisplay,
  calculateDistance,
  hasLocationChanged,
  getCachedLocation,
  cacheLocation,
  clearCachedLocation,
  GeolocationError,
  GEOLOCATION_ERRORS
} from './geolocation-service.js';