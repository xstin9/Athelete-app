import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, provider } from "../firebase";
import { FaGoogle } from "react-icons/fa";
import Brand from "../components/Brand";
import sportImg from "../assets/sport part 2.jpg";
import Athleticspng from "../assets/asthetic.jpg";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isCoach = searchParams.get('coach') === 'true';

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
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-3 bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
      {/* LEFT IMAGE */}
      <div className="hidden md:block">
        <img
          src={sportImg}
          alt="Sport"
          className="h-full w-full object-cover"
        />
      </div>

      {/* CENTER */}
      <div className="flex flex-col justify-center px-8 max-w-md mx-auto">
        <Brand className="mb-6" />
        <h1 className="text-3xl font-bold mb-2">{isCoach ? 'Coach Login' : 'Welcome Back'}</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {isCoach ? 'Log in to access coach tools and dashboards.' : 'Log in to continue building your athlete performance.'}
        </p>  

        <button
          onClick={loginWithGoogle}
          className="flex items-center justify-center gap-2 border py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 mb-3"
        >
          <FaGoogle /> Sign in with Google
        </button>

        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <input
            className="border px-3 py-2 rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            className="border px-3 py-2 rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="bg-orange-600 text-white py-2 rounded-md">
            Log In
          </button>
        </form>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
          New athlete?{" "}
          <span
            onClick={() => navigate("/register")}
            className="text-orange-600 cursor-pointer"
          >
            Create an account
          </span>
        </p>
      </div>

      {/* RIGHT IMAGE */}
      <div className="hidden md:block">
        <img
          src={Athleticspng}
          alt="Athletics"
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
}

export default Login;
