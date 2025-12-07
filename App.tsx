import React, { useState, useRef, useEffect } from 'react';
import { generateContent } from './services/gemini';
import { Message, AppState, Module, UserProgress, ArchivedSession, MentorType, KnowledgeDrop } from './types';
import { INITIAL_MODULES, INITIAL_DROPS, ALL_TABLES } from './constants';
import { MessageBubble } from './components/MessageBubble';
import { InputArea } from './components/InputArea';
import { SchemaViewer } from './components/SchemaViewer';
import { QuickActions } from './components/QuickActions';
import { Database, Lightbulb, Sparkles, Menu, Wand2, BookOpen, GitCommit, Save, X, History, Lock, GraduationCap, Heart, Zap } from 'lucide-react';

const APP_VERSION = "v4.2";

const getWelcomeMessage = (mentor: MentorType) => {
  if (mentor === 'naru') {
    return "Oii Lellinha! Bem-vinda a **Hogwarts EAD**! 🏰🎓\n\nEu sou o **Naruminho**, seu namorado e monitor oficial. Preparei um currículo gostosinho pra você virar uma Engenheira de Dados top! huahua\n\nSe quiser algo mais... rígido... pode chamar a **Hermione** ali do lado.\n\nVamos começar pelo **Nível 1**, xuxuu. O que você quer fazer?";
  }
  return "Olá Isabella. Bem-vinda a **Hogwarts EAD**. 🏰🎓\n\nEu sou a **Hermione**, sua monitora oficial. Preparei um currículo rigoroso para você se tornar uma Engenheira de Dados de elite.\n\nVocê também pode escolher o **Naruminho** como seu mentor ali na barra lateral, se preferir menos... disciplina.\n\nComeçamos pelo **Nível 1**. Concentre-se. O que deseja?";
};

const getWelcomeActions = (mentor: MentorType) => {
  if (mentor === 'naru') {
    return [
      "Bora começar xuxuu",
      "Me ensina um exemplo",
      "Como funcionam as Casas?"
    ];
  }
  return [
    "Começar do zero",
    "Me dê um exemplo de SELECT",
    "Como funcionam as Casas?"
  ];
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'welcome',
    role: 'assistant',
    content: getWelcomeMessage('hermione'),
    timestamp: Date.now(),
    suggestedActions: getWelcomeActions('hermione')
  }
];

const STORAGE_KEYS = {
  MESSAGES: 'lellinha_messages',
  MODULES: 'lellinha_modules_v4.0', // Updated to force reload of modules
  DROPS: 'lellinha_drops_v4.0',
  PROGRESS: 'lellinha_progress',
  ARCHIVES: 'lellinha_archives',
  MENTOR: 'lellinha_active_mentor'
};

