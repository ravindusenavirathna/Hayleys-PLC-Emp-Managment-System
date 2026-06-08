"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Building2, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LoginSchema, type LoginInput } from "@/lib/validations/auth.schema";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = (data: LoginInput) => {
    startTransition(async () => {
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        setError("root", {
          message: error.message === "Invalid login credentials"
            ? "Invalid email or password. Please try again."
            : error.message,
        });
        return;
      }

      toast.success("Signed in successfully");
      router.push("/");
      router.refresh();
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{
          background: "linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #1e3a5f 100%)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none">LogiCore</p>
            <p className="text-indigo-300 text-xs">Enterprise WMS</p>
          </div>
        </div>

        {/* Center content */}
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-medium border border-indigo-500/30">
              <Shield className="w-3 h-3" />
              Enterprise Grade Security
            </div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Warehouse Operations
              <br />
              <span className="text-indigo-400">Simplified</span>
            </h1>
            <p className="text-slate-400 text-base leading-relaxed max-w-sm">
              Manage your entire workforce, allocate workers intelligently,
              and track tasks across all warehouses and clusters — in one unified platform.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-3">
            {[
              "Smart workforce allocation with priority logic",
              "Real-time task tracking across all clusters",
              "Role-based access for all employee types",
              "Comprehensive audit logs and reports",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-indigo-400" />
                </div>
                <span className="text-slate-300 text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Warehouses", value: "2" },
            { label: "Clusters", value: "6" },
            { label: "Worker Capacity", value: "10K+" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-slate-400 text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-lg text-slate-900 leading-none">LogiCore</p>
              <p className="text-indigo-600 text-xs">Enterprise WMS</p>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-slate-500 text-sm">
              Sign in to your account to continue
            </p>
          </div>

          {/* Demo credentials notice */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-indigo-700 mb-2">
              🔐 Demo Credentials
            </p>
            <div className="space-y-1">
              {[
                { role: "Admin", email: "admin@example.com" },
                { role: "Team Leader", email: "teamleader.venus@example.com" },
                { role: "Supervisor", email: "supervisor.venus@example.com" },
                { role: "Assistant", email: "assistant.venus.a@example.com" },
                { role: "Worker", email: "worker001@example.com" },
              ].map(({ role, email }) => (
                <div key={email} className="flex justify-between text-xs">
                  <span className="text-indigo-600 font-medium">{role}:</span>
                  <span className="text-slate-600 font-mono">{email}</span>
                </div>
              ))}
              <p className="text-xs text-indigo-600 mt-2">Password: <span className="font-mono font-semibold">Demo@1234</span></p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" id="login-form">
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium text-slate-700"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register("email")}
                className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-all duration-200 outline-none bg-white
                  focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                  ${errors.email ? "border-red-400 bg-red-50" : "border-slate-300"}`}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  {...register("password")}
                  className={`w-full px-4 py-2.5 pr-11 rounded-lg border text-sm transition-all duration-200 outline-none bg-white
                    focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                    ${errors.password ? "border-red-400 bg-red-50" : "border-slate-300"}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  id="toggle-password"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Root error */}
            {errors.root && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-sm text-red-700">{errors.root.message}</p>
              </div>
            )}

            <button
              type="submit"
              id="login-submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700
                text-white text-sm font-medium rounded-lg transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400">
            LogiCore Enterprise WMS — For demonstration purposes only.
            <br />
            All data is synthetic and confidential.
          </p>
        </div>
      </div>
    </div>
  );
}
