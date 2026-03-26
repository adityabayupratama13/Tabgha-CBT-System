"use client";

import { useAntiCheat } from "@/hooks/useAntiCheat";
import { useEffect } from "react";

export default function ExamTakingInterface() {
  const { warnings, startExam, isExamActive } = useAntiCheat();

  useEffect(() => {
    // Automatically start exam rules (fullscreen, anti-cheat) when entering this page
    startExam();
  }, [startExam]);

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <header className="bg-primary text-on-primary px-8 py-4 flex justify-between items-center shadow-md z-50">
        <div>
          <h1 className="font-headline font-bold text-xl">UTS 1: Mathematics</h1>
          <p className="text-xs opacity-80">Algebra & Trigonometry</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center bg-primary-container px-4 py-2 rounded-lg">
            <span className="text-[10px] uppercase tracking-widest font-bold opacity-80">Time Remaining</span>
            <span className="font-mono font-bold text-lg">01:59:42</span>
          </div>
          {warnings > 0 && (
             <div className="bg-error text-on-error px-3 py-1 rounded-full text-xs font-bold animate-pulse flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px]">warning</span>
                Alerts: {warnings}
             </div>
          )}
          <button className="bg-error px-6 py-2 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-error/80 transition-colors">
            Finish Exam
          </button>
        </div>
      </header>
      
      <main className="flex-1 flex px-8 py-8 gap-8 max-w-[1600px] mx-auto w-full">
        {/* Question Area */}
        <section className="flex-1 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/15 p-12 flex flex-col">
          <div className="flex justify-between items-center mb-8 border-b border-outline-variant/10 pb-4">
             <h2 className="font-headline text-2xl font-bold">Question 4 of 50</h2>
             <span className="text-sm font-bold text-primary bg-primary-container/20 px-3 py-1 rounded-full">5 Points</span>
          </div>
          
          <div className="text-lg leading-relaxed text-on-surface mb-12">
            <p>If the quadratic equation <span className="font-bold underline">x² - 5x + c = 0</span> has roots that are strictly positive integers, what is the maximum possible value of <span className="font-bold">c</span>?</p>
          </div>

          <div className="space-y-4 flex-1">
            {["4", "5", "6", "10"].map((opt, i) => (
              <label key={i} className="flex items-center gap-4 p-4 rounded-xl border-2 border-outline-variant/30 hover:border-primary/50 cursor-pointer transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <input type="radio" name="q4" className="w-5 h-5 accent-primary" />
                <span className="text-base font-medium">{String.fromCharCode(65 + i)}. {opt}</span>
              </label>
            ))}
          </div>

          <div className="flex justify-between items-center mt-8 pt-6 border-t border-outline-variant/10">
             <button className="px-6 py-3 font-bold text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-colors">
               Previous
             </button>
             <button className="px-8 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
               Save & Next
             </button>
          </div>
        </section>

        {/* Navigation Map */}
        <aside className="w-80 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/15 p-6 flex flex-col h-fit">
          <h3 className="font-headline font-bold text-lg mb-4">Question Map</h3>
          <div className="flex flex-wrap gap-2">
            {Array.from({length: 50}).map((_, i) => (
              <button 
                key={i} 
                className={`w-10 h-10 rounded-lg font-bold text-sm flex items-center justify-center transition-colors 
                  ${i === 3 ? 'bg-primary text-on-primary ring-2 ring-primary ring-offset-2' : 
                    i < 3 ? 'bg-surface-container-highest text-on-surface-variant' : 
                    'bg-surface text-on-surface-variant hover:bg-surface-container-highest'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="mt-8 space-y-2 text-xs font-semibold text-on-surface-variant">
             <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-surface-container-highest"></div> Answered</div>
             <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary ring-1 ring-primary ring-offset-1"></div> Current</div>
             <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-surface"></div> Unanswered</div>
          </div>
        </aside>
      </main>

      {!isExamActive && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm">
           <div className="bg-surface p-12 rounded-3xl max-w-lg text-center shadow-2xl">
              <span className="material-symbols-outlined text-6xl text-primary mb-4">lock_open</span>
              <h2 className="text-3xl font-headline font-bold mb-4">Resume Exam</h2>
              <p className="text-on-surface-variant mb-8">Click below to enter full screen and resume proctoring. Remember, leaving the tab will be recorded.</p>
              <button onClick={startExam} className="bg-primary text-on-primary px-8 py-4 rounded-xl font-bold text-lg w-full flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                 <span className="material-symbols-outlined">fullscreen</span> Enter Focus Mode
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
