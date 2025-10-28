/**
 * Timezone and DST Handler
 * Provides timezone lookup and DST-aware time conversions
 */

import { validateCoordinates } from './solar-calculator.js';

/**
 * Gets timezone for coordinates using browser's Intl API
 * This is a fallback method when external timezone service is not available
 * @param {number} latitude - Latitude in decimal degrees
 * @param {number} longitude - Longitude in decimal degrees
 * @returns {string} IANA timezone identifier
 */
function getTimezoneFromBrowser(latitude, longitude) {
  // This is a simplified approach - in production, you'd want to use a proper timezone lookup service
  // For now, we'll use the browser's timezone as a fallback
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Timezone lookup cache to avoid repeated API calls
 */
const timezoneCache = new Map();

/**
 * Gets timezone for given coordinates
 * Uses a simple coordinate-to-timezone mapping for common locations
 * In production, this would integrate with a timezone lookup service
 * @param {number} latitude - Latitude in decimal degrees
 * @param {number} longitude - Longitude in decimal degrees
 * @returns {Promise<string>} IANA timezone identifier
 */
export async function getTimezoneForCoordinates(latitude, longitude) {
  if (!validateCoordinates(latitude, longitude)) {
    throw new Error('Invalid coordinates provided');
  }
  
  const cacheKey = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
  
  if (timezoneCache.has(cacheKey)) {
    return timezoneCache.get(cacheKey);
  }
  
  let timezone;
  
  try {
    // Simple coordinate-based timezone detection for major regions
    timezone = getTimezoneFromCoordinates(latitude, longitude);
    
    if (!timezone) {
      // Fallback to browser timezone
      timezone = getTimezoneFromBrowser(latitude, longitude);
    }
    
    timezoneCache.set(cacheKey, timezone);
    return timezone;
    
  } catch (error) {
    console.warn('Timezone lookup failed, using browser timezone:', error);
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    timezoneCache.set(cacheKey, timezone);
    return timezone;
  }
}

/**
 * Simple coordinate-based timezone detection for major regions
 * This is a basic implementation - production apps should use a proper timezone service
 * @param {number} latitude - Latitude in decimal degrees
 * @param {number} longitude - Longitude in decimal degrees
 * @returns {string|null} IANA timezone identifier or null if not found
 */
function getTimezoneFromCoordinates(latitude, longitude) {
  // North America
  if (latitude >= 25 && latitude <= 70 && longitude >= -170 && longitude <= -50) {
    if (longitude >= -130 && longitude <= -110) return 'America/Los_Angeles';
    if (longitude >= -110 && longitude <= -100) return 'America/Denver';
    if (longitude >= -100 && longitude <= -80) return 'America/Chicago';
    if (longitude >= -80 && longitude <= -65) return 'America/New_York';
    if (longitude >= -170 && longitude <= -130) return 'Pacific/Honolulu';
  }
  
  // Europe
  if (latitude >= 35 && latitude <= 70 && longitude >= -10 && longitude <= 40) {
    if (longitude >= -10 && longitude <= 5) return 'Europe/London';
    if (longitude >= 5 && longitude <= 15) return 'Europe/Paris';
    if (longitude >= 15 && longitude <= 25) return 'Europe/Berlin';
    if (longitude >= 25 && longitude <= 40) return 'Europe/Moscow';
  }
  
  // Asia
  if (latitude >= 10 && latitude <= 70 && longitude >= 60 && longitude <= 180) {
    if (longitude >= 60 && longitude <= 90) return 'Asia/Kolkata';
    if (longitude >= 90 && longitude <= 120) return 'Asia/Shanghai';
    if (longitude >= 120 && longitude <= 150) return 'Asia/Tokyo';
  }
  
  // Australia
  if (latitude >= -45 && latitude <= -10 && longitude >= 110 && longitude <= 180) {
    if (longitude >= 110 && longitude <= 130) return 'Australia/Perth';
    if (longitude >= 130 && longitude <= 145) return 'Australia/Adelaide';
    if (longitude >= 145 && longitude <= 155) return 'Australia/Sydney';
  }
  
  // South America
  if (latitude >= -60 && latitude <= 15 && longitude >= -85 && longitude <= -30) {
    if (longitude >= -85 && longitude <= -65) return 'America/Lima';
    if (longitude >= -65 && longitude <= -45) return 'America/Sao_Paulo';
    if (longitude >= -45 && longitude <= -30) return 'America/Argentina/Buenos_Aires';
  }
  
  // Africa
  if (latitude >= -35 && latitude <= 35 && longitude >= -20 && longitude <= 50) {
    if (longitude >= -20 && longitude <= 10) return 'Africa/Lagos';
    if (longitude >= 10 && longitude <= 30) return 'Africa/Cairo';
    if (longitude >= 30 && longitude <= 50) return 'Africa/Nairobi';
  }
  
  return null;
}

/**
 * Converts UTC time to local time for a specific timezone
 * @param {Date} utcDate - UTC date to convert
 * @param {string} timezone - IANA timezone identifier
 * @returns {Date} Local date in the specified timezone
 */
export function convertUTCToTimezone(utcDate, timezone) {
  if (!(utcDate instanceof Date) || isNaN(utcDate.getTime())) {
    throw new Error('Invalid date provided');
  }
  
  if (!timezone || typeof timezone !== 'string') {
    throw new Error('Invalid timezone provided');
  }
  
  try {
    // Create a new date in the target timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const parts = formatter.formatToParts(utcDate);
    const partsObj = {};
    parts.forEach(part => {
      partsObj[part.type] = part.value;
    });
    
    const localDate = new Date(
      parseInt(partsObj.year),
      parseInt(partsObj.month) - 1,
      parseInt(partsObj.day),
      parseInt(partsObj.hour),
      parseInt(partsObj.minute),
      parseInt(partsObj.second)
    );
    
    return localDate;
    
  } catch (error) {
    console.warn('Timezone conversion failed:', error);
    return new Date(utcDate);
  }
}

/**
 * Converts local time to UTC for a specific timezone
 * @param {Date} localDate - Local date to convert
 * @param {string} timezone - IANA timezone identifier
 * @returns {Date} UTC date
 */
export function convertTimezoneToUTC(localDate, timezone) {
  if (!(localDate instanceof Date) || isNaN(localDate.getTime())) {
    throw new Error('Invalid date provided');
  }
  
  if (!timezone || typeof timezone !== 'string') {
    throw new Error('Invalid timezone provided');
  }
  
  try {
    // Get the timezone offset for the given date
    const tempDate = new Date(localDate.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tempLocal = new Date(localDate.toLocaleString('en-US', { timeZone: timezone }));
    const offset = tempLocal.getTime() - tempDate.getTime();
    
    return new Date(localDate.getTime() - offset);
    
  } catch (error) {
    console.warn('Timezone conversion failed:', error);
    return new Date(localDate);
  }
}

/**
 * Checks if DST is active for a given date and timezone
 * @param {Date} date - Date to check
 * @param {string} timezone - IANA timezone identifier
 * @returns {boolean} True if DST is active
 */
export function isDSTActive(date, timezone) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Invalid date provided');
  }
  
  if (!timezone || typeof timezone !== 'string') {
    throw new Error('Invalid timezone provided');
  }
  
  try {
    // Create dates for January and July to compare offsets
    const january = new Date(date.getFullYear(), 0, 1);
    const july = new Date(date.getFullYear(), 6, 1);
    
    const janOffset = getTimezoneOffset(january, timezone);
    const julyOffset = getTimezoneOffset(july, timezone);
    const currentOffset = getTimezoneOffset(date, timezone);
    
    // DST is active if current offset is different from standard time offset
    const standardOffset = Math.max(janOffset, julyOffset);
    return currentOffset < standardOffset;
    
  } catch (error) {
    console.warn('DST check failed:', error);
    return false;
  }
}

