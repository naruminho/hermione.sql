import React from 'react';
import { Message, MentorType } from '../types';
import { User, AlertCircle, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface MessageBubbleProps {
  message: Message;
  activeMentor: MentorType;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, activeMentor }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mentorForMessage = message.mentor || activeMentor;
  const assistantAvatar = mentorForMessage === 'hermione' ? '/hermione.jpg' : '/narumi.jpg';
  const userAvatar = '/lellinha.png';

  // Simple Markdown Parser
  const renderContent = (content: string) => {
    // 1. Split by Code Blocks (```language ... ```)
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Push text before code block
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
      }
      // Push code block
      parts.push({ type: 'code-block', language: match[1] || 'text', content: match[2] });
      lastIndex = match.index + match[0].length;
    }
    // Push remaining text
    if (lastIndex < content.length) {
      parts.push({ type: 'text', content: content.slice(lastIndex) });
    }

    return parts.map((part, index) => {
      if (part.type === 'code-block') {
        return (
          <div key={index} className="my-3 rounded-lg overflow-hidden border border-slate-700 bg-slate-950/50">
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800">
              <span className="text-[10px] uppercase text-slate-500 font-mono">{part.language}</span>
              <button 
                onClick={() => handleCopy(part.content)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
                title="Copy code"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
            <pre className="p-3 overflow-x-auto scrollbar-hide">
              <code className="font-mono text-sm text-pink-300">{part.content.trim()}</code>
            </pre>
          </div>
        );
      }

      // Process Inline Formatting for text parts (Bold ** and Inline Code `)
      return (
        <span key={index}>
          {part.content.split(/(\*\*.*?\*\*|`.*?`)/g).map((segment, i) => {
            if (segment.startsWith('**') && segment.endsWith('**')) {
              return <strong key={i} className="font-bold text-white">{segment.slice(2, -2)}</strong>;
            }
            if (segment.startsWith('`') && segment.endsWith('`')) {
              return <code key={i} className="bg-slate-700/50 px-1.5 py-0.5 rounded text-indigo-300 font-mono text-xs border border-slate-600/50">{segment.slice(1, -1)}</code>;
            }
            return segment;
          })}
        </span>
      );
    });
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6 animate-in slide-in-from-bottom-2 duration-300`}>
      <div className={`flex max-w-[90%] md:max-w-[80%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
          isUser 
            ? 'bg-indigo-600' 
            : message.isError 
              ? 'bg-red-500' 
              : 'bg-gradient-to-br from-purple-600 to-indigo-600 overflow-hidden'
        }`}>
          {isUser ? (
            <img 
              src={userAvatar}
              alt="Lellinha"
              className="w-full h-full object-cover rounded-full"
              loading="lazy"
            />
          ) : message.isError ? (
            <AlertCircle size={16} className="text-white" />
          ) : (
            <img 
              src={assistantAvatar} 
              alt={mentorForMessage === 'hermione' ? 'Hermione' : 'Naruminho'} 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )}
        </div>

        {/* Bubble Content */}
        <div className={`group relative p-4 rounded-2xl shadow-md ${
          isUser 
            ? 'bg-indigo-600/20 text-indigo-50 rounded-tr-none border border-indigo-500/30' 
            : message.isError
              ? 'bg-red-900/20 text-red-200 rounded-tl-none border border-red-500/30'
              : 'bg-slate-800 text-slate-300 rounded-tl-none border border-slate-700'
        }`}>
          <div className="text-sm leading-relaxed font-sans">
            {renderContent(message.content)}
          </div>
          
          {/* Timestamp */}
          <div className={`flex items-center gap-2 mt-2 text-[10px] opacity-40 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <span>{new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
