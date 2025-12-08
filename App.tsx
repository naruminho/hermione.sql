import React, { useState, useRef, useEffect } from 'react';
import { generateContent } from './services/gemini';
import { Message, AppState, Module, UserProgress, ArchivedSession, MentorType, KnowledgeDrop } from './types';
import { INITIAL_MODULES, INITIAL_DROPS, ALL_TABLES } from './constants';
import { MessageBubble } from './components/MessageBubble';
import { InputArea } from './components/InputArea';
import { SchemaViewer } from './components/SchemaViewer';
import { QuickActions } from './components/QuickActions';
import { Database, Lightbulb, Sparkles, Menu, Wand2, BookOpen, GitCommit, Save, X, History, Lock, GraduationCap, Heart, Zap, ArrowLeft } from 'lucide-react';

const APP_VERSION = "v5.3";

const getWelcomeMessage = (mentor: MentorType) => {
  if (mentor === 'naru') {
    return "Oii Lellinha! Bem-vinda a **Hogwarts EAD**! 🏰🎓\n\nEu sou o **Naruminho**, seu monitor oficial. Preparei um currículo gostosinho pra você virar uma Engenheira de Dados top! huahua\n\nSe quiser algo mais rígido, pode chamar a **Hermione** ali do lado.\n\nVamos começar pelo **Nível 1**, xuxuu. O que você quer fazer?";
  }
  return "Olá Isabella. Bem-vinda a **Hogwarts EAD**. 🏰🎓\n\nEu sou a **Hermione**, sua monitora oficial. Preparei um currículo rigoroso para você se tornar uma Engenheira de Dados de elite.\n\nVocê também pode escolher o **Naruminho** como seu mentor ali na barra lateral, pois ele é um monitor razoável.\n\nComeçamos pelo **Nível 1**. Concentre-se. O que deseja?";
};

const getWelcomeActions = (mentor: MentorType, moduleId: number) => {
  const levelActions: Record<number, string[]> = {
    1: ["Me mostra um SELECT básico", "Como filtrar linhas com WHERE?", "Como limitar resultados?"],
    2: ["Como usar DISTINCT?", "Quando evitar duplicatas?", "Exemplo de DISTINCT com COUNT"],
    3: ["Diferença entre AND e OR", "Exemplo de filtro com IN", "Como tratar NULL em filtros?"],
    4: ["Ordenar do maior pro menor", "Ordenar por múltiplas colunas", "ORDER BY com alias"],
    5: ["Exemplo de COUNT e SUM", "Quando usar AVG?", "MIN e MAX na prática"],
    6: ["Como fazer GROUP BY?", "GROUP BY com múltiplas colunas", "Agregação com filtros"],
    7: ["Quando usar HAVING?", "HAVING vs WHERE", "Filtro pós-agrupamento"],
    8: ["CASE WHEN simples", "CASE com múltiplas condições", "Tratar categorias com CASE"],
    9: ["Extrair ano e mês", "DATEDIFF exemplo", "Filtrar por data"],
    10: ["COALESCE para NULL", "Substituir valores nulos", "Default para campos vazios"],
    11: ["INNER JOIN básico", "Join entre alunos e casas", "Quando o JOIN falha?"],
    12: ["LEFT JOIN vs RIGHT JOIN", "Como achar órfãos com LEFT", "Usar IS NULL pós-join"],
    13: ["UNION vs UNION ALL", "Quando preferir UNION ALL", "Juntando resultados diferentes"],
    14: ["ROW_NUMBER exemplo", "RANK e DENSE_RANK", "Particionar em janela"],
    15: ["CTE (WITH) básico", "Subquery vs CTE", "Reutilizar CTE em join"],
    16: ["O que é particionamento?", "Evitar SELECT * em tabelas grandes", "Exemplo de leitura filtrada"]
  };

  const defaults = ["Como escrever um SELECT?", "Me dê um exemplo com WHERE", "Como juntar tabelas?"];
  const mentorTone = mentor === 'naru' ? (txt: string) => txt.replace(/^Como /, "Como ") : (txt: string) => txt;
  const chosen = levelActions[moduleId] || defaults;
  return chosen.map(mentorTone);
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'welcome',
    role: 'assistant',
    content: getWelcomeMessage('hermione'),
    timestamp: Date.now(),
    mentor: 'hermione',
    suggestedActions: getWelcomeActions('hermione', 1)
  }
];

