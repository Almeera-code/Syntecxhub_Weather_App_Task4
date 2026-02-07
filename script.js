

// DOM Elements
const loadingContainer = document.getElementById('loading');
const errorContainer = document.getElementById('error');
const weatherDashboard = document.getElementById('weatherDashboard');
const errorMessage = document.getElementById('errorMessage');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const retryBtn = document.getElementById('retryBtn');
const cityChips = document.querySelectorAll('.city-chip');

// Weather Elements
const cityName = document.getElementById('cityName');
const countryName = document.getElementById('countryName');
const weatherIcon = document.getElementById('weatherIcon');
const weatherDescription = document.getElementById('weatherDescription');
const temperature = document.getElementById('temperature');
const feelsLike = document.getElementById('feelsLike');
const windSpeed = document.getElementById('windSpeed');
const humidity = document.getElementById('humidity');
const visibility = document.getElementById('visibility');
const pressure = document.getElementById('pressure');
const sunrise = document.getElementById('sunrise');
const sunset = document.getElementById('sunset');
const sunPosition = document.getElementById('sunPosition');
const forecastGrid = document.getElementById('forecastGrid');
const currentDate = document.getElementById('currentDate');
const currentTime = document.getElementById('currentTime');

// API Configuration
const API_KEY = '4d8fb5b93d4af21d66a2948710284366'; // Free OpenWeatherMap API key
const API_BASE = 'https://api.openweathermap.org/data/2.5';
const WEATHER_ENDPOINT = `${API_BASE}/weather`;
const FORECAST_ENDPOINT = `${API_BASE}/forecast`;

// State
let lastCity = 'London';

/**
 * Update date and time display
 */
function updateDateTime() {
  const now = new Date();

  const dateOptions = { weekday: 'long', month: 'short', day: 'numeric' };
  currentDate.textContent = now.toLocaleDateString('en-US', dateOptions);

  const timeOptions = { hour: '2-digit', minute: '2-digit' };
  currentTime.textContent = now.toLocaleTimeString('en-US', timeOptions);
}

/**
 * Format time from Unix timestamp
 */
function formatTime(timestamp, timezone) {
  const date = new Date((timestamp + timezone) * 1000);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC'
  });
}

/**
 * Get day name from date
 */
function getDayName(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

/**
 * Show loading state
 */
function showLoading() {
  loadingContainer.classList.add('show');
  errorContainer.classList.remove('show');
  weatherDashboard.classList.remove('show');
}

/**
 * Hide loading state
 */
function hideLoading() {
  loadingContainer.classList.remove('show');
}

/**
 * Show error state
 */
function showError(message) {
  hideLoading();
  errorContainer.classList.add('show');
  weatherDashboard.classList.remove('show');
  errorMessage.textContent = message;
}

/**
 * Show weather dashboard
 */
function showWeather() {
  hideLoading();
  errorContainer.classList.remove('show');
  weatherDashboard.classList.add('show');
}

/**
 * Calculate sun position percentage
 */
function calculateSunPosition(sunriseTime, sunsetTime, timezone) {
  const now = Math.floor(Date.now() / 1000);
  const localNow = now + timezone;
  const localSunrise = sunriseTime + timezone;
  const localSunset = sunsetTime + timezone;

  if (localNow < localSunrise) return 0;
  if (localNow > localSunset) return 100;

  const dayLength = localSunset - localSunrise;
  const elapsed = localNow - localSunrise;
  return Math.min(100, Math.max(0, (elapsed / dayLength) * 100));
}

/**
 * Get weather icon URL
 */
function getWeatherIconUrl(iconCode) {
  return `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
}

/**
 * Fetch current weather data
 */
async function fetchWeather(city) {
  showLoading();

  try {
    const params = new URLSearchParams({
      q: city,
      appid: API_KEY,
      units: 'metric'
    });

    const response = await fetch(`${WEATHER_ENDPOINT}?${params}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`City "${city}" not found. Please check the spelling and try again.`);
      }
      if (response.status === 429) {
        throw new Error('API rate limit exceeded. Please wait a moment and try again.');
      }
      throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    lastCity = city;

    // Update UI with weather data
    updateWeatherUI(data);

    // Fetch forecast
    await fetchForecast(city);

    showWeather();

  } catch (error) {
    console.error('Weather fetch error:', error);
    showError(error.message || 'Failed to fetch weather data. Please check your connection.');
  }
}

