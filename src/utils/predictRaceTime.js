const LOWER_IS_BETTER_EVENTS = new Set([
  '100m',
  '200m',
  '300m',
  '400m',
  '800m',
  '1500m',
  'mile',
  '5k',
  '10k',
  'half-marathon',
  'marathon',
  'sprint',
  'middle-distance',
  'distance',
]);

const HIGHER_IS_BETTER_EVENTS = new Set(['longjump', 'highjump', 'triplejump', 'jump', 'throw']);

function normaliseEvent(value) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, '');
}

function parseNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.-]/g, '');
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function buildNoPrediction() {
  return {
    hasPrediction: false,
    predictedTime: null,
    likelyRange: null,
    confidence: null,
    message: 'Log 3 times to unlock a prediction',
    warning: null,
    explanation: {
      trend: 'Trend: not enough data yet.',
      stage: 'Stage: keep logging times to build a forecast.',
      watch: 'Watch: no injury signal loaded yet.',
    },
  };
}

function determineMetricDirection(eventValue) {
  const key = normaliseEvent(eventValue);
  if (HIGHER_IS_BETTER_EVENTS.has(key)) return 'higher';
  if (LOWER_IS_BETTER_EVENTS.has(key)) return 'lower';
  return 'lower';
}

function getStageAdjustment(stage) {
  const stageKey = String(stage ?? 'base').toLowerCase();
  const adjustments = {
    base: 0.03,
    build: 0.022,
    peak: 0.012,
    taper: 0.008,
    'off-season': 0,
  };
  return adjustments[stageKey] ?? 0.015;
}

function getInjuryPenalty(checkins = []) {
  const signals = Array.isArray(checkins) ? checkins : [];
  if (!signals.length) return 0;

  const highLoad = signals.some((item) => {
    const load = parseNumber(item.load ?? item.trainingLoad ?? item.volume ?? item.rpe);
    const pain = parseNumber(item.pain ?? item.painLevel ?? item.pain_score ?? item.severity);
    return (load != null && load >= 85) || (pain != null && pain >= 4);
  });

  if (highLoad) return 0.06;

  const moderatePain = signals.some((item) => {
    const pain = parseNumber(item.pain ?? item.painLevel ?? item.pain_score ?? item.severity);
    return pain != null && pain >= 3;
  });

  return moderatePain ? 0.025 : 0;
}

function getWeightedTrend(values) {
  const weights = values.map((point, idx) => {
    const ageDays = Math.max(1, (values[values.length - 1].x - point.x) / 86400000 + 1);
    const recencyBoost = 1 + (values.length - idx) / (values.length + 1);
    return { ...point, weight: Math.max(0.25, (recencyBoost / (1 + ageDays / 14))) };
  });

  const totalWeight = weights.reduce((sum, point) => sum + point.weight, 0);
  const xMean = weights.reduce((sum, point) => sum + point.x * point.weight, 0) / totalWeight;
  const yMean = weights.reduce((sum, point) => sum + point.y * point.weight, 0) / totalWeight;

  let numerator = 0;
  let denominator = 0;

  weights.forEach((point) => {
    const dx = point.x - xMean;
    const dy = point.y - yMean;
    numerator += point.weight * dx * dy;
    denominator += point.weight * dx * dx;
  });

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = yMean - slope * xMean;

  return { slope, intercept, weights };
}

function getConsistencyScore(values) {
  if (values.length < 2) return 0.2;

  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;
  const stdev = Math.sqrt(variance);
  const normalized = 1 - Math.min(1, stdev / Math.max(0.3, avg * 0.12));
  return Math.max(0.1, normalized);
}

function formatRange(value, spread) {
  const low = Math.max(0, value - spread / 2);
  const high = value + spread / 2;
  return { low, high };
}

