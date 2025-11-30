
import React, { useState, useEffect } from 'react';
import { WorkReport } from '../App';
import { SaveIcon, CameraIcon, ChevronDownIcon } from './icons';

interface ReportFormProps {
  projects: string[];
  vehicles: string[];
  initialData?: WorkReport | null;
  onSave: (report: WorkReport) => void;
  onCancel: () => void;
}

const ReportForm: React.FC<ReportFormProps> = ({ projects, vehicles, initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    id: '',
    projectNum: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '07:30',
    endTime: '15:30',
    description: '',
    vehicle: '',
    isDriver: false,
    expenses: {
      food: 0,
      gas: 0,
      parking: 0,
      others: 0,
      othersDesc: ''
    },
    imageNames: [] as string[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        projectNum: initialData.projectNum,
        date: initialData.date,
        startTime: initialData.startTime,
        endTime: initialData.endTime,
        description: initialData.description,
        vehicle: initialData.vehicle,
        isDriver: initialData.isDriver,
        expenses: { ...initialData.expenses },
        imageNames: [...initialData.imageNames]
      });
    }
  }, [initialData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.projectNum) newErrors.projectNum = 'Requerido';
    else if (!/^\d{5}$/.test(formData.projectNum)) newErrors.projectNum = 'Debe tener 5 cifras';
    
    if (!formData.vehicle) newErrors.vehicle = 'Requerido';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      id: formData.id || Date.now().toString(), // Use existing ID if editing, or create new
      technician: '', // Filled by App
      projectNum: formData.projectNum,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      description: formData.description,
      vehicle: formData.vehicle,
      isDriver: formData.isDriver,
      expenses: formData.expenses,
      imageNames: formData.imageNames
    });
  };

  const handleExpenseChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      expenses: { ...prev.expenses, [field]: field === 'othersDesc' ? value : Number(value) }
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // In a real app we upload. Here we just store the name to simulate.
      const names = Array.from(e.target.files).map((f: File) => f.name);
      setFormData(prev => ({ ...prev, imageNames: [...prev.imageNames, ...names] }));
    }
  };

  return (
    <div className="bg-brand-panel rounded-xl border border-gray-700 p-4 md:p-6 shadow-xl relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-brand-teal rounded-t-xl"></div>
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
        <span className="text-brand-lime">{initialData ? '✏️' : '📝'}</span> {initialData ? 'Editar Parte' : 'Nuevo Parte'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Project & Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-brand-lime mb-1">Obra *</label>
            <div className="relative">
                <select
                value={formData.projectNum}
                onChange={e => setFormData({...formData, projectNum: e.target.value})}
                className={`w-full bg-gray-900 border ${errors.projectNum ? 'border-red-500' : 'border-gray-600'} rounded-lg pl-4 pr-10 py-3 text-white focus:ring-2 focus:ring-brand-teal outline-none appearance-none`}
                >
                <option value="">Seleccionar Obra...</option>
                {projects.map(p => {
                    const splitIdx = p.indexOf(' - ');
                    const id = splitIdx !== -1 ? p.substring(0, splitIdx) : p;
                    return <option key={p} value={id}>{p}</option>
                })}
                 {/* Fallback for editing old/deleted projects */}
                 {formData.projectNum && !projects.some(p => p.startsWith(formData.projectNum)) && (
                  <option value={formData.projectNum}>{formData.projectNum} (No en lista)</option>
                )}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                    <ChevronDownIcon className="w-5 h-5" />
                </div>
            </div>
             {errors.projectNum && <p className="text-red-400 text-xs mt-1">{errors.projectNum}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-brand-lime mb-1">Fecha *</label>
            <input
              type="date"
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-brand-teal outline-none"
            />
          </div>
        </div>

        {/* Times */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Entrada</label>
            <input
              type="time"
              value={formData.startTime}
              onChange={e => setFormData({...formData, startTime: e.target.value})}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-brand-teal outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Salida</label>
            <input
              type="time"
              value={formData.endTime}
              onChange={e => setFormData({...formData, endTime: e.target.value})}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-brand-teal outline-none"
            />
          </div>
        </div>

        {/* Description */}
        <div>
           <label className="block text-sm font-medium text-gray-400 mb-1">Descripción del Trabajo</label>
           <textarea
             rows={3}
             value={formData.description}
             onChange={e => setFormData({...formData, description: e.target.value})}
             className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-brand-teal outline-none"
             placeholder="Detalla las tareas realizadas..."
           />
        </div>

        {/* Vehicle */}
        <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700">
          <label className="block text-sm font-medium text-brand-lime mb-2">Vehículo *</label>
          <div className="relative">
            <select
                value={formData.vehicle}
                onChange={e => setFormData({...formData, vehicle: e.target.value})}
                className={`w-full bg-gray-800 border ${errors.vehicle ? 'border-red-500' : 'border-gray-600'} rounded-lg pl-4 pr-10 py-3 text-white focus:ring-2 focus:ring-brand-teal outline-none appearance-none mb-3`}
            >
                <option value="">Seleccionar vehículo...</option>
                {vehicles.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 pb-3">
                <ChevronDownIcon className="w-5 h-5" />
            </div>
          </div>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={formData.isDriver}
              onChange={e => setFormData({...formData, isDriver: e.target.checked})}
              className="w-5 h-5 rounded border-gray-600 text-brand-teal focus:ring-brand-teal bg-gray-800"
            />
            <span className="text-gray-300">He sido el conductor</span>
          </label>
        </div>

        {/* Expenses */}
        <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700">
           <h3 className="text-gray-300 font-medium mb-3">Gastos (€)</h3>
           <div className="grid grid-cols-2 gap-4 mb-3">
             <div>
                <label className="text-xs text-gray-500">Comida</label>
                <input type="number" min="0" step="0.01" value={formData.expenses.food || ''} onChange={e => handleExpenseChange('food', e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white focus:border-brand-teal outline-none" />
             </div>
             <div>
                <label className="text-xs text-gray-500">Gasolina</label>
                <input type="number" min="0" step="0.01" value={formData.expenses.gas || ''} onChange={e => handleExpenseChange('gas', e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white focus:border-brand-teal outline-none" />
             </div>
             <div>
                <label className="text-xs text-gray-500">Parking</label>
                <input type="number" min="0" step="0.01" value={formData.expenses.parking || ''} onChange={e => handleExpenseChange('parking', e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white focus:border-brand-teal outline-none" />
             </div>
             <div>
                <label className="text-xs text-gray-500">Otros</label>
                <input type="number" min="0" step="0.01" value={formData.expenses.others || ''} onChange={e => handleExpenseChange('others', e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white focus:border-brand-teal outline-none" />
             </div>
           </div>
           {formData.expenses.others > 0 && (
             <input 
              type="text" 
              placeholder="Descripción del gasto 'Otros'"
              value={formData.expenses.othersDesc}
              onChange={e => handleExpenseChange('othersDesc', e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm focus:border-brand-teal outline-none"
            />
           )}
        </div>

        {/* Images */}
        <div>
           <label className="block text-sm font-medium text-gray-400 mb-2">Imágenes</label>
           <div className="relative border-2 border-dashed border-gray-600 rounded-lg p-6 hover:bg-gray-700/50 transition text-center cursor-pointer group hover:border-brand-teal">
              <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <CameraIcon className="w-8 h-8 text-gray-500 mx-auto mb-2 group-hover:text-brand-teal transition-colors" />
              <span className="text-sm text-gray-400 group-hover:text-brand-lime transition-colors">Toca para subir fotos</span>
           </div>
           {formData.imageNames.length > 0 && (
             <ul className="mt-2 text-xs text-gray-400 space-y-1">
               {formData.imageNames.map((name, i) => <li key={i}>📷 {name}</li>)}
             </ul>
           )}
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-transparent border border-gray-600 text-gray-300 py-3 rounded-lg hover:bg-gray-700 font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 bg-brand-teal text-white py-3 rounded-lg hover:bg-teal-600 font-bold flex justify-center items-center gap-2 shadow-lg shadow-brand-teal/20"
          >
            <SaveIcon className="w-5 h-5" />
            {initialData ? 'Actualizar' : 'Guardar'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default ReportForm;
