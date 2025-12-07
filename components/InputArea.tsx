import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, Dumbbell } from 'lucide-react';
import { AppState } from '../types';

interface InputAreaProps {
  onSend: (text: string) => void;
  appState: AppState;
}

export const InputArea: React.FC<InputAreaProps> = ({ onSend, appState }) => {
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

  const handleDrillRequest = () => {
    if (appState !== AppState.GENERATING) {
      onSend("DRILL_MODE_REQUEST");
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
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
        <div className="relative bg-slate-900 rounded-2xl border border-slate-700 flex items-end p-2 shadow-2xl gap-2">
          
          {/* Text Area */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte sobre SQL ou peça um exemplo..."
            className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 text-sm p-3 focus:outline-none resize-none max-h-48 overflow-y-auto scrollbar-hide"
            rows={1}
            disabled={appState === AppState.GENERATING}
          />

          <div className="flex items-center gap-1 pb-[1px] pr-[1px]">
             {/* Drill Button */}
            <button
              type="button"
              onClick={handleDrillRequest}
              disabled={appState === AppState.GENERATING}
              title="Gerar Exercício Prático"
              className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-center border border-transparent
                ${appState === AppState.GENERATING 
                  ? 'text-slate-600 cursor-not-allowed' 
                  : 'bg-slate-800 text-purple-400 hover:bg-slate-700 hover:text-purple-300 hover:border-purple-500/30'
                }
              `}
            >
              <Dumbbell size={18} />
            </button>

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