/**
 * Weather Dashboard Utility Functions
 */

const utils = {
  /**
   * Format temperature with proper unit
   * @param {number} temp - Temperature value
   * @param {string} unit - Temperature unit
   * @returns {string} Formatted temperature string
   */
  formatTemperature: (temp, unit = '°C') => {
    if (temp === null || temp === undefined) return '--';
    return `${Math.round(temp)}${unit}`;
  },

  /**
   * Format precipitation value
   * @param {number} precip - Precipitation value
   * @param {string} unit - Precipitation unit
   * @returns {string} Formatted precipitation string
   */
  formatPrecipitation: (precip, unit = 'mm') => {
    if (precip === null || precip === undefined) return '--';
    return `${precip} ${unit}`;
  },

  /**
   * Format wind speed and direction
   * @param {number} speed - Wind speed
   * @param {number} direction - Wind direction in degrees
   * @param {string} unit - Wind speed unit
   * @returns {string} Formatted wind string
   */
  formatWind: (speed, direction, unit = 'km/h') => {
    if (speed === null || speed === undefined) return '--';
    const directionText = utils.getWindDirection(direction);
    return `${Math.round(speed)} ${unit} ${directionText}`;
  },

  /**
   * Get textual representation of wind direction
   * @param {number} degrees - Wind direction in degrees
   * @returns {string} Wind direction abbreviation
   */
  getWindDirection: (degrees) => {
    if (degrees === null || degrees === undefined) return '';

    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(((degrees % 360) / 22.5));
    return directions[index % 16];
  },

  /**
   * Format visibility in meters
   * @param {number} visibility - Visibility in meters
   * @returns {string} Formatted visibility string
   */
  formatVisibility: (visibility) => {
    if (visibility === null || visibility === undefined) return '--';

    if (visibility >= 1000) {
      return `${(visibility / 1000).toFixed(1)} km`;
    }
    return `${visibility} m`;
  },

  /**
   * Calculate visibility percentage (for meter display)
   * @param {number} visibility - Visibility in meters
   * @param {number} max - Maximum visibility (default 20000m = 20km)
   * @returns {number} Percentage of maximum visibility
   */
  getVisibilityPercentage: (visibility, max = 20000) => {
    if (visibility === null || visibility === undefined) return 0;
    return Math.min(Math.round((visibility / max) * 100), 100);
  },

  /**
   * Format date/time to readable format
   * @param {string} dateString - ISO date string
   * @param {string} format - Format type ('date', 'time', 'day', 'full')
   * @returns {string} Formatted date/time
   */
  formatDate: (dateString, format = 'full') => {
    if (!dateString) return '--';

    const date = new Date(dateString);
    const options = { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };

    switch (format) {
      case 'date':
        return date.toLocaleDateString();
      case 'time':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case 'day':
        return date.toLocaleDateString([], { weekday: 'short' });
      case 'hour':
        return date.toLocaleTimeString([], { hour: '2-digit' });
      case 'full':
      default:
        return date.toLocaleString([], options);
    }
  },

  /**
   * Get weather icon based on conditions
   * @param {number} cloudCover - Cloud cover percentage
   * @param {number} precipitation - Precipitation amount
   * @returns {string} CSS class for weather icon
   */
  getWeatherIcon: (cloudCover, precipitation = 0) => {
    if (precipitation > 0.5) {
      return 'fas fa-cloud-rain';
    } else if (precipitation > 0) {
      return 'fas fa-cloud-drizzle';
    } else if (cloudCover > 80) {
      return 'fas fa-cloud';
    } else if (cloudCover > 50) {
      return 'fas fa-cloud-sun';
    } else {
      return 'fas fa-sun';
    }
  },

  /**
   * Group hourly forecast data by day
   * @param {Array} hourlyData - Array of hourly forecast data
   * @returns {Object} Hourly data grouped by day
   */
  groupHourlyDataByDay: (hourlyData) => {
    if (!Array.isArray(hourlyData)) return {};

    const grouped = {};

    hourlyData.forEach(hour => {
      if (!hour.time) return;

      const date = hour.time.split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(hour);
    });

    return grouped;
  }
};
