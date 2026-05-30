const axios = require("axios");
const BASE = "https://api.openweathermap.org";
const KEY = process.env.API_KEY;

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { path, city, lat, lon } = req.query;
  try {
    let url = "";
    if (path === "weather") url = `${BASE}/data/2.5/weather?q=${city}&appid=${KEY}&units=metric`;
    else if (path === "weathercoords") url = `${BASE}/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${KEY}&units=metric`;
    else if (path === "forecast") url = `${BASE}/data/2.5/forecast?q=${city}&appid=${KEY}&units=metric`;
    else if (path === "forecastcoords") url = `${BASE}/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${KEY}&units=metric`;
    else if (path === "aqi") url = `${BASE}/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${KEY}`;
    else return res.status(400).json({ message: "Invalid request" });
    const { data } = await axios.get(url);
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ message: err.response?.data?.message || "Error" });
  }
};