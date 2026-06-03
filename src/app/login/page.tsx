"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Zap, Eye, EyeOff, AlertCircle, Loader2, Mail, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="min-h-screen flex relative overflow-hidden bg-surface-root">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.07] blur-3xl"
          style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.06] blur-3xl"
          style={{ background: "radial-gradient(circle, #818cf8, transparent 70%)" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-[0.03] blur-3xl"
          style={{ background: "radial-gradient(circle, #4f46e5, transparent 70%)" }}
        />
      </div>

      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 via-surface-base to-surface-root" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, #818cf8 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full">
          <div>
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-lg"
                style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
              >
                <Zap size={20} className="text-white" />
              </div>
              <span className="text-sm font-semibold tracking-wider text-text-secondary uppercase">
                VapeShop
              </span>
            </div>
          </div>
          <div>
            <p className="text-text-tertiary text-sm leading-relaxed max-w-sm">
              Streamline your vape shop operations with real-time inventory tracking,
              point of sale, and sales analytics — all in one place.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="w-2 h-2 rounded-full bg-brand-500/40" />
            <div className="w-2 h-2 rounded-full bg-brand-500/20" />
            <div className="w-2 h-2 rounded-full bg-brand-500/10" />
          </div>
        </div>
      </div>

      {/* Right side — login card */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[400px] animate-fade-in">
          {/* Logo & title */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="flex items-center justify-center w-14 h-14 rounded-xl mb-5"
              style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
            >
              <Zap size={26} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold gradient-text">
              VapeShop
            </h1>
            <p className="text-text-tertiary text-xs mt-1.5 tracking-wide">
              Point of Sale & Inventory
            </p>
          </div>

          {/* Card */}
          <div className="card-glass p-6 sm:p-8 animate-slide-up">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-text-primary">
                Welcome back
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
                  <span>{error}</span>
                </div>
              )}

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="email"
                  className="text-xs font-medium text-text-secondary"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
                  />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@vapeshop.ph"
                    required
                    autoComplete="email"
                    className="input pl-9"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="password"
                  className="text-xs font-medium text-text-secondary"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
                  />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="input pl-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff size={15} />
                    ) : (
                      <Eye size={15} />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "btn btn-brand btn-lg w-full mt-2",
                  loading && "opacity-70 cursor-not-allowed"
                )}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-[0.7rem] text-text-tertiary mt-6 tracking-wide">
            VapeShop POS v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
