import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assessLocation, projectPoint, LOCATION_MAX_AGE_MS, LOCATION_MAX_ACCURACY_METERS } from '../location.mjs';

const bounds = Object.freeze({ west: 126.615, south: 37.472, east: 126.627, north: 37.481 });
const width = 1000;
const height = 950;
const now = 1_789_200_000_000;
const centerLatitude = (bounds.south + bounds.north) / 2;
const centerLongitude = (bounds.west + bounds.east) / 2;
const fixture = (coords = {}, timestamp = now) => ({
  coords: { latitude: centerLatitude, longitude: centerLongitude, accuracy: 20, ...coords },
  timestamp,
});
const assess = (position = fixture(), mapBounds = bounds, mapWidth = width, mapHeight = height, currentTime = now) =>
  assessLocation(position, mapBounds, mapWidth, mapHeight, currentTime);
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} should be near ${expected}`);

test('map corners project north to the top and south to the bottom', () => {
  assert.deepEqual(projectPoint(bounds.north, bounds.west, bounds, width, height), { x: 0, y: 0 });
  assert.deepEqual(projectPoint(bounds.north, bounds.east, bounds, width, height), { x: width, y: 0 });
  assert.deepEqual(projectPoint(bounds.south, bounds.west, bounds, width, height), { x: 0, y: height });
  assert.deepEqual(projectPoint(bounds.south, bounds.east, bounds, width, height), { x: width, y: height });
});

test('the center projects to half of each map dimension', () => {
  const point = projectPoint(centerLatitude, centerLongitude, bounds, width, height);
  near(point.x, width / 2);
  near(point.y, height / 2);
});

test('points outside the map are not clamped to an edge', () => {
  assert.ok(projectPoint(bounds.north + 0.001, bounds.west - 0.001, bounds, width, height).x < 0);
  assert.ok(projectPoint(bounds.north + 0.001, bounds.west - 0.001, bounds, width, height).y < 0);
  assert.ok(projectPoint(bounds.south - 0.001, bounds.east + 0.001, bounds, width, height).x > width);
  assert.ok(projectPoint(bounds.south - 0.001, bounds.east + 0.001, bounds, width, height).y > height);
  for (const coords of [
    { latitude: bounds.south - 0.001 }, { latitude: bounds.north + 0.001 },
    { longitude: bounds.west - 0.001 }, { longitude: bounds.east + 0.001 },
  ]) {
    const result = assess(fixture(coords));
    assert.deepEqual(result, { status: 'outside', accuracy: 20, timestamp: now });
  }
});

test('a recent accurate point produces an ellipse in map pixels', () => {
  const result = assess();
  assert.equal(result.status, 'ready');
  near(result.x, width / 2);
  near(result.y, height / 2);
  const longitudeMeters = 111_320 * Math.cos(centerLatitude * Math.PI / 180);
  near(result.radiusX, 20 / ((bounds.east - bounds.west) * longitudeMeters) * width);
  near(result.radiusY, 20 / ((bounds.north - bounds.south) * 111_320) * height);
  assert.equal(result.accuracy, 20);
  assert.equal(result.timestamp, now);
});

test('exact map boundaries remain valid positions', () => {
  for (const latitude of [bounds.south, bounds.north]) {
    for (const longitude of [bounds.west, bounds.east]) {
      assert.equal(assess(fixture({ latitude, longitude })).status, 'ready');
    }
  }
});

test('100 meter accuracy is accepted, larger errors suppress the marker', () => {
  assert.equal(LOCATION_MAX_ACCURACY_METERS, 100);
  assert.equal(assess(fixture({ accuracy: 100 })).status, 'ready');
  assert.deepEqual(assess(fixture({ accuracy: 100.01 })), { status: 'inaccurate', accuracy: 100.01, timestamp: now });
  const precise = assess(fixture({ accuracy: 0 }));
  assert.equal(precise.status, 'ready');
  assert.equal(precise.radiusX, 0);
  assert.equal(precise.radiusY, 0);
});

test('positions older than one minute or too far in the future are stale', () => {
  assert.equal(LOCATION_MAX_AGE_MS, 60_000);
  assert.equal(assess(fixture({}, now - 60_000)).status, 'ready');
  assert.equal(assess(fixture({}, now - 60_001)).status, 'stale');
  assert.equal(assess(fixture({}, now + 5_000)).status, 'ready');
  assert.equal(assess(fixture({}, now + 5_001)).status, 'stale');
});

test('old or inaccurate measurements never become outside markers', () => {
  assert.equal(assess(fixture({ latitude: bounds.north + 1 }, now - 60_001)).status, 'stale');
  assert.equal(assess(fixture({ latitude: bounds.north + 1, accuracy: 101 })).status, 'inaccurate');
});

test('missing or nonnumeric coordinates and invalid WGS84 ranges are rejected', () => {
  for (const value of [undefined, null, NaN, Infinity, -Infinity, '37.47']) {
    assert.equal(assess(fixture({ latitude: value })).status, 'invalid');
    assert.equal(assess(fixture({ longitude: value })).status, 'invalid');
  }
  for (const coords of [{ latitude: -90.1 }, { latitude: 90.1 }, { longitude: -180.1 }, { longitude: 180.1 }]) {
    assert.equal(assess(fixture(coords)).status, 'invalid');
  }
  for (const position of [null, undefined, {}, { coords: null }, { coords: {} }]) {
    assert.deepEqual(assessLocation(position, bounds, width, height, now), { status: 'invalid' });
  }
  assert.equal(projectPoint(NaN, centerLongitude, bounds, width, height), null);
});

test('invalid accuracy and timestamps are rejected without returning coordinates', () => {
  for (const value of [undefined, null, NaN, Infinity, -1, '20']) {
    assert.deepEqual(assess(fixture({ accuracy: value })), { status: 'invalid' });
  }
  for (const value of [undefined, null, NaN, Infinity, -1, '1234']) {
    const position = fixture();
    position.timestamp = value;
    assert.deepEqual(assess(position), { status: 'invalid' });
    assert.deepEqual(assessLocation(fixture(), bounds, width, height, value === undefined ? NaN : value), { status: 'invalid' });
  }
});

test('bounds and image dimensions must describe a finite nonempty map', () => {
  for (const invalidBounds of [null, undefined, {},
    { ...bounds, west: bounds.east }, { ...bounds, west: bounds.east + 1 },
    { ...bounds, south: bounds.north }, { ...bounds, south: bounds.north + 1 },
    { ...bounds, north: 91 }, { ...bounds, west: -181 }, { ...bounds, east: NaN },
  ]) {
    assert.equal(projectPoint(centerLatitude, centerLongitude, invalidBounds, width, height), null);
    assert.deepEqual(assessLocation(fixture(), invalidBounds, width, height, now), { status: 'invalid' });
  }
  for (const dimension of [0, -1, NaN, Infinity, undefined, '1000']) {
    assert.equal(projectPoint(centerLatitude, centerLongitude, bounds, dimension, height), null);
    assert.equal(projectPoint(centerLatitude, centerLongitude, bounds, width, dimension), null);
    assert.deepEqual(assessLocation(fixture(), bounds, dimension, height, now), { status: 'invalid' });
    assert.deepEqual(assessLocation(fixture(), bounds, width, dimension, now), { status: 'invalid' });
  }
});

test('arithmetic overflow cannot produce an apparently valid position', () => {
  const tinyBounds = { west: 0, east: Number.MIN_VALUE, south: 0, north: Number.MIN_VALUE };
  assert.equal(projectPoint(1, 1, tinyBounds, width, height), null);
  assert.equal(assess(fixture({ latitude: 0, longitude: 0 }), tinyBounds).status, 'invalid');
});

test('assessment leaves input values untouched and returns independent results', () => {
  const position = Object.freeze({ coords: Object.freeze(fixture().coords), timestamp: now });
  const result = assess(position);
  const again = assess(position);
  assert.deepEqual(result, again);
  assert.notEqual(result, again);
  assert.deepEqual(position, fixture());
});