export function predictRaceTime(results, race, checkins = []) {
  if (!race || !race.event) return buildNoPrediction();

  const selectedEvent = String(race.event).trim();
  const relevantResults = (Array.isArray(results) ? results : []).filter((result) => {
    const candidates = [result.event, result.eventId, result.name, result.label].filter(Boolean);
    return candidates.some((candidate) => normaliseEvent(candidate) === normaliseEvent(selectedEvent));
  });

  const validResults = relevantResults
    .map((result) => {
      const value = parseNumber(result.time ?? result.value ?? result.metric ?? result.result);
      const dateValue = result.date ?? result.day ?? result.timestamp ?? result.raceDate;
      if (value == null || !dateValue) return null;
      return {
        value,
        date: new Date(dateValue),
        pain: parseNumber(result.pain ?? result.painLevel ?? result.pain_score ?? result.severity),
        load: parseNumber(result.load ?? result.trainingLoad ?? result.volume ?? result.rpe),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.date - b.date);

  if (validResults.length < 3) return buildNoPrediction();

  const direction = determineMetricDirection(selectedEvent);
  const lowerIsBetter = direction === 'lower';
  const firstDate = validResults[0].date;
  const latestDate = validResults[validResults.length - 1].date;
  const raceDate = new Date(`${race.raceDate}T00:00:00`);

  if (!race.raceDate || Number.isNaN(raceDate.getTime())) {
    return buildNoPrediction();
  }

  const points = validResults.map((result) => ({
    x: new Date(result.date).getTime(),
    y: result.value,
  }));

  const scene = getWeightedTrend(
    points.map((point) => ({
      x: point.x,
      y: point.y,
    }))
  );

  const daysAhead = Math.max(0, (raceDate - latestDate) / 86400000);
  const lastPointDays = (latestDate - firstDate) / 86400000;
  const racePointDays = (raceDate - firstDate) / 86400000;
  const saturationFactor = 1 - Math.exp(-(daysAhead + 7) / 42);
  const trendProjection = scene.slope * Math.max(0, racePointDays - lastPointDays) * saturationFactor;
  const projected = latestDate.getTime() === raceDate.getTime()
    ? validResults[validResults.length - 1].value
    : validResults[validResults.length - 1].value + trendProjection;

  const stageBoost = getStageAdjustment(race.stage);
  const stageAdjusted = lowerIsBetter
    ? projected * (1 - stageBoost)
    : projected * (1 + stageBoost);

  const injuryPenalty = getInjuryPenalty(checkins);
  const rangeSpreadBase = Math.max(0.12, Math.abs(stageAdjusted * 0.065), Math.abs((validResults[validResults.length - 1].value - validResults[0].value) * 0.55));
  const rangeSpread = rangeSpreadBase + injuryPenalty * stageAdjusted;

  const currentPb = lowerIsBetter
    ? Math.min(...validResults.map((result) => result.value))
    : Math.max(...validResults.map((result) => result.value));

  const predictedTime = Number(stageAdjusted.toFixed(3));
  const baseRange = formatRange(predictedTime, rangeSpread * 2);
  const likelyRange = {
    low: Number(Math.min(baseRange.low, predictedTime).toFixed(3)),
    high: Number(Math.max(baseRange.high, predictedTime).toFixed(3)),
  };

  const recentDays = Math.max(1, (new Date() - latestDate) / 86400000);
  const countScore = Math.min(1, (validResults.length - 2) / 10);
  const recencyScore = Math.max(0.15, 1 - recentDays / 120);
  const consistencyScore = getConsistencyScore(validResults.map((result) => result.value));
  const confidenceScore = Math.max(0.1, Math.min(1, countScore * 0.45 + recencyScore * 0.3 + consistencyScore * 0.25));

  const confidence = confidenceScore >= 0.72 ? 'high' : confidenceScore >= 0.45 ? 'medium' : 'low';
  const pbWarning = lowerIsBetter && predictedTime < currentPb
    ? `Projection is faster than the current PB of ${currentPb.toFixed(2)}s, so this is a forecast rather than a guarantee.`
    : lowerIsBetter && predictedTime > currentPb
      ? `Projection sits around ${predictedTime.toFixed(2)}s, which is slower than the current PB of ${currentPb.toFixed(2)}s.`
      : higherIsBetter && predictedTime > currentPb
        ? `Projection is above the current best of ${currentPb.toFixed(2)}m, so treat it as a forecast rather than a promise.`
        : null;

  const trendText = lowerIsBetter
    ? `Trend: ${Math.abs(scene.slope * 7).toFixed(2)}s per week improvement across the recent block.`
    : `Trend: ${Math.abs(scene.slope * 7).toFixed(2)}m per week improvement across the recent block.`;

  const stageText = `Stage: ${String(race.stage ?? 'base').toLowerCase()} gives ${((stageBoost || 0) * 100).toFixed(1)}% headroom.`;
  const watchText = injuryPenalty > 0
    ? `Watch: high load or pain signal widens the range by ${((injuryPenalty * stageAdjusted) || 0).toFixed(2)}s.`
    : 'Watch: recent pain/load is stable, so the range is tight.';

  return {
    hasPrediction: true,
    predictedTime,
    likelyRange,
    confidence,
    message: `Projected ${predictedTime.toFixed(2)}s with a likely range of ${likelyRange.low.toFixed(2)}s to ${likelyRange.high.toFixed(2)}s.`,
    warning: pbWarning,
    explanation: {
      trend: trendText,
      stage: stageText,
      watch: watchText,
    },
    pb: currentPb,
  };
}

export function buildRacePredictionNarrativeStats(prediction, race) {
  if (!prediction || !prediction.hasPrediction) {
    return {
      trend: 'Trend: no signal yet.',
      stage: `Stage: ${String(race?.stage ?? 'base').toLowerCase()} is in progress.`,
      watch: 'Watch: log a few more sessions to tighten the forecast.',
    };
  }

  return {
    trend: prediction.explanation?.trend ?? 'Trend: recent results are moving in a healthy direction.',
    stage: prediction.explanation?.stage ?? `Stage: ${String(race?.stage ?? 'base').toLowerCase()} is accounted for.`,
    watch: prediction.explanation?.watch ?? 'Watch: keep recovery stable and monitor pain.',
  };
}
