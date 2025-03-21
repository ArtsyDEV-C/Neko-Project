// Constants for weather media directories
const weatherBackgrounds = {
    "clear-day": "images/clear-sky-day.jpg",
    "clear-night": "images/clear-sky-night.jpg",
    "clear-evening": "images/clear-sky-evening.jpg",
    "cloudy-day": "images/cloudy-sky-day.jpg",
    "cloudy-night": "images/cloudy-sky-night.jpg",
    "cloudy-evening": "images/cloudy-sky-evening.jpg",
    "sunny-day": "images/sunny-sky-day.jpg",
    "sunny-night": "images/sunny-sky-night.jpg",
    "rainy-day": "images/rainy-sky-day.jpg",
    "rainy-night": "images/rainy-sky-night.jpg",
    "rainy-evening": "images/rainy-sky-evening.jpg",
    "snowy-day": "images/snowy-sky-day.jpg",
    "snowy-night": "images/snowy-sky-night.jpg",
    "snowy-evening": "images/snowy-sky-evening.jpg",
    "thunderstorm-day": "images/thunderstorm-sky-day.jpg",
    "thunderstorm-night": "images/thunderstorm-sky-night.jpg",
    "thunderstorm-evening": "images/thunderstorm-sky-evening.jpg",
    "hazy-day": "images/hazy-sky-day.jpg",
    "hazy-night": "images/hazy-sky-night.jpg",
    "foggy-day": "images/foggy-sky-day.jpg",
    "foggy-night": "images/foggy-sky-night.jpg",
    "windy-day": "images/windy-sky-day.jpg",
    "windy-night": "images/windy-sky-night.jpg"
};

const weatherVideos = {
    "clear-morning": "videos/clear-day-cat.mp4",
    "clear-evening": "videos/clear-evening-cat.mp4",
    "clear-night": "videos/clear-night-cat.mp4",
    "cloudy-morning": "videos/cloudy-day-cat.mp4",
    "cloudy-evening": "videos/cloudy-evening-cat.mp4",
    "cloudy-night": "videos/cloudy-night-cat.mp4",
    "foggy-morning": "videos/foggy-day-cat.mp4",
    "foggy-evening": "videos/foggy-evening-cat.mp4",
    "foggy-night": "videos/foggy-night-cat.mp4",
    "rain-morning": "videos/rain-day-cat.mp4",
    "rain-evening": "videos/rain-evening-cat.mp4",
    "rain-night": "videos/rain-night-cat.mp4",
    "snowy-morning": "videos/snowy-day-cat.mp4",
    "snowy-evening": "videos/snowy-evening-cat.mp4",
    "snowy-night": "videos/snowy-night-cat.mp4",
    "sunny-morning": "videos/sunny-day-cat.mp4",
    "sunny-evening": "videos/sunny-evening-cat.mp4",
    "sunny-night": "videos/sunny-night-cat.mp4",
    "thunderstorm-morning": "videos/thunderstorm-day-cat.mp4",
    "thunderstorm-evening": "videos/thunderstorm-evening-cat.mp4",
    "thunderstorm-night": "videos/thunderstorm-night-cat.mp4",
    "windy-morning": "videos/windy-day-cat.mp4",
    "windy-evening": "videos/windy-evening-cat.mp4",
    "windy-night": "videos/windy-night-cat.mp4",
    "default": "videos/default.mp4"
};

const weatherMusic = {
    "clear": "music/sunny.mp3",
    "cloudy": "music/cloudy.mp3",
    "rainy": "music/rain.mp3",
    "snowy": "music/snow.mp3",
    "thunderstorm": "music/thunderstorm.mp3",
    "hazy": "music/hazy.mp3",
    "foggy": "music/foggy.mp3",
    "windy": "music/windy.mp3"
};

// Elements
const searchBar = document.querySelector('#search-input');
const searchButton = document.querySelector('#search-button');
const weatherContainer = document.querySelector('.weather-container');
const weatherVideo = document.querySelector('#weather-video');
const weatherMusicElement = document.querySelector('#weather-music');
const weatherIcon = document.querySelector('#weather-icon');
const temperatureElement = document.querySelector('#weather-temperature');
const weatherDescription = document.querySelector('#weather-description');
const cityElement = document.querySelector('#city-name');
const windSpeedElement = document.querySelector('#wind-speed');
const humidityElement = document.querySelector('#humidity');
const uvIndexElement = document.querySelector('#uv-index');
const pressureElement = document.querySelector('#pressure');
const sunriseElement = document.querySelector('#sunrise');
const sunsetElement = document.querySelector('#sunset');
const forecastContainer = document.querySelector('#forecast');
const loadingSpinner = document.querySelector('#loading');
const dateTimeElement = document.querySelector('#date-time');
const localTimeElement = document.querySelector('#local-time');
const istTimeElement = document.querySelector('#ist-time');

