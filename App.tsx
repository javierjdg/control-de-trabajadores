
import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import ReportForm from './components/ReportForm';
import AdminPanel from './components/AdminPanel';
import { Logo } from './components/Logo';
import { UserIcon, TruckIcon, FileTextIcon, SettingsIcon, LogOutIcon, PlusIcon, EditIcon } from './components/icons';

// Types
export interface WorkReport {
  id: string;
  technician: string;
  projectNum: string; // 5 digits
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  vehicle: string;
  isDriver: boolean;
  expenses: {
    food: number;
    gas: number;
    parking: number;
    others: number;
    othersDesc: string;
  };
  imageNames: string[];
}

export interface TechUser {
  id: string;
  name: string;
  password: string;
}

export interface AppData {
  technicians: TechUser[];
  projects: string[]; // Format: "12345 - Name"
  vehicles: string[];
  reports: WorkReport[];
  adminPassword?: string;
}

const INITIAL_DATA: AppData = {
  technicians: [
    { id: '1', name: 'Juan Pérez', password: '123' },
    { id: '2', name: 'María Garcia', password: '123' },
    { id: '3', name: 'Carlos Ruiz', password: '123' }
  ],
  projects: ['10001 - Mantenimiento Central', '20002 - Reforma Oficina', '30003 - Avería Nave B'],
  vehicles: ['Furgoneta 1 (1234-BBC)', 'Coche Taller (5678-DEF)', 'Furgoneta 2 (9012-GHI)'],
  reports: [],
  adminPassword: 'admin'
};

const App: React.FC = () => {
  const [view, setView] = useState<'login' | 'dashboard' | 'form' | 'admin'>('login');
  const [userRole, setUserRole] = useState<'admin' | 'tech' | null>(null);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [editingReport, setEditingReport] = useState<WorkReport | null>(null);
  
  // "Database" state
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem('workerApp_db');
    if (saved) {
      const parsed = JSON.parse(saved);
      
      // MIGRATION: Convert old string[] technicians to TechUser[] if necessary
      let migratedTechs = parsed.technicians;
      if (Array.isArray(parsed.technicians) && typeof parsed.technicians[0] === 'string') {
        const defaultPwd = parsed.techPassword || 'tech';
        migratedTechs = (parsed.technicians as any as string[]).map((name, idx) => ({
          id: `migrated-${idx}`,
          name: name,
          password: defaultPwd
        }));
      }

      return {
        ...INITIAL_DATA, // ensure defaults
        ...parsed, // overwrite with saved
        technicians: migratedTechs || INITIAL_DATA.technicians,
        adminPassword: parsed.adminPassword || 'admin',
      };
    }
    return INITIAL_DATA;
  });

  useEffect(() => {
    localStorage.setItem('workerApp_db', JSON.stringify(data));
  }, [data]);

  const handleLogin = (role: 'admin' | 'tech', username?: string) => {
    setUserRole(role);
    if (username) setCurrentUser(username);
    setView(role === 'admin' ? 'admin' : 'dashboard');
  };

  const handleLogout = () => {
    setUserRole(null);
    setCurrentUser('');
    setEditingReport(null);
    setView('login');
  };

  const startNewReport = () => {
    setEditingReport(null);
    setView('form');
  };

  const startEditReport = (report: WorkReport) => {
    setEditingReport(report);
    setView('form');
  };

  const saveReport = (report: WorkReport) => {
    // If we are editing, we preserve the ID and update the existing record
    // If we are creating new, ReportForm generated a new ID
    
    setData(prev => {
      const existingIndex = prev.reports.findIndex(r => r.id === report.id);
      let updatedReports;

      if (existingIndex >= 0) {
        // Update existing
        updatedReports = [...prev.reports];
        // Ensure technician remains the same or update to current user (security check)
        updatedReports[existingIndex] = { ...report, technician: currentUser };
      } else {
        // Add new
        const newReport = { ...report, technician: currentUser };
        updatedReports = [newReport, ...prev.reports];
      }
      
      return {
        ...prev,
        reports: updatedReports
      };
    });
    
    setEditingReport(null);
    setView('dashboard');
  };

  return (
    <div className="min-h-screen bg-brand-dark text-gray-100 font-sans">
      {/* Header */}
      {view !== 'login' && (
        <header className="bg-brand-panel border-b border-gray-700 p-4 sticky top-0 z-10 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="bg-white/10 p-1 rounded-lg">
                <Logo className="h-8 w-auto" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight text-white hidden sm:block">Control de Obras</h1>
                <p className="text-xs text-brand-lime">
                  {userRole === 'admin' ? 'ADMINISTRADOR' : `TÉCNICO: ${currentUser.toUpperCase()}`}
                </p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-red-400 transition-colors"
            >
              <LogOutIcon className="w-6 h-6" />
            </button>
          </div>
        </header>
      )}

      <main className="container mx-auto p-4 md:max-w-3xl">
        {view === 'login' && (
          <Login 
            onLogin={handleLogin} 
            technicians={data.technicians} 
            adminPwd={data.adminPassword || 'admin'}
          />
        )}

        {view === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            <button
              onClick={startNewReport}
              className="w-full bg-gradient-to-r from-brand-teal to-teal-600 hover:from-teal-500 hover:to-teal-400 text-white p-6 rounded-2xl shadow-lg transform transition active:scale-95 flex flex-col items-center justify-center gap-3 border border-teal-500/30"
            >
              <PlusIcon className="w-12 h-12 text-brand-lime" />
              <span className="text-xl font-bold">Nuevo Parte de Trabajo</span>
            </button>

            <div>
              <h3 className="text-gray-400 font-medium mb-3 uppercase text-sm tracking-wider flex items-center gap-2">
                <FileTextIcon className="w-4 h-4 text-brand-lime" /> Mis Últimos Partes
              </h3>
              <div className="space-y-3">
                {data.reports.filter(r => r.technician === currentUser).slice(0, 5).map(report => (
                  <div key={report.id} className="bg-brand-panel p-4 rounded-xl border border-gray-700 flex justify-between items-center group hover:border-brand-teal/50 transition-colors">
                    <div>
                      <div className="font-bold text-brand-lime">{report.date}</div>
                      <div className="text-sm text-gray-300">Obra: <span className="text-white">{report.projectNum}</span></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-gray-500">{report.startTime} - {report.endTime}</div>
                        <div className="text-xs bg-gray-800 px-2 py-1 rounded mt-1 inline-block text-gray-300">
                          {report.vehicle.split('(')[0]}
                        </div>
                      </div>
                      <button 
                        onClick={() => startEditReport(report)}
                        className="p-2 bg-gray-800 hover:bg-brand-teal rounded-lg text-gray-300 hover:text-white transition-colors border border-gray-700"
                        title="Editar Parte"
                      >
                        <EditIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
                {data.reports.filter(r => r.technician === currentUser).length === 0 && (
                  <p className="text-gray-500 text-center py-4 bg-brand-panel rounded-xl border border-gray-800 border-dashed">No hay partes recientes.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'form' && (
          <ReportForm 
            projects={data.projects} 
            vehicles={data.vehicles} 
            initialData={editingReport}
            onSave={saveReport} 
            onCancel={() => setView('dashboard')} 
          />
        )}

        {view === 'admin' && (
          <AdminPanel 
            data={data} 
            setData={setData} 
          />
        )}
      </main>
    </div>
  );
};

export default App;
