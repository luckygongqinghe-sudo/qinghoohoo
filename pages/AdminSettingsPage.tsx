
import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store.tsx';
import { UserRole, ScoringConfig, SiteConfig, RiskThreshold, LandingFeature, AboutItem } from '../types.ts';
import { 
  Users, 
  Trash2, 
  CheckCircle, 
  Save,
  GraduationCap,
  Settings2,
  Monitor,
  ShieldCheck,
  UserCheck,
  UserX,
  ShieldAlert,
  Plus,
  Layout,
  RefreshCw,
  Globe,
  FileText,
  RotateCcw,
  Shield,
  Activity,
  Sliders
} from 'lucide-react';

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-[10px] font-black text-slate-950 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">{children}</label>
);

const AdminSettingsPage: React.FC = () => {
  const { 
    users, 
    currentUser, 
    approveUser,
    deleteUser,
    config, 
    siteConfig, 
    updateGlobalConfig 
  } = useStore();
  
  const [activeTab, setActiveTab] = useState<'approvals' | 'users' | 'scoring' | 'thresholds' | 'cms'>('scoring');
  
  const [localConfig, setLocalConfig] = useState<ScoringConfig>(() => JSON.parse(JSON.stringify(config)));
  const [localSiteConfig, setLocalSiteConfig] = useState<SiteConfig>(() => JSON.parse(JSON.stringify(siteConfig)));
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
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

  const pendingUsers = useMemo(() => (users || []).filter(u => u && !u.approved && u.username !== 'qinghoohoo'), [users]);
  const approvedUsers = useMemo(() => (users || []).filter(u => u && u.approved), [users]);

  const handleUpdateScore = (cat: keyof ScoringConfig, key: string, val: number) => {
    if (cat === 'thresholds') return;
    setLocalConfig(prev => ({ 
      ...prev, 
      [cat]: { ...(prev[cat] as Record<string, number>), [key]: val } 
    }));
  };

  const handleAddScoreItem = (cat: keyof ScoringConfig) => {
    const name = newItemNames[cat]?.trim();
    if (!name) return;
    setLocalConfig(prev => ({
      ...prev, 
      [cat]: { ...(prev[cat] as Record<string, number>), [name]: 0 }
    }));
    setNewItemNames(prev => ({ ...prev, [cat]: '' }));
  };

  const handleRemoveScoreItem = (cat: keyof ScoringConfig, key: string) => {
    if(!window.confirm(`确认从全球模型中移除指标“${key}”？`)) return;
    setLocalConfig(prev => {
      const nextCat = { ...(prev[cat] as Record<string, number>) };
      delete nextCat[key];
      return { ...prev, [cat]: nextCat };
    });
  };

  const handleAddThreshold = () => {
    const newT: RiskThreshold = { id: `t_${Date.now()}`, level: '新风险等级', min: 0, max: 10, suggestion: '请输入处置建议...' };
    setLocalConfig(prev => ({ ...prev, thresholds: [...prev.thresholds, newT] }));
  };

  const handleRemoveThreshold = (id: string) => {
    if(!window.confirm('确认移除该风险策略？')) return;
    setLocalConfig(prev => ({ ...prev, thresholds: prev.thresholds.filter(t => t.id !== id) }));
  };

  const handleUpdateThreshold = (id: string, updates: Partial<RiskThreshold>) => {
    setLocalConfig(prev => ({
      ...prev,
      thresholds: prev.thresholds.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  };

  const handleAddFeature = () => {
    const newF: LandingFeature = { id: `f_${Date.now()}`, title: '新特性', description: '描述内容', iconName: 'Activity' };
    setLocalSiteConfig(prev => ({ ...prev, features: [...prev.features, newF] }));
  };

  const handleUpdateFeature = (id: string, updates: Partial<LandingFeature>) => {
    setLocalSiteConfig(prev => ({
      ...prev,
      features: prev.features.map(f => f.id === id ? { ...f, ...updates } : f)
    }));
  };

  const handleRemoveFeature = (id: string) => {
    if(!window.confirm('确认移除该门户卡片？')) return;
    setLocalSiteConfig(prev => ({ ...prev, features: prev.features.filter(f => f.id !== id) }));
  };

  const handleSaveAll = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await updateGlobalConfig(localConfig, localSiteConfig);
      setSaveSuccess(true);
      setIsInitialized(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Sync Error:', err);
      alert(`云端同步失败: ${err.message || '未知错误'}\n提示：请检查 Supabase 数据库 configs 表的 RLS 写入权限。`);
    } finally {
      setIsSyncing(false);
    }
  };

  if (currentUser?.username !== 'qinghoohoo') {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-center animate-in fade-in zoom-in-95">
        <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mb-8 border-4 border-rose-100">
           <ShieldAlert className="text-rose-500" size={48} />
        </div>
        <h2 className="text-4xl font-black text-slate-950 uppercase tracking-tighter">准入授权受限</h2>
        <p className="mt-4 text-slate-900 font-bold uppercase tracking-widest text-[10px]">仅根节点管理员 (qinghoohoo) 可操控云端模型权重</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-40 animate-in slide-in-from-bottom-6 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center">
            <Shield className="text-indigo-600" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-950 dark:text-white uppercase">全球同步矩阵</h1>
            <div className="flex items-center gap-2 mt-1">
               <div className={`w-2 h-2 rounded-full ${hasChanges ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
               <p className="font-bold text-[10px] text-slate-950 dark:text-slate-400 uppercase tracking-widest">
                 状态: {hasChanges ? '待推送本地草稿' : '已对齐全球医学指南'}
               </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {hasChanges && (
            <button onClick={() => setIsInitialized(false)} className="flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-xs text-rose-600 hover:bg-rose-50 transition-all">
              <RotateCcw size={14} /> 放弃修改
            </button>
          )}
          <button onClick={handleSaveAll} disabled={isSyncing || !hasChanges}
            className={`px-10 py-5 rounded-[2rem] font-black text-xs shadow-2xl transition-all flex items-center gap-3 uppercase tracking-widest active:scale-95 ${hasChanges ? 'bg-indigo-600 text-white hover:scale-105 shadow-indigo-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}`}>
            {isSyncing ? <RefreshCw className="animate-spin" size={16} /> : (saveSuccess ? <CheckCircle size={16} /> : <Save size={16} />)}
            {isSyncing ? '同步中' : (saveSuccess ? '推送成功' : '推送全网最新配置')}
          </button>
        </div>
      </div>

      <div className="sticky top-24 z-30 flex overflow-x-auto no-scrollbar py-2">
        <div className="flex gap-2 p-1.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-3xl rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl w-fit">
          {[
            { id: 'approvals', label: '待审', icon: ShieldCheck, badge: pendingUsers.length },
            { id: 'users', label: '团队', icon: Users },
            { id: 'scoring', label: '权重', icon: Settings2 },
            { id: 'thresholds', label: '策略', icon: Sliders },
            { id: 'cms', label: '门户', icon: Monitor },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} 
              className={`flex items-center gap-2.5 px-6 py-4 rounded-3xl text-[11px] font-black transition-all uppercase tracking-widest ${activeTab === tab.id ? 'bg-slate-950 text-white dark:bg-indigo-600 shadow-xl' : 'text-slate-950 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}> 
              <tab.icon size={14} /> {tab.label}
              {tab.badge ? <span className="ml-2 px-2 py-0.5 bg-rose-500 text-white rounded-full text-[8px] leading-none">{tab.badge}</span> : null}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        {activeTab === 'approvals' && (
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-2xl">
             <h3 className="text-xl font-black text-slate-950 dark:text-white uppercase tracking-tighter mb-10">待审准入账户</h3>
             {pendingUsers.length === 0 ? (
               <div className="py-24 text-center">
                  <p className="text-slate-400 font-black text-xs uppercase tracking-[0.3em]">当前暂无申请</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pendingUsers.map(u => (
                    <div key={u.id} className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] flex items-center justify-between group">
                       <div>
                          <div className="text-lg font-black text-slate-950 dark:text-white">{u.username}</div>
                          <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">UID: {u.id.slice(-6)}</div>
                       </div>
                       <div className="flex gap-3">
                          <button onClick={() => approveUser(u.id)} className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg"><UserCheck size={20} /></button>
                          <button onClick={() => deleteUser(u.id)} className="w-12 h-12 bg-white dark:bg-slate-700 text-rose-500 rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-md"><UserX size={20} /></button>
                       </div>
                    </div>
                  ))}
               </div>
             )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-2xl">
             <h3 className="text-xl font-black text-slate-950 dark:text-white uppercase tracking-tighter mb-10">活跃团队 ({approvedUsers.length})</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {approvedUsers.map(u => (
                  <div key={u.id} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center text-indigo-500 font-black text-xs border border-slate-100 dark:border-slate-600">{u.username[0].toUpperCase()}</div>
                        <span className="font-black text-slate-950 dark:text-white text-sm">{u.username}</span>
                     </div>
                     <button onClick={() => deleteUser(u.id)} className="text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'scoring' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(['symptoms', 'history', 'exposure', 'ctFeatures', 'qft', 'smear', 'culture'] as const).map(cat => (
              <div key={cat} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl">
                 <h4 className="text-[10px] font-black text-slate-950 dark:text-slate-400 uppercase tracking-widest mb-6 pb-4 border-b border-slate-50 dark:border-slate-800 flex justify-between">
                   {cat.toUpperCase()} 权重值
                 </h4>
                 <div className="space-y-4">
                    {Object.entries(localConfig[cat] as Record<string, number>).map(([name, val]) => (
                      <div key={name} className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl group">
                         <span className="flex-1 text-[11px] font-black text-slate-950 dark:text-slate-300">{name}</span>
                         <input type="number" value={val} onChange={(e) => handleUpdateScore(cat, name, parseInt(e.target.value) || 0)}
                           className="w-16 bg-white dark:bg-slate-700 border-none rounded-xl px-2 py-2 text-center text-xs font-black shadow-sm text-slate-950 dark:text-white" />
                         <button onClick={() => handleRemoveScoreItem(cat, name)} className="opacity-0 group-hover:opacity-100 p-1 text-rose-500 transition-all"><Trash2 size={14} /></button>
                      </div>
                    ))}
                    <div className="mt-6 flex gap-2">
                      <input value={newItemNames[cat] || ''} onChange={e => setNewItemNames({...newItemNames, [cat]: e.target.value})} placeholder="新增项..." className="flex-1 px-3 py-2 bg-white dark:bg-slate-700 rounded-xl border-none font-bold text-[10px] text-slate-950 dark:text-white shadow-inner" />
                      <button onClick={() => handleAddScoreItem(cat)} className="p-2 bg-emerald-600 text-white rounded-xl shadow-lg"><Plus size={16} /></button>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'thresholds' && (
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl space-y-8">
             <div className="flex items-center justify-between">
               <h3 className="text-xl font-black text-slate-950 dark:text-white flex items-center gap-3"><GraduationCap size={24} className="text-emerald-500" /> 风险分层决策策略</h3>
               <button onClick={handleAddThreshold} className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs hover:scale-105 transition-all shadow-lg"><Plus size={16} className="inline mr-1"/> 新增阶梯</button>
             </div>
             <div className="space-y-6">
                {localConfig.thresholds.map((th) => (
                  <div key={th.id} className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] relative group">
                     <button onClick={() => handleRemoveThreshold(th.id)} className="absolute top-4 right-4 text-rose-500"><Trash2 size={16}/></button>
                     <div className="lg:col-span-2">
                        <Label>等级名称</Label>
                        <input value={th.level} onChange={e => handleUpdateThreshold(th.id, { level: e.target.value })} className="w-full bg-white dark:bg-slate-700 rounded-xl px-4 py-2.5 text-xs font-black text-slate-950 dark:text-white border-none" />
                     </div>
                     <div className="lg:col-span-2 grid grid-cols-2 gap-2">
                        <div><Label>下限</Label><input type="number" value={th.min} onChange={e => handleUpdateThreshold(th.id, { min: parseInt(e.target.value) || 0 })} className="w-full bg-white dark:bg-slate-700 rounded-xl px-4 py-2.5 text-xs font-black text-center text-slate-950 dark:text-white border-none" /></div>
                        <div><Label>上限</Label><input type="number" value={th.max} onChange={e => handleUpdateThreshold(th.id, { max: parseInt(e.target.value) || 0 })} className="w-full bg-white dark:bg-slate-700 rounded-xl px-4 py-2.5 text-xs font-black text-center text-slate-950 dark:text-white border-none" /></div>
                     </div>
                     <div className="lg:col-span-8">
                        <Label>标准化处置建议</Label>
                        <input value={th.suggestion} onChange={e => handleUpdateThreshold(th.id, { suggestion: e.target.value })} className="w-full bg-white dark:bg-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-950 dark:text-white border-none" />
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'cms' && (
          <div className="space-y-12 pb-20">
             <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl space-y-8">
                <h3 className="text-xl font-black text-slate-950 dark:text-white flex items-center gap-3"><Layout size={24} className="text-blue-500" /> 门户 Hero 核心区</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="md:col-span-2">
                      <Label>主标题 (支持 \n 换行)</Label>
                      <textarea value={localSiteConfig.heroTitle} onChange={e => setLocalSiteConfig({...localSiteConfig, heroTitle: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl font-black text-2xl h-24 border-none text-slate-950 dark:text-white shadow-inner resize-none" />
                   </div>
                   <div className="md:col-span-2">
                      <Label>描述文案</Label>
                      <textarea value={localSiteConfig.heroDescription} onChange={e => setLocalSiteConfig({...localSiteConfig, heroDescription: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-slate-950 dark:text-slate-300 h-24 border-none shadow-inner resize-none leading-relaxed" />
                   </div>
                   <div><Label>视觉 Badge</Label><input value={localSiteConfig.heroBadge} onChange={e => setLocalSiteConfig({...localSiteConfig, heroBadge: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl font-black border-none text-slate-950 dark:text-white shadow-inner" /></div>
                   <div><Label>CTA 按钮文字</Label><input value={localSiteConfig.ctaText} onChange={e => setLocalSiteConfig({...localSiteConfig, ctaText: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl font-black border-none text-slate-950 dark:text-white shadow-inner" /></div>
                </div>
             </div>

             <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl space-y-8">
                <div className="flex items-center justify-between">
                   <h3 className="text-xl font-black text-slate-950 dark:text-white flex items-center gap-3"><Globe size={24} className="text-emerald-500" /> 特性卡片配置</h3>
                   <button onClick={handleAddFeature} className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-black text-xs shadow-lg"><Plus size={16} className="inline mr-1" /> 新增卡片</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {localSiteConfig.features.map(f => (
                     <div key={f.id} className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[2rem] space-y-4 relative shadow-inner">
                        <button onClick={() => handleRemoveFeature(f.id)} className="absolute top-4 right-4 text-rose-500"><Trash2 size={16}/></button>
                        <div><Label>标题</Label><input value={f.title} onChange={e => handleUpdateFeature(f.id, { title: e.target.value })} className="w-full p-3 bg-white dark:bg-slate-700 rounded-xl border-none font-black text-xs text-slate-950 dark:text-white shadow-sm" /></div>
                        <div><Label>描述</Label><textarea value={f.description} onChange={e => handleUpdateFeature(f.id, { description: e.target.value })} className="w-full p-3 bg-white dark:bg-slate-700 rounded-xl border-none font-bold text-slate-950 dark:text-slate-400 text-xs h-20 shadow-sm resize-none" /></div>
                     </div>
                   ))}
                </div>
             </div>

             <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl space-y-8">
                <h3 className="text-xl font-black text-slate-950 dark:text-white flex items-center gap-3"><FileText size={24} className="text-indigo-500" /> 系统品牌信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div><Label>品牌名称</Label><input value={localSiteConfig.footerBrandName} onChange={e => setLocalSiteConfig({...localSiteConfig, footerBrandName: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl font-black border-none text-slate-950 dark:text-white shadow-inner" /></div>
                   <div><Label>版权声明</Label><input value={localSiteConfig.footerCopyright} onChange={e => setLocalSiteConfig({...localSiteConfig, footerCopyright: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl font-black border-none text-slate-950 dark:text-white shadow-inner" /></div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettingsPage;
