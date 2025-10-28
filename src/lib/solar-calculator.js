/**
 * Solar Position Calculator
 * Implementation of NOAA Solar Position Algorithm
 * Provides accurate sun position calculations for any location and time
 */

/**
 * Validates latitude and longitude coordinates
 * @param {number} latitude - Latitude in decimal degrees (-90 to 90)
 * @param {number} longitude - Longitude in decimal degrees (-180 to 180)
 * @returns {boolean} True if coordinates are valid
 */
export function validateCoordinates(latitude, longitude) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return false;
  }
  
  if (isNaN(latitude) || isNaN(longitude)) {
    return false;
  }
  
  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

/**
 * Converts degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
function toRadians(degrees) {
  return degrees * Math.PI / 180;
}

/**
 * Converts radians to degrees
 * @param {number} radians - Angle in radians
 * @returns {number} Angle in degrees
 */
function toDegrees(radians) {
  return radians * 180 / Math.PI;
}

/**
 * Calculates Julian Day Number for a given date
 * @param {Date} date - Date object
 * @returns {number} Julian Day Number
 */
function getJulianDay(date) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();
  const second = date.getUTCSeconds();
  
  const a = Math.floor((14 - month) / 12);
  const y = year - a;
  const m = month + 12 * a - 3;
  
  const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  const jd = jdn + (hour - 12) / 24 + minute / 1440 + second / 86400;
  
  return jd;
}

/**
 * Calculates the equation of time in minutes
 * @param {number} julianDay - Julian Day Number
 * @returns {number} Equation of time in minutes
 */
function getEquationOfTime(julianDay) {
  const n = julianDay - 2451545.0;
  const L = (280.460 + 0.9856474 * n) % 360;
  const g = toRadians((357.528 + 0.9856003 * n) % 360);
  const lambda = toRadians(L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g));
  
  const alpha = Math.atan2(Math.cos(toRadians(23.439)) * Math.sin(lambda), Math.cos(lambda));
  const E = 4 * toDegrees(toRadians(L) - alpha);
  
  return E;
}

/**
 * Calculates solar declination angle
 * @param {number} julianDay - Julian Day Number
 * @returns {number} Solar declination in degrees
 */
function getSolarDeclination(julianDay) {
  const n = julianDay - 2451545.0;
  const L = (280.460 + 0.9856474 * n) % 360;
  const g = toRadians((357.528 + 0.9856003 * n) % 360);
  const lambda = toRadians(L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g));
  
  const declination = Math.asin(Math.sin(toRadians(23.439)) * Math.sin(lambda));
  return toDegrees(declination);
}/*
*
 * Calculates sun position (azimuth and elevation) for given coordinates and time
 * Uses NOAA Solar Position Algorithm
 * @param {number} latitude - Latitude in decimal degrees
 * @param {number} longitude - Longitude in decimal degrees  
 * @param {Date} date - Date and time for calculation
 * @returns {Object} Object containing azimuth, elevation, and distance
 */
export function calculateSunPosition(latitude, longitude, date) {
  if (!validateCoordinates(latitude, longitude)) {
    throw new Error('Invalid coordinates provided');
  }
  
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Invalid date provided');
  }
  
  const julianDay = getJulianDay(date);
  const declination = getSolarDeclination(julianDay);
  const eqTime = getEquationOfTime(julianDay);
  
  // Calculate hour angle
  const timeOffset = eqTime + 4 * longitude;
  const trueSolarTime = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60 + timeOffset;
  const hourAngle = (trueSolarTime / 4) - 180;
  
  // Convert to radians
  const latRad = toRadians(latitude);
  const declRad = toRadians(declination);
  const hourAngleRad = toRadians(hourAngle);
  
  // Calculate elevation angle
  const elevation = Math.asin(
    Math.sin(declRad) * Math.sin(latRad) + 
    Math.cos(declRad) * Math.cos(latRad) * Math.cos(hourAngleRad)
  );
  
  // Calculate azimuth angle
  const azimuthRad = Math.atan2(
    Math.sin(hourAngleRad),
    Math.cos(hourAngleRad) * Math.sin(latRad) - Math.tan(declRad) * Math.cos(latRad)
  );
  
  let azimuth = toDegrees(azimuthRad) + 180;
  if (azimuth >= 360) azimuth -= 360;
  if (azimuth < 0) azimuth += 360;
  
  // Calculate distance (AU)
  const n = julianDay - 2451545.0;
  const g = toRadians((357.528 + 0.9856003 * n) % 360);
  const distance = 1.00014 - 0.01671 * Math.cos(g) - 0.00014 * Math.cos(2 * g);
  
  return {
    azimuth: azimuth,
    elevation: toDegrees(elevation),
    distance: distance
  };
}