const App: React.FC = () => {
  // --- STATE ---
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [modules, setModules] = useState<Module[]>(INITIAL_MODULES);
  const [drops, setDrops] = useState<KnowledgeDrop[]>(INITIAL_DROPS);
  const [userProgress, setUserProgress] = useState<UserProgress>({ xp: 0, level: 1, currentModuleId: 1 });
  const [archives, setArchives] = useState<ArchivedSession[]>([]);
  const [activeMentor, setActiveMentor] = useState<MentorType>('hermione');
  
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showArchives, setShowArchives] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- PERSISTENCE (LOAD) WITH SAFETY ---
  useEffect(() => {
    const safeParse = (key: string, fallback: any) => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
      } catch (e) {
        console.warn(`Error parsing ${key} from localStorage`, e);
        return fallback;
      }
    };

    setMessages(safeParse(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES));
    
    // Validate modules structure length
    const storedModules = safeParse(STORAGE_KEYS.MODULES, INITIAL_MODULES);
    if (storedModules.length !== INITIAL_MODULES.length) {
      setModules(INITIAL_MODULES);
    } else {
      setModules(storedModules);
    }

    setDrops(safeParse(STORAGE_KEYS.DROPS, INITIAL_DROPS));
    setUserProgress(safeParse(STORAGE_KEYS.PROGRESS, { xp: 0, level: 1, currentModuleId: 1 }));
    setArchives(safeParse(STORAGE_KEYS.ARCHIVES, []));
    setActiveMentor(localStorage.getItem(STORAGE_KEYS.MENTOR) as MentorType || 'hermione');
  }, []);

  // --- PERSISTENCE (SAVE) ---
  useEffect(() => {
    const validMessages = messages.filter(m => !m.isError);
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(validMessages));
    localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(modules));
    localStorage.setItem(STORAGE_KEYS.DROPS, JSON.stringify(drops));
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(userProgress));
    localStorage.setItem(STORAGE_KEYS.ARCHIVES, JSON.stringify(archives));
    localStorage.setItem(STORAGE_KEYS.MENTOR, activeMentor);
  }, [messages, modules, drops, userProgress, archives, activeMentor]);

  // --- DYNAMIC WELCOME MESSAGE & ACTIONS ---
  useEffect(() => {
    setMessages(prev => {
      // Check if the first message is the welcome message
      if (prev.length > 0 && prev[0].id === 'welcome') {
        const newContent = getWelcomeMessage(activeMentor);
        const newActions = getWelcomeActions(activeMentor);
        
        // Only update if content is different to avoid loop
        if (prev[0].content !== newContent) {
          const newWelcome = { 
            ...prev[0], 
            content: newContent,
            suggestedActions: newActions
          };
          return [newWelcome, ...prev.slice(1)];
        }
      }
      return prev;
    });
  }, [activeMentor]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- LOGIC ---

  const handleArchiveAndReset = () => {
    if (messages.length <= 1) {
       setMessages(INITIAL_MESSAGES);
       return;
    }

    if (confirm('Deseja arquivar essa conversa na Penseira e iniciar um novo ciclo?')) {
      const currentModuleTitle = modules.find(m => m.active)?.title || "Geral";
      const validMessages = messages.filter(m => !m.isError);
      
      const newArchive: ArchivedSession = {
        id: Date.now().toString(),
        date: Date.now(),
        title: `Sessão: ${currentModuleTitle}`,
        messages: validMessages,
        endModule: currentModuleTitle
      };
      
      setArchives(prev => [newArchive, ...prev]);
      // Reset to welcome message with current mentor
      const resetMessage: Message = {
        ...INITIAL_MESSAGES[0],
        content: getWelcomeMessage(activeMentor),
        timestamp: Date.now(),
        suggestedActions: getWelcomeActions(activeMentor)
      };
      setMessages([resetMessage]);
    }
  };

  const parseHiddenTags = (text: string) => {
    let cleanText = text;
    let xpGained = 0;
    let unlockNext = false;

    if (cleanText.includes('---XP:')) {
      const match = cleanText.match(/---XP:(\d+)---/);
      if (match) {
        xpGained = parseInt(match[1]);
        cleanText = cleanText.replace(/---XP:\d+---/, '');
      }
    }

    if (cleanText.includes('---UNLOCK_NEXT---')) {
      unlockNext = true;
      cleanText = cleanText.replace('---UNLOCK_NEXT---', '');
    }

    return { cleanText, xpGained, unlockNext };
  };

  const handleSend = async (text: string) => {
    let displayContent = text;
    let prompt = text;

    if (text === "DUEL_MODE_REQUEST") {
      displayContent = "⚔️ Quero um DUELO! Mande uma bateria de exercícios!";
      prompt = "DUEL_MODE_REQUEST";
    }

    if (text === "TIME_TURNER_REQUEST") {
      displayContent = "⏳ Vira-Tempo: Revise algo que eu já aprendi.";
      prompt = "TIME_TURNER_REQUEST";
    }

    if (text === "OWL_EXAM_REQUEST") {
      displayContent = "📜 Quero prestar meus N.O.M.s (Prova do Módulo)!";
      prompt = "OWL_EXAM_REQUEST";
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: displayContent,
      timestamp: Date.now()
    };
    
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setAppState(AppState.GENERATING);

    const currentModule = modules.find(m => m.active)?.title || "Módulo Geral";
    const completedModulesList = modules
      .filter(m => m.completed)
      .map(m => m.title)
      .join(", ");

    try {
      // Pass the activeMentor to the service
      const result = await generateContent(prompt, newMessages, currentModule, completedModulesList, activeMentor);

      if (result.error) {
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.error,
          timestamp: Date.now(),
          isError: true,
        };
        setMessages(prev => [...prev, errorMsg]);
        return;
      }

      const parts = result.text.split('---OPTIONS---');
      let rawContent = parts[0].trim();
      
      const rawOptions = parts[1] 
        ? parts[1].trim().split('\n')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.includes('---') && !s.includes('XP:') && !s.includes('UNLOCK')) 
        : [];

      const { cleanText, xpGained, unlockNext } = parseHiddenTags(rawContent);

      if (xpGained > 0) {
        setUserProgress(prev => ({ ...prev, xp: prev.xp + xpGained }));
      }

      if (unlockNext) {
        // Unlock next module
        const nextId = userProgress.currentModuleId + 1;
        
        // 1. Advance Module
        setModules(prev => {
          const nextModuleExists = prev.find(m => m.id === nextId && !m.active);
          if (nextModuleExists) {
            return prev.map(m => {
              if (m.id === userProgress.currentModuleId) return { ...m, completed: true };
              if (m.id === nextId) return { ...m, active: true };
              return m;
            });
          }
          return prev;
        });

        // 2. Check for Contextual Drop Unlocks
        setDrops(prevDrops => {
            return prevDrops.map(drop => {
                if (drop.linkedModuleId === userProgress.currentModuleId && !drop.unlocked) {
                   return { ...drop, unlocked: true };
                }
                return drop;
            });
        });
        
        // 3. Update Progress (Level Up)
        const nextMod = modules.find(m => m.id === nextId);
        if (nextMod) {
            setUserProgress(prev => {
                const newLevel = Math.ceil((prev.currentModuleId + 1) / 3); 
                return { 
                    ...prev, 
                    currentModuleId: prev.currentModuleId + 1,
                    level: newLevel > prev.level ? newLevel : prev.level
                };
            });
        }
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: cleanText,
        timestamp: Date.now(),
        isError: false,
        suggestedActions: rawOptions
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Ocorreu um erro crítico de comunicação.",
        timestamp: Date.now(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setAppState(AppState.IDLE);
    }
  };

  const maxMana = 500;
  const manaPercentage = Math.min((userProgress.xp / maxMana) * 100, 100);
  const hasCompletedModules = modules.some(m => m.completed);

  const renderModuleList = () => {
    const grouped: Record<string, Module[]> = {};
    modules.forEach(mod => {
      const level = mod.title.split(':')[0];
      if (!grouped[level]) grouped[level] = [];
      grouped[level].push(mod);
    });

    return Object.entries(grouped).map(([level, mods]) => (
      <div key={level} className="mb-4">
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 pl-1 border-b border-slate-800 pb-1">
          {level.replace('Nível ', 'NÍVEL ')}
        </h4>
        <div className="space-y-2">
          {mods.map(mod => {
            const cleanTitle = mod.title.split(':')[1] || mod.title;
            return (
              <div key={mod.id} className={`p-3 rounded-lg border transition-all ${
                mod.active 
                  ? 'bg-purple-900/20 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.1)]' 
                  : mod.completed
                    ? 'bg-emerald-900/10 border-emerald-500/30'
                    : 'bg-slate-800/30 border-transparent opacity-60'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold ${
                      mod.active ? 'text-purple-400' : mod.completed ? 'text-emerald-400' : 'text-slate-500'
                    }`}>
                    {mod.active ? 'EM ANDAMENTO' : mod.completed ? 'COMPLETO' : 'BLOQUEADO'}
                  </span>
                  {mod.active && <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></div>}
                </div>
                <h4 className={`font-medium text-xs md:text-sm ${mod.active ? 'text-slate-100' : 'text-slate-400'}`}>{cleanTitle}</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">{mod.subtitle}</p>
              </div>
            );
          })}
        </div>
      </div>
    ));
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      
      {/* PENSEIRA MODAL */}
      {showArchives && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 w-full max-w-4xl h-[80vh] rounded-2xl border border-slate-700 shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2 text-cyan-400">
                <BookOpen className="text-cyan-400" />
                A Penseira (Memórias)
              </h2>
              <button onClick={() => setShowArchives(false)} className="p-2 hover:bg-slate-800 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              {archives.length === 0 ? (
                <div className="text-center text-slate-500 mt-20">
                  <History size={48} className="mx-auto mb-4 opacity-30" />
                  <p>Sua Penseira está vazia. Arquive uma conversa para vê-la aqui.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {archives.map(session => (
                    <div key={session.id} className="bg-slate-950/50 rounded-xl border border-slate-800 overflow-hidden">
                      <div className="p-3 bg-slate-900/80 border-b border-slate-800 flex justify-between items-center cursor-pointer">
                        <div>
                           <h3 className="font-bold text-slate-200">{session.title}</h3>
                           <p className="text-xs text-slate-500">{new Date(session.date).toLocaleString()}</p>
                        </div>
                        <span className="text-xs bg-slate-800 px-2 py-1 rounded border border-slate-700">{session.messages.length} msgs</span>
                      </div>
                      <div className="p-4 max-h-60 overflow-y-auto scrollbar-hide space-y-4">
                        {session.messages.map(msg => (
                          <div key={msg.id} className={`text-sm p-2 rounded ${msg.role === 'user' ? 'bg-indigo-900/20 text-indigo-200 ml-8' : 'bg-slate-800/50 text-slate-400 mr-8'}`}>
                            <span className="font-bold text-xs opacity-50 block mb-1">{msg.role === 'user' ? 'Lellinha' : 'Monitor'}</span>
                            {msg.content.substring(0, 150)}{msg.content.length > 150 ? '...' : ''}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Left Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-30 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transform transition-transform duration-300 md:transform-none ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="bg-gradient-to-br from-amber-500 to-yellow-600 p-2 rounded-lg shadow-lg shadow-amber-900/20">
            <GraduationCap className="text-white" size={24} />
          </div>
          <div>
            <h1 className="font-bold text-slate-100 leading-tight">Hogwarts EAD</h1>
            <span className="text-[10px] text-amber-500 font-medium uppercase tracking-wider">Engenharia de Dados</span>
          </div>
        </div>

        {/* Mentor Switcher */}
        <div className="px-4 pt-4 pb-0">
          <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Escolha seu Monitor:</p>
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
             <button 
               onClick={() => setActiveMentor('hermione')}
               className={`text-xs py-2 rounded-md flex items-center justify-center gap-1 transition-all ${activeMentor === 'hermione' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
             >
               <Wand2 size={12} /> Hermione
             </button>
             <button 
               onClick={() => setActiveMentor('naru')}
               className={`text-xs py-2 rounded-md flex items-center justify-center gap-1 transition-all ${activeMentor === 'naru' ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
             >
               <Heart size={12} /> Naruminho
             </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1 mb-2 mt-2">Sua Trilha Mágica</h3>
          {renderModuleList()}
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-900">
           <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-800">
             <div className="flex items-center gap-3 mb-3">
               <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-sm font-bold shadow-md ring-2 ring-slate-900">L</div>
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-bold text-white truncate">Lellinha</p>
                 <p className="text-[10px] text-slate-400">Nível {userProgress.level} • {userProgress.xp} XP</p>
               </div>
             </div>
             
             <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-medium">
                  <span className="text-blue-300 flex items-center gap-1"><Zap size={10}/> Mana</span>
                  <span className="text-blue-300">{Math.floor(manaPercentage)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all duration-1000"
                    style={{ width: `${manaPercentage}%` }}
                  ></div>
                </div>
             </div>
           </div>

           <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setShowArchives(true)}
                className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-cyan-200 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-md transition-all border border-slate-700"
                title="Abrir a Penseira (Histórico)"
              >
                <BookOpen size={14} />
                PENSEIRA
              </button>

              <button 
                onClick={handleArchiveAndReset}
                className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-emerald-200 bg-slate-800 hover:bg-emerald-900/30 px-3 py-2 rounded-md transition-all border border-emerald-500/30 hover:border-emerald-500"
                title="Salvar na Penseira e Limpar Tela"
              >
                <Save size={14} />
                ARQUIVAR
              </button>
           </div>
           
           <div className="flex justify-center pt-2">
             <span className="text-[10px] text-slate-600 flex items-center gap-1">
                <GitCommit size={10} />
                {APP_VERSION}
              </span>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative w-full h-full">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur z-20">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowMobileSidebar(!showMobileSidebar)} className="p-2 hover:bg-slate-800 rounded-lg">
              <Menu size={20} />
            </button>
            <span className="font-bold">Hogwarts EAD</span>
          </div>
          <span className="text-xs text-slate-500">{APP_VERSION}</span>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
          <div className="max-w-3xl mx-auto space-y-6 pb-4">
            {messages.map(msg => (
              <div key={msg.id}>
                <MessageBubble message={msg} />
                {msg.role === 'assistant' && msg.suggestedActions && (
                  <div className="flex justify-start ml-11 md:ml-12 -mt-4 mb-8">
                     <QuickActions 
                       actions={msg.suggestedActions} 
                       onActionClick={handleSend}
                       disabled={appState === AppState.GENERATING}
                     />
                  </div>
                )}
              </div>
            ))}
            
            {appState === AppState.GENERATING && (
              <div className="flex items-center gap-2 text-slate-500 text-sm ml-2 animate-pulse">
                <Sparkles size={16} className="text-purple-500 animate-spin" />
                <span>{activeMentor === 'hermione' ? 'Hermione consultando livros...' : 'Naruminho pensando com carinho...'}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="p-4 md:p-6 bg-slate-950 border-t border-slate-800/50 z-20">
          <div className="max-w-3xl mx-auto">
            <InputArea 
              onSend={handleSend} 
              appState={appState} 
              hasCompletedModules={hasCompletedModules} 
            />
          </div>
        </div>
      </main>

      {/* Right Sidebar - Drops */}
      <aside className="hidden lg:flex w-80 bg-slate-900/50 border-l border-slate-800 flex-col">
        <div className="p-5 border-b border-slate-800">
          <h2 className="font-semibold flex items-center gap-2 text-slate-200">
            <Database size={18} className="text-purple-400" />
            hogw_db
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
              Pergaminhos (Tabelas)
            </h3>
            <div className="space-y-1">
              {ALL_TABLES.map((schema) => (
                <SchemaViewer key={schema.tableName} schema={schema} />
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
              <Lightbulb size={12} className="text-yellow-500" />
              Sapos de Chocolate (Drops)
            </h3>
            <div className="space-y-3">
              {drops.map(drop => {
                const isLevelLocked = userProgress.level < drop.minLevel;
                const isModuleLocked = drop.linkedModuleId ? !modules.find(m => m.id === drop.linkedModuleId)?.completed : false;
                
                // Drop is locked if Level Requirement not met OR Module requirement not met
                const isLocked = !drop.unlocked && (isLevelLocked || isModuleLocked);

                return (
                  <div key={drop.id} className={`relative p-3 rounded-lg border transition-all ${
                    !isLocked 
                      ? 'bg-slate-800 border-slate-700' 
                      : 'bg-slate-900/50 border-slate-800 opacity-50 grayscale'
                  }`}>
                    <div className="flex items-start gap-3">
                       <div className={`mt-1 w-2 h-2 rounded-full ${
                         drop.rarity === 'legendary' ? 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]' :
                         drop.rarity === 'rare' ? 'bg-purple-400' : 'bg-slate-400'
                       }`} />
                       <div>
                         <h4 className="text-xs font-bold text-slate-200">{drop.title}</h4>
                         {!isLocked ? (
                           <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{drop.description}</p>
                         ) : (
                           <div className="mt-1 flex items-center gap-1">
                               {drop.linkedModuleId ? (
                                   <span className="text-[10px] text-indigo-400 flex items-center gap-1 font-semibold">
                                     <Lock size={8} />
                                     Requer Módulo {drop.linkedModuleId}
                                   </span>
                               ) : (
                                   <span className="text-[10px] text-red-400 flex items-center gap-1 font-semibold">
                                     <Lock size={8} />
                                     Requer Nível {drop.minLevel}
                                   </span>
                               )}
                           </div>
                         )}
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default App;