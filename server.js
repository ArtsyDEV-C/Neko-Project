require('dotenv').config();

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const Twilio = require('twilio');
const User = require('./models/User');
const City = require('./models/City'); 
const Chat = require('./models/Chat'); // Import Chat model
const methodOverride = require('method-override');
const axios = require('axios');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');
const path = require('path');
const MongoStore = require('connect-mongo');

const port = process.env.PORT || Math.floor(Math.random() * (50000 - 3000) + 3000);

// API route to send API key to frontend
app.get("/api/getApiKey", (req, res) => {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    if (!apiKey || apiKey.trim() === "") {
        console.error("❌ API Key missing from environment variables.");
        return res.status(500).json({ error: "API Key not found" });
    }

    console.log("✅ API Key successfully retrieved:", apiKey);
    res.json({ apiKey: apiKey.trim() });  // Trim any spaces to avoid issues
});



// Twilio configuration
const twilioClient = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Debugging: Print MONGO_URI to logs
console.log("🔍 Checking MONGO_URI:", process.env.MONGO_URI);

const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
    console.warn("⚠️ Warning: MONGO_URI is missing. Using local fallback.");
} else {
   const connectDB = require('./db');
   connectDB();
}

// Middleware
app.use(express.json({ limit: "10mb" })); // Increase limit if needed
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cors());
app.use(methodOverride('_method'));

app.use(express.static(path.join(__dirname, "public")));



// Express session
app.use(session({
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: 'sessions'
    }),
    cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }
}));


// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Disable favicon request
app.get('/favicon.ico', (req, res) => res.status(204));

// Explicitly serve videos with correct MIME type
app.get('/public/videos/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'videos', req.params.filename);
  res.setHeader('Content-Type', 'video/mp4');
  res.sendFile(filePath);
});

// Routes
const bcrypt = require("bcryptjs");

app.get('/api', (req,res) => {
        res.json({ message: "API is working correctly" });
});


app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required" });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});




app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required" });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        req.session.user = { id: user._id, username: user.username }; // Store user session
        res.status(200).json({ message: "Login successful", user: req.session.user });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});



app.post('/cities', async (req, res) => {
    try {
        if (!req.isAuthenticated()) return res.status(401).json({ error: "You must be logged in" });
        const { city } = req.body;
        const newCity = new City({ name: city, userId: req.user.id });
        await newCity.save();
        res.status(201).json({ message: 'City saved', city: newCity });
    } catch (error) {
        console.error('Error saving city:', error);
        res.status(500).json({ error: "Error saving city" });
    }
});

app.get("/api/weather", async (req, res) => {
    const city = req.query.city;
    if (!city) return res.status(400).json({ error: "City is required" });

    try {
       if (!process.env.OPENWEATHER_API_KEY) {
    return res.status(500).json({ error: "API key is missing. Set OPENWEATHER_API_KEY in .env" });
}

const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`;

try {
    const response = await axios.get(url);
    res.json(response.data);
} catch (error) {
    console.error("❌ Weather API Error:", error);
    res.status(500).json({ error: "Failed to fetch weather data" });
}
        res.json(response.data);
    } catch (error) {
        console.error("❌ Weather API Error:", error);
        res.status(500).json({ error: "Failed to fetch weather data" });
    }
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error("🚨 Uncaught Error:", err);
    res.status(500).json({ error: "Something went wrong" });
});

const server = app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});

// Handle "EADDRINUSE" error
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${port} is already in use. Trying a different port...`);
        setTimeout(() => {
            server.listen(0, () => { // 0 means pick a random available port
                console.log(`🚀 Server restarted on available port: ${server.address().port}`);
            });
        }, 1000);
    } else {
        console.error('❌ Server error:', err);
    }
});



app.get('/cities', async (req, res) => {
  try {
    const cities = await City.find();
    res.json(cities);
  } catch (err) {
    console.error("Error fetching cities:", err);
    res.status(500).json({ error: "Server error while fetching cities." });
  }
});

const OpenAI = require("openai");

if (!process.env.OPENAI_API_KEY) {
    console.warn("⚠️ Warning: OpenAI API Key is missing. AI responses will not work.");
}

  


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY.trim(), // Ensure no extra spaces
});

