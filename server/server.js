const express = require("express");
const cors = require("cors");
const axios = require("axios");

require("dotenv").config();
console.log("API_KEY loaded:", process.env.API_KEY ? "YES" : "NO");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const BASE = "https://api.openweathermap.org";

// Current weather by city name
app.get("/weather/:city", async (req, res) => {
  try {
    const { city } = req.params;
    const { data } = await axios.get(
      `${BASE}/data/2.5/weather?q=${city}&appid=${process.env.API_KEY}&units=metric`
    );
    res.json(data);
  } catch (err) {
    const status = err.response?.status || 500;
    res.status(status).json({ message: err.response?.data?.message || "Error fetching weather" });
  }
});

// Current weather by coordinates
app.get("/weather/coords/:lat/:lon", async (req, res) => {
  try {
    const { lat, lon } = req.params;
    const { data } = await axios.get(
      `${BASE}/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.API_KEY}&units=metric`
    );
    res.json(data);
  } catch (err) {
    const status = err.response?.status || 500;
    res.status(status).json({ message: err.response?.data?.message || "Error fetching weather" });
  }
});

// 5-day forecast by city
app.get("/forecast/:city", async (req, res) => {
  try {
    const { city } = req.params;
    const { data } = await axios.get(
      `${BASE}/data/2.5/forecast?q=${city}&appid=${process.env.API_KEY}&units=metric`
    );
    res.json(data);
  } catch (err) {
    const status = err.response?.status || 500;
    res.status(status).json({ message: err.response?.data?.message || "Error fetching forecast" });
  }
});

// 5-day forecast by coordinates
app.get("/forecast/coords/:lat/:lon", async (req, res) => {
  try {
    const { lat, lon } = req.params;
    const { data } = await axios.get(
      `${BASE}/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${process.env.API_KEY}&units=metric`
    );
    res.json(data);
  } catch (err) {
    const status = err.response?.status || 500;
    res.status(status).json({ message: err.response?.data?.message || "Error fetching forecast" });
  }
});

// Air Quality Index
app.get("/aqi/:lat/:lon", async (req, res) => {
  try {
    const { lat, lon } = req.params;
    const { data } = await axios.get(
      `${BASE}/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${process.env.API_KEY}`
    );
    res.json(data);
  } catch (err) {
    const status = err.response?.status || 500;
    res.status(status).json({ message: "Error fetching AQI" });
  }
});

app.listen(PORT, () => console.log(`🌤  Weather server running on port ${PORT}`));