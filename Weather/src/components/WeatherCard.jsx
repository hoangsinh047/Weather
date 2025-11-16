import React from 'react'

function formatTime(ts, timezoneOffset) {
  try {
    const date = new Date((ts + (timezoneOffset || 0)) * 1000)
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  } catch (e) {
    return ''
  }
}

export default function WeatherCard({ data = {}, cityName = '' }) {
  const icon = data.weather && data.weather[0] ? data.weather[0].icon : null
  const desc = data.weather && data.weather[0] ? data.weather[0].description : ''

  // Safe formatters to avoid NaN when values are missing
  const formatTemp = (t) => (typeof t === 'number' ? `${Math.round(t)}°C` : '—')
  const formatPercent = (v) => (typeof v === 'number' ? `${v}%` : '—')
  const formatWind = (w) => (typeof w === 'number' ? `${w} m/s` : '—')

  return (
    <div className="weather-card">
      <div className="wc-left">
        <div className="wc-city">{cityName || data.name || '—'}</div>
        <div className="wc-temp">{formatTemp(data.temp)}</div>
        <div className="wc-desc">{desc}</div>
        <div className="wc-meta">
          <div>Feels: {formatTemp(data.feels_like)}</div>
          <div>Humidity: {formatPercent(data.humidity)}</div>
          <div>Wind: {formatWind(data.wind_speed)}</div>
        </div>
      </div>
      <div className="wc-right">
        {icon ? (
          <img
            className="wc-icon"
            src={`https://openweathermap.org/img/wn/${icon}@4x.png`}
            alt={desc}
            width="120"
            height="120"
          />
        ) : (
          <div className="wc-noicon">—</div>
        )}
        {data.sunrise && data.sunset && (
          <div className="sun-times">
            <div>Sunrise: {formatTime(data.sunrise, data.timezone_offset)}</div>
            <div>Sunset: {formatTime(data.sunset, data.timezone_offset)}</div>
          </div>
        )}
      </div>
    </div>
  )
}
