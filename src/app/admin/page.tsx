"use client";

import { useState, useEffect } from "react";

type Tab = "DASHBOARD" | "USERS" | "CLASSES" | "SETTINGS";

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  TEACHER: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  STUDENT: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("DASHBOARD");
  const [newUserRole, setNewUserRole] = useState<"STUDENT" | "TEACHER" | "ADMIN">("STUDENT");

  const [dialog, setDialog] = useState<{isOpen: boolean, title: string, message: string, type: "confirm"|"alert"|"danger", onConfirm?: () => void}>({isOpen: false, title: "", message: "", type: "alert"});
  const showConfirm = (title: string, message: string, onConfirm: () => void, type: "confirm"|"danger" = "confirm") => setDialog({isOpen: true, title, message, type, onConfirm});
  const showAlert = (title: string, message: string, type: "alert"|"danger" = "alert") => setDialog({isOpen: true, title, message, type});

  // User form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [level, setLevel] = useState("SD");
  const [classRoomId, setClassRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<any>(null);
  const [showManual, setShowManual] = useState(false);

  const [users, setUsers] = useState<any[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userFilter, setUserFilter] = useState<"ALL" | "ADMIN" | "TEACHER" | "STUDENT">("ALL");

  const [stats, setStats] = useState({ studentCount: 0, teacherCount: 0, examCount: 0 });
  const [settings, setSettings] = useState({ schoolName: "", activeTerm: "UTS_1" });
  const [settingsLoading, setSettingsLoading] = useState(false);

  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [newClassroom, setNewClassroom] = useState({ level: "SD", grade: 1, name: "" });

  useEffect(() => {
    if (activeTab === "DASHBOARD") fetchStats();
    if (activeTab === "USERS") { fetchUsers(); fetchClassrooms(); }
    if (activeTab === "SETTINGS") fetchSettings();
    if (activeTab === "CLASSES") fetchClassrooms();
  }, [activeTab]);

  const fetchStats = async () => {
    try { const res = await fetch("/api/stats"); const d = await res.json(); if (res.ok) setStats(d); } catch {}
  };
  const fetchUsers = async () => {
    setFetchingUsers(true);
    try { const res = await fetch("/api/users"); const d = await res.json(); if (res.ok) setUsers(d.users); } catch {}
    setFetchingUsers(false);
  };
  const fetchSettings = async () => {
    try { const res = await fetch("/api/settings"); const d = await res.json(); if (res.ok && d.settings) setSettings(d.settings); } catch {}
  };
  const fetchClassrooms = async () => {
    try { const res = await fetch("/api/classrooms"); const d = await res.json(); if (res.ok && d.classrooms) setClassrooms(d.classrooms); } catch {}
  };

  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/classrooms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newClassroom) });
      if (res.ok) { setNewClassroom({ level: "SD", grade: 1, name: "" }); fetchClassrooms(); }
    } catch {}
  };

  const handleDeleteClassroom = async (id: string, name: string) => {
    showConfirm("Delete Classroom", `Are you sure you want to delete ${name}?`, async () => {
      try { const res = await fetch(`/api/classrooms?id=${id}`, { method: "DELETE" }); if (res.ok) fetchClassrooms(); } catch {}
    }, "danger");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(""); setSuccessData(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, role: newUserRole, email, level: newUserRole === "STUDENT" ? level : undefined, classRoomId: newUserRole === "STUDENT" && classRoomId ? classRoomId : undefined, username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register");
      setSuccessData(data.user);
      setName(""); setEmail(""); setUsername(""); setPassword(""); setClassRoomId("");
      fetchUsers();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleDeleteUser = async (id: string, username: string) => {
    showConfirm("Delete Account", `Are you sure you want to delete @${username}?`, async () => {
      try {
        const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
        if (res.ok) fetchUsers(); else showAlert("Action Failed", "Cannot delete master admin account", "danger");
      } catch {}
    }, "danger");
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault(); setSettingsLoading(true);
    try {
      await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
    } catch {}
    setSettingsLoading(false);
  };

  const handleLogout = () => {
    document.cookie = "role=; path=/; max-age=0;";
    document.cookie = "userId=; path=/; max-age=0;";
    document.cookie = "userName=; path=/; max-age=0;";
    window.location.href = "/";
  };

  const exportToExcel = async (data: any[], filename: string) => {
    if (data.length === 0) return;
    const ExcelJS = (await import("exceljs")).default;
    const { saveAs } = await import("file-saver");
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Users");
    ws.columns = [{ header: "Username", key: "username", width: 20 }, { header: "Name", key: "name", width: 30 }, { header: "Role", key: "role", width: 15 }, { header: "Details", key: "details", width: 25 }];
    ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF004253" } };
    data.forEach((u, i) => { const row = ws.addRow({ username: u.username, name: u.name, role: u.role, details: u.level || u.email || "-" }); if (i % 2 === 0) row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F7F9" } }; });
    const buf = await wb.xlsx.writeBuffer(); saveAs(new Blob([buf]), `${filename}.xlsx`);
  };

  const exportToPDF = async (data: any[], filename: string) => {
    if (data.length === 0) return;
    const jsPDF = (await import("jspdf")).default;
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();
    doc.setFontSize(18); doc.setTextColor(0, 66, 83); doc.text("Tabgha CBT - All Users Directory", 14, 22);
    autoTable(doc, { head: [["Username", "Name", "Role", "Details"]], body: data.map(u => [u.username, u.name, u.role, u.level || u.email || "-"]), startY: 30, theme: "striped", headStyles: { fillColor: [0, 66, 83], textColor: [255, 255, 255] }, alternateRowStyles: { fillColor: [240, 247, 249] } });
    doc.save(`${filename}.pdf`);
  };

  const filteredUsers = userFilter === "ALL" ? users : users.filter(u => u.role === userFilter);

  // State for Bulk Import
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [lang, setLang] = useState<"EN" | "ID">("EN");

  useEffect(() => {
    const t = localStorage.getItem("theme");
    if (t === "dark" || (!t && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setTheme("dark"); document.documentElement.classList.add("dark");
    }
    const l = localStorage.getItem("lang") as "EN" | "ID";
    if (l) setLang(l);
  }, []);

  const toggleTheme = () => {
    const n = theme === "light" ? "dark" : "light";
    setTheme(n);
    localStorage.setItem("theme", n);
    if (n === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  const toggleLang = () => {
    const n = lang === "EN" ? "ID" : "EN";
    setLang(n);
    localStorage.setItem("lang", n);
  };

  const downloadCSVTemplate = () => {
    const csvData = "Name,Username,Password,Role,Level,Grade,ClassName\nJohn Doe,johndoe123,pass123,STUDENT,SMA,10,A\nJane Smith,teacherjane,pass123,TEACHER,,,";
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Tabgha_Bulk_Users_Template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleImportUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return showAlert("Error", "Please select a CSV file first.", "danger");
    setImporting(true);
    
    const formData = new FormData();
    formData.append("file", importFile);

    try {
      const res = await fetch("/api/admin/users/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to import");
      
      showAlert("Import Success", `Successfully registered ${data.imported} users. (Skipped: ${data.skipped} duplicates/invalids)`);
      setShowImportModal(false);
      setImportFile(null);
      fetchStats();
      fetchUsers();
    } catch (err: any) {
      showAlert("Import Failed", err.message, "danger");
    } finally {
      setImporting(false);
    }
  };

  const NAV_ITEMS: { id: Tab; icon: string; label: string; sublabel?: string }[] = [
    { id: "DASHBOARD", icon: "bar_chart_4_bars", label: lang === "ID" ? "Dasbor Utama" : "Dashboard", sublabel: lang === "ID" ? "Ringkasan Sistem" : "System overview" },
    { id: "USERS", icon: "manage_accounts", label: lang === "ID" ? "Manajemen Pengguna" : "User Management", sublabel: lang === "ID" ? "Peran & Akun" : "Roles & accounts" },
    { id: "CLASSES", icon: "meeting_room", label: lang === "ID" ? "Master Kelas" : "Class & Rooms", sublabel: lang === "ID" ? "Pemetaan Ruangan" : "Room mapping" },
    { id: "SETTINGS", icon: "settings", label: lang === "ID" ? "Pengaturan Global" : "System Settings", sublabel: lang === "ID" ? "Konfigurasi Sistem" : "Global config" },
  ];

  return (
    <div className="flex min-h-screen bg-[#f4f6fa] dark:bg-[#0d1117] text-slate-800 dark:text-slate-200">

      {/* ══════════════════ SIDEBAR ══════════════════ */}
      <aside className="w-72 fixed left-0 top-0 h-screen flex flex-col bg-white dark:bg-[#161b22] border-r border-slate-200 dark:border-slate-800 shadow-xl z-40">
        {/* Logo */}
        <div className="px-7 pt-8 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#004253] to-[#00738f] flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-white text-lg">school</span>
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight leading-none">Tabgha CBT</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin Console</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all duration-200 group ${active ? "bg-[#004253] text-white shadow-lg shadow-[#004253]/20" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"}`}
              >
                <span className={`material-symbols-outlined text-xl shrink-0 transition-transform ${active ? "text-white" : "text-slate-400 group-hover:text-[#004253] dark:group-hover:text-[#00afd1] group-hover:scale-110"}`}>
                  {item.icon}
                </span>
                <div className="min-w-0">
                  <p className={`font-bold text-sm leading-none truncate ${active ? "text-white" : ""}`}>{item.label}</p>
                  {item.sublabel && <p className={`text-[10px] mt-0.5 truncate ${active ? "text-white/70" : "text-slate-400"}`}>{item.sublabel}</p>}
                </div>
                {active && <span className="ml-auto material-symbols-outlined text-white/60 text-sm">chevron_right</span>}
              </button>
            );
          })}

          <div className="pt-2 pb-1 mt-2">
            <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{lang === "ID" ? "Preferensi" : "Preferences"}</p>
          </div>
          <div className="px-4 flex gap-2 mb-2">
            <button onClick={toggleTheme} className="flex-1 flex items-center justify-center py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300 tooltip" title="Toggle Dark/Light Mode">
              <span className="material-symbols-outlined text-lg">{theme === "dark" ? "light_mode" : "dark_mode"}</span>
            </button>
            <button onClick={toggleLang} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300 font-black text-xs tooltip" title="Change Language">
              <span className="material-symbols-outlined text-lg">translate</span> {lang}
            </button>
          </div>

          <div className="pt-2 pb-1 border-t border-slate-100 dark:border-slate-800/50">
            <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{lang === "ID" ? "Bantuan" : "Support"}</p>
          </div>

          <button onClick={() => setShowManual(true)} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white transition-all group">
            <span className="material-symbols-outlined text-xl text-slate-400 shrink-0 group-hover:text-amber-500 group-hover:scale-110 transition-transform">menu_book</span>
            <div>
              <p className="font-bold text-sm leading-none">{lang === "ID" ? "Buku Panduan" : "User Guide"}</p>
              <p className="text-[10px] mt-0.5 text-slate-400">{lang === "ID" ? "Manual & dokumentasi" : "Manual & documentation"}</p>
            </div>
          </button>
        </nav>

        {/* Stats footer */}
        <div className="px-4 py-4 border-t border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: "Students", value: stats.studentCount, color: "text-sky-600" },
              { label: "Teachers", value: stats.teacherCount, color: "text-violet-600" },
              { label: "Exams", value: stats.examCount, color: "text-emerald-600" },
            ].map(s => (
              <div key={s.label} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 text-center">
                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors">
            <span className="material-symbols-outlined text-sm">logout</span> {lang === "ID" ? "Keluar Sistem" : "Sign Out"}
          </button>
        </div>
      </aside>

      {/* ══════════════════ MAIN CONTENT ══════════════════ */}
      <main className="ml-72 flex-1 min-h-screen p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* Page Header */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                {NAV_ITEMS.find(n => n.id === activeTab)?.sublabel}
              </p>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {NAV_ITEMS.find(n => n.id === activeTab)?.label}
              </h1>
            </div>
            {activeTab === "DASHBOARD" && (
              <button onClick={async () => {
                const ExcelJS = (await import("exceljs")).default;
                const { saveAs } = await import("file-saver");
                const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet("Stats");
                ws.columns = [{ header: "Metric", key: "m", width: 20 }, { header: "Value", key: "v", width: 15 }];
                ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
                ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF004253" } };
                ws.addRow({ m: "Total Students", v: stats.studentCount });
                ws.addRow({ m: "Teachers", v: stats.teacherCount });
                ws.addRow({ m: "Active Exams", v: stats.examCount });
                const buf = await wb.xlsx.writeBuffer(); saveAs(new Blob([buf]), "dashboard_stats.xlsx");
              }} className="flex items-center gap-2 px-4 py-2.5 bg-[#004253] text-white rounded-xl font-bold text-sm shadow-lg hover:bg-[#005f74] active:scale-95 transition-all">
                <span className="material-symbols-outlined text-sm">table</span> {lang === "ID" ? "Ekspor Statistik" : "Export Stats"}
              </button>
            )}
          </div>

          {/* ── DASHBOARD ── */}
          {activeTab === "DASHBOARD" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  { label: "Total Students", value: stats.studentCount, icon: "school", gradient: "from-sky-500 to-blue-600" },
                  { label: "Active Teachers", value: stats.teacherCount, icon: "supervisor_account", gradient: "from-violet-500 to-purple-600" },
                  { label: "Scheduled Exams", value: stats.examCount, icon: "assignment", gradient: "from-emerald-500 to-teal-600" },
                ].map(card => (
                  <div key={card.label} className={`bg-gradient-to-br ${card.gradient} p-6 rounded-2xl text-white shadow-xl relative overflow-hidden hover:-translate-y-1 transition-transform`}>
                    <span className="material-symbols-outlined absolute right-4 bottom-3 text-[80px] text-white/10">{card.icon}</span>
                    <span className="material-symbols-outlined text-3xl text-white/80 mb-3 block">{card.icon}</span>
                    <p className="text-white/70 text-xs font-bold uppercase tracking-widest">{card.label}</p>
                    <p className="text-5xl font-black mt-1">{card.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#004253]">info</span> Quick Reference
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="material-symbols-outlined text-sky-500 mt-0.5">manage_accounts</span>
                    <div><p className="font-bold text-slate-800 dark:text-slate-200">User Management</p><p>Register students, teachers, and admin accounts with custom credentials.</p></div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="material-symbols-outlined text-violet-500 mt-0.5">meeting_room</span>
                    <div><p className="font-bold text-slate-800 dark:text-slate-200">Class & Rooms</p><p>Define classroom mappings and assign students to physical rooms by grade.</p></div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="material-symbols-outlined text-emerald-500 mt-0.5">settings</span>
                    <div><p className="font-bold text-slate-800 dark:text-slate-200">System Settings</p><p>Set the active academic term and institution name for exam blueprints.</p></div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="material-symbols-outlined text-amber-500 mt-0.5">share</span>
                    <div><p className="font-bold text-slate-800 dark:text-slate-200">Teacher Sharing</p><p>Teachers can share subjects & exams with colleagues via the Teacher Portal.</p></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── USERS ── */}
          {activeTab === "USERS" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

              {/* Registration Form */}
              <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-7 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#004253] dark:text-[#00afd1]">person_add</span>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Enroll New Member</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Add a new administrator, teacher, or student to the system.</p>
                  </div>
                </div>
                <div className="p-7">
                  {error && <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 rounded-xl text-sm font-bold border border-rose-200 dark:border-rose-800 flex items-center gap-2"><span className="material-symbols-outlined text-sm">error</span>{error}</div>}
                  {successData && (
                    <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2"><span className="material-symbols-outlined text-sm">check_circle</span>Registration Successful!</h4>
                        <p className="text-sm font-mono mt-1 text-emerald-700 dark:text-emerald-400">User: <strong>{successData.username}</strong> | Password: <strong>{successData.plainPassword}</strong></p>
                      </div>
                      <button onClick={() => setSuccessData(null)} className="text-emerald-600 hover:text-emerald-800 shrink-0"><span className="material-symbols-outlined text-sm">close</span></button>
                    </div>
                  )}

                  <form onSubmit={handleRegister} className="space-y-5">
                    {/* Role Tabs */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Role</label>
                      <div className="flex gap-2">
                        {(["STUDENT", "TEACHER", "ADMIN"] as const).map(r => (
                          <button type="button" key={r} onClick={() => setNewUserRole(r)}
                            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-all ${newUserRole === r ? "bg-[#004253] text-white shadow-md" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"}`}>
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Full Name *</label>
                        <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Budi Santoso" className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#004253] transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">{newUserRole === "STUDENT" ? "Level *" : "Email"}</label>
                        {newUserRole === "STUDENT" ? (
                          <select value={level} onChange={e => { setLevel(e.target.value); setClassRoomId(""); }} className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#004253] transition-all">
                            <option value="SD">SD</option><option value="SMP">SMP</option><option value="SMA">SMA</option><option value="SMK">SMK</option>
                          </select>
                        ) : (
                          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@school.ac.id" className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#004253] transition-all" />
                        )}
                      </div>
                      {newUserRole === "STUDENT" && (
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Classroom (optional)</label>
                          <select value={classRoomId} onChange={e => setClassRoomId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-[#004253] transition-all">
                            <option value="">No Room Assigned</option>
                            {classrooms.filter(cr => cr.level === level).map(cr => (
                              <option key={cr.id} value={cr.id}>Grade {cr.grade} - {cr.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Username *</label>
                        <input required value={username} onChange={e => setUsername(e.target.value)} placeholder="unique_username" className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#004253] transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Password *</label>
                        <input required value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 6 characters" className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#004253] transition-all" />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button disabled={loading} type="submit" className="flex items-center gap-2 px-6 py-3 bg-[#004253] text-white font-bold rounded-xl text-sm shadow-md hover:bg-[#005f74] active:scale-95 transition-all disabled:opacity-50">
                        <span className="material-symbols-outlined text-sm">how_to_reg</span>
                        {loading ? "Registering..." : `Register ${newUserRole}`}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-7 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3 justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#004253] dark:text-[#00afd1]">group</span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">All Users Directory</h3>
                    <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full font-bold">{filteredUsers.length}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Filter tabs */}
                    {(["ALL", "STUDENT", "TEACHER", "ADMIN"] as const).map(f => (
                      <button key={f} onClick={() => setUserFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${userFilter === f ? "bg-[#004253] text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"}`}>
                        {f}
                      </button>
                    ))}
                    <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                    <button onClick={fetchUsers} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500" title="Refresh">
                      <span className="material-symbols-outlined text-sm">refresh</span>
                    </button>
                    <button onClick={() => exportToExcel(users, "tabgha_users")} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg font-bold text-xs shadow hover:bg-emerald-700 transition-colors">
                      <span className="material-symbols-outlined text-sm">table_view</span> Excel
                    </button>
                    <button onClick={() => exportToPDF(users, "tabgha_users")} className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 text-white rounded-lg font-bold text-xs shadow hover:bg-rose-700 transition-colors">
                      <span className="material-symbols-outlined text-sm">picture_as_pdf</span> PDF
                    </button>
                    <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                    <button onClick={() => setShowImportModal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg font-bold text-xs shadow hover:bg-indigo-700 transition-colors tooltip" title="Mass Register Users">
                      <span className="material-symbols-outlined text-sm">upload_file</span> Bulk Register
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                        <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">User</th>
                        <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Role</th>
                        <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Details</th>
                        <th className="px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {fetchingUsers ? (
                        <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400 animate-pulse">Loading directory…</td></tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400">No users found.</td></tr>
                      ) : filteredUsers.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#004253]/10 dark:bg-[#004253]/30 flex items-center justify-center shrink-0">
                                <span className="text-[#004253] dark:text-[#00afd1] font-black text-xs">{u.name.charAt(0)}</span>
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{u.name}</p>
                                <p className="text-xs text-slate-400 font-mono">@{u.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider ${ROLE_COLORS[u.role] || ""}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-xs">
                            {u.role === "STUDENT"
                              ? u.classRoom
                                ? <span className="font-bold text-[#004253] dark:text-[#00afd1]">G{u.classRoom.grade} – {u.classRoom.name} ({u.classRoom.level})</span>
                                : <span>{u.level || "—"}</span>
                              : <span>{u.email || u.level || "—"}</span>
                            }
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-1">
                              <button onClick={() => setEditingUser(u)} className="p-2 rounded-lg text-[#004253] dark:text-[#00afd1] hover:bg-[#004253]/10 transition-colors" title="Edit">
                                <span className="material-symbols-outlined text-sm">edit</span>
                              </button>
                              <button onClick={() => handleDeleteUser(u.id, u.username)} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors" title="Delete">
                                <span className="material-symbols-outlined text-sm">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── CLASSES ── */}
          {activeTab === "CLASSES" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Create form */}
                <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 h-fit">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 text-base">
                    <span className="material-symbols-outlined text-[#004253] dark:text-[#00afd1]">add_business</span> New Room
                  </h3>
                  <form onSubmit={handleCreateClassroom} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Edu Level</label>
                      <select value={newClassroom.level} onChange={e => setNewClassroom({ ...newClassroom, level: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#004253] transition-all">
                        <option value="SD">SD (Elementary)</option><option value="SMP">SMP (Middle)</option><option value="SMA">SMA (High)</option><option value="SMK">SMK (Vocational)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Grade</label>
                      <input type="number" min="1" max="12" required value={newClassroom.grade} onChange={e => setNewClassroom({ ...newClassroom, grade: parseInt(e.target.value) })} className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#004253] transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Room Label</label>
                      <input placeholder="e.g. A, B, Science-1" required value={newClassroom.name} onChange={e => setNewClassroom({ ...newClassroom, name: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-[#004253] transition-all" />
                    </div>
                    <button type="submit" className="w-full flex items-center justify-center gap-2 py-3 bg-[#004253] text-white font-bold rounded-xl text-sm shadow hover:bg-[#005f74] active:scale-95 transition-all">
                      <span className="material-symbols-outlined text-sm">save</span> Create Room
                    </button>
                  </form>
                </div>

                {/* Classroom cards */}
                <div className="md:col-span-2">
                  {classrooms.length === 0 ? (
                    <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-slate-400 bg-white dark:bg-[#161b22] rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                      <span className="material-symbols-outlined text-5xl opacity-20 mb-3">domain_disabled</span>
                      <p className="font-semibold">No classrooms defined yet.</p>
                      <p className="text-sm opacity-70 mt-1">Create your first room on the left panel.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {classrooms.map(cr => (
                        <div key={cr.id} className="bg-white dark:bg-[#161b22] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between group hover:border-[#004253]/30 hover:-translate-y-1 transition-all">
                          <div className="flex justify-between items-start mb-4">
                            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-[#004253]/10 text-[#004253] dark:text-[#00afd1]">{cr.level}</span>
                            <button onClick={() => handleDeleteClassroom(cr.id, cr.name)} className="p-1.5 rounded-lg text-rose-500 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 opacity-0 group-hover:opacity-100 transition-all">
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          </div>
                          <div>
                            <h4 className="font-black text-2xl text-slate-900 dark:text-slate-100">Grade {cr.grade}</h4>
                            <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">Room {cr.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {activeTab === "SETTINGS" && (
            <div className="max-w-xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-7 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#004253] dark:text-[#00afd1]">tune</span>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Global Application Settings</h3>
                    <p className="text-xs text-slate-500 mt-0.5">These settings affect system-wide behavior.</p>
                  </div>
                </div>
                <form onSubmit={handleUpdateSettings} className="p-7 space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Institution Name</label>
                    <input value={settings.schoolName} onChange={e => setSettings({ ...settings, schoolName: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-[#004253] transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Active Academic Term</label>
                    <select value={settings.activeTerm} onChange={e => setSettings({ ...settings, activeTerm: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#004253] transition-all">
                      <option value="UTS_1">Semester Ganjil — UTS</option>
                      <option value="SEM_1">Semester Ganjil — UAS</option>
                      <option value="UTS_2">Semester Genap — UTS</option>
                      <option value="SEM_2">Semester Genap — UAS</option>
                    </select>
                  </div>
                  <div className="pt-2">
                    <button disabled={settingsLoading} type="submit" className="flex items-center gap-2 px-6 py-3 bg-[#004253] text-white font-bold rounded-xl text-sm shadow-md hover:bg-[#005f74] active:scale-95 transition-all disabled:opacity-50">
                      <span className="material-symbols-outlined text-sm">save</span>
                      {settingsLoading ? "Saving…" : "Save Settings"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ════════ MODAL: Edit User ════════ */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#161b22] rounded-2xl p-7 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button onClick={() => setEditingUser(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#004253]/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#004253]">edit</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Edit User</h3>
                <p className="text-xs text-slate-400 font-mono">@{editingUser.username}</p>
              </div>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const res = await fetch(`/api/users/${editingUser.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editingUser) });
                const data = await res.json();
                if (res.ok) { setEditingUser(null); fetchUsers(); } else showAlert("Error", data.error, "danger");
              } catch {}
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Full Name</label>
                <input required value={editingUser.name} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-[#004253]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Username</label>
                <input required value={editingUser.username} onChange={e => setEditingUser({ ...editingUser, username: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-[#004253]" />
              </div>
              {editingUser.role === "STUDENT" && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Classroom</label>
                  <select value={editingUser.classRoom?.id || editingUser.classRoomId || ""} onChange={e => setEditingUser({ ...editingUser, classRoomId: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-[#004253]">
                    <option value="">No Room Assigned</option>
                    {classrooms.filter(cr => cr.level === editingUser.level).map(cr => <option key={cr.id} value={cr.id}>Grade {cr.grade} - {cr.name}</option>)}
                  </select>
                </div>
              )}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-500 mb-1.5">New Password <span className="font-normal text-slate-400">(leave blank to keep current)</span></label>
                <input type="text" onChange={e => setEditingUser({ ...editingUser, newPassword: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-[#004253]" placeholder="Enter new password…" />
              </div>
              <button type="submit" className="w-full flex items-center justify-center gap-2 py-3 bg-[#004253] text-white font-bold rounded-xl text-sm shadow hover:bg-[#005f74] active:scale-95 transition-all">
                <span className="material-symbols-outlined text-sm">save</span> Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ════════ MODAL: Bulk CSV Import ════════ */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-[#161b22] rounded-3xl p-8 max-w-lg w-full shadow-2xl relative border border-slate-200 dark:border-slate-800">
            <button onClick={() => setShowImportModal(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">table_chart</span>
              </div>
              <div>
                <h3 className="font-black text-2xl text-slate-900 dark:text-white">Bulk Register (CSV)</h3>
                <p className="text-sm text-slate-500 font-medium">Mass import students, teachers, or admins.</p>
              </div>
            </div>

            <div className="mt-8 space-y-6">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-400 font-bold mb-3">1. Download Template</p>
                <p className="text-xs text-slate-500 mb-4">Ensure your CSV file exactly matches the column headers provided in our template. Extraneous columns will be ignored.</p>
                <button onClick={downloadCSVTemplate} className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">download</span> Tabgha_Template.csv
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-400 font-bold mb-3">2. Upload Populated File</p>
                <form onSubmit={handleImportUsers} className="space-y-4">
                  <input 
                    type="file" 
                    accept=".csv"
                    required
                    onChange={e => setImportFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all dark:file:bg-indigo-900/30 dark:file:text-indigo-400 dark:hover:file:bg-indigo-900/50"
                  />
                  <div className="pt-2">
                    <button disabled={importing || !importFile} type="submit" className="w-full flex items-center justify-center gap-3 py-3.5 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100">
                      {importing ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined text-lg">cloud_upload</span>}
                      {importing ? "Processing CSV Data..." : "Upload & Register Mass Users"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════ MODAL: User Guide ════════ */}
      {showManual && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#161b22] rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex items-center justify-between px-7 py-5 bg-[#004253] shrink-0">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-2xl text-white">menu_book</span>
                <div>
                  <h3 className="font-black text-white text-lg">Admin Manual</h3>
                  <p className="text-white/70 text-xs">Panduan operasional portal Admin Tabgha CBT</p>
                </div>
              </div>
              <button onClick={() => setShowManual(false)} className="p-2 rounded-full hover:bg-white/20 transition-colors text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="overflow-y-auto p-7 space-y-5 flex-1">
              {[
                {
                  icon: "bar_chart_4_bars", title: "1. Overview Dashboard",
                  items: [
                    { bold: "Fungsi:", text: "Melihat statistik keseluruhan sistem CBT secara real-time." },
                    { bold: "Total Students:", text: "Jumlah total siswa terdaftar aktif." },
                    { bold: "Active Teachers:", text: "Jumlah guru / staf tutor aktif." },
                    { bold: "Scheduled Exams:", text: "Jumlah ujian yang telah dijadwalkan." },
                    { bold: "Export Stats:", text: "Ekspor data statistik ke Excel (.xlsx)." },
                  ]
                },
                {
                  icon: "manage_accounts", title: "2. User Management",
                  items: [
                    { bold: "Enroll New Member:", text: "Daftarkan akun baru (Admin / Teacher / Student) dengan username & password eksplisit." },
                    { bold: "Bulk Register (CSV):", text: "Registrasi massal multi-role (Student/Teacher/Admin) sekaligus dengan mengunduh template CSV." },
                    { bold: "Filter Tabs:", text: "Tampilkan tabel berdasarkan role (ALL / STUDENT / TEACHER / ADMIN)." },
                    { bold: "Excel & PDF Export:", text: "Ekspor seluruh direktori pengguna ke dokumen formal." },
                    { bold: "Edit (ikon pensil):", text: "Ubah nama, username, atau reset password pengguna." },
                    { bold: "Delete (ikon hapus):", text: "Hapus akun (Super Admin tidak bisa dihapus)." },
                  ]
                },
                {
                  icon: "meeting_room", title: "3. Class & Rooms",
                  items: [
                    { bold: "New Room:", text: "Buat ruangan fisik berdasarkan level pendidikan, grade, dan nama label." },
                    { bold: "Assign Student:", text: "Saat mendaftarkan siswa, pilih ruangan yang sesuai dengan level-nya." },
                  ]
                },
                {
                  icon: "settings", title: "4. System Settings",
                  items: [
                    { bold: "Institution Name:", text: "Nama resmi sekolah yang tampil di seluruh antarmuka sistem." },
                    { bold: "Active Academic Term:", text: "Kuartal akademik aktif (UTS / UAS) — digunakan untuk pemilahan ujian." },
                  ]
                },
                {
                  icon: "share", title: "5. Teacher Access Control",
                  items: [
                    { bold: "Private by Default:", text: "Subject dan Exam yang dibuat guru hanya terlihat oleh pemiliknya." },
                    { bold: "Share with Teachers:", text: "Saat membuat Subject atau Exam, guru dapat memilih guru lain yang bisa mengakses konten tersebut." },
                    { bold: "Admin Sees All:", text: "Admin selalu dapat melihat semua Subject dan Exam tanpa perlu di-share." },
                  ]
                },
              ].map(section => (
                <div key={section.title} className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-5 border border-slate-200 dark:border-slate-700/60">
                  <h4 className="font-bold text-[#004253] dark:text-[#00afd1] flex items-center gap-2 mb-3 text-sm">
                    <span className="material-symbols-outlined text-sm p-1.5 bg-[#004253]/10 rounded-lg">{section.icon}</span>
                    {section.title}
                  </h4>
                  <ul className="space-y-1.5">
                    {section.items.map((item, i) => (
                      <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex gap-2">
                        <span className="shrink-0 w-[6px] h-[6px] rounded-full bg-[#004253]/40 dark:bg-[#00afd1]/40 mt-2"></span>
                        <span><strong className="text-slate-800 dark:text-slate-200">{item.bold}</strong> {item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="px-7 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-900/40 shrink-0">
              <button onClick={() => setShowManual(false)} className="flex items-center gap-2 px-6 py-2.5 bg-[#004253] text-white font-bold rounded-xl text-sm hover:bg-[#005f74] active:scale-95 transition-all">
                <span className="material-symbols-outlined text-sm">thumb_up</span> Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {dialog.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center relative overflow-hidden">
            {dialog.type === 'danger' && <div className="absolute top-0 left-0 w-full h-2 bg-rose-500"></div>}
            {dialog.type === 'confirm' && <div className="absolute top-0 left-0 w-full h-2 bg-[#004253]"></div>}
            {dialog.type === 'alert' && <div className="absolute top-0 left-0 w-full h-2 bg-amber-500"></div>}
            
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6 mt-2 ${dialog.type === 'danger' ? 'bg-rose-100 text-rose-500' : dialog.type === 'confirm' ? 'bg-[#004253]/10 text-[#004253] dark:text-[#00afd1]' : 'bg-amber-100 text-amber-500'}`}>
              <span className="material-symbols-outlined text-3xl">{dialog.type === 'danger' ? 'warning' : dialog.type === 'alert' ? 'info' : 'help'}</span>
            </div>
            
            <h3 className="font-black text-2xl mb-3 text-slate-800 dark:text-white">{dialog.title}</h3>
            <p className="text-slate-500 font-medium mb-8 leading-relaxed">{dialog.message}</p>
            
            <div className="flex gap-3">
              {dialog.type !== 'alert' && (
                <button onClick={() => setDialog({...dialog, isOpen: false})} className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
              )}
              <button 
                onClick={() => {
                  setDialog({...dialog, isOpen: false});
                  if (dialog.onConfirm) dialog.onConfirm();
                }} 
                className={`flex-1 px-4 py-3 text-white font-bold rounded-xl transition-transform hover:scale-105 shadow-lg ${dialog.type === 'danger' ? 'bg-rose-500 shadow-rose-500/30' : dialog.type === 'confirm' ? 'bg-[#004253] shadow-[#004253]/30' : 'bg-slate-800 dark:bg-slate-700 shadow-slate-900/20'}`}
              >
                {dialog.type === 'alert' ? 'Got it' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
