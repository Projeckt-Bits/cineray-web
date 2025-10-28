/**
 * Sun Times Calculator
 * Calculates golden hour, blue hour, twilight periods, and sun path
 */

import { 
  validateCoordinates, 
  calculateSunPosition, 
  calculateSunrise, 
  calculateSunset, 
  calculateSolarNoon,
  normalizeDate 
} from './solar-calculator.js';

/**
 * Calculates time when sun reaches specific elevation angle
 * @param {number} latitude - Latitude in decimal degrees
 * @param {number} longitude - Longitude in decimal degrees
 * @param {Date} date - Date for calculation
 * @param {number} elevation - Target elevation angle in degrees
 * @param {boolean} rising - True for sunrise direction, false for sunset
 * @returns {Date|null} Time when sun reaches elevation, or null if never reached
 */
function calculateTimeForElevation(latitude, longitude, date, elevation, rising = true) {
  if (!validateCoordinates(latitude, longitude)) {
    throw new Error('Invalid coordinates provided');
  }
  
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  // Use binary search to find the time when sun reaches target elevation
  let startTime, endTime;
  
  if (rising) {
    startTime = new Date(dateOnly);
    startTime.setUTCHours(0, 0, 0, 0);
    endTime = new Date(dateOnly);
    endTime.setUTCHours(12, 0, 0, 0);
  } else {
    startTime = new Date(dateOnly);
    startTime.setUTCHours(12, 0, 0, 0);
    endTime = new Date(dateOnly);
    endTime.setUTCHours(23, 59, 59, 999);
  }
  
  let iterations = 0;
  const maxIterations = 50;
  const tolerance = 0.01; // degrees
  
  while (iterations < maxIterations && (endTime - startTime) > 60000) { // 1 minute precision
    const midTime = new Date((startTime.getTime() + endTime.getTime()) / 2);
    const sunPos = calculateSunPosition(latitude, longitude, midTime);
    
    if (Math.abs(sunPos.elevation - elevation) < tolerance) {
      return midTime;
    }
    
    if (rising) {
      if (sunPos.elevation < elevation) {
        startTime = midTime;
      } else {
        endTime = midTime;
      }
    } else {
      if (sunPos.elevation > elevation) {
        startTime = midTime;
      } else {
        endTime = midTime;
      }
    }
    
    iterations++;
  }
  
  // Check if we found a valid time
  const finalTime = new Date((startTime.getTime() + endTime.getTime()) / 2);
  const finalPos = calculateSunPosition(latitude, longitude, finalTime);
  
  if (Math.abs(finalPos.elevation - elevation) < 1.0) { // 1 degree tolerance
    return finalTime;
  }
  
  return null; // Target elevation not reached
}

/**
 * Calculates golden hour times (sun elevation between -6° and 6°)
 * @param {number} latitude - Latitude in decimal degrees
 * @param {number} longitude - Longitude in decimal degrees
 * @param {Date} date - Date for calculation
 * @returns {Object} Golden hour start and end times
 */
export function calculateGoldenHour(latitude, longitude, date) {
  if (!validateCoordinates(latitude, longitude)) {
    throw new Error('Invalid coordinates provided');
  }
  
  const normalizedDate = normalizeDate(date);
  
  // Morning golden hour: from -6° to 6° elevation
  const morningStart = calculateTimeForElevation(latitude, longitude, normalizedDate, -6, true);
  const morningEnd = calculateTimeForElevation(latitude, longitude, normalizedDate, 6, true);
  
  // Evening golden hour: from 6° to -6° elevation
  const eveningStart = calculateTimeForElevation(latitude, longitude, normalizedDate, 6, false);
  const eveningEnd = calculateTimeForElevation(latitude, longitude, normalizedDate, -6, false);
  
  return {
    morning: {
      start: morningStart,
      end: morningEnd
    },
    evening: {
      start: eveningStart,
      end: eveningEnd
    }
  };
}

/**
 * Calculates blue hour times (civil twilight period)
 * @param {number} latitude - Latitude in decimal degrees
 * @param {number} longitude - Longitude in decimal degrees
 * @param {Date} date - Date for calculation
 * @returns {Object} Blue hour start and end times
 */
