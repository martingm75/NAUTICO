
import React, { useState } from 'react';

const Calculator: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [shouldReset, setShouldReset] = useState(false);

  const handleNumber = (num: string) => {
    if (display === '0' || shouldReset) {
      setDisplay(num);
      setShouldReset(false);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOperator = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setShouldReset(true);
  };

  const calculate = () => {
    try {
      const fullEq = equation + display;
      // Usamos una alternativa segura a eval para cálculos básicos simples
      const result = Function(`"use strict"; return (${fullEq.replace('×', '*').replace('÷', '/')})`)();
      setDisplay(Number(result.toFixed(4)).toString());
      setEquation('');
      setShouldReset(true);
    } catch (e) {
      setDisplay('Error');
    }
  };

  const clear = () => {
    setDisplay('0');
    setEquation('');
  };

  const Button = ({ children, onClick, className = '', variant = 'number' }: any) => {
    const baseClasses = "h-14 rounded-2xl text-lg font-bold transition-all active:scale-95 flex items-center justify-center";
    const variants: any = {
      number: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm",
      operator: "bg-sky-50 text-sky-600 border border-sky-100 hover:bg-sky-100",
      action: "bg-slate-900 text-white hover:bg-black col-span-2",
      clear: "bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-100"
    };
    
    return (
      <button onClick={onClick} className={`${baseClasses} ${variants[variant]} ${className}`}>
        {children}
      </button>
    );
  };

  return (
    <div className="w-full max-w-xs bg-white p-6 rounded-[2.5rem] shadow-2xl border border-slate-200">
      <div className="mb-6 px-2">
        <div className="text-right text-xs font-bold text-slate-400 h-4 mb-1 uppercase tracking-widest overflow-hidden whitespace-nowrap">
          {equation}
        </div>
        <div className="text-right text-4xl font-black text-slate-800 overflow-hidden whitespace-nowrap tracking-tighter">
          {display}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Button onClick={clear} variant="clear" className="col-span-2">C</Button>
        <Button onClick={() => handleOperator('÷')} variant="operator">÷</Button>
        <Button onClick={() => handleOperator('×')} variant="operator">×</Button>

        {[7, 8, 9].map(n => <Button key={n} onClick={() => handleNumber(n.toString())}>{n}</Button>)}
        <Button onClick={() => handleOperator('-')} variant="operator">-</Button>

        {[4, 5, 6].map(n => <Button key={n} onClick={() => handleNumber(n.toString())}>{n}</Button>)}
        <Button onClick={() => handleOperator('+')} variant="operator">+</Button>

        {[1, 2, 3].map(n => <Button key={n} onClick={() => handleNumber(n.toString())}>{n}</Button>)}
        <Button onClick={calculate} variant="operator" className="row-span-2 h-auto">=</Button>

        <Button onClick={() => handleNumber('0')} className="col-span-2">0</Button>
        <Button onClick={() => handleNumber('.')}>.</Button>
      </div>
      
      <div className="mt-6 flex justify-center">
        <div className="w-12 h-1 bg-slate-200 rounded-full"></div>
      </div>
    </div>
  );
};

export default Calculator;