/**
 * Fetch weather by coordinates
 */
async function fetchWeatherByCoords(lat, lon) {
  showLoading();

  try {
    const params = new URLSearchParams({
      lat: lat,
      lon: lon,
      appid: API_KEY,
      units: 'metric'
    });

    const response = await fetch(`${WEATHER_ENDPOINT}?${params}`);

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    lastCity = data.name;

    // Update UI with weather data
    updateWeatherUI(data);

    // Fetch forecast
    await fetchForecastByCoords(lat, lon);

    showWeather();

  } catch (error) {
    console.error('Weather fetch error:', error);
    showError(error.message || 'Failed to fetch weather data. Please check your connection.');
  }
}


/**
 * Update background based on weather conditions
 */
function updateDynamicBackground(weatherData) {
  const bgAnimation = document.querySelector('.bg-animation');
  const weather = weatherData.weather[0];
  const iconCode = weather.icon;
  const mainCondition = weather.main.toLowerCase();

  // Check if it's day or night based on icon code (ends with 'd' for day, 'n' for night)
  const isNight = iconCode.endsWith('n');

  // Remove all weather classes
  bgAnimation.className = 'bg-animation';

  // Determine the appropriate background class
  let weatherClass = '';

  if (mainCondition.includes('clear')) {
    weatherClass = isNight ? 'weather-clear-night' : 'weather-clear';
  } else if (mainCondition.includes('cloud') || mainCondition.includes('overcast')) {
    weatherClass = isNight ? 'weather-clouds-night' : 'weather-clouds';
  } else if (mainCondition.includes('rain') || mainCondition.includes('drizzle') || mainCondition.includes('shower')) {
    weatherClass = isNight ? 'weather-rain-night' : 'weather-rain';
  } else if (mainCondition.includes('thunder')) {
    weatherClass = 'weather-thunderstorm';
  } else if (mainCondition.includes('snow')) {
    weatherClass = isNight ? 'weather-snow-night' : 'weather-snow';
  } else if (mainCondition.includes('mist') || mainCondition.includes('fog') || mainCondition.includes('haze') || mainCondition.includes('smoke') || mainCondition.includes('dust') || mainCondition.includes('sand')) {
    weatherClass = isNight ? 'weather-mist-night' : 'weather-mist';
  } else {
    // Default to clear weather
    weatherClass = isNight ? 'weather-clear-night' : 'weather-clear';
  }

  // Apply the weather class
  bgAnimation.classList.add(weatherClass);

  // Update floating shapes colors based on weather
  updateFloatingShapes(mainCondition, isNight);
}

/**
 * Update floating shape colors based on weather
 */
