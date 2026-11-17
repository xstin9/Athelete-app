import assert from 'node:assert/strict';
import { predictRaceTime } from './src/utils/predictRaceTime.js';

const noPrediction = predictRaceTime(
  [
    { date: '2026-02-02', event: '100m', time: 12.1 },
    { date: '2026-02-18', event: '100m', time: 11.9 },
  ],
  { event: '100m', raceDate: '2026-03-30', stage: 'base' },
  []
);
assert.equal(noPrediction.hasPrediction, false);
assert.equal(noPrediction.message, 'Log 3 times to unlock a prediction');

const forecast = predictRaceTime(
  [
    { date: '2026-01-05', event: '100m', time: 12.8 },
    { date: '2026-01-20', event: '100m', time: 12.6 },
    { date: '2026-02-03', event: '100m', time: 12.4 },
    { date: '2026-02-17', event: '100m', time: 12.3 },
    { date: '2026-03-01', event: '100m', time: 12.2 },
  ],
  { event: '100m', raceDate: '2026-03-30', stage: 'peak' },
  []
);
assert.equal(forecast.hasPrediction, true);
assert.ok(forecast.predictedTime > 0);
assert.ok(forecast.likelyRange.low < forecast.predictedTime);
assert.ok(forecast.likelyRange.high > forecast.predictedTime);
assert.ok(['low', 'medium', 'high'].includes(forecast.confidence));

const pb = predictRaceTime(
  [
    { date: '2026-01-05', event: '100m', time: 12.2 },
    { date: '2026-01-27', event: '100m', time: 12.0 },
    { date: '2026-02-14', event: '100m', time: 11.9 },
    { date: '2026-02-28', event: '100m', time: 11.75 },
    { date: '2026-03-10', event: '100m', time: 11.7 },
  ],
  { event: '100m', raceDate: '2026-04-01', stage: 'taper', goalTime: '11.65' },
  []
);
assert.equal(pb.hasPrediction, true);
assert.match(String(pb.warning || ''), /PB|personal best/i);

console.log('prediction checks ok');
