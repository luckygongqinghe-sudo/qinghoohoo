
import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store.tsx';
import { UserRole, ScoringConfig, SiteConfig, RiskThreshold, LandingFeature, AboutItem, FooterSupportItem } from '../types.ts';
import { 
  Users, 
  Trash2, 
  CheckCircle, 
  Save,
  GraduationCap,
  Lock,
  Settings2,
  Monitor,
  ShieldCheck,
  UserCheck,
  UserX,
  ShieldAlert,
  Plus,
  Layout,
  RefreshCcw,
  AlertCircle,
  Smartphone,
  Globe,
  Info,
  FileText,
  RotateCcw,
  // Fix: Added missing Shield icon
  Shield
} from 'lucide-react';

// Fix: Moved Label component outside and typed it as React.FC to resolve children property validation errors
const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">{children}</label>
);

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
  
  const [activeTab, setActiveTab] = useState<'approvals' | 'users' | 'scoring' | 'thresholds' | 'cms'>('approvals');
  
  // 本地隔离编辑状态 (Drafts)
  const [localConfig, setLocalConfig] = useState<ScoringConfig>(() => JSON.parse(JSON.stringify(config)));
  const [localSiteConfig, setLocalSiteConfig] = useState<SiteConfig>(() => JSON.parse(JSON.stringify(siteConfig)));
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [newItemNames, setNewItemNames] = useState<Record<string, string>>({});

  // 密码修改状态
  const [editingPwdId, setEditingPwdId] = useState<string | null>(null);
  const [newPwdValue, setNewPwdValue] = useState('');

  // 仅在首次加载或重置时同步 Store 数据到本地 Draft
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

  // ================= 权重与评分逻辑修复 =================
  const handleUpdateScore = (cat: keyof ScoringConfig, key: string, val: number) => {
    if (cat === 'thresholds') return;
    setLocalConfig(prev => ({ 
      ...prev, 
      [cat]: { ...(prev[cat] as Record<string, number>), [key]: val } 
    }));
  };

  const handleAddScoreItem = (cat: keyof ScoringConfig) => {
    if (cat === 'thresholds') return;
    const name = newItemNames[cat]?.trim();
    if (!name) return;
    setLocalConfig(prev => ({
      ...prev,
      [cat]: { ...(prev[cat] as Record<string, number>), [name]: 0 }
    }));
    setNewItemNames(prev => ({ ...prev, [cat]: '' }));
  };

  const handleRemoveScoreItem = (cat: keyof ScoringConfig, key: string) => {
    if (cat === 'thresholds') return;
    if(!window.confirm(`确认删除指标“${key}”？该操作需保存后生效。`)) return;
    
    setLocalConfig(prev => {
      const currentCat = prev[cat] as Record<string, number>;
      const newItems = Object.entries(currentCat)
        .filter(([k]) => k !== key)
        .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
      
      return { ...prev, [cat]: newItems };
    });
  };

  // ================= 风险分层逻辑修复 =================
  const handleAddThreshold = () => {
    const newT: RiskThreshold = {
      id: `t_${Date.now()}`,
      level: '新诊断等级',
      min: 0,
      max: 10,
      suggestion: '建议内容...'
    };
    setLocalConfig(prev => ({ ...prev, thresholds: [...prev.thresholds, newT] }));
  };

  const handleRemoveThreshold = (id: string) => {
    if(!window.confirm('确认删除该诊断分层？')) return;
    setLocalConfig(prev => ({
      ...prev,
      thresholds: prev.thresholds.filter(t => t.id !== id)
    }));
  };

  const handleUpdateThreshold = (id: string, updates: Partial<RiskThreshold>) => {
    setLocalConfig(prev => ({
      ...prev,
      thresholds: prev.thresholds.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  };

  // ================= CMS 全量配置 =================
  const handleCMSAddFeature = () => {
    const newF: LandingFeature = { id: `f_${Date.now()}`, title: '新特性', description: '描述...', iconName: 'Activity' };
    setLocalSiteConfig(prev => ({ ...prev, features: [...prev.features, newF] }));
  };

  const handleCMSRemoveItem = (key: 'features' | 'aboutItems' | 'footerSupportItems', id: string) => {
    setLocalSiteConfig(prev => ({ ...prev, [key]: (prev[key] as any[]).filter(it => it.id !== id) }));
  };

  const handleCMSUpdateItem = <T extends { id: string }>(key: 'features' | 'aboutItems' | 'footerSupportItems', id: string, updates: Partial<T>) => {
    setLocalSiteConfig(prev => ({
      ...prev,
      [key]: (prev[key] as T[]).map(item => item.id === id ? { ...item, ...updates } : item)
    }));
  };

  // Fix: Added missing handleResetPassword function implementation
  const handleResetPassword = async (id: string) => {
    if (!newPwdValue.trim()) return;
    await updateUserPassword(id, newPwdValue);
    setEditingPwdId(null);
    setNewPwdValue('');
  };

  // ================= 云端同步执行 =================
  const handleSaveAll = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await Promise.all([
        updateConfig(localConfig),
        updateSiteConfig(localSiteConfig)
      ]);
      setSaveSuccess(true);
      setIsInitialized(false); 
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert('同步失败，请检查数据库连接');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetDraft = () => {
    if(!window.confirm('丢弃所有未保存的修改？')) return;
    setIsInitialized(false);
  };

  if (currentUser?.username !== 'qinghoohoo') {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-center">
        <ShieldAlert className="text-rose-500 mb-6" size={80} />
        <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase">Access Forbidden</h2>
        <p className="text-slate-500 mt-2 font-bold">仅超级管理员 qinghoohoo 拥有该区域配置权。</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-40 animate-in fade-in duration-700">
      {/* 全站控制台头部 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-black tracking-tighter mb-2 text-slate-950 dark:text-white uppercase flex items-center gap-3">
             <Shield className="text-emerald-500" /> Cloud Sync Terminal
          </h1>
          <p className="font-bold text-sm text-slate-500 flex items-center gap-2">
            <Lock size={16} className="text-emerald-500" /> 当前处于：隔离草稿编辑模式 (Isolated Mode)
          </p>
        </div>
        <div className="flex items-center gap-4">
          {hasChanges && (
            <button 
              onClick={handleResetDraft}
              className="flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-xs text-rose-600 hover:bg-rose-50 transition-all"
            >
              <RotateCcw size={14} /> 放弃修改
            </button>
          )}
          {saveSuccess && (
             <div className="px-6 py-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl font-black text-xs border border-emerald-100 animate-in slide-in-from-right">
               <CheckCircle size={14} className="inline mr-2"/> 同步成功
             </div>
          )}
          <button 
            onClick={handleSaveAll} 
            disabled={isSyncing || !hasChanges}
            className={`px-12 py-5 rounded-3xl font-black text-sm shadow-2xl transition-all flex items-center gap-3 ${hasChanges ? 'bg-emerald-600 text-white hover:scale-105' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
          >
            {isSyncing ? <RefreshCcw className="animate-spin" /> : <Save size={18} />}
            推送全站配置
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-24 z-30 flex overflow-x-auto no-scrollbar py-2">
        <div className="flex gap-2 p-1.5 bg-white/80 dark:bg-slate-800/60 backdrop-blur-2xl rounded-[2.2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          {[
            { id: 'approvals', label: '账户审计', icon: ShieldAlert, badge: pendingUsers.length },
            { id: 'users', label: '协作团队', icon: Users },
            { id: 'scoring', label: '权重配置', icon: Settings2 },
            { id: 'thresholds', label: '风险分层', icon: GraduationCap },
            { id: 'cms', label: '门户内容', icon: Monitor },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} 
              className={`flex items-center gap-2.5 px-6 py-4 rounded-3xl text-[12px] font-black transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-slate-950 text-white dark:bg-emerald-600 shadow-xl' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`} 
            > 
              <tab.icon size={16} strokeWidth={3} /> {tab.label}
              {tab.badge ? <span className="ml-2 px-2 py-0.5 bg-rose-600 text-white rounded-full text-[9px]">{tab.badge}</span> : null}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-12">
        {/* 账户审计 Tab */}
        {activeTab === 'approvals' && (
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl animate-in fade-in">
             <h3 className="text-xl font-black text-slate-950 dark:text-white flex items-center gap-3 mb-8"><ShieldCheck size={28} className="text-amber-500"/> 准入申请审计</h3>
             {pendingUsers.length === 0 ? (
               <div className="py-20 text-center space-y-4 text-slate-300"><CheckCircle className="mx-auto" size={40} /><p className="font-bold text-sm italic">暂无待处理项</p></div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingUsers.map(u => (
                    <div key={u.id} className="p-8 bg-slate-50 dark:bg-slate-800/40 rounded-[2.5rem] flex items-center justify-between border border-transparent hover:border-amber-200 transition-all shadow-inner">
                       <div><div className="text-xl font-black text-slate-950 dark:text-white">{u.username}</div><div className="text-[10px] text-slate-400 font-black uppercase mt-1">UID: {u.id.slice(-6)}</div></div>
                       <div className="flex items-center gap-3">
                          <button onClick={() => approveUser(u.id)} className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-all"><UserCheck size={20} /></button>
                          <button onClick={() => deleteUser(u.id)} className="w-12 h-12 bg-white dark:bg-slate-700 text-rose-600 rounded-2xl flex items-center justify-center shadow-sm hover:bg-rose-50 transition-all"><UserX size={20} /></button>
                       </div>
                    </div>
                  ))}
               </div>
             )}
          </div>
        )}

        {/* 协作团队 Tab */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl animate-in fade-in">
             <h3 className="text-xl font-black text-slate-950 dark:text-white flex items-center gap-3 mb-8"><Users size={28} className="text-indigo-600"/> 已授权临床协作组</h3>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
                         <th className="pb-6 px-4">成员标识</th><th className="pb-6 px-4">系统权限</th><th className="pb-6 px-4">凭证维护</th><th className="pb-6 px-4 text-right">管理</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {approvedUsers.map(u => (
                        <tr key={u.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                           <td className="py-6 px-4 font-black text-slate-900 dark:text-white">{u.username}</td>
                           <td className="py-6 px-4">
                             <select value={u.role} onChange={e => updateUserRole(u.id, e.target.value as UserRole)} className="bg-transparent font-black text-indigo-500 text-xs border-none outline-none cursor-pointer">
                                <option value={UserRole.USER}>临床评估员</option><option value={UserRole.ADMIN}>管理员</option>
                             </select>
                           </td>
                           <td className="py-6 px-4">
                             {editingPwdId === u.id ? (
                               <div className="flex items-center gap-2">
                                 <input autoFocus value={newPwdValue} onChange={e => setNewPwdValue(e.target.value)} placeholder="新密码" className="px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg text-xs font-black shadow-inner outline-none" />
                                 <button onClick={() => handleResetPassword(u.id)} className="p-2 bg-emerald-600 text-white rounded-lg shadow-sm"><CheckCircle size={14}/></button>
                                 <button onClick={() => setEditingPwdId(null)} className="p-2 bg-slate-200 dark:bg-slate-600 text-slate-500 rounded-lg"><UserX size={14}/></button>
                               </div>
                             ) : (
                               <button onClick={() => setEditingPwdId(u.id)} className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-colors"><RefreshCcw size={12}/> 重置临床密码</button>
                             )}
                           </td>
                           <td className="py-6 px-4 text-right">
                             {u.username !== 'qinghoohoo' && (
                               <button onClick={() => { if(window.confirm('确认物理吊销该账户？')) deleteUser(u.id); }} className="p-2 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={18}/></button>
                             )}
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {/* 权重配置 Tab */}
        {activeTab === 'scoring' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 text-slate-950 dark:text-white pb-20 animate-in fade-in">
            {(Object.keys(localConfig).filter(k => k !== 'thresholds') as Array<keyof ScoringConfig>).map(cat => (
              <div key={cat} className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl space-y-8">
                <h3 className="text-lg font-black text-slate-950 dark:text-white flex items-center gap-3 capitalize tracking-tight">
                  <div className="w-1.5 h-8 bg-emerald-500 rounded-full" />
                  {cat === 'history' ? '既往病史权重' : cat === 'symptoms' ? '临床症状权重' : cat === 'ctFeatures' ? '影像特征权重' : cat === 'exposure' ? '暴露风险权重' : cat.toUpperCase()}
                </h3>
                <div className="space-y-3">
                  {Object.entries(localConfig[cat] as Record<string, number>).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] border border-transparent hover:border-rose-100 transition-all shadow-inner relative group">
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleRemoveScoreItem(cat, key)} className="p-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/40 rounded-xl transition-all">
                          <Trash2 size={18}/>
                        </button>
                        <span className="text-sm font-black text-slate-900 dark:text-slate-100 truncate max-w-[200px]">{key}</span>
                      </div>
                      <input 
                        type="number" 
                        value={val} 
                        onChange={e => handleUpdateScore(cat, key, parseInt(e.target.value) || 0)} 
                        className="w-20 p-3 bg-white dark:bg-slate-700 rounded-xl border-none text-center font-black text-lg text-slate-950 dark:text-white shadow-inner outline-none" 
                      />
                    </div>
                  ))}
                  <div className="mt-8 flex gap-3 p-4 bg-slate-100 dark:bg-slate-800/60 rounded-3xl border border-dashed border-slate-300">
                    <input 
                      value={newItemNames[cat] || ''} 
                      onChange={e => setNewItemNames({...newItemNames, [cat]: e.target.value})} 
                      placeholder={`新增观测项...`} 
                      className="flex-1 px-5 py-3.5 bg-white dark:bg-slate-700 rounded-xl border-none font-bold text-xs text-slate-950 dark:text-white shadow-inner outline-none" 
                    />
                    <button onClick={() => handleAddScoreItem(cat)} className="p-3.5 bg-emerald-600 text-white rounded-xl shadow-lg hover:scale-105 transition-all">
                      <Plus size={24} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 风险分层 Tab */}
        {activeTab === 'thresholds' && (
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl animate-in fade-in space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-950 dark:text-white flex items-center gap-3">
                <GraduationCap size={24} className="text-emerald-500" /> 临床风险阶梯阈值模型
              </h3>
              <button onClick={handleAddThreshold} className="flex items-center gap-2 px-6 py-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl font-black text-xs hover:bg-emerald-100 shadow-sm transition-all">
                <Plus size={16} /> 新增阶梯
              </button>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {localConfig.thresholds.map((t) => (
                <div key={t.id} className="p-8 bg-slate-50 dark:bg-slate-800/40 rounded-[2.5rem] border border-transparent hover:border-emerald-100 transition-all space-y-6 relative shadow-inner group">
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex-1">
                      <Label>分层等级名称</Label>
                      <input value={t.level} onChange={e => handleUpdateThreshold(t.id, { level: e.target.value })} className="w-full p-4 bg-white dark:bg-slate-800 rounded-xl border-none font-black text-lg text-slate-900 dark:text-white shadow-sm" />
                    </div>
                    <button onClick={() => handleRemoveThreshold(t.id)} className="p-5 text-rose-500 hover:bg-rose-50 rounded-2xl transition-all shadow-sm bg-white dark:bg-slate-700 shrink-0 mt-6">
                      <Trash2 size={24} />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-start gap-8">
                    <div className="w-28">
                      <Label>分值下限</Label>
                      <input type="number" value={t.min} onChange={e => handleUpdateThreshold(t.id, { min: parseInt(e.target.value) || 0 })} className="w-full p-4 bg-white dark:bg-slate-800 rounded-xl border-none font-black text-lg text-slate-900 dark:text-white text-center shadow-inner" />
                    </div>
                    <div className="w-28">
                      <Label>分值上限</Label>
                      <input type="number" value={t.max} onChange={e => handleUpdateThreshold(t.id, { max: parseInt(e.target.value) || 0 })} className="w-full p-4 bg-white dark:bg-slate-800 rounded-xl border-none font-black text-lg text-slate-900 dark:text-white text-center shadow-inner" />
                    </div>
                    <div className="flex-1 min-w-[300px]">
                      <Label>处置随访建议 (Suggestions)</Label>
                      <textarea value={t.suggestion} onChange={e => handleUpdateThreshold(t.id, { suggestion: e.target.value })} className="w-full p-5 bg-white dark:bg-slate-800 rounded-2xl border-none font-bold text-sm text-slate-600 dark:text-slate-400 h-28 resize-none shadow-inner leading-relaxed" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 门户内容 Tab (全量 CMS) */}
        {activeTab === 'cms' && (
          <div className="space-y-12 pb-20 animate-in fade-in">
             <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl space-y-8">
                <h3 className="text-xl font-black text-slate-950 dark:text-white flex items-center gap-3"><Layout size={24} className="text-blue-500" /> 门户首页配置 (Hero & Brand)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="md:col-span-2">
                      <Label>主标题 (支持 \n 换行)</Label>
                      <textarea value={localSiteConfig.heroTitle} onChange={e => setLocalSiteConfig({...localSiteConfig, heroTitle: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl font-black text-2xl h-24 border-none resize-none shadow-inner" />
                   </div>
                   <div className="md:col-span-2">
                      <Label>描述描述文案</Label>
                      <textarea value={localSiteConfig.heroDescription} onChange={e => setLocalSiteConfig({...localSiteConfig, heroDescription: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-slate-500 h-24 border-none resize-none shadow-inner leading-relaxed" />
                   </div>
                   <div><Label>勋章文本</Label><input value={localSiteConfig.heroBadge} onChange={e => setLocalSiteConfig({...localSiteConfig, heroBadge: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl font-black border-none shadow-inner" /></div>
                   <div><Label>主 CTA 按钮</Label><input value={localSiteConfig.ctaText} onChange={e => setLocalSiteConfig({...localSiteConfig, ctaText: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl font-black border-none shadow-inner" /></div>
                </div>
             </div>

             <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl space-y-8">
                <h3 className="text-xl font-black text-slate-950 dark:text-white flex items-center gap-3"><FileText size={24} className="text-indigo-500" /> 业务页面配置 (Input & Summary)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">评估录入页</h4>
                      <Label>页面标题</Label><input value={localSiteConfig.inputPageTitle} onChange={e => setLocalSiteConfig({...localSiteConfig, inputPageTitle: e.target.value})} className="w-full p-4 bg-white dark:bg-slate-700 rounded-xl font-black border-none shadow-sm mb-4" />
                      <Label>副描述描述</Label><textarea value={localSiteConfig.inputPageDesc} onChange={e => setLocalSiteConfig({...localSiteConfig, inputPageDesc: e.target.value})} className="w-full p-4 bg-white dark:bg-slate-700 rounded-xl font-bold text-slate-400 text-xs h-20 border-none resize-none shadow-sm" />
                   </div>
                   <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">分析中心页</h4>
                      <Label>页面标题</Label><input value={localSiteConfig.summaryPageTitle} onChange={e => setLocalSiteConfig({...localSiteConfig, summaryPageTitle: e.target.value})} className="w-full p-4 bg-white dark:bg-slate-700 rounded-xl font-black border-none shadow-sm mb-4" />
                      <Label>副描述描述</Label><textarea value={localSiteConfig.summaryPageDesc} onChange={e => setLocalSiteConfig({...localSiteConfig, summaryPageDesc: e.target.value})} className="w-full p-4 bg-white dark:bg-slate-700 rounded-xl font-bold text-slate-400 text-xs h-20 border-none resize-none shadow-sm" />
                   </div>
                </div>
             </div>

             <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl space-y-8">
                <div className="flex items-center justify-between">
                   <h3 className="text-xl font-black text-slate-950 dark:text-white flex items-center gap-3"><Globe size={24} className="text-emerald-500" /> 特性板块 (Features)</h3>
                   <button onClick={handleCMSAddFeature} className="px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-xs shadow-sm"><Plus size={16} className="inline mr-1"/> 新增特性</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {localSiteConfig.features.map(f => (
                    <div key={f.id} className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[2rem] relative shadow-inner group border border-transparent hover:border-emerald-200 transition-all">
                      <button onClick={() => handleCMSRemoveItem('features', f.id)} className="absolute top-4 right-4 text-rose-500 p-2 hover:bg-rose-50 rounded-xl"><Trash2 size={16}/></button>
                      <div className="space-y-4">
                        <Label>特性标题</Label><input value={f.title} onChange={e => handleCMSUpdateItem<LandingFeature>('features', f.id, { title: e.target.value })} className="w-full p-3 bg-white dark:bg-slate-700 rounded-xl border-none font-black text-xs shadow-sm" />
                        <Label>详细描述</Label><textarea value={f.description} onChange={e => handleCMSUpdateItem<LandingFeature>('features', f.id, { description: e.target.value })} className="w-full p-3 bg-white dark:bg-slate-700 rounded-xl border-none font-bold text-xs text-slate-400 h-24 resize-none shadow-sm" />
                      </div>
                    </div>
                  ))}
                </div>
             </div>

             <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl space-y-8">
                <h3 className="text-xl font-black text-slate-950 dark:text-white flex items-center gap-3"><Smartphone size={24} className="text-rose-500" /> 品牌视觉与页脚</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div><Label>品牌名 (Navbar/Footer)</Label><input value={localSiteConfig.footerBrandName} onChange={e => setLocalSiteConfig({...localSiteConfig, footerBrandName: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl font-black border-none shadow-inner" /></div>
                   <div><Label>版权声明文本</Label><input value={localSiteConfig.footerCopyright} onChange={e => setLocalSiteConfig({...localSiteConfig, footerCopyright: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl font-black border-none shadow-inner" /></div>
                   <div className="md:col-span-2"><Label>页脚愿景描述</Label><textarea value={localSiteConfig.footerDescription} onChange={e => setLocalSiteConfig({...localSiteConfig, footerDescription: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-slate-400 text-xs h-24 border-none resize-none shadow-inner leading-relaxed" /></div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettingsPage;
