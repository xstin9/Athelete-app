import React from 'react';

function Sparkline({ data = [], width = 300, height = 60, color = '#6366f1', strokeWidth = 2 }) {
  if (!data || data.length === 0) {
    return <div className="text-sm text-gray-500">No data for this event yet</div>;
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1 || 1);

  const points = data
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  const areaPath = `M0,${height} L${data
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ')} L${width},${height} Z`;

  return (
    <svg width={width} height={height} className="block">
      <path d={areaPath} fill={color} opacity="0.07" />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* mark last point */}
      <circle
        cx={(data.length - 1) * step}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r="3"
        fill={color}
      />
    </svg>
  );
}

export default Sparkline;
