/**
 * Weather Dashboard - Main application logic
 */

// Global chart objects for later reference
let hourlyTempChart = null;
let dailyTempChart = null;
let dailyPrecipChart = null;

// Store weather data globally for use across functions
let weatherData = null;

/**
 * Initialize the dashboard
 */
async function initDashboard() {
  // Set current year in footer
  document.getElementById('current-year').textContent = new Date().getFullYear();

  // Register event listeners
  registerEventListeners();

  // Load weather data
  await loadWeatherData();
}

/**
 * Register all event listeners
 */
function registerEventListeners() {
  // Toggle between hourly and daily forecast
  document.getElementById('hourly-toggle').addEventListener('click', function() {
    this.classList.add('active');
    document.getElementById('daily-toggle').classList.remove('active');
    document.getElementById('hourly-forecast').classList.remove('hidden');
    document.getElementById('daily-forecast').classList.add('hidden');
  });

  document.getElementById('daily-toggle').addEventListener('click', function() {
    this.classList.add('active');
    document.getElementById('hourly-toggle').classList.remove('active');
    document.getElementById('daily-forecast').classList.remove('hidden');
    document.getElementById('hourly-forecast').classList.add('hidden');
  });
}

/**
 * Fetch weather data from the backend
 */
async function loadWeatherData() {
  try {
    const response = await fetch('./data/weather.json');

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    weatherData = await response.json();

    // Now update the UI with the data
    updateDashboard(weatherData);
  } catch (error) {
    console.error('Error loading weather data:', error);
    displayError('Failed to load weather data. Please try again later.');
  }
}

/**
 * Display error message on the dashboard
 */
function displayError(message) {
  // Create or update an error element
  let errorEl = document.querySelector('.error-message');

  if (!errorEl) {
    errorEl = document.createElement('div');
    errorEl.className = 'error-message';
    document.querySelector('main').prepend(errorEl);
  }

  errorEl.textContent = message;
}

/**
 * Update the entire dashboard with weather data
 */
function updateDashboard(data) {
  if (!data) return;

  // Update location info
  updateLocationInfo(data.location);

  // Update last updated time
  updateLastUpdated(data.last_updated);

  // Update current weather
  updateCurrentWeather(data.current_weather);

  // Update hourly forecast
  updateHourlyForecast(data.hourly_forecast);

  // Update daily forecast
  if (data.daily_forecast) {
    updateDailyForecast(data.daily_forecast);
  }
}

/**
 * Update location information
 */
