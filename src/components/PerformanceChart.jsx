import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { FaArrowUp } from "react-icons/fa";

function PerformanceChart({ sessions = [] }) {
  const data = useMemo(() => {
    if (!sessions || sessions.length === 0) {
      // Placeholder 3-year progress from 13.56 down to 10.84
      return [
        { date: new Date("2020-01-01"), value: 13.56 },
        { date: new Date("2021-06-01"), value: 12.20 },
        { date: new Date("2022-12-01"), value: 10.84 },
      ];
    }

    return sessions
      .map((s) => ({ date: new Date(s.date), value: Number(s.value) }))
      .sort((a, b) => a.date - b.date);
  }, [sessions]);

  const width = 700;
  const height = 320;
  const padding = 50;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max === min ? 1 : max - min;

  const points = data.map((d, i) => {
    const x = padding + (i / Math.max(1, data.length - 1)) * (width - padding * 2);
    const y = padding + (1 - (d.value - min) / range) * (height - padding * 2);
    return { x, y, v: d.value, date: d.date };
  });

  // Generate smooth curve path using quadratic bezier curves
  const generateSmoothPath = (points) => {
    if (points.length === 0) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];

      if (!next) {
        path += ` L ${curr.x} ${curr.y}`;
      } else {
        const mid1x = (prev.x + curr.x) / 2;
        const mid1y = (prev.y + curr.y) / 2;
        const mid2x = (curr.x + next.x) / 2;
        const mid2y = (curr.y + next.y) / 2;

        path += ` Q ${curr.x} ${curr.y} ${mid2x} ${mid2y}`;
      }
    }

    return path;
  };

  const pathD = generateSmoothPath(points);
  const firstVal = values[0]?.toFixed(2);
  const lastVal = values[values.length - 1]?.toFixed(2);
  const improvement = (firstVal - lastVal).toFixed(2);
  const improvementPercent = ((improvement / firstVal) * 100).toFixed(1);

  // Generate Y-axis labels
  const yLabels = [];
  const labelCount = 5;
  for (let i = 0; i < labelCount; i++) {
    const val = max - (i / (labelCount - 1)) * (max - min);
    yLabels.push({ value: val.toFixed(2), y: padding + (i / (labelCount - 1)) * (height - padding * 2) });
  }

  // Generate X-axis labels (every other point or based on data length)
  const xLabels = [];
  const xLabelInterval = Math.max(1, Math.floor(points.length / 4));
  for (let i = 0; i < points.length; i += xLabelInterval) {
    xLabels.push({
      label: points[i].date.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      x: points[i].x,
    });
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FaArrowUp className="text-orange-500 text-xl" />
          <div className="text-lg font-bold text-gray-900 dark:text-white">Performance Progress</div>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {improvement > 0 ? (
            <span className="text-green-600 dark:text-green-400 font-semibold">
              ↓ {improvement}s improved ({improvementPercent}%)
            </span>
          ) : (
            <span className="text-gray-500">{firstVal} → {lastVal}</span>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-full" style={{ minHeight: "400px" }}>
          <defs>
            <linearGradient id="grad-performance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Y-Axis */}
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="currentColor" className="text-gray-400 dark:text-gray-600" strokeWidth="2" />

          {/* X-Axis */}
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" className="text-gray-400 dark:text-gray-600" strokeWidth="2" />

          {/* Y-Axis Labels */}
          {yLabels.map((label, i) => (
            <g key={`y-${i}`}>
              <line x1={padding - 6} y1={label.y} x2={padding} y2={label.y} stroke="currentColor" className="text-gray-300 dark:text-gray-700" strokeWidth="1" />
              <text x={padding - 35} y={label.y + 4} fontSize="12" fill="currentColor" className="text-gray-600 dark:text-gray-400 text-right">
                {label.value}
              </text>
            </g>
          ))}

          {/* X-Axis Labels */}
          {xLabels.map((label, i) => (
            <g key={`x-${i}`}>
              <line x1={label.x} y1={height - padding} x2={label.x} y2={height - padding + 6} stroke="currentColor" className="text-gray-300 dark:text-gray-700" strokeWidth="1" />
              <text x={label.x} y={height - padding + 20} fontSize="12" fill="currentColor" className="text-gray-600 dark:text-gray-400" textAnchor="middle">
                {label.label}
              </text>
            </g>
          ))}

          {/* Grid lines (optional) */}
          {yLabels.map((label, i) => (
            i > 0 && (
              <line
                key={`grid-${i}`}
                x1={padding}
                y1={label.y}
                x2={width - padding}
                y2={label.y}
                stroke="currentColor"
                className="text-gray-100 dark:text-gray-800"
                strokeWidth="1"
                strokeDasharray="5,5"
              />
            )
          ))}

          {/* Area fill under curve */}
          <motion.path
            d={`${pathD} L ${points[points.length - 1]?.x} ${height - padding} L ${padding} ${height - padding} Z`}
            fill="url(#grad-performance)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            key={`area-${JSON.stringify(values)}`}
          />

          {/* Curved line */}
          <motion.path
            d={pathD}
            fill="none"
            stroke="#f97316"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2 }}
            className="drop-shadow"
            key={`line-${JSON.stringify(values)}`}
          />

          {/* Data points */}
          {points.map((p, i) => (
            <g key={`point-${i}`}>
              <motion.circle
                cx={p.x}
                cy={p.y}
                r={4}
                fill="white"
                stroke="#f97316"
                strokeWidth="2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              />
              <motion.circle
                cx={p.x}
                cy={p.y}
                r={6}
                fill="none"
                stroke="#f97316"
                strokeWidth="1"
                opacity="0.3"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              />
            </g>
          ))}

          {/* Y-Axis Label */}
          <text x="15" y="25" fontSize="12" fill="currentColor" className="text-gray-600 dark:text-gray-400">
            Time (s)
          </text>

          {/* X-Axis Label */}
          <text x={width - 60} y={height - 10} fontSize="12" fill="currentColor" className="text-gray-600 dark:text-gray-400">
            Timeline
          </text>
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400">Start</div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">{firstVal}s</div>
        </div>
        <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg border border-orange-200 dark:border-orange-700">
          <div className="text-xs text-orange-600 dark:text-orange-400 font-semibold">Improvement</div>
          <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
            {improvement > 0 ? `↓${improvement}s` : "→"}
          </div>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400">Current</div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">{lastVal}s</div>
        </div>
      </div>
    </div>
  );
}

export default PerformanceChart;
