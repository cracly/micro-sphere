/**
 * Weather Charts - Manages all chart visualizations for the dashboard
 */

const weatherCharts = {
  /**
   * Color configurations for charts
   */
  colors: {
    temperature: {
      fill: 'rgba(255, 99, 132, 0.2)',
      border: 'rgba(255, 99, 132, 1)'
    },
    temperatureMin: {
      fill: 'rgba(54, 162, 235, 0.2)',
      border: 'rgba(54, 162, 235, 1)'
    },
    precipitation: {
      fill: 'rgba(75, 192, 192, 0.2)',
      border: 'rgba(75, 192, 192, 1)'
    },
    cloudCover: {
      fill: 'rgba(153, 102, 255, 0.2)',
      border: 'rgba(153, 102, 255, 1)'
    }
  },

  /**
   * Create hourly temperature chart
   * @param {string} canvasId - Canvas element ID
   * @param {Array} hourlyData - Hourly forecast data
   */
  createHourlyTempChart: function(canvasId, hourlyData) {
    if (!hourlyData || !hourlyData.length) return;

    // Take only 24 hours for better visualization
    const chartData = hourlyData.slice(0, 24);

    const ctx = document.getElementById(canvasId).getContext('2d');

    // Format labels and data
    const labels = chartData.map(hour => utils.formatDate(hour.time, 'hour'));
    const temperatures = chartData.map(hour => hour.temperature);

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Temperature (°C)',
          data: temperatures,
          backgroundColor: this.colors.temperature.fill,
          borderColor: this.colors.temperature.border,
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: false
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });

    return chart;
  },

  /**
   * Create daily temperature chart showing min/max ranges
   * @param {string} canvasId - Canvas element ID
   * @param {Array} dailyData - Daily forecast data
   */
  createDailyTempChart: function(canvasId, dailyData) {
    if (!dailyData || !dailyData.length) return;

    const ctx = document.getElementById(canvasId).getContext('2d');

    // Format labels and data
    const labels = dailyData.map(day => utils.formatDate(day.date, 'day'));
    const maxTemps = dailyData.map(day => day.temperature.max);
    const minTemps = dailyData.map(day => day.temperature.min);

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Max Temperature (°C)',
            data: maxTemps,
            backgroundColor: this.colors.temperature.fill,
            borderColor: this.colors.temperature.border,
            borderWidth: 1
          },
          {
            label: 'Min Temperature (°C)',
            data: minTemps,
            backgroundColor: this.colors.temperatureMin.fill,
            borderColor: this.colors.temperatureMin.border,
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: false
          }
        }
      }
    });

    return chart;
  },

  /**
   * Create daily precipitation chart
   * @param {string} canvasId - Canvas element ID
   * @param {Array} dailyData - Daily forecast data
   */
  createDailyPrecipChart: function(canvasId, dailyData) {
    if (!dailyData || !dailyData.length) return;

    const ctx = document.getElementById(canvasId).getContext('2d');

    // Format labels and data
    const labels = dailyData.map(day => utils.formatDate(day.date, 'day'));
    const precipitation = dailyData.map(day => day.precipitation_sum);

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Precipitation (mm)',
          data: precipitation,
          backgroundColor: this.colors.precipitation.fill,
          borderColor: this.colors.precipitation.border,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });

    return chart;
  },

  /**
   * Clear and destroy existing charts
   * @param {Chart} chart - Chart.js instance
   */
  destroyChart: function(chart) {
    if (chart && chart.destroy) {
      chart.destroy();
    }
  }
};
