import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Lock } from "lucide-react";
import {loadStripe} from '@stripe/stripe-js';
import {Elements} from '@stripe/react-stripe-js';

// Replace with your Stripe public key
const stripePromise = loadStripe('pk_test_YOUR_PUBLIC_KEY');

export default function PaywallPage() {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
  return (
    <>
      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-lg font-semibold tracking-wide text-black dark:text-white">
        Paul Sprint Systems
      </div>
      <div className="absolute top-6 left-6 flex items-center gap-3">
        <button
          onClick={() => window.history.back()}
          className="text-zinc-400 hover:text-white transition text-sm"
        >
          ← Back
        </button>
      </div>
      <div className="min-h-screen bg-gradient-to-b from-white via-zinc-100 to-white dark:from-black dark:via-zinc-900 dark:to-black text-black dark:text-white flex items-center justify-center px-6 py-12 transition-colors duration-300">
        <div className="max-w-5xl w-full grid md:grid-cols-2 gap-8 items-center">

          {/* LEFT SIDE */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              Unlock Elite Sprint Performance
            </h1>

            <p className="text-zinc-600 dark:text-zinc-400 text-lg mb-8">
              This isn’t YouTube advice. This is structured coaching designed to
              help serious athletes drop time, fix form, and build race-winning speed.
            </p>

            <div className="space-y-4">
              {[
                "Step-by-step sprint technique breakdowns",
                "Weekly structured training plans",
                "Form review submissions",
                "Direct access to coaching feedback",
                "Private athlete community"
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="text-zinc-700 dark:text-zinc-300">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* RIGHT SIDE */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-8 transition-colors duration-300">

              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-5 h-5 text-yellow-400" />
                <span className="text-sm uppercase text-yellow-400 tracking-wide">
                  Premium Access
                </span>
              </div>

              <h2 className="text-3xl font-bold mb-2">R99 / month</h2>

              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                Cancel anytime. Full access to all current and future sprint systems.
              </p>

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full rounded-2xl text-lg py-6 bg-white dark:bg-zinc-800 text-black dark:text-white font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition disabled:opacity-50"
              >
                {loading ? "Processing..." : "Unlock Now"}
              </button>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center mt-4">
                Secure checkout. Instant access after payment.
              </p>

            </div>
          </motion.div>

        </div>
      </div>
    </>
  );


}}
