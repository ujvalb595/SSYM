"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

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
      username: values.get("username"),
      password: values.get("password"),
      redirect: false,
    });
    if (result?.error) {
      setError("Invalid username or password.");
      setLoading(false);
      return;
    }
    window.location.assign("/dashboard");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f4ff] px-5 py-10 text-[#24203a]">
      <div className="absolute -left-32 top-12 size-96 rounded-full bg-fuchsia-200/40 blur-3xl" />
      <div className="absolute -right-28 bottom-0 size-96 rounded-full bg-violet-300/40 blur-3xl" />
      <section className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white bg-white/85 shadow-[0_25px_80px_rgb(73_42_155_/_0.18)] backdrop-blur md:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden min-h-[590px] flex-col justify-between bg-gradient-to-br from-[#5d47d9] via-[#8255ef] to-[#c05ce9] p-10 text-white md:flex">
          <div>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-white/20 text-xl font-black">
              S
            </div>
            <p className="mt-6 text-2xl font-bold">SSYM</p>
            <p className="mt-1 text-sm text-white/70">Shiv Sai Yuvak Mandal</p>
          </div>
          <div>
            <h1 className="text-4xl font-bold leading-tight">
              Together, we grow stronger.
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/75">
              A simple, secure place to manage members, payments, events, and
              community progress.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/65">
            <ShieldCheck size={16} /> Secure management portal
          </div>
        </div>
        <div className="flex min-h-[590px] items-center p-7 sm:p-12">
          <div className="w-full">
            <div className="mb-9 md:hidden">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5d47d9] to-[#c05ce9] font-black text-white">
                S
              </div>
              <p className="mt-3 font-bold">SSYM</p>
            </div>
            <p className="text-sm font-semibold text-[#7657f6]">WELCOME BACK</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Sign in to SSYM
            </h2>
            <p className="mt-2 text-sm text-stone-500">
              Enter your credentials to access the dashboard.
            </p>
            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <label className="block text-sm font-semibold">
                Username
                <input
                  required
                  name="username"
                  autoComplete="username"
                  placeholder="Enter your username"
                  className="mt-2 w-full rounded-xl border border-[#e6e1f3] bg-white px-4 py-3 outline-none transition placeholder:text-stone-400 focus:border-[#8660ee] focus:ring-4 focus:ring-violet-100"
                />
              </label>
              <label className="block text-sm font-semibold">
                Password
                <div className="relative mt-2">
                  <input
                    required
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-[#e6e1f3] bg-white px-4 py-3 pr-12 outline-none transition placeholder:text-stone-400 focus:border-[#8660ee] focus:ring-4 focus:ring-violet-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                    className="absolute inset-y-0 right-0 px-4 text-stone-400"
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </label>
              {error && (
                <p
                  role="alert"
                  className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700"
                >
                  {error}
                </p>
              )}
              <button
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-[#654dde] to-[#ac58ee] py-3 font-semibold text-white shadow-lg shadow-violet-200 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
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
