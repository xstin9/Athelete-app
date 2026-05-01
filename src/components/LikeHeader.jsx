import { useState, useEffect } from "react";

function LikeHeader({ id = "about", title = "About", className = "" }) {
  const key = `likes:${id}`;
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      if (saved) {
        setLiked(Boolean(saved.liked));
        setCount(Number(saved.count) || 0);
      }
    } catch (e) {
      // ignore
    }
  }, [key]);

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify({ liked, count }));
  }, [key, liked, count]);

  useEffect(() => {
    let t;
    if (bump) {
      t = setTimeout(() => setBump(false), 300);
    }
    return () => clearTimeout(t);
  }, [bump]);

  function toggle(e) {
    e.preventDefault();
    setLiked((prev) => {
      const next = !prev;
      setCount((c) => Math.max(0, c + (next ? 1 : -1)));
      if (next) setBump(true);
      return next;
    });
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <h2 className="text-xl font-semibold">{title}</h2>

      <button
        onClick={toggle}
        aria-pressed={liked}
        aria-label={`${liked ? "Unlike" : "Like"} ${title}`}
        className="flex items-center space-x-2 text-sm px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <span
          className={`inline-block transform transition-transform duration-200 ${liked ? 'text-red-500' : 'text-gray-400'} ${bump ? 'scale-125' : ''}`}
          aria-hidden
        >
          {liked ? "❤️" : "🤍"}
        </span>
        <span className="text-gray-600" aria-live="polite">{count}</span>
      </button>
    </div>
  );
}

export default LikeHeader;
