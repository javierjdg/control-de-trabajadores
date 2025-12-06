mport React, { useState, useRef, useEffect } from 'react';
import { AppData, TechUser } from '../App';
import { TrashIcon, PlusIcon, DownloadIcon, UserIcon, TruckIcon, FileTextIcon, FilterIcon, EditIcon, SaveIcon, XIcon, LockIcon, UploadIcon, CloudIcon } from './icons';

interface AdminPanelProps {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ data, setData }) => {
  const [tab, setTab] = useState<'techs' | 'projects' | 'vehicles' | 'reports' | 'settings'>('reports');
  
  // Generic input for items
  const [newItemName, setNewItemName] = useState('');
  
  // Specific input for techs
  const [newTechPwd, setNewTechPwd] = useState('');

  // Editing State
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState(''); // Stores Name
  const [editPwdValue, setEditPwdValue] = useState(''); // Stores Password for techs

  // Password Settings State (Admin Only)
  const [newAdminPwd, setNewAdminPwd] = useState(data.adminPassword || 'admin');
  const [pwdMsg, setPwdMsg] = useState('');
  
  // Firebase Config State
  const [firebaseConfigInput, setFirebaseConfigInput] = useState('');

  // Filters
  const [filterTech, setFilterTech] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (data.firebaseConfig) {
        setFirebaseConfigInput(data.firebaseConfig);
    }
  }, [data.firebaseConfig]);

  const handleAdd = (type: 'techs' | 'projects' | 'vehicles') => {
    if (!newItemName.trim()) return;
    
    setData(prev => {
      if (type === 'techs') {
        const newTech: TechUser = {
          id: Date.now().toString(),
          name: newItemName,
          password: newTechPwd || '1234' // Default if empty
        };
        return { ...prev, technicians: [...prev.technicians, newTech] };
      }
      if (type === 'projects') return { ...prev, projects: [...prev.projects, newItemName] };
      if (type === 'vehicles') return { ...prev, vehicles: [...prev.vehicles, newItemName] };
      return prev;
    });
    setNewItemName('');
    setNewTechPwd('');
  };

  // Robust Delete Function - Receives type explicitly to avoid state closures issues
  const handleDelete = (type: 'techs' | 'projects' | 'vehicles', index: number) => {
    let itemName = "Elemento";
    
    // Safely get name for display
    if (type === 'techs' && data.technicians[index]) itemName = data.technicians[index].name;
    else if (type === 'projects' && data.projects[index]) itemName = data.projects[index];
    else if (type === 'vehicles' && data.vehicles[index]) itemName = data.vehicles[index];

    // Native confirm dialog
    if (!window.confirm(`¿Eliminar "${itemName}"? Esta acción no se puede deshacer.`)) {
        return;
    }

    // Direct state update based on type
    setData(prev => {
      if (type === 'techs') {
        return { ...prev, technicians: prev.technicians.filter((_, i) => i !== index) };
      }
      if (type === 'projects') {
        return { ...prev, projects: prev.projects.filter((_, i) => i !== index) };
      }
      if (type === 'vehicles') {
        return { ...prev, vehicles: prev.vehicles.filter((_, i) => i !== index) };
      }
      return prev;
    });
  };

  const startEditing = (index: number, item: any, type: 'techs' | 'projects' | 'vehicles') => {
    setEditingIndex(index);
    if (type === 'techs') {
      const t = item as TechUser;
      setEditValue(t.name);
      setEditPwdValue(t.password);
    } else {
      setEditValue(item as string);
    }
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditValue('');
    setEditPwdValue('');
  };

  const saveEditing = (type: 'techs' | 'projects' | 'vehicles') => {
    if (!editValue.trim() || editingIndex === null) return;
    
    setData(prev => {
      let newData = { ...prev };
      
      if (type === 'techs') {
        const originalTech = prev.technicians[editingIndex];
        const newArr = [...prev.technicians];
        newArr[editingIndex] = { ...originalTech, name: editValue, password: editPwdValue };
        newData.technicians = newArr;
        
        // Cascade update: Technician names in reports
        newData.reports = prev.reports.map(r => 
          r.technician === originalTech.name ? { ...r, technician: editValue } : r
        );
      } 
      else if (type === 'vehicles') {
        const originalValue = prev.vehicles[editingIndex];
        const newArr = [...prev.vehicles];
        newArr[editingIndex] = editValue;
        newData.vehicles = newArr;

        // Cascade update: Vehicle names in reports
        newData.reports = prev.reports.map(r => 
          r.vehicle === originalValue ? { ...r, vehicle: editValue } : r
        );
      } 
      else if (type === 'projects') {
        const newArr = [...prev.projects];
        newArr[editingIndex] = editValue;
        newData.projects = newArr;
      }

      return newData;
    });

    cancelEditing();
  };

  const savePasswords = () => {
    setData(prev => ({
      ...prev,
      adminPassword: newAdminPwd,
      firebaseConfig: firebaseConfigInput // Save cloud config
    }));
    setPwdMsg('Configuración actualizada.');
    setTimeout(() => setPwdMsg(''), 3000);
  };

  // Import Projects from CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r\n|\n/);
      const newProjects: string[] = [];
      let count = 0;

      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed) {
          const formatted = trimmed.replace(/[,;]/g, ' - ');
          
          if (!data.projects.includes(formatted)) {
            newProjects.push(formatted);
            count++;
          }
        }
      });

      if (count > 0) {
        setData(prev => ({
          ...prev,
          projects: [...prev.projects, ...newProjects]
        }));
        alert(`Se han importado ${count} obras correctamente.`);
      } else {
        alert('No se encontraron obras nuevas o el formato estaba vacío.');
      }
      
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  // Filter Logic
  const filteredReports = data.reports.filter(r => {
    if (filterTech && r.technician !== filterTech) return false;
    if (filterProject && !r.projectNum.includes(filterProject.split(' - ')[0])) return false;
    if (filterDate && r.date !== filterDate) return false;
    return true;
  });

  const downloadCSV = () => {
    const headers = [
      'ID', 'Fecha', 'Técnico', 'Num Obra', 'Entrada', 'Salida', 
      'Vehículo', 'Conductor', 'Desc. Trabajo', 
      'Gasto Comida', 'Gasto Gasolina', 'Gasto Parking', 'Gasto Otros', 'Desc. Otros', 'Imagenes'
    ].join(',');

    const rows = filteredReports.map(r => {
      const cleanDesc = r.description.replace(/(\r\n|\n|\r)/gm, " ").replace(/,/g, ";");
      const cleanOtherDesc = r.expenses.othersDesc.replace(/,/g, ";");
      const images = r.imageNames.join(' | ');
      
      return [
        r.id, r.date, r.technician, r.projectNum, r.startTime, r.endTime,
        r.vehicle, r.isDriver ? 'SI' : 'NO', `"${cleanDesc}"`,
        r.expenses.food, r.expenses.gas, r.expenses.parking, r.expenses.others, `"${cleanOtherDesc}"`, `"${images}"`
      ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    let filename = 'partes_trabajo';
    if(filterTech) filename += `_${filterTech.replace(/\s/g,'')}`;
    if(filterProject) filename += `_${filterProject.split(' - ')[0]}`;
    if(filterDate) filename += `_${filterDate}`;
    link.setAttribute("download", `${filename}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-brand-panel rounded-xl shadow-xl border border-gray-700 overflow-hidden min-h-[600px]">
      
      {/* Tabs */}
      <div className="flex border-b border-gray-700 bg-brand-dark overflow-x-auto">
        <button 
          onClick={() => { setTab('reports'); cancelEditing(); }} 
          className={`px-4 md:px-6 py-4 font-medium flex items-center gap-2 whitespace-nowrap ${tab === 'reports' ? 'text-brand-lime border-b-2 border-brand-lime bg-brand-panel' : 'text-gray-400 hover:text-gray-200'}`}
        >
          <FileTextIcon className="w-4 h-4" /> <span className="hidden md:inline">Base de Datos</span>
        </button>
        <button 
          onClick={() => { setTab('techs'); cancelEditing(); }} 
          className={`px-4 md:px-6 py-4 font-medium flex items-center gap-2 whitespace-nowrap ${tab === 'techs' ? 'text-brand-teal border-b-2 border-brand-teal bg-brand-panel' : 'text-gray-400 hover:text-gray-200'}`}
        >
          <UserIcon className="w-4 h-4" /> <span className="hidden md:inline">Técnicos</span>
        </button>
        <button 
          onClick={() => { setTab('projects'); cancelEditing(); }} 
          className={`px-4 md:px-6 py-4 font-medium flex items-center gap-2 whitespace-nowrap ${tab === 'projects' ? 'text-brand-teal border-b-2 border-brand-teal bg-brand-panel' : 'text-gray-400 hover:text-gray-200'}`}
        >
          🚧 <span className="hidden md:inline">Obras</span>
        </button>
        <button 
          onClick={() => { setTab('vehicles'); cancelEditing(); }} 
          className={`px-4 md:px-6 py-4 font-medium flex items-center gap-2 whitespace-nowrap ${tab === 'vehicles' ? 'text-brand-teal border-b-2 border-brand-teal bg-brand-panel' : 'text-gray-400 hover:text-gray-200'}`}
        >
          <TruckIcon className="w-4 h-4" /> <span className="hidden md:inline">Vehículos</span>
        </button>
        <button 
          onClick={() => { setTab('settings'); cancelEditing(); }} 
          className={`px-4 md:px-6 py-4 font-medium flex items-center gap-2 whitespace-nowrap ${tab === 'settings' ? 'text-brand-teal border-b-2 border-brand-teal bg-brand-panel' : 'text-gray-400 hover:text-gray-200'}`}
        >
          <LockIcon className="w-4 h-4" /> <span className="hidden md:inline">Configuración</span>
        </button>
      </div>

      <div className="p-6">
        
        {/* Reports Tab (Main Database) */}
        {tab === 'reports' && (
          <div>
            {/* Filters Section */}
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 mb-6">
              <div className="flex items-center gap-2 mb-3 text-brand-lime">
                <FilterIcon className="w-4 h-4" />
                <span className="font-bold text-sm uppercase">Filtros de Descarga y Visualización</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <select 
                   value={filterTech}
                   onChange={e => setFilterTech(e.target.value)}
                   className="bg-gray-800 border border-gray-600 text-sm rounded-lg p-2.5 text-white focus:ring-brand-teal focus:border-brand-teal"
                 >
                   <option value="">Todos los Técnicos</option>
                   {data.technicians.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                 </select>

                 <select 
                   value={filterProject}
                   onChange={e => setFilterProject(e.target.value)}
                   className="bg-gray-800 border border-gray-600 text-sm rounded-lg p-2.5 text-white focus:ring-brand-teal focus:border-brand-teal"
                 >
                   <option value="">Todas las Obras</option>
                   {data.projects.map(p => <option key={p} value={p}>{p}</option>)}
                 </select>

                 <input 
                   type="date"
                   value={filterDate}
                   onChange={e => setFilterDate(e.target.value)}
                   className="bg-gray-800 border border-gray-600 text-sm rounded-lg p-2.5 text-white focus:ring-brand-teal focus:border-brand-teal"
                 />
              </div>
              <div className="mt-4 flex justify-between items-center">
                 <span className="text-xs text-gray-500">
                    Mostrando {filteredReports.length} de {data.reports.length} registros
                 </span>
                 {(filterTech || filterProject || filterDate) && (
                    <button onClick={() => { setFilterTech(''); setFilterProject(''); setFilterDate(''); }} className="text-xs text-brand-lime hover:underline">
                      Borrar Filtros
                    </button>
                 )}
              </div>
            </div>

            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Registro de Actividad</h3>
              <button 
                onClick={downloadCSV}
                className="bg-brand-lime hover:bg-lime-600 text-brand-dark px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-lg transition-colors"
              >
                <DownloadIcon className="w-4 h-4" /> Descargar Excel
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-400">
                <thead className="text-xs text-brand-lime uppercase bg-gray-900/50">
                  <tr>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Técnico</th>
                    <th className="px-4 py-3">Obra</th>
                    <th className="px-4 py-3">Vehículo</th>
                    <th className="px-4 py-3">Desc.</th>
                    <th className="px-4 py-3 text-right">Gastos</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => {
                    const totalExpenses = Object.values(report.expenses).reduce((a: number, b: any) => (typeof b === 'number' ? a + b : a), 0) as number;
                    return (
                      <tr key={report.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-750">
                        <td className="px-4 py-3 whitespace-nowrap">{report.date}</td>
                        <td className="px-4 py-3">{report.technician}</td>
                        <td className="px-4 py-3 font-mono text-brand-teal">{report.projectNum}</td>
                        <td className="px-4 py-3 truncate max-w-[150px]">{report.vehicle}</td>
                        <td className="px-4 py-3 truncate max-w-[200px]">{report.description}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-200">
                           {totalExpenses > 0 ? `${totalExpenses.toFixed(2)}€` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredReports.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No hay datos que coincidan con los filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CRUD Tabs */}
        {['techs', 'projects', 'vehicles'].includes(tab) && (
          <div className="max-w-xl mx-auto">
             <div className="flex flex-col gap-2 mb-6">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder={`Nuevo ${tab === 'techs' ? 'Técnico' : tab === 'projects' ? 'Proyecto' : 'Vehículo'}...`}
                    className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-brand-teal outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd(tab as any)}
                  />
                  {tab === 'techs' && (
                    <input 
                      type="text" 
                      value={newTechPwd}
                      onChange={(e) => setNewTechPwd(e.target.value)}
                      placeholder="Contraseña"
                      className="w-1/3 bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-brand-teal outline-none"
                      onKeyDown={(e) => e.key === 'Enter' && handleAdd(tab as any)}
                    />
                  )}
                  <button 
                    onClick={() => handleAdd(tab as any)}
                    className="bg-brand-teal hover:bg-teal-600 text-white px-4 py-2 rounded-lg"
                  >
                    <PlusIcon className="w-5 h-5" />
                  </button>
                  
                  {/* IMPORT BUTTON FOR PROJECTS */}
                  {tab === 'projects' && (
                    <>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        accept=".csv,.txt"
                        className="hidden" 
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg"
                        title="Importar Excel/CSV"
                      >
                        <UploadIcon className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
                {tab === 'techs' && <p className="text-xs text-gray-500 pl-1">* Si no indicas contraseña, será '1234' por defecto</p>}
                {tab === 'projects' && <p className="text-xs text-gray-500 pl-1">* Puedes importar listas desde CSV/Excel (Guardar como .csv)</p>}
             </div>

             <div className="space-y-2">
               {(tab === 'techs' ? data.technicians : tab === 'projects' ? data.projects : data.vehicles).map((item, idx) => {
                 const displayValue = tab === 'techs' ? (item as TechUser).name : (item as string);
                 // Stable Key Generation
                 const key = tab === 'techs' ? (item as TechUser).id : `${displayValue}-${idx}`;

                 return (
                   <div key={key} className="flex justify-between items-center p-3 bg-gray-900 rounded-lg border border-gray-700 min-h-[60px] hover:border-brand-teal/50 transition-colors">
                      {editingIndex === idx ? (
                        <div className="flex w-full gap-2 items-center">
                          <input 
                            type="text" 
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white focus:ring-2 focus:ring-brand-teal outline-none"
                            autoFocus
                            placeholder="Nombre"
                          />
                          {tab === 'techs' && (
                            <input 
                              type="text" 
                              value={editPwdValue}
                              onChange={(e) => setEditPwdValue(e.target.value)}
                              className="w-1/3 bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white focus:ring-2 focus:ring-brand-teal outline-none"
                              placeholder="Pass"
                            />
                          )}
                          <button onClick={() => saveEditing(tab as any)} className="text-green-500 hover:text-green-400 p-1"><SaveIcon className="w-5 h-5"/></button>
                          <button onClick={cancelEditing} className="text-gray-500 hover:text-gray-400 p-1"><XIcon className="w-5 h-5"/></button>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-col">
                            <span className="text-gray-200">{displayValue}</span>
                            {tab === 'techs' && <span className="text-xs text-gray-500">Pass: ****</span>}
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => startEditing(idx, item, tab as any)}
                              className="text-brand-teal hover:text-teal-400 p-2"
                              title="Editar"
                            >
                              <EditIcon className="w-4 h-4 pointer-events-none" />
                            </button>
                            <button 
                              type="button"
                              onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(tab as 'techs' | 'projects' | 'vehicles', idx);
                              }}
                              className="text-red-400 hover:text-red-300 p-2 cursor-pointer relative z-10"
                              title="Borrar"
                            >
                              <TrashIcon className="w-4 h-4 pointer-events-none" />
                            </button>
                          </div>
                        </>
                      )}
                   </div>
                 );
               })}
               {(tab === 'techs' ? data.technicians : tab === 'projects' ? data.projects : data.vehicles).length === 0 && (
                 <p className="text-center text-gray-500">Lista vacía.</p>
               )}
             </div>
          </div>
        )}

        {/* Settings Tab */}
        {tab === 'settings' && (
           <div className="max-w-md mx-auto space-y-8 mt-4">
              <div className="text-center mb-6">
                 <h3 className="text-xl font-bold text-white mb-2">Gestión de Accesos</h3>
                 <p className="text-gray-400 text-sm">Configuración general de seguridad.</p>
              </div>

              <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
                <div className="flex items-center gap-3 mb-4 text-brand-teal">
                   <UserIcon className="w-6 h-6"/>
                   <h4 className="font-bold">Acceso Administrador</h4>
                </div>
                <label className="block text-sm text-gray-500 mb-1">Nueva Contraseña</label>
                <input 
                  type="text" 
                  value={newAdminPwd}
                  onChange={e => setNewAdminPwd(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-teal outline-none"
                />
              </div>

              {/* Cloud Sync Section */}
              <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <CloudIcon className="w-24 h-24 text-white" />
                </div>
                <div className="flex items-center gap-3 mb-4 text-brand-lime">
                   <CloudIcon className="w-6 h-6"/>
                   <h4 className="font-bold">Sincronización en la Nube (Firebase)</h4>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                    Pega aquí la configuración JSON de tu proyecto Firebase para sincronizar datos entre dispositivos.
                </p>
                <textarea 
                  rows={6}
                  value={firebaseConfigInput}
                  onChange={e => setFirebaseConfigInput(e.target.value)}
                  placeholder='const firebaseConfig = { ... }'
                  className="w-full bg-gray-950 border border-gray-600 rounded-lg p-3 text-gray-300 text-xs font-mono focus:ring-2 focus:ring-brand-lime outline-none mb-2"
                />
              </div>

              <button 
                onClick={savePasswords}
                className="w-full bg-brand-teal hover:bg-teal-600 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <SaveIcon className="w-5 h-5" /> Conectar y Guardar
              </button>

              {pwdMsg && (
                 <div className="text-center p-3 bg-brand-lime/20 text-brand-lime rounded-lg border border-brand-lime/50 animate-fade-in">
                    {pwdMsg}
                 </div>
              )}
           </div>
        )}

      </div>
    </div>
  );
};

export default AdminPanel;

