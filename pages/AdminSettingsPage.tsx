
import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store.tsx';
import { UserRole, ScoringConfig, SiteConfig, RiskThreshold, LandingFeature, FooterSupportItem } from '../types.ts';
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
  UserCheck,
  UserX,
  ShieldAlert,
  Plus,
  Link2,
  Info
} from 'lucide-react';

const AdminSettingsPage: React.FC = () => {
  const { 
    users, 
    currentUser, 
    updateUserRole, 
    updateUserPassword, 
    deleteUser, 
    approveUser,
    config, 
    updateConfig, 
    siteConfig, 
    updateSiteConfig 
  } = useStore();
  
  const [activeTab, setActiveTab] = useState<'approvals' | 'users' | 'scoring' | 'thresholds' | 'cms' | 'security'>('approvals');
  const [localConfig, setLocalConfig] = useState<ScoringConfig>(config);
  const [localSiteConfig, setLocalSiteConfig] = useState<SiteConfig>(siteConfig);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [newItemNames, setNewItemNames] = useState<Record<string, string>>({});
  const [selfPassword, setSelfPassword] = useState({ current: '', next: '' });
  const [securityMsg, setSecurityMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => { setLocalConfig(config); }, [config]);
  useEffect(() => { setLocalSiteConfig(siteConfig); }, [siteConfig]);

  // --- 审批逻辑 ---
  const pendingUsers = useMemo(() => (users || []).filter(u => u && !u.approved && u.username !== 'qinghoohoo'), [users]);
  const approvedUsers = useMemo(() => (users || []).filter(u => u && u.approved), [users]);

  // --- 决策权重引擎逻辑 ---
  const handleUpdateScore = (cat: keyof ScoringConfig, key: string, val: number) => {
    setLocalConfig(prev => ({ 
      ...prev, 
      [cat]: { ...(prev[cat] as Record<string, number>), [key]: val } 
    }));
  };

  const handleAddScoreItem = (cat: keyof ScoringConfig) => {
    const name = newItemNames[cat];
    if (!name || name.trim() === '') return;
    setLocalConfig(prev => ({
      ...prev,
      [cat]: { ...(prev[cat] as Record<string, number>), [name.trim()]: 0 }
    }));
    setNewItemNames(prev => ({ ...prev, [cat]: '' }));
  };

  const handleRemoveScoreItem = (cat: keyof ScoringConfig, key: string) => {
    if(!confirm(`确定移除权重项：“${key}”？`)) return;
    const nextCat = { ...(localConfig[cat] as Record<string, number>) };
    delete nextCat[key];
    setLocalConfig(prev => ({ ...prev, [cat]: nextCat }));
  };

  // --- 分层标准逻辑 ---
  const handleUpdateThreshold = (id: string, updates: Partial<RiskThreshold>) => {
    setLocalConfig(prev => ({
      ...prev,
      thresholds: prev.thresholds.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  };

  // --- CMS 门户可视化逻辑 ---
  const handleAddFeature = () => {
    const newFeature: LandingFeature = {
      id: Date.now().toString(),
      title: '新特性项',
      description: '点击编辑描述内容...',
      iconName: 'Activity'
    };
    setLocalSiteConfig(prev => ({ ...prev, features: [...prev.features, newFeature] }));
  };

  const handleRemoveFeature = (id: string) => {
    setLocalSiteConfig(prev => ({ ...prev, features: prev.features.filter(f => f.id !== id) }));
  };

  const handleUpdateFeature = (id: string, field: keyof LandingFeature, val: string) => {
    setLocalSiteConfig(prev => ({
      ...prev,
      features: prev.features.map(f => f.id === id ? { ...f, [field]: val } : f)
    }));
  };

  const handleAddFooterSupport = () => {
    const newItem: FooterSupportItem = { id: Date.now().toString(), label: '支持渠道', value: '请输入联系信息' };
    setLocalSiteConfig(prev => ({ ...prev, footerSupportItems: [...(prev.footerSupportItems || []), newItem] }));
  };

  const handleRemoveFooterSupport = (id: string) => {
    setLocalSiteConfig(prev => ({ ...prev, footerSupportItems: (prev.footerSupportItems || []).filter(i => i.id !== id) }));
  };

  // --- 提交保存 ---
  const handleSaveAll = async () => {
    await updateConfig(localConfig);
    await updateSiteConfig(localSiteConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // 权限防御
  if (currentUser?.username !== 'qinghoohoo') {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-center">
        <ShieldAlert className="text-rose-500 mb-6" size={80} />
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">最高权限受限</h2>
        <p className="text-slate-500 mt-2 font-bold">该区域仅限超级管理员 qinghoohoo 登录。</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-700">
      {/* 顶部标题栏 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-950 dark:text-white tracking-tighter mb-1">系统策略控制中心</h1>
          <p className="text-slate-950 dark:text-slate-400 font-black text-lg flex items-center gap-2 opacity-70">
            <Lock size={18} className="text-emerald-500" /> Root 管理员已锁定：{currentUser?.username}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {saveSuccess && (
            <div className="flex items-center gap-2 text-emerald-800 font-black text-sm px-6 py-3 bg-emerald-50 rounded-full border border-emerald-200 animate-in slide-in-from-right-4 shadow-sm">
              <CheckCircle size={18} /> 全局策略已原子化同步
            </div>
          )}
          <button onClick={handleSaveAll} className="px-10 py-4 bg-slate-950 dark:bg-emerald-600 text-white rounded-[24px] font-black shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
            <Save size={20} /> 保存当前所有配置
          </button>
        </div>
      </div>

      {/* 导航面板 */}
      <div className="sticky top-24 z-30 flex overflow-x-auto no-scrollbar py-2">
        <div className="flex gap-2 p-2 bg-slate-200/50 dark:bg-slate-800/60 backdrop-blur-2xl rounded-[30px] border border-white/40 shadow-sm w-fit">
          {[
            { id: 'approvals', label: '待审批', icon: ShieldAlert, badge: pendingUsers.length },
            { id: 'cms', label: '门户 CMS', icon: Monitor },
            { id: 'scoring', label: '决策权重', icon: Settings2 },
            { id: 'thresholds', label: '分层标准', icon: GraduationCap },
            { id: 'users', label: '账户管理', icon: Users },
            { id: 'security', label: '安全密钥', icon: Key },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} 
              className={`flex items-center gap-3 px-6 py-4 rounded-[22px] text-[13px] font-black transition-all relative whitespace-nowrap ${activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-md' : 'text-slate-950 dark:text-slate-400 hover:bg-white/40'}`} 
            > 
              <tab.icon size={18} strokeWidth={2.5} /> 
              {tab.label}
              {tab.badge ? <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">{tab.badge}</span> : null}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-12">
        {/* Tab 1: 待审批 */}
        {activeTab === 'approvals' && (
          <div className="bg-white dark:bg-slate-900 rounded-[48px] p-12 border-2 border-slate-100 dark:border-slate-800 shadow-xl animate-in fade-in">
             <h3 className="text-2xl font-black text-slate-950 dark:text-white flex items-center gap-4 mb-10"><ShieldCheck size={32} className="text-amber-500"/> 待授权准入申请 ({pendingUsers.length})</h3>
             {pendingUsers.length === 0 ? (
               <div className="py-20 text-center space-y-4">
                  <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto"><CheckCircle className="text-emerald-500" size={40} /></div>
                  <p className="text-slate-400 font-bold">暂无待处理申请</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pendingUsers.map(u => (
                    <div key={u.id} className="p-8 bg-slate-50 dark:bg-slate-800 rounded-[32px] flex items-center justify-between border-2 border-transparent hover:border-amber-200 transition-all">
                       <div>
                          <div className="text-xl font-black text-slate-950 dark:text-white">{u.username}</div>
                          <div className="text-[11px] text-slate-400 font-black uppercase tracking-widest">UID: {u.id}</div>
                       </div>
                       <div className="flex items-center gap-3">
                          <button onClick={() => approveUser(u.id)} className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-all"><UserCheck size={20} /></button>
                          <button onClick={() => deleteUser(u.id)} className="w-12 h-12 bg-white dark:bg-slate-700 text-rose-600 rounded-2xl flex items-center justify-center shadow-md hover:bg-rose-50 transition-all"><UserX size={20} /></button>
                       </div>
                    </div>
                  ))}
               </div>
             )}
          </div>
        )}

        {/* Tab 2: CMS 门户可视化 */}
        {activeTab === 'cms' && (
          <div className="space-y-12 animate-in fade-in pb-20">
            {/* Hero 编辑 */}
            <section className="bg-white dark:bg-slate-900 rounded-[48px] p-12 border-2 border-slate-100 dark:border-slate-800 shadow-xl space-y-10">
              <h3 className="text-2xl font-black text-slate-950 dark:text-white flex items-center gap-4"><Monitor size={28} className="text-emerald-500" /> 首页 Hero 视觉区域配置</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">通知勋章文案</label>
                  <input value={localSiteConfig.heroBadge} onChange={e => setLocalSiteConfig({...localSiteConfig, heroBadge: e.target.value})} className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-[24px] border-none font-bold text-slate-950 dark:text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">CTA 按钮文本</label>
                  <input value={localSiteConfig.ctaText} onChange={e => setLocalSiteConfig({...localSiteConfig, ctaText: e.target.value})} className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-[24px] border-none font-bold text-slate-950 dark:text-white" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">主标题 (支持 \n 换行)</label>
                  <textarea value={localSiteConfig.heroTitle} onChange={e => setLocalSiteConfig({...localSiteConfig, heroTitle: e.target.value})} className="w-full p-8 bg-slate-50 dark:bg-slate-800 rounded-[32px] text-3xl h-36 border-none font-black text-slate-950 dark:text-white leading-tight" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">愿景描述文案</label>
                  <textarea value={localSiteConfig.heroDescription} onChange={e => setLocalSiteConfig({...localSiteConfig, heroDescription: e.target.value})} className="w-full p-8 bg-slate-50 dark:bg-slate-800 rounded-[32px] text-lg h-32 border-none font-bold text-slate-500 leading-relaxed" />
                </div>
              </div>
            </section>

            {/* Features 特性管理 */}
            <section className="bg-white dark:bg-slate-900 rounded-[48px] p-12 border-2 border-slate-100 dark:border-slate-800 shadow-xl space-y-10">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-950 dark:text-white flex items-center gap-4"><Database size={28} className="text-blue-500" /> 核心特性展示位管理</h3>
                <button onClick={handleAddFeature} className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-blue-500 hover:text-white text-slate-900 dark:text-white rounded-2xl font-black transition-all flex items-center gap-2"><Plus size={18} /> 添加特性</button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {localSiteConfig.features.map(f => (
                  <div key={f.id} className="p-8 bg-slate-50 dark:bg-slate-800 rounded-[32px] border-2 border-transparent hover:border-blue-400 transition-all relative group">
                    <button onClick={() => handleRemoveFeature(f.id)} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18}/></button>
                    <div className="space-y-4">
                      <input value={f.title} onChange={e => handleUpdateFeature(f.id, 'title', e.target.value)} className="w-full bg-white dark:bg-slate-700 p-4 rounded-xl border-none font-black text-slate-950 dark:text-white" placeholder="特性标题" />
                      <textarea value={f.description} onChange={e => handleUpdateFeature(f.id, 'description', e.target.value)} className="w-full bg-white dark:bg-slate-700 p-4 rounded-xl border-none font-bold text-slate-500 text-sm h-24" placeholder="功能描述..." />
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">图标:</span>
                        <input value={f.iconName} onChange={e => handleUpdateFeature(f.id, 'iconName', e.target.value)} className="flex-1 bg-white dark:bg-slate-700 p-2 rounded-lg border-none font-mono text-xs text-blue-500" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Footer 页脚管理 */}
            <section className="bg-white dark:bg-slate-900 rounded-[48px] p-12 border-2 border-slate-100 dark:border-slate-800 shadow-xl space-y-10">
              <h3 className="text-2xl font-black text-slate-950 dark:text-white flex items-center gap-4"><Link2 size={28} className="text-indigo-500" /> 页脚及版权品牌配置</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="space-y-2"><label className="text-[11px] font-black text-slate-400 ml-4">页脚品牌名称</label><input value={localSiteConfig.footerBrandName} onChange={e => setLocalSiteConfig({...localSiteConfig, footerBrandName: e.target.value})} className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none font-black text-slate-950 dark:text-white" /></div>
                <div className="space-y-2"><label className="text-[11px] font-black text-slate-400 ml-4">版权声明</label><input value={localSiteConfig.footerCopyright} onChange={e => setLocalSiteConfig({...localSiteConfig, footerCopyright: e.target.value})} className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none font-black text-slate-950 dark:text-white" /></div>
                <div className="space-y-2"><label className="text-[11px] font-black text-slate-400 ml-4">备案号 (ICP)</label><input value={localSiteConfig.footerIcp} onChange={e => setLocalSiteConfig({...localSiteConfig, footerIcp: e.target.value})} className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none font-black text-slate-950 dark:text-white" /></div>
                <div className="md:col-span-3 space-y-2"><label className="text-[11px] font-black text-slate-400 ml-4">品牌简介描述</label><textarea value={localSiteConfig.footerDescription} onChange={e => setLocalSiteConfig({...localSiteConfig, footerDescription: e.target.value})} className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-[28px] border-none font-bold text-slate-500 h-24" /></div>
              </div>
              <div className="pt-8 border-t border-slate-100 dark:border-slate-800 space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-black text-slate-950 dark:text-white uppercase tracking-tighter">联系与技术支持渠道</h4>
                  <button onClick={handleAddFooterSupport} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg"><Plus size={14} /> 添加联系渠道</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(localSiteConfig.footerSupportItems || []).map(item => (
                    <div key={item.id} className="p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent hover:border-indigo-300 relative group">
                      <button onClick={() => handleRemoveFooterSupport(item.id)} className="absolute -top-2 -right-2 w-7 h-7 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={12}/></button>
                      <input value={item.label} onChange={e => setLocalSiteConfig({...localSiteConfig, footerSupportItems: localSiteConfig.footerSupportItems.map(si => si.id === item.id ? {...si, label: e.target.value} : si)})} className="w-full bg-transparent text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1 border-none outline-none" placeholder="渠道名称" />
                      <input value={item.value} onChange={e => setLocalSiteConfig({...localSiteConfig, footerSupportItems: localSiteConfig.footerSupportItems.map(si => si.id === item.id ? {...si, value: e.target.value} : si)})} className="w-full bg-transparent text-sm font-black text-slate-950 dark:text-white border-none outline-none" placeholder="详情内容" />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Tab 3: 决策权重 */}
        {activeTab === 'scoring' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 animate-in fade-in pb-32">
            {(Object.keys(localConfig).filter(k => k !== 'thresholds') as Array<keyof ScoringConfig>).map(cat => (
              <div key={cat} className="bg-white dark:bg-slate-900 rounded-[48px] p-12 border-2 border-slate-100 dark:border-slate-800 shadow-xl space-y-8">
                <h3 className="text-2xl font-black text-slate-950 dark:text-white flex items-center gap-4 capitalize">
                  <div className="w-3 h-10 bg-emerald-500 rounded-full" />
                  {cat === 'history' ? '既往病史权重' : cat === 'symptoms' ? '临床症状权重' : cat === 'ctFeatures' ? 'CT 特征权重' : cat === 'exposure' ? '暴露风险权重' : cat.toUpperCase()}
                </h3>
                <div className="space-y-3">
                  {Object.entries(localConfig[cat] as Record<string, number>).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800 rounded-[24px] border-2 border-transparent hover:border-slate-200 group transition-all">
                      <div className="flex items-center gap-4 overflow-hidden">
                        <button onClick={() => handleRemoveScoreItem(cat, key)} className="p-2 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"><Trash2 size={18}/></button>
                        <span className="text-lg font-black text-slate-950 dark:text-slate-200 truncate">{key}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">Score:</span>
                        <input type="number" value={val} onChange={e => handleUpdateScore(cat, key, parseInt(e.target.value) || 0)} className="w-20 p-3 bg-white dark:bg-slate-700 rounded-xl border-none text-center font-black text-xl text-slate-950 dark:text-white" />
                      </div>
                    </div>
                  ))}
                  {/* 新增项 */}
                  <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                    <input value={newItemNames[cat] || ''} onChange={e => setNewItemNames({...newItemNames, [cat]: e.target.value})} placeholder={`新增${cat}观测指标...`} className="flex-1 px-5 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl border-none font-bold text-slate-950 dark:text-white outline-none" />
                    <button onClick={() => handleAddScoreItem(cat)} className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg hover:scale-105 transition-all"><Plus size={24} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: 分层标准 */}
        {activeTab === 'thresholds' && (
          <div className="space-y-8 animate-in fade-in pb-20">
             <div className="flex justify-between items-end px-2">
               <h3 className="text-2xl font-black text-slate-950 dark:text-white flex items-center gap-4"><GraduationCap size={32} className="text-amber-500"/> 风险评估逻辑与分层标准</h3>
               <button onClick={() => setLocalConfig(prev => ({ ...prev, thresholds: [...prev.thresholds, { id: Date.now().toString(), level: '新风险等级', min: 0, max: 0, suggestion: '' }] }))} className="px-8 py-4 bg-slate-950 dark:bg-emerald-600 text-white rounded-[24px] font-black flex items-center gap-3 shadow-xl hover:scale-105 transition-all"><Plus size={22} /> 新增级别</button>
            </div>
            {localConfig.thresholds.map(t => (
              <div key={t.id} className="bg-white dark:bg-slate-900 rounded-[48px] p-10 border-2 border-slate-100 dark:border-slate-800 shadow-xl space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   <div className="space-y-2"><label className="text-[10px] font-black text-slate-400">风险等级名称</label><input value={t.level} onChange={e => handleUpdateThreshold(t.id, { level: e.target.value })} className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none font-black text-slate-950 dark:text-white" /></div>
                   <div className="space-y-2"><label className="text-[10px] font-black text-slate-400">Min Score</label><input type="number" value={t.min} onChange={e => handleUpdateThreshold(t.id, { min: parseInt(e.target.value) || 0 })} className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none text-center font-black text-slate-950 dark:text-white" /></div>
                   <div className="space-y-2"><label className="text-[10px] font-black text-slate-400">Max Score</label><input type="number" value={t.max} onChange={e => handleUpdateThreshold(t.id, { max: parseInt(e.target.value) || 0 })} className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none text-center font-black text-slate-950 dark:text-white" /></div>
                   <div className="flex items-end justify-end"><button onClick={() => setLocalConfig(prev => ({ ...prev, thresholds: prev.thresholds.filter(x => x.id !== t.id) }))} className="p-5 text-slate-200 hover:text-rose-500 transition-all"><Trash2 size={24}/></button></div>
                </div>
                <div className="space-y-2 font-black">
                   <label className="text-[10px] font-black text-slate-400">临床专家处置建议文本</label>
                   <textarea value={t.suggestion} onChange={e => handleUpdateThreshold(t.id, { suggestion: e.target.value })} className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-[28px] h-24 border-none outline-none font-bold text-slate-900 dark:text-slate-300 italic" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 5: 账户管理 */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-slate-900 rounded-[48px] p-12 border-2 border-slate-100 dark:border-slate-800 shadow-xl animate-in fade-in">
             <h3 className="text-2xl font-black text-slate-950 dark:text-white flex items-center gap-4 mb-10"><Users size={32} className="text-indigo-600"/> 已授权活跃账户列表 ({approvedUsers.length})</h3>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
                         <th className="pb-6 px-4">用户名 (UID)</th>
                         <th className="pb-6 px-4">系统角色</th>
                         <th className="pb-6 px-4 text-right">操作</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {approvedUsers.map(u => (
                        <tr key={u.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                           <td className="py-6 px-4 font-black text-slate-950 dark:text-white">{u.username} <span className="text-[10px] opacity-30 font-normal ml-2">#{u.id.slice(-6)}</span></td>
                           <td className="py-6 px-4">
                             <select value={u.role} onChange={e => updateUserRole(u.id, e.target.value as UserRole)} className="bg-transparent font-bold text-indigo-500 border-none outline-none cursor-pointer">
                                <option value={UserRole.USER}>临床操作员 (USER)</option>
                                <option value={UserRole.ADMIN}>核心管理员 (ADMIN)</option>
                             </select>
                           </td>
                           <td className="py-6 px-4 text-right">
                              {u.username !== 'qinghoohoo' && <button onClick={() => deleteUser(u.id)} className="p-2 text-slate-200 hover:text-rose-500 transition-all"><Trash2 size={20}/></button>}
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {/* Tab 6: 安全密钥 */}
        {activeTab === 'security' && (
          <div className="max-w-4xl mx-auto animate-in zoom-in-95 pb-48">
            <div className="bg-white dark:bg-slate-900 rounded-[64px] p-16 border-2 border-slate-100 dark:border-slate-800 shadow-2xl space-y-12 text-slate-950 dark:text-white">
              <div className="flex items-center gap-8">
                <div className="p-8 bg-slate-950 dark:bg-emerald-600 text-white rounded-[32px] shadow-2xl rotate-3"><Key size={50} /></div>
                <div><h3 className="text-3xl font-black tracking-tighter">最高管理密钥 (Root Key)</h3><p className="font-bold text-slate-400 mt-1 italic opacity-80">修改后将直接同步至云端凭证安全系统。</p></div>
              </div>
              <form onSubmit={e => { e.preventDefault(); if(selfPassword.current !== currentUser?.password) return setSecurityMsg({type:'error', text:'当前验证密钥错误'}); updateUserPassword(currentUser.id, selfPassword.next); setSecurityMsg({type:'success', text:'密钥更新成功'}); setSelfPassword({current:'', next:''}); }} className="space-y-8">
                <div className="space-y-2"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">验证当前密钥</label><input type="password" required value={selfPassword.current} onChange={e => setSelfPassword({...selfPassword, current: e.target.value})} className="w-full p-8 bg-slate-50 dark:bg-slate-800 rounded-[40px] text-2xl border-none font-black text-slate-950 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/20" placeholder="Current Secret" /></div>
                <div className="space-y-2"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">设置新密钥</label><input type="password" required value={selfPassword.next} onChange={e => setSelfPassword({...selfPassword, next: e.target.value})} className="w-full p-8 bg-slate-50 dark:bg-slate-800 rounded-[40px] text-2xl border-none font-black text-slate-950 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/20" placeholder="New Secret" /></div>
                {securityMsg && <div className={`p-6 rounded-[30px] font-black flex items-center gap-3 ${securityMsg.type === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>{securityMsg.type === 'error' ? <ShieldAlert size={20} /> : <CheckCircle size={20} />}{securityMsg.text}</div>}
                <button type="submit" className="w-full py-10 bg-slate-950 dark:bg-emerald-600 text-white rounded-[40px] font-black text-2xl shadow-3xl hover:scale-[1.02] active:scale-95 transition-all">确认重置 Root Key</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettingsPage;
