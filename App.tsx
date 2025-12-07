import React, { useState, useRef, useEffect } from 'react';
import { generateContent } from './services/gemini';
import { Message, AppState, TableSchema, KnowledgeDrop, Module, UserProgress } from './types';
import { MessageBubble } from './components/MessageBubble';
import { InputArea } from './components/InputArea';
import { SchemaViewer } from './components/SchemaViewer';
import { QuickActions } from './components/QuickActions';
import { Database, Lightbulb, Sparkles, Menu, Wand2, Zap, Trash2, GitCommit, AlertTriangle } from 'lucide-react';

const APP_VERSION = "v1.4"; // ATUALIZADO PARA v1.4 COM DUELOS

const ALL_TABLES: TableSchema[] = [
  {
    tableName: 'hogw_db.talunos',
    columns: [
      { name: 'id', type: 'INT', description: 'Identificador único do aluno (PK).', isKey: true },
      { name: 'nome', type: 'STRING', description: 'Nome do bruxo.' },
      { name: 'casa_id', type: 'INT', description: 'FK. Liga com tcasas.id', isKey: true },
      { name: 'ano', type: 'INT', description: 'Ano letivo (1-7).' },
      { name: 'patrono', type: 'STRING', description: 'Forma do patrono. Pode ser NULL.' },
      { name: 'nota_media', type: 'DECIMAL', description: 'Média geral.' },
      { name: 'email', type: 'STRING', description: 'Contato mágico.' },
    ]
  },
  {
    tableName: 'hogw_db.taulas',
    columns: [
      { name: 'id', type: 'INT', description: 'ID da aula.', isKey: true },
      { name: 'aluno_id', type: 'INT', description: 'Quem assistiu (FK).', isKey: true },
      { name: 'disciplina_id', type: 'INT', description: 'Qual matéria (FK).', isKey: true },
      { name: 'nota', type: 'DECIMAL', description: 'Nota obtida na aula.' },
      { name: 'data', type: 'DATE', description: 'Dia da aula.' },
      { name: 'presente', type: 'BOOLEAN', description: '1 = Presente, 0 = Matou aula.' },
    ]
  },
  {
    tableName: 'hogw_db.tcasas',
    columns: [
      { name: 'id', type: 'INT', description: 'ID da casa (PK).', isKey: true },
      { name: 'nome', type: 'STRING', description: 'Grifinória, Sonserina...' },
      { name: 'fundador', type: 'STRING', description: 'Quem criou a casa.' },
      { name: 'sala_comum', type: 'STRING', description: 'Localização.' },
    ]
  },
  {
    tableName: 'hogw_db.tdisciplinas',
    columns: [
      { name: 'id', type: 'INT', description: 'ID da matéria.', isKey: true },
      { name: 'nome', type: 'STRING', description: 'Poções, DCAT...' },
      { name: 'professor_id', type: 'INT', description: 'Quem ensina (FK).', isKey: true },
      { name: 'ano_minimo', type: 'INT', description: 'Pré-requisito de ano.' },
    ]
  },
  {
    tableName: 'hogw_db.tfeiticos',
    columns: [
      { name: 'id', type: 'INT', description: 'ID do feitiço.', isKey: true },
      { name: 'nome', type: 'STRING', description: 'Ex: Wingardium Leviosa.' },
      { name: 'dificuldade', type: 'STRING', description: 'Básico, Interm., Avançado.' },
      { name: 'categoria', type: 'STRING', description: 'Ataque, Defesa, Utilidade.' },
    ]
  },
  {
    tableName: 'hogw_db.tprofessores',
    columns: [
      { name: 'id', type: 'INT', description: 'ID do professor.', isKey: true },
      { name: 'nome', type: 'STRING', description: 'Ex: Severus Snape.' },
      { name: 'disciplina_preferencia', type: 'STRING', description: 'Especialidade.' },
      { name: 'senioridade', type: 'INT', description: 'Anos de experiência.' },
    ]
  },
  {
    tableName: 'hogw_db.tregistros',
    columns: [
      { name: 'id', type: 'INT', description: 'Log de aprendizado.', isKey: true },
      { name: 'aluno_id', type: 'INT', description: 'Quem aprendeu (FK).', isKey: true },
      { name: 'feitico_id', type: 'INT', description: 'O que aprendeu (FK).', isKey: true },
      { name: 'dominio', type: 'INT', description: 'Nível de domínio (0-10).' },
    ]
  },
];

