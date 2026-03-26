"use client";

import { useAntiCheat } from "@/hooks/useAntiCheat";

export default function StudentDashboard() {
  const { warnings, startExam, isExamActive } = useAntiCheat();

  return (
    <div className="flex min-h-screen bg-surface">
      {/* SideNavBar */}
      <aside className="hidden lg:flex flex-col h-screen w-64 fixed left-0 top-0 pt-20 bg-[#e6f6ff] dark:bg-slate-900 border-r border-[#bfc8cc]/15">
        <div className="px-6 mb-8 mt-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">school</span>
            </div>
            <div>
              <div className="text-primary font-bold">Student Portal</div>
              <div className="text-xs text-on-surface-variant opacity-70">Academic Sanctuary</div>
            </div>
          </div>
        </div>
        <nav className="flex flex-col h-full py-6 pr-4 gap-1">
          <a className="flex items-center gap-3 py-3 px-6 text-[#40484c] dark:text-slate-400 hover:bg-[#cfe6f2]/30 hover:translate-x-1 transition-transform duration-200" href="#">
            <span className="material-symbols-outlined">quiz</span>
            <span>Active Exams</span>
          </a>
          <a className="flex items-center gap-3 py-3 px-6 text-[#40484c] dark:text-slate-400 hover:bg-[#cfe6f2]/30 hover:translate-x-1 transition-transform duration-200" href="#">
            <span className="material-symbols-outlined">analytics</span>
            <span>Results History</span>
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-8 pt-8 bg-surface min-h-screen">
        <div className="max-w-[1400px] mx-auto space-y-12">
          {/* Top Bar Added Inside Main for dashboard context visually */}
          <div className="flex justify-between items-center bg-[#e6f6ff] dark:bg-slate-900 p-4 rounded-xl">
             <div className="text-2xl font-black text-[#004253] dark:text-[#cfe6f2] tracking-tighter">Tabgha Student</div>
             <div className="flex items-center gap-4 text-on-surface-variant">
               <span className="font-medium text-sm">Student #2049</span>
               <span className="material-symbols-outlined cursor-pointer hover:bg-[#cfe6f2]/50 p-2 rounded-full transition-colors duration-200">account_circle</span>
             </div>
          </div>

          <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-2 flex flex-col justify-center space-y-4">
              <h1 className="font-headline font-extrabold text-4xl lg:text-5xl text-on-background tracking-tight">Welcome back, Scholar.</h1>
              <p className="text-on-surface-variant text-lg max-w-md">Your intellectual journey continues. Ready to demonstrate your mastery in today's examinations?</p>
              {warnings > 0 && <p className="text-error font-bold">Warning: You have triggered {warnings} anti-cheat alerts during your session.</p>}
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-xl flex flex-col justify-between border border-outline-variant/15 transition-transform hover:translate-y-[-4px]">
              <div className="flex justify-between items-start">
                <span className="material-symbols-outlined text-primary bg-primary-fixed p-2 rounded-lg">history_edu</span>
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant opacity-60">Total Taken</span>
              </div>
              <div>
                <div className="text-4xl font-headline font-black text-primary">24</div>
                <div className="text-sm text-secondary font-semibold">+2 this week</div>
              </div>
            </div>
            <div className="bg-surface-container-highest p-6 rounded-xl flex flex-col justify-between border border-outline-variant/15 transition-transform hover:translate-y-[-4px]">
              <div className="flex justify-between items-start">
                <span className="material-symbols-outlined text-secondary bg-secondary-fixed p-2 rounded-lg">insights</span>
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant opacity-60">Avg Score</span>
              </div>
              <div>
                <div className="text-4xl font-headline font-black text-on-background">88.5</div>
                <div className="text-sm text-on-surface-variant">Top 5% of class</div>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-headline text-2xl font-bold text-on-background">Examination Schedule</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {/* Active Exam Card */}
              <div className="bg-surface-container-low p-6 rounded-xl flex flex-col gap-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 bg-secondary/10 text-secondary font-bold text-[10px] uppercase tracking-widest rounded-bl-xl">In Progress</div>
                <div className="space-y-1">
                  <h3 className="font-headline font-bold text-lg leading-tight">UTS 1: Mathematics</h3>
                  <p className="text-xs text-on-surface-variant">Algebra & Trigonometry Focus</p>
                </div>
                <div className="flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined text-sm">timer</span>
                  <span className="text-sm font-bold">120 Minutes</span>
                </div>
                {!isExamActive ? (
                  <button onClick={startExam} className="w-full bg-primary text-on-primary py-3 rounded-lg font-bold flex items-center justify-center gap-2 group-hover:scale-[1.02] transition-transform">
                    Start Exam
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                ) : (
                  <div className="w-full bg-secondary text-on-secondary py-3 rounded-lg font-bold flex items-center justify-center gap-2 text-sm text-center">
                    Exam is Active (Full Screen mode). Do not switch tabs.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
