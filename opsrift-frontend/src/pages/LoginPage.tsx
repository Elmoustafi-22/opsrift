import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, Zap } from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import { useAuthStore } from "../store/useAuthStore";

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ email: "", password: "" });

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const response = await axiosInstance.post("/auth/login", {
        email: formData.email,
        password: formData.password,
      });
      const { user, token } = response.data;
      setAuth(user, token);
      navigate("/dashboard");
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        (typeof err.response?.data === "string" ? err.response.data : null) ||
        err.message ||
        "Invalid credentials. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* ── LEFT PANEL — dark hero ── */}
      <div className="hidden lg:flex flex-col flex-1 relative bg-slate-900 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute inset-0">
          <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-600/30 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-600/20 rounded-full blur-[100px]" />
          {/* Dot grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-14">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/30">
              O
            </div>
            <span className="text-white font-black text-lg tracking-tight font-heading">
              OpsRift
            </span>
          </motion.div>

          {/* Main copy */}
          <div className="flex-1 flex flex-col justify-center max-w-lg">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <span className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full mb-8">
                <Zap size={10} /> Operations Command Center
              </span>
              <h1 className="text-5xl xl:text-6xl font-black font-heading text-white leading-[1.05] tracking-tight">
                Manage ops
                <br />
                <span className="text-indigo-400">at any scale.</span>
              </h1>
              <p className="text-slate-400 text-lg leading-relaxed mt-6 font-medium">
                Real-time task orchestration, AI-assisted documentation, and
                role-based workflows — all in one console.
              </p>
            </motion.div>
          </div>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-wrap gap-2.5 mt-4"
          >
            {[
              "AI-assisted documentation",
              "Real-time task tracking",
              "Overdue incident alerts",
            ].map((feat) => (
              <span
                key={feat}
                className="inline-flex items-center gap-1.5 bg-white/8 border border-white/10 text-white/60 text-[11px] font-semibold px-3.5 py-1.5 rounded-full"
              >
                <Zap size={9} className="text-indigo-400" />
                {feat}
              </span>
            ))}
          </motion.div>

          <p className="relative z-10 text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em] mt-6">
            © 2026 OpsRift Console
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL — white form ── */}
      <div className="flex flex-col items-center justify-center w-full lg:w-[480px] xl:w-[520px] bg-white px-8 md:px-16 py-12 relative">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-12 self-start">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-base">
            O
          </div>
          <span className="font-black text-slate-900 text-base font-heading">
            OpsRift
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          {/* Heading */}
          <div className="mb-10">
            <h2 className="text-3xl font-black font-heading text-slate-900 tracking-tight">
              Sign in
            </h2>
            <p className="text-slate-400 mt-2 font-medium text-sm">
              Access the OpsRift operations console.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                />
                <input
                  id="login-email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full pl-11 pr-4 h-12 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                />
                <input
                  id="login-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full pl-11 pr-4 h-12 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 border border-red-100 text-red-600 text-xs font-bold p-3.5 rounded-xl flex items-center gap-2.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-black font-heading text-sm rounded-xl flex items-center justify-center gap-2.5 transition-all duration-200 shadow-lg shadow-indigo-600/25 disabled:opacity-60 mt-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Signing in…
                </span>
              ) : (
                <>
                  Sign In to Console
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer divider */}
          <div className="mt-12 pt-8 border-t border-slate-100 text-center">
            <p className="text-slate-300 text-[10px] font-bold uppercase tracking-[0.2em]">
              Authorized personnel only
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