app.use(express.json());
app.use(cors());







async function generateAIResponse(userMessage) {
    const aiResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: userMessage }]
    });

    if (!aiResponse?.choices?.length) {
        throw new Error("Invalid AI response");
    }

    return aiResponse.choices[0].message?.content?.trim() || "Sorry, I couldn't generate a response.";
}

app.post("/chat", async (req, res) => {
    try {
        const userMessage = req.body.message;
        if (!userMessage) {
            return res.status(400).json({ error: "Message cannot be empty." });
        }

        const aiResponse = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: userMessage }]
        });

        if (!aiResponse?.choices?.length) {
            return res.status(500).json({ error: "AI service error. Try again later." });
        }

        const botMessage = aiResponse.choices[0].message?.content?.trim() || "Sorry, I couldn't generate a response.";
        await new Chat({ userMessage, botMessage }).save();

        res.json({ response: botMessage });

    } catch (error) {
        console.error("AI Chat Error:", error);
        res.status(500).json({ error: "AI service is currently unavailable." });
    }
});


     


app.post("/test", async (req, res) => {
    console.log(req.body); // ✅ Access `req.body` normally
    res.send("Success");
});

 


app.get("/api/weather", async (req, res) => {
    const city = req.query.city;
    if (!city) {
        return res.status(400).json({ error: "City name is required." });
    }

    if (!process.env.OPENWEATHER_API_KEY) {
        return res.status(500).json({ error: "API key is missing. Set OPENWEATHER_API_KEY in .env." });
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch weather data");
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("❌ Weather API Error:", error);
        res.status(500).json({ error: "Failed to fetch weather data" });
    }
});



// Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error("🚨 Uncaught Error:", err);
    res.status(500).json({ error: "Something went wrong" });
});

// Your other routes and middleware here

const sendMessage = async () => {
    const chatInput = document.getElementById("chat-input");
    const message = chatInput.value.trim();
    const sender = "User"; // Replace with actual sender info

    if (!message) {
        alert("Message cannot be empty");
        return;
    }

    const response = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, sender })
    });

    if (!response.ok) {
        console.error("Chat API error:", response.statusText);
    } else {
        console.log("Message sent successfully");
        chatInput.value = ""; // Clear input after sending
    }
};

const apiKey = "2149cbc5da7384b8ef7bcccf62b0bf68"; // Ensure this is valid

const fetchWeatherAlerts = async (city) => {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("No weather alerts available");
        return await response.json();
    } catch (error) {
        console.warn("No alerts found for", city);
        return null;
    }
};

// Fetch weather data from API
async function fetchWeatherData(city) {
    try {
        if (!city) throw new Error("City name is required");

        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`);

        if (!response.ok) {
            const errorMessage = `API Error ${response.status}: ${response.statusText}`;
            throw new Error(errorMessage);
        }

        const data = await response.json();
        if (!data || !data.main) {
            throw new Error("Invalid weather data received");
        }

        return data;
    } catch (error) {
        console.error("❌ Weather API error:", error.message);
        return null; // Prevents app from crashing
    }
}

// Fetch weather data from API
async function fetchWeather(city) {
    if (!city || city.trim() === "") {
        alert("Please enter a valid city name.");
        return;
    }

    try {
        const weatherData = await fetchWeatherData(city);

        if (!weatherData) {
            alert("❌ Error fetching weather data.");
            return;
        }

        updateWeatherUI(weatherData);
        fetchWeatherForecast(city); // Fetch and update the forecast
        fetchWeatherAlerts(city); // Fetch and display weather alerts
    } catch (error) {
        console.error("❌ Error fetching weather data:", error);
        alert(`❌ Error: ${error.message}`);
    }
}

const saveCity = async (city) => {
    const response = await fetch("/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city })
    });

    if (response.status === 401) {
        alert("You must be logged in to save a city.");
        return;
    }

    if (!response.ok) {
        console.error("Failed to save city:", response.statusText);
    } else {
        console.log("City saved successfully");
    }
};

app.get('/api', (req, res) => {
    res.json({ message: "API is working" });
});

setInterval(() => {
    console.log("✅ Keeping the server alive...");
}, 1000 * 60 * 5); // Runs every 5 minutes