export function calculateBlueHour(latitude, longitude, date) {
  if (!validateCoordinates(latitude, longitude)) {
    throw new Error('Invalid coordinates provided');
  }
  
  const normalizedDate = normalizeDate(date);
  
  // Morning blue hour: from -12° to -6° elevation
  const morningStart = calculateTimeForElevation(latitude, longitude, normalizedDate, -12, true);
  const morningEnd = calculateTimeForElevation(latitude, longitude, normalizedDate, -6, true);
  
  // Evening blue hour: from -6° to -12° elevation
  const eveningStart = calculateTimeForElevation(latitude, longitude, normalizedDate, -6, false);
  const eveningEnd = calculateTimeForElevation(latitude, longitude, normalizedDate, -12, false);
  
  return {
    morning: {
      start: morningStart,
      end: morningEnd
    },
    evening: {
      start: eveningStart,
      end: eveningEnd
    }
  };
}

/**
 * Calculates twilight periods (civil, nautical, astronomical)
 * @param {number} latitude - Latitude in decimal degrees
 * @param {number} longitude - Longitude in decimal degrees
 * @param {Date} date - Date for calculation
 * @returns {Object} Twilight periods with start and end times
 */
export function calculateTwilightPeriods(latitude, longitude, date) {
  if (!validateCoordinates(latitude, longitude)) {
    throw new Error('Invalid coordinates provided');
  }
  
  const normalizedDate = normalizeDate(date);
  
  // Civil twilight: -6° elevation
  const civilMorningStart = calculateTimeForElevation(latitude, longitude, normalizedDate, -6, true);
  const civilEveningEnd = calculateTimeForElevation(latitude, longitude, normalizedDate, -6, false);
  
  // Nautical twilight: -12° elevation
  const nauticalMorningStart = calculateTimeForElevation(latitude, longitude, normalizedDate, -12, true);
  const nauticalEveningEnd = calculateTimeForElevation(latitude, longitude, normalizedDate, -12, false);
  
  // Astronomical twilight: -18° elevation
  const astronomicalMorningStart = calculateTimeForElevation(latitude, longitude, normalizedDate, -18, true);
  const astronomicalEveningEnd = calculateTimeForElevation(latitude, longitude, normalizedDate, -18, false);
  
  const sunrise = calculateSunrise(latitude, longitude, normalizedDate);
  const sunset = calculateSunset(latitude, longitude, normalizedDate);
  
  return {
    civil: {
      morning: {
        start: civilMorningStart,
        end: sunrise
      },
      evening: {
        start: sunset,
        end: civilEveningEnd
      }
    },
    nautical: {
      morning: {
        start: nauticalMorningStart,
        end: civilMorningStart
      },
      evening: {
        start: civilEveningEnd,
        end: nauticalEveningEnd
      }
    },
    astronomical: {
      morning: {
        start: astronomicalMorningStart,
        end: nauticalMorningStart
      },
      evening: {
        start: nauticalEveningEnd,
        end: astronomicalEveningEnd
      }
    }
  };
}/**
 *
 Generates sun path for a full day with specified time intervals
 * @param {number} latitude - Latitude in decimal degrees
 * @param {number} longitude - Longitude in decimal degrees
 * @param {Date} date - Date for calculation
 * @param {number} intervalMinutes - Time interval between points in minutes (default: 15)
 * @returns {Array} Array of sun path points with time, azimuth, and elevation
 */
export function generateSunPath(latitude, longitude, date, intervalMinutes = 15) {
  if (!validateCoordinates(latitude, longitude)) {
    throw new Error('Invalid coordinates provided');
  }
  
  if (intervalMinutes <= 0 || intervalMinutes > 1440) {
    throw new Error('Interval must be between 1 and 1440 minutes');
  }
  
  const normalizedDate = normalizeDate(date);
  const sunPath = [];
  
  // Start from midnight of the given date
  const startTime = new Date(normalizedDate.getFullYear(), normalizedDate.getMonth(), normalizedDate.getDate(), 0, 0, 0, 0);
  
  // Generate points for 24 hours
  for (let minutes = 0; minutes < 1440; minutes += intervalMinutes) {
    const currentTime = new Date(startTime.getTime() + minutes * 60000);
    const sunPosition = calculateSunPosition(latitude, longitude, currentTime);
    
    sunPath.push({
      time: new Date(currentTime),
      azimuth: sunPosition.azimuth,
      elevation: sunPosition.elevation,
      distance: sunPosition.distance
    });
  }
  
  return sunPath;
}