const INITIAL_DROPS: KnowledgeDrop[] = [
  { id: '1', title: 'O Segredo do Lazy', description: 'O Spark (motor do Databricks) é preguiçoso. Ele não processa nada até você pedir para mostrar (Action).', rarity: 'legendary', unlocked: true },
  { id: '2', title: 'Cuidado com Strings', description: 'Comparar texto (Strings) é muito mais lento que comparar números. Prefira IDs sempre que der!', rarity: 'common', unlocked: true },
  { id: '3', title: 'O Perigo do SELECT *', description: 'Em bancos gigantes, trazer todas as colunas pode travar o cluster inteiro e custar caro!', rarity: 'rare', unlocked: false },
  { id: '4', title: 'JOIN é caro', description: 'Juntar tabelas exige mover dados pela rede (Shuffle). Evite joins desnecessários!', rarity: 'rare', unlocked: false },
];

const INITIAL_MODULES: Module[] = [
  { id: 1, title: 'Módulo 1: O Começo de Tudo', subtitle: 'SELECT e o mundo dos dados', active: true, completed: false },
  { id: 2, title: 'Módulo 2: Filtrando o Ruído', subtitle: 'WHERE e filtros lógicos', active: false, completed: false },
  { id: 3, title: 'Módulo 3: Agrupando Coisas', subtitle: 'GROUP BY e agregações', active: false, completed: false },
  { id: 4, title: 'Módulo 4: O Temido JOIN', subtitle: 'Juntando tabelas diferentes', active: false, completed: false },
  { id: 5, title: 'Módulo 5: Spark Tricks', subtitle: 'Particionamento e Shards', active: false, completed: false },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'welcome',
    role: 'assistant',
    content: "Olá Lellinha! Eu sou a **Hermione**, sua monitora de dados! 🧙‍♀️✨\n\nSQL é apenas a língua mágica que usamos para conversar com os dados. Não se preocupe, vamos começar do **zero absoluto**.\n\nEscolha uma das opções abaixo para começarmos!",
    timestamp: Date.now(),
    suggestedActions: [
      "O que é um SELECT?",
      "Para que serve um banco de dados?",
      "Como vejo os alunos?"
    ]
  }
];

const STORAGE_KEYS = {
  MESSAGES: 'lellinha_messages',
  MODULES: 'lellinha_modules',
  PROGRESS: 'lellinha_progress'
};

