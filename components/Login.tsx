
import React, { useState } from 'react';
import { UserIcon } from './icons';
import { TechUser } from '../App';
import { Logo } from './Logo';

interface LoginProps {
  onLogin: (role: 'admin' | 'tech', username?: string) => void;
  technicians: TechUser[];
  adminPwd?: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, technicians, adminPwd = 'admin' }) => {
  const [step, setStep] = useState<'role' | 'password' | 'tech-select'>('role');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'tech' | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [selectedTech, setSelectedTech] = useState<TechUser | null>(null);

  const handleRoleSelect = (role: 'admin' | 'tech') => {
    setSelectedRole(role);
    setStep(role === 'admin' ? 'password' : 'tech-select');
    setError('');
    setPassword('');
  };

  const handleTechSelect = (tech: TechUser) => {
    setSelectedTech(tech);
    setStep('password');
  };

  const verifyLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole === 'admin') {
      if (password === adminPwd) {
        onLogin('admin');
      } else {
        setError('Contraseña incorrecta');
      }
    } else {
      if (selectedTech && password === selectedTech.password) {
        onLogin('tech', selectedTech.name);
      } else {
        setError('Contraseña incorrecta');
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh]">
      <div className="bg-brand-panel p-8 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-md relative overflow-hidden">
        {/* Decorative Top Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-lime to-brand-teal"></div>
        
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <Logo className="h-20 w-auto" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">ACCESO PLATAFORMA</h2>
          <p className="text-gray-400 text-sm">Gestión de Partes y Obras</p>
        </div>

        {step === 'role' && (
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => handleRoleSelect('tech')}
              className="bg-gray-800 hover:bg-gray-700 p-6 rounded-xl flex flex-col items-center transition-all border border-gray-700 hover:border-brand-lime group"
            >
              <span className="text-4xl mb-3 transform group-hover:scale-110 transition-transform">👷</span>
              <span className="font-semibold text-gray-200 group-hover:text-brand-lime">Técnico</span>
            </button>
            <button 
              onClick={() => handleRoleSelect('admin')}
              className="bg-gray-800 hover:bg-gray-700 p-6 rounded-xl flex flex-col items-center transition-all border border-gray-700 hover:border-brand-teal group"
            >
              <span className="text-4xl mb-3 transform group-hover:scale-110 transition-transform">👔</span>
              <span className="font-semibold text-gray-200 group-hover:text-brand-teal">Admin</span>
            </button>
          </div>
        )}

        {step === 'tech-select' && (
          <div>
            <label className="block text-sm font-medium text-brand-lime mb-3 uppercase tracking-wider">Selecciona tu perfil</label>
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
              {technicians.map(tech => (
                <button
                  key={tech.id}
                  onClick={() => handleTechSelect(tech)}
                  className="w-full text-left p-4 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors border-l-4 border-transparent hover:border-brand-lime flex items-center justify-between group"
                >
                  <span className="font-medium text-gray-200">{tech.name}</span>
                  <span className="text-gray-500 group-hover:text-white">➜</span>
                </button>
              ))}
            </div>
            <button onClick={() => setStep('role')} className="text-sm text-gray-500 hover:text-white w-full text-center py-2">← Volver</button>
          </div>
        )}

        {step === 'password' && (
          <form onSubmit={verifyLogin} className="space-y-6">
             <div className="text-center">
               <span className="text-xs text-gray-500 uppercase tracking-widest">Iniciando sesión como</span>
               <div className="text-lg font-bold text-brand-lime mt-1">
                 {selectedRole === 'admin' ? 'Administrador' : selectedTech?.name}
               </div>
             </div>
            <div>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-4 text-white focus:ring-2 focus:ring-brand-teal focus:border-transparent outline-none text-center tracking-widest text-lg placeholder-gray-600"
                  placeholder="CONTRASEÑA"
                  autoFocus
                />
              </div>
            </div>
            {error && <p className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded border border-red-900/50">{error}</p>}
            <button
              type="submit"
              className="w-full bg-brand-teal hover:bg-teal-700 text-white font-bold py-4 rounded-lg transition-colors shadow-lg shadow-brand-teal/20"
            >
              ENTRAR
            </button>
            <button type="button" onClick={() => setStep('role')} className="w-full text-sm text-gray-500 hover:text-white text-center">
              Cancelar
            </button>
          </form>
        )}
        
        <div className="mt-8 pt-6 border-t border-gray-700 text-center">
           <p className="text-xs text-gray-600">Sistema Interno JDG Teleco v1.0</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
