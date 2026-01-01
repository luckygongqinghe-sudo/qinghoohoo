
import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store.tsx';
import { UserRole, ScoringConfig, SiteConfig, RiskThreshold, LandingFeature, AboutItem, FooterLink } from '../types.ts';
import { 
  Users, 
  Trash2, 
  CheckCircle, 
  Save,
  Palette,
  Key,
  PlusCircle,
  Activity,
  GraduationCap,
  AlertCircle,
  Database,
  Lock,
  MessageSquare,
  Settings2,
  Monitor,
  ShieldCheck,
  ChevronRight,
  ListPlus
} from 'lucide-react';

const AdminSettingsPage: React.FC = () => {
  const { 
    users, 
    currentUser, 
    updateUserRole, 
    updateUserPassword, 
    deleteUser, 
    config, 
    updateConfig, 
    siteConfig, 
    updateSiteConfig 
  } = useStore();
  
  const [activeTab, setActiveTab] = useState<'cms' | 'users' | 'scoring' | 'thresholds' | 'security'>('cms');
  const [localConfig, setLocalConfig] = useState<ScoringConfig>(config);
  const [localSiteConfig, setLocalSiteConfig] = useState<SiteConfig>(siteConfig);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [newWeightInputs, setNewWeightInputs] = useState<Record<string, { key: string, val: number }>>({});
  const [selfPassword, setSelfPassword] = useState({ current: '', next: '' });
  const [securityMsg, setSecurityMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => { setLocalConfig(config); }, [config]);
  useEffect(() => { setLocalSiteConfig(siteConfig); }, [siteConfig]);

  // --- CMS 极其灵活的原子化操作 ---
  const updateFeature = (id: string, field: keyof LandingFeature, value: string) => {
    setLocalSiteConfig(prev => ({ ...prev, features: prev.features.map(f => f.id === id ? { ...f, [field]: value } : f) }));
  };
  const addFeature = () => setLocalSiteConfig(prev => ({ ...prev, features: [...prev.features, { id: Date.now().toString(), title: '新特性标题', description: '描述文案', iconName: 'Activity' }] }));
  const removeFeature = (id: string) => setLocalSiteConfig(prev => ({ ...prev, features: prev.features.filter(f => f.id !== id) }));
  
  const updateAboutItem = (id: string, field: keyof AboutItem, value: string) => {
    setLocalSiteConfig(prev => ({ ...prev, aboutItems: prev.aboutItems.map(i => i.id === id ? { ...i, [field]: value } : i) }));
  };
  const addAboutItem = () => setLocalSiteConfig(prev => ({ ...prev, aboutItems: [...prev.aboutItems, { id: Date.now().toString(), title: '新安全承诺', description: '安全性描述' }] }));
  const removeAboutItem = (id: string) => setLocalSiteConfig(prev => ({ ...prev, aboutItems: prev.aboutItems.filter(i => i.id !== id) }));

  const updateFooterLink = (id: string, field: keyof FooterLink, value: string) => {
    setLocalSiteConfig(prev => ({ ...prev, footerLinks: prev.footerLinks.map(l => l.id === id ? { ...l, [field]: value } : l) }));
  };
  const addFooterLink = () => setLocalSiteConfig(prev => ({ ...prev, footerLinks: [...prev.footerLinks, { id: Date.now().toString(), label: '新链接', url: '#' }] }));
  const removeFooterLink = (id: string) => setLocalSiteConfig(prev => ({ ...prev, footerLinks: prev.footerLinks.filter(l => l.id !== id) }));

  // --- 决策权重引擎操作 ---
  const handleUpdateScore = (cat: keyof ScoringConfig, key: string, val: number) => {
    setLocalConfig(prev => ({ ...prev, [cat]: { ...(prev[cat] as Record<string, number>), [key]: val } }));
  };

  // --- 分级标准更新 (彻底修复同步) ---
  const handleUpdateThreshold = (id: string, updates: Partial<RiskThreshold>) => {
    setLocalConfig(prev => ({
      ...prev,
      thresholds: prev.thresholds.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  };

  const addThreshold = () => {
    setLocalConfig(prev => ({
      ...prev,
      thresholds: [...prev.thresholds, { id: Date.now().toString(), level: '自定义等级', min: 0, max: 0, suggestion: '请录入建议文案' }]
    }));
  };

  const removeThreshold = (id: string) => {
    if(!confirm('确认永久删除该分级标准维度？')) return;
    setLocalConfig(prev => ({ ...prev, thresholds: prev.thresholds.filter(t => t.id !== id) }));
  };

  // --- 全局一键同步 ---
  const handleSaveAll = () => {
    updateConfig(localConfig);
    updateSiteConfig(localSiteConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const sortedThresholds = useMemo(() => {
    return [...localConfig.thresholds].sort((a, b) => a.min - b.min);
  }, [localConfig.thresholds]);

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-950 dark:text-white tracking-tighter mb-1">系统策略控制中心</h1>
          <p className="text-slate-950 dark:text-slate-300 font-black text-lg italic opacity-70 tracking-tight">超级管理身份锁：qinghoohoo</p>
        </div>
        <div className="flex items-center gap-4">
          {saveSuccess && (
            <div className="flex items-center gap-2 text-emerald-800 font-black text-sm px-6 py-3 bg-emerald-50 rounded-full border border-emerald-200 animate-bounce shadow-sm">
              <CheckCircle size={18} /> 全局配置已完成原子级同步
            </div>
          )}
          <button onClick={handleSaveAll} className="px-10 py-4 bg-slate-950 dark:bg-emerald-600 text-white rounded-[24px] font-black shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
            <Save size={20} /> 提交并刷新全局配置
          </button>
        </div>
      </div>

      {/* 选项卡导航 */}
      <div className="sticky top-24 z-30 flex overflow-x-auto no-scrollbar py-2">
        <div className="flex gap-2 p-2 bg-slate-200/50 dark:bg-slate-800/60 backdrop-blur-2xl rounded-[30px] border border-white/40 shadow-sm w-fit">
          {[
            { id: 'cms', label: '门户内容管理', icon: Palette },
            { id: 'users', label: '权限与账户', icon: Users },
            { id: 'scoring', label: '决策权重调节', icon: Settings2 },
            { id: 'thresholds', label: '分级分诊标准', icon: GraduationCap },
            { id: 'security', label: '核心密钥', icon: Lock },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} 
              className={`flex items-center gap-3 px-8 py-4 rounded-[22px] text-[13px] font-black transition-all ${activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-md' : 'text-slate-950 dark:text-slate-400 hover:bg-white/40'}`} 
            > 
              <tab.icon size={18} strokeWidth={2.5} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-12">
        {/* Portal CMS Tab - 极其灵活的版本 */}
        {activeTab === 'cms' && (
          <div className="space-y-12 animate-in fade-in pb-20">
            <section className="bg-white dark:bg-slate-900 rounded-[48px] p-12 border-2 border-slate-100 dark:border-slate-800 shadow-xl space-y-10">
              <h3 className="text-2xl font-black text-slate-950 dark:text-white flex items-center gap-4"><Monitor size={32} className="text-emerald-600"/> 门户首页 Hero 核心文案</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-slate-950 font-black">
                <div className="space-y-2"><label className="text-[11px] uppercase tracking-widest opacity-60">顶部通知徽章</label><input value={localSiteConfig.heroBadge} onChange={e => setLocalSiteConfig({...localSiteConfig, heroBadge: e.target.value})} className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl border-none outline-none focus:ring-4 focus:ring-emerald-500/10" /></div>
                <div className="space-y-2"><label className="text-[11px] uppercase tracking-widest opacity-60">主引导按钮 (CTA)</label><input value={localSiteConfig.ctaText} onChange={e => setLocalSiteConfig({...localSiteConfig, ctaText: e.target.value})} className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl border-none outline-none focus:ring-4 focus:ring-emerald-500/10" /></div>
                <div className="md:col-span-2 space-y-2"><label className="text-[11px] uppercase tracking-widest opacity-60">首页主标题 (支持换行)</label><textarea value={localSiteConfig.heroTitle} onChange={e => setLocalSiteConfig({...localSiteConfig, heroTitle: e.target.value})} className="w-full p-8 bg-slate-50 dark:bg-slate-800 rounded-[36px] text-4xl h-44 border-none font-black leading-tight" /></div>
                <div className="md:col-span-2 space-y-2"><label className="text-[11px] uppercase tracking-widest opacity-60">核心价值愿景描述</label><textarea value={localSiteConfig.heroDescription} onChange={e => setLocalSiteConfig({...localSiteConfig, heroDescription: e.target.value})} className="w-full p-8 bg-slate-50 dark:bg-slate-800 rounded-[36px] text-lg h-40 border-none font-bold text-slate-500" /></div>
              </div>
            </section>

            <section className="bg-white dark:bg-slate-900 rounded-[48px] p-12 border-2 border-slate-100 dark:border-slate-800 shadow-xl space-y-10">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-slate-950 dark:text-white flex items-center gap-4"><Activity size={32} className="text-blue-600"/> 核心技术特性管理</h3>
                <button onClick={addFeature} className="px-6 py-3 bg-blue-50 text-blue-700 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-100 transition-all shadow-sm"><PlusCircle size={18}/> 新增技术特性</button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {localSiteConfig.features.map(f => (
                  <div key={f.id} className="p-8 bg-slate-50 dark:bg-slate-800 rounded-[40px] relative group text-slate-950 font-black border-2 border-transparent hover:border-blue-200 transition-all">
                    <button onClick={() => removeFeature(f.id)} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={20} /></button>
                    <div className="space-y-6">
                      <div className="space-y-1"><label className="text-[10px] opacity-40 uppercase tracking-widest">图标标识 (Lucide Name)</label><input value={f.iconName} onChange={e => updateFeature(f.id, 'iconName', e.target.value)} className="w-full p-3 bg-white dark:bg-slate-700 rounded-xl text-xs border-none" /></div>
                      <div className="space-y-1"><label className="text-[10px] opacity-40 uppercase tracking-widest">标题文字</label><input value={f.title} onChange={e => updateFeature(f.id, 'title', e.target.value)} className="w-full p-3 bg-white dark:bg-slate-700 rounded-xl text-sm border-none font-black" /></div>
                      <div className="space-y-1"><label className="text-[10px] opacity-40 uppercase tracking-widest">功能性详细描述</label><textarea value={f.description} onChange={e => updateFeature(f.id, 'description', e.target.value)} className="w-full p-3 bg-white dark:bg-slate-700 rounded-xl text-xs h-28 border-none" /></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white dark:bg-slate-900 rounded-[48px] p-12 border-2 border-slate-100 dark:border-slate-800 shadow-xl space-y-10">
               <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-black text-slate-950 dark:text-white flex items-center gap-4"><Monitor size={32} className="text-emerald-600"/> 页脚 (Footer) 与链接控制</h3>
                 <button onClick={addFooterLink} className="px-6 py-3 bg-emerald-50 text-emerald-700 rounded-2xl font-black flex items-center gap-2 hover:bg-emerald-100 transition-all shadow-sm"><ListPlus size={18}/> 新增页脚链接</button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-slate-950 font-black">
                  <div className="space-y-2"><label className="text-[11px] opacity-60 uppercase tracking-widest">页脚品牌名称</label><input value={localSiteConfig.footerBrandName} onChange={e => setLocalSiteConfig({...localSiteConfig, footerBrandName: e.target.value})} className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl border-none" /></div>
                  <div className="space-y-2"><label className="text-[11px] opacity-60 uppercase tracking-widest">联系电话</label><input value={localSiteConfig.footerContactPhone} onChange={e => setLocalSiteConfig({...localSiteConfig, footerContactPhone: e.target.value})} className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl border-none" /></div>
                  <div className="md:col-span-2 space-y-2"><label className="text-[11px] opacity-60 uppercase tracking-widest">页脚品牌介绍文案</label><textarea value={localSiteConfig.footerDescription} onChange={e => setLocalSiteConfig({...localSiteConfig, footerDescription: e.target.value})} className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-[32px] h-24 border-none" /></div>
                  
                  <div className="md:col-span-2">
                    <label className="text-[11px] opacity-60 uppercase tracking-widest block mb-4">页脚快速导航链接管理</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {localSiteConfig.footerLinks.map(l => (
                        <div key={l.id} className="p-5 bg-slate-50 dark:bg-slate-800 rounded-[32px] relative group border-2 border-transparent hover:border-emerald-200 transition-all">
                          <button onClick={() => removeFooterLink(l.id)} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500"><Trash2 size={16}/></button>
                          <div className="space-y-3">
                            <input value={l.label} onChange={e => updateFooterLink(l.id, 'label', e.target.value)} className="w-full p-3 bg-white dark:bg-slate-700 rounded-xl text-xs font-black" placeholder="链接显示文字" />
                            <input value={l.url} onChange={e => updateFooterLink(l.id, 'url', e.target.value)} className="w-full p-3 bg-white dark:bg-slate-700 rounded-xl text-xs font-black" placeholder="跳转 URL" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
               </div>
            </section>
          </div>
        )}

        {/* Thresholds Tab - 修复逻辑 */}
        {activeTab === 'thresholds' && (
          <div className="space-y-8 animate-in fade-in pb-20">
            <div className="flex justify-between items-end px-2">
               <div>
                 <h3 className="text-2xl font-black text-slate-950 dark:text-white flex items-center gap-4"><GraduationCap size={32} className="text-amber-500"/> 医学分级分诊标准调节</h3>
                 <p className="text-slate-950 opacity-60 font-black mt-2">控制不同评分区间对应的风险预警级别及建议采取的临床路径。</p>
               </div>
               <button onClick={addThreshold} className="px-8 py-4 bg-slate-950 text-white rounded-[24px] font-black flex items-center gap-3 shadow-xl hover:scale-105 active:scale-95 transition-all">
                 <PlusCircle size={22} /> 新增风险层级
               </button>
            </div>
            
            <div className="grid grid-cols-1 gap-8">
              {sortedThresholds.map(t => (
                <div key={t.id} className="bg-white dark:bg-slate-900 rounded-[48px] p-10 border-2 border-slate-100 dark:border-slate-800 shadow-xl space-y-10 transition-all hover:border-amber-400">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-10 text-slate-950 font-black">
                    <div className="space-y-3">
                      <label className="text-[11px] uppercase tracking-widest opacity-40">风险分层显示标签</label>
                      <input value={t.level} onChange={e => handleUpdateThreshold(t.id, { level: e.target.value })} className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl border-none text-xl font-black" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[11px] uppercase tracking-widest opacity-40">分值起点 (Inclusive)</label>
                      <input type="number" value={t.min} onChange={e => handleUpdateThreshold(t.id, { min: parseInt(e.target.value) || 0 })} className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl border-none text-center text-xl font-black" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[11px] uppercase tracking-widest opacity-40">分值终点 (Inclusive)</label>
                      <input type="number" value={t.max} onChange={e => handleUpdateThreshold(t.id, { max: parseInt(e.target.value) || 0 })} className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl border-none text-center text-xl font-black" />
                    </div>
                    <div className="flex items-end justify-end">
                       <button onClick={() => removeThreshold(t.id)} className="p-5 text-slate-200 hover:text-rose-600 transition-all bg-slate-50 dark:bg-slate-800 rounded-full"><Trash2 size={32}/></button>
                    </div>
                  </div>
                  <div className="space-y-3 text-slate-950 font-black">
                    <label className="text-[11px] uppercase tracking-widest opacity-40 flex items-center gap-2"><MessageSquare size={16}/> 对应自动化临床处置建议路径</label>
                    <textarea value={t.suggestion} onChange={e => handleUpdateThreshold(t.id, { suggestion: e.target.value })} className="w-full p-8 bg-slate-50 dark:bg-slate-800 rounded-[36px] h-40 border-none outline-none focus:ring-4 focus:ring-amber-500/10 text-lg italic leading-relaxed" placeholder="请输入专家建议文案..." />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scoring Tab */}
        {activeTab === 'scoring' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 animate-in fade-in pb-32">
            {(Object.keys(localConfig).filter(k => k !== 'thresholds') as Array<keyof ScoringConfig>).map(cat => (
              <div key={cat} className="bg-white dark:bg-slate-900 rounded-[48px] p-12 border-2 border-slate-100 dark:border-slate-800 shadow-xl space-y-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-slate-950 dark:text-white flex items-center gap-4 capitalize">
                    <div className="w-3 h-10 bg-slate-950 dark:bg-emerald-500 rounded-full shadow-lg" />
                    {cat === 'history' ? '既往症权重' : cat === 'exposure' ? '流行病暴露风险' : cat === 'ctFeatures' ? 'CT 影像指标权重' : cat === 'qft' ? 'QFT 检测试剂' : cat === 'smear' ? '痰涂片分值' : cat === 'culture' ? '培养实验得分' : '临床症状权重'}
                  </h3>
                  <Database className="text-slate-950 dark:text-slate-800 opacity-20" size={36} />
                </div>
                <div className="space-y-4">
                  {Object.entries(localConfig[cat] as Record<string, number>).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800 rounded-[30px] group border-2 border-transparent hover:border-slate-200 transition-all text-slate-950 font-black">
                      <div className="flex items-center gap-4">
                        <button onClick={() => { const updated = {...(localConfig[cat] as any)}; delete updated[key]; setLocalConfig({...localConfig, [cat]: updated}); }} className="p-2 text-slate-200 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={20}/></button>
                        <span className="text-xl tracking-tight">{key}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-[10px] uppercase tracking-widest opacity-40">加权分值</span>
                        <input type="number" value={val} onChange={e => handleUpdateScore(cat, key, parseInt(e.target.value) || 0)} className="w-28 p-5 bg-white dark:bg-slate-700 rounded-2xl border-2 border-slate-100 dark:border-slate-600 text-center text-xl font-black focus:ring-4 focus:ring-emerald-500/10" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-8 border-t border-slate-50 dark:border-slate-800 flex gap-4">
                  <input placeholder="新增项名称..." value={newWeightInputs[cat]?.key || ''} onChange={e => setNewWeightInputs({ ...newWeightInputs, [cat]: { key: e.target.value, val: newWeightInputs[cat]?.val || 0 } })} className="flex-1 p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black text-slate-950 border-none outline-none focus:ring-4 focus:ring-emerald-500/10" />
                  <input type="number" placeholder="分值" value={newWeightInputs[cat]?.val ?? ''} onChange={e => setNewWeightInputs({ ...newWeightInputs, [cat]: { key: newWeightInputs[cat]?.key || '', val: parseInt(e.target.value) || 0 } })} className="w-28 p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black text-center text-slate-950 border-none outline-none focus:ring-4 focus:ring-emerald-500/10" />
                  <button onClick={() => { if(!newWeightInputs[cat]?.key) return; const updated = {...(localConfig[cat] as any), [newWeightInputs[cat].key]: newWeightInputs[cat].val}; setLocalConfig({...localConfig, [cat]: updated}); setNewWeightInputs({...newWeightInputs, [cat]: {key: '', val: 0}}); }} className="p-6 bg-slate-950 dark:bg-emerald-600 text-white rounded-2xl shadow-xl hover:scale-105 transition-all"><PlusCircle size={32} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="max-w-4xl mx-auto animate-in zoom-in-95 pb-48">
            <div className="bg-white dark:bg-slate-900 rounded-[64px] p-16 border-2 border-slate-100 dark:border-slate-800 shadow-2xl space-y-12">
              <div className="flex items-center gap-12 text-slate-950 font-black">
                <div className="p-8 bg-slate-950 dark:bg-emerald-600 text-white rounded-[32px] shadow-2xl rotate-3 transition-all hover:rotate-0"><Key size={60} /></div>
                <div>
                  <h3 className="text-4xl font-black text-slate-950 dark:text-white tracking-tighter">最高管理密钥控制</h3>
                  <p className="font-black text-slate-950 dark:text-slate-400 mt-2 text-xl italic opacity-60 leading-relaxed">系统级访问凭据。该操作将直接更改数据库访问锁及全站管理员权限标识。</p>
                </div>
              </div>
              <form onSubmit={e => { e.preventDefault(); if(selfPassword.current !== currentUser?.password) return setSecurityMsg({type:'error', text:'验证失败：当前密钥不正确'}); updateUserPassword(currentUser.id, selfPassword.next); setSecurityMsg({type:'success', text:'最高管理密钥已成功更新'}); setSelfPassword({current:'', next:''}); }} className="space-y-12 text-slate-950 font-black">
                <div className="space-y-4">
                  <label className="text-[11px] uppercase tracking-[0.2em] ml-4 opacity-40">确认当前密钥</label>
                  <input type="password" required value={selfPassword.current} onChange={e => setSelfPassword({...selfPassword, current: e.target.value})} className="w-full p-8 bg-slate-50 dark:bg-slate-800 rounded-[40px] text-2xl border-none focus:ring-8 focus:ring-slate-950/5 transition-all outline-none" placeholder="Enter Current Master Key" />
                </div>
                <div className="space-y-4">
                  <label className="text-[11px] uppercase tracking-[0.2em] ml-4 opacity-40">设定全站新密钥</label>
                  <input type="password" required value={selfPassword.next} onChange={e => setSelfPassword({...selfPassword, next: e.target.value})} className="w-full p-8 bg-slate-50 dark:bg-slate-800 rounded-[40px] text-2xl border-none focus:ring-8 focus:ring-slate-950/5 transition-all outline-none" placeholder="Set New master Secret" />
                </div>
                {securityMsg && (
                  <div className={`p-8 rounded-[40px] font-black flex items-center gap-6 text-lg ${securityMsg.type === 'error' ? 'bg-rose-50 text-rose-950' : 'bg-emerald-50 text-emerald-950'}`}>
                    <AlertCircle size={28} /> {securityMsg.text}
                  </div>
                )}
                <button type="submit" className="w-full py-10 bg-slate-950 dark:bg-emerald-600 text-white rounded-[40px] font-black text-2xl shadow-3xl hover:bg-black transition-all flex items-center justify-center gap-6 active:scale-95">
                   确认授权并重置管理密钥 <ChevronRight size={36} />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettingsPage;
