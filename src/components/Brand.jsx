import React from 'react';

export default function Brand({ className }) {
  return (
    <div className={`flex items-center ${className || ''}`}>
      <div className="select-none text-2xl font-black tracking-[0.3em] sm:text-3xl">
        <span className="text-slate-900 dark:text-white">Ascend</span>
        <span className="ml-0.5 text-orange-500">ex</span>
      </div>
    </div>
  );
}