// Auth Elements
const registerForm = document.querySelector('#register-form');
const loginForm = document.querySelector('#login-form');
const saveCityForm = document.querySelector('#save-city-form');

async function ensureAPIKey(timeout = 10000) { // 10 seconds max wait
    const startTime = Date.now();
    while (!WEATHER_API_KEY) {
        if (Date.now() - startTime > timeout) {
            console.error("⚠️ API Key not available. Skipping API requests.");
            return;
        }
        console.warn("Waiting for API Key. Retrying...");
        await new Promise(resolve => setTimeout(resolve, 2000)); 
    }
}


let WEATHER_API_KEY = null;

async function getWeatherAPIKey() {
    try {
        console.log("⏳ Fetching API Key...");
        const response = await fetch("/api/getApiKey");
        
        if (!response.ok) throw new Error("Failed to fetch API Key");

        const data = await response.json();
        WEATHER_API_KEY = data.apiKey;

        if (!WEATHER_API_KEY) {
            throw new Error("API Key is undefined or null");
        }

        console.log("✅ OpenWeather API Key Retrieved:", WEATHER_API_KEY);
    } catch (error) {
        console.error("❌ Error fetching API Key:", error.message);
    }
}

(async function initializeAPIKey() {
    await getWeatherAPIKey();
})();




// Function to get the current date and time
function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
    dateTimeElement.innerText = now.toLocaleString('en-US', options);
}

// Function to format time in 12-hour format
function formatTime(date) {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const strMinutes = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${strMinutes} ${ampm}`;
}

// Function to update weather data on the page
function updateWeatherUI(data) {
     if (!data || !data.weather || !data.main || !data.sys) {
         console.error("❌ Invalid weather data received");
         alert("❌ Error: Invalid weather data received.");
         return;

     }

    const weather = data.weather[0];
    const main = data.main;
    const wind = data.wind;
    const sys = data.sys;


    // City name
    cityElement.innerText = `${data.name}, ${data.sys.country}`;


      
     // Handle cases where sunrise and sunset might be undefined
     if (!sys.sunrise || !sys.sunset) {
         console.warn("Sunrise or sunset time missing in API response");
         return;
     }
 
     const sunrise = new Date(sys.sunrise * 1000);
     const sunset = new Date(sys.sunset * 1000);
            

    // Determine if it's day, night, or evening
    const now = new Date();
    const sunrise = new Date(sys.sunrise * 1000);
    const sunset = new Date(sys.sunset * 1000);
    const eveningStart = new Date(sunset.getTime() - 3600 * 1000); // 1 hour before sunset
    const morningEnd = new Date(sunrise.getTime() + 3600 * 1000); // 1 hour after sunrise
    const isDayTime = now >= morningEnd && now < sunset;
    const isEveningTime = now >= eveningStart && now < sunset;
    const isMorningTime = now >= sunrise && now < morningEnd;

    const timeOfDay = isDayTime ? "day" : (isEveningTime ? "evening" : "night");
    const weatherCondition = weather.main.toLowerCase();
    const media = getWeatherMedia(weatherCondition, timeOfDay);

    // Set weather background
    document.body.style.backgroundImage = `url(${media.background})`;

    // Set video
    weatherVideo.src = media.video;

    // Set music (play automatically)
    weatherMusicElement.src = weatherMusic[weatherCondition] || weatherMusic["clear"];
    weatherMusicElement.play();

    // Set temperature in Celsius and Fahrenheit
    const tempCelsius = Math.round(main.temp);
    const tempFahrenheit = Math.round((tempCelsius * 9 / 5) + 32);
    temperatureElement.innerHTML = `${tempCelsius}°C / ${tempFahrenheit}°F`;

    // Set weather description and icon
    weatherDescription.innerHTML = weather.description;
    weatherIcon.innerHTML = `<img src="https://openweathermap.org/img/wn/${weather.icon}.png" alt="Weather Icon">`;

    // Set other weather data
    windSpeedElement.innerText = `${wind.speed} m/s`;
    humidityElement.innerText = `${main.humidity}%`;
    uvIndexElement.innerText = 'N/A'; // UV Index requires a separate API call
    pressureElement.innerText = `${main.pressure} hPa`;
    sunriseElement.innerText = formatTime(sunrise);
    sunsetElement.innerText = formatTime(sunset);

    // Set local time and IST time
    const localTime = new Date(now.getTime() + data.timezone * 1000);
    localTimeElement.innerText = formatTime(localTime);
    const istTime = new Date(now.getTime() + (5.5 * 3600 * 1000));
    istTimeElement.innerText = formatTime(istTime);

    // Display weather forecast (dummy data here, you should replace with actual forecast data)
    forecastContainer.innerHTML = `
        <div><strong>Day 1:</strong> Sunny - 25°C</div>
        <div><strong>Day 2:</strong> Cloudy - 23°C</div>
        <div><strong>Day 3:</strong> Rainy - 18°C</div>
        <div><strong>Day 4:</strong> Snowy - 10°C</div>
        <div><strong>Day 5:</strong> Thunderstorm - 12°C</div>
        <div><strong>Day 6:</strong> Sunny - 26°C</div>
        <div><strong>Day 7:</strong> Cloudy - 22°C</div>
        <div><strong>Day 8:</strong> Rainy - 19°C</div>
        <div><strong>Day 9:</strong> Clear - 24°C</div>
        <div><strong>Day 10:</strong> Snowy - 5°C</div>
    `;
}



// Use the fetched API key for subsequent API calls
async function fetchWeather(city) {
    if (!city || city.trim() === "") {
        alert("Please enter a valid city name.");
        return;
    }

    if (!WEATHER_API_KEY) {
        await ensureAPIKey();
        if (!WEATHER_API_KEY) {
            alert("❌ API Key is still missing. Cannot fetch weather data.");
            return;
        }
    }

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${WEATHER_API_KEY}`;

    try {
        loadingSpinner.style.display = "block"; // Show loading animation

        const response = await fetch(weatherUrl);
        if (!response.ok) throw new Error(`Error: ${response.status} - ${response.statusText}`);

        const data = await response.json();
        updateWeatherUI(data);
    } catch (error) {
        alert(`❌ Error fetching weather: ${error.message}`);
        console.error("❌ Weather Fetch Error:", error);
    } finally {
        loadingSpinner.style.display = "none"; // Hide loading animation
    }
}


