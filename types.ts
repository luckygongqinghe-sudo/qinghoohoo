
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export type ThemeMode = 'light' | 'dark';

export enum RiskLevel {
  NONE = '无风险',
  LOW = '低风险',
  MEDIUM = '中风险',
  HIGH = '高风险',
  VERY_HIGH = '极高危风险',
  CONFIRMED = '确诊结核病'
}

export interface LandingFeature {
  id: string;
  title: string;
  description: string;
  iconName: string; 
}

export interface AboutItem {
  id: string;
  title: string;
  description: string;
}

export interface FooterLink {
  id: string;
  label: string;
  url: string;
}

export interface FooterSupportItem {
  id: string;
  label: string;
  value: string;
}

export interface RiskThreshold {
  id: string;
  level: string;
  min: number;
  max: number;
  suggestion: string;
}

export interface FewShotExample {
  id: string;
  scenario: string;
  reasoning: string;
  fusionScore: number;
}

export interface SiteConfig {
  heroBadge: string;
  heroTitle: string;
  heroDescription: string;
  heroImageUrl?: string;
  primaryColor: string;
  featuresTitle: string;
  featuresSubtitle: string;
  aboutTitle: string;
  aboutSubtitle: string;
  ctaText: string;
  features: LandingFeature[];
  aboutItems: AboutItem[];
  footerLinks: FooterLink[];
  footerSupportItems: FooterSupportItem[];
  footerCopyright: string;
  footerIcp: string;
  inputPageTitle: string;
  inputPageDesc: string;
  summaryPageTitle: string;
  summaryPageDesc: string;
  adminPageTitle: string;
  adminPageDesc: string;
  footerBrandName: string;
  footerDescription: string;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  active: boolean;
  approved: boolean; 
}

export interface ScoringConfig {
  history: Record<string, number>;
  exposure: Record<string, number>;
  ctFeatures: Record<string, number>;
  qft: Record<string, number>;
  smear: Record<string, number>;
  culture: Record<string, number>;
  molecular: Record<string, number>; 
  symptoms: Record<string, number>;
  thresholds: RiskThreshold[];
  fewShotExamples?: FewShotExample[]; // AI微调模块
}

export interface ImpactFactor {
  feature: string;
  impact: number; // 影响百分比或数值分
  reason: string;
}

export interface AiInference {
  reasoning: string;
  fusionScore: number;
  anomalies: string[];
  suggestedAction: string;
  confidence: number;
  impactFactors?: ImpactFactor[]; // 影响因子可视化
}

export interface Case {
  id: string;
  timestamp: number;
  name: string;
  age: number;
  gender: '男' | '女';
  height: number;
  weight: number;
  bmi: number;
  history: string[];
  symptoms: string[];
  exposure: string;
  ctFeatures: string[]; // 核心升级：从单选改为多选数组
  ctScore: number;
  qftResult: string;
  smearResult: string;
  cultureResult: string;
  molecularResult: string; 
  totalScore: number;
  originalScore?: number; 
  riskLevel: string;
  suggestion: string;
  creatorId: string;
  creatorName: string;
  aiInference?: AiInference;
}

export interface BatchStatus {
  isProcessing: boolean;
  current: number;
  total: number;
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  cases: Case[];
  config: ScoringConfig;
  siteConfig: SiteConfig;
  theme: ThemeMode;
  batchStatus: BatchStatus;
}