function updateFloatingShapes(condition, isNight) {
  const shapes = document.querySelectorAll('.floating-shape');

  let colors = [];

  if (condition.includes('clear')) {
    colors = isNight
      ? ['#1a237e', '#283593', '#3949ab', '#5c6bc0']
      : ['#4facfe', '#00f2fe', '#87ceeb', '#ffd54f'];
  } else if (condition.includes('cloud')) {
    colors = isNight
      ? ['#37474f', '#455a64', '#546e7a', '#607d8b']
      : ['#90a4ae', '#b0bec5', '#cfd8dc', '#eceff1'];
  } else if (condition.includes('rain')) {
    colors = isNight
      ? ['#1a237e', '#0d47a1', '#1565c0', '#1976d2']
      : ['#2196f3', '#42a5f5', '#64b5f6', '#90caf9'];
  } else if (condition.includes('thunder')) {
    colors = ['#311b92', '#4527a0', '#512da8', '#fdd835'];
  } else if (condition.includes('snow')) {
    colors = isNight
      ? ['#455a64', '#546e7a', '#607d8b', '#78909c']
      : ['#e3f2fd', '#bbdefb', '#90caf9', '#ffffff'];
  } else {
    colors = isNight
      ? ['#37474f', '#455a64', '#546e7a', '#607d8b']
      : ['#4facfe', '#667eea', '#f093fb', '#ffecd2'];
  }

  shapes.forEach((shape, index) => {
    if (colors[index]) {
      shape.style.background = `linear-gradient(135deg, ${colors[index]} 0%, ${colors[(index + 1) % colors.length]} 100%)`;
    }
  });
}

function updateWeatherUI(data) {

  cityName.textContent = data.name;
  countryName.textContent = getCountryName(data.sys.country);

  const weather = data.weather[0];
  weatherIcon.src = getWeatherIconUrl(weather.icon);
  weatherIcon.alt = weather.description;
  weatherDescription.textContent = weather.description;

  // Temperature
  temperature.textContent = Math.round(data.main.temp);
  feelsLike.textContent = Math.round(data.main.feels_like);

  // Stats
  windSpeed.textContent = `${data.wind.speed} m/s`;
  humidity.textContent = `${data.main.humidity}%`;
  visibility.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
  pressure.textContent = `${data.main.pressure} hPa`;

  // Sun times
  sunrise.textContent = formatTime(data.sys.sunrise, data.timezone);
  sunset.textContent = formatTime(data.sys.sunset, data.timezone);

  // Sun position
  const sunPercent = calculateSunPosition(data.sys.sunrise, data.sys.sunset, data.timezone);
  sunPosition.style.left = `calc(${sunPercent}% - 10px)`;

  // Update dynamic background based on weather
  updateDynamicBackground(data);
}

/**
 * Get country name from code
 */
function getCountryName(code) {
  const countries = {
    'US': 'United States',
    'GB': 'United Kingdom',
    'CA': 'Canada',
    'AU': 'Australia',
    'DE': 'Germany',
    'FR': 'France',
    'JP': 'Japan',
    'CN': 'China',
    'IN': 'India',
    'BR': 'Brazil',
    'AE': 'UAE',
    'PK': 'Pakistan',
    'SA': 'Saudi Arabia',
    'IT': 'Italy',
    'ES': 'Spain',
    'NL': 'Netherlands',
    'RU': 'Russia',
    'KR': 'South Korea',
    'SG': 'Singapore',
    'MY': 'Malaysia'
  };
  return countries[code] || code;
}

/**
 * Fetch 5-day forecast
 */
async function fetchForecast(city) {
  try {
    const params = new URLSearchParams({
      q: city,
      appid: API_KEY,
      units: 'metric'
    });

    const response = await fetch(`${FORECAST_ENDPOINT}?${params}`);

    if (!response.ok) {
      throw new Error('Failed to fetch forecast');
    }

    const data = await response.json();
    updateForecastUI(data);

  } catch (error) {
    console.warn('Forecast fetch error:', error);
  }
}

/**
 * Fetch forecast by coordinates
 */
async function fetchForecastByCoords(lat, lon) {
  try {
    const params = new URLSearchParams({
      lat: lat,
      lon: lon,
      appid: API_KEY,
      units: 'metric'
    });

    const response = await fetch(`${FORECAST_ENDPOINT}?${params}`);

    if (!response.ok) {
      throw new Error('Failed to fetch forecast');
    }

    const data = await response.json();
    updateForecastUI(data);

  } catch (error) {
    console.warn('Forecast fetch error:', error);
  }
}

/**
 * Update forecast UI
 */