// Call the function with appropriate city
fetchWeatherAlerts('YOUR_CITY_HERE');


    
// Fetch weather data from API
async function fetchWeather(city) {
    if (!city || city.trim() === "") {
        alert("Please enter a valid city name.");
        return;
    }

    await ensureAPIKey();  // Ensure API Key is loaded before proceeding

    if (!WEATHER_API_KEY) {
        alert("❌ API Key is missing. Cannot fetch weather data.");
        return;
    }

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${WEATHER_API_KEY}`;

    try {
        loadingSpinner.style.display = "block"; // Show loading animation

        const response = await fetch(weatherUrl);
        if (!response.ok) throw new Error(`Error: ${response.status} - ${response.statusText}`);

        const data = await response.json();
        updateWeatherUI(data);
    } catch (error) {
        alert(`❌ Error fetching weather: ${error.message}`);
        console.error("❌ Weather Fetch Error:", error);
    } finally {
        loadingSpinner.style.display = "none"; // Hide loading animation
    }
}

    
// Function to update forecast data on the page
function updateForecastUI(forecastList) {
    const forecastContainer = document.getElementById('forecast');
    forecastContainer.innerHTML = ""; // Clear old data

    try {
        for (let i = 0; i < forecastList.length; i += 8) { // Every 24 hours
            const forecast = forecastList[i];
            const date = new Date(forecast.dt * 1000);
            const day = date.toLocaleDateString('en-US', { weekday: 'long' });
            const temp = Math.round(forecast.main.temp);
            const weather = forecast.weather[0].main;
            const icon = `https://openweathermap.org/img/wn/${forecast.weather[0].icon}.png`;

            const forecastHTML = `
                <div class="forecast-item">
                    <strong>${day}</strong>
                    <img src="${icon}" alt="${weather}">
                    <p>${weather} - ${temp}°C</p>
                </div>
            `;
            forecastContainer.innerHTML += forecastHTML;
        }
    } catch (error) {
        console.error("❌ Forecast Fetch Error:", error);
        forecastContainer.innerHTML = `<div>Error fetching forecast.</div>`;
    }
}




