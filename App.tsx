import React, { useState, useRef, useEffect } from 'react';
import { generateContent } from './services/gemini';
import { Message, AppState, TableSchema, KnowledgeDrop, Module, UserProgress, ArchivedSession } from './types';
import { MessageBubble } from './components/MessageBubble';
import { InputArea } from './components/InputArea';
import { SchemaViewer } from './components/SchemaViewer';
import { QuickActions } from './components/QuickActions';
import { Database, Lightbulb, Sparkles, Menu, Wand2, Zap, BookOpen, GitCommit, Save, X, History, Lock } from 'lucide-react';

const APP_VERSION = "v2.1";

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

// DROPS now have minLevel to hide advanced content from beginners
const INITIAL_DROPS: KnowledgeDrop[] = [
  { id: '0', title: 'O Ponto e Vírgula', description: 'Em SQL, o ; é como o "Malfeito Feito". Ele diz ao banco que seu comando acabou. Sem ele, a magia não acontece!', rarity: 'common', unlocked: true, minLevel: 1 },
  { id: '2', title: 'Cuidado com Strings', description: 'Comparar texto (Strings) é muito mais lento que comparar números. Prefira IDs sempre que der!', rarity: 'common', unlocked: false, minLevel: 1 },
  { id: '3', title: 'O Perigo do SELECT *', description: 'Em bancos gigantes, trazer todas as colunas pode travar o cluster inteiro e custar caro!', rarity: 'rare', unlocked: false, minLevel: 1 },
  { id: '5', title: 'NULL: O Dementador', description: 'NULL não é zero e nem espaço vazio. É ausência de alma! Qualquer conta com NULL vira NULL (1 + NULL = NULL).', rarity: 'rare', unlocked: false, minLevel: 3 },
  { id: '4', title: 'JOIN é caro', description: 'Juntar tabelas exige mover dados pela rede (Shuffle). Evite joins desnecessários!', rarity: 'rare', unlocked: false, minLevel: 4 },
  { id: '7', title: 'Parquet vs CSV', description: 'Parquet é colunar e comprimido. É como uma bolsa da Hermione: cabe muito mais coisa e você acha o item rápido sem tirar tudo pra fora.', rarity: 'common', unlocked: false, minLevel: 5 },
  { id: '1', title: 'O Segredo do Lazy', description: 'O Spark (motor do Databricks) é preguiçoso. Ele não processa nada até você pedir para mostrar (Action).', rarity: 'legendary', unlocked: false, minLevel: 5 },
  { id: '6', title: 'Partitioning (Horcruxes)', description: 'Dividir dados em pastas (ex: por ano) faz o Spark ler só o que precisa. É como esconder pedaços da alma para não morrer lendo tudo.', rarity: 'legendary', unlocked: false, minLevel: 5 },
  { id: '8', title: 'Idempotência', description: 'Seu código deve poder rodar 1000 vezes sem duplicar dados. Se rodar duas vezes e criar dois Harrys, falhou!', rarity: 'legendary', unlocked: false, minLevel: 5 },
];