/**
 * Calculates sunrise time for given coordinates and date
 * @param {number} latitude - Latitude in decimal degrees
 * @param {number} longitude - Longitude in decimal degrees
 * @param {Date} date - Date for calculation (time is ignored)
 * @returns {Date} Sunrise time in UTC
 */
export function calculateSunrise(latitude, longitude, date) {
  if (!validateCoordinates(latitude, longitude)) {
    throw new Error('Invalid coordinates provided');
  }
  
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const julianDay = getJulianDay(dateOnly);
  const declination = getSolarDeclination(julianDay);
  const eqTime = getEquationOfTime(julianDay);
  
  // Calculate hour angle for sunrise (sun elevation = -0.833 degrees)
  const latRad = toRadians(latitude);
  const declRad = toRadians(declination);
  const sunriseAngle = toRadians(-0.833);
  
  const cosHourAngle = (Math.sin(sunriseAngle) - Math.sin(latRad) * Math.sin(declRad)) / 
                       (Math.cos(latRad) * Math.cos(declRad));
  
  // Check for polar day/night
  if (cosHourAngle > 1) {
    return null; // Polar night - sun doesn't rise
  }
  if (cosHourAngle < -1) {
    return null; // Polar day - sun doesn't set
  }
  
  const hourAngle = toDegrees(Math.acos(cosHourAngle));
  const timeOffset = eqTime + 4 * longitude;
  const sunriseMinutes = 720 - 4 * hourAngle - timeOffset;
  
  const sunriseTime = new Date(dateOnly);
  sunriseTime.setUTCMinutes(sunriseMinutes);
  
  return sunriseTime;
}

/**
 * Calculates sunset time for given coordinates and date
 * @param {number} latitude - Latitude in decimal degrees
 * @param {number} longitude - Longitude in decimal degrees
 * @param {Date} date - Date for calculation (time is ignored)
 * @returns {Date} Sunset time in UTC
 */
export function calculateSunset(latitude, longitude, date) {
  if (!validateCoordinates(latitude, longitude)) {
    throw new Error('Invalid coordinates provided');
  }
  
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const julianDay = getJulianDay(dateOnly);
  const declination = getSolarDeclination(julianDay);
  const eqTime = getEquationOfTime(julianDay);
  
  // Calculate hour angle for sunset (sun elevation = -0.833 degrees)
  const latRad = toRadians(latitude);
  const declRad = toRadians(declination);
  const sunsetAngle = toRadians(-0.833);
  
  const cosHourAngle = (Math.sin(sunsetAngle) - Math.sin(latRad) * Math.sin(declRad)) / 
                       (Math.cos(latRad) * Math.cos(declRad));
  
  // Check for polar day/night
  if (cosHourAngle > 1) {
    return null; // Polar night - sun doesn't rise
  }
  if (cosHourAngle < -1) {
    return null; // Polar day - sun doesn't set
  }
  
  const hourAngle = toDegrees(Math.acos(cosHourAngle));
  const timeOffset = eqTime + 4 * longitude;
  const sunsetMinutes = 720 + 4 * hourAngle - timeOffset;
  
  const sunsetTime = new Date(dateOnly);
  sunsetTime.setUTCMinutes(sunsetMinutes);
  
  return sunsetTime;
}

/**
 * Calculates solar noon time for given coordinates and date
 * @param {number} latitude - Latitude in decimal degrees
 * @param {number} longitude - Longitude in decimal degrees
 * @param {Date} date - Date for calculation (time is ignored)
 * @returns {Date} Solar noon time in UTC
 */
export function calculateSolarNoon(latitude, longitude, date) {
  if (!validateCoordinates(latitude, longitude)) {
    throw new Error('Invalid coordinates provided');
  }
  
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const julianDay = getJulianDay(dateOnly);
  const eqTime = getEquationOfTime(julianDay);
  
  const timeOffset = eqTime + 4 * longitude;
  const solarNoonMinutes = 720 - timeOffset;
  
  const solarNoonTime = new Date(dateOnly);
  solarNoonTime.setUTCMinutes(solarNoonMinutes);
  
  return solarNoonTime;
}

/**
 * Normalizes date to handle edge cases and ensure proper date handling
 * @param {Date} date - Input date
 * @returns {Date} Normalized date
 */
export function normalizeDate(date) {
  if (!(date instanceof Date)) {
    throw new Error('Input must be a Date object');
  }
  
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date provided');
  }
  
  // Clamp date to reasonable range (year 1000 to 3000)
  const year = date.getFullYear();
  if (year < 1000 || year > 3000) {
    throw new Error('Date must be between years 1000 and 3000');
  }
  
  return new Date(date.getTime());
}