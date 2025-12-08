export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  mentor?: MentorType; // Used to keep avatar consistent with who answered
  isError?: boolean;
  suggestedActions?: string[];
}

export enum AppState {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
}

export type MentorType = 'hermione' | 'naru';

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
  linkedModuleId?: number; // New: Unlock when specific module is finished
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
