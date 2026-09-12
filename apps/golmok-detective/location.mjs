export const LOCATION_MAX_AGE_MS = 60_000;
export const LOCATION_MAX_ACCURACY_METERS = 100;

const LOCATION_MAX_FUTURE_MS = 5_000;
const METERS_PER_LATITUDE_DEGREE = 111_320;

function validCoordinates(latitude, longitude) {
  return Number.isFinite(latitude) && latitude >= -90 && latitude <= 90
    && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
}

function validMap(bounds, width, height) {
  return bounds !== null && typeof bounds === 'object'
    && validCoordinates(bounds.south, bounds.west)
    && validCoordinates(bounds.north, bounds.east)
    && bounds.west < bounds.east && bounds.south < bounds.north
    && Number.isFinite(width) && width > 0
    && Number.isFinite(height) && height > 0;
}

// Points beyond the map keep their projected coordinates instead of snapping to an edge.
export function projectPoint(latitude, longitude, bounds, width, height) {
  if (!validCoordinates(latitude, longitude) || !validMap(bounds, width, height)) return null;
  const x = (longitude - bounds.west) / (bounds.east - bounds.west) * width;
  const y = (bounds.north - latitude) / (bounds.north - bounds.south) * height;
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
}

export function assessLocation(position, bounds, width, height, now = Date.now()) {
  const { latitude, longitude, accuracy } = position?.coords ?? {};
  const timestamp = position?.timestamp;
  if (!validCoordinates(latitude, longitude) || !validMap(bounds, width, height)
      || !Number.isFinite(accuracy) || accuracy < 0
      || !Number.isFinite(timestamp) || timestamp < 0
      || !Number.isFinite(now) || now < 0) return { status: 'invalid' };

  const age = now - timestamp;
  if (!Number.isFinite(age)) return { status: 'invalid' };
  const measurement = { accuracy, timestamp };
  if (age > LOCATION_MAX_AGE_MS || age < -LOCATION_MAX_FUTURE_MS) {
    return { status: 'stale', ...measurement };
  }
  if (accuracy > LOCATION_MAX_ACCURACY_METERS) return { status: 'inaccurate', ...measurement };
  if (longitude < bounds.west || longitude > bounds.east
      || latitude < bounds.south || latitude > bounds.north) {
    return { status: 'outside', ...measurement };
  }

  const point = projectPoint(latitude, longitude, bounds, width, height);
  const midLatitude = (bounds.south + bounds.north) / 2;
  const metersPerLongitudeDegree = METERS_PER_LATITUDE_DEGREE * Math.cos(midLatitude * Math.PI / 180);
  const mapWidthMeters = (bounds.east - bounds.west) * metersPerLongitudeDegree;
  const mapHeightMeters = (bounds.north - bounds.south) * METERS_PER_LATITUDE_DEGREE;
  const radiusX = accuracy / mapWidthMeters * width;
  const radiusY = accuracy / mapHeightMeters * height;
  if (!point || !Number.isFinite(mapWidthMeters) || mapWidthMeters <= 0
      || !Number.isFinite(mapHeightMeters) || mapHeightMeters <= 0
      || !Number.isFinite(radiusX) || !Number.isFinite(radiusY)) return { status: 'invalid' };
  return { status: 'ready', ...point, radiusX, radiusY, ...measurement };
}
