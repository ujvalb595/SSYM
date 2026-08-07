"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, ShieldCheck, LockKeyhole, Phone } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const values = new FormData(event.currentTarget);

    const result = await signIn("credentials", {
      mobileNumber: values.get("mobileNumber"),
      password: values.get("password"),
      callbackUrl: "/dashboard",
      redirect: false,
    });

    if (result?.error || !result?.ok) {
      setError("Invalid mobile number or password.");
      setLoading(false);
      return;
    }

    window.location.href = result.url || "/dashboard";
  }

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#f5f2ff] px-4 py-8 text-[#24203a]">
      {/* Background Ambient Glows */}
      <div className="pointer-events-none absolute -left-32 top-12 h-96 w-96 rounded-full bg-fuchsia-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-0 h-96 w-96 rounded-full bg-violet-400/30 blur-3xl" />

      <section className="relative z-10 grid w-full max-w-4xl overflow-hidden rounded-3xl border border-white/80 bg-white/90 shadow-2xl shadow-violet-900/10 backdrop-blur-xl md:grid-cols-2">
        {/* Left Side: Branding Hero */}
        <div className="hidden min-h-[540px] flex-col justify-between bg-gradient-to-br from-[#5d47d9] via-[#8255ef] to-[#c05ce9] p-10 text-white md:flex">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-xl font-black shadow-inner">
              S
            </div>
            <h1 className="mt-6 text-3xl font-extrabold tracking-tight">SSYM</h1>
            <p className="mt-1 text-sm font-medium text-white/80">Shiv Sai Yuvak Mandal</p>
          </div>

          <div className="my-auto py-8">
            <h2 className="text-3xl font-bold leading-snug">
              Together, we grow stronger.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/80">
              A secure, simple management portal for mandal members, event updates, payments, and community growth.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-white/70">
            <ShieldCheck size={16} /> Secure Management Portal
          </div>
        </div>

        {/* Right Side: Sign-in Form */}
        <div className="flex min-h-[540px] items-center p-6 sm:p-10">
          <div className="w-full">
            {/* Mobile Header Branding */}
            <div className="mb-8 md:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5d47d9] to-[#c05ce9] text-xl font-black text-white shadow-md">
                S
              </div>
              <p className="mt-2 text-lg font-bold">SSYM Portal</p>
            </div>

            <p className="text-xs font-bold uppercase tracking-widest text-[#7657f6]">
              WELCOME BACK
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#24203a] sm:text-3xl">
              Sign in to SSYM
            </h2>
            <p className="mt-1.5 text-xs text-stone-500">
              Enter your mobile number and password to access the portal.
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-[#403958]">
                  <Phone size={15} className="text-[#7657f6]" /> Mobile Number
                </span>
                <input
                  required
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Enter your 10-digit mobile number"
                  className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-[#7657f6] focus:ring-4 focus:ring-violet-100"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-[#403958]">
                  <LockKeyhole size={15} className="text-[#7657f6]" /> Password
                </span>
                <div className="relative">
                  <input
                    required
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 pr-12 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-[#7657f6] focus:ring-4 focus:ring-violet-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                    className="absolute inset-y-0 right-0 px-3.5 text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              {error && (
                <p role="alert" className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-[#654dde] to-[#ac58ee] py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
