import { useState, useCallback, useRef } from "react";
import axios from "axios";
import "./App.css";
const API = "https://weather-app-production-48c8.up.railway.app";

const BG_MAP = {
  Clear:        "https://images.unsplash.com/photo-1561484930-998b6a7b22e8?w=1600&q=80",
  Clouds:       "https://images.unsplash.com/photo-1504608524841-42584120d693?w=1600&q=80",
  Rain:         "https://images.unsplash.com/photo-1428592953211-077101b2021b?w=1600&q=80",
  Drizzle:      "https://images.unsplash.com/photo-1541919329513-35f7af297129?w=1600&q=80",
  Thunderstorm: "https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?w=1600&q=80",
  Snow:         "https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=1600&q=80",
  Mist:         "https://images.unsplash.com/photo-1487621167305-5d248087c724?w=1600&q=80",
  Fog:          "https://images.unsplash.com/photo-1487621167305-5d248087c724?w=1600&q=80",
  Haze:         "https://images.unsplash.com/photo-1504253492562-b3e3cddeadaf?w=1600&q=80",
  Smoke:        "https://images.unsplash.com/photo-1504253492562-b3e3cddeadaf?w=1600&q=80",
  Dust:         "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=1600&q=80",
  Sand:         "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=1600&q=80",
  Tornado:      "https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?w=1600&q=80",
  default:      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1600&q=80",
};

const ICONS = {
  Clear: "☀️", Clouds: "☁️", Rain: "🌧️", Drizzle: "🌦️",
  Thunderstorm: "⛈️", Snow: "❄️", Mist: "🌫️", Fog: "🌫️",
  Haze: "🌁", Smoke: "💨", Dust: "🌪️", Sand: "🏜️", Tornado: "🌪️",
};

const AQI_LABELS = ["", "Good", "Fair", "Moderate", "Poor", "Very Poor"];
const AQI_COLORS = ["", "#22c55e", "#84cc16", "#f59e0b", "#ef4444", "#7f1d1d"];

const formatTime = (unix, tz = 0) => {
  const d = new Date((unix + tz) * 1000);
  return d.toUTCString().slice(17, 22);
};