function updateForecastUI(data) {
  // Group forecast by day and get daily summary
  const dailyForecasts = {};

  data.list.forEach(item => {
    const date = item.dt_txt.split(' ')[0];

    if (!dailyForecasts[date]) {
      dailyForecasts[date] = {
        temps: [],
        icon: item.weather[0].icon,
        date: date
      };
    }

    dailyForecasts[date].temps.push(item.main.temp);

    // Prefer midday icon
    if (item.dt_txt.includes('12:00:00')) {
      dailyForecasts[date].icon = item.weather[0].icon;
    }
  });

  // Render forecast cards (next 5 days)
  forecastGrid.innerHTML = '';
  const days = Object.values(dailyForecasts).slice(0, 5);

  days.forEach((day, index) => {
    const maxTemp = Math.round(Math.max(...day.temps));
    const minTemp = Math.round(Math.min(...day.temps));

    const card = document.createElement('div');
    card.className = 'forecast-card';
    card.style.animationDelay = `${index * 0.1}s`;

    card.innerHTML = `
      <div class="forecast-day">${getDayName(day.date)}</div>
      <img src="${getWeatherIconUrl(day.icon)}" alt="Weather" class="forecast-icon">
      <div class="forecast-temp">
        <span class="forecast-high">${maxTemp}°</span>
        <span class="forecast-low">${minTemp}°</span>
      </div>
    `;

    forecastGrid.appendChild(card);
  });
}

/**
 * Handle search
 */
function handleSearch() {
  const city = searchInput.value.trim();
  if (city) {
    fetchWeather(city);
    searchInput.blur();
  }
}

/**
 * Handle geolocation
 */
function handleLocation() {
  if (!navigator.geolocation) {
    showError('Geolocation is not supported by your browser.');
    return;
  }

  locationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

  navigator.geolocation.getCurrentPosition(
    (position) => {
      locationBtn.innerHTML = '<i class="fas fa-location-crosshairs"></i>';
      fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
    },
    (error) => {
      locationBtn.innerHTML = '<i class="fas fa-location-crosshairs"></i>';
      let message = 'Unable to get your location.';
      if (error.code === error.PERMISSION_DENIED) {
        message = 'Location access denied. Please enable location permissions.';
      }
      showError(message);
    }
  );
}

// Event Listeners
searchBtn.addEventListener('click', handleSearch);

searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    handleSearch();
  }
});

locationBtn.addEventListener('click', handleLocation);

retryBtn.addEventListener('click', () => {
  fetchWeather(lastCity);
});

cityChips.forEach(chip => {
  chip.addEventListener('click', () => {
    const city = chip.dataset.city;
    searchInput.value = city;
    fetchWeather(city);
  });
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  updateDateTime();
  setInterval(updateDateTime, 1000);

  // Fetch default city weather
  fetchWeather('London');
});

// Log API info for documentation
console.log('%c☀️ Almeera SkyVerse Weather Dashboard', 'font-size: 20px; font-weight: bold; color: #4facfe;');
console.log('%cAPI Documentation:', 'font-size: 14px; color: #00f2fe;');
console.log(`
Endpoints:
  - Current Weather: ${WEATHER_ENDPOINT}
  - 5-Day Forecast: ${FORECAST_ENDPOINT}

Parameters:
  - q: City name (e.g., "London")
  - appid: API Key for authentication
  - units: metric (for Celsius)

Sample Response Structure:
{
  "name": "London",
  "sys": { "country": "GB", "sunrise": 1234567890, "sunset": 1234567890 },
  "main": {
    "temp": 15.5,
    "feels_like": 14.2,
    "humidity": 72,
    "pressure": 1013
  },
  "weather": [{
    "main": "Clouds",
    "description": "scattered clouds",
    "icon": "03d"
  }],
  "wind": { "speed": 5.2 },
  "visibility": 10000
}
`);
