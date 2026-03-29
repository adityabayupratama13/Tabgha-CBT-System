"use client";

import { useAntiCheat } from "@/hooks/useAntiCheat";
import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";

export default function ExamTakingInterface({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const examId = unwrappedParams.id;
  
  const [dialog, setDialog] = useState<{isOpen: boolean, title: string, message: string, type: "confirm"|"alert"|"danger", onConfirm?: () => void}>({isOpen: false, title: "", message: "", type: "alert"});
  const showAlert = (title: string, message: string, type: "alert"|"danger" = "alert", onConfirm?: () => void) => setDialog({isOpen: true, title, message, type, onConfirm});

  const { warnings, startExam, isExamActive, suspendExam } = useAntiCheat({
    onCheatDetected: (msg) => showAlert("Security Alert", msg, "danger")
  });
  const router = useRouter();

  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [completedScore, setCompletedScore] = useState<number | null>(null);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const res = await fetch(`/api/student/exams/${examId}`);
        const data = await res.json();
        
        if (!res.ok) {
          if (res.status === 403 && data.score !== undefined) {
             setExam(data.exam);
             setCompletedScore(data.score);
             setAlreadyCompleted(true);
             setLoading(false);
             return;
          }
          setErrorText(data.error || "Failed to load exam. You may have already completed it.");
          setLoading(false);
          return;
        }

        setExam(data.exam);
        setQuestions(data.exam.questions || []);

        // Calculate timer
        const start = new Date(data.attempt.startTime).getTime();
        const durationMs = data.exam.durationMin * 60 * 1000;
        const end = start + durationMs;
        const now = Date.now();
        const remain = Math.max(0, Math.floor((end - now) / 1000));
        
        setTimeLeft(remain);
        setLoading(false);
      } catch (err) {
        setErrorText("Network error loading exam.");
        setLoading(false);
      }
    };
    fetchExam();
  }, [examId]);

  // Timer Tick
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitting) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev && prev <= 1) {
          clearInterval(interval);
          handleSubmit(); // auto submit
          return 0;
        }
        return prev ? prev - 1 : 0;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, submitting]);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    suspendExam(); // stop anti-cheat tracking because we are leaving
    
    try {
      const res = await fetch(`/api/student/exams/${examId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers })
      });
      if (res.ok) {
        const data = await res.json();
        setCompletedScore(data.score);
        setAlreadyCompleted(true);
      } else {
        showAlert("Failed", "Failed to submit exam, please try again.", "danger");
        setSubmitting(false);
      }
    } catch (err) {
      showAlert("Network Error", "Network error. Your answers are saved locally, try again.", "danger");
      setSubmitting(false);
    }
  };

  const handleFinishClick = () => {
    setShowConfirm(true);
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isVideo = (url: string) => url.includes("youtube.com") || url.includes("youtu.be") || url.endsWith(".mp4");
  const MediaViewer = ({ url, type }: { url: string, type: string }) => {
    if (!url) return null;
    if (type === "video" || isVideo(url)) {
      const getEmbedUrl = (source: string) => {
        if (source.includes("youtube.com/watch")) return source.replace("watch?v=", "embed/");
        if (source.includes("youtu.be/")) return source.replace("youtu.be/", "youtube.com/embed/");
        return source;
      };
      return <iframe className="w-full max-w-2xl aspect-video rounded-xl mt-4 border border-outline-variant/30 shadow-lg" src={getEmbedUrl(url)} allowFullScreen />;
    }
    return <img src={url} alt="Media" className="max-w-2xl max-h-[400px] object-contain rounded-xl mt-4 border border-outline-variant/30 shadow-lg" />;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-surface font-headline font-bold text-2xl text-primary animate-pulse">Loading Academic Session...</div>;
  
  if (alreadyCompleted && exam) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface p-10 text-center relative overflow-hidden">
         <div className="absolute top-0 right-0 p-32 bg-primary/10 blur-[100px] w-full h-full rounded-full z-0 pointer-events-none"></div>
         <div className="relative z-10 max-w-lg w-full bg-white dark:bg-slate-900 shadow-2xl rounded-[2.5rem] p-10 border border-outline-variant/30 flex flex-col items-center">
            <span className="material-symbols-outlined text-[80px] mb-6 drop-shadow-lg text-primary">verified</span>
            <div className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-4 py-2 rounded-xl mb-4">Exam Completed</div>
            <h2 className="font-headline font-black text-3xl mb-2 text-on-surface">{exam.title}</h2>
            <p className="text-on-surface-variant font-bold mb-8">{exam.subject?.name}</p>
            
            <div className="bg-slate-50 dark:bg-slate-950 w-full p-8 rounded-3xl border border-outline-variant/50 mb-8">
               <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Final Score</p>
               <div className={`text-7xl font-black ${completedScore && completedScore >= 75 ? 'text-green-500' : 'text-amber-500'}`}>
                 {completedScore !== null ? completedScore : "?"}
               </div>
            </div>

            <button onClick={() => router.push("/student")} className="bg-primary text-on-primary px-10 py-4 font-black w-full rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-lg flex items-center justify-center gap-3">
              <span className="material-symbols-outlined">home</span> Back to Dashboard
            </button>
         </div>
      </div>
    );
  }

  if (errorText) return (
     <div className="min-h-screen flex flex-col items-center justify-center bg-surface p-10 text-center">
       <span className="material-symbols-outlined text-6xl text-error mb-4">gpp_bad</span>
       <h2 className="font-headline font-black text-3xl mb-4 text-on-surface">Access Denied</h2>
       <p className="text-on-surface-variant font-medium max-w-md">{errorText}</p>
       <button onClick={() => router.push("/student")} className="mt-8 bg-primary text-on-primary px-8 py-3 rounded-xl font-bold">Return to Dashboard</button>
     </div>
  );

  const q = questions[currentIdx];

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <header className="bg-primary text-on-primary px-8 py-4 flex justify-between items-center shadow-md z-50 sticky top-0">
        <div>
          <h1 className="font-headline font-black text-2xl truncate max-w-md">{exam.title}</h1>
          <p className="text-sm opacity-80 font-bold tracking-wider">{exam.subject.name}</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center bg-primary-container/20 px-5 py-2 rounded-xl border border-white/10">
            <span className="text-[10px] uppercase tracking-widest font-black opacity-80">Time Remaining</span>
            <span className={`font-mono font-black text-2xl ${timeLeft !== null && timeLeft < 300 ? 'text-red-300 animate-pulse' : ''}`}>
              {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
            </span>
          </div>
          {warnings > 0 && (
             <div className="bg-error text-on-error px-4 py-2 rounded-full text-xs font-bold animate-pulse flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">warning</span> Alerts: {warnings}
             </div>
          )}
          <button onClick={handleFinishClick} disabled={submitting} className="bg-error px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-error/80 hover:scale-105 active:scale-95 transition-all shadow-lg">
            {submitting ? "Submitting..." : "Finish Exam"}
          </button>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col lg:flex-row px-4 lg:px-8 py-8 gap-8 max-w-[1600px] mx-auto w-full">
        {/* Question Area */}
        <section className="flex-1 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-outline-variant/30 p-8 lg:p-12 flex flex-col relative overflow-hidden">
          {q ? (
            <>
              <div className="flex justify-between items-center mb-8 border-b border-outline-variant/20 pb-6">
                <h2 className="font-headline text-3xl font-black text-on-surface">Question {currentIdx + 1} of {questions.length}</h2>
                <span className="text-xs font-black uppercase tracking-widest text-primary bg-primary/10 px-4 py-2 rounded-xl">
                  {q.type === 'ESSAY' ? 'Essay Format' : 'Multiple Choice'}
                </span>
              </div>
              
              <div className="text-xl font-medium leading-relaxed text-slate-800 dark:text-slate-200 mb-8 whitespace-pre-wrap flex-1">
                {q.text}
                {q.mediaUrl && <div className="mt-6"><MediaViewer url={q.mediaUrl} type={q.mediaType || "image"} /></div>}
              </div>

              {q.type === 'MULTIPLE_CHOICE' ? (
                <div className="space-y-4 flex-1">
                  {q.options && q.options.map((opt: any) => (
                    <label key={opt.id} className="flex items-center gap-5 p-5 rounded-2xl border-[3px] border-outline-variant/30 hover:border-primary/50 cursor-pointer transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:shadow-lg shadow-primary/10">
                      <input 
                        type="radio" 
                        name={`q-${q.id}`} 
                        checked={answers[q.id] === opt.id}
                        onChange={() => setAnswers({...answers, [q.id]: opt.id})}
                        className="w-6 h-6 accent-primary" 
                      />
                      <div className="flex-1 flex flex-col gap-2">
                        <span className="text-lg font-bold text-on-surface flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-sm font-black text-slate-500">{opt.id}</span>
                          {opt.text}
                        </span>
                        {opt.mediaUrl && <MediaViewer url={opt.mediaUrl} type="image" />}
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  <textarea 
                    value={answers[q.id] || ""}
                    onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})}
                    placeholder="Type your essay answer here..."
                    className="flex-1 w-full bg-slate-50 dark:bg-slate-950 border-[3px] border-outline-variant/30 rounded-2xl p-6 font-medium text-lg outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all resize-none min-h-[300px]"
                  />
                  <p className="text-xs font-bold text-slate-400 mt-3 uppercase tracking-widest text-right">Words: {(answers[q.id] || "").split(/\s+/).filter(x => x.length > 0).length}</p>
                </div>
              )}

              <div className="flex justify-between items-center mt-10 pt-8 border-t border-outline-variant/20">
                <button 
                  onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                  disabled={currentIdx === 0}
                  className="px-8 py-4 font-black text-on-surface-variant hover:bg-surface-container-high rounded-2xl transition-all disabled:opacity-30 disabled:hover:bg-transparent uppercase tracking-widest text-sm"
                >
                  Previous
                </button>
                {currentIdx < questions.length - 1 ? (
                  <button 
                    onClick={() => setCurrentIdx(currentIdx + 1)}
                    className="px-10 py-4 bg-primary text-on-primary font-black rounded-2xl shadow-xl shadow-primary/30 hover:scale-[1.03] active:scale-95 transition-all text-lg uppercase tracking-wider flex items-center gap-3"
                  >
                    Save & Next <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                ) : (
                  <button 
                    onClick={handleFinishClick}
                    className="px-10 py-4 bg-green-500 text-white font-black rounded-2xl shadow-xl shadow-green-500/30 hover:scale-[1.03] active:scale-95 transition-all text-lg uppercase tracking-wider flex items-center gap-3"
                  >
                    Done <span className="material-symbols-outlined">done_all</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-on-surface-variant font-bold text-xl">
              No questions found for this exam.
            </div>
          )}
        </section>

        {/* Navigation Map */}
        <aside className="w-full lg:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-outline-variant/30 p-8 flex flex-col h-fit">
          <h3 className="font-headline font-black text-2xl mb-6">Question Map</h3>
          <div className="flex flex-wrap gap-3">
            {questions.map((question, i) => {
              const isAnswered = !!answers[question.id];
              const isCurrent = i === currentIdx;
              
              let btnClass = "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"; // Unanswered
              if (isAnswered) btnClass = "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 font-bold border border-green-200 dark:border-green-800";
              if (isCurrent) btnClass = "bg-primary text-white shadow-lg shadow-primary/30 scale-110 z-10 font-black";

              return (
                <button 
                  key={question.id} 
                  onClick={() => setCurrentIdx(i)}
                  className={`w-12 h-12 rounded-xl font-bold text-sm flex items-center justify-center transition-all ${btnClass}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-10 pt-6 border-t border-outline-variant/20 space-y-4 text-sm font-bold text-on-surface-variant uppercase tracking-widest">
             <div className="flex items-center gap-3"><div className="w-5 h-5 rounded-md bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-800"></div> Answered</div>
             <div className="flex items-center gap-3"><div className="w-5 h-5 rounded-md bg-primary shadow-sm shadow-primary/30"></div> Current</div>
             <div className="flex items-center gap-3"><div className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800"></div> Unanswered</div>
          </div>
        </aside>
      </main>

      {!isExamActive && !showConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-md p-4">
           <div className="bg-white dark:bg-[#0a0f14] p-12 rounded-[2.5rem] max-w-xl text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 bg-primary/10 blur-[80px] w-full h-full rounded-full z-0 pointer-events-none"></div>
              <div className="relative z-10">
                <span className="material-symbols-outlined text-[80px] text-primary mb-6 drop-shadow-lg">lock_open</span>
                <h2 className="text-4xl font-headline font-black mb-4 tracking-tight">Exam Focus Required</h2>
                <p className="text-on-surface-variant font-medium text-lg leading-relaxed mb-10">Secure browser isolation required. Please enter full screen mode to start or resume your examination. Leaving the tab during the exam will be recorded.</p>
                <button onClick={startExam} className="bg-gradient-to-r from-primary to-secondary text-white px-10 py-5 rounded-2xl font-black text-xl w-full flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20">
                   <span className="material-symbols-outlined text-[28px]">fullscreen</span> Enter Exam Mode
                </button>
              </div>
           </div>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
           <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl max-w-md text-center shadow-2xl animate-in zoom-in-95 duration-200">
              <span className="material-symbols-outlined text-6xl text-amber-500 mb-4">check_circle</span>
              <h2 className="text-2xl font-headline font-black mb-4 tracking-tight">Submit Examination?</h2>
              <p className="text-on-surface-variant font-medium mb-8">Are you sure you want to finish and submit this exam? You cannot change your answers after this.</p>
              <div className="flex gap-4">
                 <button onClick={() => setShowConfirm(false)} className="flex-1 px-6 py-4 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors">Cancel</button>
                 <button onClick={() => { setShowConfirm(false); handleSubmit(); }} className="flex-1 px-6 py-4 rounded-xl font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">Yes, Submit</button>
              </div>
           </div>
        </div>
      )}

      {dialog.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center relative overflow-hidden">
            {dialog.type === 'danger' && <div className="absolute top-0 left-0 w-full h-2 bg-error"></div>}
            {dialog.type === 'alert' && <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>}
            
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6 mt-2 ${dialog.type === 'danger' ? 'bg-error/10 text-error' : 'bg-green-100 text-green-500'}`}>
              <span className="material-symbols-outlined text-3xl">{dialog.type === 'danger' ? 'warning' : 'check_circle'}</span>
            </div>
            
            <h3 className="font-headline font-black text-2xl mb-3 text-on-surface">{dialog.title}</h3>
            <p className="text-on-surface-variant font-medium mb-8 leading-relaxed">{dialog.message}</p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setDialog({...dialog, isOpen: false});
                  if (dialog.onConfirm) dialog.onConfirm();
                }} 
                className={`flex-1 px-4 py-3 text-on-primary font-bold rounded-xl transition-transform hover:scale-105 shadow-lg ${dialog.type === 'danger' ? 'bg-error shadow-error/30' : 'bg-green-500 shadow-green-500/30'}`}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
