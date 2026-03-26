"use client";

import { useState } from "react";

export default function LoginPage() {
  const [role, setRole] = useState<"STUDENT" | "TEACHER" | "ADMIN">("STUDENT");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      window.location.href = `/${data.user.role.toLowerCase()}`;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Language & Theme Utility Bar */}
      <header className="fixed top-0 left-0 w-full z-50 px-8 py-6 flex justify-between items-center pointer-events-none">
        <div className="pointer-events-auto">
          <div className="text-2xl font-black text-primary dark:text-primary-fixed tracking-tighter font-headline">
            Tabgha
          </div>
        </div>
        <div className="flex items-center gap-6 pointer-events-auto">
          <div className="flex bg-surface-container-high dark:bg-slate-800 p-1 rounded-full items-center">
            <button className="px-4 py-1.5 rounded-full text-xs font-bold tracking-wider bg-primary text-on-primary transition-all duration-200">ID</button>
            <button className="px-4 py-1.5 rounded-full text-xs font-bold tracking-wider text-on-surface-variant hover:text-primary transition-all duration-200">EN</button>
          </div>
          <button 
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low dark:bg-slate-800 text-on-surface-variant hover:bg-surface-container-highest transition-colors"
            onClick={() => document.documentElement.classList.toggle("dark")}
          >
            <span className="material-symbols-outlined">dark_mode</span>
          </button>
        </div>
      </header>

      <main className="min-h-screen grid grid-cols-1 lg:grid-cols-12 items-center overflow-hidden">
        {/* Visual Column */}
        <div className="hidden lg:flex lg:col-span-7 h-full items-center justify-center relative bg-surface-container-low dark:bg-slate-900 overflow-hidden">
          <div className="relative z-10 px-20 max-w-3xl">
            <h1 className="font-headline text-primary dark:text-primary-fixed-dim font-extrabold text-6xl tracking-tighter leading-[1.1] mb-8">
              The Sanctuary <br/> of Focus.
            </h1>
            <p className="text-on-surface-variant dark:text-slate-400 text-lg max-w-md leading-relaxed mb-12">
              Enter a distraction-free environment designed for academic excellence. Your knowledge deserves a silent stage.
            </p>
            <div className="grid grid-cols-3 gap-8">
              <div className="flex flex-col gap-2">
                <span className="text-3xl font-bold text-secondary dark:text-secondary-fixed">99%</span>
                <span className="text-xs uppercase tracking-widest text-on-surface-variant opacity-70">Uptime Reliability</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-3xl font-bold text-secondary dark:text-secondary-fixed">0.2s</span>
                <span className="text-xs uppercase tracking-widest text-on-surface-variant opacity-70">Latency Precision</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-3xl font-bold text-secondary dark:text-secondary-fixed">End-to-End</span>
                <span className="text-xs uppercase tracking-widest text-on-surface-variant opacity-70">Secured Sessions</span>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 opacity-20 dark:opacity-40">
            <img className="w-full h-full object-cover" alt="Modern architectural lines of a library" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBaJ83aPacipL9mPHaHgUuGNQcOG_fzUWW1t_VZov31CMr1gSKbRKU7G4tTF6chiip6EVgrKm1Qro666S9LSCedECxosatwTh1sXSyXicPlqyJp3QDPu2-algBGypYL0MMJdBbEYITdWHV2DBvj3Iid_yetw7xDiYR5jWEZ2KgLGCRS56n_kyTF3ZeXNUILfOadbbxTEmnKuKGEOMW5Vhp29DDXI4CAe5s28XgdDTgX9UwqeoWGrrKe6o2378vRR5h802076Y_dclM"/>
          </div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-container/20 blur-[100px] rounded-full translate-x-1/2 translate-y-1/2"></div>
          <div className="absolute top-0 left-0 w-64 h-64 bg-secondary-container/20 blur-[80px] rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        {/* Form Column */}
        <div className="col-span-1 lg:col-span-5 flex items-center justify-center p-8 bg-surface dark:bg-slate-950 h-full">
          <div className="w-full max-w-md space-y-10">
            <div className="space-y-4">
              <div className="inline-flex px-3 py-1 rounded bg-secondary-container/30 text-secondary dark:text-secondary-fixed text-[10px] font-bold uppercase tracking-[0.2em]">
                Gateway Entry
              </div>
              <h2 className="font-headline text-4xl font-extrabold text-on-surface dark:text-white tracking-tight">Login Portal</h2>
              <p className="text-on-surface-variant dark:text-slate-400 font-medium">Select your role to access the sanctuary.</p>
            </div>

            {/* Role Selector */}
            <div className="flex gap-2 p-1 bg-surface-container-low dark:bg-slate-900 rounded-xl">
              {(["STUDENT", "TEACHER", "ADMIN"] as const).map((r) => (
                <button 
                  key={r}
                  onClick={() => setRole(r)}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 ${
                    role === r 
                      ? "bg-white dark:bg-primary-container text-primary dark:text-white" 
                      : "text-on-surface-variant dark:text-slate-400 hover:bg-surface-container-high"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {r === "STUDENT" ? "school" : r === "TEACHER" ? "assignment_ind" : "admin_panel_settings"}
                  </span>
                  {r.charAt(0) + r.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <form className="space-y-6" onSubmit={handleLogin}>
              {error && <div className="p-3 bg-error text-on-error rounded-xl text-sm font-bold text-center animate-pulse">{error}</div>}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400 ml-1" htmlFor="username">
                  {role === "STUDENT" ? "Identity Code" : "Username"}
                </label>
                <div className="relative group">
                  <input 
                    className="w-full bg-surface-container-low dark:bg-slate-900 border-none rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-surface-tint dark:focus:ring-primary text-on-surface dark:text-white placeholder:text-outline/50 transition-all outline-none" 
                    id="username" 
                    placeholder="Enter ID or Username" 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-primary">fingerprint</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400" htmlFor="password">Password</label>
                  <a className="text-[11px] font-bold uppercase tracking-widest text-primary dark:text-primary-fixed-dim hover:underline" href="#">Forgot Key?</a>
                </div>
                <div className="relative group">
                  <input 
                    className="w-full bg-surface-container-low dark:bg-slate-900 border-none rounded-xl py-4 pl-12 pr-12 focus:ring-2 focus:ring-surface-tint dark:focus:ring-primary text-on-surface dark:text-white placeholder:text-outline/50 transition-all outline-none" 
                    id="password" 
                    placeholder="••••••••" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-primary">lock</span>
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-primary transition-colors" type="button">
                    <span className="material-symbols-outlined">visibility</span>
                  </button>
                </div>
              </div>

              <button disabled={loading} className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold text-sm tracking-widest uppercase shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all outline-none disabled:opacity-50" type="submit">
                {loading ? "Authenticating..." : "Enter Sanctuary"}
              </button>
            </form>

            <footer className="pt-8 text-center">
              <p className="text-xs text-on-surface-variant/60 dark:text-slate-500 font-medium">
                © 2024 Tabgha CBT. All Rights Reserved.
              </p>
            </footer>
          </div>
        </div>
      </main>

      {/* Global Help Button (FAB) */}
      <button className="fixed bottom-8 right-8 w-14 h-14 flex items-center justify-center rounded-full bg-secondary dark:bg-secondary-container text-on-secondary dark:text-on-secondary-container shadow-2xl hover:scale-110 active:scale-90 transition-all duration-300 z-50 group">
        <span className="material-symbols-outlined">support_agent</span>
        <span className="absolute right-16 px-4 py-2 glass-panel text-primary dark:text-primary-fixed-dim rounded-lg text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Need Assistance?
        </span>
      </button>
    </>
  );
}
