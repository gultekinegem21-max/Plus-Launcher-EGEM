import React, { useState, useEffect, useRef } from 'react';
import { 
  Sun, 
  CloudSun, 
  Cloud, 
  CloudRain, 
  CloudDrizzle, 
  CloudLightning, 
  CloudSnow, 
  CloudFog, 
  Moon, 
  CloudMoon, 
  Wind, 
  Droplets, 
  Compass, 
  Thermometer, 
  Search, 
  MapPin, 
  X, 
  RotateCw,
  ChevronRight,
  Umbrella,
  SunMedium
} from 'lucide-react';

export type TemperatureUnit = 'C' | 'F';

interface WeatherData {
  city: string;
  country?: string;
  latitude: number;
  longitude: number;
  current: {
    temp: number; // in Celsius
    apparentTemp: number;
    humidity: number;
    weatherCode: number;
    isDay: number;
    windSpeed: number;
    precipitation: number;
  };
  hourly: {
    times: string[];
    temperatures: number[];
    weatherCodes: number[];
    precipitationProbs: number[];
  };
  daily: {
    dates: string[];
    maxTemps: number[];
    minTemps: number[];
    weatherCodes: number[];
    precipitationProbMax: number[];
    uvIndexMax: number[];
  };
  updatedAt: number;
}

interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

// Weather interpretation code mapping
export const getWeatherInfo = (code: number, isDay: number = 1) => {
  switch (code) {
    case 0:
      return {
        label: 'Clear sky',
        icon: isDay ? Sun : Moon,
        color: 'text-amber-400',
        bgGradient: 'from-amber-500/20 to-blue-500/10'
      };
    case 1:
      return {
        label: 'Mainly clear',
        icon: isDay ? CloudSun : CloudMoon,
        color: 'text-amber-300',
        bgGradient: 'from-amber-500/15 to-blue-500/10'
      };
    case 2:
      return {
        label: 'Partly cloudy',
        icon: isDay ? CloudSun : CloudMoon,
        color: 'text-blue-300',
        bgGradient: 'from-blue-400/20 to-slate-500/10'
      };
    case 3:
      return {
        label: 'Overcast',
        icon: Cloud,
        color: 'text-gray-300',
        bgGradient: 'from-slate-500/20 to-gray-700/20'
      };
    case 45:
    case 48:
      return {
        label: 'Foggy',
        icon: CloudFog,
        color: 'text-slate-300',
        bgGradient: 'from-slate-400/20 to-zinc-600/20'
      };
    case 51:
    case 53:
    case 55:
      return {
        label: 'Drizzle',
        icon: CloudDrizzle,
        color: 'text-teal-300',
        bgGradient: 'from-teal-500/20 to-blue-600/20'
      };
    case 56:
    case 57:
      return {
        label: 'Freezing Drizzle',
        icon: CloudSnow,
        color: 'text-cyan-300',
        bgGradient: 'from-cyan-500/20 to-blue-700/20'
      };
    case 61:
    case 63:
    case 65:
      return {
        label: 'Rain',
        icon: CloudRain,
        color: 'text-blue-400',
        bgGradient: 'from-blue-600/20 to-indigo-700/20'
      };
    case 66:
    case 67:
      return {
        label: 'Freezing Rain',
        icon: CloudSnow,
        color: 'text-cyan-400',
        bgGradient: 'from-cyan-600/20 to-blue-800/20'
      };
    case 71:
    case 73:
    case 75:
    case 77:
      return {
        label: 'Snow',
        icon: CloudSnow,
        color: 'text-blue-200',
        bgGradient: 'from-blue-200/20 to-slate-400/20'
      };
    case 80:
    case 81:
    case 82:
      return {
        label: 'Rain showers',
        icon: CloudRain,
        color: 'text-blue-400',
        bgGradient: 'from-blue-500/25 to-indigo-600/20'
      };
    case 85:
    case 86:
      return {
        label: 'Snow showers',
        icon: CloudSnow,
        color: 'text-blue-200',
        bgGradient: 'from-indigo-300/20 to-slate-500/20'
      };
    case 95:
      return {
        label: 'Thunderstorm',
        icon: CloudLightning,
        color: 'text-yellow-400',
        bgGradient: 'from-yellow-500/20 to-purple-800/30'
      };
    case 96:
    case 99:
      return {
        label: 'Hailstorm',
        icon: CloudLightning,
        color: 'text-yellow-300',
        bgGradient: 'from-yellow-600/25 to-purple-900/40'
      };
    default:
      return {
        label: 'Clear',
        icon: isDay ? Sun : Moon,
        color: 'text-amber-400',
        bgGradient: 'from-amber-500/20 to-blue-500/10'
      };
  }
};