const formatDay = (unix) => {
  const d = new Date(unix * 1000);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

const getDailyForecast = (list) => {
  const days = {};
  list.forEach((item) => {
    const day = new Date(item.dt * 1000).toDateString();
    if (!days[day]) days[day] = [];
    days[day].push(item);
  });
  return Object.entries(days).slice(0, 5).map(([, items]) => ({
    dt: items[Math.floor(items.length / 2)].dt,
    temp_max: Math.max(...items.map((i) => i.main.temp_max)),
    temp_min: Math.min(...items.map((i) => i.main.temp_min)),
    weather: items[Math.floor(items.length / 2)].weather,
    pop: Math.max(...items.map((i) => i.pop || 0)),
  }));
};

const getHourlyForecast = (list) => list.slice(0, 8);

function StatCard({ label, value, icon, sub }) {
  return (
    <div className="stat-card">
      <span className="stat-icon">{icon}</span>
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
        {sub && <span className="stat-sub">{sub}</span>}
      </div>
    </div>
  );
}

function HourlyItem({ item, tz }) {
  const cond = item.weather[0].main;
  return (
    <div className="hourly-item">
      <span className="hourly-time">{formatTime(item.dt, tz)}</span>
      <span className="hourly-icon">{ICONS[cond] || "🌡️"}</span>
      <span className="hourly-temp">{Math.round(item.main.temp)}°</span>
      <span className="hourly-pop">💧{Math.round((item.pop || 0) * 100)}%</span>
    </div>
  );
}

function DailyItem({ item }) {
  const cond = item.weather[0].main;
  return (
    <div className="daily-item">
      <span className="daily-day">{formatDay(item.dt)}</span>
      <span className="daily-icon">{ICONS[cond] || "🌡️"}</span>
      <span className="daily-desc">{item.weather[0].description}</span>
      <div className="daily-temps">
        <span className="daily-max">{Math.round(item.temp_max)}°</span>
        <div className="temp-bar">
          <div
            className="temp-bar-fill"
            style={{ width: `${Math.min(100, Math.round(item.temp_max) + 10)}%` }}
          />
        </div>
        <span className="daily-min">{Math.round(item.temp_min)}°</span>
      </div>
      <span className="daily-pop">💧{Math.round(item.pop * 100)}%</span>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="loading-wrap">
      <div className="spinner" />
      <p>Fetching weather data...</p>
    </div>
  );
}

export default function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [aqi, setAqi] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [tab, setTab] = useState("now");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bgUrl, setBgUrl] = useState(BG_MAP.default);
  const [bgLoaded, setBgLoaded] = useState(true);
  const [unit, setUnit] = useState("C");
  const inputRef = useRef(null);

  const convertTemp = (c) => unit === "C" ? c : (c * 9) / 5 + 32;
  const tempLabel = (c) => `${Math.round(convertTemp(c))}°${unit}`;

  const updateBackground = useCallback((condition) => {
    const url = BG_MAP[condition] || BG_MAP.default;
    setBgLoaded(false);
    const img = new Image();
    img.src = url;
    img.onload = () => { setBgUrl(url); setBgLoaded(true); };
    img.onerror = () => { setBgUrl(BG_MAP.default); setBgLoaded(true); };
  }, []);

  const fetchByCoords = useCallback(async (lat, lon) => {
    setLoading(true);
    setError("");
    try {
      const [wRes, fRes, aqiRes] = await Promise.allSettled([
        axios.get(`${API}/weather/coords/${lat}/${lon}`),
        axios.get(`${API}/forecast/coords/${lat}/${lon}`),
        axios.get(`${API}/aqi/${lat}/${lon}`),
      ]);
      if (wRes.status === "fulfilled") {
        setWeather(wRes.value.data);
        updateBackground(wRes.value.data.weather[0].main);
      }
      if (fRes.status === "fulfilled") setForecast(fRes.value.data);
      if (aqiRes.status === "fulfilled") setAqi(aqiRes.value.data);
    } catch {
      setError("Could not fetch location weather.");
    } finally {
      setLoading(false);
    }
  }, [updateBackground]);

  // ✅ Auto-detect on mount REMOVED — app starts with welcome screen

  const fetchByCity = async () => {
    if (!city.trim()) { inputRef.current?.focus(); return; }
    setLoading(true);
    setError("");
    try {
      const [wRes, fRes] = await Promise.allSettled([
        axios.get(`${API}/weather/${encodeURIComponent(city.trim())}`),
        axios.get(`${API}/forecast/${encodeURIComponent(city.trim())}`),
      ]);
      if (wRes.status === "fulfilled") {
        const w = wRes.value.data;
        setWeather(w);
        updateBackground(w.weather[0].main);
        try {
          const aqiRes = await axios.get(`${API}/aqi/${w.coord.lat}/${w.coord.lon}`);
          setAqi(aqiRes.data);
        } catch {}
      } else {
        setError(wRes.reason?.response?.data?.message || "City not found.");
        setWeather(null);
      }
      if (fRes.status === "fulfilled") setForecast(fRes.value.data);
      else setForecast(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") fetchByCity(); };

  const condition = weather?.weather[0]?.main || "";
  const daily = forecast ? getDailyForecast(forecast.list) : [];
  const hourly = forecast ? getHourlyForecast(forecast.list) : [];
  const aqiVal = aqi?.list?.[0]?.main?.aqi;

  return (
    <div className={`app ${darkMode ? "dark" : "light"}`}>
      <div
        className={`bg-layer ${bgLoaded ? "loaded" : ""}`}
        style={{ backgroundImage: `url(${bgUrl})` }}
      />
      <div className="bg-overlay" />
      <div className="blob blob-1" />
      <div className="blob blob-2" />

      <div className="shell">
        <header className="topbar">
          <div className="logo">
            <span className="logo-icon">🌤</span>
            <span className="logo-text">Weather Forecast</span>
          </div>
          <div className="topbar-right">
            <button
              className="unit-btn"
              onClick={() => setUnit((u) => (u === "C" ? "F" : "C"))}
              title="Toggle unit"
            >
              °{unit === "C" ? "F" : "C"}
            </button>
            <button className="theme-btn" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>
        </header>

        <div className="search-row">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search city…"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={handleKey}
            />
            {city && (
              <button className="clear-btn" onClick={() => setCity("")}>✕</button>
            )}
          </div>
          <button className="search-btn" onClick={fetchByCity} disabled={loading}>
            {loading ? "…" : "Search"}
          </button>
          <button
            className="location-btn"
            title="Use my location"
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (pos) => fetchByCoords(pos.coords.latitude, pos.coords.longitude),
                  () => setError("Location access denied.")
                );
              }
            }}
          >
            📍
          </button>
        </div>

        {error && <div className="error-msg">⚠️ {error}</div>}
        {loading && <LoadingSpinner />}

        {!loading && weather && (
          <>
            <div className="hero-card">
              <div className="hero-left">
                <h1 className="hero-city">
                  {weather.name}
                  <span className="hero-country">, {weather.sys.country}</span>
                </h1>
                <p className="hero-date">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long", month: "long", day: "numeric",
                  })}
                </p>
                <div className="hero-temp">{tempLabel(weather.main.temp)}</div>
                <p className="hero-feels">
                  Feels like {tempLabel(weather.main.feels_like)} · {weather.weather[0].description}
                </p>
                <div className="hero-range">
                  <span>⬆ {tempLabel(weather.main.temp_max)}</span>
                  <span>⬇ {tempLabel(weather.main.temp_min)}</span>
                </div>
              </div>
              <div className="hero-right">
                <div className="hero-icon">{ICONS[condition] || "🌡️"}</div>
                <p className="hero-condition">{condition}</p>
                {aqiVal && (
                  <div
                    className="aqi-badge"
                    style={{ background: AQI_COLORS[aqiVal] + "33", borderColor: AQI_COLORS[aqiVal] }}
                  >
                    <span style={{ color: AQI_COLORS[aqiVal] }}>AQI {aqiVal}</span>
                    <span className="aqi-label">{AQI_LABELS[aqiVal]}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="tabs">
              {["now", "hourly", "forecast"].map((t) => (
                <button
                  key={t}
                  className={`tab-btn ${tab === t ? "active" : ""}`}
                  onClick={() => setTab(t)}
                >
                  {t === "now" ? "📊 Details" : t === "hourly" ? "⏱ Hourly" : "📅 5-Day"}
                </button>
              ))}
            </div>

            {tab === "now" && (
              <div className="tab-content">
                <div className="stats-grid">
                  <StatCard icon="💧" label="Humidity" value={`${weather.main.humidity}%`} />
                  <StatCard icon="🌬️" label="Wind" value={`${weather.wind.speed} m/s`} sub={`${Math.round(weather.wind.speed * 3.6)} km/h`} />
                  <StatCard icon="📊" label="Pressure" value={`${weather.main.pressure} hPa`} />
                  <StatCard icon="👁️" label="Visibility" value={`${((weather.visibility || 0) / 1000).toFixed(1)} km`} />
                  <StatCard icon="🌅" label="Sunrise" value={formatTime(weather.sys.sunrise, weather.timezone)} />
                  <StatCard icon="🌇" label="Sunset" value={formatTime(weather.sys.sunset, weather.timezone)} />
                  <StatCard icon="☁️" label="Cloud Cover" value={`${weather.clouds.all}%`} />
                  {weather.wind.gust && (
                    <StatCard icon="💨" label="Wind Gust" value={`${weather.wind.gust} m/s`} />
                  )}
                </div>
              </div>
            )}

            {tab === "hourly" && (
              <div className="tab-content">
                {hourly.length > 0 ? (
                  <div className="hourly-scroll">
                    {hourly.map((item) => (
                      <HourlyItem key={item.dt} item={item} tz={weather.timezone} />
                    ))}
                  </div>
                ) : (
                  <p className="no-data">No hourly data available.</p>
                )}
              </div>
            )}

            {tab === "forecast" && (
              <div className="tab-content">
                {daily.length > 0 ? (
                  <div className="daily-list">
                    {daily.map((item) => (
                      <DailyItem key={item.dt} item={item} convertTemp={convertTemp} />
                    ))}
                  </div>
                ) : (
                  <p className="no-data">No forecast data available.</p>
                )}
              </div>
            )}
          </>
        )}

        {!loading && !weather && !error && (
          <div className="welcome">
            <div className="welcome-icon">🌍</div>
            <h2>Real-time weather, anywhere.</h2>
            <p>Search a city or allow location access to get started.</p>
          </div>
        )}

        <footer className="footer">
          Powered by OpenWeatherMap · Weather Forecast
        </footer>
      </div>
    </div>
  );
}
