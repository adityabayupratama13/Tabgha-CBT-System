"use client";

import { useState, useEffect } from "react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"DASHBOARD" | "USERS" | "SETTINGS">("USERS");
  const [newUserRole, setNewUserRole] = useState<"STUDENT" | "TEACHER" | "ADMIN">("STUDENT");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [level, setLevel] = useState("SD");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<any>(null);
  const [showManual, setShowManual] = useState(false);

  const [users, setUsers] = useState<any[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const [stats, setStats] = useState({ studentCount: 0, teacherCount: 0, examCount: 0 });
  
  const [settings, setSettings] = useState({ schoolName: "", activeTerm: "UTS_1" });
  const [settingsLoading, setSettingsLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "DASHBOARD") fetchStats();
    if (activeTab === "USERS") fetchUsers();
    if (activeTab === "SETTINGS") fetchSettings();
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch (err) {}
  };

  const fetchUsers = async () => {
    setFetchingUsers(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (res.ok) setUsers(data.users);
    } catch (err) {}
    setFetchingUsers(false);
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (res.ok && data.settings) setSettings(data.settings);
    } catch (err) {}
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessData(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, role: newUserRole, email, level: newUserRole === "STUDENT" ? level : undefined, username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register");
      setSuccessData(data.user);
      setName("");
      setEmail("");
      setUsername("");
      setPassword("");
      fetchUsers(); // refresh table
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) fetchUsers();
      else alert("Failed to delete (Cannot delete master admin)");
    } catch (err) {}
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      if (res.ok) alert("Settings updated!");
    } catch (err) {}
    setSettingsLoading(false);
  };

  const exportStatsToExcel = async () => {
    const ExcelJS = (await import('exceljs')).default;
    const { saveAs } = await import('file-saver');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Stats');
    worksheet.columns = [{ header: 'Metric', key: 'm', width: 20 }, { header: 'Value', key: 'v', width: 15 }];
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF004253' } };
    worksheet.addRow({ m: 'Total Students', v: stats.studentCount });
    worksheet.addRow({ m: 'Teachers', v: stats.teacherCount });
    worksheet.addRow({ m: 'Active Exams', v: stats.examCount });
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `dashboard_stats.xlsx`);
  };

  const exportToExcel = async (data: any[], filename: string) => {
    if (data.length === 0) return;
    const ExcelJS = (await import('exceljs')).default;
    const { saveAs } = await import('file-saver');
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Users');
    
    worksheet.columns = [
      { header: 'Username', key: 'username', width: 20 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Role', key: 'role', width: 15 },
      { header: 'Details', key: 'details', width: 25 }
    ];
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF004253' } };
    
    data.forEach((u, i) => {
      const row = worksheet.addRow({ username: u.username, name: u.name, role: u.role, details: u.level || u.email || "-" });
      if (i % 2 === 0) row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F7F9' } };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `${filename}.xlsx`);
  };

  const exportToPDF = async (data: any[], filename: string) => {
    if (data.length === 0) return;
    const jsPDF = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;
    
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(0, 66, 83);
    doc.text('Tabgha CBT - All Users Directory', 14, 22);
    
    const tableData = data.map(u => [u.username, u.name, u.role, u.level || u.email || "-"]);
    
    autoTable(doc, {
      head: [['Username', 'Name', 'Role', 'Details']],
      body: tableData,
      startY: 30,
      theme: 'striped',
      headStyles: { fillColor: [0, 66, 83], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [240, 247, 249] }
    });
    doc.save(`${filename}.pdf`);
  };

  const handleLogout = () => {
    // Clear cookie by expiring it
    document.cookie = "role=; path=/; max-age=0;";
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="bg-[#e6f6ff] dark:bg-slate-900 w-64 fixed left-0 top-0 h-screen pt-8 flex flex-col py-6 pr-4 z-40 border-r border-outline-variant/15">
        <div className="px-6 mb-8 flex-1">
          <h2 className="text-lg font-bold text-[#004253] dark:text-white">Admin Portal</h2>
          <p className="text-xs text-on-surface-variant opacity-70">Academic Sanctuary</p>
        </div>
        
        <div className="flex flex-col gap-1 flex-[4]">
          <button onClick={() => setActiveTab("DASHBOARD")} className={`flex items-center gap-3 px-6 py-3 font-semibold transition-colors ${activeTab === "DASHBOARD" ? "text-primary dark:text-primary-fixed bg-primary-container/20 border-r-4 border-primary" : "text-on-surface-variant dark:text-slate-400 hover:bg-surface-container-high"}`}>
            <span className="material-symbols-outlined">dashboard</span> Dashboard
          </button>
          <button onClick={() => setActiveTab("USERS")} className={`flex items-center gap-3 px-6 py-3 font-semibold transition-colors ${activeTab === "USERS" ? "text-primary dark:text-primary-fixed bg-primary-container/20 border-r-4 border-primary" : "text-on-surface-variant dark:text-slate-400 hover:bg-surface-container-high"}`}>
            <span className="material-symbols-outlined">group_add</span> User Management
          </button>
          <button onClick={() => setActiveTab("SETTINGS")} className={`flex items-center gap-3 px-6 py-3 font-semibold transition-colors ${activeTab === "SETTINGS" ? "text-primary dark:text-primary-fixed bg-primary-container/20 border-r-4 border-primary" : "text-on-surface-variant dark:text-slate-400 hover:bg-surface-container-high"}`}>
            <span className="material-symbols-outlined">settings</span> System Settings
          </button>
          <div className="my-2 border-b border-outline-variant/20 mx-6"></div>
          <button onClick={() => setShowManual(true)} className="flex items-center gap-3 px-6 py-3 font-semibold transition-colors text-on-surface-variant dark:text-slate-400 hover:bg-surface-container-high">
            <span className="material-symbols-outlined text-tertiary">menu_book</span> User Guide (Manual)
          </button>
        </div>

        <div className="px-2 mt-auto">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-error dark:text-error-fixed hover:bg-error-container/20 rounded-xl transition-colors font-bold">
            <span className="material-symbols-outlined">logout</span> Log Out
          </button>
        </div>
      </aside>

      <main className="ml-64 p-12 w-full h-screen overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 flex justify-between items-end">
            <div>
              <h1 className="text-on-surface font-headline font-extrabold text-4xl tracking-tight mb-2">
                {activeTab === "DASHBOARD" ? "Overview Dashboard" : activeTab === "USERS" ? "User Management" : "System Settings"}
              </h1>
              <p className="text-on-surface-variant font-body">
                {activeTab === "DASHBOARD" ? "Realtime statistics and system monitor" : activeTab === "USERS" ? "Register and manage system access for all roles" : "Configure global application behaviors"}
              </p>
            </div>
          </div>

          {activeTab === "DASHBOARD" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-end mb-4">
                <button onClick={exportStatsToExcel} className="bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm shadow flex items-center gap-2 hover:bg-primary/90">
                  <span className="material-symbols-outlined text-sm">table</span> Export Excel Stats
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface-container-highest p-6 rounded-xl flex flex-col justify-between min-h-[160px]">
                  <span className="material-symbols-outlined text-primary text-3xl">school</span>
                  <div>
                    <p className="text-on-surface-variant text-xs font-label uppercase tracking-wider">Total Students</p>
                    <p className="text-4xl font-headline font-black text-on-surface">{stats.studentCount}</p>
                  </div>
                </div>
                <div className="bg-surface-container-low p-6 rounded-xl flex flex-col justify-between min-h-[160px]">
                   <span className="material-symbols-outlined text-secondary text-3xl">supervisor_account</span>
                   <div>
                      <p className="text-on-surface-variant text-xs font-label uppercase tracking-wider">Teachers</p>
                      <p className="text-4xl font-headline font-black text-on-surface">{stats.teacherCount}</p>
                   </div>
                </div>
                <div className="bg-surface-container-lowest border border-outline-variant/20 p-6 rounded-xl flex flex-col justify-between min-h-[160px]">
                   <span className="material-symbols-outlined text-tertiary text-3xl">assignment</span>
                   <div>
                      <p className="text-on-surface-variant text-xs font-label uppercase tracking-wider">Active Exams</p>
                      <p className="text-4xl font-headline font-black text-on-surface">{stats.examCount}</p>
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "USERS" && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
               {/* Registration Form */}
               <section className="bg-surface-container-lowest border border-outline-variant/15 p-10 rounded-2xl shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <span className="material-symbols-outlined text-[150px]">how_to_reg</span>
                  </div>
                  <div className="relative z-10">
                    <div className="mb-6">
                      <h3 className="font-headline text-2xl font-bold mb-1">Enroll New Member</h3>
                      <p className="text-on-surface-variant text-sm max-w-lg">Add administrators, teachers, or students. Passwords auto-generate.</p>
                    </div>

                    <form className="space-y-6 max-w-3xl" onSubmit={handleRegister}>
                      {error && <div className="p-3 bg-error text-on-error rounded-xl text-sm font-bold animate-pulse">{error}</div>}
                      {successData && (
                        <div className="p-4 bg-tertiary-fixed text-on-tertiary-fixed rounded-xl border border-tertiary/20 flex justify-between items-center">
                          <div>
                            <h4 className="font-bold text-sm mb-1 flex items-center gap-2"><span className="material-symbols-outlined text-tertiary">check_circle</span> Registration Successful!</h4>
                            <p className="text-sm font-mono mt-2">User: <strong>{successData.username}</strong> | Pass: <strong>{successData.plainPassword}</strong></p>
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                           <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Role</label>
                           <select value={newUserRole} onChange={(e:any) => setNewUserRole(e.target.value)} className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-sm font-bold shadow-sm outline-none">
                             <option value="STUDENT">Student</option>
                             <option value="TEACHER">Teacher</option>
                             <option value="ADMIN">Admin</option>
                           </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Full Name</label>
                          <input type="text" className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary outline-none text-sm" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>
                        {newUserRole === "STUDENT" ? (
                          <div className="space-y-2">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Level</label>
                            <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary outline-none text-sm">
                              <option value="SD">SD</option><option value="SMP">SMP</option><option value="SMA">SMA</option><option value="SMK">SMK</option>
                            </select>
                          </div>
                        ) : (
                           <div className="space-y-2">
                             <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Email</label>
                             <input type="email" className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary outline-none text-sm" placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
                           </div>
                        )}
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Username</label>
                          <input type="text" className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary outline-none text-sm" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Password</label>
                          <input type="text" className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary outline-none text-sm" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                      </div>
                      <div className="pt-2 flex justify-end">
                        <button disabled={loading} type="submit" className="bg-primary text-on-primary font-bold px-6 py-3 rounded-xl shadow hover:scale-[1.02] active:scale-95 transition-all text-sm disabled:opacity-50">
                           {loading ? "Registering..." : `Register Member`}
                        </button>
                      </div>
                    </form>
                  </div>
               </section>

               {/* Users CRUD Table */}
               <section className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-outline-variant/15 flex justify-between items-center bg-surface-container-low">
                    <h3 className="font-headline font-bold text-lg flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">group</span> All Users Directory
                    </h3>
                    <div className="flex gap-2">
                      <button onClick={fetchUsers} className="p-2 bg-surface text-on-surface-variant rounded-lg hover:bg-surface-container-highest transition-colors">
                        <span className="material-symbols-outlined text-sm">refresh</span>
                      </button>
                      <button onClick={() => exportToExcel(users, "tabgha_users")} className="px-4 py-2 bg-[#178550] text-[#ffffff] rounded-lg font-bold text-xs shadow flex items-center gap-2 hover:bg-[#11653d] transition-colors">
                        <span className="material-symbols-outlined text-sm">table_view</span> Excel
                      </button>
                      <button onClick={() => exportToPDF(users, "tabgha_users")} className="px-4 py-2 bg-[#DD2B2B] text-white rounded-lg font-bold text-xs shadow flex items-center gap-2 hover:bg-[#a52121] transition-colors">
                        <span className="material-symbols-outlined text-sm">picture_as_pdf</span> PDF
                      </button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-on-surface-variant">
                      <thead className="text-xs uppercase bg-surface-container-lowest border-b border-outline-variant/15 text-primary sticky top-0">
                        <tr>
                          <th className="px-6 py-4">Username</th>
                          <th className="px-6 py-4">Name</th>
                          <th className="px-6 py-4">Role</th>
                          <th className="px-6 py-4">Context / Details</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fetchingUsers ? (
                           <tr><td colSpan={5} className="p-8 text-center animate-pulse">Loading directory...</td></tr>
                        ) : users.length === 0 ? (
                           <tr><td colSpan={5} className="p-8 text-center">No users found.</td></tr>
                        ) : users.map((u) => (
                           <tr key={u.id} className="border-b border-outline-variant/5 bg-surface-container-lowest hover:bg-surface-container-low/50 transition-colors">
                             <td className="px-6 py-4 font-mono font-bold text-on-surface">{u.username}</td>
                             <td className="px-6 py-4 font-semibold text-on-surface">{u.name}</td>
                             <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${u.role === 'ADMIN' ? 'bg-error/10 text-error' : u.role === 'TEACHER' ? 'bg-secondary/10 text-secondary' : 'bg-primary-container/30 text-primary'}`}>
                                  {u.role}
                                </span>
                             </td>
                             <td className="px-6 py-4">{u.level || u.email || "-"}</td>
                             <td className="px-6 py-4 flex justify-end gap-2">
                               <button onClick={() => setEditingUser(u)} className="p-2 text-primary hover:bg-primary/10 rounded transition-colors" title="Edit / Reset Password">
                                 <span className="material-symbols-outlined text-sm">edit</span>
                               </button>
                               <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-error hover:bg-error/10 rounded transition-colors" title="Delete User">
                                 <span className="material-symbols-outlined text-sm">delete</span>
                               </button>
                             </td>
                           </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </section>
            </div>
          )}

          {activeTab === "SETTINGS" && (
            <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <section className="bg-surface-container-lowest border border-outline-variant/15 p-10 rounded-2xl shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <span className="material-symbols-outlined text-[150px]">tune</span>
                  </div>
                  <div className="relative z-10">
                    <h3 className="font-headline text-2xl font-bold mb-6">Global Application Settings</h3>
                    <form onSubmit={handleUpdateSettings} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Institution Name</label>
                        <input type="text" className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary outline-none" value={settings.schoolName} onChange={(e) => setSettings({...settings, schoolName: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Active Academic Term</label>
                        <select value={settings.activeTerm} onChange={(e) => setSettings({...settings, activeTerm: e.target.value})} className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary outline-none">
                          <option value="UTS_1">Semester Ganjil - UTS</option>
                          <option value="SEM_1">Semester Ganjil - UAS</option>
                          <option value="UTS_2">Semester Genap - UTS</option>
                          <option value="SEM_2">Semester Genap - UAS</option>
                        </select>
                      </div>
                      <div className="pt-4">
                        <button disabled={settingsLoading} type="submit" className="bg-secondary text-on-secondary font-bold px-8 py-3 rounded-xl shadow hover:scale-[1.02] active:scale-95 transition-all text-sm">
                           {settingsLoading ? "Saving..." : "Save Settings"}
                        </button>
                      </div>
                    </form>
                  </div>
               </section>
            </div>
          )}
        </div>
      </main>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface-container-lowest rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setEditingUser(null)} className="absolute top-4 right-4 p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full"><span className="material-symbols-outlined">close</span></button>
            <h3 className="text-xl font-headline font-bold mb-6">Edit User: {editingUser.username}</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const res = await fetch(`/api/users/${editingUser.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(editingUser)
                });
                const data = await res.json();
                if (res.ok) {
                  setEditingUser(null);
                  fetchUsers();
                } else alert(data.error);
              } catch (err) {}
            }} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant">Full Name</label>
                <input required value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="w-full bg-surface-container-low py-2 px-3 rounded-lg outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant">Email / Level Context</label>
                <input value={editingUser.email || editingUser.level || ""} onChange={e => setEditingUser({...editingUser, email: e.target.value, level: e.target.value})} className="w-full bg-surface-container-low py-2 px-3 rounded-lg outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant">Username</label>
                <input required value={editingUser.username} onChange={e => setEditingUser({...editingUser, username: e.target.value})} className="w-full bg-surface-container-low py-2 px-3 rounded-lg outline-none focus:ring-2 focus:ring-primary" />
              </div>
              
              <div className="pt-4 border-t border-outline-variant/20 flex flex-col gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant">New Password (leave blank to keep current)</label>
                  <input type="text" onChange={e => setEditingUser({...editingUser, newPassword: e.target.value})} className="w-full bg-surface-container-low py-2 px-3 rounded-lg outline-none focus:ring-2 focus:ring-primary" placeholder="Enter new password..." />
                </div>
                <button type="submit" className="w-full bg-primary text-on-primary font-bold py-3 rounded-xl mt-2">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showManual && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface-container bg-surface flex flex-col rounded-3xl w-full max-w-4xl h-[85vh] shadow-2xl overflow-hidden relative border border-outline-variant/20 animate-in zoom-in-95 duration-200">
            <div className="bg-primary px-8 py-6 text-on-primary flex justify-between items-center shrink-0 shadow-sm relative z-10">
               <div>
                 <h3 className="font-headline font-black text-2xl flex items-center gap-3"><span className="material-symbols-outlined text-3xl">menu_book</span> Admin Manual Book</h3>
                 <p className="opacity-90 mt-1 font-body text-sm font-medium">Panduan operasional operasional & pemahaman fungsi portal Admin.</p>
               </div>
               <button onClick={() => setShowManual(false)} className="p-2 hover:bg-on-primary/20 rounded-full transition-colors flex items-center justify-center"><span className="material-symbols-outlined text-3xl">close</span></button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-10 flex-1 text-on-surface bg-gray-50/50 dark:bg-slate-900/50 relative">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                <span className="material-symbols-outlined text-[250px]">verified_user</span>
              </div>
              
              <section className="space-y-4 relative z-10 bg-surface p-6 rounded-2xl shadow-sm border border-outline-variant/15">
                <h4 className="text-xl font-bold font-headline text-primary border-b border-outline-variant/30 pb-3 flex items-center gap-3">
                  <span className="material-symbols-outlined bg-primary/10 p-2 rounded-lg">dashboard</span> 1. Overview Dashboard
                </h4>
                <ul className="list-disc pl-6 space-y-2 text-sm text-on-surface-variant leading-relaxed">
                  <li><strong className="text-on-surface font-semibold text-[15px]">Fungsi:</strong> Melihat statistik keseluruhan Tabgha CBT system secara real-time.</li>
                  <li><strong className="text-on-surface font-semibold text-[15px]">Total Students:</strong> Jumlah total rekapitulasi siswa yang terdaftar aktif dalam pangkalan data.</li>
                  <li><strong className="text-on-surface font-semibold text-[15px]">Teachers:</strong> Jumlah murni total guru pengawas atau staf tutor.</li>
                  <li><strong className="text-on-surface font-semibold text-[15px]">Active Exams:</strong> Menampilkan rentetan jumlah ujian yang tengah berlangsung.</li>
                  <li><strong className="text-on-surface font-semibold text-[15px]">Export Excel Stats:</strong> Ekstraksi data ketiga status sentral tersebut ke dalam berkas <span className="text-[#178550] font-bold">Excel (.xlsx)</span>.</li>
                </ul>
              </section>

              <section className="space-y-4 relative z-10 bg-surface p-6 rounded-2xl shadow-sm border border-outline-variant/15">
                 <h4 className="text-xl font-bold font-headline text-primary border-b border-outline-variant/30 pb-3 flex items-center gap-3">
                   <span className="material-symbols-outlined bg-primary/10 p-2 rounded-lg">group_add</span> 2. User Management
                 </h4>
                 <ul className="list-none space-y-4 text-sm text-on-surface-variant">
                   <li className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 hover:border-primary/30 transition-colors">
                     <strong className="text-primary text-[15px] flex items-center gap-2 mb-2"><span className="material-symbols-outlined text-sm">person_add</span> Enroll New Member</strong>
                     Form pendaftaran murni. Menentukan akses hak paten (*Role*). Anda harus menyisipkan *Username* & *Password* secara literatur eksplisit. Kredensial mandiri inilah yang menuntun aktor menembus portal ujian.
                   </li>
                   <li className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 hover:border-primary/30 transition-colors">
                     <strong className="text-[#178550] text-[15px] flex items-center gap-2 mb-2"><span className="material-symbols-outlined text-sm">table_view</span> Excel & PDF Data Export</strong>
                     Mentranslasikan katalog daftar pengisi pangkalan data ke manifest dokumen formal visual (<span className="text-[#178550] font-bold">.xlsx</span> / <span className="text-[#DD2B2B] font-bold">.pdf</span>) dipoles mewah sesuai corak standar institusi. 
                   </li>
                   <li className="bg-error/5 border border-error/20 p-4 rounded-xl hover:border-error/40 transition-colors">
                     <strong className="text-error text-[15px] flex items-center gap-2 mb-2"><span className="material-symbols-outlined text-sm">lock_reset</span> Edit & Reset Password (Ikon Pensil Biru)</strong>
                     Sistem penanganan keadaan darurat administratif; dapat mengkorek detail *username*, menimpa kata sandi amnesia menjadi sandi utuh nan baru tiada jejak sisa. (Super Admin terlindung eksklusif dari penghapusan masif).
                   </li>
                 </ul>
              </section>

              <section className="space-y-4 relative z-10 bg-surface p-6 rounded-2xl shadow-sm border border-outline-variant/15">
                 <h4 className="text-xl font-bold font-headline text-primary border-b border-outline-variant/30 pb-3 flex items-center gap-3">
                   <span className="material-symbols-outlined bg-primary/10 p-2 rounded-lg">settings</span> 3. System Settings
                 </h4>
                 <ul className="list-disc pl-6 space-y-2 text-sm text-on-surface-variant">
                   <li><strong className="text-on-surface text-[15px]">Institution Name:</strong> Mendeklarasikan identitas nama sekolah resmi yang akan digunakan di berbagai template visual antarmuka sistem.</li>
                   <li><strong className="text-on-surface text-[15px]">Active Academic Term:</strong> Menetapkan masa kuartal kelas aktif saat ini (UTS, UAS, dll). Ini krusial bagi aplikasi dalam memilah dan menayangkan ketersediaan silabus ujian.</li>
                 </ul>
              </section>

            </div>
            
            <div className="bg-surface-container-low border-t border-outline-variant/15 px-8 py-5 flex justify-end shrink-0 relative z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
               <button onClick={() => setShowManual(false)} className="bg-primary text-on-primary font-bold px-10 py-3 rounded-xl hover:scale-105 active:scale-95 transition-transform flex items-center gap-2">
                 <span className="material-symbols-outlined">thumb_up</span> Saya Mengerti
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