const INITIAL_MODULES: Module[] = [
  // NÍVEL 1: FUNDAMENTOS
  { id: 1, title: 'Nível 1: Feitiços Básicos', subtitle: 'SELECT, FROM, DISTINCT, LIMIT', active: true, completed: false },
  { id: 2, title: 'Nível 1: Filtros de Proteção', subtitle: 'WHERE, AND, OR, IN', active: false, completed: false },
  { id: 3, title: 'Nível 1: Organizando o Salão', subtitle: 'ORDER BY ASC/DESC', active: false, completed: false },
  
  // NÍVEL 2: ARITMÂNCIA (Agregações)
  { id: 4, title: 'Nível 2: Contando Estrelas', subtitle: 'COUNT, SUM, AVG, MIN, MAX', active: false, completed: false },
  { id: 5, title: 'Nível 2: O Poder do Grupo', subtitle: 'GROUP BY (O divisor de águas)', active: false, completed: false },
  { id: 6, title: 'Nível 2: Filtros Pós-Agrupamento', subtitle: 'HAVING vs WHERE', active: false, completed: false },
  
  // NÍVEL 3: TRANSFIGURAÇÃO (Manipulação)
  { id: 7, title: 'Nível 3: Lógica Condicional', subtitle: 'CASE WHEN (O "Se" do SQL)', active: false, completed: false },
  { id: 8, title: 'Nível 3: Lidando com o Tempo', subtitle: 'YEAR(), MONTH(), DATEDIFF()', active: false, completed: false },
  { id: 9, title: 'Nível 3: Expelliarmus NULLs', subtitle: 'COALESCE e tratamento de nulos', active: false, completed: false },
  
  // NÍVEL 4: POÇÕES (Relacionamentos)
  { id: 10, title: 'Nível 4: Misturando Caldeirões', subtitle: 'INNER JOIN (A interseção)', active: false, completed: false },
  { id: 11, title: 'Nível 4: Buscando os Solitários', subtitle: 'LEFT JOIN e RIGHT JOIN', active: false, completed: false },
  { id: 12, title: 'Nível 4: Unindo Forças', subtitle: 'UNION e UNION ALL', active: false, completed: false },
  
  // NÍVEL 5: MAGIA ANTIGA (Engenharia Avançada)
  { id: 13, title: 'Nível 5: Magia de Janela', subtitle: 'Window Functions (ROW_NUMBER, RANK)', active: false, completed: false },
  { id: 14, title: 'Nível 5: Organizando o Caos', subtitle: 'CTEs (WITH) e Subqueries', active: false, completed: false },
  { id: 15, title: 'Nível 5: Segredos do Spark', subtitle: 'Particionamento e Performance', active: false, completed: false },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'welcome',
    role: 'assistant',
    content: "Olá Lellinha! Eu sou a **Hermione**, sua monitora de dados! 🧙‍♀️✨\n\nPreparei um currículo completo de Hogwarts para você, do Nível 1 ao 5. Vamos transformar você numa Engenheira de Dados melhor que a própria Minerva McGonagall!\n\nComeçamos pelo **Nível 1: Feitiços Básicos**. \n\nO que deseja fazer?",
    timestamp: Date.now(),
    suggestedActions: [
      "Me ensine o SELECT",
      "Para que serve um banco de dados?",
      "Quero um desafio fácil"
    ]
  }
];

const STORAGE_KEYS = {
  MESSAGES: 'lellinha_messages',
  MODULES: 'lellinha_modules_v1.7',
  PROGRESS: 'lellinha_progress',
  ARCHIVES: 'lellinha_archives'
};

