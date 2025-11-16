import React from 'react'

function dayName(dt, timezoneOffset) {
  const date = new Date((dt + (timezoneOffset || 0)) * 1000)
  return date.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function ForecastList({ daily = [] }) {
  const formatTemp = (t) => {
    // support number, numeric string, or object like { min: 1, max: 4 }
    if (t && typeof t === 'object') {
      // pick max if available, else day, else min
      const v = typeof t.max === 'number' ? t.max : typeof t.day === 'number' ? t.day : t.min
      const n = Number(v)
      return Number.isFinite(n) ? `${Math.round(n)}°` : '—'
    }
    const n = Number(t)
    return Number.isFinite(n) ? `${Math.round(n)}°` : '—'
  }
  const safeWeather = (d) => (d && Array.isArray(d.weather) && d.weather[0] ? d.weather[0] : { icon: null, description: '' })

  return (
    <div className="forecast-list">
      {daily.slice(0, 7).map((d, idx) => {
        const w = safeWeather(d)
        const icon = w.icon
        const desc = w.description || ''
        return (
          <div className="forecast-item" key={idx}>
            <div className="fi-day">{dayName(d.dt, d.timezone_offset)}</div>
            {icon ? (
              <img src={`https://openweathermap.org/img/wn/${icon}@2x.png`} alt={desc} width="64" height="64" />
            ) : (
              <div className="fi-noicon">—</div>
            )}
            <div className="fi-temp">
              <span className="high">{formatTemp(d.temp && d.temp.max)}</span>
              <span className="low">{formatTemp(d.temp && d.temp.min)}</span>
            </div>
            <div className="fi-desc">{desc}</div>
          </div>
        )
      })}
    </div>
  )
}
