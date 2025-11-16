import React, { useState } from 'react'
import SearchBar from './components/SearchBar.jsx'
import WeatherCard from './components/WeatherCard.jsx'
import ForecastList from './components/ForecastList.jsx'
import { getWeatherByCity, getWeatherByCoords } from './utils/api.js'

export default function App() {
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSearch(city) {
    setLoading(true)
    setError(null)
    try {
      const { current, daily, cityName } = await getWeatherByCity(city)
      setWeather({ ...current, name: cityName || current.name })
      setForecast(daily)
      setLoading(false)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Lỗi khi tải dữ liệu')
      setLoading(false)
    }
  }

  async function handleUseLocation() {
    if (!navigator.geolocation) {
      setError('Trình duyệt không hỗ trợ Geolocation')
      return
    }
    setLoading(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude
          const lon = pos.coords.longitude
          const { current, daily, cityName } = await getWeatherByCoords(lat, lon)
          setWeather({ ...current, name: cityName || current.name })
          setForecast(daily)
        } catch (err) {
          console.error(err)
          setError(err.message || 'Lỗi khi tải dữ liệu vị trí')
        } finally {
          setLoading(false)
        }
      },
      (err) => {
        console.error('Geolocation error', err)
        setError('Không thể lấy vị trí: ' + (err.message || err.code))
        setLoading(false)
      },
      { timeout: 15000 }
    )
  }

  return (
    <div className="app-root">
      <div className="hero">
        <div className="hero-overlay" />
        <div className="container">
          <header className="header">
            <h1>Thời tiết đẹp</h1>
            <p className="tagline">Nhanh, trực quan và thật đẹp — dựa trên OpenWeather</p>
          </header>

          <SearchBar onSearch={handleSearch} loading={loading} onUseLocation={handleUseLocation} />

          {error && <div className="error">{error}</div>}

          {loading && <div className="loading">Đang tải...</div>}

          {weather && (
            <>
              <WeatherCard data={weather} cityName={weather.name || ''} />
              {forecast && <ForecastList daily={forecast} />}
            </>
          )}

          {!weather && !loading && (
            <div className="empty-note">Nhập tên thành phố (ví dụ: Hà Nội, Ho Chi Minh) để xem thời tiết</div>
          )}

          <footer className="footer">
            <small>Backend: Spring (sẽ triển khai sau) • Dữ liệu từ OpenWeatherMap</small>
          </footer>
        </div>
      </div>
    </div>
  )
}
