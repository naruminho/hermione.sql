import React from 'react';
import { ArrowRight } from 'lucide-react';

interface QuickActionsProps {
  actions: string[];
  onActionClick: (action: string) => void;
  disabled?: boolean;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ actions, onActionClick, disabled }) => {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 justify-end mt-2 animate-in fade-in duration-500">
      {actions.map((action, idx) => (
        <button
          key={idx}
          onClick={() => onActionClick(action)}
          disabled={disabled}
          className="group flex items-center gap-1.5 px-3 py-1.5 bg-[#2a171d] hover:bg-[#331c23] border border-[#3a1c23] text-xs text-[#f1e7c8] hover:text-white rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-[0_0_14px_rgba(0,0,0,0.35)]"
        >
          <span>{action}</span>
          <ArrowRight size={10} className="opacity-50 group-hover:opacity-100 transition-opacity text-[#cbbf95]" />
        </button>
      ))}
    </div>
  );
};
