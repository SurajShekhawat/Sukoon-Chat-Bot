import { MemoryCategory } from "./database";

export interface UserMemory {
  id: string;
  userId: string;
  content: string;
  category: MemoryCategory;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryExtractionCandidate {
  content: string;
  category: MemoryCategory;
  confidence: number;
}

