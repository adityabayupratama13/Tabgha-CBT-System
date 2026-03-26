"use client";

export default function TeacherDashboard() {
  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="bg-[#e6f6ff] dark:bg-slate-900 text-[#004253] dark:text-[#cfe6f2] font-['Inter'] text-sm font-medium w-64 fixed left-0 top-0 h-screen pt-8 flex flex-col py-6 pr-4 z-40 border-r border-outline-variant/15">
        <div className="px-6 mb-8">
          <h2 className="text-lg font-bold text-[#004253] dark:text-white">Teacher Portal</h2>
          <p className="text-xs text-on-surface-variant opacity-70">Academic Sanctuary</p>
        </div>
        <nav className="flex-1 space-y-1">
          <a className="flex items-center gap-4 px-6 py-3 bg-[#cfe6f2] dark:bg-[#005b71] text-[#004253] dark:text-white rounded-r-full font-bold hover:translate-x-1" href="#">
            <span className="material-symbols-outlined">quiz</span>
            <span>Question Bank</span>
          </a>
          <a className="flex items-center gap-4 px-6 py-3 text-[#40484c] dark:text-slate-400 hover:bg-[#cfe6f2]/30 hover:translate-x-1" href="#">
            <span className="material-symbols-outlined">analytics</span>
            <span>Exam Results</span>
          </a>
        </nav>
        <div className="px-6 mt-auto">
          <button className="w-full py-3 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg">
            <span className="material-symbols-outlined">add</span> Create New Test
          </button>
        </div>
      </aside>

      <main className="ml-64 p-12 w-full">
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="font-headline font-extrabold text-4xl tracking-tight text-on-background">Welcome back, Professor.</h1>
            <p className="font-body text-on-surface-variant mt-2">The sanctuary is quiet. 4 active exams are currently being proctored.</p>
          </div>
          <div className="flex gap-4">
            <button className="px-6 py-2.5 bg-surface-container-highest text-primary rounded-xl font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">data_exploration</span> View Analysis
            </button>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-8">
          {/* AI Insights */}
          <section className="col-span-12 lg:col-span-8 space-y-8">
            <div className="bg-surface-container-lowest p-8 rounded-xl relative overflow-hidden group border border-outline-variant/10">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <span className="material-symbols-outlined text-9xl">auto_awesome</span>
              </div>
              <div className="relative z-10">
                <span className="text-[10px] font-bold uppercase tracking-widest text-secondary bg-secondary-container px-3 py-1 rounded-full mb-4 inline-block">AI Performance Analysis</span>
                <h3 className="font-headline text-2xl font-bold mb-4">Current Semester Trends</h3>
                <p className="text-on-surface-variant max-w-xl mb-6">Students are demonstrating high proficiency in <span className="text-primary font-bold">Quantum Mechanics</span>, but engagement in <span className="text-tertiary font-bold">Theoretical Ethics</span> has dipped by 14% this week.</p>
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-surface-container-low p-4 rounded-xl">
                    <span className="text-xs font-semibold text-on-surface-variant">Avg. Grade</span>
                    <div className="text-2xl font-black text-primary">88.4</div>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-xl">
                    <span className="text-xs font-semibold text-on-surface-variant">Retention</span>
                    <div className="text-2xl font-black text-secondary">92%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Proctoring Logs */}
            <div className="bg-surface-container-highest rounded-xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-headline text-xl font-bold">Live Proctoring Logs</h3>
                <span className="flex items-center gap-2 text-xs font-bold text-secondary">
                  <span className="w-2 h-2 bg-secondary rounded-full animate-pulse"></span> LIVE
                </span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl hover:translate-x-2 transition-transform cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-surface-container-low flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary">history_edu</span>
                    </div>
                    <div>
                      <p className="font-bold text-sm">Advanced Calculus - Final</p>
                      <p className="text-xs text-on-surface-variant">124 Students Active • Hall 4</p>
                    </div>
                  </div>
                  <button className="text-primary font-bold text-xs uppercase tracking-tighter">Enter Monitor</button>
                </div>
              </div>
            </div>
          </section>

          {/* Security Alerts */}
          <section className="col-span-12 lg:col-span-4 space-y-8">
            <div className="bg-tertiary-fixed text-on-tertiary-fixed p-6 rounded-xl border border-tertiary/10">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-tertiary">warning</span>
                <h3 className="font-bold text-sm">Security Alerts</h3>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-white/50 dark:bg-black/20 rounded-lg flex gap-3 items-start">
                  <span className="material-symbols-outlined text-sm mt-0.5" style={{fontVariationSettings: "'FILL' 1"}}>error</span>
                  <p className="text-xs leading-relaxed"><strong>Student #2049</strong> - Browser Focus Lost (Multiple instances detected in Calculus Final).</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