const App: React.FC = () => {
  // --- STATE ---
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [modules, setModules] = useState<Module[]>(INITIAL_MODULES);
  const [userProgress, setUserProgress] = useState<UserProgress>({ xp: 0, level: 1, currentModuleId: 1 });
  const [archives, setArchives] = useState<ArchivedSession[]>([]);
  
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showArchives, setShowArchives] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- PERSISTENCE (LOAD) ---
  useEffect(() => {
    const loadedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    const loadedModules = localStorage.getItem(STORAGE_KEYS.MODULES);
    const loadedProgress = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    const loadedArchives = localStorage.getItem(STORAGE_KEYS.ARCHIVES);

    if (loadedMessages) setMessages(JSON.parse(loadedMessages));
    if (loadedModules) {
       const parsed = JSON.parse(loadedModules);
       if (parsed.length < 10) {
          setModules(INITIAL_MODULES);
       } else {
          setModules(parsed);
       }
    } else {
       setModules(INITIAL_MODULES);
    }
    if (loadedProgress) setUserProgress(JSON.parse(loadedProgress));
    if (loadedArchives) setArchives(JSON.parse(loadedArchives));
  }, []);

  // --- PERSISTENCE (SAVE) ---
  useEffect(() => {
    // UPDATED: Do not save messages that are flagged as errors
    const validMessages = messages.filter(m => !m.isError);
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(validMessages));
    localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(modules));
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(userProgress));
    localStorage.setItem(STORAGE_KEYS.ARCHIVES, JSON.stringify(archives));
  }, [messages, modules, userProgress, archives]);

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
      const validMessages = messages.filter(m => !m.isError); // Filter errors before archiving
      
      const newArchive: ArchivedSession = {
        id: Date.now().toString(),
        date: Date.now(),
        title: `Sessão: ${currentModuleTitle}`,
        messages: validMessages,
        endModule: currentModuleTitle
      };
      
      setArchives(prev => [newArchive, ...prev]);
      setMessages(INITIAL_MESSAGES);
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

    if (text === "DUEL_MODE_REQUEST") {
      displayContent = "⚔️ Hermione, quero um DUELO! Mande uma bateria de exercícios!";
      prompt = "DUEL_MODE_REQUEST";
    }

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
    
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setAppState(AppState.GENERATING);

    const currentModule = modules.find(m => m.active)?.title || "Módulo Geral";
    const completedModulesList = modules
      .filter(m => m.completed)
      .map(m => m.title)
      .join(", ");

    try {
      const result = await generateContent(prompt, newMessages, currentModule, completedModulesList);

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
      const rawOptions = parts[1] ? parts[1].trim().split('\n').filter(s => s.trim().length > 0) : [];

      const { cleanText, xpGained, unlockNext } = parseHiddenTags(rawContent);

      if (xpGained > 0) {
        setUserProgress(prev => ({ ...prev, xp: prev.xp + xpGained }));
      }

      if (unlockNext) {
        setModules(prev => {
          const nextId = userProgress.currentModuleId + 1;
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
        
        // Update user level progress if we move to a module that represents a new Level block
        const nextMod = modules.find(m => m.id === userProgress.currentModuleId + 1);
        if (nextMod) {
            setUserProgress(prev => {
                // Heuristic: Module 4 starts Level 2, Module 7 starts Level 3, etc.
                // Assuming roughly 3 modules per level based on INITIAL_MODULES
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

  // Helper to group modules by Level for cleaner display
  const renderModuleList = () => {
    const grouped: Record<string, Module[]> = {};
    modules.forEach(mod => {
      const level = mod.title.split(':')[0]; // Extracts "Nível 1", "Nível 2"
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
            const cleanTitle = mod.title.split(': ')[1] || mod.title; // Removes "Nível X: " prefix
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
      
      {/* PENSEIRA MODAL (ARCHIVES) */}
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
                            <span className="font-bold text-xs opacity-50 block mb-1">{msg.role === 'user' ? 'Lellinha' : 'Hermione'}</span>
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
          <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-2 rounded-lg shadow-lg shadow-blue-900/20">
            <Wand2 className="text-white" size={24} />
          </div>
          <div>
            <h1 className="font-bold text-slate-100 leading-tight">Hermione</h1>
            <span className="text-[10px] text-blue-400 font-medium uppercase tracking-wider">Monitora de Dados</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1 mb-2">Sua Trilha Mágica</h3>
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

           <div className="grid grid-cols-2 gap-2">
               {/* Penseira Button */}
              <button 
                onClick={() => setShowArchives(true)}
                className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-cyan-200 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-md transition-all border border-slate-700"
                title="Abrir a Penseira (Histórico)"
              >
                <BookOpen size={14} />
                PENSEIRA
              </button>

              {/* Archive Button */}
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

      {/* Right Sidebar - Drops */}
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
              {INITIAL_DROPS.map(drop => {
                const isLevelLocked = userProgress.level < drop.minLevel;
                
                return (
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
                           <div className="mt-1 flex items-center gap-1">
                               {isLevelLocked ? (
                                   <span className="text-[10px] text-red-400 flex items-center gap-1 font-semibold">
                                     <Lock size={8} />
                                     Requer Nível {drop.minLevel}
                                   </span>
                               ) : (
                                   <p className="text-[10px] text-slate-600 italic">??? Bloqueado</p>
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