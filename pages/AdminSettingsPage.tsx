
import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store.tsx';
import { UserRole, ScoringConfig, SiteConfig, RiskThreshold, LandingFeature, FooterSupportItem } from '../types.ts';
import { 
  Users, 
  Trash2, 
  CheckCircle, 
  Save,
  Key,
  Activity,
  GraduationCap,
  Lock,
  Settings2,
  Monitor,
  ShieldCheck,
  UserCheck,
  UserX,
  ShieldAlert,
  Plus
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

  const pendingUsers = useMemo(() => (users || []).filter(u => u && !u.approved && u.username !== 'qinghoohoo'), [users]);
  const approvedUsers = useMemo(() => (users || []).filter(u => u && u.approved), [users]);

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
        <h2 className="text-3xl font-black text-slate-900 dark:text-white">权限受限</h2>
        <p className="text-slate-500 mt-2 font-bold text-lg">当前区域仅限超级管理员 qinghoohoo 访问。</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-700 text-slate-950 dark:text-white">
      {/* 顶部状态栏 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter mb-1 text-slate-950 dark:text-white">系统策略控制中心</h1>
          <p className="font-black text-lg flex items-center gap-2 opacity-70 text-slate-600 dark:text-slate-400">
            <Lock size={18} className="text-emerald-500" /> Root 级权限已挂载：{currentUser?.username}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {saveSuccess && (
            <div className="flex items-center gap-2 text-emerald-800 font-black text-sm px-6 py-3 bg-emerald-50 rounded-full border border-emerald-200 animate-in slide-in-from-right-4">
              <CheckCircle size={18} /> 线上配置已实时原子化同步
            </div>
          )}
          <button onClick={handleSaveAll} className="px-10 py-4 bg-slate-950 dark:bg-emerald-600 text-white rounded-[24px] font-black shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
            <Save size={20} /> 同步云端数据库
          </button>
        </div>
      </div>

      {/* 侧边导航选项 */}
      <div className="sticky top-24 z-30 flex overflow-x-auto no-scrollbar py-2">
        <div className="flex gap-2 p-2 bg-slate-200/50 dark:bg-slate-800/60 backdrop-blur-2xl rounded-[30px] border border-white/40 shadow-sm w-fit">
          {[
            { id: 'approvals', label: '待审批', icon: ShieldAlert, badge: pendingUsers.length },
            { id: 'users', label: '账户管理', icon: Users },
            { id: 'scoring', label: '评分权重', icon: Settings2 },
            { id: 'thresholds', label: '分层标准', icon: GraduationCap },
            { id: 'cms', label: '门户配置', icon: Monitor },
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
        {/* 账户管理列表 - 强制修复字体颜色 */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-slate-900 rounded-[48px] p-12 border-2 border-slate-100 dark:border-slate-800 shadow-xl animate-in fade-in">
             <h3 className="text-2xl font-black text-slate-950 dark:text-white flex items-center gap-4 mb-10"><Users size={32} className="text-indigo-600"/> 授权账户全量视图 ({approvedUsers.length})</h3>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
                         <th className="pb-6 px-4">用户名标识</th>
                         <th className="pb-6 px-4">核心角色</th>
                         <th className="pb-6 px-4 text-right">行政权限操作</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {approvedUsers.map(u => (
                        <tr key={u.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                           <td className="py-6 px-4 font-black text-slate-950 dark:text-white">
                             {u.username} 
                             <span className="text-[10px] opacity-30 font-normal ml-2 tracking-tighter italic">#{u.id.slice(-6)}</span>
                           </td>
                           <td className="py-6 px-4">
                             <select 
                               value={u.role} 
                               onChange={e => updateUserRole(u.id, e.target.value as UserRole)} 
                               className="bg-transparent font-bold text-indigo-500 border-none outline-none cursor-pointer focus:ring-0"
                             >
                                <option value={UserRole.USER}>临床操作员 (USER)</option>
                                <option value={UserRole.ADMIN}>核心管理员 (ADMIN)</option>
                             </select>
                           </td>
                           <td className="py-6 px-4 text-right">
                              {u.username !== 'qinghoohoo' && (
                                <button 
                                  onClick={() => deleteUser(u.id)} 
                                  className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                                >
                                  <Trash2 size={20}/>
                                </button>
                              )}
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {/* 评分权重编辑 */}
        {activeTab === 'scoring' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 animate-in fade-in pb-32 text-slate-950 dark:text-white">
            {(Object.keys(localConfig).filter(k => k !== 'thresholds') as Array<keyof ScoringConfig>).map(cat => (
              <div key={cat} className="bg-white dark:bg-slate-900 rounded-[48px] p-12 border-2 border-slate-100 dark:border-slate-800 shadow-xl space-y-8">
                <h3 className="text-2xl font-black text-slate-950 dark:text-white flex items-center gap-4 capitalize">
                  <div className="w-3 h-10 bg-emerald-500 rounded-full" />
                  {cat === 'history' ? '既往史权重' : cat === 'symptoms' ? '症状权重' : cat === 'ctFeatures' ? '影像特征' : cat === 'exposure' ? '接触风险' : cat.toUpperCase()}
                </h3>
                <div className="space-y-3">
                  {Object.entries(localConfig[cat] as Record<string, number>).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800 rounded-[24px] border-2 border-transparent hover:border-slate-200 group transition-all">
                      <div className="flex items-center gap-4 overflow-hidden">
                        <button onClick={() => handleRemoveScoreItem(cat, key)} className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"><Trash2 size={18}/></button>
                        <span className="text-lg font-black truncate text-slate-950 dark:text-slate-100">{key}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">Score:</span>
                        <input type="number" value={val} onChange={e => handleUpdateScore(cat, key, parseInt(e.target.value) || 0)} className="w-20 p-3 bg-white dark:bg-slate-700 rounded-xl border-none text-center font-black text-xl text-slate-900 dark:text-white" />
                      </div>
                    </div>
                  ))}
                  <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                    <input value={newItemNames[cat] || ''} onChange={e => setNewItemNames({...newItemNames, [cat]: e.target.value})} placeholder={`新增观测指标...`} className="flex-1 px-5 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl border-none font-bold text-slate-950 dark:text-white outline-none" />
                    <button onClick={() => handleAddScoreItem(cat)} className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg hover:scale-105 transition-all"><Plus size={24} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 待审批用户列表 */}
        {activeTab === 'approvals' && (
          <div className="bg-white dark:bg-slate-900 rounded-[48px] p-12 border-2 border-slate-100 dark:border-slate-800 shadow-xl animate-in fade-in">
             <h3 className="text-2xl font-black text-slate-950 dark:text-white flex items-center gap-4 mb-10"><ShieldCheck size={32} className="text-amber-500"/> 待授权准入申请 ({pendingUsers.length})</h3>
             {pendingUsers.length === 0 ? (
               <div className="py-20 text-center space-y-4 text-slate-400">
                  <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto"><CheckCircle className="text-emerald-500" size={40} /></div>
                  <p className="font-bold">当前无积压申请</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pendingUsers.map(u => (
                    <div key={u.id} className="p-8 bg-slate-50 dark:bg-slate-800 rounded-[32px] flex items-center justify-between border-2 border-transparent hover:border-amber-200 transition-all group">
                       <div className="text-slate-950 dark:text-white">
                          <div className="text-xl font-black">{u.username}</div>
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
      </div>
    </div>
  );
};

export default AdminSettingsPage;
