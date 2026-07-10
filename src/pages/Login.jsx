import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, provider } from "../firebase";
import { FaGoogle } from "react-icons/fa";
import Brand from "../components/Brand";
import AthleteHeroIllustration from "../components/AthleteHeroIllustration";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isCoach = searchParams.get("coach") === "true";

  async function handleLogin(e) {
    e.preventDefault();

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate(isCoach ? "/coach" : "/dashboard");
    } catch (err) {
      alert(err.message);
    }
  }

  async function loginWithGoogle() {
    try {
      await signInWithPopup(auth, provider);
      navigate(isCoach ? "/coach" : "/dashboard");
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative hidden items-center justify-center overflow-hidden bg-gradient-to-br from-orange-500/10 via-slate-50 to-slate-100 p-10 lg:flex dark:from-orange-500/15 dark:via-slate-950 dark:to-slate-900">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),transparent_38%)]" />
          <div className="relative w-full max-w-xl">
            <AthleteHeroIllustration className="max-w-[520px]" />
          </div>
        </div>

        <div className="flex items-center justify-center px-6 py-10 sm:px-8 lg:px-10">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-2xl shadow-slate-200/60 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/30">
            <div className="mb-6 lg:hidden">
              <AthleteHeroIllustration className="mx-auto max-w-[320px]" />
            </div>

            <Brand className="mb-6" />
            <h1 className="mb-2 text-3xl font-bold">{isCoach ? "Coach Login" : "Welcome Back"}</h1>
            <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">
              {isCoach ? "Log in to access coach tools and dashboards." : "Log in to continue building your athlete performance."}
            </p>

            <button
              type="button"
              onClick={loginWithGoogle}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              <FaGoogle /> Sign in with Google
            </button>

            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <input
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <input
                type="password"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button type="submit" className="rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-500">
                Log In
              </button>
            </form>

            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              New athlete?{" "}
              <span onClick={() => navigate("/register")} className="cursor-pointer font-semibold text-orange-600">
                Create an account
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
