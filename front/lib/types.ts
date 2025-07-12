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
  id: number;
  user_id: UUID;
  created_at: string; // ISO 8601 date string
  content: string;
  memory_aids: MemoryAids;
}

export interface MemoryItemCreate {
  content: string;
  memory_aids: MemoryAids;
}
