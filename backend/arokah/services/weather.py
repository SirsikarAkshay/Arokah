"""
Weather service using Open-Meteo (https://open-meteo.com).
Free, no API key required. Returns a standardised WeatherSnapshot dict.
"""
import datetime
import requests
from typing import Optional


# WMO weather interpretation codes → human label
WMO_CODES = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Foggy', 48: 'Icy fog',
    51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
    61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
    71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
    80: 'Light showers', 81: 'Showers', 82: 'Heavy showers',
    85: 'Snow showers', 86: 'Heavy snow showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with heavy hail',
}


def get_weather(lat: float, lon: float, date: Optional[datetime.date] = None) -> dict:
    """
    Fetch weather for a lat/lon coordinate.
    Returns today's forecast if date is None, else the forecast for that date.

    Returns a WeatherSnapshot dict:
        {
            'temp_c': float,
            'temp_min_c': float,
            'temp_max_c': float,
            'condition': str,          # human-readable
            'wmo_code': int,
            'precipitation_mm': float,
            'precipitation_probability': int,  # 0-100
            'wind_kmh': float,
            'humidity': int,           # %
            'is_raining': bool,
            'is_cold': bool,           # < 10 °C
            'is_hot': bool,            # > 28 °C
            'date': str,               # ISO
            'source': 'open-meteo',
        }
    """
    if date is None:
        date = datetime.date.today()

    params = {
        'latitude':  lat,
        'longitude': lon,
        'daily': [
            'temperature_2m_max',
            'temperature_2m_min',
            'precipitation_sum',
            'precipitation_probability_max',
            'weathercode',
            'windspeed_10m_max',
        ],
        'hourly': ['relativehumidity_2m', 'temperature_2m'],
        'current_weather': True,
        'timezone': 'auto',
        'start_date': date.isoformat(),
        'end_date':   date.isoformat(),
    }

    try:
        resp = requests.get(
            'https://api.open-meteo.com/v1/forecast',
            params=params,
            timeout=5,
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as exc:
        return _fallback(str(exc), date)

    daily = data.get('daily', {})
    current = data.get('current_weather', {})

    temp_max  = _first(daily.get('temperature_2m_max'))
    temp_min  = _first(daily.get('temperature_2m_min'))
    temp_now  = current.get('temperature', (temp_max + temp_min) / 2 if temp_max is not None else 15)
    wmo       = _first(daily.get('weathercode')) or current.get('weathercode', 0)
    precip    = _first(daily.get('precipitation_sum')) or 0.0
    precip_p  = _first(daily.get('precipitation_probability_max')) or 0
    wind      = _first(daily.get('windspeed_10m_max')) or 0.0

    # Average hourly humidity for the day
    hourly_hum = data.get('hourly', {}).get('relativehumidity_2m', [])
    humidity   = int(sum(hourly_hum) / len(hourly_hum)) if hourly_hum else 60

    return {
        'temp_c':                   round(temp_now, 1),
        'temp_min_c':               round(temp_min or temp_now, 1),
        'temp_max_c':               round(temp_max or temp_now, 1),
        'condition':                WMO_CODES.get(int(wmo), 'Unknown'),
        'wmo_code':                 int(wmo),
        'precipitation_mm':         round(float(precip), 1),
        'precipitation_probability': int(precip_p),
        'wind_kmh':                 round(float(wind), 1),
        'humidity':                 humidity,
        'is_raining':               int(wmo) in {51,53,55,61,63,65,80,81,82,95,96,99},
        'is_cold':                  temp_now < 10,
        'is_hot':                   temp_now > 28,
        'date':                     date.isoformat(),
        'source':                   'open-meteo',
    }


def get_weather_for_location(location_str: str, date: Optional[datetime.date] = None) -> dict:
    """
    Geocode a location string then fetch weather.
    Uses Open-Meteo's free geocoding API.
    """
    try:
        geo = requests.get(
            'https://geocoding-api.open-meteo.com/v1/search',
            params={'name': location_str, 'count': 1, 'language': 'en', 'format': 'json'},
            timeout=5,
        )
        geo.raise_for_status()
        results = geo.json().get('results', [])
        if not results:
            return _fallback(f'Location not found: {location_str}', date or datetime.date.today())
        lat = results[0]['latitude']
        lon = results[0]['longitude']
        snapshot = get_weather(lat, lon, date)
        snapshot['location_name'] = results[0].get('name', location_str)
        return snapshot
    except requests.RequestException as exc:
        return _fallback(str(exc), date or datetime.date.today())


def get_weather_forecast(location_str: str, start_date: datetime.date, end_date: datetime.date) -> list:
    """
    Return a list of WeatherSnapshot dicts, one per day from start_date to end_date.
    Uses Open-Meteo's multi-day forecast with a single API call.
    """
    # Geocode first
    try:
        geo = requests.get(
            'https://geocoding-api.open-meteo.com/v1/search',
            params={'name': location_str, 'count': 1, 'language': 'en', 'format': 'json'},
            timeout=5,
        )
        geo.raise_for_status()
        results = geo.json().get('results', [])
        if not results:
            num_days = (end_date - start_date).days + 1
            return [_fallback(f'Location not found: {location_str}', start_date + datetime.timedelta(days=i))
                    for i in range(num_days)]
        lat = results[0]['latitude']
        lon = results[0]['longitude']
        loc_name = results[0].get('name', location_str)
    except requests.RequestException as exc:
        num_days = (end_date - start_date).days + 1
        return [_fallback(str(exc), start_date + datetime.timedelta(days=i)) for i in range(num_days)]

    # Fetch multi-day forecast in one call
    params = {
        'latitude': lat, 'longitude': lon,
        'daily': [
            'temperature_2m_max', 'temperature_2m_min',
            'precipitation_sum', 'precipitation_probability_max',
            'weathercode', 'windspeed_10m_max',
        ],
        'timezone': 'auto',
        'start_date': start_date.isoformat(),
        'end_date': end_date.isoformat(),
    }
    try:
        resp = requests.get('https://api.open-meteo.com/v1/forecast', params=params, timeout=8)
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as exc:
        num_days = (end_date - start_date).days + 1
        return [_fallback(str(exc), start_date + datetime.timedelta(days=i)) for i in range(num_days)]

    daily = data.get('daily', {})
    dates = daily.get('time', [])
    forecasts = []
    for i, date_str in enumerate(dates):
        temp_max = (daily.get('temperature_2m_max') or [])[i] if i < len(daily.get('temperature_2m_max', [])) else None
        temp_min = (daily.get('temperature_2m_min') or [])[i] if i < len(daily.get('temperature_2m_min', [])) else None
        temp_avg = round((temp_max + temp_min) / 2, 1) if temp_max is not None and temp_min is not None else 15.0
        wmo = (daily.get('weathercode') or [])[i] if i < len(daily.get('weathercode', [])) else 0
        precip = (daily.get('precipitation_sum') or [])[i] if i < len(daily.get('precipitation_sum', [])) else 0
        precip_p = (daily.get('precipitation_probability_max') or [])[i] if i < len(daily.get('precipitation_probability_max', [])) else 0
        wind = (daily.get('windspeed_10m_max') or [])[i] if i < len(daily.get('windspeed_10m_max', [])) else 0

        forecasts.append({
            'temp_c': temp_avg,
            'temp_min_c': round(temp_min or temp_avg, 1),
            'temp_max_c': round(temp_max or temp_avg, 1),
            'condition': WMO_CODES.get(int(wmo), 'Unknown'),
            'wmo_code': int(wmo),
            'precipitation_mm': round(float(precip), 1),
            'precipitation_probability': int(precip_p or 0),
            'wind_kmh': round(float(wind or 0), 1),
            'humidity': 60,
            'is_raining': int(wmo) in {51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99},
            'is_cold': temp_avg < 10,
            'is_hot': temp_avg > 28,
            'date': date_str,
            'source': 'open-meteo',
            'location_name': loc_name,
        })

    return forecasts


def _first(lst):
    if lst and len(lst) > 0:
        return lst[0]
    return None


def _fallback(reason: str, date: datetime.date) -> dict:
    """Return a safe default when the API is unreachable."""
    return {
        'temp_c': 15.0, 'temp_min_c': 10.0, 'temp_max_c': 20.0,
        'condition': 'Unknown (API unavailable)',
        'wmo_code': 0, 'precipitation_mm': 0.0,
        'precipitation_probability': 0, 'wind_kmh': 0.0,
        'humidity': 60, 'is_raining': False, 'is_cold': False, 'is_hot': False,
        'date': date.isoformat(), 'source': 'fallback',
        'error': reason,
    }
