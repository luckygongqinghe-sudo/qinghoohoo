
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

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
  iconName: string; // 存储图标组件名
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

export interface SiteConfig {
  // Landing Page Text
  heroBadge: string; // 新增：首页闪烁标签文案
  heroTitle: string;
  heroDescription: string;
  primaryColor: string;
  featuresTitle: string;
  featuresSubtitle: string;
  aboutTitle: string;
  aboutSubtitle: string;
  ctaText: string;
  
  // Dynamic Lists
  features: LandingFeature[];
  aboutItems: AboutItem[];
  footerLinks: FooterLink[];
  
  // Dashboard Pages
  inputPageTitle: string;
  inputPageDesc: string;
  summaryPageTitle: string;
  summaryPageDesc: string;
  adminPageTitle: string;
  adminPageDesc: string;

  // Footer
  footerBrandName: string;
  footerDescription: string;
  footerContactEmail: string;
  footerContactPhone: string;
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
  symptoms: Record<string, number>;
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
  ctFeature: string;
  ctScore: number;
  qftResult: string;
  smearResult: string;
  cultureResult: string;
  totalScore: number;
  riskLevel: RiskLevel;
  suggestion: string;
  creatorId: string;
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  cases: Case[];
  config: ScoringConfig;
  siteConfig: SiteConfig;
}
