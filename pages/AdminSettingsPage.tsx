
import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store.tsx';
import { UserRole, ScoringConfig, SiteConfig, RiskThreshold, LandingFeature, AboutItem, FooterSupportItem } from '../types.ts';
import { 
  Users, 
  Trash2, 
  CheckCircle, 
  Save,
  Key,
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
  Phone,
  RefreshCcw,
  Type,
  FileText
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
  
  const [activeTab, setActiveTab] = useState<'approvals' | 'users' | 'scoring' | 'thresholds' | 'cms'>('approvals');
  const [localConfig, setLocalConfig] = useState<ScoringConfig>(config);
  const [localSiteConfig, setLocalSiteConfig] = useState<SiteConfig>(siteConfig);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newItemNames, setNewItemNames] = useState<Record<string, string>>({});

  // 密码修改状态
  const [editingPwdId, setEditingPwdId] = useState<string | null>(null);
  const [newPwdValue, setNewPwdValue] = useState('');

  useEffect(() => { setLocalConfig(config); }, [config]);
  useEffect(() => { setLocalSiteConfig(siteConfig); }, [siteConfig]);

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
    if (cat === 'thresholds') return;
    const name = newItemNames[cat];
    if (!name || name.trim() === '') return;
    setLocalConfig(prev => ({
      ...prev,
      [cat]: { ...(prev[cat] as Record<string, number>), [name.trim()]: 0 }
    }));
    setNewItemNames(prev => ({ ...prev, [cat]: '' }));
  };

  const handleRemoveScoreItem = (cat: keyof ScoringConfig, key: string) => {
    if (cat === 'thresholds') return;
    if(!confirm(`确定移除观测项：“${key}”？`)) return;
    const nextCat = { ...(localConfig[cat] as Record<string, number>) };
    delete nextCat[key];
    setLocalConfig(prev => ({ ...prev, [cat]: nextCat }));
  };

  const handleAddThreshold = () => {
    const newT: RiskThreshold = {
      id: `t${Date.now()}`,
      level: '待定义分层',
      min: 0,
      max: 10,
      suggestion: '请在此输入建议内容...'
    };
    setLocalConfig(prev => ({ ...prev, thresholds: [...prev.thresholds, newT] }));
  };

  const handleRemoveThreshold = (id: string) => {
    if(!confirm('确定移除此分层标准吗？')) return;
    setLocalConfig(prev => ({ ...prev, thresholds: prev.thresholds.filter(t => t.id !== id) }));
  };

  const handleUpdateThreshold = (id: string, updates: Partial<RiskThreshold>) => {
    setLocalConfig(prev => ({
      ...prev,
      thresholds: prev.thresholds.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  };

  // CMS Helpers
  const handleCMSListUpdate = <T extends { id: string }>(key: keyof SiteConfig, id: string, updates: Partial<T>) => {
    setLocalSiteConfig(prev => ({
      ...prev,
      [key]: (prev[key] as T[]).map(item => item.id === id ? { ...item, ...updates } : item)
    }));
  };

  const handleCMSAdd = (key: keyof SiteConfig, newItem: any) => {
    setLocalSiteConfig(prev => ({ ...prev, [key]: [...(prev[key] as any[]), newItem] }));
  };

  const handleCMSRemove = (key: keyof SiteConfig, id: string) => {
    setLocalSiteConfig(prev => ({ ...prev, [key]: (prev[key] as any[]).filter(it => it.id !== id) }));
  };

  const handleUpdatePassword = async (id: string) => {
    if (!newPwdValue) return alert('密码不能为空');
    await updateUserPassword(id, newPwdValue);
    setEditingPwdId(null);
    setNewPwdValue('');
    alert('密码重置成功');
  };

  const handleSaveAll = async () => {
    await updateConfig(localConfig);
    await updateSiteConfig(localSiteConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  if (currentUser?.username !== 'qinghoohoo') {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-center">
        <ShieldAlert className="text-rose-500 mb-6" size={80} />
        <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Access Forbidden</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-bold">请使用超级管理员权限 qinghoohoo 访问控制台。</p>
      </div>
    );
  }

  const InputLabel = ({ label }: { label: string }) => (
    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">{label}</label>
  );

  return (
    <div className="space-y-10 pb-40 animate-in fade-in duration-700">
      {/* 状态看板 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-[1000] tracking-tighter mb-2 text-slate-950 dark:text-white uppercase">Policy Control Center</h1>
          <p className="font-bold text-sm flex items-center gap-2 text-slate-500">
            <Lock size={16} className="text-emerald-500" /> Root Authentication: {currentUser?.username}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {saveSuccess && (
            <div className="flex items-center gap-2 text-emerald-700 font-black text-[11px] px-6 py-4 bg-emerald-50 rounded-2xl border border-emerald-100 animate-in slide-in-from-right-4">
              <CheckCircle size={14} /> 数据库全网同步完成
            </div>
          )}
          <button onClick={handleSaveAll} className="px-12 py-5 bg-slate-950 dark:bg-emerald-600 text-white rounded-[20px] font-black text-sm shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
            <Save size={18} /> 推送到云端并生效
          </button>
        </div>
      </div>

      {/* 导航标签 */}
      <div className="sticky top-24 z-30 flex overflow-x-auto no-scrollbar py-2">
        <div className="flex gap-2 p-1.5 bg-white/80 dark:bg-slate-800/60 backdrop-blur-2xl rounded-[2.2rem] border border-slate-200 dark:border-slate-800 shadow-sm w-fit">
          {[
            { id: 'approvals', label: '待审批', icon: ShieldAlert, badge: pendingUsers.length },
            { id: 'users', label: '账户维护', icon: Users },
            { id: 'scoring', label: '算法权重', icon: Settings2 },
            { id: 'thresholds', label: '诊断标准', icon: GraduationCap },
            { id: 'cms', label: '门户灵活配置', icon: Monitor },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} 
              className={`flex items-center gap-2.5 px-6 py-4 rounded-[1.6rem] text-[12px] font-black transition-all relative whitespace-nowrap ${activeTab === tab.id ? 'bg-slate-950 text-white dark:bg-emerald-600 shadow-xl' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`} 
            > 
              <tab.icon size={16} strokeWidth={3} /> 
              {tab.label}
              {tab.badge ? <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white text-[9px] flex items-center justify-center rounded-full border-2 border-white">{tab.badge}</span> : null}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-12">
        
        {/* 1. 待审批 */}
        {activeTab === 'approvals' && (
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl animate-in fade-in">
             <h3 className="text-xl font-black text-slate-950 dark:text-white flex items-center gap-3 mb-8"><ShieldCheck size={28} className="text-amber-500"/> 待准入申请审计</h3>
             {pendingUsers.length === 0 ? (
               <div className="py-20 text-center space-y-4 text-slate-300">
                  <CheckCircle className="mx-auto" size={40} />
                  <p className="font-bold text-sm italic">暂无待处理申请</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingUsers.map(u => (
                    <div key={u.id} className="p-8 bg-slate-50 dark:bg-slate-800/40 rounded-[2.5rem] flex items-center justify-between border border-transparent hover:border-amber-200 transition-all">
                       <div>
                          <div className="text-xl font-black text-slate-950 dark:text-white">{u.username}</div>
                          <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">UID: {u.id.slice(-8)}</div>
                       </div>
                       <div className="flex items-center gap-3">
                          <button onClick={() => approveUser(u.id)} className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 apple-transition"><UserCheck size={20} /></button>
                          <button onClick={() => deleteUser(u.id)} className="w-12 h-12 bg-white dark:bg-slate-700 text-rose-600 rounded-2xl flex items-center justify-center shadow-sm hover:bg-rose-50 apple-transition"><UserX size={20} /></button>
                       </div>
                    </div>
                  ))}
               </div>
             )}
          </div>
        )}

        {/* 2. 账户管理 - 新增重置密码 */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl animate-in fade-in">
             <h3 className="text-xl font-black text-slate-950 dark:text-white flex items-center gap-3 mb-8"><Users size={28} className="text-indigo-600"/> 已授权临床协作账户</h3>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
                         <th className="pb-6 px-4">标识名称</th>
                         <th className="pb-6 px-4">权限角色</th>
                         <th className="pb-6 px-4">重置密码</th>
                         <th className="pb-6 px-4 text-right">行政管理</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {approvedUsers.map(u => (
                        <tr key={u.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                           <td className="py-6 px-4">
                             <div className="font-black text-slate-900 dark:text-white">{u.username}</div>
                             <div className="text-[9px] text-slate-400 uppercase tracking-tighter">Verified Agent</div>
                           </td>
                           <td className="py-6 px-4">
                             <select value={u.role} onChange={e => updateUserRole(u.id, e.target.value as UserRole)} className="bg-transparent font-black text-indigo-500 text-xs border-none outline-none focus:ring-0">
                                <option value={UserRole.USER}>临床操作员 (USER)</option>
                                <option value={UserRole.ADMIN}>核心管理员 (ADMIN)</option>
                             </select>
                           </td>
                           <td className="py-6 px-4">
                             {editingPwdId === u.id ? (
                               <div className="flex items-center gap-2">
                                 <input autoFocus value={newPwdValue} onChange={e => setNewPwdValue(e.target.value)} placeholder="新密码" className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-black outline-none" />
                                 <button onClick={() => handleUpdatePassword(u.id)} className="p-2 bg-emerald-600 text-white rounded-lg"><CheckCircle size={14}/></button>
                                 <button onClick={() => setEditingPwdId(null)} className="p-2 bg-slate-200 text-slate-500 rounded-lg"><UserX size={14}/></button>
                               </div>
                             ) : (
                               <button onClick={() => setEditingPwdId(u.id)} className="flex items-center gap-1 text-[10px] font-black text-slate-400 hover:text-indigo-600 apple-transition">
                                 <RefreshCcw size={12}/> 修改密码
                               </button>
                             )}
                           </td>
                           <td className="py-6 px-4 text-right">
                              {u.username !== 'qinghoohoo' && (
                                <button onClick={() => deleteUser(u.id)} className="p-2 text-slate-300 hover:text-rose-500 apple-transition"><Trash2 size={18}/></button>
                              )}
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {/* 3. 诊断分层 - 支持增删 */}
        {activeTab === 'thresholds' && (
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl animate-in fade-in space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-950 dark:text-white flex items-center gap-3">
                <GraduationCap size={24} className="text-emerald-500" /> 医学风险分层模型维护
              </h3>
              <button onClick={handleAddThreshold} className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-[11px] hover:bg-emerald-100 apple-transition">
                <Plus size={16} /> 新增分层标准
              </button>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {localConfig.thresholds.map((t) => (
                <div key={t.id} className="p-8 bg-slate-50 dark:bg-slate-800/40 rounded-[2.5rem] border border-transparent hover:border-emerald-100 transition-all space-y-6 relative group">
                  <button onClick={() => handleRemoveThreshold(t.id)} className="absolute top-6 right-6 p-3 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={20} />
                  </button>
                  <div className="flex flex-wrap items-center gap-8 pr-12">
                    <div className="flex-1 min-w-[240px]">
                      <InputLabel label="分层等级名称" />
                      <input value={t.level} onChange={e => handleUpdateThreshold(t.id, { level: e.target.value })} className="w-full p-4 bg-white dark:bg-slate-800 rounded-xl border-none font-black text-lg text-slate-900 dark:text-white" />
                    </div>
                    <div className="w-28">
                      <InputLabel label="分值下限 (Min)" />
                      <input type="number" value={t.min} onChange={e => handleUpdateThreshold(t.id, { min: parseInt(e.target.value) })} className="w-full p-4 bg-white dark:bg-slate-800 rounded-xl border-none font-black text-lg text-slate-900 dark:text-white text-center" />
                    </div>
                    <div className="w-28">
                      <InputLabel label="分值上限 (Max)" />
                      <input type="number" value={t.max} onChange={e => handleUpdateThreshold(t.id, { max: parseInt(e.target.value) })} className="w-full p-4 bg-white dark:bg-slate-800 rounded-xl border-none font-black text-lg text-slate-900 dark:text-white text-center" />
                    </div>
                  </div>
                  <div>
                    <InputLabel label="临床指南处置建议" />
                    <textarea value={t.suggestion} onChange={e => handleUpdateThreshold(t.id, { suggestion: e.target.value })} className="w-full p-5 bg-white dark:bg-slate-800 rounded-2xl border-none font-bold text-sm text-slate-600 dark:text-slate-400 h-28 resize-none shadow-sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. 门户配置 (全动态) */}
        {activeTab === 'cms' && (
          <div className="space-y-10 animate-in fade-in">
            {/* 基础文案 */}
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl space-y-8">
              <h3 className="text-xl font-black text-slate-950 dark:text-white flex items-center gap-3"><Layout size={24} className="text-blue-500" /> 门户 Hero 板块配置</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <InputLabel label="勋章文本 (Badge)" />
                  <input value={localSiteConfig.heroBadge} onChange={e => setLocalSiteConfig({...localSiteConfig, heroBadge: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-none font-black text-slate-900 dark:text-white" />
                </div>
                <div>
                  <InputLabel label="CTA 录入按钮" />
                  <input value={localSiteConfig.ctaText} onChange={e => setLocalSiteConfig({...localSiteConfig, ctaText: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-none font-black text-slate-900 dark:text-white" />
                </div>
                <div className="md:col-span-2">
                  <InputLabel label="主标题 (支持 \n 换行)" />
                  <textarea value={localSiteConfig.heroTitle} onChange={e => setLocalSiteConfig({...localSiteConfig, heroTitle: e.target.value})} className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl text-2xl h-32 border-none font-[1000] text-slate-900 dark:text-white resize-none" />
                </div>
                <div className="md:col-span-2">
                  <InputLabel label="Hero 图片 URL (Unsplash/直连)" />
                  <input value={localSiteConfig.heroImageUrl} onChange={e => setLocalSiteConfig({...localSiteConfig, heroImageUrl: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-none font-bold text-xs text-blue-500" />
                </div>
              </div>
            </div>

            {/* 页面标题灵活配置 */}
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl space-y-8">
              <h3 className="text-xl font-black text-slate-950 dark:text-white flex items-center gap-3"><Type size={24} className="text-emerald-500" /> 工作台各页面标题</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl space-y-4">
                  <InputLabel label="录入页标题" />
                  <input value={localSiteConfig.inputPageTitle} onChange={e => setLocalSiteConfig({...localSiteConfig, inputPageTitle: e.target.value})} className="w-full p-3 rounded-lg border-none font-black text-sm" />
                  <InputLabel label="录入页副标题" />
                  <input value={localSiteConfig.inputPageDesc} onChange={e => setLocalSiteConfig({...localSiteConfig, inputPageDesc: e.target.value})} className="w-full p-3 rounded-lg border-none font-bold text-xs text-slate-400" />
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl space-y-4">
                  <InputLabel label="分析页标题" />
                  <input value={localSiteConfig.summaryPageTitle} onChange={e => setLocalSiteConfig({...localSiteConfig, summaryPageTitle: e.target.value})} className="w-full p-3 rounded-lg border-none font-black text-sm" />
                  <InputLabel label="分析页副标题" />
                  <input value={localSiteConfig.summaryPageDesc} onChange={e => setLocalSiteConfig({...localSiteConfig, summaryPageDesc: e.target.value})} className="w-full p-3 rounded-lg border-none font-bold text-xs text-slate-400" />
                </div>
              </div>
            </div>

            {/* 页脚全量配置 */}
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl space-y-8">
              <h3 className="text-xl font-black text-slate-950 dark:text-white flex items-center gap-3"><Phone size={24} className="text-rose-500" /> 页脚支持与品牌信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <InputLabel label="品牌显示名称" />
                  <input value={localSiteConfig.footerBrandName} onChange={e => setLocalSiteConfig({...localSiteConfig, footerBrandName: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-none font-black text-slate-900 dark:text-white" />
                </div>
                <div>
                  <InputLabel label="ICP 备案号" />
                  <input value={localSiteConfig.footerIcp} onChange={e => setLocalSiteConfig({...localSiteConfig, footerIcp: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-none font-black text-slate-900 dark:text-white" />
                </div>
                <div className="md:col-span-2">
                  <InputLabel label="页脚品牌简述" />
                  <textarea value={localSiteConfig.footerDescription} onChange={e => setLocalSiteConfig({...localSiteConfig, footerDescription: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-none font-bold text-slate-400 text-sm h-24 resize-none" />
                </div>
              </div>
              
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-6">
                  <InputLabel label="联系方式条目 (动态增删)" />
                  <button onClick={() => handleCMSAdd('footerSupportItems', { id: `s${Date.now()}`, label: '新项', value: 'value' })} className="p-2 bg-rose-50 text-rose-600 rounded-xl"><Plus size={18}/></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {localSiteConfig.footerSupportItems.map(s => (
                    <div key={s.id} className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl relative group">
                      <button onClick={() => handleCMSRemove('footerSupportItems', s.id)} className="absolute -top-2 -right-2 bg-rose-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"><Trash2 size={12}/></button>
                      <input value={s.label} onChange={e => handleCMSListUpdate<FooterSupportItem>('footerSupportItems', s.id, { label: e.target.value })} className="w-1/3 bg-white dark:bg-slate-700 p-2 rounded-lg text-[10px] font-black" />
                      <input value={s.value} onChange={e => handleCMSListUpdate<FooterSupportItem>('footerSupportItems', s.id, { value: e.target.value })} className="flex-1 bg-white dark:bg-slate-700 p-2 rounded-lg text-[10px] font-bold text-slate-500" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. 算法权重 */}
        {activeTab === 'scoring' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 text-slate-950 dark:text-white pb-20">
            {(Object.keys(localConfig).filter(k => k !== 'thresholds') as Array<keyof ScoringConfig>).map(cat => (
              <div key={cat} className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl space-y-8">
                <h3 className="text-lg font-black text-slate-950 dark:text-white flex items-center gap-3 capitalize tracking-tight">
                  <div className="w-3 h-10 bg-emerald-500 rounded-xl" />
                  {cat === 'history' ? '既往史权重' : cat === 'symptoms' ? '症状权重' : cat === 'ctFeatures' ? '影像学特征' : cat === 'exposure' ? '暴露风险' : cat.toUpperCase()}
                </h3>
                <div className="space-y-3">
                  {Object.entries(localConfig[cat] as Record<string, number>).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] border border-transparent hover:border-slate-200 group transition-all">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <button onClick={() => handleRemoveScoreItem(cat, key)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                        <span className="text-sm font-black truncate text-slate-900 dark:text-slate-100">{key}</span>
                      </div>
                      <input type="number" value={val} onChange={e => handleUpdateScore(cat, key, parseInt(e.target.value) || 0)} className="w-20 p-3 bg-white dark:bg-slate-700 rounded-xl border-none text-center font-black text-lg text-slate-950 dark:text-white shadow-inner" />
                    </div>
                  ))}
                  <div className="mt-6 flex gap-3">
                    <input value={newItemNames[cat] || ''} onChange={e => setNewItemNames({...newItemNames, [cat]: e.target.value})} placeholder={`新增指标名...`} className="flex-1 px-5 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border-none font-bold text-xs text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                    <button onClick={() => handleAddScoreItem(cat)} className="p-3.5 bg-emerald-600 text-white rounded-xl shadow-lg hover:scale-105 transition-all"><Plus size={20} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const InputLabel = ({ label }: { label: string }) => (
  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5 ml-1">{label}</label>
);

export default AdminSettingsPage;
