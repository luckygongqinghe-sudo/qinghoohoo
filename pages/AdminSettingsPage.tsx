
import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store.tsx';
import { UserRole, ScoringConfig, SiteConfig, RiskThreshold, FewShotExample } from '../types.ts';
import { 
  Users, 
  Trash2, 
  CheckCircle, 
  Save,
  Settings2,
  UserX,
  Plus,
  RefreshCw,
  Shield,
  Sliders,
  Layout,
  Trash,
  Globe,
  Palette,
  BrainCircuit,
  MessageSquareQuote,
  ShieldCheck,
  UserCircle
} from 'lucide-react';

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-[10px] font-black text-slate-950 uppercase tracking-widest mb-2 ml-1">{children}</label>
);

const AdminSettingsPage: React.FC = () => {
  const { 
    users, 
    currentUser, 
    approveUser,
    deleteUser,
    toggleUserStatus,
    updateUserRole,
    config, 
    siteConfig, 
    updateGlobalConfig 
  } = useStore();
  
  const [activeTab, setActiveTab] = useState<'team' | 'scoring' | 'thresholds' | 'cms' | 'ai'>('team');
  
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

  const handleUpdateScore = (cat: keyof ScoringConfig, key: string, val: number) => {
    if (cat === 'thresholds' || cat === 'fewShotExamples') return;
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

  const handleUpdateThreshold = (id: string, updates: Partial<RiskThreshold>) => {
    setLocalConfig(prev => ({
      ...prev,
      thresholds: prev.thresholds.map(th => th.id === id ? { ...th, ...updates } : th)
    }));
  };

  const handleAddThreshold = () => {
    const newTh: RiskThreshold = { id: `th-${Date.now()}`, level: '新风险分层', min: 0, max: 0, suggestion: '请录入建议文案' };
    setLocalConfig(prev => ({ ...prev, thresholds: [...prev.thresholds, newTh] }));
  };

  const handleRemoveThreshold = (id: string) => {
    if (!window.confirm("确定删除此策略？")) return;
    setLocalConfig(prev => ({ ...prev, thresholds: prev.thresholds.filter(t => t.id !== id) }));
  };

  const handleAddFewShot = () => {
    const newEx: FewShotExample = { id: `ex-${Date.now()}`, scenario: '录入矛盾场景...', reasoning: '录入推导逻辑...', fusionScore: 0 };
    setLocalConfig(prev => ({ ...prev, fewShotExamples: [...(prev.fewShotExamples || []), newEx] }));
  };

  const handleUpdateFewShot = (id: string, updates: Partial<FewShotExample>) => {
    setLocalConfig(prev => ({
      ...prev,
      fewShotExamples: prev.fewShotExamples?.map(ex => ex.id === id ? { ...ex, ...updates } : ex)
    }));
  };

  const handleRemoveFewShot = (id: string) => {
    setLocalConfig(prev => ({ ...prev, fewShotExamples: prev.fewShotExamples?.filter(ex => ex.id !== id) }));
  };

  const handleSaveAll = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await updateGlobalConfig(localConfig, localSiteConfig);
      setIsInitialized(false);
      alert("全网配置同步成功！");
    } catch (err) {
      alert(`同步失败: ${err}`);
    } finally {
      setIsSyncing(false);
    }
  };

  if (currentUser?.username !== 'qinghoohoo') {
    return <div className="py-40 text-center font-black text-slate-950 uppercase tracking-widest">非超管禁止访问管理中心</div>;
  }

  return (
    <div className="space-y-10 pb-40 animate-in slide-in-from-bottom-6 duration-700 text-slate-950">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center text-white"><Shield size={32} /></div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase text-slate-950">管理中心控制台</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">System Global Configuration</p>
          </div>
        </div>
        <button onClick={handleSaveAll} disabled={isSyncing || !hasChanges}
          className={`px-10 py-5 rounded-full font-black text-xs shadow-2xl transition-all flex items-center gap-3 uppercase tracking-widest active:scale-95 ${hasChanges ? 'bg-slate-950 text-white shadow-xl shadow-slate-950/20' : 'bg-slate-100 text-slate-400'}`}>
          {isSyncing ? <RefreshCw className="animate-spin text-white" size={16} /> : <Save size={16} />}
          同步配置至全网
        </button>
      </div>

      <div className="flex overflow-x-auto no-scrollbar py-2">
        <div className="flex gap-2 p-1.5 bg-white/80 backdrop-blur-3xl rounded-full border border-slate-100 shadow-xl w-fit">
          {[
            { id: 'team', label: '团队审核', icon: Users },
            { id: 'scoring', label: '权重配置', icon: Settings2 },
            { id: 'thresholds', label: '风险逻辑', icon: Sliders },
            { id: 'ai', label: 'AI微调', icon: BrainCircuit },
            { id: 'cms', label: '内容管理', icon: Layout },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} 
              className={`flex items-center gap-2.5 px-6 py-4 rounded-full text-[11px] font-black transition-all uppercase tracking-widest ${activeTab === tab.id ? 'bg-slate-950 text-white shadow-lg' : 'text-slate-950 hover:bg-slate-100'}`}> 
              <tab.icon size={14} className={activeTab === tab.id ? 'text-white' : 'text-slate-950'} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'team' && (
        <div className="space-y-8 text-slate-950">
          <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl">
            <h3 className="text-xl font-black mb-8 text-slate-950 uppercase tracking-tighter">待准入申请审核</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-2xl">
                   <div className="font-black text-slate-950">{u.username}</div>
                   <div className="flex gap-2">
                     <button onClick={() => approveUser(u.id)} className="p-2 bg-slate-950 text-white rounded-lg transition-all active:scale-90 shadow-md"><CheckCircle size={18}/></button>
                     <button onClick={() => deleteUser(u.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><UserX size={18}/></button>
                   </div>
                </div>
              ))}
              {pendingUsers.length === 0 && <div className="col-span-2 text-center py-10 text-slate-400 font-bold uppercase tracking-widest text-xs">当前无待处理医师申请</div>}
            </div>
          </div>
          
          <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl">
            <h3 className="text-xl font-black mb-8 text-slate-950 uppercase tracking-tighter">活跃医师团队与账号权限</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {activeUsers.map(u => (
                <div key={u.id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col justify-between group transition-all hover:border-slate-950/10 hover:shadow-lg">
                   <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center font-black text-slate-900 border border-slate-100 uppercase">
                          {u.username.charAt(0)}
                        </div>
                        <div>
                          <div className="font-black text-slate-950 text-lg">{u.username}</div>
                          <div className="text-[10px] font-black text-slate-400 mt-0.5 uppercase tracking-widest flex items-center gap-1">
                            {u.role === UserRole.ADMIN ? <ShieldCheck size={10} className="text-emerald-600"/> : <UserCircle size={10}/>}
                            {u.role === UserRole.ADMIN ? 'Administrator' : 'General Practitioner'}
                          </div>
                        </div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${u.active ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}></div>
                   </div>

                   <div className="space-y-4">
                      <div className="bg-white p-2 rounded-2xl border border-slate-100 flex items-center gap-1 shadow-inner">
                        <button 
                          onClick={() => updateUserRole(u.id, UserRole.USER)}
                          className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${u.role === UserRole.USER ? 'bg-slate-950 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          普通医师
                        </button>
                        <button 
                          onClick={() => u.username !== 'qinghoohoo' && updateUserRole(u.id, UserRole.ADMIN)}
                          className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${u.role === UserRole.ADMIN ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'} ${u.username === 'qinghoohoo' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          管理员
                        </button>
                      </div>

                      <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                          <button 
                            onClick={() => toggleUserStatus(u.id)} 
                            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${u.active ? 'bg-slate-100 text-slate-900 hover:bg-slate-200' : 'bg-slate-950 text-white'}`}
                          >
                            {u.active ? '账户冻结' : '恢复激活'}
                          </button>
                          {u.username !== 'qinghoohoo' && (
                            <button 
                              onClick={() => deleteUser(u.id)} 
                              className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                            >
                              <Trash2 size={18}/>
                            </button>
                          )}
                      </div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'scoring' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-slate-950">
          {(['history', 'symptoms', 'exposure', 'ctFeatures', 'qft', 'smear', 'culture', 'molecular'] as const).map(cat => (
            <div key={cat} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl flex flex-col">
               <h4 className="text-[11px] font-black text-slate-950 uppercase tracking-widest mb-6 pb-4 border-b border-slate-50 flex justify-between items-center">
                 {cat.toUpperCase()} 权重矩阵
               </h4>
               <div className="flex-1 space-y-3 overflow-y-auto max-h-[350px] pr-2 mb-6">
                  {Object.entries(localConfig[cat] || {}).map(([name, val]) => (
                    <div key={name} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl group hover:bg-slate-100 transition-all">
                       <input type="number" value={val} onChange={(e) => handleUpdateScore(cat, name, parseInt(e.target.value) || 0)}
                         className="w-14 bg-white border border-slate-100 rounded-lg py-1.5 text-center text-xs font-black text-slate-950 outline-none" />
                       <span className="flex-1 text-[10px] font-bold text-slate-950 truncate">{name}</span>
                       <button onClick={() => handleRemoveItem(cat, name)} className="opacity-0 group-hover:opacity-100 p-1.5 text-rose-500 transition-all"><Trash size={12}/></button>
                    </div>
                  ))}
               </div>
               <div className="flex gap-2">
                 <input value={newItemNames[cat] || ''} onChange={e => setNewItemNames({...newItemNames, [cat]: e.target.value})} placeholder="新增..." className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-950 outline-none" />
                 <button onClick={() => handleAddItem(cat)} className="p-2 bg-slate-950 text-white rounded-xl active:scale-95 transition-all shadow-md"><Plus size={16}/></button>
               </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'thresholds' && (
        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl space-y-10 text-slate-950">
           <div className="flex items-center justify-between">
             <h3 className="text-xl font-black text-slate-950 uppercase tracking-tighter">临床决策分层逻辑 (Min-Max)</h3>
             <button onClick={handleAddThreshold} className="flex items-center gap-2 px-8 py-3 bg-slate-950 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"><Plus size={14} className="text-white"/> 增加分层</button>
           </div>
           <div className="space-y-6">
              {localConfig.thresholds.map((th) => (
                <div key={th.id} className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-8 bg-slate-50 border border-slate-100 rounded-[2rem] relative group hover:border-black/10 transition-all">
                   <div className="lg:col-span-2">
                      <Label>等级名称</Label>
                      <input value={th.level} onChange={e => handleUpdateThreshold(th.id, { level: e.target.value })} className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-black text-slate-900 outline-none" />
                   </div>
                   <div className="lg:col-span-2">
                      <Label>分值范围</Label>
                      <div className="flex gap-2">
                        <input type="number" value={th.min} onChange={e => handleUpdateThreshold(th.id, { min: parseInt(e.target.value) || 0 })} className="w-full bg-white border border-slate-100 rounded-xl px-2 py-2 text-xs font-black text-center text-slate-950" />
                        <input type="number" value={th.max} onChange={e => handleUpdateThreshold(th.id, { max: parseInt(e.target.value) || 0 })} className="w-full bg-white border border-slate-100 rounded-xl px-2 py-2 text-xs font-black text-center text-slate-950" />
                      </div>
                   </div>
                   <div className="lg:col-span-7">
                      <Label>临床标准化建议文案</Label>
                      <textarea value={th.suggestion} onChange={e => handleUpdateThreshold(th.id, { suggestion: e.target.value })} className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold h-12 resize-none text-slate-950" />
                   </div>
                   <div className="lg:col-span-1 flex items-end justify-center">
                      <button onClick={() => handleRemoveThreshold(th.id)} className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash size={18}/></button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl space-y-10 text-slate-950">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <BrainCircuit size={28} className="text-indigo-600" />
               <h3 className="text-xl font-black text-slate-950 uppercase tracking-tighter">AI 临床推导微调 (Few-Shot Prompting)</h3>
             </div>
             <button onClick={handleAddFewShot} className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"><Plus size={14} className="text-white"/> 录入标杆范例</button>
           </div>
           <p className="text-[11px] text-slate-500 font-bold max-w-2xl leading-relaxed">此处定义的标杆范例将作为 AI 审计的“参考逻辑”，确保模型在处理复杂的临床矛盾（如：病原学阴性但影像学高度可疑）时具备高度的一致性与专业性。</p>
           
           <div className="space-y-6">
              {localConfig.fewShotExamples?.map((ex) => (
                <div key={ex.id} className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-8 bg-slate-50 border border-slate-100 rounded-[2rem] relative group hover:border-indigo-600/20 transition-all">
                   <div className="lg:col-span-4">
                      <Label><MessageSquareQuote size={12} className="inline mr-1" /> 典型矛盾场景</Label>
                      <textarea value={ex.scenario} onChange={e => handleUpdateFewShot(ex.id, { scenario: e.target.value })} className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-[11px] font-bold h-24 resize-none text-slate-950" placeholder="例如：痰检持续阴性但CT显示典型干酪样坏死..." />
                   </div>
                   <div className="lg:col-span-5">
                      <Label><BrainCircuit size={12} className="inline mr-1" /> 专家推导范式</Label>
                      <textarea value={ex.reasoning} onChange={e => handleUpdateFewShot(ex.id, { reasoning: e.target.value })} className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-[11px] font-bold h-24 resize-none text-slate-950" placeholder="详细说明专家如何在此场景下进行逻辑调优..." />
                   </div>
                   <div className="lg:col-span-2">
                      <Label>建议修正分</Label>
                      <input type="number" value={ex.fusionScore} onChange={e => handleUpdateFewShot(ex.id, { fusionScore: parseInt(e.target.value) || 0 })} className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-black text-slate-950" />
                   </div>
                   <div className="lg:col-span-1 flex items-end justify-center">
                      <button onClick={() => handleRemoveFewShot(ex.id)} className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash size={18}/></button>
                   </div>
                </div>
              ))}
              {(!localConfig.fewShotExamples || localConfig.fewShotExamples.length === 0) && (
                <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-[3rem]">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">当前未定义任何 AI 参考范式，模型将使用默认逻辑</p>
                </div>
              )}
           </div>
        </div>
      )}

      {activeTab === 'cms' && (
        <div className="space-y-10 text-slate-950">
          <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl space-y-10">
            <h3 className="text-xl font-black text-slate-950 uppercase tracking-tighter flex items-center gap-3"><Globe size={24} /> 核心门户配置 (Hero Section)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-3">
                 <Label>Hero 徽标文案</Label>
                 <input value={localSiteConfig.heroBadge} onChange={e => setLocalSiteConfig({...localSiteConfig, heroBadge: e.target.value})} className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl font-bold text-slate-950 text-sm outline-none shadow-inner" />
               </div>
               <div className="space-y-3">
                 <Label>Hero 主标题 (支持 \n 换行)</Label>
                 <textarea value={localSiteConfig.heroTitle} onChange={e => setLocalSiteConfig({...localSiteConfig, heroTitle: e.target.value})} className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl font-black text-slate-950 text-sm h-20 outline-none shadow-inner" />
               </div>
               <div className="md:col-span-2 space-y-3">
                 <Label>Hero 核心描述语</Label>
                 <textarea value={localSiteConfig.heroDescription} onChange={e => setLocalSiteConfig({...localSiteConfig, heroDescription: e.target.value})} className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl font-bold text-slate-950 text-sm h-32 outline-none shadow-inner" />
               </div>
               <div className="space-y-3">
                 <Label>CTA 引导文案</Label>
                 <input value={localSiteConfig.ctaText} onChange={e => setLocalSiteConfig({...localSiteConfig, heroDescription: e.target.value})} className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl font-bold text-slate-950 text-sm outline-none" />
               </div>
               <div className="space-y-3">
                 <Label>Hero 视觉 URL</Label>
                 <input value={localSiteConfig.heroImageUrl} onChange={e => setLocalSiteConfig({...localSiteConfig, heroImageUrl: e.target.value})} className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl font-bold text-slate-950 text-sm outline-none shadow-inner" />
               </div>
               <div className="space-y-3">
                 <Label>主题主色调</Label>
                 <input value={localSiteConfig.primaryColor} onChange={e => setLocalSiteConfig({...localSiteConfig, primaryColor: e.target.value})} className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl font-bold text-slate-950 text-sm outline-none shadow-inner" />
               </div>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl space-y-10">
            <h3 className="text-xl font-black text-slate-950 uppercase tracking-tighter flex items-center gap-3"><Layout size={24} /> 核心业务页面文案</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-3">
                 <Label>录入页标题</Label>
                 <input value={localSiteConfig.inputPageTitle} onChange={e => setLocalSiteConfig({...localSiteConfig, inputPageTitle: e.target.value})} className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl font-bold text-slate-950 text-sm outline-none shadow-inner" />
               </div>
               <div className="space-y-3">
                 <Label>录入页描述</Label>
                 <input value={localSiteConfig.inputPageDesc} onChange={e => setLocalSiteConfig({...localSiteConfig, inputPageDesc: e.target.value})} className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl font-bold text-slate-950 text-sm outline-none shadow-inner" />
               </div>
               <div className="space-y-3">
                 <Label>分析中心标题</Label>
                 <input value={localSiteConfig.summaryPageTitle} onChange={e => setLocalSiteConfig({...localSiteConfig, summaryPageTitle: e.target.value})} className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl font-bold text-slate-950 text-sm outline-none shadow-inner" />
               </div>
               <div className="space-y-3">
                 <Label>分析中心描述</Label>
                 <input value={localSiteConfig.summaryPageDesc} onChange={e => setLocalSiteConfig({...localSiteConfig, summaryPageDesc: e.target.value})} className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl font-bold text-slate-950 text-sm outline-none shadow-inner" />
               </div>
               <div className="space-y-3">
                 <Label>管理中心标题</Label>
                 <input value={localSiteConfig.adminPageTitle} onChange={e => setLocalSiteConfig({...localSiteConfig, adminPageTitle: e.target.value})} className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl font-bold text-slate-950 text-sm outline-none shadow-inner" />
               </div>
               <div className="space-y-3">
                 <Label>管理中心描述</Label>
                 <input value={localSiteConfig.adminPageDesc} onChange={e => setLocalSiteConfig({...localSiteConfig, adminPageDesc: e.target.value})} className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl font-bold text-slate-950 text-sm outline-none shadow-inner" />
               </div>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl space-y-10">
            <h3 className="text-xl font-black text-slate-950 uppercase tracking-tighter flex items-center gap-3"><Palette size={24} /> 首页模块标题配置</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-3">
                 <Label>特性模块主标题</Label>
                 <input value={localSiteConfig.featuresTitle} onChange={e => setLocalSiteConfig({...localSiteConfig, featuresTitle: e.target.value})} className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl font-bold text-slate-950 text-sm outline-none shadow-inner" />
               </div>
               <div className="space-y-3">
                 <Label>特性模块副标题</Label>
                 <input value={localSiteConfig.featuresSubtitle} onChange={e => setLocalSiteConfig({...localSiteConfig, featuresSubtitle: e.target.value})} className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl font-bold text-slate-950 text-sm outline-none shadow-inner" />
               </div>
               <div className="space-y-3">
                 <Label>安全准则主标题</Label>
                 <input value={localSiteConfig.aboutTitle} onChange={e => setLocalSiteConfig({...localSiteConfig, aboutTitle: e.target.value})} className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl font-bold text-slate-950 text-sm outline-none shadow-inner" />
               </div>
               <div className="space-y-3">
                 <Label>安全准则副标题</Label>
                 <input value={localSiteConfig.aboutSubtitle} onChange={e => setLocalSiteConfig({...localSiteConfig, aboutSubtitle: e.target.value})} className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl font-bold text-slate-950 text-sm outline-none shadow-inner" />
               </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-[3rem] p-10 shadow-sm border border-slate-100 space-y-10">
            <h3 className="text-xl font-black text-slate-950 uppercase tracking-tighter flex items-center gap-3"><Palette size={24} /> 品牌与页脚元数据</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="md:col-span-2 space-y-3">
                 <Label>页脚品牌详细介绍</Label>
                 <textarea value={localSiteConfig.footerDescription} onChange={e => setLocalSiteConfig({...localSiteConfig, footerDescription: e.target.value})} className="w-full bg-white border border-slate-200 px-6 py-4 rounded-2xl font-bold text-slate-950 text-sm h-24 outline-none" />
               </div>
               <div className="space-y-3">
                 <Label>版权归属声明</Label>
                 <input value={localSiteConfig.footerCopyright} onChange={e => setLocalSiteConfig({...localSiteConfig, footerCopyright: e.target.value})} className="w-full bg-white border border-slate-200 px-6 py-4 rounded-2xl font-bold text-slate-950 text-sm outline-none" />
               </div>
               <div className="space-y-3">
                 <Label>ICP 备案号</Label>
                 <input value={localSiteConfig.footerIcp} onChange={e => setLocalSiteConfig({...localSiteConfig, footerIcp: e.target.value})} className="w-full bg-white border border-slate-200 px-6 py-4 rounded-2xl font-bold text-slate-950 text-sm outline-none" />
               </div>
               <div className="space-y-3">
                 <Label>全站 brand 品牌名称</Label>
                 <input value={localSiteConfig.footerBrandName} onChange={e => setLocalSiteConfig({...localSiteConfig, footerBrandName: e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl font-bold text-slate-950 text-xs outline-none" />
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettingsPage;
