
import { ScoringConfig, SiteConfig } from './types';

export const DEFAULT_CONFIG: ScoringConfig = {
  history: {
    '陈旧性结核病史': 10,
    '糖尿病': 8,
    'HIV感染': 30,
    '长期使用免疫抑制剂': 20,
    '慢性肾病': 5,
    '矿工/粉尘/矽肺作业': 15,
    '养老院/监狱等群居环境': 10
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
    '阳性': 100
  },
  culture: {
    '阴性': 0,
    '阳性': 100
  },
  molecular: {
    '阴性': 0,
    '阳性': 100
  },
  symptoms: {
    '咳嗽≥2周': 15,
    '咯血': 20,
    '发热': 10,
    '盗汗': 8,
    '体重明显减轻': 12,
    '气短': 10,
    '胸痛': 8,
    '疲劳': 5
  },
  thresholds: [
    { id: 't1', level: '无风险', min: 0, max: 10, suggestion: '维持健康生活习惯，定期进行常规体检。' },
    { id: 't2', level: '低风险', min: 11, max: 20, suggestion: '建议每3-6个月随访，若咳嗽持续不缓解，加做胸部X光。' },
    { id: 't3', level: '中风险', min: 21, max: 40, suggestion: '核心节点：必须进行影像学检查（CT）及免疫学检测（QFT/PPD）。若影像学有可疑病灶，立即转入高危管理。' },
    { id: 't4', level: '高风险', min: 41, max: 60, suggestion: '预警节点：此类患者高度疑似“菌阴结核”或“亚临床结核”，建议进行支气管肺泡灌洗或多次痰检（至少3次）。' },
    { id: 't5', level: '极高危风险', min: 61, max: 99, suggestion: '紧急节点：在等待病原学结果的同时，建议由专家组发起临床诊断讨论，考虑试验性治疗。' },
    { id: 't6', level: '确诊结核病', min: 100, max: 999, suggestion: '实验室病原学阳性确诊。请立即依照指南建立档案，并启动标准化抗结核化疗方案。' }
  ]
};

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  heroBadge: "专家级结核病精准筛查模型 v3.0",
  heroTitle: "数字化、智能化\n结核病分层决策门户",
  heroDescription: "集成 WHO 与中国结核病防治指南，通过病原学硬指标、影像学特征及 AI 协同推理，提供世界级的风险评估方案，支持全球在线实时同步。",
  heroImageUrl: "https://images.unsplash.com/photo-1518152006812-edab29b069ac?auto=format&fit=crop&q=80&w=2000",
  primaryColor: "#059669",
  featuresTitle: "重塑临床筛查工作流",
  featuresSubtitle: "专为现代公共卫生体系设计，我们将繁琐的医学评估简化为极致的数字化闭环。",
  aboutTitle: "全方位的医学数据隐私保护",
  aboutSubtitle: "Security First - 全球部署、实时同步、金融级加密",
  ctaText: "开始录入评估",
  
  features: [
    { id: 'f1', title: "智能风险分级", description: "融合深度学习算法与临床指南，自动处理多维临床指标（含职业暴露），输出毫秒级诊断参考。", iconName: "ShieldCheck" },
    { id: 'f2', title: "结构化数据同步", description: "全生命周期病例追踪，从初筛到复诊，所有影像、实验室检测结果云端实时同步。", iconName: "Globe" },
    { id: 'f3', title: "AI Synergy 引擎", description: "深度解析临床笔记，识别逻辑矛盾，生成基于思维链的专家报告。", iconName: "BrainCircuit" }
  ],
  
  aboutItems: [
    { id: 'a1', title: "端到端 AES-256 加密", description: "采用金融级加密技术，确保所有病例数据在传输与存储过程中的绝对私密。" },
    { id: 'a2', title: "权限细分模型", description: "管理员与操作员角色严格隔离，每一笔数据访问均有可追溯的审计日志。" },
    { id: 'a3', title: "实时合规监测", description: "全球分布式架构，确保逻辑一致性与实时同步更新。" }
  ],

  footerLinks: [],
  footerSupportItems: [
    { id: 's1', label: '技术支持', value: 'qinghoohoo@qq.com' },
    { id: 's2', label: '临床咨询', value: '15xxxx11970' }
  ],
  footerCopyright: "© Q.he TOY-LAB. All Rights Reserved. Global Sync v3.0",
  footerIcp: "TB-SCAN-NETWORK-IC001",
  inputPageTitle: "临床专家评估录入",
  inputPageDesc: "整合病原学检测与流行病学背景（含职业/环境暴露），实现秒级风险辅助决策。",
  summaryPageTitle: "数据透视与分析中心",
  summaryPageDesc: "跨维度病例分布统计与 AI 协同推理报告管理。",
  adminPageTitle: "全站管理与管控中心",
  adminPageDesc: "全局权重矩阵、风险阈值及门户 CMS 内容深度个性化配置。",
  footerBrandName: "TB-Scan Network",
  footerDescription: "引领公共卫生领域的数字化转型，通过 AI 与大数据提升结核病早期筛查的精准度。"
};
