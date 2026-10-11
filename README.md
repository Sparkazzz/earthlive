# EARTHLIVE

EARTHLIVE for Sparkazzz. Source repository: https://github.com/Sparkazzz/earthlive . Netlify deployment and public browser verification are pending.

## Implemented

- Vite + MapLibre GL JS 5 globe, touch navigation, global place search and lat/lon input.
- NASA GIBS historic Blue Marble and dated daily VIIRS imagery. Latest date and available date ranges fetched from real NASA WMTS metadata. Street cartography uses OpenFreeMap.
- Automatic official camera catalogues: TfL London and GeoNet New Zealand. No worldwide coverage claim; no invented cameras or LIVE badges.
- Camera markers, clustering, filters, distance sorting, image previews, official media links, TfL clip playback and server-side image availability checks.
- Real Open-Meteo current model conditions, timestamps, provenance and periodic refresh. Not station observations.
- Netlify Functions backend, provider caching, input validation and bounded network timeouts. No secrets.
- Responsive CSS for iPhone; actual Safari/browser QA pending.

## Verified

Five unit tests pass. Production Vite build passes. Integration calls for global geocoding, Open-Meteo and NASA metadata + actual tiles pass. Camera integration passes: 890 TfL + 11 GeoNet cameras retrieved, GeoNet image reachability verified with JPEG signature fallback for application/octet-stream. All four integration checks pass on 2026-10-11.

## Remaining acceptance gates

1. Repository created by owner and source uploaded through the GitHub connector.
3. Create NEW Netlify site under sparkazzz, connect main branch, npm run build, dist, functions as configured. .netlify is ignored.
4. Confirm public production URL, exercise globe/search/markers/weather/mobile layouts and actual browser errors.
5. Push another real correction or documentation commit and verify that Netlify automatically builds exactly that SHA.
6. Expand world camera catalogue via licensed Windy API or additional official open networks. Windy requires an API key; no key requested or obtained and no placeholder adapter is claimed as working. Do not ask for secrets in chat.
7. Higher-resolution legally licensed satellite data, station observations and geographic change comparison remain absent.

## Sources and limits

- https://openfreemap.org/quick_start/ — OSM / OpenMapTiles attribution displayed.
- https://nasa-gibs.github.io/gibs-api-docs/access-basics/ — time dimensions; current mosaics may be incomplete.
- https://www.geonet.org.nz/data/types/camera — dynamic feed and periodic camera imagery. The actual current feed stores latitude before longitude despite its GeoJSON label; adapter handles this explicitly.
- https://www.geonet.org.nz/policy — CC BY 3.0 NZ; DOI citation in UI.
- https://tfl.gov.uk/corporate/terms-and-conditions/transport-data-service — attribution in UI, feed caching.
- https://open-meteo.com/en/pricing — free service for noncommercial use, 10,000 daily calls; no uptime guarantee. Reevaluate before monetization.
- https://api.windy.com/webcams/pricing and /terms — free low-resolution images must link to Windy; not currently integrated.

Local development: npm ci, npm run dev. Validation: npm test, npm run build, npm run test:integration. These commands are maintainer notes, not work delegated to the user.
