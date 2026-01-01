
import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store.tsx';
import { UserRole, ScoringConfig, SiteConfig, RiskThreshold, LandingFeature } from '../types.ts';
import { 
  Users, 
  Trash2, 
  CheckCircle, 
  Save,
  Palette,
  Key,
  PlusCircle,
  Activity,
  Smartphone,
  Layout,
  X,
  UserCheck,
  GraduationCap,
  AlertCircle,
  Hash,
  Database,
  Lock,
  MessageSquare,
  ChevronRight,
  Settings2
} from 'lucide-react';

const AdminSettingsPage: React.FC = () => {
  const { 
    users, 
    currentUser, 
    updateUserRole, 
    updateUserPassword, 
    approveUser,
    deleteUser, 
    config, 
    updateConfig, 
    siteConfig, 
    updateSiteConfig 
  } = useStore();
  
  const [activeTab, setActiveTab] = useState<'users' | 'scoring' | 'thresholds' | 'appearance' | 'security'>('users');
  const [localConfig, setLocalConfig] = useState<ScoringConfig>(config);
  const [localSiteConfig, setLocalSiteConfig] = useState<SiteConfig>(siteConfig);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [newWeightInputs, setNewWeightInputs] = useState<Record<string, { key: string, val: number }>>({});
  const [selfPassword, setSelfPassword] = useState({ current: '', next: '' });
  const [securityMsg, setSecurityMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => { setLocalConfig(config); }, [config]);
  useEffect(() => { setLocalSiteConfig(siteConfig); }, [siteConfig]);

  // --- 权重引擎管理逻辑 ---
  const handleUpdateScore = (category: keyof ScoringConfig, key: string, value: number) => {
    setLocalConfig(prev => ({ 
      ...prev, 
      [category]: { ...(prev[category] as Record<string, number>), [key]: value } 
    }));
  };

  const handleAddNewWeight = (category: keyof ScoringConfig) => {
    const input = newWeightInputs[category];
    if (!input || !input.key.trim()) return;
    setLocalConfig(prev => ({
      ...prev,
      [category]: { ...(prev[category] as Record<string, number>), [input.key.trim()]: input.val }
    }));
    setNewWeightInputs(prev => ({ ...prev, [category]: { key: '', val: 0 } }));
  };

  const handleDeleteWeight = (category: keyof ScoringConfig, key: string) => {
    if (!window.confirm(`确认删除“${key}”？这将立即影响风险评分逻辑。`)) return;
    setLocalConfig(prev => {
      const updated = { ...(prev[category] as Record<string, number>) };
      delete updated[key];
      return { ...prev, [category]: updated };
    });
  };

  // --- 诊断标准管理修复 (解决排序跳动问题) ---
  const sortedThresholds = useMemo(() => {
    return [...localConfig.thresholds].sort((a, b) => a.min - b.min);
  }, [localConfig.thresholds]);

  const updateThreshold = (id: string, updates: Partial<RiskThreshold>) => {
    setLocalConfig(prev => ({
      ...prev,
      thresholds: prev.thresholds.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  };

  const handleSaveAll = () => {
    if (['scoring', 'thresholds'].includes(activeTab)) updateConfig(localConfig);
    if (activeTab === 'appearance') updateSiteConfig(localSiteConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const updateSiteList = <T extends { id: string }>(field: keyof SiteConfig, id: string, subField: string, value: any) => {
    setLocalSiteConfig(prev => ({
      ...prev,
      [field]: (prev[field] as T[]).map(item => item.id === id ? { ...item, [subField]: value } : item)
    }));
  };

  const addSiteListItem = (field: keyof SiteConfig, template: any) => {
    setLocalSiteConfig(prev => ({
      ...prev,
      [field]: [...(prev[field] as any[]), { ...template, id: Date.now().toString() }]
    }));
  };

  const removeSiteListItem = (field: keyof SiteConfig, id: string) => {
    setLocalSiteConfig(prev => ({
      ...prev,
      [field]: (prev[field] as any[]).filter(item => item.id !== id)
    }));
  };

  const handleSelfPasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (selfPassword.current !== currentUser.password) {
      setSecurityMsg({ type: 'error', text: '当前身份校验失败，旧密码不匹配' });
      return;
    }
    updateUserPassword(currentUser.id, selfPassword.next);
    setSelfPassword({ current: '', next: '' });
    setSecurityMsg({ type: 'success', text: '安全通行凭据已更新' });
  };

  const pendingUsers = users.filter(u => !u.approved);

  return (
    <div className="space-y-8 pb-32">
      {/* 顶部标题与全局保存 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-950 dark:text-white tracking-tighter mb-2">{siteConfig.adminPageTitle}</h1>
          <p className="text-slate-600 dark:text-slate-400 font-bold text-lg opacity-80">{siteConfig.adminPageDesc}</p>
        </div>
        <div className="flex items-center gap-4">
          {saveSuccess && (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-sm px-6 py-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-full border border-emerald-200 animate-in fade-in">
              <CheckCircle size={18} /> 配置已同步至本地
            </div>
          )}
          <button onClick={handleSaveAll} className="px-10 py-4 bg-slate-950 dark:bg-emerald-600 text-white rounded-[24px] font-black shadow-2xl hover:bg-black transition-all flex items-center gap-3 active:scale-95">
            <Save size={20} /> 同步更改
          </button>
        </div>
      </div>

      {/* 导航标签卡 */}
      <div className="sticky top-24 z-30 flex overflow-x-auto no-scrollbar py-2">
        <div className="flex gap-2 p-2 bg-slate-200/60 dark:bg-slate-800/60 backdrop-blur-2xl rounded-[30px] border border-white/40 shadow-sm w-fit">
          {[
            { id: 'users', label: '账户审核', icon: Users },
            { id: 'scoring', label: '权重引擎', icon: Settings2 },
            { id: 'thresholds', label: '诊断标准', icon: GraduationCap },
            { id: 'appearance', label: '品牌控制', icon: Palette },
            { id: 'security', label: '安全中心', icon: Lock },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} 
              className={`flex items-center gap-3 px-8 py-4 rounded-[22px] text-[13px] font-black transition-all ${activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-md' : 'text-slate-900 dark:text-slate-400 hover:bg-white/40'}`} 
            > 
              <tab.icon size={18} strokeWidth={2.5} /> {tab.label}
              {tab.id === 'users' && pendingUsers.length > 0 && <span className="ml-1 px-2 py-0.5 bg-rose-600 text-white text-[10px] rounded-full">{pendingUsers.length}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* 1. 账户审核与管理 */}
      {activeTab === 'users' && (
        <div className="space-y-8 animate-in fade-in">
          {pendingUsers.length > 0 && (
            <div className="bg-rose-50 dark:bg-rose-900/10 border-2 border-rose-200 dark:border-rose-900/30 rounded-[40px] p-10 shadow-lg">
              <h3 className="text-2xl font-black text-rose-950 dark:text-rose-400 mb-8 flex items-center gap-4"><Lock size={28} /> 挂起待审核列表</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingUsers.map(user => (
                  <div key={user.id} className="bg-white dark:bg-slate-800 p-8 rounded-[28px] flex items-center justify-between border-2 border-rose-100 dark:border-rose-900/30">
                    <div>
                      <div className="font-black text-slate-950 dark:text-white text-xl">{user.username}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">注册ID: {user.id.slice(-6)}</div>
                    </div>
                    <button onClick={() => approveUser(user.id)} className="p-5 bg-rose-600 text-white rounded-2xl shadow-xl shadow-rose-200 dark:shadow-none hover:scale-105 transition-all"><UserCheck size={24} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="bg-white dark:bg-slate-900 rounded-[40px] p-10 border-2 border-slate-100 dark:border-slate-800 shadow-xl">
             <h3 className="text-2xl font-black mb-10 text-slate-950 dark:text-white flex items-center gap-4"><Users size={28} className="text-blue-600"/> 账户授权名单</h3>
             <div className="space-y-4">
                {users.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl group border-2 border-transparent hover:border-slate-200 transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center font-black text-slate-400 uppercase">{u.username.charAt(0)}</div>
                      <div>
                        <p className="font-black text-slate-950 dark:text-white text-lg">{u.username}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{u.role} · {u.approved ? '正常授权' : '待批准'}</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                       <select value={u.role} onChange={e => updateUserRole(u.id, e.target.value as UserRole)} className="bg-white dark:bg-slate-700 text-slate-950 dark:text-white border-2 border-slate-100 dark:border-slate-600 rounded-xl px-4 py-2 text-xs font-black outline-none">
                         <option value={UserRole.ADMIN}>ADMINISTRATOR</option>
                         <option value={UserRole.USER}>OPERATOR</option>
                       </select>
                       <button onClick={() => deleteUser(u.id)} disabled={u.id === currentUser?.id || u.username === 'qinghoohoo'} className="p-4 text-slate-300 hover:text-rose-500 disabled:opacity-0 transition-all"><Trash2 size={24}/></button>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* 2. 权重引擎控制 */}
      {activeTab === 'scoring' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 animate-in fade-in">
          {(Object.keys(localConfig).filter(k => k !== 'thresholds') as Array<keyof ScoringConfig>).map(cat => (
            <div key={cat} className="bg-white dark:bg-slate-900 rounded-[40px] p-10 border-2 border-slate-100 dark:border-slate-800 shadow-xl space-y-10">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-950 dark:text-white flex items-center gap-4 capitalize">
                  <div className="w-2.5 h-10 bg-slate-950 dark:bg-emerald-500 rounded-full" />
                  {cat === 'history' ? '既往病史权重' : cat === 'exposure' ? '接触史权重' : cat === 'ctFeatures' ? '影像学特征' : cat === 'qft' ? 'QFT实验' : cat === 'smear' ? '痰涂片' : cat === 'culture' ? '细菌培养' : '临床症状权重'}
                </h3>
                <Hash className="text-slate-100 dark:text-slate-800" size={32} />
              </div>
              <div className="space-y-4">
                {Object.entries(localConfig[cat] as Record<string, number>).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl group border-2 border-transparent hover:border-slate-200 transition-all">
                    <div className="flex items-center gap-4">
                      <button onClick={() => handleDeleteWeight(cat, key)} className="p-2 text-slate-300 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                      <span className="font-black text-slate-950 dark:text-white">{key}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Weight Score</span>
                      <input type="number" value={val} onChange={e => handleUpdateScore(cat, key, parseInt(e.target.value) || 0)} className="w-24 p-4 bg-white dark:bg-slate-700 rounded-2xl border-2 border-slate-100 dark:border-slate-600 font-black text-center text-slate-950 dark:text-white outline-none focus:border-slate-950" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-8 border-t border-slate-50 dark:border-slate-800 flex gap-4">
                <input placeholder="新增项目名称..." value={newWeightInputs[cat]?.key || ''} onChange={e => setNewWeightInputs({ ...newWeightInputs, [cat]: { key: e.target.value, val: newWeightInputs[cat]?.val || 0 } })} className="flex-1 p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black text-slate-950 dark:text-white border-none outline-none focus:ring-2 focus:ring-emerald-500" />
                <input type="number" placeholder="值" value={newWeightInputs[cat]?.val ?? ''} onChange={e => setNewWeightInputs({ ...newWeightInputs, [cat]: { key: newWeightInputs[cat]?.key || '', val: parseInt(e.target.value) || 0 } })} className="w-24 p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black text-center text-slate-950 dark:text-white border-none outline-none focus:ring-2 focus:ring-emerald-500" />
                <button onClick={() => handleAddNewWeight(cat)} className="p-5 bg-slate-950 dark:bg-emerald-600 text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl"><PlusCircle size={28} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. 分级标准与专家建议 - 修复版 */}
      {activeTab === 'thresholds' && (
        <div className="space-y-8 animate-in fade-in">
          <div className="grid grid-cols-1 gap-8">
            {sortedThresholds.map(t => (
              <div key={t.id} className="bg-white dark:bg-slate-900 rounded-[40px] p-10 border-2 border-slate-100 dark:border-slate-800 shadow-xl space-y-10 group transition-all">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">风险等级标签</label>
                    <input 
                      value={t.level} 
                      onChange={e => updateThreshold(t.id, { level: e.target.value })}
                      className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl font-black text-slate-950 dark:text-white border-none outline-none focus:ring-2 focus:ring-slate-950" 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">分值区间 (Min)</label>
                    <input 
                      type="number" 
                      value={t.min} 
                      onChange={e => updateThreshold(t.id, { min: parseInt(e.target.value) || 0 })}
                      className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl font-black text-slate-950 dark:text-white border-none focus:ring-2 focus:ring-slate-950" 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">分值区间 (Max)</label>
                    <input 
                      type="number" 
                      value={t.max} 
                      onChange={e => updateThreshold(t.id, { max: parseInt(e.target.value) || 0 })}
                      className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl font-black text-slate-950 dark:text-white border-none focus:ring-2 focus:ring-slate-950" 
                    />
                  </div>
                  <div className="flex items-end justify-end">
                     <button onClick={() => setLocalConfig({...localConfig, thresholds: localConfig.thresholds.filter(i => i.id !== t.id)})} className="p-5 text-slate-200 hover:text-rose-600 transition-all"><Trash2 size={28}/></button>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare size={14} /> 临床专家处置建议
                  </label>
                  <textarea 
                    value={t.suggestion} 
                    onChange={e => updateThreshold(t.id, { suggestion: e.target.value })}
                    className="w-full p-8 bg-slate-50 dark:bg-slate-800 rounded-[32px] font-bold text-slate-950 dark:text-slate-300 h-40 border-none outline-none focus:ring-2 focus:ring-slate-950" 
                    placeholder="请输入针对该风险等级的医学处置建议..."
                  />
                </div>
              </div>
            ))}
            <button onClick={() => setLocalConfig({...localConfig, thresholds: [...localConfig.thresholds, {id: Date.now().toString(), level: '新风险分级', min: 0, max: 0, suggestion: ''}]})} className="w-full py-12 border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[40px] text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-black text-xl flex items-center justify-center gap-4">
              <PlusCircle size={32} /> 定义新的诊断评估层级
            </button>
          </div>
        </div>
      )}

      {/* 4. 品牌与门户 CMS */}
      {activeTab === 'appearance' && (
        <div className="space-y-12 animate-in fade-in pb-20">
          {/* 门户首页文案 */}
          <section className="bg-white dark:bg-slate-900 rounded-[48px] p-12 border-2 border-slate-100 dark:border-slate-800 shadow-xl space-y-12">
            <h3 className="text-2xl font-black text-slate-950 dark:text-white flex items-center gap-4"><Activity size={32} className="text-emerald-600"/> 门户首页 CMS 品牌编辑</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">顶端高亮徽章</label><input value={localSiteConfig.heroBadge} onChange={e => setLocalSiteConfig({...localSiteConfig, heroBadge: e.target.value})} className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl font-black text-slate-950 dark:text-white border-none outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div className="space-y-3"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">行动召唤文字 (CTA)</label><input value={localSiteConfig.ctaText} onChange={e => setLocalSiteConfig({...localSiteConfig, ctaText: e.target.value})} className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl font-black text-slate-950 dark:text-white border-none outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div className="md:col-span-2 space-y-3"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">主标题 (支持换行)</label><textarea value={localSiteConfig.heroTitle} onChange={e => setLocalSiteConfig({...localSiteConfig, heroTitle: e.target.value})} className="w-full p-8 bg-slate-50 dark:bg-slate-800 rounded-[32px] font-black text-slate-950 dark:text-white text-3xl h-40 border-none outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div className="md:col-span-2 space-y-3"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">核心价值描述描述段落</label><textarea value={localSiteConfig.heroDescription} onChange={e => setLocalSiteConfig({...localSiteConfig, heroDescription: e.target.value})} className="w-full p-8 bg-slate-50 dark:bg-slate-800 rounded-[32px] font-bold text-slate-950 dark:text-slate-300 text-lg h-40 border-none outline-none focus:ring-2 focus:ring-emerald-500" /></div>
            </div>
          </section>

          {/* 内部引导文案 */}
          <section className="bg-white dark:bg-slate-900 rounded-[48px] p-12 border-2 border-slate-100 dark:border-slate-800 shadow-xl space-y-12">
            <h3 className="text-2xl font-black text-slate-950 dark:text-white flex items-center gap-4"><Layout size={32} className="text-blue-600"/> 内部业务模块引导编辑</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: '评估录入', title: 'inputPageTitle', desc: 'inputPageDesc' },
                { label: '数据分析', title: 'summaryPageTitle', desc: 'summaryPageDesc' },
                { label: '管理中心', title: 'adminPageTitle', desc: 'adminPageDesc' },
              ].map((p, idx) => (
                <div key={idx} className="p-8 bg-slate-50 dark:bg-slate-800 rounded-[40px] space-y-6">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{p.label}</h4>
                  <input value={(localSiteConfig as any)[p.title]} onChange={e => setLocalSiteConfig({...localSiteConfig, [p.title]: e.target.value})} className="w-full p-4 bg-white dark:bg-slate-700 rounded-2xl font-black text-slate-950 dark:text-white border-none" />
                  <textarea value={(localSiteConfig as any)[p.desc]} onChange={e => setLocalSiteConfig({...localSiteConfig, [p.desc]: e.target.value})} className="w-full p-4 bg-white dark:bg-slate-700 rounded-2xl font-bold text-slate-600 dark:text-slate-400 text-sm h-32 border-none" />
                </div>
              ))}
            </div>
          </section>

          {/* 特性卡片控制 */}
          <section className="bg-white dark:bg-slate-900 rounded-[48px] p-12 border-2 border-slate-100 dark:border-slate-800 shadow-xl space-y-12">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-950 dark:text-white flex items-center gap-4"><Smartphone size={32} className="text-indigo-600"/> 首页核心特性卡片管理</h3>
              <button onClick={() => addSiteListItem('features', { title: '新特性', description: '功能描述内容...', iconName: 'Activity' })} className="px-6 py-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-xl font-black flex items-center gap-2 hover:scale-105 transition-all">
                <PlusCircle size={18} /> 新增展示项
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {localSiteConfig.features.map(f => (
                <div key={f.id} className="p-8 bg-slate-50 dark:bg-slate-800 rounded-[40px] relative group border-2 border-transparent hover:border-slate-200 transition-all">
                  <button onClick={() => removeSiteListItem('features', f.id)} className="absolute -top-3 -right-3 p-2 bg-white dark:bg-slate-700 text-rose-500 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><X size={16}/></button>
                  <div className="space-y-4">
                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">图标 ID (Lucide)</label><input value={f.iconName} onChange={e => updateSiteList<LandingFeature>('features', f.id, 'iconName', e.target.value)} className="w-full p-3 bg-white dark:bg-slate-700 rounded-xl font-black text-slate-950 dark:text-white border-none text-xs" /></div>
                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">标题</label><input value={f.title} onChange={e => updateSiteList<LandingFeature>('features', f.id, 'title', e.target.value)} className="w-full p-3 bg-white dark:bg-slate-700 rounded-xl font-black text-slate-950 dark:text-white border-none" /></div>
                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">描述正文</label><textarea value={f.description} onChange={e => updateSiteList<LandingFeature>('features', f.id, 'description', e.target.value)} className="w-full p-3 bg-white dark:bg-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-400 h-28 border-none text-xs" /></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 页脚版权与联系方式 */}
          <section className="bg-white dark:bg-slate-900 rounded-[48px] p-12 border-2 border-slate-100 dark:border-slate-800 shadow-xl space-y-12">
            <h3 className="text-2xl font-black text-slate-950 dark:text-white flex items-center gap-4"><MessageSquare size={32} className="text-rose-600"/> 页脚品牌与联络控制</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-6">
                 <div className="space-y-2"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">页脚展示全称</label><input value={localSiteConfig.footerBrandName} onChange={e => setLocalSiteConfig({...localSiteConfig, footerBrandName: e.target.value})} className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl font-black text-slate-950 dark:text-white border-none outline-none" /></div>
                 <div className="space-y-2"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">页脚品牌介绍文案</label><textarea value={localSiteConfig.footerDescription} onChange={e => setLocalSiteConfig({...localSiteConfig, footerDescription: e.target.value})} className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl font-bold text-slate-600 dark:text-slate-400 h-24 border-none outline-none" /></div>
               </div>
               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">官方邮箱</label><input value={localSiteConfig.footerContactEmail} onChange={e => setLocalSiteConfig({...localSiteConfig, footerContactEmail: e.target.value})} className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl font-bold text-slate-950 dark:text-white border-none" /></div>
                 <div className="space-y-2"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">服务热线</label><input value={localSiteConfig.footerContactPhone} onChange={e => setLocalSiteConfig({...localSiteConfig, footerContactPhone: e.target.value})} className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl font-bold text-slate-950 dark:text-white border-none" /></div>
                 <div className="space-y-2"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">系统支持标签</label><input value={localSiteConfig.footerSupportLabel} onChange={e => setLocalSiteConfig({...localSiteConfig, footerSupportLabel: e.target.value})} className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl font-bold text-slate-950 dark:text-white border-none" /></div>
                 <div className="space-y-2"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">紧急求助标签</label><input value={localSiteConfig.footerEmergencyLabel} onChange={e => setLocalSiteConfig({...localSiteConfig, footerEmergencyLabel: e.target.value})} className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl font-bold text-slate-950 dark:text-white border-none" /></div>
               </div>
            </div>
          </section>
        </div>
      )}

      {/* 5. 个人通行安全 */}
      {activeTab === 'security' && (
        <div className="max-w-4xl mx-auto animate-in zoom-in-95 duration-500">
          <div className="bg-white dark:bg-slate-900 rounded-[60px] p-16 border-2 border-slate-100 dark:border-slate-800 shadow-2xl space-y-12">
            <div className="flex items-center gap-8">
              <div className="p-6 bg-slate-950 dark:bg-emerald-600 text-white rounded-3xl shadow-2xl shadow-emerald-200"><Key size={40} /></div>
              <div>
                <h3 className="text-3xl font-black text-slate-950 dark:text-white">个人安全中心</h3>
                <p className="font-bold text-slate-400 mt-2">定期更新您的通行凭据，以确保临床数据的最高等级安全性。</p>
              </div>
            </div>
            <form onSubmit={handleSelfPasswordChange} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-950 dark:text-slate-500 uppercase tracking-widest ml-2">验证当前旧密码</label>
                <input type="password" required value={selfPassword.current} onChange={e => setSelfPassword({...selfPassword, current: e.target.value})} className="w-full p-8 bg-slate-50 dark:bg-slate-800 rounded-3xl font-black text-slate-950 dark:text-white border-none focus:ring-2 focus:ring-slate-950 outline-none transition-all" placeholder="Current Security Password" />
              </div>
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-950 dark:text-slate-500 uppercase tracking-widest ml-2">设定全新安全密码</label>
                <input type="password" required value={selfPassword.next} onChange={e => setSelfPassword({...selfPassword, next: e.target.value})} className="w-full p-8 bg-slate-50 dark:bg-slate-800 rounded-3xl font-black text-slate-950 dark:text-white border-none focus:ring-2 focus:ring-slate-950 outline-none transition-all" placeholder="New Strong Password" />
              </div>
              {securityMsg && (
                <div className={`p-8 rounded-[32px] font-black flex items-center gap-4 ${securityMsg.type === 'error' ? 'bg-rose-50 text-rose-950 border border-rose-100' : 'bg-emerald-50 text-emerald-950 border border-emerald-100'}`}>
                  <AlertCircle size={24} /> {securityMsg.text}
                </div>
              )}
              <button type="submit" className="w-full py-8 bg-slate-950 dark:bg-emerald-600 text-white rounded-[32px] font-black text-2xl shadow-2xl hover:scale-[1.01] active:scale-95 transition-all">
                授权执行更新指令
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettingsPage;