const App: React.FC = () => {
  // --- STATE ---
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [modules, setModules] = useState<Module[]>(INITIAL_MODULES);
  const [userProgress, setUserProgress] = useState<UserProgress>({ xp: 0, level: 1, currentModuleId: 1 });
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- PERSISTENCE (LOAD) ---
  useEffect(() => {
    const loadedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    const loadedModules = localStorage.getItem(STORAGE_KEYS.MODULES);
    const loadedProgress = localStorage.getItem(STORAGE_KEYS.PROGRESS);

    if (loadedMessages) setMessages(JSON.parse(loadedMessages));
    if (loadedModules) setModules(JSON.parse(loadedModules));
    if (loadedProgress) setUserProgress(JSON.parse(loadedProgress));
  }, []);

  // --- PERSISTENCE (SAVE) ---
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(modules));
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(userProgress));
  }, [messages, modules, userProgress]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- LOGIC ---

  const handleClearHistory = () => {
    if (confirm('Tem certeza? Isso vai apagar toda a sua conversa e progresso.')) {
      setMessages(INITIAL_MESSAGES);
      setModules(INITIAL_MODULES);
      setUserProgress({ xp: 0, level: 1, currentModuleId: 1 });
      localStorage.clear();
      // We don't reload page to keep SPA feel, just reset state
    }
  };

  const parseHiddenTags = (text: string) => {
    let cleanText = text;
    let xpGained = 0;
    let unlockNext = false;

    // Check for XP tag
    if (cleanText.includes('---XP:')) {
      const match = cleanText.match(/---XP:(\d+)---/);
      if (match) {
        xpGained = parseInt(match[1]);
        cleanText = cleanText.replace(/---XP:\d+---/, '');
      }
    }

    // Check for Unlock tag
    if (cleanText.includes('---UNLOCK_NEXT---')) {
      unlockNext = true;
      cleanText = cleanText.replace('---UNLOCK_NEXT---', '');
    }

    return { cleanText, xpGained, unlockNext };
  };

  const handleSend = async (text: string) => {
    let displayContent = text;
    let prompt = text;

    // Handle Drill Mode Request
    if (text === "DUEL_MODE_REQUEST") {
      displayContent = "⚔️ Hermione, quero um DUELO! Mande uma bateria de exercícios!";
      prompt = "DUEL_MODE_REQUEST";
    }

    // Handle Time Turner Request
    if (text === "TIME_TURNER_REQUEST") {
      displayContent = "⏳ Vira-Tempo: Hermione, revise algo que eu já aprendi.";
      prompt = "TIME_TURNER_REQUEST";
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: displayContent,
      timestamp: Date.now()
    };
    
    // Optimistic update for UI
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setAppState(AppState.GENERATING);

    // Get current module context
    const currentModule = modules.find(m => m.active)?.title || "Módulo Geral";
    const completedModulesList = modules
      .filter(m => m.completed)
      .map(m => m.title)
      .join(", ");

    // Pass FULL HISTORY and CONTEXT to the service
    const result = await generateContent(prompt, newMessages, currentModule, completedModulesList);

    // 1. Split Response from Options
    const parts = result.text.split('---OPTIONS---');
    let rawContent = parts[0].trim();
    const rawOptions = parts[1] ? parts[1].trim().split('\n').filter(s => s.trim().length > 0) : [];

    // 2. Parse Hidden Gamification Tags
    const { cleanText, xpGained, unlockNext } = parseHiddenTags(rawContent);

    // 3. Update Progress if needed
    if (xpGained > 0) {
      setUserProgress(prev => ({ ...prev, xp: prev.xp + xpGained }));
    }

    if (unlockNext) {
      setModules(prev => {
        const nextId = userProgress.currentModuleId + 1;
        // Check if next module exists and is not active
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
      
      if (modules.find(m => m.id === userProgress.currentModuleId + 1)) {
          setUserProgress(prev => ({ ...prev, currentModuleId: prev.currentModuleId + 1 }));
      }
    }

    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: cleanText,
      timestamp: Date.now(),
      isError: !!result.error,
      suggestedActions: rawOptions
    };

    setMessages(prev => [...prev, botMsg]);
    setAppState(AppState.IDLE);
  };

  // Mana bar calculation (just visual max 500 for level 1)
  const maxMana = 500;
  const manaPercentage = Math.min((userProgress.xp / maxMana) * 100, 100);
  const hasCompletedModules = modules.some(m => m.completed);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      
      {/* Left Sidebar - Navigation / Modules */}
      <aside className={`fixed md:static inset-y-0 left-0 z-30 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transform transition-transform duration-300 md:transform-none ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          {/* MUDANÇA VISUAL: CABEÇALHO ROSA PARA CONFIRMAÇÃO DE DEPLOY */}
          <div className="bg-gradient-to-br from-pink-600 to-rose-600 p-2 rounded-lg shadow-lg shadow-rose-900/20">
            <Wand2 className="text-white" size={24} />
          </div>
          <div>
            <h1 className="font-bold text-slate-100 leading-tight">Hermione</h1>
            <span className="text-[10px] text-pink-400 font-medium uppercase tracking-wider">Monitora de Dados</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-2">Sua Trilha Mágica</h3>
          <div className="space-y-2">
            {modules.map((mod) => (
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
                <h4 className={`font-medium text-xs md:text-sm ${mod.active ? 'text-slate-100' : 'text-slate-400'}`}>{mod.title}</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">{mod.subtitle}</p>
              </div>
            ))}
          </div>
        </div>

        {/* User Profile / Mana Bar */}
        <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-900">
           <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-800">
             <div className="flex items-center gap-3 mb-3">
               <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-sm font-bold shadow-md ring-2 ring-slate-900">L</div>
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-bold text-white truncate">Lellinha</p>
                 <p className="text-[10px] text-slate-400">Nível {userProgress.level} • {userProgress.xp} XP</p>
               </div>
             </div>
             
             {/* Mana Bar */}
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

           <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-600 flex items-center gap-1">
                <GitCommit size={10} />
                {APP_VERSION}
              </span>
              <button 
                onClick={handleClearHistory}
                className="flex items-center gap-1.5 text-[10px] font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-md transition-all shadow-md shadow-red-900/20 border border-red-500"
                title="Apagar histórico local"
              >
                <Trash2 size={12} />
                RESETAR
              </button>
           </div>
        </div>
      </aside>

      {/* Main Content - Chat */}
      <main className="flex-1 flex flex-col relative w-full h-full">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur z-20">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowMobileSidebar(!showMobileSidebar)} className="p-2 hover:bg-slate-800 rounded-lg">
              <Menu size={20} />
            </button>
            <span className="font-bold">Hermione</span>
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
                <span>Hermione está consultando os livros...</span>
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

      {/* Right Sidebar - Context / Drops */}
      <aside className="hidden lg:flex w-80 bg-slate-900/50 border-l border-slate-800 flex-col">
        <div className="p-5 border-b border-slate-800">
          <h2 className="font-semibold flex items-center gap-2 text-slate-200">
            <Database size={18} className="text-purple-400" />
            hogw_db
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
          
          {/* Schema Viewer Loop */}
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

          {/* Drops de Conhecimento */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
              <Lightbulb size={12} className="text-yellow-500" />
              Sapos de Chocolate (Drops)
            </h3>
            <div className="space-y-3">
              {INITIAL_DROPS.map(drop => (
                <div key={drop.id} className={`relative p-3 rounded-lg border transition-all ${
                  drop.unlocked 
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
                       {drop.unlocked ? (
                         <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{drop.description}</p>
                       ) : (
                         <p className="text-[10px] text-slate-600 mt-1 italic">??? Bloqueado</p>
                       )}
                     </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </aside>

    </div>
  );
};

export default App;