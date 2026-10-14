# Implementation Plan - Header Weather & Forecast Component

Implement a comprehensive Weather component in the launcher's header area featuring live local weather, multi-day forecasting, location permission request ("ask you") with manual city search fallback, and quick °C / °F temperature unit toggling.

---

## 1. User Preferences & Key Decisions
Based on the clarifying questions:
- **Location Method**: Ask user via browser geolocation (`navigator.geolocation.getCurrentPosition`) on first interaction / enable button, plus an interactive search dialog to search and pick any city worldwide.
- **Display Style**: Weather forecast display — a responsive weather widget badge in the header displaying current temperature, weather icon, description, and location; clicking it opens an expanded weather forecast view (hourly trends, 5-day forecast, high/low, humidity, wind, feels like).
- **Temperature Units**: Support both Celsius (°C) and Fahrenheit (°F) with an immediate one-click toggle and persistence in settings/localStorage.
- **Weather Data Source**: Open-Meteo Public API (free, reliable, no API key required, supports current conditions, hourly predictions, daily highs/lows, WMO weather interpretation codes, and geocoding).

---

## 2. Proposed Changes

### Component Architecture

#### `components/WeatherWidget.tsx` (New)
Create a new weather component that:
1. **Header Display**:
   - Compact glassmorphism pill in the header bar (responsive on both mobile and desktop).
   - Displays animated/styled weather condition icon (Sun, Clouds, Rain, Thunderstorm, Snow, Mist/Fog), current temperature in selected unit (°C or °F), brief condition label, and city name.
   - Shows a friendly "Enable Weather" / location prompt button if location access hasn't been granted yet.
   - Includes a quick unit toggle button (°C ⇄ °F) directly on or beside the badge.
2. **Forecast Modal / Popover**:
   - Opens on click to display:
     - Today's summary (current temp, feels like, min/max temp, precipitation chance, humidity, wind speed, UV index).
     - Hourly forecast strip with scrollable cards for the next 24 hours.
     - 5-Day daily forecast with high/low temperature bars, condition icons, and dates.
     - City search input with instant autocomplete using Open-Meteo Geocoding API (`https://geocoding-api.open-meteo.com/v1/search`), allowing the user to select another city or re-detect current location.
3. **Data Caching & Graceful Fallback**:
   - Caches weather data in `localStorage` for 15 minutes to minimize network requests.
   - Saves user's preferred location (lat, lon, city name) and unit preference (`celsius` | `fahrenheit`).
   - Graceful error states if offline or if location permission is denied.

#### `components/Header.tsx`
- Integrate `WeatherWidget` in both desktop and mobile header layouts:
  - On desktop: Positioned neatly in the header area beside the greeting / action buttons.
  - On mobile: Integrated cleanly in the header or sub-header row without crowding action buttons.

#### `i18n.ts` (Optional/Complementary)
- Add translations for common weather terms (Humidity, Wind, Forecast, Celsius, Fahrenheit, Search city, etc.) if applicable.

---

## 3. User Review Required

> [!NOTE]
> Please review the design choices:
> 1. Weather API: Using **Open-Meteo** (no API key required, open source friendly, privacy-focused, zero rate-limit hassles for client-side apps).
> 2. Location Request: The app will politely prompt for browser geolocation on click (or show a city prompt if denied), giving full control without sudden browser blocks.

---

## 4. Verification Plan

### Automated Tests / Code Checks
- Compile application using `compile_applet` to ensure TypeScript types and Vite build pass without errors.
- Run `lint_applet` to check for any lint warnings or unused imports.

### Manual Verification Steps
1. **Initial State**: Verify the weather widget appears in the header with an option to enable weather or detect location.
2. **Location Permission**: Trigger location detection and verify current weather coordinates are resolved to the user's city with accurate weather.
3. **City Search**: Test searching for a custom city (e.g., "Tokyo", "London", "New York") and verifying that current weather and forecast update immediately.
4. **Unit Toggle**: Click the °C / °F toggle and verify all temperatures (current, hourly, daily high/lows) convert accurately.
5. **Forecast View**: Click the weather widget to open the detailed forecast modal, check the 24-hour hourly trend and 5-day daily forecast cards.
6. **Persistence**: Refresh the launcher page and verify that selected city, coordinates, and unit preference persist.