function updateLocationInfo(location) {
  if (!location) return;

  const locationName = document.getElementById('location-name');
  locationName.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${location.timezone || 'Unknown location'}`;
}

/**
 * Update last updated timestamp
 */
function updateLastUpdated(timestamp) {
  if (!timestamp) return;

  const lastUpdated = document.getElementById('last-updated');
  const formattedTime = utils.formatDate(timestamp, 'full');
  lastUpdated.textContent = `Last updated: ${formattedTime}`;
}

/**
 * Update current weather section
 */
function updateCurrentWeather(current) {
  if (!current) return;

  // Update temperature
  const currentTemp = document.getElementById('current-temp');
  currentTemp.textContent = utils.formatTemperature(current.temperature?.value);

  // Update feels like temperature
  const feelsLikeTemp = document.getElementById('feels-like-temp');
  feelsLikeTemp.textContent = utils.formatTemperature(current.temperature?.feels_like);

  // Update weather icon based on conditions
  const weatherIcon = document.getElementById('current-weather-icon');
  weatherIcon.className = utils.getWeatherIcon(current.cloud_cover?.value, current.precipitation?.value);

  // Update wind details
  const windSpeed = document.getElementById('wind-speed');
  windSpeed.textContent = utils.formatWind(current.wind?.speed, current.wind?.direction, current.wind?.unit);

  // Update wind compass in detailed view
  updateWindCompass(current.wind?.direction);

  // Update wind details in detailed view
  document.getElementById('wind-speed-detailed').textContent = `${current.wind?.speed || '--'} ${current.wind?.unit || 'km/h'}`;
  document.getElementById('wind-gusts-detailed').textContent = `${current.wind?.gusts || '--'} ${current.wind?.unit || 'km/h'}`;
  document.getElementById('wind-direction-text').textContent = `${utils.getWindDirection(current.wind?.direction)} (${current.wind?.direction || '--'}°)`;

  // Update precipitation
  const precipitation = document.getElementById('precipitation');
  precipitation.textContent = utils.formatPrecipitation(current.precipitation?.value, current.precipitation?.unit);

  // Update cloud cover
  const cloudCover = document.getElementById('cloud-cover');
  cloudCover.textContent = `${current.cloud_cover?.value || '--'}${current.cloud_cover?.unit || '%'}`;

  // Update wind gusts
  const windGusts = document.getElementById('wind-gusts');
  windGusts.textContent = `${current.wind?.gusts || '--'} ${current.wind?.unit || 'km/h'}`;
}

/**
 * Update wind compass direction
 */
function updateWindCompass(direction) {
  if (direction === null || direction === undefined) return;

  const compassArrow = document.getElementById('compass-arrow');
  compassArrow.style.transform = `rotate(${direction}deg)`;
}

/**
 * Update hourly forecast section
 */
function updateHourlyForecast(hourlyData) {
  if (!hourlyData || !hourlyData.length) return;

  const hourlyCards = document.getElementById('hourly-cards');
  hourlyCards.innerHTML = ''; // Clear existing cards

  // Display the next 24 hours for better UI
  const nextHours = hourlyData.slice(0, 24);

  // Create forecast cards
  nextHours.forEach(hour => {
    const card = createForecastCard(hour);
    hourlyCards.appendChild(card);
  });

  // Create hourly temperature chart
  if (hourlyTempChart) {
    weatherCharts.destroyChart(hourlyTempChart);
  }
  hourlyTempChart = weatherCharts.createHourlyTempChart('hourly-temp-chart', nextHours);
}

/**
 * Update daily forecast section
 */
function updateDailyForecast(dailyData) {
  if (!dailyData || !dailyData.length) return;

  const dailyCards = document.getElementById('daily-cards');
  dailyCards.innerHTML = ''; // Clear existing cards

  // Create forecast cards
  dailyData.forEach(day => {
    const card = createDailyForecastCard(day);
    dailyCards.appendChild(card);
  });

  // Create daily temperature chart
  if (dailyTempChart) {
    weatherCharts.destroyChart(dailyTempChart);
  }
  dailyTempChart = weatherCharts.createDailyTempChart('daily-temp-chart', dailyData);

  // Create precipitation chart
  if (dailyPrecipChart) {
    weatherCharts.destroyChart(dailyPrecipChart);
  }
  dailyPrecipChart = weatherCharts.createDailyPrecipChart('daily-precip-chart', dailyData);
}

/**
 * Create an hourly forecast card
 */
function createForecastCard(hour) {
  const card = document.createElement('div');
  card.className = 'forecast-card';

  const time = utils.formatDate(hour.time, 'time');
  const temp = utils.formatTemperature(hour.temperature);
  const icon = utils.getWeatherIcon(hour.cloud_cover, hour.rain);

  card.innerHTML = `
    <h3>${time}</h3>
    <div class="icon"><i class="${icon}"></i></div>
    <div class="temp">${temp}</div>
    <p>Rain: ${utils.formatPrecipitation(hour.rain)}</p>
    <p>Wind: ${hour.wind.speed} km/h</p>
  `;

  return card;
}

/**
 * Create a daily forecast card
 */
function createDailyForecastCard(day) {
  const card = document.createElement('div');
  card.className = 'forecast-card';

  const date = utils.formatDate(day.date, 'date');
  const dayName = utils.formatDate(day.date, 'day');

  let icon = 'fas fa-sun';
  if (day.precipitation_sum > 1) {
    icon = 'fas fa-cloud-rain';
  } else if (day.precipitation_sum > 0) {
    icon = 'fas fa-cloud-sun-rain';
  }

  card.innerHTML = `
    <h3>${dayName}</h3>
    <p>${date}</p>
    <div class="icon"><i class="${icon}"></i></div>
    <div class="temp">${utils.formatTemperature(day.temperature.max)}</div>
    <p>Min: ${utils.formatTemperature(day.temperature.min)}</p>
    <p>Precip: ${utils.formatPrecipitation(day.precipitation_sum)}</p>
    <p>UV Index: ${day.uv_index_max || '--'}</p>
  `;

  return card;
}

/**
 * Update visibility meter
 */
function updateVisibilityMeter(visibility) {
  if (visibility === null || visibility === undefined) return;

  const meter = document.getElementById('visibility-meter');
  const percentage = utils.getVisibilityPercentage(visibility);
  meter.style.width = `${percentage}%`;

  const visibilityValue = document.getElementById('visibility-value');
  visibilityValue.textContent = utils.formatVisibility(visibility);
}

// Initialize dashboard when DOM content is loaded
document.addEventListener('DOMContentLoaded', initDashboard);
