import test from 'node:test';
import assert from 'node:assert/strict';
import { predictRaceTime } from './predictRaceTime.js';

test('returns no prediction when fewer than 3 results exist for the selected event', () => {
  const result = predictRaceTime(
    [
      { date: '2026-02-02', event: '100m', time: 12.1 },
      { date: '2026-02-18', event: '100m', time: 11.9 },
    ],
    { event: '100m', raceDate: '2026-03-30', stage: 'base' },
    []
  );

  assert.equal(result.hasPrediction, false);
  assert.equal(result.predictedTime, null);
  assert.equal(result.message, 'Log 3 times to unlock a prediction');
});

test('produces a prediction with a sensible range and confidence for recent consistent results', () => {
  const result = predictRaceTime(
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

  assert.equal(result.hasPrediction, true);
  assert.ok(result.predictedTime > 0);
  assert.ok(result.likelyRange && typeof result.likelyRange.low === 'number');
  assert.ok(result.likelyRange && typeof result.likelyRange.high === 'number');
  assert.ok(result.likelyRange.low < result.predictedTime);
  assert.ok(result.likelyRange.high > result.predictedTime);
  assert.ok(['low', 'medium', 'high'].includes(result.confidence));
});

test('flags when the projection is faster than the athlete PB', () => {
  const result = predictRaceTime(
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

  assert.equal(result.hasPrediction, true);
  assert.ok(result.predictedTime >= 11.7);
  assert.match(String(result.warning || ''), /PB|personal best/i);
});
