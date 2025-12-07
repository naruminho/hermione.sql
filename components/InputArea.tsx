import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Swords, Hourglass, ScrollText, X } from 'lucide-react';
import { AppState } from '../types';

interface InputAreaProps {
  onSend: (text: string) => void;
  appState: AppState;
  hasCompletedModules: boolean;
  isExamActive: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ onSend, appState, hasCompletedModules, isExamActive }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() && appState !== AppState.GENERATING) {
      onSend(input);
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleDuelRequest = () => {
    if (appState !== AppState.GENERATING) {
      onSend("DUEL_MODE_REQUEST");
    }
  };

  const handleOWLRequest = () => {
    if (appState !== AppState.GENERATING) {
      onSend("OWL_EXAM_REQUEST");
    }
  };

  const handleCancelExam = () => {
    if (appState !== AppState.GENERATING) {
      onSend("CANCEL_EXAM_REQUEST");
    }
  };

  const handleTimeTurnerRequest = () => {
    if (appState !== AppState.GENERATING && hasCompletedModules) {
      onSend("TIME_TURNER_REQUEST");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="relative group">
        <div className={`absolute -inset-0.5 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur ${isExamActive ? 'bg-gradient-to-r from-red-600 to-orange-600' : 'bg-gradient-to-r from-indigo-500 to-purple-600'}`}></div>
        <div className="relative bg-slate-900 rounded-2xl border border-slate-700 flex items-end p-2 shadow-2xl gap-2">
          
          {/* Text Area */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isExamActive ? "Responda à questão do N.O.M..." : "Pergunte sobre SQL ou peça um exemplo..."}
            className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 text-sm p-3 focus:outline-none resize-none max-h-48 overflow-y-auto scrollbar-hide"
            rows={1}
            disabled={appState === AppState.GENERATING}
          />

          <div className="flex items-center gap-1 pb-[1px] pr-[1px]">
             
            {/* Time Turner Button (Review) - Disabled during Exam */}
            <button
              type="button"
              onClick={handleTimeTurnerRequest}
              disabled={appState === AppState.GENERATING || !hasCompletedModules || isExamActive}
              title={hasCompletedModules ? "Vira-Tempo: Revisar matéria passada" : "Conclua um módulo para desbloquear o Vira-Tempo"}
              className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-center border border-transparent
                ${appState === AppState.GENERATING || !hasCompletedModules || isExamActive
                  ? 'text-slate-700 cursor-not-allowed opacity-50' 
                  : 'bg-slate-800 text-amber-400 hover:bg-slate-700 hover:text-amber-300 hover:border-amber-500/30 shadow-[0_0_10px_rgba(251,191,36,0.1)]'
                }
              `}
            >
              <Hourglass size={18} />
            </button>

             {/* Duel Button (Drill) - Disabled during Exam */}
            <button
              type="button"
              onClick={handleDuelRequest}
              disabled={appState === AppState.GENERATING || isExamActive}
              title="Modo Duelo: Bateria de Exercícios Rápidos"
              className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-center border border-transparent
                ${appState === AppState.GENERATING || isExamActive
                  ? 'text-slate-700 cursor-not-allowed opacity-50' 
                  : 'bg-slate-800 text-red-400 hover:bg-slate-700 hover:text-red-300 hover:border-red-500/30 shadow-[0_0_10px_rgba(248,113,113,0.1)]'
                }
              `}
            >
              <Swords size={18} />
            </button>

            {/* OWL Exam / Cancel Button */}
            {isExamActive ? (
              <button
                type="button"
                onClick={handleCancelExam}
                disabled={appState === AppState.GENERATING}
                title="CANCELAR PROVA (Desistência)"
                className="p-3 rounded-xl transition-all duration-200 flex items-center justify-center border border-transparent bg-red-900/50 text-red-400 hover:bg-red-900 hover:text-white hover:border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse"
              >
                <X size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOWLRequest}
                disabled={appState === AppState.GENERATING}
                title="Prestar N.O.M.s (Prova do Módulo)"
                className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-center border border-transparent
                  ${appState === AppState.GENERATING 
                    ? 'text-slate-600 cursor-not-allowed' 
                    : 'bg-slate-800 text-purple-400 hover:bg-slate-700 hover:text-purple-300 hover:border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.1)]'
                  }
                `}
              >
                <ScrollText size={18} />
              </button>
            )}

            {/* Send Button */}
            <button
              type="submit"
              disabled={!input.trim() || appState === AppState.GENERATING}
              className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-center
                ${input.trim() && appState !== AppState.GENERATING
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg hover:shadow-indigo-500/25'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }
              `}
            >
              {appState === AppState.GENERATING ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} className={input.trim() ? 'translate-x-0.5' : ''} />
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};