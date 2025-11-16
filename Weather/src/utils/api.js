const GEO_URL = 'https://api.openweathermap.org/geo/1.0/direct'
const GEO_REVERSE_URL = 'https://api.openweathermap.org/geo/1.0/reverse'
const ONECALL_URL = 'https://api.openweathermap.org/data/2.5/onecall'

function getKey() {
  // Debug: print whether a key is present (masked) so we can confirm the frontend sees the env var
  try {
    const raw = import.meta.env.VITE_OPENWEATHER_KEY || ''
    // don't log the full key for security — only show presence and first/last 2 chars
    if (raw) {
      const masked = raw.length > 4 ? `${raw.slice(0,2)}...${raw.slice(-2)}` : '***'
      console.log('[DEBUG] VITE_OPENWEATHER_KEY present:', masked)
    } else {
      console.log('[DEBUG] VITE_OPENWEATHER_KEY is missing or empty')
    }
    return raw
  } catch (e) {
    console.log('[DEBUG] import.meta.env not available in this context')
    return ''
  }
}

function getBackend() {
  // If you set VITE_BACKEND_URL (e.g. http://localhost:8080) the frontend will call the backend proxy.
  return (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '')
}

async function fetchJson(url, opts) {
  const res = await fetch(url, opts)
  const txt = await res.text()
  if (!res.ok) {
    // throw an Error that preserves status and body for callers to inspect
    const err = new Error(`HTTP ${res.status}: ${txt}`)
    err.status = res.status
    err.body = txt
    throw err
  }
  try {
    return JSON.parse(txt)
  } catch (e) {
    return txt
  }
}

// Helper: fallback using /weather and /forecast when One Call is unavailable for the key
async function fetchWeatherAndForecastByCoords(lat, lon) {
  const key = getKey()
  const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=vi&appid=${key}`
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=vi&appid=${key}`

  // Debug: log types to diagnose TypeError
  let weather, forecast
  try {
    weather = await fetchJson(weatherUrl)
  } catch (e) {
    console.error('[DEBUG] fetch weather failed', e)
    throw e
  }
  try {
    forecast = await fetchJson(forecastUrl)
  } catch (e) {
    console.error('[DEBUG] fetch forecast failed', e)
    throw e
  }

  console.log('[DEBUG] fetchWeatherAndForecastByCoords - weather type:', typeof weather, Object.prototype.toString.call(weather))
  console.log('[DEBUG] fetchWeatherAndForecastByCoords - forecast type:', typeof forecast, Object.prototype.toString.call(forecast))

  // Ensure forecast.list is an array
  const list = Array.isArray(forecast && forecast.list) ? forecast.list : []
  if (!Array.isArray(forecast && forecast.list)) {
    console.warn('[WARN] forecast.list is not an array — using empty list as fallback')
  }

  // Build a current object similar to One Call's current
  const current = {
    // include useful fields from weather response and normalize shape
    name: weather && weather.name ? weather.name : '',
    temp: weather && weather.main && typeof weather.main.temp === 'number' ? weather.main.temp : undefined,
    feels_like: weather && weather.main && typeof weather.main.feels_like === 'number' ? weather.main.feels_like : undefined,
    humidity: weather && weather.main && typeof weather.main.humidity === 'number' ? weather.main.humidity : undefined,
    wind_speed: weather && weather.wind && weather.wind.speed,
    timezone_offset: weather && typeof weather.timezone === 'number' ? weather.timezone : 0,
    sunrise: weather && weather.sys && weather.sys.sunrise,
    sunset: weather && weather.sys && weather.sys.sunset,
    // include weather array to keep icon/description logic consistent
    weather: Array.isArray(weather && weather.weather) ? weather.weather : [],
  }

  // Synthesize daily from 3-hour forecast: group by date and pick day snapshot
  const groups = {}
  list.forEach((item) => {
    // date string in YYYY-MM-DD in UTC (close enough for grouping)
    const day = new Date(item.dt * 1000).toISOString().slice(0, 10)
    if (!groups[day]) groups[day] = []
    groups[day].push(item)
  })

  const daily = Object.keys(groups)
    .slice(0, 8)
    .map((day) => {
      const items = groups[day] || []
      // derive min/max temp and pick the middle item as representative
      const temps = items.map((i) => (i && i.main ? i.main.temp : undefined)).filter((t) => typeof t === 'number')
      const min = temps.length ? Math.min(...temps) : undefined
      const max = temps.length ? Math.max(...temps) : undefined
      const rep = items[Math.floor(items.length / 2)] || {}
      return {
        dt: rep.dt || Math.floor(new Date(day).getTime() / 1000),
        temp: { day: rep.main && rep.main.temp, min, max },
        weather: rep.weather || [],
        timezone_offset: weather && weather.timezone ? weather.timezone : 0,
      }
    })

  return { current, daily, cityName: weather && weather.name ? weather.name : '' }
}

