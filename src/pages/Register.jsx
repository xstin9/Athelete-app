import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, provider } from "../firebase";
import { FaGoogle } from "react-icons/fa";
import sportImg from "../assets/blackboard.jpg";
import Athleticspng from "../assets/sport part 2.jpg";
import Brand from "../components/Brand";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  async function handleRegister(e) {
    e.preventDefault();

    if (password.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      alert(err.message);
    }
  }

  async function registerWithGoogle() {
    try {
      await signInWithPopup(auth, provider);
      navigate("/dashboard");
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-3 bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
      <div className="hidden md:block">
        <img
          src={sportImg}
          alt="Sport"
          className="h-full w-full object-cover"
        />
      </div>

      <div className="flex flex-col justify-center px-8 max-w-md mx-auto">
        <Brand className="mb-6" />
        <h1 className="text-3xl font-bold mb-2">
          Community-Powered Motivation
        </h1>

        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Track your training and stay consistent.
        </p>

        <button
          onClick={registerWithGoogle}
          className="flex items-center justify-center gap-2 border py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 mb-3"
        >
          <FaGoogle /> Sign up with Google
        </button>

        <form onSubmit={handleRegister} className="flex flex-col gap-3">
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
            Sign Up with Email
          </button>
        </form>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
          Already a member?{" "}
          <span
            onClick={() => navigate("/")}
            className="text-orange-600 cursor-pointer"
          >
            Log in
          </span>
        </p>
      </div>

      <div className="hidden md:block">
        <img
          src={Athleticspng}
          alt= "Athletics"
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
}

export default Register;



