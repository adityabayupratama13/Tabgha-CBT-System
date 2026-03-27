"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState<"DASHBOARD" | "QUESTION_BANK" | "EXAMS">("DASHBOARD");

  const [subjects, setSubjects] = useState<any[]>([]);
  const [activeSubject, setActiveSubject] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classRooms, setClassRooms] = useState<any[]>([]);
  const [fetching, setFetching] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);

  // New Subject State
  const [newSub, setNewSub] = useState({ name: "", level: "SMA", sharedWithIds: [] as string[] });
  
  // New Exam State
  const [newEx, setNewEx] = useState({
    title: "", term: "UTS_1", level: "SMA", subjectId: "", durationMin: 60, sharedWithIds: [] as string[], classRoomIds: [] as string[]
  });

  // Question State
  const defaultOptions = [
    { id: "A", text: "", isCorrect: true, mediaUrl: "" },
    { id: "B", text: "", isCorrect: false, mediaUrl: "" },
    { id: "C", text: "", isCorrect: false, mediaUrl: "" },
    { id: "D", text: "", isCorrect: false, mediaUrl: "" }
  ];
  
  const [newQ, setNewQ] = useState({
    id: "",
    text: "",
    type: "MULTIPLE_CHOICE", // or 'ESSAY'
    mediaUrl: "",
    mediaType: "image", // 'image' or 'video'
    options: defaultOptions as any[]
  });

  const [currentUserName, setCurrentUserName] = useState("Professor");

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)userName=([^;]*)/);
    if (match) setCurrentUserName(decodeURIComponent(match[1]));
  }, []);

  const fetchSubjects = useCallback(async () => {
    try {
      const res = await fetch("/api/subjects");
      const data = await res.json();
      if (res.ok) setSubjects(data.subjects || []);
    } catch (e) {}
  }, []);

  const fetchClassRooms = useCallback(async () => {
    try {
      const res = await fetch("/api/classRooms");
      const data = await res.json();
      if (res.ok) setClassRooms(data.classrooms || []);
    } catch (e) {}
  }, []);

  const fetchQuestions = async (subId: string) => {
    setFetching(true);
    try {
      const res = await fetch(`/api/questions?subjectId=${subId}`);
      const data = await res.json();
      if (res.ok) setQuestions(data.questions || []);
    } catch (e) {}
    setFetching(false);
  };

  const fetchExams = useCallback(async () => {
    try {
      const res = await fetch("/api/exams");
      const data = await res.json();
      if (res.ok) setExams(data.exams || []);
    } catch (e) {}
  }, []);

  const fetchTeachers = useCallback(async () => {
    try {
      const res = await fetch("/api/teachers");
      const data = await res.json();
      if (res.ok) setTeachers(data.teachers || []);
    } catch (e) {}
  }, []);

  useEffect(() => {
    fetchSubjects();
    fetchExams();
    fetchTeachers();
    fetchClassRooms();
  }, [fetchSubjects, fetchExams, fetchTeachers, fetchClassRooms]);

  useEffect(() => {
    if (activeSubject) fetchQuestions(activeSubject.id);
  }, [activeSubject]);

  const handleLogout = () => {
    document.cookie = "token=; path=/; max-age=0";
    document.cookie = "role=; path=/; max-age=0";
    document.cookie = "userId=; path=/; max-age=0";
    document.cookie = "userName=; path=/; max-age=0";
    window.location.href = "/";
  };

  const toggleShare = (id: string, field: "newSub" | "newEx", listName: "sharedWithIds" | "classRoomIds" = "sharedWithIds") => {
    if (field === "newSub") {
      setNewSub(prev => ({
        ...prev,
        [listName]: (prev as any)[listName].includes(id) ? (prev as any)[listName].filter((x: string) => x !== id) : [...(prev as any)[listName], id]
      }));
    } else {
      setNewEx(prev => ({
        ...prev,
        [listName]: (prev as any)[listName].includes(id) ? (prev as any)[listName].filter((x: string) => x !== id) : [...(prev as any)[listName], id]
      }));
    }
  };

  const handleCreateSubject = async (e: any) => {
    e.preventDefault();
    await fetch("/api/subjects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newSub) });
    setShowSubjectModal(false);
    setNewSub({ name: "", level: "SMA", sharedWithIds: [] });
    fetchSubjects();
  };

  const handleDeleteSubject = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to completely delete "${name}" and all its questions?`)) return;
    await fetch(`/api/subjects?id=${id}`, { method: "DELETE" });
    if (activeSubject?.id === id) setActiveSubject(null);
    fetchSubjects();
  };

  const handleDuplicateSubject = async (id: string, name: string, level: string) => {
    if (!confirm(`Duplicate "${name}"?`)) return;
    await fetch("/api/subjects", { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ name: `${name} (Copy)`, level, sourceId: id }) 
    });
    fetchSubjects();
  };

  const handleCreateExam = async (e: any) => {
    e.preventDefault();
    await fetch("/api/exams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newEx) });
    setShowExamModal(false);
    setNewEx({ title: "", term: "UTS_1", level: "SMA", subjectId: "", durationMin: 60, sharedWithIds: [], classRoomIds: [] });
    fetchExams();
  };

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (res.ok) return data.url;
    throw new Error(data.error || "Upload failed");
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "question" | "option", idx?: number) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingMedia(true);
    try {
      const url = await handleUpload(e.target.files[0]);
      if (target === "option" && idx !== undefined) {
        updateOption(idx, "mediaUrl", url);
      } else {
        setNewQ({ ...newQ, mediaUrl: url });
      }
    } catch (err) {
      alert("File upload failed. Please try again.");
    }
    setUploadingMedia(false);
    e.target.value = ""; // reset
  };

  /* ════════ QUESTION LOGIC ════════ */
  const openNewQuestion = () => {
    setNewQ({ id: "", text: "", type: "MULTIPLE_CHOICE", mediaUrl: "", mediaType: "image", options: defaultOptions });
    setShowQuestionModal(true);
  };

  const openEditQuestion = (q: any) => {
    setNewQ({
      id: q.id,
      text: q.text,
      type: q.type || "MULTIPLE_CHOICE",
      mediaUrl: q.mediaUrl || "",
      mediaType: q.mediaType || "image",
      options: q.options || defaultOptions
    });
    setShowQuestionModal(true);
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    await fetch(`/api/questions?id=${id}`, { method: "DELETE" });
    if (activeSubject) fetchQuestions(activeSubject.id);
    fetchSubjects();
  };

  const handleSaveQuestion = async (e: any) => {
    e.preventDefault();
    if (!activeSubject) return;

    const method = newQ.id ? "PUT" : "POST";
    const payload = { ...newQ, subjectId: activeSubject.id };

    await fetch("/api/questions", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setShowQuestionModal(false);
    fetchQuestions(activeSubject.id);
    fetchSubjects();
  };

  const setCorrectOption = (idx: number) => {
    setNewQ({ ...newQ, options: newQ.options.map((opt, i) => ({ ...opt, isCorrect: i === idx })) });
  };
  const updateOption = (idx: number, field: string, val: any) => {
    const opts = [...newQ.options];
    opts[idx] = { ...opts[idx], [field]: val };
    setNewQ({ ...newQ, options: opts });
  };
  const addOption = () => {
    if (newQ.options.length >= 10) return; // Limit to J
    const nextId = ALPHABET[newQ.options.length];
    setNewQ({ ...newQ, options: [...newQ.options, { id: nextId, text: "", isCorrect: false, mediaUrl: "" }] });
  };
  const removeOption = () => {
    if (newQ.options.length <= 2) return; // Minimum 2 options
    const opts = newQ.options.slice(0, -1);
    // if the removed option was the correct one, default to the first one
    if (!opts.find(o => o.isCorrect)) opts[0].isCorrect = true;
    setNewQ({ ...newQ, options: opts });
  };

  const totalQuestions = subjects.reduce((acc, sub) => acc + (sub._count?.questions || 0), 0);
  const isVideo = (url: string) => url.includes("youtube.com") || url.includes("youtu.be") || url.endsWith(".mp4");
  
  const MediaViewer = ({ url, type }: { url: string, type: string }) => {
    if (!url) return null;
    if (type === "video" || isVideo(url)) {
      const getEmbedUrl = (source: string) => {
        if (source.includes("youtube.com/watch")) return source.replace("watch?v=", "embed/");
        if (source.includes("youtu.be/")) return source.replace("youtu.be/", "youtube.com/embed/");
        return source;
      };
      return (
        <iframe className="w-full max-w-sm aspect-video rounded-xl mt-3 border border-slate-200 dark:border-slate-800" src={getEmbedUrl(url)} allowFullScreen />
      );
    }
    return <img src={url} alt="Media" className="max-w-sm max-h-[250px] object-contain rounded-xl mt-3 border border-slate-200 dark:border-slate-800" />;
  };

  const ActionCheckboxList = ({ title, icon, items, selectedIds, field, listName = "sharedWithIds" }: any) => (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
        <span className="material-symbols-outlined text-sm">{icon}</span> {title}
      </label>
      {items.length === 0 ? (
        <p className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 text-center">No records available.</p>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 max-h-44 overflow-y-auto space-y-2 custom-scrollbar">
          {items.map((item: any) => {
            const checked = selectedIds.includes(item.id);
            return (
              <label key={item.id} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${checked ? "bg-secondary/10 border border-secondary/30" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
                <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition-all ${checked ? "bg-secondary border-secondary" : "border-slate-300 dark:border-slate-600"}`}>
                  {checked && <span className="material-symbols-outlined text-white text-[12px]">check</span>}
                </div>
                <input type="checkbox" className="hidden" checked={checked} onChange={() => toggleShare(item.id, field, listName)} />
                <div>
                  <p className="font-bold text-sm">{item.name}</p>
                  {item.username && <p className="text-xs text-slate-400">@{item.username}</p>}
                  {item.level && <p className="text-[10px] text-slate-400 font-bold uppercase">{item.level} - Kelas {item.grade}</p>}
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#0a0f14] selection:bg-primary/30 text-slate-800 dark:text-slate-200">
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-gradient-to-br from-primary/20 to-secondary/10 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-gradient-to-tl from-tertiary/20 to-primary/10 blur-[130px] rounded-full pointer-events-none z-0"></div>

      <div className="flex w-full bg-white/40 dark:bg-black/40 backdrop-blur-xl relative z-10 shadow-2xl">
        <aside className="w-[300px] flex flex-col pt-10 border-r border-slate-200/50 dark:border-slate-800/50 shrink-0">
          <div className="px-8 mb-12">
            <h2 className="text-2xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent tracking-tighter">Teacher Hub</h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">CBT Tabgha</p>
          </div>
          <nav className="flex-1 px-4 space-y-2">
            {[ { id: "DASHBOARD", icon: "dashboard", label: "Overview" }, { id: "QUESTION_BANK", icon: "quiz", label: "Question Bank" }, { id: "EXAMS", icon: "history_edu", label: "Exam Schedule" }].map((tab: any) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all duration-300 ${activeTab === tab.id ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/30 translate-x-2" : "text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-white"}`}>
                <span className="material-symbols-outlined text-[22px]">{tab.icon}</span> {tab.label}
              </button>
            ))}
          </nav>
          <div className="px-6 mt-auto pb-10">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold bg-error/10 text-error hover:bg-error/20 hover:-translate-y-1 transition-all">
              <span className="material-symbols-outlined">logout</span> Session Logout
            </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          <header className="px-12 py-10 flex justify-between items-end shrink-0 border-b border-slate-200/30 dark:border-slate-800/30 bg-white/30 dark:bg-black/20 backdrop-blur-md">
            <div>
              <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {activeTab === "DASHBOARD" ? `Welcome, ${currentUserName.split(" ")[0]}.` : activeTab === "QUESTION_BANK" ? "Knowledge Vault" : "Exam Schedule"}
              </h1>
              <p className="text-slate-500 font-medium mt-3 text-lg">
                {activeTab === "DASHBOARD" ? "Empowering minds through structured evaluations." : activeTab === "QUESTION_BANK" ? "Build and curate questions, essays, and media." : "Deploy and monitor active term examinations."}
              </p>
            </div>
            <div className="flex gap-4">
              {activeTab === "QUESTION_BANK" && (
                <button onClick={() => setShowSubjectModal(true)} className="px-6 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-sm">
                  <span className="material-symbols-outlined">library_add</span> New Subject
                </button>
              )}
              {activeTab === "EXAMS" && (
                <button onClick={() => setShowExamModal(true)} className="px-6 py-3 bg-gradient-to-r from-secondary to-tertiary text-white rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-lg shadow-secondary/20">
                  <span className="material-symbols-outlined">edit_calendar</span> Schedule Exam
                </button>
              )}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
            {activeTab === "DASHBOARD" && (
              <div className="space-y-10 animate-in fade-in duration-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-primary to-primary/80 p-8 rounded-3xl text-white shadow-xl shadow-primary/20 relative overflow-hidden transition-transform hover:-translate-y-2">
                    <span className="material-symbols-outlined absolute top-2 right-2 text-[150px] opacity-[0.05] -rotate-12">history_edu</span>
                    <p className="text-white/80 font-bold uppercase tracking-widest text-xs mb-2">Total Exams</p>
                    <h3 className="text-6xl font-black">{exams.length}</h3>
                  </div>
                  <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden transition-transform hover:-translate-y-2">
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-2">Total Subjects</p>
                    <h3 className="text-6xl font-black">{subjects.length}</h3>
                  </div>
                  <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden transition-transform hover:-translate-y-2">
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-2">Total Questions</p>
                    <h3 className="text-6xl font-black">{totalQuestions}</h3>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "QUESTION_BANK" && (
              <div className="flex gap-8 h-full animate-in fade-in duration-700 w-full relative">
                <div className="w-[380px] flex flex-col gap-4">
                  <h3 className="font-bold text-slate-500 uppercase tracking-widest text-xs mb-2">Subject Categories</h3>
                  <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1 pb-10">
                    {subjects.length === 0 ? <p className="text-slate-400 p-6 text-center border-dashed border rounded-3xl">No subjects found</p> : subjects.map(s => (
                      <button key={s.id} onClick={() => setActiveSubject(s)} className={`w-full text-left p-5 rounded-3xl border transition-all ${activeSubject?.id === s.id ? "bg-white dark:bg-slate-800 border-primary shadow-xl ring-2 ring-primary/20" : "bg-white/50 dark:bg-slate-900/50 hover:bg-white"}`}>
                        <div className="flex justify-between items-start mb-2"><h4 className="font-bold text-lg leading-tight">{s.name}</h4><span className="text-[10px] uppercase bg-slate-200 dark:bg-slate-700 px-2 rounded-md font-bold">{s.level}</span></div>
                        <p className="text-xs text-slate-500 font-semibold">{s._count?.questions} Questions</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl border shadow-xl flex flex-col overflow-hidden relative min-w-0">
                  {!activeSubject ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400"><span className="material-symbols-outlined text-6xl opacity-20 mb-4">library_books</span>Select a subject to view its questions</div>
                  ) : (
                    <>
                      <div className="px-8 py-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white/40 dark:bg-black/20">
                        <h3 className="font-black text-2xl truncate pr-4">{activeSubject.name}</h3>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => handleDuplicateSubject(activeSubject.id, activeSubject.name, activeSubject.level)} className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Duplicate Subject">
                            <span className="material-symbols-outlined text-sm">content_copy</span>
                          </button>
                          <button onClick={() => handleDeleteSubject(activeSubject.id, activeSubject.name)} className="px-4 py-2.5 bg-rose-50 dark:bg-rose-900/20 text-rose-500 font-bold rounded-xl flex items-center gap-2 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors" title="Delete Subject">
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                          <button onClick={openNewQuestion} className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl flex items-center gap-2 hover:scale-105 transition-transform"><span className="material-symbols-outlined text-sm">add</span> Add Question</button>
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-6">
                        {fetching ? <p className="text-center font-bold text-slate-400 animate-pulse">Loading...</p> : questions.length === 0 ? <p className="text-center py-20 text-slate-400 border border-dashed rounded-2xl">This subject has no questions.</p> : questions.map((q, i) => (
                          <div key={q.id} className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border relative group hover:border-[#004253]/30 transition-all">
                            {/* Action Menu */}
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEditQuestion(q)} className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-slate-600 dark:text-slate-300 transition-colors" title="Edit Question">
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>
                              <button onClick={() => handleDeleteQuestion(q.id)} className="p-2 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-lg text-rose-500 transition-colors" title="Delete Question">
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>

                            <span className="absolute -left-3 -top-3 w-8 h-8 rounded-full bg-slate-900 text-white font-black flex items-center justify-center text-xs shadow-lg">{i + 1}</span>
                            
                            <span className={`inline-flex items-center text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md mb-4 ${q.type === 'ESSAY' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary'}`}>
                              {q.type === 'ESSAY' ? 'Essay' : 'Multiple Choice'}
                            </span>
                            
                            <p className="font-medium text-lg text-slate-800 dark:text-slate-200 mb-4 whitespace-pre-wrap leading-relaxed pr-16">{q.text}</p>
                            
                            {q.mediaUrl && <MediaViewer url={q.mediaUrl} type={q.mediaType || "image"} />}

                            {q.type === 'MULTIPLE_CHOICE' && q.options && q.options.length > 0 && (
                              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/50">
                                {q.options.map((opt: any) => (
                                  <div key={opt.id} className={`p-4 rounded-xl border-2 flex flex-col gap-3 transition-colors ${opt.isCorrect ? "bg-green-50 dark:bg-green-900/20 border-green-500" : "bg-slate-50 dark:bg-slate-900 border-transparent"}`}>
                                    <div className="flex items-center gap-4">
                                      <span className={`w-6 h-6 rounded flex items-center justify-center shrink-0 font-bold text-xs ${opt.isCorrect ? "bg-green-500 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}>{opt.id}</span>
                                      <span className={`font-medium text-sm leading-snug flex-1 ${opt.isCorrect ? "text-green-900 dark:text-green-300" : "text-slate-600 dark:text-slate-400"}`}>{opt.text}</span>
                                      {opt.isCorrect && <span className="material-symbols-outlined text-green-600 shrink-0">check_circle</span>}
                                    </div>
                                    {opt.mediaUrl && <MediaViewer url={opt.mediaUrl} type="image" />}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === "EXAMS" && (
              <div className="animate-in fade-in duration-700">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {exams.length === 0 ? <p className="col-span-full p-20 text-center border border-dashed rounded-3xl">No exams scheduled.</p> : exams.map(ex => (
                    <div key={ex.id} className="bg-white/80 dark:bg-slate-800/80 p-6 rounded-3xl shadow-xl hover:-translate-y-2 transition-transform">
                      <span className="text-[10px] font-black uppercase bg-slate-900 text-white px-3 py-1.5 rounded-md mb-4 inline-block">{ex.term} • {ex.level}</span>
                      <h3 className="font-black text-2xl mb-1">{ex.title}</h3>
                      <p className="text-sm font-semibold text-slate-500 mb-2">{ex.subject?.name}</p>
                      <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                        <span className="font-bold text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-lg">{ex.durationMin} Min</span>
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${ex.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{ex.status}</span>
                      </div>
                      {ex.classRooms && ex.classRooms.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex flex-wrap gap-1">
                          {ex.classRooms.map((cr: any) => (
                            <span key={cr.id} className="text-[10px] font-bold bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded">{cr.name}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ════════ QUESTION MODAL ════════ */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 lg:p-10 max-w-4xl w-full shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <div>
                <h3 className="font-black text-3xl">{newQ.id ? "Edit Question" : "Compose Question"}</h3>
                <p className="text-secondary font-bold mt-1 text-sm">{activeSubject?.name}</p>
              </div>
              <button onClick={() => setShowQuestionModal(false)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 transition-colors"><span className="material-symbols-outlined">close</span></button>
            </div>
            
            <form onSubmit={handleSaveQuestion} className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-6">
              
              <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                <label className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-3 block">Question Format</label>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setNewQ({ ...newQ, type: "MULTIPLE_CHOICE" })} className={`px-5 py-3 rounded-xl font-bold flex-1 transition-all flex items-center justify-center gap-2 ${newQ.type === "MULTIPLE_CHOICE" ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800"}`}>
                    <span className="material-symbols-outlined">list_alt</span> Multiple Choice
                  </button>
                  <button type="button" onClick={() => setNewQ({ ...newQ, type: "ESSAY" })} className={`px-5 py-3 rounded-xl font-bold flex-1 transition-all flex items-center justify-center gap-2 ${newQ.type === "ESSAY" ? "bg-amber-500 text-white shadow-md shadow-amber-500/20" : "bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800"}`}>
                    <span className="material-symbols-outlined">notes</span> Essay
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold uppercase tracking-widest text-slate-500">Question Text</label>
                <textarea required rows={4} value={newQ.text} onChange={e => setNewQ({ ...newQ, text: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 font-medium outline-none focus:ring-4 focus:ring-primary/20 transition-all resize-none text-lg" placeholder="Write the question body here..." />
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] md:grid-cols-2 gap-4 items-end">
                <div className="space-y-2 relative">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Attach Media URL / File</label>
                  <div className="flex">
                    <input type="url" value={newQ.mediaUrl} onChange={e => setNewQ({ ...newQ, mediaUrl: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-l-xl py-3 px-4 outline-none focus:ring-2 focus:ring-primary/30 text-sm" placeholder="https://..." />
                    <label className={`cursor-pointer bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold px-4 flex items-center justify-center rounded-r-xl border border-l-0 border-slate-200 dark:border-slate-800 hover:bg-slate-300 transition-colors ${uploadingMedia ? "opacity-50 pointer-events-none" : ""}`}>
                      <span className="material-symbols-outlined text-sm mr-2">upload</span> Upload
                      <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => handleMediaUpload(e, "question")} disabled={uploadingMedia} />
                    </label>
                  </div>
                </div>
                {newQ.mediaUrl && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Media Type</label>
                    <select value={newQ.mediaType} onChange={e => setNewQ({ ...newQ, mediaType: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-primary/30 font-bold text-sm">
                      <option value="image">Image Display</option>
                      <option value="video">Video Embed / Video Render</option>
                    </select>
                  </div>
                )}
              </div>

              {newQ.type === "MULTIPLE_CHOICE" && (
                <div className="space-y-4 pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2"><span className="material-symbols-outlined text-sm">checklist</span> Options &amp; Correct Answer</label>
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs px-2 py-1 rounded font-bold">{newQ.options.length} Options</span>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={removeOption} disabled={newQ.options.length <= 2} className="w-8 h-8 flex items-center justify-center bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-lg disabled:opacity-30 tooltip"><span className="material-symbols-outlined text-sm">remove</span></button>
                      <button type="button" onClick={addOption} disabled={newQ.options.length >= 10} className="w-8 h-8 flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg disabled:opacity-30"><span className="material-symbols-outlined text-sm">add</span></button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {newQ.options.map((opt, i) => (
                      <div key={opt.id} className={`flex flex-col border-[3px] rounded-2xl overflow-hidden transition-all bg-slate-50 dark:bg-slate-950 focus-within:border-primary/50 relative ${opt.isCorrect ? "border-green-500 shadow-lg shadow-green-500/10" : "border-slate-200 dark:border-slate-800"}`}>
                        <div className="flex items-stretch border-b border-slate-200 dark:border-slate-800/50">
                          <label className={`cursor-pointer w-14 shrink-0 flex items-center justify-center border-r border-slate-200 dark:border-slate-800/50 transition-colors ${opt.isCorrect ? "bg-green-500" : "bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800"}`}>
                            <input type="radio" name="correct_answer" checked={opt.isCorrect} onChange={() => setCorrectOption(i)} className="hidden" />
                            {opt.isCorrect ? <span className="material-symbols-outlined text-white">check_circle</span> : <span className="font-black text-xl text-slate-400">{opt.id}</span>}
                          </label>
                          <textarea rows={2} required value={opt.text} onChange={e => updateOption(i, "text", e.target.value)} placeholder={`Text for Option ${opt.id}...`} className="flex-1 w-full bg-transparent py-3 px-4 font-semibold outline-none resize-none align-middle text-sm" />
                        </div>
                        <div className="flex items-stretch px-4 py-2 bg-slate-50 dark:bg-slate-900/50 relative">
                          <span className="material-symbols-outlined text-[14px] text-slate-400 mr-2 flex items-center">image</span>
                          <input type="url" value={opt.mediaUrl || ""} onChange={e => updateOption(i, "mediaUrl", e.target.value)} className="flex-1 min-w-0 bg-transparent outline-none text-xs text-slate-500 dark:text-slate-400 font-mono py-1" placeholder="Image URL (optional)..." />
                          <label className={`cursor-pointer flex items-center justify-center px-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 rounded text-[10px] font-bold tracking-widest uppercase transition-colors shrink-0 ml-2 ${uploadingMedia ? "opacity-50 pointer-events-none" : ""}`}>
                            <span className="material-symbols-outlined text-[12px] mr-1">upload</span> Local File
                            <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => handleMediaUpload(e, "option", i)} disabled={uploadingMedia} />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-8 shrink-0 flex justify-end sticky bottom-0 bg-white dark:bg-slate-900 pb-4">
                <button type="submit" disabled={uploadingMedia} className="bg-primary text-white font-black px-12 py-5 rounded-2xl shadow-xl hover:bg-primary/90 hover:scale-[1.03] active:scale-95 transition-all text-lg flex items-center gap-3 disabled:opacity-50">
                  <span className="material-symbols-outlined">{newQ.id ? "save" : "library_add_check"}</span> {newQ.id ? "Save Changes" : "Publish Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════ SUBJECT/EXAM MODALS ════════ */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 max-w-md w-full shadow-2xl relative">
            <h3 className="font-black text-2xl mb-6 text-slate-800 dark:text-white">New Subject</h3>
            <form onSubmit={handleCreateSubject} className="space-y-5">
              <input required autoFocus value={newSub.name} onChange={e => setNewSub({ ...newSub, name: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-2xl py-4 px-5 font-medium outline-none" placeholder="e.g. Mathematics" />
              <select value={newSub.level} onChange={e => setNewSub({ ...newSub, level: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-2xl py-4 px-5 font-bold outline-none">
                <option value="SD">SD</option><option value="SMP">SMP</option><option value="SMA">SMA</option><option value="SMK">SMK</option>
              </select>
              <ActionCheckboxList title="Share with Other Teachers" icon="group" items={teachers} selectedIds={newSub.sharedWithIds} field="newSub" listName="sharedWithIds" />
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowSubjectModal(false)} className="flex-1 font-bold py-4 text-slate-500">Cancel</button>
                <button type="submit" className="flex-[2] bg-primary text-white font-bold py-4 rounded-2xl">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showExamModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 max-w-xl w-full shadow-2xl max-h-[90vh] flex flex-col">
            <h3 className="font-black text-3xl mb-6 shrink-0 text-slate-800 dark:text-slate-100">Schedule Exam</h3>
            <form onSubmit={handleCreateExam} className="space-y-5 overflow-y-auto pr-1 custom-scrollbar">
              <input required autoFocus value={newEx.title} onChange={e => setNewEx({ ...newEx, title: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-2xl py-4 px-5 font-medium outline-none" placeholder="Exam Title..." />
              <div className="grid grid-cols-2 gap-6">
                <select required value={newEx.subjectId} onChange={e => setNewEx({ ...newEx, subjectId: e.target.value })} className="w-full bg-slate-50 border rounded-2xl py-4 px-5 font-bold outline-none">
                  <option value="" disabled>Select Subject...</option>
                  {subjects.map((s:any) => <option key={s.id} value={s.id}>{s.name} ({s.level})</option>)}
                </select>
                <input required min="10" type="number" value={newEx.durationMin} onChange={e => setNewEx({ ...newEx, durationMin: Number(e.target.value) })} className="w-full bg-slate-50 border rounded-2xl py-4 px-5 font-black outline-none placeholder-slate-400" placeholder="Duration (Min)" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <ActionCheckboxList title="Assign to Classrooms" icon="meeting_room" items={classRooms} selectedIds={newEx.classRoomIds} field="newEx" listName="classRoomIds" />
                 <ActionCheckboxList title="Share with Teachers" icon="group" items={teachers} selectedIds={newEx.sharedWithIds} field="newEx" listName="sharedWithIds" />
              </div>

              <div className="flex gap-4 pt-4 mt-6 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setShowExamModal(false)} className="flex-1 font-bold py-4 text-slate-500">Cancel</button>
                <button type="submit" disabled={newEx.classRoomIds.length === 0} className="flex-[3] bg-gradient-to-r from-secondary to-tertiary text-white font-black py-4 rounded-2xl text-lg disabled:opacity-50 disabled:grayscale transition-all">Publish Exam</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
