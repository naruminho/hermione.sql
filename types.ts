export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isError?: boolean;
  suggestedActions?: string[];
}

export enum AppState {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
}

export interface ColumnSchema {
  name: string;
  type: string;
  description: string;
  isKey?: boolean;
}

export interface TableSchema {
  tableName: string;
  columns: ColumnSchema[];
}

export interface KnowledgeDrop {
  id: string;
  title: string;
  description: string;
  rarity: 'common' | 'rare' | 'legendary';
  unlocked: boolean;
  minLevel: number;
}

export interface Module {
  id: number;
  title: string;
  subtitle: string;
  active: boolean;
  completed: boolean;
}

export interface UserProgress {
  xp: number; // Mana
  level: number;
  currentModuleId: number;
}

export interface ArchivedSession {
  id: string;
  date: number;
  title: string;
  messages: Message[];
  endModule: string;
}