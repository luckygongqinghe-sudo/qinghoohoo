
import { ScoringConfig, SiteConfig } from './types';

export const DEFAULT_CONFIG: ScoringConfig = {
  history: {
    '陈旧性结核病': 10,
    '糖尿病': 8,
    'HIV感染': 15,
    '长期使用免疫抑制剂': 12,
    '慢性肾病': 5
  },
  exposure: {
    '无接触史': 0,
    '结核痰菌阴性患者接触': 10,
    '结核痰菌阳性患者接触': 20
  },
  ctFeatures: {
    '典型结核灶 (空洞/播散)': 25,
    '不典型浸润': 10,
    '多发结节': 15,
    '胸腔积液': 12
  },
  qft: {
    '阴性': 0,
    '弱阳性': 10,
    '阳性': 20
  },
  smear: {
    '阴性': 0,
    '阳性': 50
  },
  culture: {
    '阴性': 0,
    '阳性': 50
  },
  symptoms: {
    '咳嗽≥2周': 15,
    '咯血': 20,
    '发热': 10,
    '盗汗': 8,
    '体重减轻': 12,
    '气短': 10,
    '胸痛': 8,
    '疲劳': 5
  },
  thresholds: [
    { id: 't1', level: '无风险', min: 0, max: 10, suggestion: '维持健康生活习惯，定期进行常规体检。' },
    { id: 't2', level: '低风险', min: 11, max: 20, suggestion: '建议临床观察，若出现长期咳嗽等典型症状请及时随访。' },
    { id: 't3', level: '中风险', min: 21, max: 40, suggestion: '建议启动PPD/QFT筛查，并进行胸部低剂量螺旋CT扫描。' },
    { id: 't4', level: '高风险', min: 41, max: 60, suggestion: '高度疑似感染，请立即进行病原学检测，包括痰涂片及分子诊断。' },
    { id: 't5', level: '极高危风险', min: 61, max: 99, suggestion: '极高危！需立即转诊至结核病定点专科医院进行规范化排查。' },
    { id: 't6', level: '确诊结核病', min: 100, max: 999, suggestion: '临床诊断确立，请立即依据指南启动标准化化疗方案。' }
  ]
};

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  heroBadge: "全新数字化结核病筛查标准",
  heroTitle: "数字化、智能化\n结核病筛查模型探索",
  heroDescription: "集成多维医学评分模型与AI辅助诊断，为公共卫生机构提供全方位的数字化筛查与管理解决方案。",
  heroImageUrl: "https://images.unsplash.com/photo-1518152006812-edab29b069ac?auto=format&fit=crop&q=80&w=2000",
  primaryColor: "#059669",
  featuresTitle: "重塑临床筛查体验",
  featuresSubtitle: "专为现代公共卫生体系设计，我们将繁琐的医学评估简化为极致的工作流程。",
  aboutTitle: "全方位的医学数据隐私保护",
  aboutSubtitle: "Security First - 引领公共卫生领域的数字化转型",
  ctaText: "开始录入评估",
  
  features: [
    { 
      id: 'f1', 
      title: "智能风险分级", 
      description: "融合深度学习算法与临床指南，自动处理自定义多项临床指标，输出毫秒级诊断参考。",
      iconName: "ShieldCheck"
    },
    { 
      id: 'f2', 
      title: "结构化档案库", 
      description: "全生命周期病例追踪，从初筛到复诊，所有影像、实验室检测结果云端实时同步。",
      iconName: "Database"
    },
    { 
      id: 'f3', 
      title: "军工级安全架构", 
      description: "数据多层加密、物理隔离存储，符合最严苛的医疗隐私法规，确保敏感信息万无一失。",
      iconName: "Lock"
    }
  ],
  
  aboutItems: [
    { id: 'a1', title: "端到端加密", description: "采用 AES-256 银行级加密，确保数据在传输与存储过程中的绝对私密。" },
    { id: 'a2', title: "权限细分模型", description: "管理员与操作员角色严格隔离，每一笔数据访问均有可追溯的审计日志。" },
    { id: 'a3', title: "实时合规监测", description: "采用自动化合规扫描，确保系统始终符合最新的公共卫生信息安全标准。" }
  ],

  footerLinks: [],

  footerSupportItems: [
    { id: 's1', label: '系统支持', value: 'qinghoohoo@qq.com' },
    { id: 's2', label: '联系电话', value: '15xxxx11970' }
  ],
  
  footerCopyright: "© Q.he TOY-LAB. All Rights Reserved.",
  footerIcp: "",

  inputPageTitle: "临床数据录入",
  inputPageDesc: "整合患者体征与实验室数据，实时风险分级。",
  summaryPageTitle: "数据透视中心",
  summaryPageDesc: "跨维度病例分析与结构化数据导出。",
  adminPageTitle: "系统配置中心",
  adminPageDesc: "权重调节与多维度权限管控。",

  footerBrandName: "Q.he TOY-LAB",
  footerDescription: "引领公共卫生领域的数字化转型，致力于通过算法 with 数据提升结核病早期筛查的精准度与效率。",
  footerContactEmail: "qinghoohoo@qq.com",
  footerContactPhone: "15xxxx11970",
  footerSupportLabel: "系统支持",
  footerEmergencyLabel: "联系电话"
};
