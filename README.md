# node-weather-website

Run `npm ci`, set `MAPBOX_ACCESS_TOKEN` and `DARKSKY_API_KEY` in your
environment, then run `npm start`. Missing credentials return the existing
service connection error without making an outbound request.

Run `npm test` for transport, geocoding, forecast and `/weather` regression tests.
The tests use mocked provider responses and require no API credentials or external
service access. Route tests start a temporary server on the loopback interface.

Outbound API requests use Node's built-in HTTPS client with a ten-second total
deadline. The fixed API URLs must respond directly; redirects are treated as
service errors. Provider endpoints are unchanged. Credentials are read from the environment;
do not commit them to the repository.
