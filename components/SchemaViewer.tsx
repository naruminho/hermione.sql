import React, { useState } from 'react';
import { Table, Key, ChevronDown, ChevronRight } from 'lucide-react';
import { TableSchema } from '../types';

interface SchemaViewerProps {
  schema: TableSchema;
}

export const SchemaViewer: React.FC<SchemaViewerProps> = ({ schema }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden mb-2 transition-all duration-200">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-800/50 p-3 border-b border-slate-800/50 flex items-center justify-between hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Table size={16} className="text-pink-500" />
          <span className="font-semibold text-sm text-slate-200 font-mono tracking-tight">{schema.tableName}</span>
        </div>
        {isOpen ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
      </button>
      
      {isOpen && (
        <div className="p-0 animate-in slide-in-from-top-2 duration-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-2 pl-3">Col</th>
                <th className="p-2 text-right pr-3">Tipo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {schema.columns.map((col, idx) => (
                <tr key={idx} className="group hover:bg-slate-800/30 transition-colors">
                  <td className="p-2 pl-3 text-slate-300 font-mono flex items-center gap-2 relative">
                    {col.isKey && <Key size={10} className="text-yellow-500 flex-shrink-0" />}
                    <span className="truncate">{col.name}</span>
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute left-0 bottom-full mb-1 bg-slate-800 text-slate-200 p-2 rounded shadow-xl text-[10px] z-50 border border-slate-700 w-48 pointer-events-none">
                      {col.description}
                      <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-slate-700"></div>
                    </div>
                  </td>
                  <td className="p-2 pr-3 text-right text-indigo-400 font-mono text-[10px]">{col.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};