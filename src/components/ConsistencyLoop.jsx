import React from "react";
import { FaBullseye } from "react-icons/fa";

export default function ConsistencyLoop({ current, target }) {
  const percent = Math.min(100, Math.round((current / target) * 100));
  const radius = 40;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg height={radius * 2} width={radius * 2}>
        <circle
          stroke="var(--chart-grid)"
          fill="none"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="var(--accent)"
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: "stroke-dashoffset 0.5s" }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dy=".3em"
          fontSize="1.2em"
          fill="var(--accent)"
          fontWeight="bold"
        >
          {current}/{target}
        </text>
      </svg>
      <div className="flex items-center gap-1 mt-2 text-sm" style={{ color: "var(--color-text)" }}>
        <FaBullseye style={{ color: "var(--accent)" }} /> Consistency
      </div>
    </div>
  );
}