const convertTemp = (tempC: number, unit: TemperatureUnit) => {
  if (unit === 'F') {
    return Math.round((tempC * 9) / 5 + 32);
  }
  return Math.round(tempC);
};

export const WeatherWidget: React.FC<{ language?: string }> = ({ language = 'en' }) => {
  const [unit, setUnit] = useState<TemperatureUnit>(() => {
    return (localStorage.getItem('weather_unit') as TemperatureUnit) || 'C';
  });

  const [weather, setWeather] = useState<WeatherData | null>(() => {
    try {
      const cached = localStorage.getItem('weather_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        // If cached less than 30 minutes ago
        if (Date.now() - parsed.updatedAt < 30 * 60 * 1000) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);
  const [promptLocation, setPromptLocation] = useState(false);

  // Toggle °C / °F
  const toggleUnit = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setUnit(prev => {
      const next = prev === 'C' ? 'F' : 'C';
      localStorage.setItem('weather_unit', next);
      return next;
    });
  };

  // Fetch forecast data from Open-Meteo
  const fetchWeather = async (lat: number, lon: number, cityName?: string) => {
    setLoading(true);
    setError(null);

    try {
      // 1. If city name not provided, resolve it via BigDataCloud reverse geocoding
      let resolvedCity = cityName;
      if (!resolvedCity) {
        try {
          const revRes = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
          );
          if (revRes.ok) {
            const revData = await revRes.json();
            resolvedCity = revData.city || revData.locality || revData.principalSubdivision || 'Local Area';
          }
        } catch {
          resolvedCity = 'Current Location';
        }
      }

      // 2. Fetch comprehensive forecast from Open-Meteo
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max&timezone=auto&forecast_days=6`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch weather forecast');

      const data = await res.json();

      const newWeather: WeatherData = {
        city: resolvedCity || 'My Location',
        latitude: lat,
        longitude: lon,
        current: {
          temp: data.current.temperature_2m,
          apparentTemp: data.current.apparent_temperature,
          humidity: data.current.relative_humidity_2m,
          weatherCode: data.current.weather_code,
          isDay: data.current.is_day,
          windSpeed: data.current.wind_speed_10m,
          precipitation: data.current.precipitation,
        },
        hourly: {
          times: data.hourly.time.slice(0, 24),
          temperatures: data.hourly.temperature_2m.slice(0, 24),
          weatherCodes: data.hourly.weather_code.slice(0, 24),
          precipitationProbs: data.hourly.precipitation_probability ? data.hourly.precipitation_probability.slice(0, 24) : [],
        },
        daily: {
          dates: data.daily.time,
          maxTemps: data.daily.temperature_2m_max,
          minTemps: data.daily.temperature_2m_min,
          weatherCodes: data.daily.weather_code,
          precipitationProbMax: data.daily.precipitation_probability_max || [],
          uvIndexMax: data.daily.uv_index_max || [],
        },
        updatedAt: Date.now(),
      };

      setWeather(newWeather);
      localStorage.setItem('weather_cache', JSON.stringify(newWeather));
      localStorage.setItem('weather_last_coords', JSON.stringify({ lat, lon, city: resolvedCity }));
      setPromptLocation(false);
    } catch (err: any) {
      console.error('Weather fetch error:', err);
      setError(err?.message || 'Could not load weather');
    } finally {
      setLoading(false);
    }
  };

  // Request browser location ("ask you")
  const requestCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser');
      setIsSearchingCity(true);
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchWeather(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        console.warn('Geolocation denied or failed:', err);
        setLoading(false);
        setError('Location permission denied. Please choose a city.');
        setIsSearchingCity(true);
        setIsModalOpen(true);
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  // Initialize: load cached coordinates or prompt user
  useEffect(() => {
    const saved = localStorage.getItem('weather_last_coords');
    if (saved) {
      try {
        const { lat, lon, city } = JSON.parse(saved);
        if (lat && lon) {
          fetchWeather(lat, lon, city);
          return;
        }
      } catch {
        // ignore
      }
    }
    // If no saved coords and no cache, check if permission was already granted previously
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then(res => {
        if (res.state === 'granted') {
          requestCurrentLocation();
        } else {
          setPromptLocation(true);
        }
      }).catch(() => {
        setPromptLocation(true);
      });
    } else {
      setPromptLocation(true);
    }
  }, []);

  // Debounced geocoding search for cities
  const searchTimeoutRef = useRef<any>(null);
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsGeocodingLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } catch (err) {
        console.error('Geocoding search failed:', err);
      } finally {
        setIsGeocodingLoading(false);
      }
    }, 350);
  };

  const selectCity = (result: GeocodingResult) => {
    const cityName = result.admin1 ? `${result.name}, ${result.admin1}` : result.name;
    fetchWeather(result.latitude, result.longitude, cityName);
    setIsSearchingCity(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Current condition details
  const currentInfo = weather
    ? getWeatherInfo(weather.current.weatherCode, weather.current.isDay)
    : { label: 'Weather', icon: CloudSun, color: 'text-amber-400', bgGradient: 'from-blue-500/20 to-indigo-500/20' };

  const CurrentIcon = currentInfo.icon;

  const quickCities = [
    { name: 'London', lat: 51.5074, lon: -0.1278, country: 'UK' },
    { name: 'New York', lat: 40.7128, lon: -74.006, country: 'USA' },
    { name: 'Tokyo', lat: 35.6762, lon: 139.6503, country: 'Japan' },
    { name: 'Paris', lat: 48.8566, lon: 2.3522, country: 'France' },
    { name: 'Istanbul', lat: 41.0082, lon: 28.9784, country: 'Turkey' },
    { name: 'Sydney', lat: -33.8688, lon: 151.2093, country: 'Australia' },
  ];

  return (
    <>
      {/* HEADER WIDGET BUTTON / BADGE */}
      {promptLocation && !weather ? (
        <button
          onClick={() => {
            setIsModalOpen(true);
            requestCurrentLocation();
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-200 transition-all shadow-sm hover:border-blue-400/40 hover:text-white group backdrop-blur-md"
          title="Click to enable weather for your location"
        >
          <CloudSun className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          <span className="font-medium">Weather</span>
          <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-full border border-blue-500/30">
            Set Location
          </span>
        </button>
      ) : weather ? (
        <div className="flex items-center gap-1.5 bg-gray-900/40 hover:bg-gray-800/60 border border-white/10 hover:border-white/20 rounded-full px-2.5 py-1 text-xs text-white backdrop-blur-md transition-all shadow-sm">
          {/* Main clickable pill to view full forecast */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 group text-left cursor-pointer focus:outline-none"
            title="Click to view detailed weather forecast"
          >
            <CurrentIcon className={`w-4 h-4 ${currentInfo.color} group-hover:scale-110 transition-transform shrink-0`} />
            <span className="font-bold tracking-tight">
              {convertTemp(weather.current.temp, unit)}°{unit}
            </span>
            <span className="hidden md:inline text-gray-300 font-medium truncate max-w-[100px]">
              {currentInfo.label}
            </span>
            <span className="text-gray-400 text-[11px] truncate max-w-[85px] border-l border-white/10 pl-1.5">
              {weather.city.split(',')[0]}
            </span>
          </button>

          {/* Quick inline °C / °F switcher */}
          <button
            onClick={toggleUnit}
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-white/5 hover:bg-white/15 text-blue-300 hover:text-blue-200 transition-colors border border-white/5 ml-0.5"
            title={`Switch to °${unit === 'C' ? 'F' : 'C'}`}
          >
            °{unit === 'C' ? 'F' : 'C'}
          </button>
        </div>
      ) : loading ? (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 animate-pulse">
          <RotateCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
          <span>Fetching weather...</span>
        </div>
      ) : (
        <button
          onClick={() => {
            setIsModalOpen(true);
            setIsSearchingCity(true);
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300"
        >
          <CloudSun className="w-4 h-4 text-gray-400" />
          <span>Add Weather</span>
        </button>
      )}

      {/* DETAILED FORECAST MODAL */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-xl bg-gradient-to-b from-gray-900/95 via-gray-900/95 to-gray-950/95 border border-white/15 rounded-3xl p-6 text-white shadow-2xl backdrop-blur-2xl max-h-[90vh] overflow-y-auto no-scrollbar space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <CurrentIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold truncate max-w-[200px] sm:max-w-[280px]">
                      {weather?.city || 'Weather Forecast'}
                    </h2>
                    <button
                      onClick={() => setIsSearchingCity(!isSearchingCity)}
                      className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                      title="Search other location"
                    >
                      <Search className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 flex items-center gap-1.5">
                    <span>Forecast & Conditions</span>
                    {weather && (
                      <>
                        <span>•</span>
                        <span>Updated {new Date(weather.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Unit Switcher Tabs */}
                <div className="flex items-center p-0.5 bg-black/40 border border-white/10 rounded-lg text-xs font-semibold">
                  <button
                    onClick={() => {
                      setUnit('C');
                      localStorage.setItem('weather_unit', 'C');
                    }}
                    className={`px-2 py-1 rounded-md transition-all ${unit === 'C' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                  >
                    °C
                  </button>
                  <button
                    onClick={() => {
                      setUnit('F');
                      localStorage.setItem('weather_unit', 'F');
                    }}
                    className={`px-2 py-1 rounded-md transition-all ${unit === 'F' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                  >
                    °F
                  </button>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* City Search Bar & Suggestions */}
            {(isSearchingCity || !weather) && (
              <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between text-xs text-gray-300">
                  <span className="font-medium">Change Location</span>
                  <button
                    onClick={requestCurrentLocation}
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Detect My GPS</span>
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search city (e.g. London, Istanbul, Tokyo)..."
                    className="w-full bg-black/40 border border-white/15 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                    autoFocus
                  />
                  {isGeocodingLoading && (
                    <RotateCw className="w-4 h-4 text-blue-400 animate-spin absolute right-3 top-3" />
                  )}
                </div>

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                  <div className="space-y-1 bg-black/60 rounded-xl border border-white/10 p-1.5 max-h-48 overflow-y-auto">
                    {searchResults.map((res) => (
                      <button
                        key={res.id}
                        onClick={() => selectCity(res)}
                        className="w-full flex items-center justify-between px-3 py-2 text-left text-xs rounded-lg hover:bg-blue-600/30 transition-colors text-gray-200 hover:text-white"
                      >
                        <span className="font-semibold">{res.name}</span>
                        <span className="text-[11px] text-gray-400">
                          {[res.admin1, res.country].filter(Boolean).join(', ')}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Quick City Presets */}
                <div className="pt-2">
                  <p className="text-[11px] text-gray-400 mb-2 font-medium">Popular Cities:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {quickCities.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => fetchWeather(c.lat, c.lon, `${c.name}, ${c.country}`)}
                        className="px-2.5 py-1 text-xs bg-white/5 hover:bg-white/15 rounded-lg border border-white/5 text-gray-300 hover:text-white transition-colors"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-300 text-xs rounded-xl flex items-center justify-between">
                <span>{error}</span>
                <button
                  onClick={() => setIsSearchingCity(true)}
                  className="underline hover:text-white ml-2"
                >
                  Search city manually
                </button>
              </div>
            )}

            {/* Weather Content if available */}
            {weather ? (
              <div className="space-y-6">
                {/* Hero Current Weather Card */}
                <div className={`p-6 rounded-3xl bg-gradient-to-br ${currentInfo.bgGradient} border border-white/10 relative overflow-hidden shadow-lg`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-black tracking-tighter">
                          {convertTemp(weather.current.temp, unit)}°
                        </span>
                        <span className="text-2xl font-bold text-gray-300">
                          {unit}
                        </span>
                      </div>
                      <p className="text-lg font-semibold text-white mt-1">
                        {currentInfo.label}
                      </p>
                      <p className="text-xs text-gray-300">
                        Feels like {convertTemp(weather.current.apparentTemp, unit)}°{unit}
                        {weather.daily.maxTemps[0] !== undefined && (
                          <span className="ml-2 text-gray-400">
                            • H: {convertTemp(weather.daily.maxTemps[0], unit)}° L: {convertTemp(weather.daily.minTemps[0], unit)}°
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex flex-col items-center sm:items-end">
                      <CurrentIcon className={`w-20 h-20 ${currentInfo.color} drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)]`} />
                    </div>
                  </div>

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10 text-xs">
                    <div className="flex items-center gap-2.5 bg-black/20 p-2.5 rounded-xl border border-white/5">
                      <Droplets className="w-4 h-4 text-blue-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-400">Humidity</p>
                        <p className="font-bold">{weather.current.humidity}%</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 bg-black/20 p-2.5 rounded-xl border border-white/5">
                      <Wind className="w-4 h-4 text-teal-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-400">Wind</p>
                        <p className="font-bold">{Math.round(weather.current.windSpeed)} km/h</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 bg-black/20 p-2.5 rounded-xl border border-white/5">
                      <Umbrella className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-400">Rain Chance</p>
                        <p className="font-bold">
                          {weather.daily.precipitationProbMax[0] ?? 0}%
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 bg-black/20 p-2.5 rounded-xl border border-white/5">
                      <SunMedium className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-400">UV Index</p>
                        <p className="font-bold">
                          {weather.daily.uvIndexMax[0] !== undefined ? weather.daily.uvIndexMax[0].toFixed(1) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hourly Forecast Carousel */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                    <span>24-Hour Forecast</span>
                    <span className="text-[10px] lowercase text-gray-500">Hourly trend</span>
                  </h3>
                  <div className="flex gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar -mx-2 px-2">
                    {weather.hourly.times.map((timeStr, idx) => {
                      const hourDate = new Date(timeStr);
                      const isNow = idx === 0;
                      const hourLabel = isNow ? 'Now' : hourDate.toLocaleTimeString([], { hour: 'numeric' });
                      const hourCode = weather.hourly.weatherCodes[idx];
                      const hourTemp = weather.hourly.temperatures[idx];
                      const hourPop = weather.hourly.precipitationProbs[idx];
                      const hourHour = hourDate.getHours();
                      const isHourDay = hourHour >= 6 && hourHour < 20 ? 1 : 0;
                      const hourInfo = getWeatherInfo(hourCode, isHourDay);
                      const HourIcon = hourInfo.icon;

                      return (
                        <div
                          key={timeStr}
                          className={`flex flex-col items-center justify-between p-3 rounded-2xl min-w-[72px] shrink-0 border transition-all ${
                            isNow
                              ? 'bg-blue-600/20 border-blue-500/40'
                              : 'bg-white/5 border-white/5 hover:border-white/15'
                          }`}
                        >
                          <span className="text-[11px] font-medium text-gray-400">{hourLabel}</span>
                          <HourIcon className={`w-5 h-5 my-2 ${hourInfo.color}`} />
                          <span className="text-xs font-bold text-white">
                            {convertTemp(hourTemp, unit)}°
                          </span>
                          {hourPop !== undefined && hourPop > 0 ? (
                            <span className="text-[10px] text-cyan-400 font-medium mt-1">
                              {hourPop}%
                            </span>
                          ) : (
                            <span className="text-[10px] text-transparent mt-1">-</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 5-Day Daily Forecast */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    5-Day Forecast
                  </h3>
                  <div className="bg-white/5 rounded-2xl border border-white/5 divide-y divide-white/5 overflow-hidden">
                    {weather.daily.dates.slice(0, 5).map((dateStr, idx) => {
                      const d = new Date(dateStr + 'T00:00:00');
                      const dayName = idx === 0 
                        ? 'Today' 
                        : idx === 1 
                        ? 'Tomorrow' 
                        : d.toLocaleDateString([], { weekday: 'short' });
                      const dayCode = weather.daily.weatherCodes[idx];
                      const dayInfo = getWeatherInfo(dayCode, 1);
                      const DayIcon = dayInfo.icon;
                      const max = weather.daily.maxTemps[idx];
                      const min = weather.daily.minTemps[idx];
                      const rainChance = weather.daily.precipitationProbMax[idx];

                      return (
                        <div key={dateStr} className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors">
                          <div className="w-24">
                            <span className="text-xs font-bold text-white">{dayName}</span>
                            <p className="text-[10px] text-gray-400">{d.toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                          </div>

                          <div className="flex items-center gap-2 flex-1 justify-center">
                            <DayIcon className={`w-5 h-5 ${dayInfo.color}`} />
                            <span className="text-xs text-gray-300 hidden sm:inline max-w-[110px] truncate">
                              {dayInfo.label}
                            </span>
                          </div>

                          {rainChance > 20 && (
                            <div className="w-12 text-right">
                              <span className="text-[10px] text-cyan-400 font-medium">
                                ☂ {rainChance}%
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 justify-end min-w-[90px]">
                            <span className="text-xs text-gray-400">
                              {convertTemp(min, unit)}°
                            </span>
                            <div className="w-16 h-1.5 bg-black/40 rounded-full overflow-hidden relative">
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-amber-400 rounded-full opacity-70" />
                            </div>
                            <span className="text-xs font-bold text-white">
                              {convertTemp(max, unit)}°
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                  <button
                    onClick={() => fetchWeather(weather.latitude, weather.longitude, weather.city)}
                    disabled={loading}
                    className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
                    <span>Refresh data</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsSearchingCity(true)}
                      className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                      Change City
                    </button>
                    <span className="text-gray-600">•</span>
                    <button
                      onClick={requestCurrentLocation}
                      className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                    >
                      <MapPin className="w-3 h-3" />
                      <span>My Location</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center space-y-4">
                <CloudSun className="w-16 h-16 text-blue-400/50 mx-auto animate-pulse" />
                <div>
                  <h3 className="text-base font-bold text-white">No Weather Data</h3>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                    Please allow location access or search for your city above to view live conditions and 5-day forecasts.
                  </p>
                </div>
                <button
                  onClick={requestCurrentLocation}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all inline-flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Allow GPS Location</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default WeatherWidget;