// Internal helper that calls OpenWeather directly (used when no backend proxy configured)
async function fetchOpenWeatherByCity(city) {
  const key = getKey()
  if (!key) throw new Error('Missing OpenWeather API key. Set VITE_OPENWEATHER_KEY in your .env')

  const geourl = `${GEO_URL}?q=${encodeURIComponent(city)}&limit=1&appid=${key}`
  const geo = await fetchJson(geourl)
  if (!geo || !geo.length) throw new Error('Không tìm thấy thành phố: ' + city)
  const { lat, lon, name, country, state } = geo[0]
  const cityName = [name, state, country].filter(Boolean).join(', ')

  // Try One Call first; if key isn't allowed for One Call (401), fallback to /weather + /forecast
  try {
    const onecall = `${ONECALL_URL}?lat=${lat}&lon=${lon}&units=metric&lang=vi&exclude=minutely,hourly,alerts&appid=${key}`
    const data = await fetchJson(onecall)

    const current = {
      ...data.current,
      name: cityName,
      wind_speed: data.current.wind_speed,
      timezone_offset: data.timezone_offset,
      sunrise: data.current.sunrise,
      sunset: data.current.sunset,
    }

    const daily = (data.daily || []).map((d) => ({ ...d, timezone_offset: data.timezone_offset }))

    return { current, daily, cityName }
  } catch (e) {
    // If unauthorized for One Call, fallback to weather+forecast
    if (e && e.status === 401) {
      console.warn('[WARN] One Call 401 — falling back to /weather and /forecast')
      return fetchWeatherAndForecastByCoords(lat, lon)
    }
    throw e
  }
}

// Internal helper that calls OpenWeather by coordinates and attempts reverse geocoding to get city name
async function fetchOpenWeatherByCoords(lat, lon) {
  const key = getKey()
  if (!key) throw new Error('Missing OpenWeather API key. Set VITE_OPENWEATHER_KEY in your .env')

  // Try One Call first; if unauthorized, fallback
  try {
    const onecall = `${ONECALL_URL}?lat=${lat}&lon=${lon}&units=metric&lang=vi&exclude=minutely,hourly,alerts&appid=${key}`
    const data = await fetchJson(onecall)

    // try reverse geocoding for nicer city name
    let cityName = ''
    try {
      const rev = `${GEO_REVERSE_URL}?lat=${lat}&lon=${lon}&limit=1&appid=${key}`
      const r = await fetchJson(rev)
      if (r && r.length) {
        const { name, state, country } = r[0]
        cityName = [name, state, country].filter(Boolean).join(', ')
      }
    } catch (e) {
      // ignore reverse geocoding errors
      cityName = ''
    }

    const current = {
      ...data.current,
      name: cityName,
      wind_speed: data.current.wind_speed,
      timezone_offset: data.timezone_offset,
      sunrise: data.current.sunrise,
      sunset: data.current.sunset,
    }
    const daily = (data.daily || []).map((d) => ({ ...d, timezone_offset: data.timezone_offset }))
    return { current, daily, cityName }
  } catch (e) {
    if (e && e.status === 401) {
      console.warn('[WARN] One Call 401 — falling back to /weather and /forecast')
      // Fallback will also attempt reverse geocoding by using weather response's name
      return fetchWeatherAndForecastByCoords(lat, lon)
    }
    throw e
  }
}

export async function getWeatherByCity(city) {
  const backend = getBackend()
  if (backend) {
    const url = `${backend}/api/weather?city=${encodeURIComponent(city)}`
    return fetchJson(url)
  }
  return fetchOpenWeatherByCity(city)
}

export async function getWeatherByCoords(lat, lon) {
  const backend = getBackend()
  if (backend) {
    const url = `${backend}/api/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`
    return fetchJson(url)
  }
  return fetchOpenWeatherByCoords(lat, lon)
}
