"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Zap, Eye, EyeOff, AlertCircle, Loader2, Mail, Lock, Sparkles,
  ArrowRight, ShieldCheck, Package, BarChart3, ShoppingCart
} from "lucide-react";
import { cn } from "@/lib/utils";

function FloatingOrb({ className, delay, size }: { className?: string; delay: string; size: string }) {
  return (
    <div
      className={cn("absolute rounded-full animate-[float_8s_ease-in-out_infinite] opacity-[0.08]", className)}
      style={{
        width: size,
        height: size,
        animationDelay: delay,
        background: "radial-gradient(circle, #818cf8, transparent 70%)",
      }}
    />
  );
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-surface-root p-4 sm:p-6">
      {/* ─── Animated background orbs ─── */}
      <FloatingOrb className="-top-20 -left-20" delay="0s" size="500px" />
      <FloatingOrb className="top-1/3 -right-32" delay="3s" size="450px" />
      <FloatingOrb className="-bottom-40 left-1/3" delay="6s" size="550px" />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, #818cf8 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* ─── Content ─── */}
      <div className={cn(
        "relative z-10 w-full max-w-[420px] transition-all duration-700",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 animate-fade-in">
          <div className="relative mb-5">
            <div className="absolute inset-0 rounded-2xl blur-xl opacity-40"
              style={{ background: "linear-gradient(135deg, #6366f1, #a78bfa)" }}
            />
            <div
              className="relative flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg shadow-brand-500/20"
              style={{ background: "linear-gradient(135deg, #4f46e5, #6366f1)" }}
            >
              <Zap size={28} className="text-white" />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-2xl font-bold gradient-text tracking-tight">
              VapeShop
            </h1>
            <span className="text-[0.6rem] font-semibold px-1.5 py-0.5 rounded-md bg-brand-500/15 text-brand-400 uppercase tracking-wider">
              POS
            </span>
          </div>
          <p className="text-text-tertiary text-[0.8125rem] mt-2 tracking-wide">
            Point of Sale & Inventory Management
          </p>
        </div>

        {/* Features strip */}
        <div className="flex items-center justify-center gap-5 mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          {[
            { icon: ShoppingCart, label: "POS", },
            { icon: Package, label: "Inventory", },
            { icon: BarChart3, label: "Analytics", },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-[0.6875rem] text-text-tertiary">
              <Icon size={12} className="text-brand-400/60" />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Login Card */}
        <div
          className="card-glass p-6 sm:p-8 animate-slide-up relative overflow-hidden"
          style={{ animationDelay: "0.15s" }}
        >
          {/* Card top shimmer */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(129,140,248,0.3), transparent)",
            }}
          />

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              Welcome back
              <Sparkles size={15} className="text-brand-400" />
            </h2>
            <p className="text-text-tertiary text-sm mt-1">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {/* Error */}
            {error && (
              <div
                className="flex items-center gap-2.5 p-3 rounded-lg text-sm animate-scale-in"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  color: "#fca5a5",
                }}
              >
                <AlertCircle size={16} className="shrink-0 text-danger" />
                <span className="text-[0.8125rem]">{error}</span>
              </div>
            )}

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-[0.6875rem] font-semibold text-text-secondary uppercase tracking-wider">
                Email
              </label>
              <div className="relative group">
                <div className={cn(
                  "absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 pointer-events-none",
                  "group-focus-within:opacity-100"
                )}
                  style={{
                    background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(129,140,248,0.05))",
                  }}
                />
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none transition-colors duration-300 group-focus-within:text-brand-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@vapeshop.ph"
                  required
                  autoComplete="email"
                  className="relative input pl-10 transition-all duration-300"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-[0.6875rem] font-semibold text-text-secondary uppercase tracking-wider">
                Password
              </label>
              <div className="relative group">
                <div className={cn(
                  "absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 pointer-events-none",
                  "group-focus-within:opacity-100"
                )}
                  style={{
                    background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(129,140,248,0.05))",
                  }}
                />
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none transition-colors duration-300 group-focus-within:text-brand-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="relative input pl-10 pr-10 transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "relative w-full overflow-hidden rounded-xl font-semibold text-sm transition-all duration-300 mt-1",
                "flex items-center justify-center gap-2 py-3",
                loading
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-500/25 active:translate-y-0"
              )}
              style={{
                background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                color: "#fff",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-brand-400 to-brand-500 opacity-0 hover:opacity-100 transition-opacity" />
              <span className="relative z-10 flex items-center gap-2">
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={16} />
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-1.5 mt-5">
            <ShieldCheck size={12} className="text-text-tertiary/40" />
            <span className="text-[0.65rem] text-text-tertiary/50 tracking-wide">
              Secure & Encrypted
            </span>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[0.65rem] text-text-tertiary/50 mt-8 tracking-wider animate-fade-in" style={{ animationDelay: "0.3s" }}>
          VapeShop POS v1.0
        </p>
      </div>
    </div>
  );
}