// Get user's current location

navigator.geolocation.getCurrentPosition(async (position) => {
    await ensureAPIKey(); // Ensure the API key is available

    try {
        const { latitude, longitude } = position.coords;
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch location-based weather");

        const data = await response.json();
        updateWeatherUI(data);
    } catch (error) {
        console.error("❌ Location Error:", error);
        alert("Location access denied. Please enter a city manually.");
    }
}, () => {
    alert("Location permission denied. Enter city manually.");
});


    
// Add console debugging message
console.log("Weather app initialized successfully.");

// Event listener for search button
searchButton.addEventListener('click', () => {
    const city = searchBar.value.trim();
    if (city) {
        fetchWeather(city);
    } else {
        alert('Please enter a city!');
    }
});

// Update date and time every second
setInterval(updateDateTime, 1000);

// Initial default weather
updateDateTime();

// User authentication and city save functions

// Replace the existing function with the updated code below
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(registerForm);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('/register', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const responseData = await response.json();
        if (response.ok) {
            alert("✅ Registration successful!");
        } else {
            alert(`❌ Registration failed: ${responseData.message}`);
        }
    } catch (error) {
        console.error("❌ Registration Error:", error);
        alert("❌ Error occurred during registration.");
    }
});


async function loginUser(username, password) {
    try {
        const response = await fetch('/login', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        console.log("✅ Login Response:", data);
    } catch (error) {
        console.error("❌ Login Error:", error);
    }
}

   

// Save city
saveCityForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(saveCityForm);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('/cities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('City saved successfully');
        } else {
            alert('Error saving city');
        }
    } catch (error) {
        alert('Error saving city');
    }
});

// Example function to trigger alert
const triggerAlert = async (type, to, message) => {
  await fetch('/send-alert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, to, message })
  });
};

// Function to provide recommendations based on weather
function provideRecommendations(weather) {
    if (!weather || !weather.weather || weather.weather.length === 0) {
        console.error("❌ Weather data is missing or invalid.");
        return;
    }

    const recommendations = [];
    const condition = weather.weather[0].main.toLowerCase();
    const temp = weather.main.temp;

    if (temp < 15) recommendations.push("Wear warm clothes 🧥");
    if (temp > 30) recommendations.push("Stay hydrated 💧");
    if (condition.includes("rain")) recommendations.push("Carry an umbrella ☔");
    if (condition.includes("snow")) recommendations.push("Wear a jacket ❄️");
    if (condition.includes("thunderstorm")) recommendations.push("Stay indoors ⚡");

    document.getElementById("recommendations").innerHTML = recommendations.join(", ");
}

// Function to display disaster warnings
const displayDisasterWarnings = (warnings) => {
  const warningContainer = document.getElementById('disaster-warnings');
  warningContainer.innerHTML = warnings.map(warning => `<div>${warning}</div>`).join('');
};

// Initialize map
const map = L.map('map').setView([51.505, -0.09], 13);

// Add tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Add weather data layer
const weatherLayer = L.layerGroup().addTo(map);

// Function to update weather layer
const updateWeatherLayer = (data) => {
  weatherLayer.clearLayers();
  data.forEach(point => {
    L.marker([point.lat, point.lon]).addTo(weatherLayer)
      .bindPopup(`<b>${point.weather}</b><br>${point.temp}°C`);
  });
};


if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
    let recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    
    recognition.onresult = (event) => {
        const city = event.results[0][0].transcript;
        console.log("Recognized City:", city);
        fetchWeather(city);
    };

    document.querySelector("#voice-search").addEventListener("click", () => {
        recognition.start();
    });
} else {
    console.warn("❌ Speech Recognition not supported in this browser.");
}



