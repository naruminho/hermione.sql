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
}