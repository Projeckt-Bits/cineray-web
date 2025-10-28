/**
 * Unit tests for sun times calculator
 * Tests golden hour, blue hour, twilight periods, and sun path generation
 */

import { describe, it, expect } from 'vitest';
import {
  calculateGoldenHour,
  calculateBlueHour,
  calculateTwilightPeriods,
  generateSunPath,
  calculateSunTimes,
  generateVisibleSunPath,
  getSunPositionAtTime,
  getDayNightStatus
} from '../sun-times.js';

describe('Sun Times Calculator', () => {
  const testLocation = [40.7128, -74.0060]; // New York
  const testDate = new Date('2024-06-21T00:00:00Z'); // Summer solstice

  describe('calculateGoldenHour', () => {
    it('should calculate golden hour times for New York', () => {
      const goldenHour = calculateGoldenHour(...testLocation, testDate);
      
      expect(goldenHour).toHaveProperty('morning');
      expect(goldenHour).toHaveProperty('evening');
      expect(goldenHour.morning).toHaveProperty('start');
      expect(goldenHour.morning).toHaveProperty('end');
      expect(goldenHour.evening).toHaveProperty('start');
      expect(goldenHour.evening).toHaveProperty('end');
      
      // Morning golden hour should end before evening golden hour starts
      if (goldenHour.morning.end && goldenHour.evening.start) {
        expect(goldenHour.morning.end.getTime()).toBeLessThan(goldenHour.evening.start.getTime());
      }
    });

    it('should handle polar regions during summer', () => {
      // North of Arctic Circle during summer solstice
      const polarGoldenHour = calculateGoldenHour(70, 0, testDate);
      
      // May not have traditional golden hour due to midnight sun
      expect(polarGoldenHour).toHaveProperty('morning');
      expect(polarGoldenHour).toHaveProperty('evening');
    });

    it('should validate coordinates', () => {
      expect(() => calculateGoldenHour(91, 0, testDate)).toThrow('Invalid coordinates');
      expect(() => calculateGoldenHour(0, 181, testDate)).toThrow('Invalid coordinates');
    });
  });

  describe('calculateBlueHour', () => {
    it('should calculate blue hour times for New York', () => {
      const blueHour = calculateBlueHour(...testLocation, testDate);
      
      expect(blueHour).toHaveProperty('morning');
      expect(blueHour).toHaveProperty('evening');
      expect(blueHour.morning).toHaveProperty('start');
      expect(blueHour.morning).toHaveProperty('end');
      expect(blueHour.evening).toHaveProperty('start');
      expect(blueHour.evening).toHaveProperty('end');
      
      // Blue hour should occur before/after golden hour
      const goldenHour = calculateGoldenHour(...testLocation, testDate);
      
      if (blueHour.morning.end && goldenHour.morning.start) {
        expect(blueHour.morning.end.getTime()).toBeLessThanOrEqual(goldenHour.morning.start.getTime());
      }
      
      if (goldenHour.evening.end && blueHour.evening.start) {
        expect(goldenHour.evening.end.getTime()).toBeLessThanOrEqual(blueHour.evening.start.getTime());
      }
    });

    it('should handle different seasons', () => {
      const winterDate = new Date('2024-12-21T00:00:00Z');
      const winterBlueHour = calculateBlueHour(...testLocation, winterDate);
      const summerBlueHour = calculateBlueHour(...testLocation, testDate);
      
      expect(winterBlueHour).toHaveProperty('morning');
      expect(winterBlueHour).toHaveProperty('evening');
      expect(summerBlueHour).toHaveProperty('morning');
      expect(summerBlueHour).toHaveProperty('evening');
    });
  });

  describe('calculateTwilightPeriods', () => {
    it('should calculate all twilight periods', () => {
      const twilight = calculateTwilightPeriods(...testLocation, testDate);
      
      expect(twilight).toHaveProperty('civil');
      expect(twilight).toHaveProperty('nautical');
      expect(twilight).toHaveProperty('astronomical');
      
      ['civil', 'nautical', 'astronomical'].forEach(type => {
        expect(twilight[type]).toHaveProperty('morning');
        expect(twilight[type]).toHaveProperty('evening');
        expect(twilight[type].morning).toHaveProperty('start');
        expect(twilight[type].morning).toHaveProperty('end');
        expect(twilight[type].evening).toHaveProperty('start');
        expect(twilight[type].evening).toHaveProperty('end');
      });
    });

    it('should have correct twilight order', () => {
      const twilight = calculateTwilightPeriods(...testLocation, testDate);
      
      // Morning: astronomical -> nautical -> civil -> sunrise
      if (twilight.astronomical.morning.start && twilight.nautical.morning.start) {
        expect(twilight.astronomical.morning.start.getTime())
          .toBeLessThanOrEqual(twilight.nautical.morning.start.getTime());
      }
      
      if (twilight.nautical.morning.start && twilight.civil.morning.start) {
        expect(twilight.nautical.morning.start.getTime())
          .toBeLessThanOrEqual(twilight.civil.morning.start.getTime());
      }
      
      // Evening: sunset -> civil -> nautical -> astronomical
      if (twilight.civil.evening.end && twilight.nautical.evening.end) {
        expect(twilight.civil.evening.end.getTime())
          .toBeLessThanOrEqual(twilight.nautical.evening.end.getTime());
      }
      
      if (twilight.nautical.evening.end && twilight.astronomical.evening.end) {
        expect(twilight.nautical.evening.end.getTime())
          .toBeLessThanOrEqual(twilight.astronomical.evening.end.getTime());
      }
    });
  });

  describe('generateSunPath', () => {
    it('should generate sun path with default interval', () => {
      const sunPath = generateSunPath(...testLocation, testDate);
      
      expect(Array.isArray(sunPath)).toBe(true);
      expect(sunPath.length).toBeGreaterThan(0);
      
      // Should have 96 points for 15-minute intervals (1440 minutes / 15)
      expect(sunPath.length).toBe(96);
      
      sunPath.forEach(point => {
        expect(point).toHaveProperty('time');
        expect(point).toHaveProperty('azimuth');
        expect(point).toHaveProperty('elevation');
        expect(point).toHaveProperty('distance');
        expect(point.time).toBeInstanceOf(Date);
        expect(point.azimuth).toBeGreaterThanOrEqual(0);
        expect(point.azimuth).toBeLessThan(360);
        expect(point.elevation).toBeGreaterThan(-90);
        expect(point.elevation).toBeLessThan(90);
      });
    });

    it('should generate sun path with custom interval', () => {
      const sunPath = generateSunPath(...testLocation, testDate, 60); // 1-hour intervals
      
      expect(sunPath.length).toBe(24); // 24 hours
      
      // Check time progression
      for (let i = 1; i < sunPath.length; i++) {
        const timeDiff = sunPath[i].time.getTime() - sunPath[i-1].time.getTime();
        expect(timeDiff).toBe(60 * 60 * 1000); // 1 hour in milliseconds
      }
    });

    it('should validate interval parameter', () => {
      expect(() => generateSunPath(...testLocation, testDate, 0)).toThrow('Interval must be between 1 and 1440 minutes');
      expect(() => generateSunPath(...testLocation, testDate, 1441)).toThrow('Interval must be between 1 and 1440 minutes');
      expect(() => generateSunPath(...testLocation, testDate, -10)).toThrow('Interval must be between 1 and 1440 minutes');
    });
  });

  describe('generateVisibleSunPath', () => {
    it('should only include points when sun is above horizon', () => {
      const visiblePath = generateVisibleSunPath(...testLocation, testDate);
      
      expect(Array.isArray(visiblePath)).toBe(true);
      
      visiblePath.forEach(point => {
        expect(point.elevation).toBeGreaterThan(0);
      });
      
      // Should be fewer points than full path
      const fullPath = generateSunPath(...testLocation, testDate);
      expect(visiblePath.length).toBeLessThan(fullPath.length);
    });

    it('should handle polar day conditions', () => {
      // North of Arctic Circle during summer solstice
      const polarDate = new Date('2024-06-21T00:00:00Z');
      const visiblePath = generateVisibleSunPath(70, 0, polarDate);
      
      // During polar day, most or all points should be visible
      expect(visiblePath.length).toBeGreaterThan(0);
    });

    it('should handle polar night conditions', () => {
      // North of Arctic Circle during winter solstice
      const polarNightDate = new Date('2024-12-21T00:00:00Z');
      const visiblePath = generateVisibleSunPath(70, 0, polarNightDate);
      
      // During polar night, there may be no visible points
      expect(Array.isArray(visiblePath)).toBe(true);
    });
  });

  describe('calculateSunTimes', () => {
    it('should calculate comprehensive sun times', () => {
      const sunTimes = calculateSunTimes(...testLocation, testDate);
      
      expect(sunTimes).toHaveProperty('date');
      expect(sunTimes).toHaveProperty('sunrise');
      expect(sunTimes).toHaveProperty('sunset');
      expect(sunTimes).toHaveProperty('solarNoon');
      expect(sunTimes).toHaveProperty('dayLength');
      expect(sunTimes).toHaveProperty('goldenHour');
      expect(sunTimes).toHaveProperty('blueHour');
      expect(sunTimes).toHaveProperty('twilight');
      
      expect(sunTimes.date).toBeInstanceOf(Date);
      
      if (sunTimes.sunrise && sunTimes.sunset) {
        expect(sunTimes.sunrise).toBeInstanceOf(Date);
        expect(sunTimes.sunset).toBeInstanceOf(Date);
        expect(sunTimes.sunset.getTime()).toBeGreaterThan(sunTimes.sunrise.getTime());
        expect(sunTimes.dayLength).toBeGreaterThan(0);
        expect(sunTimes.dayLength).toBeLessThan(24);
      }
      
      if (sunTimes.solarNoon) {
        expect(sunTimes.solarNoon).toBeInstanceOf(Date);
      }
    });

    it('should handle different seasons correctly', () => {
      const summerTimes = calculateSunTimes(...testLocation, new Date('2024-06-21T00:00:00Z'));
      const winterTimes = calculateSunTimes(...testLocation, new Date('2024-12-21T00:00:00Z'));
      
      // Summer should have longer days than winter
      if (summerTimes.dayLength && winterTimes.dayLength) {
        expect(summerTimes.dayLength).toBeGreaterThan(winterTimes.dayLength);
      }
    });
  });

  describe('getSunPositionAtTime', () => {
    it('should get sun position at specific time', () => {
      const position = getSunPositionAtTime(...testLocation, testDate, 12, 0); // Noon
      
      expect(position).toHaveProperty('time');
      expect(position).toHaveProperty('azimuth');
      expect(position).toHaveProperty('elevation');
      expect(position).toHaveProperty('distance');
      
      expect(position.time).toBeInstanceOf(Date);
      expect(position.time.getHours()).toBe(12);
      expect(position.time.getMinutes()).toBe(0);
    });

    it('should validate time parameters', () => {
      expect(() => getSunPositionAtTime(...testLocation, testDate, 24, 0)).toThrow('Invalid time provided');
      expect(() => getSunPositionAtTime(...testLocation, testDate, -1, 0)).toThrow('Invalid time provided');
      expect(() => getSunPositionAtTime(...testLocation, testDate, 12, 60)).toThrow('Invalid time provided');
      expect(() => getSunPositionAtTime(...testLocation, testDate, 12, -1)).toThrow('Invalid time provided');
    });

    it('should handle edge times correctly', () => {
      const midnight = getSunPositionAtTime(...testLocation, testDate, 0, 0);
      const almostMidnight = getSunPositionAtTime(...testLocation, testDate, 23, 59);
      
      expect(midnight.time.getHours()).toBe(0);
      expect(almostMidnight.time.getHours()).toBe(23);
      expect(almostMidnight.time.getMinutes()).toBe(59);
    });
  });

  describe('getDayNightStatus', () => {
    it('should determine day/night status correctly', () => {
      // Test at noon (should be day)
      const noonDate = new Date('2024-06-21T17:00:00Z'); // Approximate noon in New York
      const noonStatus = getDayNightStatus(...testLocation, noonDate);
      
      expect(noonStatus).toHaveProperty('status');
      expect(noonStatus).toHaveProperty('sunPosition');
      expect(noonStatus).toHaveProperty('isVisible');
      
      expect(noonStatus.status).toBe('day');
      expect(noonStatus.isVisible).toBe(true);
      expect(noonStatus.sunPosition.elevation).toBeGreaterThan(0);
      
      // Test at midnight (should be night)
      const midnightDate = new Date('2024-06-21T05:00:00Z'); // Approximate midnight in New York
      const midnightStatus = getDayNightStatus(...testLocation, midnightDate);
      
      expect(midnightStatus.status).toBe('night');
      expect(midnightStatus.isVisible).toBe(false);
      expect(midnightStatus.sunPosition.elevation).toBeLessThan(0);
    });

    it('should identify twilight periods', () => {
      // This test would need specific times for twilight periods
      // For now, just ensure the function returns valid status values
      const status = getDayNightStatus(...testLocation, testDate);
      
      expect(['day', 'night', 'civil_twilight', 'nautical_twilight', 'astronomical_twilight'])
        .toContain(status.status);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid coordinates', () => {
      expect(() => calculateGoldenHour(91, 0, testDate)).toThrow('Invalid coordinates');
      expect(() => calculateBlueHour(0, 181, testDate)).toThrow('Invalid coordinates');
      expect(() => calculateTwilightPeriods(-91, 0, testDate)).toThrow('Invalid coordinates');
      expect(() => generateSunPath(0, -181, testDate)).toThrow('Invalid coordinates');
    });

    it('should handle invalid dates', () => {
      expect(() => calculateGoldenHour(...testLocation, 'invalid')).toThrow();
      expect(() => calculateBlueHour(...testLocation, new Date('invalid'))).toThrow();
      expect(() => generateSunPath(...testLocation, null)).toThrow();
    });

    it('should handle extreme polar conditions', () => {
      // Test very high latitude during different seasons
      const arcticLocation = [85, 0];
      
      const summerTimes = calculateSunTimes(...arcticLocation, new Date('2024-06-21T00:00:00Z'));
      const winterTimes = calculateSunTimes(...arcticLocation, new Date('2024-12-21T00:00:00Z'));
      
      // Should not throw errors even in extreme conditions
      expect(summerTimes).toHaveProperty('date');
      expect(winterTimes).toHaveProperty('date');
    });

    it('should handle date normalization edge cases', () => {
      // Test with dates at the edge of valid range
      const earlyDate = new Date('1000-01-01T00:00:00Z');
      const lateDate = new Date('3000-01-01T00:00:00Z');
      
      expect(() => calculateSunTimes(...testLocation, earlyDate)).not.toThrow();
      expect(() => calculateSunTimes(...testLocation, lateDate)).not.toThrow();
    });
  });
});