/**
 * Gets timezone offset in minutes for a specific date and timezone
 * @param {Date} date - Date to get offset for
 * @param {string} timezone - IANA timezone identifier
 * @returns {number} Offset in minutes (positive for east of UTC)
 */
function getTimezoneOffset(date, timezone) {
  const utc = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const local = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  return (local.getTime() - utc.getTime()) / (1000 * 60);
}

/**
 * Gets timezone information for coordinates including DST status
 * @param {number} latitude - Latitude in decimal degrees
 * @param {number} longitude - Longitude in decimal degrees
 * @param {Date} date - Date to check DST status for
 * @returns {Promise<Object>} Timezone information object
 */
export async function getTimezoneInfo(latitude, longitude, date = new Date()) {
  if (!validateCoordinates(latitude, longitude)) {
    throw new Error('Invalid coordinates provided');
  }
  
  const timezone = await getTimezoneForCoordinates(latitude, longitude);
  const isDST = isDSTActive(date, timezone);
  const offset = getTimezoneOffset(date, timezone);
  
  return {
    timezone,
    isDST,
    offsetMinutes: offset,
    offsetHours: offset / 60,
    displayName: getTimezoneDisplayName(timezone, date)
  };
}

/**
 * Gets human-readable timezone display name
 * @param {string} timezone - IANA timezone identifier
 * @param {Date} date - Date for DST-aware display name
 * @returns {string} Human-readable timezone name
 */
