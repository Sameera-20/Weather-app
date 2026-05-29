import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {

  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [darkMode, setDarkMode] = useState(true);

  const getWeather = async () => {

    try {

      const response = await axios.get(
        `http://localhost:5000/weather/${city}`
      );

      setWeather(response.data);

    } catch (error) {

      alert("City not found");

    }
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  return (

    <div className={darkMode ? "app dark" : "app light"}>

      <div className="container">

        <button className="theme-btn" onClick={toggleTheme}>
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>

        <h1>Weather App</h1>

        <input
          type="text"
          placeholder="Enter city"
          onChange={(e) => setCity(e.target.value)}
        />

        <button className="search-btn" onClick={getWeather}>
          Search
        </button>

        {weather && (

          <div className="card">

            <h2>{weather.name}</h2>

            <h3>{weather.main.temp} °C</h3>

            <p>🌤️ {weather.weather[0].main}</p>

            <p>💧 Humidity: {weather.main.humidity}</p>

            <p>🌬️ Wind Speed: {weather.wind.speed}</p>

          </div>

        )}

      </div>

    </div>
  );
}

export default App;
