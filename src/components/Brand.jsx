import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Brand({ className }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate('/dashboard')}
      className={`flex items-center transition hover:opacity-80 active:scale-95 ${className || ''}`}
      style={{ cursor: 'pointer' }}
      aria-label="Go to dashboard"
    >
      <div className="select-none text-2xl font-black tracking-[0.3em] sm:text-3xl">
        <span className="text-slate-900 dark:text-white">Ascend</span>
        <span className="ml-0.5 text-orange-500">ex</span>
      </div>
    </button>
  );
}