const STORAGE_KEYS = {
  MESSAGES: 'lellinha_messages',
  MODULES: 'lellinha_modules_v4.4', // Force reload for curriculum structure
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
  const [isExamActive, setIsExamActive] = useState(false);
  const [selectedArchive, setSelectedArchive] = useState<ArchivedSession | null>(null);
  
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
    const currentModuleId = modules.find(m => m.active)?.id || 1;

    setMessages(prev => {
      if (prev.length > 0 && prev[0].id === 'welcome') {
        const newContent = getWelcomeMessage(activeMentor);
        const newActions = getWelcomeActions(activeMentor, currentModuleId);

        if (prev[0].content !== newContent || prev[0].suggestedActions !== newActions) {
          const newWelcome = { 
            ...prev[0], 
            content: newContent,
            mentor: activeMentor,
            suggestedActions: newActions
          };
          return [newWelcome, ...prev.slice(1)];
        }
      }
      return prev;
    });
  }, [activeMentor, modules]);

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
      const activeModule = modules.find(m => m.active);
      const currentModuleTitle = activeModule?.title || "Geral";
      const currentModuleId = activeModule?.id || 1;
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
        mentor: activeMentor,
        suggestedActions: getWelcomeActions(activeMentor, currentModuleId)
      };
      setMessages([resetMessage]);
      setIsExamActive(false); // Reset exam state on archive
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
      setIsExamActive(true); // START EXAM MODE
    }

    if (text === "CANCEL_EXAM_REQUEST") {
      displayContent = "❌ CANCELAR PROVA (Pânico!)";
      prompt = "CANCEL_EXAM_REQUEST";
      setIsExamActive(false); // END EXAM MODE
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
          mentor: activeMentor,
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
        // Exam passed!
        setIsExamActive(false);

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
        mentor: activeMentor,
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
                  ? 'bg-[#2b151d] border-[#6a3a3f]' 
                  : mod.completed
                    ? 'bg-[#241219] border-[#534234]'
                    : 'bg-[#1a0e14] border-transparent opacity-60'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold ${
                      mod.active ? 'text-[#f1e7c8]' : mod.completed ? 'text-[#d9caa2]' : 'text-[#cbbf95]'
                    }`}>
                    {mod.active ? 'EM ANDAMENTO' : mod.completed ? 'COMPLETO' : 'BLOQUEADO'}
                  </span>
                  {mod.active && <div className="w-1.5 h-1.5 rounded-full bg-[#d4b670] animate-pulse"></div>}
                </div>
                <h4 className={`font-medium text-xs md:text-sm ${mod.active ? 'text-[#f1e7c8]' : 'text-[#d9caa2]'}`}>{cleanTitle}</h4>
                <p className="text-[10px] text-[#cbbf95] mt-0.5">{mod.subtitle}</p>
              </div>
            );
          })}
        </div>
      </div>
    ));
  };

  return (
    <div className="flex h-screen bg-[#120a0e] text-[#e6d8b0] overflow-hidden font-sans">

      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div 
          className="fixed inset-0 bg-black/60 z-20 md:hidden" 
          onClick={() => setShowMobileSidebar(false)}
          aria-hidden="true"
        />
      )}
      
      {/* PENSEIRA MODAL */}
      {showArchives && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-gradient-to-br from-red-950 via-slate-950 to-amber-950 w-full max-w-7xl h-[90vh] rounded-2xl border border-red-900/60 shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-red-900/60 flex items-center justify-between bg-gradient-to-r from-red-900/60 via-red-950 to-amber-900/40">
              <div className="flex items-center gap-3">
                {selectedArchive && (
                  <button
                    onClick={() => setSelectedArchive(null)}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-amber-100 bg-red-900/80 hover:bg-red-800 rounded-lg border border-amber-700/60 shadow-sm transition-colors"
                  >
                    <ArrowLeft size={16} />
                    Voltar
                  </button>
                )}
                <h2 className="text-xl font-bold flex items-center gap-2 text-amber-200">
                  <BookOpen className="text-amber-300" />
                  A Penseira (Memórias)
                </h2>
              </div>
              <button onClick={() => { setShowArchives(false); setSelectedArchive(null); }} className="p-2 hover:bg-red-900/70 rounded-lg text-amber-200">
                <X size={20} />
              </button>
            </div>

            {!selectedArchive ? (
              <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                {archives.length === 0 ? (
                  <div className="text-center text-amber-200/70 mt-20">
                    <History size={48} className="mx-auto mb-4 opacity-40 text-amber-300" />
                    <p>Sua Penseira está vazia. Arquive uma conversa para vê-la aqui.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {archives.map(session => (
                      <button
                        key={session.id}
                        onClick={() => setSelectedArchive(session)}
                        className="w-full text-left bg-red-950/40 hover:bg-red-900/40 rounded-xl border border-amber-900/50 transition-colors p-4 flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
                      >
                        <div className="space-y-1">
                          <h3 className="font-bold text-amber-100">{session.title}</h3>
                          <p className="text-xs text-amber-200/70">{new Date(session.date).toLocaleString()}</p>
                          <p className="text-sm text-amber-100/80 truncate">
                            {session.messages[0]?.content.substring(0, 120)}{session.messages[0]?.content.length > 120 ? '...' : ''}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 text-xs text-amber-200/70">
                          <span className="bg-amber-900/60 px-2 py-1 rounded border border-amber-700/70 text-amber-100">{session.messages.length} msgs</span>
                          <span className="text-amber-200/60">Clique para ler</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-amber-900/70 bg-red-900/40">
                  <h3 className="text-lg font-bold text-amber-100">{selectedArchive.title}</h3>
                  <p className="text-xs text-amber-200/70">Registrada em {new Date(selectedArchive.date).toLocaleString()}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide bg-gradient-to-b from-red-950/50 via-slate-950/60 to-amber-950/40">
                  {selectedArchive.messages.map(msg => {
                    const mentorForMsg = msg.mentor || activeMentor || 'hermione';
                    const mentorAvatar = mentorForMsg === 'hermione' ? '/hermione.jpg' : '/narumi.jpg';
                    const isUserMsg = msg.role === 'user';
                    const avatarSrc = isUserMsg ? '/lellinha.png' : mentorAvatar;
                    const avatarAlt = isUserMsg ? 'Lellinha' : mentorForMsg === 'hermione' ? 'Hermione' : 'Naruminho';
                    const senderLabel = isUserMsg ? 'Lellinha' : avatarAlt;

                    return (
                      <div
                        key={msg.id}
                        className={`max-w-4xl flex ${isUserMsg ? 'ml-auto justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-start gap-3 ${isUserMsg ? 'flex-row-reverse text-right' : ''}`}>
                          <div className="w-9 h-9 rounded-full overflow-hidden shadow-md border border-[#3a1c23] bg-[#2a171d]">
                            <img
                              src={avatarSrc}
                              alt={avatarAlt}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <div className={`p-4 rounded-2xl border shadow-md ${
                            isUserMsg
                              ? 'bg-amber-900/30 border-amber-700/50 text-amber-50'
                              : msg.isError
                                ? 'bg-red-950/50 border-red-700/50 text-red-100'
                                : 'bg-red-900/40 border-amber-800/50 text-amber-100'
                          }`}>
                            <div className="text-[11px] font-semibold uppercase tracking-wide opacity-70 mb-2">
                              {senderLabel}
                            </div>
                            <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                            <div className="text-[10px] opacity-50 mt-2">
                              {new Date(msg.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Left Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-30 w-72 bg-[#1c0f16] border-r border-[#3a1c23] flex flex-col transform transition-transform duration-300 md:transform-none ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'} relative`}>
        <button 
          onClick={() => setShowMobileSidebar(false)}
          className="md:hidden absolute top-3 right-3 p-2 rounded-lg text-[#f1e7c8] hover:bg-[#2a171d] border border-[#3a1c23] shadow-lg"
          aria-label="Fechar menu"
        >
          <X size={18} />
        </button>
        <div className="p-6 border-b border-[#3a1c23] flex items-center gap-3 bg-[#241019]">
          <div className="bg-[#2a121c] p-2 rounded-lg shadow-lg border border-[#4a1f29]">
            <GraduationCap className="text-white" size={24} />
          </div>
          <div>
            <h1 className="font-bold text-[#f1e7c8] leading-tight">Hogwarts EAD</h1>
            <span className="text-[10px] text-[#d9caa2] font-medium uppercase tracking-wider">Engenharia de Dados</span>
          </div>
        </div>

        {/* Mentor Switcher */}
        <div className="px-4 pt-4 pb-0">
          <p className="text-[10px] text-[#cbbf95] font-bold uppercase mb-2">Escolha seu Monitor:</p>
          <div className="grid grid-cols-2 gap-2 bg-[#26121a] p-1 rounded-lg border border-[#3a1c23]">
             <button 
               onClick={() => setActiveMentor('hermione')}
               className={`text-xs py-2 rounded-md flex items-center justify-center gap-1 transition-all ${activeMentor === 'hermione' ? 'bg-[#4d1c28] text-[#f1e7c8] shadow-md shadow-[#00000045]' : 'text-[#d9caa2] hover:text-[#f1e7c8]'}`}
             >
               <Wand2 size={12} /> Hermione
             </button>
             <button 
               onClick={() => setActiveMentor('naru')}
               className={`text-xs py-2 rounded-md flex items-center justify-center gap-1 transition-all ${activeMentor === 'naru' ? 'bg-[#5a2a2f] text-[#f1e7c8] font-bold shadow-md shadow-[#00000045]' : 'text-[#d9caa2] hover:text-[#f1e7c8]'}`}
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
        <div className="p-4 border-t border-[#3a1c23] space-y-3 bg-[#1c0f16]">
          <div className="bg-[#241219] rounded-xl p-3 border border-[#3a1c23]">
             <div className="flex items-center gap-3 mb-3">
               <div className="w-9 h-9 rounded-full overflow-hidden bg-[#5a2a2f] shadow-md ring-2 ring-[#1c0f16]">
                 <img 
                   src="/lellinha.png" 
                   alt="Lellinha" 
                   className="w-full h-full object-cover" 
                   loading="lazy"
                 />
               </div>
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-bold text-[#f1e7c8] truncate">Lellinha</p>
                 <p className="text-[10px] text-[#cbbf95]">Nível {userProgress.level} • {userProgress.xp} XP</p>
               </div>
             </div>
             
             <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-medium">
                  <span className="text-[#f1e7c8] flex items-center gap-1"><Zap size={10}/> Mana</span>
                  <span className="text-[#f1e7c8]">{Math.floor(manaPercentage)}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#1a0e14] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#b89a5a] rounded-full transition-all duration-1000"
                    style={{ width: `${manaPercentage}%` }}
                  ></div>
                </div>
             </div>
           </div>

           <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setShowArchives(true)}
                className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-[#f1e7c8] bg-[#2a171d] hover:bg-[#331c23] px-3 py-2 rounded-md transition-all border border-[#3a1c23]"
                title="Abrir a Penseira (Histórico)"
              >
                <BookOpen size={14} />
                PENSEIRA
              </button>

              <button 
                onClick={handleArchiveAndReset}
                className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-[#f1e7c8] bg-[#3a1c23] hover:bg-[#422028] px-3 py-2 rounded-md transition-all border border-[#4a2a30]"
                title="Salvar na Penseira e Limpar Tela"
              >
                <Save size={14} />
                ARQUIVAR
              </button>
           </div>
           
           <div className="flex justify-center pt-2">
             <span className="text-[10px] text-[#cbbf95] flex items-center gap-1">
                <GitCommit size={10} />
                {APP_VERSION}
              </span>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative w-full h-full">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-[#3a1c23] bg-[#1c0f16] backdrop-blur z-20">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowMobileSidebar(!showMobileSidebar)} className="p-2 hover:bg-[#2a171d] rounded-lg text-[#f1e7c8]">
              <Menu size={20} />
            </button>
            <span className="font-bold text-[#f1e7c8]">Hogwarts EAD</span>
          </div>
          <span className="text-xs text-[#cbbf95]">{APP_VERSION}</span>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
          <div className="max-w-3xl mx-auto space-y-6 pb-4">
            {messages.map(msg => (
              <div key={msg.id}>
                <MessageBubble message={msg} activeMentor={activeMentor} />
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

        <div className="p-4 md:p-6 bg-[#1c0f16] border-t border-[#3a1c23] z-20">
          <div className="max-w-3xl mx-auto">
            <InputArea 
              onSend={handleSend} 
              appState={appState} 
              hasCompletedModules={hasCompletedModules} 
              isExamActive={isExamActive}
            />
          </div>
        </div>
      </main>

      {/* Right Sidebar - Drops */}
      <aside className="hidden lg:flex w-80 bg-[#1c0f16] border-l border-[#3a1c23] flex-col">
        <div className="p-5 border-b border-[#3a1c23]">
          <h2 className="font-semibold flex items-center gap-2 text-[#f1e7c8]">
            <Database size={18} className="text-[#d4b670]" />
            hogw_db
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
          <div>
            <h3 className="text-xs font-bold text-[#cbbf95] uppercase mb-3 flex items-center gap-2">
              Pergaminhos (Tabelas)
            </h3>
            <div className="space-y-1">
              {ALL_TABLES.map((schema) => (
                <SchemaViewer key={schema.tableName} schema={schema} />
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-[#cbbf95] uppercase mb-3 flex items-center gap-2">
              <Lightbulb size={12} className="text-[#d4b670]" />
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
                      ? 'bg-[#241219] border-[#4a2a30]' 
                      : 'bg-[#1a0e14] border-[#3a1c23] opacity-50 grayscale'
                  }`}>
                    <div className="flex items-start gap-3">
                       <div className={`mt-1 w-2 h-2 rounded-full ${
                         drop.rarity === 'legendary' ? 'bg-[#d4b670]' :
                         drop.rarity === 'rare' ? 'bg-[#c0887a]' : 'bg-[#cbbf95]'
                       }`} />
                       <div>
                         <h4 className="text-xs font-bold text-[#f1e7c8]">{drop.title}</h4>
                         {!isLocked ? (
                           <p className="text-[10px] text-[#d9caa2] mt-1 leading-relaxed">{drop.description}</p>
                         ) : (
                           <div className="mt-1 flex items-center gap-1">
                               {drop.linkedModuleId ? (
                                   <span className="text-[10px] text-[#d4b670] flex items-center gap-1 font-semibold">
                                     <Lock size={8} />
                                     Requer Módulo {drop.linkedModuleId}
                                   </span>
                               ) : (
                                   <span className="text-[10px] text-[#c0887a] flex items-center gap-1 font-semibold">
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
