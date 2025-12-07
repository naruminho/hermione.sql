import { Module, KnowledgeDrop, TableSchema } from './types';

// --- DATABASE SCHEMA ---
export const ALL_TABLES: TableSchema[] = [
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

// --- KNOWLEDGE DROPS ---
export const INITIAL_DROPS: KnowledgeDrop[] = [
  { id: '0', title: 'O Ponto e Vírgula', description: 'Em SQL, o ; é como o "Malfeito Feito". Ele diz ao banco que seu comando acabou. Sem ele, a magia não acontece!', rarity: 'common', unlocked: true, minLevel: 1 },
  { id: '2', title: 'Cuidado com Strings', description: 'Comparar texto (Strings) é muito mais lento que comparar números. Prefira IDs sempre que der!', rarity: 'common', unlocked: false, minLevel: 1 },
  { id: '3', title: 'O Perigo do SELECT *', description: 'Em bancos gigantes, trazer todas as colunas pode travar o cluster inteiro e custar caro!', rarity: 'rare', unlocked: false, minLevel: 1 },
  { id: '5', title: 'NULL: O Dementador', description: 'NULL não é zero e nem espaço vazio. É ausência de alma! Qualquer conta com NULL vira NULL (1 + NULL = NULL).', rarity: 'rare', unlocked: false, minLevel: 3, linkedModuleId: 10 },
  { id: '4', title: 'JOIN é caro', description: 'Juntar tabelas exige mover dados pela rede (Shuffle). Evite joins desnecessários!', rarity: 'rare', unlocked: false, minLevel: 4, linkedModuleId: 11 },
  { id: '7', title: 'Parquet vs CSV', description: 'Parquet é colunar e comprimido. É como uma bolsa da Hermione: cabe muito mais coisa e você acha o item rápido sem tirar tudo pra fora.', rarity: 'common', unlocked: false, minLevel: 5 },
  { id: '1', title: 'O Segredo do Lazy', description: 'O Spark (motor do Databricks) é preguiçoso. Ele não processa nada até você pedir para mostrar (Action).', rarity: 'legendary', unlocked: false, minLevel: 5, linkedModuleId: 16 },
  { id: '6', title: 'Partitioning (Horcruxes)', description: 'Dividir dados em pastas (ex: por ano) faz o Spark ler só o que precisa. É como esconder pedaços da alma para não morrer lendo tudo.', rarity: 'legendary', unlocked: false, minLevel: 5, linkedModuleId: 16 },
  { id: '8', title: 'Idempotência', description: 'Seu código deve poder rodar 1000 vezes sem duplicar dados. Se rodar duas vezes e criar dois Harrys, falhou!', rarity: 'legendary', unlocked: false, minLevel: 5 },
];

// --- CURRICULUM ---
export const INITIAL_MODULES: Module[] = [
  // NÍVEL 1: FUNDAMENTOS
  { id: 1, title: 'Nível 1: Feitiços Básicos', subtitle: 'SELECT, FROM, LIMIT', active: true, completed: false },
  { id: 2, title: 'Nível 1: O Feitiço da Unicidade', subtitle: 'DISTINCT (Removendo duplicatas)', active: false, completed: false },
  { id: 3, title: 'Nível 1: Filtros de Proteção', subtitle: 'WHERE, AND, OR, IN', active: false, completed: false },
  { id: 4, title: 'Nível 1: Organizando o Salão', subtitle: 'ORDER BY ASC/DESC', active: false, completed: false },
  
  // NÍVEL 2: ARITMÂNCIA (Agregações)
  { id: 5, title: 'Nível 2: Contando Estrelas', subtitle: 'COUNT, SUM, AVG, MIN, MAX', active: false, completed: false },
  { id: 6, title: 'Nível 2: O Poder do Grupo', subtitle: 'GROUP BY (O divisor de águas)', active: false, completed: false },
  { id: 7, title: 'Nível 2: Filtros Pós-Agrupamento', subtitle: 'HAVING vs WHERE', active: false, completed: false },
  
  // NÍVEL 3: TRANSFIGURAÇÃO (Manipulação)
  { id: 8, title: 'Nível 3: Lógica Condicional', subtitle: 'CASE WHEN (O "Se" do SQL)', active: false, completed: false },
  { id: 9, title: 'Nível 3: Lidando com o Tempo', subtitle: 'YEAR(), MONTH(), DATEDIFF()', active: false, completed: false },
  { id: 10, title: 'Nível 3: Expelliarmus NULLs', subtitle: 'COALESCE e tratamento de nulos', active: false, completed: false },
  
  // NÍVEL 4: POÇÕES (Relacionamentos)
  { id: 11, title: 'Nível 4: Misturando Caldeirões', subtitle: 'INNER JOIN (A interseção)', active: false, completed: false },
  { id: 12, title: 'Nível 4: Buscando os Solitários', subtitle: 'LEFT JOIN e RIGHT JOIN', active: false, completed: false },
  { id: 13, title: 'Nível 4: Unindo Forças', subtitle: 'UNION e UNION ALL', active: false, completed: false },
  
  // NÍVEL 5: MAGIA ANTIGA (Engenharia Avançada)
  { id: 14, title: 'Nível 5: Magia de Janela', subtitle: 'Window Functions (ROW_NUMBER, RANK)', active: false, completed: false },
  { id: 15, title: 'Nível 5: Organizando o Caos', subtitle: 'CTEs (WITH) e Subqueries', active: false, completed: false },
  { id: 16, title: 'Nível 5: Segredos do Spark', subtitle: 'Particionamento e Performance', active: false, completed: false },
];

// --- HELPERS ---

// Generates the Curriculum Text for Gemini based on the actual modules object
export const generateCurriculumPrompt = (): string => {
  let prompt = "ESTRUTURA OBRIGATÓRIA DO CURSO (HOGWARTS DATA ENGINEERING):\n";
  prompt += "Você deve seguir estritamente esta ordem.\n\n";
  
  INITIAL_MODULES.forEach(mod => {
    prompt += `${mod.id}. ${mod.title} - ${mod.subtitle}\n`;
  });
  
  return prompt;
};

// Generates the Schema Text for Gemini with full column details
export const generateSchemaPrompt = (): string => {
  return ALL_TABLES.map(t => {
    const cols = t.columns.map(c => `- ${c.name} (${c.type}): ${c.description}${c.isKey ? ' [CHAVE]' : ''}`).join('\n');
    return `TABELA: ${t.tableName}\n${cols}`;
  }).join('\n\n');
};