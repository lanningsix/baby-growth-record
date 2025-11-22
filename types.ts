export enum RecordType {
  PHOTO = 'PHOTO',
  MILESTONE = 'MILESTONE',
  GROWTH = 'GROWTH',
  NOTE = 'NOTE'
}

export interface GrowthData {
  height?: number; // cm
  weight?: number; // kg
}

export interface TimelineEvent {
  id: string;
  type: RecordType;
  date: string; // ISO string
  title?: string;
  description?: string;
  mediaUrl?: string; // Base64 or URL
  growthData?: GrowthData;
  tags?: string[];
  author: string; // For family sharing context
}

export interface BabyProfile {
  name: string;
  birthDate: string;
  gender?: 'boy' | 'girl' | 'other';
  photoUrl?: string;
  currentHeight: number;
  currentWeight: number;
}

export interface FamilyMember {
  id: string;
  name: string;
  role: 'admin' | 'viewer';
  email: string;
}