async function getCitySuggestions(city) {
    const apiKey = WEATHER_API_KEY;
    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=5&appid=${apiKey}`;

    try {
        const response = await fetch(geoUrl);
        if (!response.ok) throw new Error(`API Error ${response.status}: ${response.statusText}`);
        const data = await response.json();

        if (data.length === 0) {
            return [];
        }

        return data.map(location => `${location.name}, ${location.country}`);
    } catch (error) {
        console.error("❌ Error fetching city suggestions:", error);
        return [];
    }
}
    searchBar.addEventListener('input', async () => {
    if (!WEATHER_API_KEY) {
        console.warn("⚠️ Waiting for API Key. Please retry in a few seconds.");
        return;
    }

    const city = searchBar.value.trim();
    if (city.length < 2) return;

    const suggestions = await getCitySuggestions(city);
    const suggestionsList = document.querySelector("#city-suggestions");

    suggestionsList.innerHTML = suggestions
        .map(suggestion => `<li onclick="selectCity('${suggestion}')">${suggestion}</li>`)
        .join('');
});



function selectCity(city) {
    searchBar.value = city;
    document.querySelector("#city-suggestions").innerHTML = "";
}

function getWeatherMedia(condition, timeOfDay) {
    const backgrounds = {
        "clear": { day: "images/clear-sky-day.jpg", night: "images/clear-sky-night.jpg", evening: "images/clear-sky-evening.jpg" },
        "cloudy": { day: "images/cloudy-sky-day.jpg", night: "images/cloudy-sky-night.jpg", evening: "images/cloudy-sky-evening.jpg" },
        "rain": { day: "images/rainy-sky-day.jpg", night: "images/rainy-sky-night.jpg", evening: "images/rainy-sky-evening.jpg" },
        "snow": { day: "images/snowy-sky-day.jpg", night: "images/snowy-sky-night.jpg", evening: "images/snowy-sky-evening.jpg" },
        "thunderstorm": { day: "images/thunderstorm-sky-day.jpg", night: "images/thunderstorm-sky-night.jpg", evening: "images/thunderstorm-sky-evening.jpg" },
        "hazy": { day: "images/hazy-sky-day.jpg", night: "images/hazy-sky-night.jpg", evening: "images/hazy-sky-evening.jpg" },
        "foggy": { day: "images/foggy-sky-day.jpg", night: "images/foggy-sky-night.jpg", evening: "images/foggy-sky-evening.jpg" },
        "windy": { day: "images/windy-sky-day.jpg", night: "images/windy-sky-night.jpg", evening: "images/windy-sky-evening.jpg" }
    };

    const videos = {
        "clear": { day: "videos/clear-day-cat.mp4", evening: "videos/clear-evening-cat.mp4", night: "videos/clear-night-cat.mp4" },
        "cloudy": { day: "videos/cloudy-day-cat.mp4", evening: "videos/cloudy-evening-cat.mp4", night: "videos/cloudy-night-cat.mp4" },
        "rain": { day: "videos/rain-day-cat.mp4", evening: "videos/rain-evening-cat.mp4", night: "videos/rain-night-cat.mp4" },
        "snow": { day: "videos/snowy-day-cat.mp4", evening: "videos/snowy-evening-cat.mp4", night: "videos/snowy-night-cat.mp4" },
        "thunderstorm": { day: "videos/thunderstorm-day-cat.mp4", evening: "videos/thunderstorm-evening-cat.mp4", night: "videos/thunderstorm-night-cat.mp4" },
        "windy": { day: "videos/windy-day-cat.mp4", evening: "videos/windy-evening-cat.mp4", night: "videos/windy-night-cat.mp4" }
    };

    const defaultMedia = { day: "images/default.jpg", night: "images/default.jpg", evening: "images/default.jpg" };
    const conditionKey = Object.keys(backgrounds).find(key => condition.includes(key)) || "clear";

    return {
        background: backgrounds[conditionKey]?.[timeOfDay] || defaultMedia[timeOfDay],
        video: videos[conditionKey]?.[timeOfDay] || "videos/default.mp4"
    };
}


    

// Voice recognition for weather search
if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
    let recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    
    recognition.onresult = (event) => {
        const city = event.results[0][0].transcript;
        console.log("Recognized City:", city);
        fetchWeather(city);
    };

    document.querySelector("#voice-search").addEventListener("click", () => {
        recognition.start();
    });
} else {
    console.warn("❌ Speech Recognition not supported in this browser.");
}




    


    
async function testAPI() {
    try {
        const response = await fetch("/api", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Shreejith" })
        });

        if (!response.ok) throw new Error("API test failed");
        console.log("✅ API test successful");
    } catch (error) {
        console.error("❌ API test error:", error);
    }

}
testAPI();




console.log("✅ Script loaded successfully.");





// Add this function after line 700
function selectCity(city) {
    searchBar.value = city;
    document.querySelector("#city-suggestions").innerHTML = "";
    fetchWeather(city);
}
