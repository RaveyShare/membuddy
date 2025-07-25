import type { UUID } from "crypto";

export interface User {
  id: UUID;
  email: string;
  full_name?: string;
}

export interface MindMapNode {
  id: string;
  label: string;
  children?: MindMapNode[];
}

export interface Mnemonic {
  id: string;
  title: string;
  content: string;
  type: string;
  explanation?: string;
}

export interface VisualAssociation {
  dynasty: string;
  image: string;
  color: string;
  association: string;
}

export interface AuditoryAssociation {
  dynasty: string;
  sound: string;
  rhythm: string;
}

export interface TactileAssociation {
  dynasty: string;
  texture: string;
  feeling: string;
}

export type SensoryAssociationContent = VisualAssociation[] | AuditoryAssociation[] | TactileAssociation[];

export interface SensoryAssociation {
  id: string;
  title: string;
  type: string;
  content: SensoryAssociationContent;
}

export interface MemoryAids {
  mindMap: MindMapNode;
  mnemonics: Mnemonic[];
  sensoryAssociations: SensoryAssociation[];
}

export interface MemoryItem {
  id: string; // Changed to string for UUID
  user_id: UUID;
  created_at: string; // ISO 8601 date string
  title: string;
  content: string;
  memory_aids?: MemoryAids;
  tags: string[];
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  mastery: number;
  reviewCount: number;
  starred: boolean;
  next_review_date?: string | null; // This is the new field
}

export interface MemoryItemCreate {
  content: string;
  memory_aids: MemoryAids;
}

export interface ReviewSchedule {
  id: string;
  memory_item_id: string;
  user_id: UUID;
  review_date: string;
  interval_days: number;
  repetition: number;
  easiness_factor: number;
  completed: boolean;
  created_at: string;
}

export interface ReviewCompletionRequest {
  quality: number; // 0-5 rating
  notes?: string;
}