function getTimezoneDisplayName(timezone, date) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'long'
    }).formatToParts(date).find(part => part.type === 'timeZoneName')?.value || timezone;
  } catch (error) {
    return timezone;
  }
}

/**
 * Converts sun times from UTC to local timezone
 * @param {Object} sunTimes - Sun times object with UTC dates
 * @param {string} timezone - Target timezone
 * @returns {Object} Sun times converted to local timezone
 */
export function convertSunTimesToTimezone(sunTimes, timezone) {
  if (!sunTimes || typeof sunTimes !== 'object') {
    throw new Error('Invalid sun times object provided');
  }
  
  if (!timezone || typeof timezone !== 'string') {
    throw new Error('Invalid timezone provided');
  }
  
  const convertedTimes = { ...sunTimes };
  
  // Convert basic times
  if (sunTimes.sunrise) {
    convertedTimes.sunrise = convertUTCToTimezone(sunTimes.sunrise, timezone);
  }
  if (sunTimes.sunset) {
    convertedTimes.sunset = convertUTCToTimezone(sunTimes.sunset, timezone);
  }
  if (sunTimes.solarNoon) {
    convertedTimes.solarNoon = convertUTCToTimezone(sunTimes.solarNoon, timezone);
  }
  
  // Convert golden hour times
  if (sunTimes.goldenHour) {
    convertedTimes.goldenHour = {
      morning: {
        start: sunTimes.goldenHour.morning.start ? convertUTCToTimezone(sunTimes.goldenHour.morning.start, timezone) : null,
        end: sunTimes.goldenHour.morning.end ? convertUTCToTimezone(sunTimes.goldenHour.morning.end, timezone) : null
      },
      evening: {
        start: sunTimes.goldenHour.evening.start ? convertUTCToTimezone(sunTimes.goldenHour.evening.start, timezone) : null,
        end: sunTimes.goldenHour.evening.end ? convertUTCToTimezone(sunTimes.goldenHour.evening.end, timezone) : null
      }
    };
  }
  
  // Convert blue hour times
  if (sunTimes.blueHour) {
    convertedTimes.blueHour = {
      morning: {
        start: sunTimes.blueHour.morning.start ? convertUTCToTimezone(sunTimes.blueHour.morning.start, timezone) : null,
        end: sunTimes.blueHour.morning.end ? convertUTCToTimezone(sunTimes.blueHour.morning.end, timezone) : null
      },
      evening: {
        start: sunTimes.blueHour.evening.start ? convertUTCToTimezone(sunTimes.blueHour.evening.start, timezone) : null,
        end: sunTimes.blueHour.evening.end ? convertUTCToTimezone(sunTimes.blueHour.evening.end, timezone) : null
      }
    };
  }
  
  // Convert twilight times
  if (sunTimes.twilight) {
    convertedTimes.twilight = {};
    ['civil', 'nautical', 'astronomical'].forEach(type => {
      if (sunTimes.twilight[type]) {
        convertedTimes.twilight[type] = {
          morning: {
            start: sunTimes.twilight[type].morning.start ? convertUTCToTimezone(sunTimes.twilight[type].morning.start, timezone) : null,
            end: sunTimes.twilight[type].morning.end ? convertUTCToTimezone(sunTimes.twilight[type].morning.end, timezone) : null
          },
          evening: {
            start: sunTimes.twilight[type].evening.start ? convertUTCToTimezone(sunTimes.twilight[type].evening.start, timezone) : null,
            end: sunTimes.twilight[type].evening.end ? convertUTCToTimezone(sunTimes.twilight[type].evening.end, timezone) : null
          }
        };
      }
    });
  }
  
  return convertedTimes;
}