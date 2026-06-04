import { useNavigate } from "react-router-dom";
import Brand from "../components/Brand";
import { FaInstagram, FaYoutube, FaTwitter } from "react-icons/fa";
import { delay, motion } from "framer-motion";
import PerformanceChart from "../components/PerformanceChart";
import ThemeToggle from "../components/ThemeToggle";
import { playSound } from "../utils/soundEffects";
import athleteImage from "../assets/ciprian-pardau-j8fVoo3i8xk-unsplash.jpg";

function Intro({ sessions = [] }) {
  const navigate = useNavigate();
  
  const handleNavClick = (path, soundType = 'click') => {
    playSound[soundType]?.();
    navigate(path);
  };

  return (
    <motion.div
      className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* HEADER */}
      <header className="border-b border-gray-200 dark:border-white/10 backdrop-blur bg-white/80 dark:bg-black/80 sticky top-0 z-50 transition-colors duration-300">
        <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Brand />
            <div className="hidden md:flex gap-6 text-sm text-gray-600 dark:text-gray-400">
              <a href="#features" className="hover:text-black dark:hover:text-white transition">Features</a>
              <a href="#about" className="hover:text-black dark:hover:text-white transition">About</a>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            <button
              onClick={() => handleNavClick("/login")}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/20 text-sm hover:bg-gray-100 dark:hover:bg-white/10 transition text-black dark:text-white"
            >
              Login
            </button>
            <button
              onClick={() => handleNavClick("/register", "success")}
              className="px-5 py-2.5 rounded-lg bg-orange-600 text-white text-sm font-semibold hover:bg-orange-500 transition shadow"
            >
              Get Started
            </button>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <main>
        {/* HERO IMAGE - AT TOP */}
   {/* HERO IMAGE BACKDROP */}
<section className="relative w-full h-[90vh] mb-24 flex items-center">
  <img
    src={athleteImage}
    alt="Athlete training"
    className="absolute inset-0 w-full h-full object-cover"
  />
  {/* overlay */}
  <div className="absolute inset-0 bg-black/60" />

  {/* text on top of image */}
  <div className="relative z-10 px-10">
    <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-white">
      Track every session.
      <br />
      <span className="text-orange-400">See exactly why you're getting faster.</span>
    </h1>
    <div className="mt-10 flex flex-wrap gap-4">
      <button
        onClick={() => handleNavClick("/register", "success")}
        className="bg-orange-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-orange-500 transition shadow-lg"
      >
        Start Free
      </button>
      <button
        onClick={() => handleNavClick("/login")}
        className="border border-white/40 px-8 py-4 rounded-2xl text-lg hover:bg-white/10 transition text-white"
      >
        I already have an account
      </button>
    </div>
  </div>
</section>

<div className="max-w-6xl mx-auto px-6 py-12">
  {/* everything after the hero section */}
  </div>

<section className="grid md:grid-cols-2 gap-14 items-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="mt-6 text-gray-600 dark:text-gray-400 text-lg max-w-xl">
              Log sprint sessions, hurdle steps, volumes, and notes — then
              visualize progress over weeks and months. No guesswork. Just data.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <button
                onClick={() => handleNavClick("/register", "success")}
                className="bg-orange-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-orange-500 transition shadow-lg"
              >
                Start Free
              </button>

              <button
                onClick={() => handleNavClick("/login")}
                className="border border-gray-300 dark:border-white/20 px-8 py-4 rounded-2xl text-lg hover:bg-gray-100 dark:hover:bg-white/10 transition text-black dark:text-white"
              >
                I already have an account
              </button>
            </div>

            <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
              Built by competitive athletes • Designed for 100m–400m & hurdles
            </p>


            {/* FEATURES QUICK */}
            <div id="features" className="grid sm:grid-cols-3 gap-4 mt-14">
              <Value title="Sprint & Hurdle Logging">
                Record distances, reps, rest, hurdle steps, and session notes.
              </Value>
              <Value title="Progress Visualization">
                Clear charts show trends across weeks and months.
              </Value>
              <Value title="Season Consistency">
                Keep every session saved and build momentum all year.
              </Value>
            </div>
          </motion.div>
          
        </section>
      </main>
      <motion
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
        className="relative"
  >
    <div className="
      rounded-3xl
      border border-gray-200 dark:border-white/10
      bg-white dark:bg-black
      shadow-2xl
      p-6
    ">
      {/* subtle label */}
      <div className="mb-3 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Example performance trend
      </div>

      <PerformanceChart sessions={sessions} />
    </div>
    {/* decorative blurred background */}
      <div className="absolute -inset-4 -z-10 rounded-3xl bg-orange-500/10 blur-3xl" />
  </motion>
  <section></section>




      {/* HOW IT WORKS */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-center text-black dark:text-white">How it works</h2>

        <div className="grid md:grid-cols-3 gap-8 mt-14">
          <Step number="01" title="Log your training" text="Capture sprint work,  volume, and notes in seconds." />
          <Step number="02" title="Track trends" text="Automatically see what improves speed and consistency." />
          <Step number="03" title="Adjust with confidence" text="Train smarter knowing what actually works for you." />
          <Step number="04" title="Win with data" text="Make informed decisions that lead you to better  performance." />
        </div>
      </section>
     


      {/* ABOUT */}
      <section id="about" className="bg-gray-50 dark:bg-gray-900 py-24 px-6 transition-colors duration-300">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-xl font-semibold">Built by athletes</h2>
          <p className="text-gray-700 dark:text-gray-300 mt-6 text-lg">
            Most athletes train hard but never know what actually works.
            This platform replaces guessing with clarity  so every session moves you forward.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center bg-white dark:bg-black transition-colors duration-300">
        <h2 className="text-3xl md:text-4xl font-bold text-black dark:text-white">Stop guessing. Start tracking.</h2>
        <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">Train with intention and measure real progress.</p>
        <button
          onClick={() => handleNavClick("/register", "success")}
          className="mt-8 bg-orange-600 text-white px-10 py-4 rounded-2xl font-semibold text-lg hover:bg-orange-500 transition"
        >
          Create Free Account
        </button>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-500">© {new Date().getFullYear()} Built for athletes.</div>
          <div className="flex gap-5 text-gray-500 dark:text-gray-400 text-xl hover:text-black dark:hover:text-white">
            <a href="#" className="transition"><FaInstagram /></a>
            <a href="#" className="transition"><FaYoutube /></a>
            <a href="#" className="transition"><FaTwitter /></a>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}

function Value({ title, children }) {
  return (
    <div className="p-5 border border-gray-200 dark:border-white/10 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition text-black dark:text-white">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{children}</p>
    </div>
  );
}

function Step({ number, title, text }) {
  return (
    <div className="p-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-black dark:text-white">
      <div className="text-orange-500 font-bold text-sm">{number}</div>
      <h3 className="mt-2 font-semibold text-lg">{title}</h3>
      <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">{text}</p>
    </div>
  );
}

export default Intro;

