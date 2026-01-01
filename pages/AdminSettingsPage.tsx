
import React, { useState, useEffect } from 'react';
import { useStore } from '../store.tsx';
import { UserRole, ScoringConfig, SiteConfig, LandingFeature, FooterLink } from '../types.ts';
import { DEFAULT_CONFIG } from '../constants.ts';
import * as LucideIcons from 'lucide-react';
import { 
  Users, 
  Settings2, 
  Trash2, 
  CheckCircle, 
  Save,
  Palette,
  Layout as LayoutIcon,
  Type,
  Key,
  UserCheck,
  Clock,
  X,
  RefreshCw,
  ShieldAlert,
  Info,
  RotateCcw,
  Link as LinkIcon,
  ExternalLink,
  PlusCircle,
  AlertCircle,
  Sparkles
} from 'lucide-react';

const AdminSettingsPage: React.FC = () => {
  const { 
    users, 
    currentUser, 
    toggleUserStatus, 
    updateUserRole, 
    updateUserPassword, 
    approveUser,
    deleteUser, 
    config, 
    updateConfig, 
    siteConfig, 
    updateSiteConfig 
  } = useStore();
  
  const [activeTab, setActiveTab] = useState<'users' | 'scoring' | 'appearance' | 'security'>('users');
  const [localConfig, setLocalConfig] = useState<ScoringConfig>(config);
  const [localSiteConfig, setLocalSiteConfig] = useState<SiteConfig>(siteConfig);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // 临时状态
  const [resettingUser, setResettingUser] = useState<string | null>(null);
  const [newPassInput, setNewPassInput] = useState('');
  const [newWeightInputs, setNewWeightInputs] = useState<Record<string, { key: string, val: number }>>({});
  const [selfPassword, setSelfPassword] = useState({ current: '', next: '', confirm: '' });
  const [securityMsg, setSecurityMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => { setLocalConfig(config); }, [config]);
  useEffect(() => { setLocalSiteConfig(siteConfig); }, [siteConfig]);

  // --- 权重引擎核心逻辑 ---
  
  const handleUpdateScore = (category: keyof ScoringConfig, key: string, value: number) => {
    setLocalConfig(prev => ({ ...prev, [category]: { ...prev[category], [key]: value } }));
  };

  const handleAddNewWeight = (category: keyof ScoringConfig) => {
    const input = newWeightInputs[category];
    if (!input || !input.key.trim()) return;
    
    setLocalConfig(prev => ({
      ...prev,
      [category]: { ...prev[category], [input.key.trim()]: input.val }
    }));
    
    setNewWeightInputs(prev => ({ ...prev, [category]: { key: '', val: 0 } }));
  };

  const handleDeleteWeight = (category: keyof ScoringConfig, key: string) => {
    if (!confirm(`确定要永久删除 [${key}] 吗？删除后，评估录入页面将不再显示此选项。`)) return;
    setLocalConfig(prev => {
      const nextCat = { ...prev[category] };
      delete nextCat[key];
      return { ...prev, [category]: nextCat };
    });
  };

  const handleResetWeights = () => {
    if (confirm('确定要将所有风险评分权重恢复为出厂默认值吗？')) {
      setLocalConfig(DEFAULT_CONFIG);
      updateConfig(DEFAULT_CONFIG);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const handleResetUserPassword = (userId: string) => {
    if (!newPassInput.trim()) return;
    updateUserPassword(userId, newPassInput.trim());
    setResettingUser(null);
    setNewPassInput('');
  };

  const handleSaveAll = () => {
    if (activeTab === 'scoring') updateConfig(localConfig);
    if (activeTab === 'appearance') updateSiteConfig(localSiteConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleSelfPasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMsg(null);
    if (!currentUser) return;
    if (selfPassword.current !== currentUser.password) return setSecurityMsg({ type: 'error', text: '当前旧密码不正确' });
    if (selfPassword.next.length < 6) return setSecurityMsg({ type: 'error', text: '新密码必须至少 6 位' });
    if (selfPassword.next !== selfPassword.confirm) return setSecurityMsg({ type: 'error', text: '两次输入的新密码不匹配' });
    updateUserPassword(currentUser.id, selfPassword.next);
    setSelfPassword({ current: '', next: '', confirm: '' });
    setSecurityMsg({ type: 'success', text: '安全凭据已成功更新' });
  };

  const pendingUsers = users.filter(u => !u.approved);

  return (
    <div className="space-y-8 pb-32">
      {/* 头部标题区 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-950 tracking-tighter mb-2">{siteConfig.adminPageTitle}</h1>
          <p className="text-slate-600 font-bold text-lg">{siteConfig.adminPageDesc}</p>
        </div>
        <div className="flex items-center gap-4">
          {saveSuccess && (
            <div className="flex items-center gap-2 text-emerald-700 font-black text-sm px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100 animate-in fade-in">
              <CheckCircle size={18} /> 配置已同步生效
            </div>
          )}
          {(activeTab === 'scoring' || activeTab === 'appearance') && (
            <button onClick={handleSaveAll} className="px-10 py-4 bg-slate-950 text-white rounded-2xl font-black shadow-2xl hover:bg-black active:scale-95 apple-transition flex items-center gap-2">
              <Save size={20} /> 保存当前页修改
            </button>
          )}
        </div>
      </div>

      {/* 导航标签卡 */}
      <div className="sticky top-24 z-30 flex overflow-x-auto no-scrollbar py-2">
        <div className="flex gap-2 p-2 bg-slate-200/50 backdrop-blur-xl rounded-[28px] border border-white/50 shadow-sm w-fit">
          {[
            { id: 'users', label: '用户与安全组', icon: Users },
            { id: 'scoring', label: '算法权重引擎', icon: Settings2 },
            { id: 'appearance', label: '品牌与内容控制', icon: Palette },
            { id: 'security', label: '个人账户安全', icon: Key },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} 
              className={`flex items-center gap-3 px-8 py-4 rounded-[22px] text-[13px] font-black apple-transition ${activeTab === tab.id ? 'bg-white text-slate-950 shadow-md ring-1 ring-slate-950/5' : 'text-slate-600 hover:text-slate-950 hover:bg-slate-300/30'}`} 
            > 
              <tab.icon size={18} strokeWidth={2.5} /> {tab.label}
              {tab.id === 'users' && pendingUsers.length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-rose-600 text-white text-[10px] rounded-full shadow-lg shadow-rose-200">{pendingUsers.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* --- 算法权重引擎标签页 --- */}
      {activeTab === 'scoring' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[32px] border-2 border-slate-100 shadow-sm gap-4">
             <div>
               <h3 className="text-2xl font-black text-slate-950">医疗风险分值管控</h3>
               <p className="text-slate-600 font-bold mt-1">您可以增加新的临床维度或删除不再适用的指标，更改将实时同步到录入表单。</p>
             </div>
             <button onClick={handleResetWeights} className="flex items-center gap-2 px-8 py-4 border-2 border-rose-100 text-rose-700 rounded-2xl font-black hover:bg-rose-50 apple-transition group">
                <RotateCcw size={20} className="group-hover:rotate-[-45deg] transition-transform" /> 恢复出厂默认值
             </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {(Object.keys(localConfig) as Array<keyof ScoringConfig>).map(cat => (
              <div key={cat} className="bg-white rounded-[40px] p-10 border-2 border-slate-100 shadow-xl hover:border-slate-950 apple-transition flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-slate-950 flex items-center gap-4">
                    <div className="w-2.5 h-10 bg-slate-950 rounded-full" />
                    {cat === 'history' ? '既往病史' : cat === 'exposure' ? '接触史' : cat === 'ctFeatures' ? '影像特征' : cat === 'qft' ? 'QFT结果' : cat === 'smear' ? '涂片' : cat === 'culture' ? '培养' : '临床症状'}
                  </h3>
                  <span className="text-[11px] text-white font-black uppercase tracking-widest bg-slate-950 px-4 py-1.5 rounded-full">Weight Layer</span>
                </div>

                <div className="flex-1 space-y-4 mb-8">
                  {Object.entries(localConfig[cat] || {}).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between p-5 bg-slate-50 rounded-[24px] border-2 border-transparent hover:border-slate-200 hover:bg-white apple-transition group">
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => handleDeleteWeight(cat, key)} 
                          className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          title="删除此项"
                        >
                          <Trash2 size={18} />
                        </button>
                        <span className="text-lg font-black text-slate-950">{key}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">分值:</span>
                        <input 
                          type="number" 
                          value={val} 
                          onChange={e => handleUpdateScore(cat, key, parseInt(e.target.value) || 0)}
                          className="w-24 px-4 py-3 text-center bg-white border-2 border-slate-200 rounded-xl text-base font-black text-slate-950 outline-none focus:border-slate-950"
                        />
                      </div>
                    </div>
                  ))}
                  {Object.keys(localConfig[cat]).length === 0 && (
                    <div className="py-12 text-center text-slate-400 font-bold italic flex flex-col items-center gap-2">
                       <AlertCircle size={32} />
                       该类别目前为空，请添加配置项
                    </div>
                  )}
                </div>

                {/* 新增配置项区域 */}
                <div className="mt-auto pt-6 border-t-2 border-slate-50 flex gap-3">
                  <input 
                    placeholder="新增选项名称..."
                    value={newWeightInputs[cat]?.key || ''}
                    onChange={e => setNewWeightInputs({...newWeightInputs, [cat]: { key: e.target.value, val: newWeightInputs[cat]?.val || 0 }})}
                    className="flex-1 px-5 py-4 bg-slate-100 border-2 border-transparent rounded-[20px] font-black text-slate-950 focus:bg-white focus:border-slate-950 outline-none transition-all"
                  />
                  <input 
                    type="number"
                    placeholder="分值"
                    value={newWeightInputs[cat]?.val ?? ''}
                    onChange={e => setNewWeightInputs({...newWeightInputs, [cat]: { key: newWeightInputs[cat]?.key || '', val: parseInt(e.target.value) || 0 }})}
                    className="w-24 px-4 py-4 bg-slate-100 border-2 border-transparent rounded-[20px] font-black text-slate-950 text-center focus:bg-white focus:border-slate-950 outline-none transition-all"
                  />
                  <button 
                    onClick={() => handleAddNewWeight(cat)}
                    className="p-4 bg-slate-950 text-white rounded-[20px] hover:bg-black active:scale-90 transition-all shadow-xl"
                  >
                    <PlusCircle size={24} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- 用户管理标签页 --- */}
      {activeTab === 'users' && (
        <div className="space-y-8 animate-in fade-in">
          {pendingUsers.length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-[40px] p-10 shadow-sm">
              <h3 className="text-2xl font-black text-slate-950 mb-8 flex items-center gap-4">
                <Clock className="text-amber-600" size={28} /> 待审批的人员准入申请
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingUsers.map(user => (
                  <div key={user.id} className="bg-white p-8 rounded-[28px] shadow-sm border border-amber-100 flex items-center justify-between">
                    <div>
                      <div className="font-black text-slate-950 text-xl">{user.username}</div>
                      <div className="text-[10px] text-amber-600 font-black uppercase tracking-widest mt-1">Pending Approval</div>
                    </div>
                    <button onClick={() => approveUser(user.id)} className="p-5 bg-slate-950 text-white rounded-2xl hover:scale-105 transition-all shadow-2xl">
                      <UserCheck size={24} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-[48px] border-2 border-slate-100 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 border-b-2 border-slate-100">
                    <th className="p-10 text-[12px] font-black text-slate-950 uppercase tracking-widest">用户名 / 权限组</th>
                    <th className="p-10 text-[12px] font-black text-slate-950 uppercase tracking-widest text-center">状态</th>
                    <th className="p-10 text-[12px] font-black text-slate-950 uppercase tracking-widest text-center">安全管控</th>
                    <th className="p-10 text-[12px] font-black text-slate-950 uppercase tracking-widest text-right">深度控制</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-50">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-10">
                        <div className="font-black text-slate-950 text-xl mb-2">{user.username}</div>
                        <select 
                          value={user.role} 
                          onChange={(e) => updateUserRole(user.id, e.target.value as UserRole)}
                          className="text-[12px] font-black uppercase tracking-wider bg-slate-100 px-4 py-2 rounded-xl border-2 border-slate-200 text-slate-950 cursor-pointer focus:border-slate-950 transition-all outline-none"
                        >
                          <option value={UserRole.ADMIN}>ADMINISTRATOR</option>
                          <option value={UserRole.USER}>OPERATOR</option>
                        </select>
                      </td>
                      <td className="p-10 text-center">
                        <button 
                          onClick={() => toggleUserStatus(user.id)}
                          className={`px-6 py-3 rounded-2xl text-[12px] font-black uppercase shadow-sm border-2 apple-transition ${user.active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}
                        >
                          {user.active ? '● Active' : '○ Locked'}
                        </button>
                      </td>
                      <td className="p-10 text-center">
                        {resettingUser === user.id ? (
                          <div className="flex items-center justify-center gap-2 animate-in zoom-in-95">
                            <input 
                              autoFocus value={newPassInput} onChange={e => setNewPassInput(e.target.value)}
                              placeholder="新密码" className="px-4 py-2 text-sm border-2 border-slate-950 rounded-xl w-32 font-bold" 
                            />
                            <button onClick={() => handleResetUserPassword(user.id)} className="p-2 bg-slate-950 text-white rounded-lg"><CheckCircle size={16}/></button>
                            <button onClick={() => setResettingUser(null)} className="p-2 bg-slate-200 text-slate-950 rounded-lg"><X size={16}/></button>
                          </div>
                        ) : (
                          <button onClick={() => setResettingUser(user.id)} className="text-[13px] font-black text-slate-950 hover:text-emerald-700 flex items-center gap-2 mx-auto apple-transition">
                            <RefreshCw size={18} strokeWidth={2.5} /> 重置密码
                          </button>
                        )}
                      </td>
                      <td className="p-10 text-right">
                        <button 
                          onClick={() => { if(confirm(`警告：确定彻底注销 [${user.username}] 吗？`)) deleteUser(user.id); }}
                          disabled={user.username === 'qinghoohoo' || user.id === currentUser?.id}
                          className="p-5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl apple-transition disabled:opacity-0"
                        >
                          <Trash2 size={24} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- 品牌内容标签页 --- */}
      {activeTab === 'appearance' && (
        <div className="space-y-10 animate-in fade-in">
          <div className="bg-white rounded-[48px] p-16 border-2 border-slate-100 shadow-2xl space-y-12">
            <h3 className="text-3xl font-black flex items-center gap-5 text-slate-950"><Type size={36} /> 品牌门户文案</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-4">
                <label className="text-[13px] font-black text-slate-950 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Sparkles size={16} className="text-emerald-500" /> 首页大标题上方的标签 (Badge)
                </label>
                <input 
                  value={localSiteConfig.heroBadge} 
                  onChange={e => setLocalSiteConfig({...localSiteConfig, heroBadge: e.target.value})} 
                  className="w-full p-6 bg-slate-50 rounded-[24px] border-2 border-slate-100 font-black text-slate-950 outline-none focus:border-slate-950 transition-all" 
                  placeholder="例如：2025 全新数字化..."
                />
              </div>
              <div className="space-y-4">
                <label className="text-[13px] font-black text-slate-950 uppercase tracking-widest ml-1">首页行动按钮文字 (CTA)</label>
                <input 
                  value={localSiteConfig.ctaText} 
                  onChange={e => setLocalSiteConfig({...localSiteConfig, ctaText: e.target.value})} 
                  className="w-full p-6 bg-slate-50 rounded-[24px] border-2 border-slate-100 font-black text-slate-950 outline-none focus:border-slate-950 transition-all" 
                />
              </div>
              <div className="space-y-4">
                <label className="text-[13px] font-black text-slate-950 uppercase tracking-widest ml-1">首页核心大标题</label>
                <textarea 
                  value={localSiteConfig.heroTitle} 
                  onChange={e => setLocalSiteConfig({...localSiteConfig, heroTitle: e.target.value})} 
                  className="w-full p-8 bg-slate-50 rounded-[32px] border-2 border-slate-100 font-black text-3xl text-slate-950 leading-tight h-64 outline-none focus:border-slate-950 transition-all shadow-inner" 
                />
              </div>
              <div className="space-y-4">
                <label className="text-[13px] font-black text-slate-950 uppercase tracking-widest ml-1">首页描述文案</label>
                <textarea 
                  value={localSiteConfig.heroDescription} 
                  onChange={e => setLocalSiteConfig({...localSiteConfig, heroDescription: e.target.value})} 
                  className="w-full p-8 bg-slate-50 rounded-[32px] border-2 border-slate-100 font-bold text-slate-700 text-xl leading-relaxed h-64 outline-none focus:border-slate-950 transition-all shadow-inner" 
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[48px] p-16 border-2 border-slate-100 shadow-2xl">
            <h3 className="text-3xl font-black mb-12 flex items-center gap-5 text-slate-950"><LayoutIcon size={36} /> 核心特性展示</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {localSiteConfig.features.map(feature => (
                <div key={feature.id} className="p-10 bg-slate-50 rounded-[40px] space-y-8 border-2 border-slate-100 hover:border-slate-950 transition-all group">
                  <div className="flex items-center gap-5">
                    <div className="p-4 bg-slate-950 rounded-3xl text-white shadow-2xl group-hover:scale-110 transition-transform">
                      {React.createElement((LucideIcons as any)[feature.iconName] || LucideIcons.HelpCircle, { size: 32 })}
                    </div>
                    <input 
                      value={feature.title} 
                      onChange={e => setLocalSiteConfig({...localSiteConfig, features: localSiteConfig.features.map(f => f.id === feature.id ? {...f, title: e.target.value} : f)})}
                      className="bg-transparent font-black text-slate-950 text-2xl border-none outline-none w-full"
                    />
                  </div>
                  <textarea 
                    value={feature.description} 
                    onChange={e => setLocalSiteConfig({...localSiteConfig, features: localSiteConfig.features.map(f => f.id === feature.id ? {...f, description: e.target.value} : f)})}
                    className="w-full bg-white p-6 rounded-[24px] border-2 border-slate-100 text-base font-bold text-slate-600 h-40 resize-none outline-none focus:border-slate-950"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[48px] p-16 border-2 border-slate-100 shadow-2xl">
            <h3 className="text-3xl font-black mb-12 flex items-center gap-5 text-slate-950"><LinkIcon size={36} /> 底部页脚链接控制</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {localSiteConfig.footerLinks.map(link => (
                <div key={link.id} className="p-8 bg-slate-50 rounded-[28px] border-2 border-slate-100 space-y-4">
                  <input value={link.label} onChange={e => setLocalSiteConfig({...localSiteConfig, footerLinks: localSiteConfig.footerLinks.map(l => l.id === link.id ? {...l, label: e.target.value} : l)})} className="w-full px-5 py-3 rounded-xl border-2 border-slate-200 font-black text-slate-950 outline-none focus:border-slate-950" />
                  <div className="relative">
                    <input value={link.url} onChange={e => setLocalSiteConfig({...localSiteConfig, footerLinks: localSiteConfig.footerLinks.map(l => l.id === link.id ? {...l, url: e.target.value} : l)})} className="w-full pl-5 pr-12 py-3 rounded-xl border-2 border-slate-200 font-bold text-slate-600 text-xs outline-none focus:border-slate-950" />
                    <ExternalLink size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- 安全隐私标签页 --- */}
      {activeTab === 'security' && (
        <div className="max-w-4xl mx-auto animate-in zoom-in-95">
          <div className="bg-white rounded-[60px] p-16 md:p-24 border-2 border-slate-100 shadow-2xl space-y-16">
            <div className="text-center">
              <div className="w-28 h-28 bg-slate-950 rounded-[40px] flex items-center justify-center text-white mx-auto mb-10 shadow-2xl">
                <ShieldAlert size={56} strokeWidth={2.5} />
              </div>
              <h2 className="text-4xl font-black text-slate-950 tracking-tight">安全凭证中心</h2>
              <p className="text-slate-600 font-bold text-xl mt-4">为了系统安全，建议定期更改管理员登录密码。</p>
            </div>

            <form onSubmit={handleSelfPasswordChange} className="space-y-10">
              <div className="space-y-4">
                <label className="text-[13px] font-black text-slate-950 uppercase tracking-widest ml-1">验证当前旧密码</label>
                <input type="password" required value={selfPassword.current} onChange={e => setSelfPassword({...selfPassword, current: e.target.value})} className="w-full p-6 bg-slate-50 rounded-[24px] border-2 border-slate-100 font-black text-slate-950 focus:border-slate-950 outline-none shadow-inner" placeholder="••••••••" />
              </div>
              <div className="h-0.5 bg-slate-100 my-10" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-[13px] font-black text-slate-950 uppercase tracking-widest ml-1">设定新密码</label>
                  <input type="password" required value={selfPassword.next} onChange={e => setSelfPassword({...selfPassword, next: e.target.value})} className="w-full p-6 bg-slate-50 rounded-[24px] border-2 border-slate-100 font-black text-slate-950 focus:border-emerald-500 outline-none shadow-inner" placeholder="••••••••" />
                </div>
                <div className="space-y-4">
                  <label className="text-[13px] font-black text-slate-950 uppercase tracking-widest ml-1">再次确认新密码</label>
                  <input type="password" required value={selfPassword.confirm} onChange={e => setSelfPassword({...selfPassword, confirm: e.target.value})} className="w-full p-6 bg-slate-50 rounded-[24px] border-2 border-slate-100 font-black text-slate-950 focus:border-emerald-500 outline-none shadow-inner" placeholder="••••••••" />
                </div>
              </div>
              {securityMsg && (
                <div className={`p-8 rounded-[32px] text-[14px] font-black flex items-center gap-5 animate-in fade-in ${securityMsg.type === 'error' ? 'bg-rose-50 text-rose-700 border-2 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-2 border-emerald-100'}`}>
                  <Info size={24} /> {securityMsg.text}
                </div>
              )}
              <button type="submit" className="w-full py-7 bg-slate-950 text-white rounded-[30px] font-black text-2xl shadow-2xl hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-5">
                更新全局管理员凭据
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettingsPage;
