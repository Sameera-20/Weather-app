const axios = require("axios");

const BASE = "https://api.openweathermap.org";
const KEY = process.env.API_KEY;

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const { path } = req.query;

  try {
    let url = "";
    
    if (path === "weather" && req.query.city) {
      url = `${BASE}/data/2.5/weather?q=${req.query.city}&appid=${KEY}&units=metric`;
    } else if (path === "weathercoords") {
      url = `${BASE}/data/2.5/weather?lat=${req.query.lat}&lon=${req.query.lon}&appid=${KEY}&units=metric`;
    } else if (path === "forecast" && req.query.city) {
      url = `${BASE}/data/2.5/forecast?q=${req.query.city}&appid=${KEY}&units=metric`;
    } else if (path === "forecastcoords") {
      url = `${BASE}/data/2.5/forecast?lat=${req.query.lat}&lon=${req.query.lon}&appid=${KEY}&units=metric`;
    } else if (path === "aqi") {
      url = `${BASE}/data/2.5/air_pollution?lat=${req.query.lat}&lon=${req.query.lon}&appid=${KEY}`;
    } else {
      return res.status(400).json({ message: "Invalid request" });
    }

    const { data } = await axios.get(url);
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ message: err.response?.data?.message || "Error" });
  }
};