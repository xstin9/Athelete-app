import React from "react";

export default function AthleteHeroIllustration({ className = "" }) {
  return (
    <div className={`relative w-full ${className}`}>
      <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-orange-500/15 via-white/20 to-slate-900/10 dark:from-orange-500/20 dark:via-slate-950/20 dark:to-slate-900/40" />
      <svg viewBox="0 0 640 520" className="relative h-auto w-full" role="img" aria-label="Athlete performance illustration">
        <rect x="40" y="60" width="560" height="400" rx="36" fill="rgba(255,255,255,0.85)" stroke="currentColor" strokeOpacity="0.12" className="text-slate-300 dark:text-slate-700" />
        <path d="M115 390C180 305 240 262 320 260C398 258 470 306 525 390" fill="none" stroke="#f97316" strokeWidth="10" strokeLinecap="round" opacity="0.95" />
        <path d="M125 330C165 250 220 210 285 210" fill="none" stroke="currentColor" strokeOpacity="0.7" strokeWidth="4" strokeLinecap="round" className="text-slate-500 dark:text-slate-400" />
        <path d="M370 210C430 210 485 245 515 310" fill="none" stroke="currentColor" strokeOpacity="0.7" strokeWidth="4" strokeLinecap="round" className="text-slate-500 dark:text-slate-400" />
        <circle cx="320" cy="180" r="70" fill="#f97316" fillOpacity="0.16" stroke="#f97316" strokeWidth="6" />
        <path d="M290 167C281 142 296 114 324 112C348 111 364 130 360 151C352 186 301 191 290 167Z" fill="#0f172a" className="dark:fill-slate-100" />
        <path d="M280 188L220 260L255 272L305 228L323 236L345 268L382 260L338 188L304 180Z" fill="#f97316" />
        <path d="M248 255L230 322H276L292 289L286 255Z" fill="#0f172a" className="dark:fill-slate-100" />
        <path d="M319 254L350 323H392L372 254Z" fill="#0f172a" className="dark:fill-slate-100" />
        <path d="M186 332H464" stroke="#f97316" strokeWidth="7" strokeLinecap="round" />
        <rect x="156" y="114" width="120" height="52" rx="10" fill="rgba(15,23,42,0.08)" className="dark:fill-slate-800/60" />
        <path d="M178 140H245" stroke="currentColor" strokeOpacity="0.85" strokeWidth="6" strokeLinecap="round" className="text-slate-600 dark:text-slate-300" />
        <path d="M178 154H232" stroke="#f97316" strokeWidth="6" strokeLinecap="round" />
        <rect x="364" y="104" width="92" height="72" rx="16" fill="rgba(249,115,22,0.14)" stroke="#f97316" strokeWidth="3" />
        <circle cx="410" cy="140" r="20" fill="none" stroke="#f97316" strokeWidth="4" />
        <path d="M410 123V157" stroke="#f97316" strokeWidth="4" strokeLinecap="round" />
        <path d="M393 140H427" stroke="#f97316" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </div>
  );
}
