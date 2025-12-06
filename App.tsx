import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import ReportForm from './components/ReportForm';
import AdminPanel from './components/AdminPanel';
import TechDashboard from './components/TechDashboard';
import { Logo } from './components/Logo';
import { UserIcon, LogOutIcon, WifiIcon, WifiOffIcon } from './components/icons';
// Firebase imports
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

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
  firebaseConfig?: string; // Stored as JSON string
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
  adminPassword: 'admin',
  firebaseConfig: ''
};

const App: React.FC = () => {
  const [view, setView] = useState<'login' | 'dashboard' | 'form' | 'admin'>('login');
  const [userRole, setUserRole] = useState<'admin' | 'tech' | null>(null);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [editingReport, setEditingReport] = useState<WorkReport | null>(null);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [dbStatus, setDbStatus] = useState<'local' | 'cloud'>('local');
  
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

  // Effect to Initialize Firebase if config exists
  useEffect(() => {
    if (data.firebaseConfig) {
      try {
        const config = JSON.parse(data.firebaseConfig);
        const app = !getApps().length ? initializeApp(config) : getApp();
        const db = getFirestore(app);
        
        setIsCloudConnected(true);
        setDbStatus('cloud');

        // Subscribe to real-time updates
        const unsub = onSnapshot(doc(db, "jdg_teleco", "main_db"), (doc) => {
            if (doc.exists()) {
                const cloudData = doc.data() as AppData;
                // Preserve the local config string, but update everything else
                setData(prev => ({
                    ...cloudData,
                    firebaseConfig: prev.firebaseConfig 
                }));
            }
        }, (err) => {
            console.error("Firebase sync error:", err);
            setIsCloudConnected(false);
            setDbStatus('local');
        });

        return () => unsub();
      } catch (e) {
        console.error("Invalid Firebase Config", e);
        setIsCloudConnected(false);
        setDbStatus('local');
      }
    } else {
        setDbStatus('local');
    }
  }, [data.firebaseConfig]);

  // Effect to Save Data (Local or Cloud)
  useEffect(() => {
    // Always save to local storage as backup/offline cache
    localStorage.setItem('workerApp_db', JSON.stringify(data));

    // If connected to cloud, push updates
    if (isCloudConnected && data.firebaseConfig) {
        try {
            const config = JSON.parse(data.firebaseConfig);
            const app = !getApps().length ? initializeApp(config) : getApp();
            const db = getFirestore(app);
            // We don't want to trigger infinite loops, but setData is usually safe.
            // In a real app we'd check dirty flags. Here we just push.
            // We use setDoc with merge:true usually, but here we want the state to be the source of truth
            setDoc(doc(db, "jdg_teleco", "main_db"), data).catch(err => console.error("Push error", err));
        } catch(e) {
            console.error("Cloud push failed", e);
        }
    }
  }, [data, isCloudConnected]);

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
                <div className="flex items-center gap-2">
                    <p className="text-xs text-brand-lime">
                    {userRole === 'admin' ? 'ADMINISTRADOR' : `TÉCNICO: ${currentUser.toUpperCase()}`}
                    </p>
                    {dbStatus === 'cloud' ? (
                        <span className="flex items-center gap-1 text-[10px] text-green-400 bg-green-900/30 px-2 py-0.5 rounded-full border border-green-800">
                            <WifiIcon className="w-3 h-3" /> Cloud
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-[10px] text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full border border-gray-700">
                            <WifiOffIcon className="w-3 h-3" /> Local
                        </span>
                    )}
                </div>
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
          <TechDashboard 
            reports={data.reports.filter(r => r.technician === currentUser)}
            onNewReport={startNewReport}
            onEditReport={startEditReport}
          />
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
