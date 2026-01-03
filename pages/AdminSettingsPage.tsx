
import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store.tsx';
import { UserRole, ScoringConfig, SiteConfig, RiskThreshold, LandingFeature, AboutItem } from '../types.ts';
import { 
  Users, 
  Trash2, 
  CheckCircle, 
  Save,
  Settings2,
  ShieldCheck,
  UserX,
  Plus,
  RefreshCw,
  Shield,
  Sliders,
  Layout,
  ChevronRight,
  Info,
  Trash,
  Globe,
  FileText,
  Palette
} from 'lucide-react';

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2 ml-1">{children}</label>
);

const AdminSettingsPage: React.FC = () => {
  const { 
    users, 
    currentUser, 
    approveUser,
    deleteUser,
    toggleUserStatus,
    config, 
    siteConfig, 
    updateGlobalConfig 
  } = useStore();
  
  const [activeTab, setActiveTab] = useState<'team' | 'scoring' | 'thresholds' | 'cms'>('scoring');
  
  const [localConfig, setLocalConfig] = useState<ScoringConfig>(() => JSON.parse(JSON.stringify(config)));
  const [localSiteConfig, setLocalSiteConfig] = useState<SiteConfig>(() => JSON.parse(JSON.stringify(siteConfig)));
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [newItemNames, setNewItemNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isInitialized && config && siteConfig) {
      setLocalConfig(JSON.parse(JSON.stringify(config)));
      setLocalSiteConfig(JSON.parse(JSON.stringify(siteConfig)));
      setIsInitialized(true);
    }
  }, [config, siteConfig, isInitialized]);

  const hasChanges = useMemo(() => {
    return JSON.stringify(localConfig) !== JSON.stringify(config) || 
           JSON.stringify(localSiteConfig) !== JSON.stringify(siteConfig);
  }, [localConfig, localSiteConfig, config, siteConfig]);

  const pendingUsers = useMemo(() => users.filter(u => !u.approved && u.username !== 'qinghoohoo'), [users]);
  const activeUsers = useMemo(() => users.filter(u => u.approved), [users]);

  // Scoring CRUD
  const handleUpdateScore = (cat: keyof ScoringConfig, key: string, val: number) => {
    if (cat === 'thresholds') return;
    setLocalConfig(prev => ({ 
      ...prev, 
      [cat]: { ...(prev[cat] as Record<string, number>), [key]: val } 
    }));
  };

  const handleAddItem = (cat: keyof ScoringConfig) => {
    const name = newItemNames[cat]?.trim();
    if (!name) return;
    setLocalConfig(prev => ({
      ...prev,
      [cat]: { ...(prev[cat] as Record<string, number>), [name]: 0 }
    }));
    setNewItemNames(prev => ({ ...prev, [cat]: '' }));
  };

  const handleRemoveItem = (cat: keyof ScoringConfig, key: string) => {
    if (!window.confirm(`确认永久移除“${key}”权重项？`)) return;
    setLocalConfig(prev => {
      const nextCat = { ...(prev[cat] as Record<string, number>) };
      delete nextCat[key];
      return { ...prev, [cat]: nextCat };
    });
  };

  // Thresholds CRUD
  const handleUpdateThreshold = (id: string, updates: Partial<RiskThreshold>) => {
    setLocalConfig(prev => ({
      ...prev,
      thresholds: prev.thresholds.map(th => th.id === id ? { ...th, ...updates } : th)
    }));
  };

  const handleAddThreshold = () => {
    const newTh: RiskThreshold = { id: `th-${Date.now()}`, level: '新风险等级', min: 0, max: 0, suggestion: '请录入标准化处置建议' };
    setLocalConfig(prev => ({ ...prev, thresholds: [...prev.thresholds, newTh] }));
  };

  const handleRemoveThreshold = (id: string) => {
    if (!window.confirm("确定删除此分层策略？")) return;
    setLocalConfig(prev => ({ ...prev, thresholds: prev.thresholds.filter(t => t.id !== id) }));
  };

  // CMS CRUD
  const handleUpdateFeature = (id: string, updates: Partial<LandingFeature>) => {
    setLocalSiteConfig(prev => ({
      ...prev,
      features: prev.features.map(f => f.id === id ? { ...f, ...updates } : f)
    }));
  };

  const handleAddFeature = () => {
    const newF: LandingFeature = { id: `f-${Date.now()}`, title: '新特性标题', description: '特性描述', iconName: 'Activity' };
    setLocalSiteConfig(prev => ({ ...prev, features: [...prev.features, newF] }));
  };

  const handleUpdateAbout = (id: string, updates: Partial<AboutItem>) => {
    setLocalSiteConfig(prev => ({
      ...prev,
      aboutItems: prev.aboutItems.map(a => a.id === id ? { ...a, ...updates } : a)
    }));
  };

  const handleAddAbout = () => {
    const newA: AboutItem = { id: `a-${Date.now()}`, title: '新准则', description: '条款详情' };
    setLocalSiteConfig(prev => ({ ...prev, aboutItems: [...prev.aboutItems, newA] }));
  };

  const handleSaveAll = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await updateGlobalConfig(localConfig, localSiteConfig);
      setIsInitialized(false);
      alert("全网配置已即时同步成功！");
    } catch (err: any) {
      alert(`同步失败: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  if (currentUser?.username !== 'qinghoohoo') {
    return <div className="py-40 text-center font-black text-black">非超管禁止访问核心管控矩阵</div>;
  }

  return (
    <div className="space-y-10 pb-40 animate-in slide-in-from-bottom-6 duration-700">
      {/* 顶部同步控制面板 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white shadow-xl shadow-black/10"><Shield size={32} /></div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase text-black dark:text-white">全站管理与管控中心</h1>
            <p className="text-[10px] text-black font-black uppercase tracking-widest mt-1 opacity-60">Global Real-time Sync Hub</p>
          </div>
        </div>
        <button onClick={handleSaveAll} disabled={isSyncing || !hasChanges}
          className={`px-10 py-5 rounded-full font-black text-xs shadow-2xl transition-all flex items-center gap-3 uppercase tracking-widest active:scale-95 ${hasChanges ? 'bg-black text-white' : 'bg-slate-100 text-slate-400'}`}>
          {isSyncing ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
          同步全网个性化配置
        </button>
      </div>

      {/* 功能导航标签 */}
      <div className="flex overflow-x-auto no-scrollbar py-2">
        <div className="flex gap-2 p-1.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-3xl rounded-full border border-slate-100 dark:border-slate-800 shadow-xl w-fit">
          {[
            { id: 'team', label: '团队成员审核', icon: Users },
            { id: 'scoring', label: '临床权重矩阵', icon: Settings2 },
            { id: 'thresholds', label: '分层决策逻辑', icon: Sliders },
            { id: 'cms', label: '门户内容管理', icon: Layout },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} 
              className={`flex items-center gap-2.5 px-6 py-4 rounded-full text-[11px] font-black transition-all uppercase tracking-widest ${activeTab === tab.id ? 'bg-black text-white shadow-lg' : 'text-black hover:bg-slate-50'}`}> 
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 板块 1: 团队管理 */}
      {activeTab === 'team' && (
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl">
            <h3 className="text-xl font-black mb-8 text-black dark:text-white uppercase tracking-tighter">待审核申请库</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/10 border border-slate-100 dark:border-slate-800 rounded-2xl">
                   <div className="font-black text-black dark:text-white">{u.username}</div>
                   <div className="flex gap-2">
                     <button onClick={() => approveUser(u.id)} className="p-2 bg-black text-white rounded-lg transition-all active:scale-90"><CheckCircle size={18}/></button>
                     <button onClick={() => deleteUser(u.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><UserX size={18}/></button>
                   </div>
                </div>
              ))}
              {pendingUsers.length === 0 && <div className="col-span-2 text-center py-10 text-slate-400 font-bold uppercase tracking-widest text-xs">暂无待处理医师申请</div>}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl">
            <h3 className="text-xl font-black mb-8 text-black dark:text-white uppercase tracking-tighter">活跃医师团队</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activeUsers.map(u => (
                <div key={u.id} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700 flex flex-col justify-between">
                   <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="font-black text-black dark:text-white">{u.username}</div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{u.role}</div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${u.active ? 'bg-black shadow-[0_0_8px_rgba(0,0,0,0.4)]' : 'bg-slate-300'}`}></div>
                   </div>
                   <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                      <button onClick={() => toggleUserStatus(u.id)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${u.active ? 'bg-slate-100 text-black' : 'bg-black text-white'}`}>{u.active ? '锁定账号' : '激活账号'}</button>
                      <button onClick={() => deleteUser(u.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={16}/></button>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 板块 2: 权重配置 */}
      {activeTab === 'scoring' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(['symptoms', 'history', 'exposure', 'ctFeatures', 'qft', 'smear', 'culture', 'molecular'] as const).map(cat => (
            <div key={cat} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl flex flex-col">
               <h4 className="text-[11px] font-black text-black dark:text-white uppercase tracking-widest mb-6 pb-4 border-b border-slate-100 flex justify-between items-center">
                 {cat.toUpperCase()} 权重矩阵
               </h4>
               <div className="flex-1 space-y-3 overflow-y-auto max-h-[350px] pr-2 mb-6 custom-scrollbar">
                  {Object.entries(localConfig[cat] || {}).map(([name, val]) => (
                    <div key={name} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl group hover:bg-slate-100 transition-all">
                       <input type="number" value={val} onChange={(e) => handleUpdateScore(cat, name, parseInt(e.target.value) || 0)}
                         className="w-14 bg-white dark:bg-slate-700 border-none rounded-lg py-1.5 text-center text-xs font-black shadow-sm text-black outline-none" />
                       <span className="flex-1 text-[10px] font-bold text-black truncate">{name}</span>
                       <button onClick={() => handleRemoveItem(cat, name)} className="opacity-0 group-hover:opacity-100 p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-all"><Trash size={12}/></button>
                    </div>
                  ))}
               </div>
               <div className="flex gap-2">
                 <input value={newItemNames[cat] || ''} onChange={e => setNewItemNames({...newItemNames, [cat]: e.target.value})} placeholder="新增指标..." className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-[10px] font-bold text-black outline-none" />
                 <button onClick={() => handleAddItem(cat)} className="p-2 bg-black text-white rounded-xl shadow-lg active:scale-95 transition-all"><Plus size={16}/></button>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* 板块 3: 决策分层 */}
      {activeTab === 'thresholds' && (
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl space-y-10">
           <div className="flex items-center justify-between">
             <h3 className="text-xl font-black text-black dark:text-white uppercase tracking-tighter">临床决策分层矩阵</h3>
             <button onClick={handleAddThreshold} className="flex items-center gap-2 px-8 py-3 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"><Plus size={14}/> 增加风险分层</button>
           </div>
           <div className="space-y-6">
              {localConfig.thresholds.map((th) => (
                <div key={th.id} className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] relative group border border-slate-100 hover:border-black/10 transition-all">
                   <div className="lg:col-span-2">
                      <Label>等级名称</Label>
                      <input value={th.level} onChange={e => handleUpdateThreshold(th.id, { level: e.target.value })} className="w-full bg-white dark:bg-slate-700 rounded-xl px-4 py-2.5 text-xs font-black text-black outline-none" />
                   </div>
                   <div className="lg:col-span-2">
                      <Label>分值范围 (Min-Max)</Label>
                      <div className="flex gap-2">
                        <input type="number" value={th.min} onChange={e => handleUpdateThreshold(th.id, { min: parseInt(e.target.value) || 0 })} className="w-full bg-white dark:bg-slate-700 rounded-xl px-2 py-2 text-xs font-black text-center text-black" />
                        <input type="number" value={th.max} onChange={e => handleUpdateThreshold(th.id, { max: parseInt(e.target.value) || 0 })} className="w-full bg-white dark:bg-slate-700 rounded-xl px-2 py-2 text-xs font-black text-center text-black" />
                      </div>
                   </div>
                   <div className="lg:col-span-7">
                      <Label>临床标准化处置建议</Label>
                      <textarea value={th.suggestion} onChange={e => handleUpdateThreshold(th.id, { suggestion: e.target.value })} className="w-full bg-white dark:bg-slate-700 rounded-xl px-4 py-3 text-xs font-bold h-12 resize-none text-black" />
                   </div>
                   <div className="lg:col-span-1 flex items-end justify-center">
                      <button onClick={() => handleRemoveThreshold(th.id)} className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash size={18}/></button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* 板块 4: 门户内容管理 (CMS) */}
      {activeTab === 'cms' && (
        <div className="space-y-10">
          {/* Hero Section */}
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl space-y-10">
            <h3 className="text-xl font-black text-black dark:text-white uppercase tracking-tighter flex items-center gap-3"><Globe size={24} /> 核心看板 (Hero Section)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-3">
                 <Label>Hero 徽标/状态文案</Label>
                 <input value={localSiteConfig.heroBadge} onChange={e => setLocalSiteConfig({...localSiteConfig, heroBadge: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 px-6 py-4 rounded-2xl font-bold text-black text-sm outline-none" />
               </div>
               <div className="space-y-3">
                 <Label>Hero 主标题 (支持 \n 换行)</Label>
                 <textarea value={localSiteConfig.heroTitle} onChange={e => setLocalSiteConfig({...localSiteConfig, heroTitle: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 px-6 py-4 rounded-2xl font-black text-black text-sm h-20 outline-none" />
               </div>
               <div className="md:col-span-2 space-y-3">
                 <Label>Hero 核心描述语</Label>
                 <textarea value={localSiteConfig.heroDescription} onChange={e => setLocalSiteConfig({...localSiteConfig, heroDescription: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 px-6 py-4 rounded-2xl font-bold text-black text-sm h-32 outline-none" />
               </div>
               <div className="space-y-3">
                 <Label>CTA 按钮文案</Label>
                 <input value={localSiteConfig.ctaText} onChange={e => setLocalSiteConfig({...localSiteConfig, ctaText: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 px-6 py-4 rounded-2xl font-bold text-black text-sm outline-none" />
               </div>
               <div className="space-y-3">
                 <Label>Hero 背景图片链接</Label>
                 <input value={localSiteConfig.heroImageUrl} onChange={e => setLocalSiteConfig({...localSiteConfig, heroImageUrl: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 px-6 py-4 rounded-2xl font-bold text-black text-sm outline-none" />
               </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl space-y-10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
              <h3 className="text-xl font-black text-black dark:text-white uppercase tracking-tighter flex items-center gap-3"><Layout size={24} /> 特性卡片管理 (Features)</h3>
              <button onClick={handleAddFeature} className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"><Plus size={14}/> 增加特性卡片</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {localSiteConfig.features.map(f => (
                <div key={f.id} className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 relative group transition-all">
                  <div className="flex flex-col gap-4">
                    <input value={f.iconName} onChange={e => handleUpdateFeature(f.id, { iconName: e.target.value })} className="w-full bg-white dark:bg-slate-700 px-4 py-2 rounded-xl text-[10px] font-black text-black" placeholder="Icon 名 (如: Activity)" />
                    <input value={f.title} onChange={e => handleUpdateFeature(f.id, { title: e.target.value })} className="w-full bg-white dark:bg-slate-700 px-4 py-3 rounded-xl text-sm font-black text-black" placeholder="卡片标题" />
                    <textarea value={f.description} onChange={e => handleUpdateFeature(f.id, { description: e.target.value })} className="w-full bg-white dark:bg-slate-700 px-4 py-3 rounded-xl text-xs font-bold text-black h-24 resize-none" placeholder="卡片描述细节..." />
                  </div>
                  <button onClick={() => setLocalSiteConfig({...localSiteConfig, features: localSiteConfig.features.filter(fi => fi.id !== f.id)})} className="absolute -top-3 -right-3 p-2 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-xl"><Trash size={12}/></button>
                </div>
              ))}
            </div>
          </div>

          {/* About / Security Section */}
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl space-y-10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
              <h3 className="text-xl font-black text-black dark:text-white uppercase tracking-tighter flex items-center gap-3"><ShieldCheck size={24} /> 安全与准则板块 (Security)</h3>
              <button onClick={handleAddAbout} className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"><Plus size={14}/> 增加准则项</button>
            </div>
            <div className="space-y-6">
              {localSiteConfig.aboutItems.map(a => (
                <div key={a.id} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex gap-6 items-start border border-slate-100 hover:border-black/5 transition-all">
                   <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <Label>标题</Label>
                        <input value={a.title} onChange={e => handleUpdateAbout(a.id, { title: e.target.value })} className="w-full bg-white dark:bg-slate-700 px-4 py-2.5 rounded-xl text-sm font-black text-black" />
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <Label>描述描述</Label>
                        <input value={a.description} onChange={e => handleUpdateAbout(a.id, { description: e.target.value })} className="w-full bg-white dark:bg-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold text-black" />
                      </div>
                   </div>
                   <button onClick={() => setLocalSiteConfig({...localSiteConfig, aboutItems: localSiteConfig.aboutItems.filter(ai => ai.id !== a.id)})} className="mt-7 p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash size={16}/></button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer & Brands Section */}
          <div className="bg-slate-950 rounded-[3rem] p-10 shadow-2xl space-y-10">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3"><FileText size={24} className="text-white" /> 品牌、页脚与联系方式配置</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-3">
                 <Label><span className="text-white">品牌全称</span></Label>
                 <input value={localSiteConfig.footerBrandName} onChange={e => setLocalSiteConfig({...localSiteConfig, footerBrandName: e.target.value})} className="w-full bg-white/10 border border-white/10 px-6 py-4 rounded-2xl font-black text-white text-sm outline-none focus:bg-white/20 transition-all" />
               </div>
               <div className="space-y-3">
                 <Label><span className="text-white">ICP 备案/业务序列号</span></Label>
                 <input value={localSiteConfig.footerIcp} onChange={e => setLocalSiteConfig({...localSiteConfig, footerIcp: e.target.value})} className="w-full bg-white/10 border border-white/10 px-6 py-4 rounded-2xl font-bold text-white text-sm outline-none focus:bg-white/20 transition-all" />
               </div>
               <div className="md:col-span-2 space-y-3">
                 <Label><span className="text-white">页脚品牌描述</span></Label>
                 <textarea value={localSiteConfig.footerDescription} onChange={e => setLocalSiteConfig({...localSiteConfig, footerDescription: e.target.value})} className="w-full bg-white/10 border border-white/10 px-6 py-4 rounded-2xl font-bold text-white text-sm h-24 outline-none focus:bg-white/20 transition-all" />
               </div>
               <div className="md:col-span-2 space-y-3">
                 <Label><span className="text-white">版权所有声明 (Copyright)</span></Label>
                 <input value={localSiteConfig.footerCopyright} onChange={e => setLocalSiteConfig({...localSiteConfig, footerCopyright: e.target.value})} className="w-full bg-white/10 border border-white/10 px-6 py-4 rounded-2xl font-bold text-white text-sm outline-none focus:bg-white/20 transition-all" />
               </div>
            </div>
          </div>

          {/* Page Meta Titles */}
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl space-y-10">
            <h3 className="text-xl font-black text-black dark:text-white uppercase tracking-tighter flex items-center gap-3"><Palette size={24} /> 内部页面元数据管理</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="space-y-3">
                 <Label>评估页面标题</Label>
                 <input value={localSiteConfig.inputPageTitle} onChange={e => setLocalSiteConfig({...localSiteConfig, inputPageTitle: e.target.value})} className="w-full bg-slate-50 px-4 py-3 rounded-xl font-bold text-black text-xs outline-none" />
               </div>
               <div className="space-y-3">
                 <Label>数据中心标题</Label>
                 <input value={localSiteConfig.summaryPageTitle} onChange={e => setLocalSiteConfig({...localSiteConfig, summaryPageTitle: e.target.value})} className="w-full bg-slate-50 px-4 py-3 rounded-xl font-bold text-black text-xs outline-none" />
               </div>
               <div className="space-y-3">
                 <Label>管理中心标题</Label>
                 <input value={localSiteConfig.adminPageTitle} onChange={e => setLocalSiteConfig({...localSiteConfig, adminPageTitle: e.target.value})} className="w-full bg-slate-50 px-4 py-3 rounded-xl font-bold text-black text-xs outline-none" />
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettingsPage;
