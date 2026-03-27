"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState<"EXAMS" | "RESULTS">("EXAMS");
  const [exams, setExams] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserName, setCurrentUserName] = useState("Scholar");
  const router = useRouter();

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)userName=([^;]*)/);
    if (match) setCurrentUserName(decodeURIComponent(match[1]));

    const fetchAll = async () => {
      try {
        const [resExams, resResults] = await Promise.all([
          fetch("/api/student/exams"),
          fetch("/api/student/results")
        ]);

        if (resExams.ok) {
          const data = await resExams.json();
          setExams(data.exams || []);
        }
        if (resResults.ok) {
          const res = await resResults.json();
          setResults(res.results || []);
        }
      } catch (e) {
        console.error("Failed to fetch data");
      }
      setLoading(false);
    };

    fetchAll();
  }, []);

  const handleLogout = () => {
    document.cookie = "token=; path=/; max-age=0";
    document.cookie = "role=; path=/; max-age=0";
    document.cookie = "userId=; path=/; max-age=0";
    document.cookie = "userName=; path=/; max-age=0";
    window.location.href = "/";
  };

  const hasCompleted = (examId: string) => results.some(r => r.examId === examId);

  return (
    <div className="flex min-h-screen bg-surface selection:bg-primary/30 text-on-surface">
      <aside className="hidden lg:flex flex-col h-screen w-[280px] fixed left-0 top-0 pt-10 bg-[#e6f6ff]/40 dark:bg-slate-900/50 backdrop-blur-md border-r border-[#bfc8cc]/30 shadow-2xl z-20">
        <div className="px-8 mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-white text-[24px]">school</span>
            </div>
            <div>
              <div className="text-secondary font-black text-xl tracking-tight">Student Portal</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">Academic Sanctuary</div>
            </div>
          </div>
        </div>
        <nav className="flex flex-col h-full px-4 gap-2">
          <button onClick={() => setActiveTab("EXAMS")} className={`w-full flex items-center justify-start gap-4 py-4 px-6 rounded-2xl font-bold transition-all ${activeTab === "EXAMS" ? "text-primary bg-primary/10 shadow-sm" : "text-on-surface-variant hover:bg-slate-200/50 dark:hover:bg-slate-800/50"}`}>
            <span className="material-symbols-outlined text-[20px]">quiz</span>
            <span>Active Exams</span>
          </button>
          <button onClick={() => setActiveTab("RESULTS")} className={`w-full flex items-center justify-start gap-4 py-4 px-6 rounded-2xl font-bold transition-all ${activeTab === "RESULTS" ? "text-primary bg-primary/10 shadow-sm" : "text-on-surface-variant hover:bg-slate-200/50 dark:hover:bg-slate-800/50"}`}>
            <span className="material-symbols-outlined text-[20px]">analytics</span>
            <span>Results History</span>
          </button>
        </nav>
        <div className="p-6 mt-auto">
          <button onClick={handleLogout} className="w-full py-4 text-error font-bold flex items-center justify-center gap-2 hover:bg-error/10 rounded-2xl transition-colors">
            <span className="material-symbols-outlined">logout</span> Log Out
          </button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-[280px] p-8 lg:p-12 min-h-screen relative overflow-x-hidden">
        <div className="max-w-[1400px] mx-auto space-y-12 relative z-10">
          <div className="flex justify-between items-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg p-5 rounded-3xl border border-outline-variant/30 shadow-sm">
             <div className="text-2xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent tracking-tighter">Tabgha CBT</div>
             <div className="flex items-center gap-4 text-on-surface-variant">
               <span className="font-bold text-sm bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl">{currentUserName}</span>
               <span className="material-symbols-outlined cursor-pointer text-primary bg-primary/10 hover:bg-primary/20 p-2.5 rounded-xl transition-colors">account_circle</span>
             </div>
          </div>

          {activeTab === "EXAMS" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <section className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-12">
                <div className="xl:col-span-2 flex flex-col justify-center space-y-5 p-4 relative">
                  <div className="absolute top-0 right-10 -z-10 bg-primary/20 w-32 h-32 blur-[80px] rounded-full pointer-events-none"></div>
                  <h1 className="font-headline font-black text-5xl lg:text-6xl text-on-background tracking-tighter leading-tight">Welcome back,<br/><span className="text-primary">{currentUserName.split(" ")[0]}.</span></h1>
                  <p className="text-on-surface-variant font-medium text-lg max-w-md">Your intellectual journey continues. Ready to demonstrate your mastery in today's examinations?</p>
                </div>
                
                <div className="bg-white/60 dark:bg-slate-900/60 p-8 rounded-3xl flex flex-col justify-between border border-outline-variant/30 shadow-xl shadow-slate-200/20 dark:shadow-none hover:-translate-y-2 transition-transform group">
                  <div className="flex justify-between items-start">
                    <span className="material-symbols-outlined text-primary bg-primary/10 p-3 rounded-2xl group-hover:rotate-12 transition-transform">history_edu</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">Available</span>
                  </div>
                  <div className="mt-8">
                    <div className="text-6xl font-black text-primary tracking-tighter">{loading ? "-" : exams.length}</div>
                    <div className="text-sm text-secondary font-bold mt-2">Active Exams Today</div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-secondary to-tertiary p-8 rounded-3xl flex flex-col justify-between shadow-xl shadow-secondary/30 hover:-translate-y-2 transition-transform group opacity-60 grayscale cursor-not-allowed">
                  <div className="flex justify-between items-start">
                    <span className="material-symbols-outlined text-white bg-white/20 p-3 rounded-2xl group-hover:scale-110 transition-transform">insights</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/70 bg-black/20 px-3 py-1.5 rounded-lg">Average</span>
                  </div>
                  <div className="mt-8">
                    <div className="text-6xl font-black text-white tracking-tighter">
                      {results.length > 0 ? (results.reduce((a,b)=>a+(b.score||0),0)/results.length).toFixed(1) : "--"}
                    </div>
                    <div className="text-sm text-white/80 font-bold mt-2">Overall Score</div>
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="font-headline text-3xl font-black text-on-background tracking-tight">Today's Schedule</h2>
                    <p className="text-on-surface-variant font-medium mt-1">Exams assigned to your active classroom.</p>
                  </div>
                </div>
                
                {loading ? (
                  <div className="p-10 border border-dashed border-outline-variant rounded-3xl flex flex-col items-center justify-center text-on-surface-variant gap-4 bg-white/30 dark:bg-slate-900/30">
                    <span className="material-symbols-outlined animate-spin text-3xl text-primary">autorenew</span>
                    <span className="font-bold">Syncing examinations...</span>
                  </div>
                ) : exams.length === 0 ? (
                  <div className="p-16 border border-dashed border-outline-variant/50 rounded-3xl flex flex-col items-center justify-center text-on-surface-variant gap-4 bg-white/30 dark:bg-slate-900/30 shadow-sm">
                    <span className="material-symbols-outlined text-6xl opacity-30">deployed_code</span>
                    <h3 className="font-black text-xl text-on-surface">No Active Exams</h3>
                    <p className="text-sm font-medium opacity-80 max-w-sm text-center">There are currently no examinations scheduled or published for your enrolled classroom by your instructors.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {exams.map((ex) => {
                      const done = hasCompleted(ex.id);
                      return (
                        <div key={ex.id} className="bg-white/80 dark:bg-slate-800/80 p-8 rounded-3xl flex flex-col gap-6 relative overflow-hidden group border border-outline-variant/30 shadow-xl shadow-slate-200/50 dark:shadow-none hover:border-primary/50 transition-colors">
                          <div className={`absolute top-0 right-0 p-3 font-black text-[10px] uppercase tracking-widest rounded-bl-2xl ${done ? 'bg-slate-200 text-slate-500' : 'bg-secondary/10 text-secondary'}`}>
                            {done ? 'COMPLETED' : 'PUBLISHED'}
                          </div>
                          
                          <div className="space-y-2 mt-4">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{ex.term} • {ex.level}</span>
                            <h3 className="font-black text-2xl leading-tight line-clamp-2">{ex.title}</h3>
                            <p className="text-sm font-bold text-on-surface-variant line-clamp-1">{ex.subject?.name}</p>
                          </div>
                          
                          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-outline-variant/30">
                            <span className="material-symbols-outlined text-sm text-primary">timer</span>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{ex.durationMin} Minutes</span>
                          </div>

                          <div className="mt-auto pt-2">
                            {done ? (
                              <button disabled className="w-full bg-slate-200 dark:bg-slate-700 text-slate-500 py-4 rounded-2xl font-black flex items-center justify-center gap-2 text-[11px] text-center uppercase tracking-wider">
                                Exam Submitted
                              </button>
                            ) : (
                              <button onClick={() => router.push(`/student/exam/${ex.id}`)} className="w-full bg-primary text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-95 shadow-lg shadow-primary/20 transition-all text-sm uppercase tracking-wider">
                                Begin Test
                                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === "RESULTS" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
               <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="font-headline text-3xl font-black text-on-background tracking-tight">Results History</h2>
                    <p className="text-on-surface-variant font-medium mt-1">Your academic performance and records.</p>
                  </div>
                </div>
                
                {loading ? (
                  <p className="text-center font-bold text-slate-400">Loading...</p>
                ) : results.length === 0 ? (
                  <div className="p-16 border border-dashed border-outline-variant/50 rounded-3xl flex flex-col items-center justify-center text-on-surface-variant gap-4 bg-white/30 dark:bg-slate-900/30">
                    <span className="material-symbols-outlined text-6xl opacity-30">analytics</span>
                    <h3 className="font-black text-xl text-on-surface">No Completed Exams</h3>
                    <p className="text-sm font-medium opacity-80 text-center">You haven't completed any examinations yet. Check your Active Exams tab.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {results.map((r, i) => (
                      <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-6 group hover:-translate-y-1 transition-transform">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 font-black text-xl text-white shadow-lg ${r.score && r.score >= 80 ? 'bg-green-500 shadow-green-500/20' : r.score && r.score >= 60 ? 'bg-amber-500 shadow-amber-500/20' : 'bg-rose-500 shadow-rose-500/20'}`}>
                          {r.score !== null ? r.score : "?"}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-black text-xl">{r.exam?.title}</h4>
                          <p className="text-sm font-bold text-slate-500">{r.exam?.subject?.name} • {r.exam?.term}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Submitted On</p>
                          <p className="font-medium text-slate-800 dark:text-slate-200">{new Date(r.endTime).toLocaleDateString()} {new Date(r.endTime).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
