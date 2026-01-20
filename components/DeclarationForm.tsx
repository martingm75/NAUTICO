
import React, { useState, useEffect } from 'react';
import { Boat, Passenger } from '../types';
import { X, Printer, Save, FileText, Trash2, Plus } from 'lucide-react';

interface DeclarationFormProps {
  boat: Boat;
  onSave: (updatedBoat: Boat) => void;
  onClose: () => void;
}

const DeclarationForm: React.FC<DeclarationFormProps> = ({ boat, onSave, onClose }) => {
  // Inicializamos con 10 filas de pasajeros para emular el papel oficial
  const initializePassengers = (existing: Passenger[] = []) => {
    const padded = [...existing];
    while (padded.length < 10) {
      padded.push({
        id: `row-${padded.length}`,
        firstName: '',
        lastName: '',
        birthDate: '',
        nationality: '',
        documentType: '',
        visa: ''
      });
    }
    return padded;
  };

  const [formData, setFormData] = useState<Boat>({
    ...boat,
    arrivalTime: boat.arrivalTime || '12:00',
    departureTime: boat.departureTime || '10:00',
    lastPort: boat.lastPort || '',
    lastCountry: boat.lastCountry || '',
    nextPort: boat.nextPort || '',
    nextCountry: boat.nextCountry || '',
    passengers: initializePassengers(boat.passengers)
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const updatePassenger = (id: string, field: keyof Passenger, value: string) => {
    setFormData(prev => ({
      ...prev,
      passengers: prev.passengers?.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleFinalSave = () => {
    // Filtramos los pasajeros vacíos antes de guardar realmente en la base de datos
    const cleanedPassengers = formData.passengers?.filter(p => 
      p.firstName.trim() || p.lastName.trim() || p.documentType.trim()
    ) || [];
    
    onSave({
      ...formData,
      passengers: cleanedPassengers
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex flex-col items-center overflow-y-auto py-10 print:p-0 print:bg-white print:overflow-visible">
      {/* Barra de Herramientas Flotante */}
      <div className="fixed top-6 right-6 flex gap-3 print:hidden z-[110]">
        <button 
          onClick={handlePrint}
          className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-2xl transition-all active:scale-95"
        >
          <Printer size={18} /> Imprimir / PDF
        </button>
        <button 
          onClick={handleFinalSave}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-2xl transition-all active:scale-95"
        >
          <Save size={18} /> Guardar Ficha Maestra
        </button>
        <button 
          onClick={onClose}
          className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-2xl transition-all"
        >
          <X size={24} />
        </button>
      </div>

      {/* DOCUMENTO OFICIAL A4 */}
      <div className="bg-white w-full max-w-[210mm] min-h-[297mm] p-[15mm] shadow-2xl border border-slate-300 print:shadow-none print:border-none print:m-0 font-serif text-slate-900 relative">
        
        {/* Cabecera Oficial */}
        <div className="flex justify-between items-start mb-6 border-b-2 border-slate-900 pb-4">
          <div className="flex gap-4 items-center">
             <div className="bg-sky-700 text-white p-2 font-bold text-xs leading-tight">
                XUNTA DE GALICIA<br/>
                <span className="text-[9px] font-normal">CONSELLERÍA DO MAR</span>
             </div>
          </div>
          <div className="text-right">
             <div className="text-sky-800 font-black italic text-xl">Portos</div>
             <div className="text-[10px] text-sky-800 font-bold uppercase tracking-widest">de Galicia</div>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-sm font-bold uppercase mb-1">Anexo 2.- Modelo de declaración</h1>
          <h2 className="text-[10px] font-bold uppercase mb-1">DECLARACIÓN EN BASE AL REGLAMENTO (CE) Nº 562/2006.- ANEXO VI.- PUNTO 3.2.7</h2>
          <h3 className="text-[10px] font-bold uppercase">Código de Fronteras Schengen</h3>
        </div>

        {/* PARTE 1 */}
        <div className="mb-4">
          <h4 className="text-[10px] font-bold border-b border-slate-900 mb-2 italic uppercase">1ª PARTE - Part 1 - Partie 1</h4>
          
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div className="border-b border-slate-300">
              <label className="block text-[8px] text-slate-500 uppercase">Puerto de entrada: Arrival port – Port d’arriveè</label>
              <div className="text-xs font-bold py-1">CAMARIÑAS</div>
            </div>
            <div className="border-b border-slate-300">
              <label className="block text-[8px] text-slate-500 uppercase">Gestor de la instalación: Operator of instalation</label>
              <div className="text-xs font-bold py-1">CLUB NAÚTICO DE CAMARIÑAS</div>
            </div>
            
            {/* Fechas Entrada */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border-b border-slate-300">
                <label className="block text-[8px] text-slate-500 uppercase">Fecha de entrada: Date of Arrival</label>
                <input 
                  type="date" 
                  name="arrivalDate" 
                  value={formData.arrivalDate} 
                  onChange={handleChange}
                  className="w-full text-xs font-bold py-1 bg-transparent border-none outline-none hover:bg-slate-50 focus:bg-sky-50 transition-colors"
                />
              </div>
              <div className="border-b border-slate-300">
                <label className="block text-[8px] text-slate-500 uppercase">Hora: Time</label>
                <input 
                  type="time" 
                  name="arrivalTime" 
                  value={formData.arrivalTime} 
                  onChange={handleChange}
                  className="w-full text-xs font-bold py-1 bg-transparent border-none outline-none hover:bg-slate-50 focus:bg-sky-50 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="border-b border-slate-300">
                <label className="block text-[8px] text-slate-500 uppercase">Último Puerto: Last port of call</label>
                <input 
                  type="text" 
                  name="lastPort" 
                  value={formData.lastPort} 
                  onChange={handleChange}
                  placeholder="Escribir puerto..."
                  className="w-full text-xs font-bold py-1 bg-transparent border-none outline-none hover:bg-slate-50 focus:bg-sky-50 transition-colors"
                />
              </div>
              <div className="border-b border-slate-300">
                <label className="block text-[8px] text-slate-500 uppercase">País: Country</label>
                <input 
                  type="text" 
                  name="lastCountry" 
                  value={formData.lastCountry} 
                  onChange={handleChange}
                  placeholder="Escribir país..."
                  className="w-full text-xs font-bold py-1 bg-transparent border-none outline-none hover:bg-slate-50 focus:bg-sky-50 transition-colors"
                />
              </div>
            </div>

            {/* Fechas Salida */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border-b border-slate-300">
                <label className="block text-[8px] text-slate-500 uppercase">Fecha de salida: Date of Departure</label>
                <input 
                  type="date" 
                  name="departureDate" 
                  value={formData.departureDate} 
                  onChange={handleChange}
                  className="w-full text-xs font-bold py-1 bg-transparent border-none outline-none hover:bg-slate-50 focus:bg-sky-50 transition-colors"
                />
              </div>
              <div className="border-b border-slate-300">
                <label className="block text-[8px] text-slate-500 uppercase">Hora: Time</label>
                <input 
                  type="time" 
                  name="departureTime" 
                  value={formData.departureTime} 
                  onChange={handleChange}
                  className="w-full text-xs font-bold py-1 bg-transparent border-none outline-none hover:bg-slate-50 focus:bg-sky-50 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="border-b border-slate-300">
                <label className="block text-[8px] text-slate-500 uppercase">Próximo Puerto: Next port of call</label>
                <input 
                  type="text" 
                  name="nextPort" 
                  value={formData.nextPort} 
                  onChange={handleChange}
                  placeholder="Escribir puerto..."
                  className="w-full text-xs font-bold py-1 bg-transparent border-none outline-none hover:bg-slate-50 focus:bg-sky-50 transition-colors"
                />
              </div>
              <div className="border-b border-slate-300">
                <label className="block text-[8px] text-slate-500 uppercase">País: Country</label>
                <input 
                  type="text" 
                  name="nextCountry" 
                  value={formData.nextCountry} 
                  onChange={handleChange}
                  placeholder="Escribir país..."
                  className="w-full text-xs font-bold py-1 bg-transparent border-none outline-none hover:bg-slate-50 focus:bg-sky-50 transition-colors"
                />
              </div>
            </div>

            {/* Datos Barco - Editables */}
            <div className="col-span-2 border-b border-slate-300">
              <label className="block text-[8px] text-slate-500 uppercase">Nombre del barco: Yacht name – Nom du navire</label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange}
                className="w-full text-xs font-bold py-1 uppercase bg-transparent border-none outline-none hover:bg-slate-50 focus:bg-sky-50 transition-colors"
              />
            </div>

            <div className="border-b border-slate-300">
              <label className="block text-[8px] text-slate-500 uppercase">Eslora: Length – Longueur</label>
              <input 
                type="text" 
                name="length" 
                value={formData.length} 
                onChange={handleChange}
                className="w-full text-xs font-bold py-1 bg-transparent border-none outline-none hover:bg-slate-50 focus:bg-sky-50 transition-colors"
              />
            </div>
            <div className="border-b border-slate-300">
              <label className="block text-[8px] text-slate-500 uppercase">Manga: Beam - Largueur</label>
              <input 
                type="text" 
                name="beam" 
                value={formData.beam} 
                onChange={handleChange}
                className="w-full text-xs font-bold py-1 bg-transparent border-none outline-none hover:bg-slate-50 focus:bg-sky-50 transition-colors"
              />
            </div>

            <div className="border-b border-slate-300">
              <label className="block text-[8px] text-slate-500 uppercase">Matrícula: Registration nº</label>
              <input 
                type="text" 
                name="registration" 
                value={formData.registration} 
                onChange={handleChange}
                className="w-full text-xs font-bold py-1 uppercase bg-transparent border-none outline-none hover:bg-slate-50 focus:bg-sky-50 transition-colors"
              />
            </div>
            <div className="border-b border-slate-300">
              <label className="block text-[8px] text-slate-500 uppercase">Bandera: Flag – Pavillon</label>
              <input 
                type="text" 
                name="flag" 
                value={formData.flag} 
                onChange={handleChange}
                className="w-full text-xs font-bold py-1 uppercase bg-transparent border-none outline-none hover:bg-slate-50 focus:bg-sky-50 transition-colors"
              />
            </div>

            <div className="col-span-2 border-b border-slate-300">
              <label className="block text-[8px] text-slate-500 uppercase">Puerto de Registro: Port of register – Port du registre</label>
              <input 
                type="text" 
                name="portOfRegistry" 
                value={formData.portOfRegistry || ''} 
                onChange={handleChange}
                className="w-full text-xs font-bold py-1 uppercase bg-transparent border-none outline-none hover:bg-slate-50 focus:bg-sky-50 transition-colors"
              />
            </div>

            {/* Datos Patrón - Editables */}
            <div className="border-b border-slate-300">
              <label className="block text-[8px] text-slate-500 uppercase">Patrón: Master / Captain - Capitaine</label>
              <input 
                type="text" 
                name="owner" 
                value={formData.owner} 
                onChange={handleChange}
                className="w-full text-xs font-bold py-1 uppercase bg-transparent border-none outline-none hover:bg-slate-50 focus:bg-sky-50 transition-colors"
              />
            </div>
            <div className="border-b border-slate-300">
              <label className="block text-[8px] text-slate-500 uppercase">DNI/Pasaporte: Passport - Passeport</label>
              <input 
                type="text" 
                name="skipperId" 
                value={formData.skipperId || ''} 
                onChange={handleChange}
                className="w-full text-xs font-bold py-1 uppercase bg-transparent border-none outline-none hover:bg-slate-50 focus:bg-sky-50 transition-colors"
              />
            </div>

            <div className="border-b border-slate-300">
              <label className="block text-[8px] text-slate-500 uppercase">Nacionalidad: Country - Pays</label>
              <input 
                type="text" 
                name="nationality" 
                value={formData.nationality || ''} 
                onChange={handleChange}
                className="w-full text-xs font-bold py-1 uppercase bg-transparent border-none outline-none hover:bg-slate-50 focus:bg-sky-50 transition-colors"
              />
            </div>
            <div className="border-b border-slate-300">
              <label className="block text-[8px] text-slate-500 uppercase">Teléfono(*): Phone - Téléphone</label>
              <input 
                type="text" 
                name="phone" 
                value={formData.phone || ''} 
                onChange={handleChange}
                className="w-full text-xs font-bold py-1 uppercase bg-transparent border-none outline-none hover:bg-slate-50 focus:bg-sky-50 transition-colors"
              />
            </div>
            <div className="col-span-2 border-b border-slate-300">
              <label className="block text-[8px] text-slate-500 uppercase">E-Mail(*): E-Mail</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email || ''} 
                onChange={handleChange}
                className="w-full text-xs font-bold py-1 bg-transparent border-none outline-none hover:bg-slate-50 focus:bg-sky-50 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* PARTE 2 - PASAJEROS EDITABLES ESTILO TABLA PAPEL */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-2 border-b border-slate-900">
             <h4 className="text-[10px] font-bold italic uppercase">2ª PARTE - Part 2 - Partie 2</h4>
          </div>
          
          <div className="text-center mb-4">
             <h5 className="text-[10px] font-bold uppercase underline">LISTADO DE PERSONAS A BORDO</h5>
             <p className="text-[8px] text-slate-500 italic">Manifest – Listé des personnes embarqués</p>
          </div>

          <table className="w-full border-collapse border border-slate-900 text-[8px]">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-900 p-1 text-left uppercase w-1/6">Nombre<br/><span className="font-normal text-[6px]">Given names</span></th>
                <th className="border border-slate-900 p-1 text-left uppercase w-1/6">Apellidos<br/><span className="font-normal text-[6px]">Surname</span></th>
                <th className="border border-slate-900 p-1 text-left uppercase w-1/6">Fecha Nac.<br/><span className="font-normal text-[6px]">Date of birth</span></th>
                <th className="border border-slate-900 p-1 text-left uppercase w-1/6">Nacionalidad<br/><span className="font-normal text-[6px]">Nationality</span></th>
                <th className="border border-slate-900 p-1 text-left uppercase w-1/6">Documento<br/><span className="font-normal text-[6px]">Passport Nº</span></th>
                <th className="border border-slate-900 p-1 text-left uppercase w-1/6">Visado<br/><span className="font-normal text-[6px]">Visa</span></th>
              </tr>
            </thead>
            <tbody>
              {formData.passengers?.map((p) => (
                <tr key={p.id}>
                  <td className="border border-slate-900 p-0">
                    <input 
                      type="text" 
                      value={p.firstName} 
                      onChange={(e) => updatePassenger(p.id, 'firstName', e.target.value)}
                      className="w-full p-1 bg-transparent border-none outline-none font-bold hover:bg-slate-50 focus:bg-sky-50 transition-colors"
                    />
                  </td>
                  <td className="border border-slate-900 p-0">
                    <input 
                      type="text" 
                      value={p.lastName} 
                      onChange={(e) => updatePassenger(p.id, 'lastName', e.target.value)}
                      className="w-full p-1 bg-transparent border-none outline-none font-bold hover:bg-slate-50 focus:bg-sky-50 transition-colors"
                    />
                  </td>
                  <td className="border border-slate-900 p-0">
                    <input 
                      type="text" 
                      placeholder="DD/MM/AAAA"
                      value={p.birthDate} 
                      onChange={(e) => updatePassenger(p.id, 'birthDate', e.target.value)}
                      className="w-full p-1 bg-transparent border-none outline-none font-bold hover:bg-slate-50 focus:bg-sky-50 transition-colors"
                    />
                  </td>
                  <td className="border border-slate-900 p-0">
                    <input 
                      type="text" 
                      value={p.nationality} 
                      onChange={(e) => updatePassenger(p.id, 'nationality', e.target.value)}
                      className="w-full p-1 bg-transparent border-none outline-none font-bold hover:bg-slate-50 focus:bg-sky-50 transition-colors"
                    />
                  </td>
                  <td className="border border-slate-900 p-0">
                    <input 
                      type="text" 
                      value={p.documentType} 
                      onChange={(e) => updatePassenger(p.id, 'documentType', e.target.value)}
                      className="w-full p-1 bg-transparent border-none outline-none font-bold hover:bg-slate-50 focus:bg-sky-50 transition-colors"
                    />
                  </td>
                  <td className="border border-slate-900 p-0">
                    <input 
                      type="text" 
                      value={p.visa} 
                      onChange={(e) => updatePassenger(p.id, 'visa', e.target.value)}
                      className="w-full p-1 bg-transparent border-none outline-none font-bold hover:bg-slate-50 focus:bg-sky-50 transition-colors"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-10 text-[7px] text-slate-400">
            (*) No obligatorio - Not required - Non requis
          </div>
        </div>

        {/* Pie de página */}
        <div className="mt-auto pt-16 grid grid-cols-2 gap-20">
           <div className="border-t border-slate-400 text-center pt-2">
             <p className="text-[8px] font-bold uppercase">Firma del Capitán / Patrón</p>
             <p className="text-[6px] text-slate-400 italic">Master Signature</p>
           </div>
           <div className="border-t border-slate-400 text-center pt-2">
             <p className="text-[8px] font-bold uppercase">Sello de la Instalación</p>
             <p className="text-[6px] text-slate-400 italic">Facility Stamp</p>
           </div>
        </div>

      </div>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            background: white !important;
          }
          .print-hidden {
            display: none !important;
          }
          input {
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
          }
          ::placeholder {
            color: transparent !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DeclarationForm;
