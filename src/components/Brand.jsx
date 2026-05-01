import React from 'react';

export default function Brand({className}){
  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <div className="text-2xl font-extrabold tracking-widest select-none">
        <span className="text-White:text-white">S</span>
        <span className="inline-block transform -translate-y-1 rotate-6 text-orange-500">A</span>
        <span className="text-White:text-white">C</span>
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400">(Self-Acqusition)</div>
    </div>
  );
}
