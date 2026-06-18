export interface MaterialItem {
  id: string;
  name: string;
  category: string;
  required: boolean;
  description: string;
  tips: string;
  photoSpec?: string;
  expiryCheck?: boolean;
}

export interface MaterialCategory {
  id: string;
  name: string;
  items: MaterialItem[];
}

export interface QuestionItem {
  id: string;
  question: string;
  options: {
    label: string;
    value: string;
    hint?: string;
  }[];
}

export interface SelfCheckResult {
  passed: boolean;
  score: number;
  warnings: string[];
  suggestions: string[];
}

export interface PhotoItem {
  id: string;
  materialId: string;
  name: string;
  url: string;
  originalUrl?: string;
  uploadedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  remark?: string;
  cropInfo?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

export interface ApplicantInfo {
  name: string;
  idNumber: string;
  checkPassed: boolean | null;
  checkTime?: string;
}

export interface ProgressStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
  date?: string;
}

export interface NoticeItem {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success';
  date: string;
  read: boolean;
}

export type RecognitionType = '幼儿园' | '小学' | '初级中学' | '高级中学' | '中等职业学校';

export interface UserProfile {
  name: string;
  idNumber: string;
  region: string;
  recognitionType: RecognitionType;
}
