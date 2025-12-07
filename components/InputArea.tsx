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
        <div className={`absolute -inset-0.5 rounded-2xl opacity-20 group-hover:opacity-35 transition duration-500 blur ${isExamActive ? 'bg-[#5a2a2f]' : 'bg-[#3a1c23]'}`}></div>
        <div className="relative bg-[#1c0f16] rounded-2xl border border-[#3a1c23] flex items-end p-2 shadow-2xl gap-2">
          
          {/* Text Area */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isExamActive ? "Responda à questão do N.O.M..." : "Pergunte sobre SQL ou peça um exemplo..."}
            className="flex-1 bg-transparent text-[#f1e7c8] placeholder-[#cbbf95] text-sm p-3 focus:outline-none resize-none max-h-48 overflow-y-auto scrollbar-hide"
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
                  ? 'text-[#6a5156] cursor-not-allowed opacity-40' 
                  : 'bg-[#2a171d] text-[#f1e7c8] hover:bg-[#331c23] hover:text-white border border-[#3a1c23]'
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
                  ? 'text-[#6a5156] cursor-not-allowed opacity-40' 
                  : 'bg-[#2a171d] text-[#f1e7c8] hover:bg-[#331c23] hover:text-white border border-[#3a1c23]'
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
                    ? 'text-[#6a5156] cursor-not-allowed' 
                    : 'bg-[#2a171d] text-[#f1e7c8] hover:bg-[#331c23] hover:text-white border border-[#3a1c23]'
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
                  ? 'bg-[#b89a5a] hover:bg-[#c7ab6c] text-[#1c0f16] font-bold shadow-lg hover:shadow-[0_0_14px_rgba(0,0,0,0.35)]'
                  : 'bg-[#2a171d] text-[#6a5156] cursor-not-allowed'
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