/**
 * Calculates comprehensive sun times for a given location and date
 * @param {number} latitude - Latitude in decimal degrees
 * @param {number} longitude - Longitude in decimal degrees
 * @param {Date} date - Date for calculation
 * @returns {Object} Complete sun times including sunrise, sunset, golden hour, blue hour, and twilight
 */
export function calculateSunTimes(latitude, longitude, date) {
  if (!validateCoordinates(latitude, longitude)) {
    throw new Error('Invalid coordinates provided');
  }
  
  const normalizedDate = normalizeDate(date);
  
  // Basic sun times
  const sunrise = calculateSunrise(latitude, longitude, normalizedDate);
  const sunset = calculateSunset(latitude, longitude, normalizedDate);
  const solarNoon = calculateSolarNoon(latitude, longitude, normalizedDate);
  
  // Special lighting periods
  const goldenHour = calculateGoldenHour(latitude, longitude, normalizedDate);
  const blueHour = calculateBlueHour(latitude, longitude, normalizedDate);
  const twilight = calculateTwilightPeriods(latitude, longitude, normalizedDate);
  
  // Calculate day length
  let dayLength = null;
  if (sunrise && sunset) {
    dayLength = (sunset.getTime() - sunrise.getTime()) / (1000 * 60 * 60); // hours
  }
  
  return {
    date: new Date(normalizedDate),
    sunrise,
    sunset,
    solarNoon,
    dayLength,
    goldenHour,
    blueHour,
    twilight
  };
}

/**
 * Gets sun path points only when sun is above horizon
 * @param {number} latitude - Latitude in decimal degrees
 * @param {number} longitude - Longitude in decimal degrees
 * @param {Date} date - Date for calculation
 * @param {number} intervalMinutes - Time interval between points in minutes
 * @returns {Array} Array of sun path points only when sun is visible
 */
export function generateVisibleSunPath(latitude, longitude, date, intervalMinutes = 15) {
  const fullPath = generateSunPath(latitude, longitude, date, intervalMinutes);
  return fullPath.filter(point => point.elevation > 0);
}

/**
 * Finds the sun position at a specific time of day
 * @param {number} latitude - Latitude in decimal degrees
 * @param {number} longitude - Longitude in decimal degrees
 * @param {Date} date - Date for calculation
 * @param {number} hour - Hour of day (0-23)
 * @param {number} minute - Minute of hour (0-59)
 * @returns {Object} Sun position at specified time
 */
export function getSunPositionAtTime(latitude, longitude, date, hour, minute = 0) {
  if (!validateCoordinates(latitude, longitude)) {
    throw new Error('Invalid coordinates provided');
  }
  
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new Error('Invalid time provided');
  }
  
  const normalizedDate = normalizeDate(date);
  const targetTime = new Date(normalizedDate.getFullYear(), normalizedDate.getMonth(), normalizedDate.getDate(), hour, minute, 0, 0);
  
  const sunPosition = calculateSunPosition(latitude, longitude, targetTime);
  
  return {
    time: new Date(targetTime),
    ...sunPosition
  };
}

/**
 * Determines if it's currently day or night based on sun elevation
 * @param {number} latitude - Latitude in decimal degrees
 * @param {number} longitude - Longitude in decimal degrees
 * @param {Date} date - Date and time for calculation
 * @returns {Object} Day/night status and current sun position
 */
export function getDayNightStatus(latitude, longitude, date) {
  if (!validateCoordinates(latitude, longitude)) {
    throw new Error('Invalid coordinates provided');
  }
  
  const normalizedDate = normalizeDate(date);
  const sunPosition = calculateSunPosition(latitude, longitude, normalizedDate);
  
  let status = 'night';
  if (sunPosition.elevation > 0) {
    status = 'day';
  } else if (sunPosition.elevation > -6) {
    status = 'civil_twilight';
  } else if (sunPosition.elevation > -12) {
    status = 'nautical_twilight';
  } else if (sunPosition.elevation > -18) {
    status = 'astronomical_twilight';
  }
  
  return {
    status,
    sunPosition,
    isVisible: sunPosition.elevation > 0
  };
}