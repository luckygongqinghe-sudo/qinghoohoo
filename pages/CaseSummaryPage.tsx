
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Case } from '../types';
import { 
  Search, 
  Trash2, 
  Edit3, 
  CheckSquare, 
  Square, 
  PieChart,
  Users,
  AlertTriangle,
  Microscope,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  Activity,
  Share2,
  Database,
  X,
  Zap,
  ArrowRightLeft,
  Filter,
  BarChart3,
  Copy,
  CheckCircle2,
  Terminal
} from 'lucide-react';

const CaseSummaryPage: React.FC = () => {
  const { cases, currentUser, deleteCases, siteConfig, mergeCases } = useStore();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncString, setSyncString] = useState('');
  const [importString, setImportString] = useState('');
  const [copied, setCopied] = useState(false);

  const isAdmin = currentUser?.username === 'qinghoohoo';

  const filteredCases = useMemo(() => {
    const list = cases || [];
    return list.filter(c => {
      if (!c) return false;
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (c.name || '').toLowerCase().includes(searchLower) || 
                           (c.id || '').includes(searchTerm) || 
                           (c.creatorName || '').toLowerCase().includes(searchLower);
      const matchesRisk = filterRisk === 'all' || c.riskLevel === filterRisk;
      return matchesSearch && matchesRisk;
    });
  }, [cases, searchTerm, filterRisk]);

  const stats = useMemo(() => {
    const total = filteredCases.length;
    if (total === 0) {
      return { total: 0, highRisk: 0, highRiskPer: 0, labPos: 0, labPosPer: 0, avgAge: 0, avgBmi: 0, avgCtScore: 0, symptomFreq: [] };
    }

    const highRiskCases = filteredCases.filter(c => (c.riskLevel || '').includes('高') || (c.riskLevel || '').includes('确诊'));
    const labPositiveCases = filteredCases.filter(c => c.smearResult === '阳性' || c.cultureResult === '阳性' || c.qftResult === '阳性');
    
    const sumAge = filteredCases.reduce((acc, c) => acc + (Number(c.age) || 0), 0);
    const sumBmi = filteredCases.reduce((acc, c) => acc + (Number(c.bmi) || 0), 0);
    const sumCtScore = filteredCases.reduce((acc, c) => acc + (Number(c.ctScore) || 0), 0);

    const symMap: Record<string, number> = {};
    filteredCases.forEach(c => {
      (c.symptoms || []).forEach(s => symMap[s] = (symMap[s] || 0) + 1);
    });

    return {
      total,
      highRisk: highRiskCases.length,
      highRiskPer: Math.round((highRiskCases.length / total) * 100) || 0,
      labPos: labPositiveCases.length,
      labPosPer: Math.round((labPositiveCases.length / total) * 100) || 0,
      avgAge: Math.round(sumAge / total) || 0,
      avgBmi: (sumBmi / total).toFixed(1),
      avgCtScore: (sumCtScore / total).toFixed(1),
      symptomFreq: Object.entries(symMap).sort((a,b) => b[1] - a[1]).slice(0, 4)
    };
  }, [filteredCases]);

  const exportDetailedCSV = () => {
    if (filteredCases.length === 0) return alert('当前视图无数据可导出');
    
    const headers = [
      '系统编号', '评估时间', '录入员', '姓名', '年龄', '性别', '身高(cm)', '体重(kg)', 'BMI', 
      '既往病史', '现病症状', '流行病暴露史', 'CT影像特征', '影像得分', 'QFT检测', 
      '痰涂片', '细菌培养', '评估总分', '风险等级', '临床建议'
    ];

    const rows = filteredCases.map(c => [
      c.id,
      new Date(c.timestamp).toLocaleString(),
      c.creatorName,
      c.name,
      c.age,
      c.gender,
      c.height,
      c.weight,
      c.bmi,
      (c.history || []).join(';'),
      (c.symptoms || []).join(';'),
      c.exposure,
      c.ctFeature,
      c.ctScore,
      c.qftResult,
      c.smearResult,
      c.cultureResult,
      c.totalScore,
      c.riskLevel,
      c.suggestion
    ].map(v => `"${String(v || '').replace(/"/g, '""')}"`));

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `TB_Detailed_Export_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  const handleGenerateSync = () => {
    const str = btoa(unescape(encodeURIComponent(JSON.stringify(cases))));
    setSyncString(str);
    navigator.clipboard.writeText(str);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImportSync = () => {
    try {
      const decoded = JSON.parse(decodeURIComponent(escape(atob(importString))));
      if (!Array.isArray(decoded)) throw new Error('无效数据格式');
      const added = mergeCases(decoded);
      alert(`指令执行成功！已同步合并 ${added} 条新档案。`);
      setImportString('');
      setShowSyncModal(false);
    } catch (e) {
      alert('同步指令校验失败，请检查指令完整性。');
    }
  };

  // Define handleToggleSelect to fix the "Cannot find name" error.
  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-32">
      {/* 数据同步 Modal - 恢复指令包功能 */}
      {showSyncModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
           <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[40px] p-12 shadow-2xl space-y-8 border-2 border-slate-100 dark:border-slate-800 animate-in zoom-in-95">
             <div className="flex justify-between items-center">
               <h3 className="text-2xl font-black text-slate-950 dark:text-white flex items-center gap-3"><ArrowRightLeft className="text-emerald-600"/> 档案同步指令枢纽</h3>
               <button onClick={() => setShowSyncModal(false)} className="p-2 text-slate-400 hover:text-rose-500"><X /></button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-4">
                 <div className="flex items-center gap-2 text-slate-950 dark:text-white font-black">
                   <Zap size={20} className="text-amber-500" /> 1. 生成同步指令包
                 </div>
                 <p className="text-xs text-slate-500 font-bold">将当前所有本地档案打包为一段加密字符串，发送给其他终端即可合并数据。</p>
                 <button onClick={handleGenerateSync} className="w-full py-4 bg-slate-950 dark:bg-emerald-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-black transition-all">
                   {copied ? <><CheckCircle2 size={18}/> 已复制到剪贴板</> : <><Copy size={18}/> 生成并复制指令</>}
                 </button>
                 {syncString && (
                   <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl break-all text-[8px] font-mono text-slate-400 h-24 overflow-y-auto border border-slate-100 dark:border-slate-700">
                     {syncString}
                   </div>
                 )}
               </div>

               <div className="space-y-4">
                 <div className="flex items-center gap-2 text-slate-950 dark:text-white font-black">
                   <Terminal size={20} className="text-emerald-600" /> 2. 执行同步指令
                 </div>
                 <p className="text-xs text-slate-500 font-bold">在此粘贴由其他终端生成的同步加密指令包，系统将自动识别并合并差异档案。</p>
                 <textarea 
                    value={importString} 
                    onChange={e => setImportString(e.target.value)} 
                    placeholder="在此粘贴同步指令..." 
                    className="w-full h-24 p-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:border-emerald-500 font-mono text-[10px] text-slate-600 dark:text-slate-300 transition-all"
                 />
                 <button onClick={handleImportSync} disabled={!importString} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all disabled:opacity-50">
                   <Zap size={18}/> 执行指令合并数据
                 </button>
               </div>
             </div>
           </div>
        </div>
      )}

      {/* 头部展示 */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-950 dark:text-white tracking-tighter mb-1">{siteConfig.summaryPageTitle}</h1>
          <p className="text-slate-950 dark:text-slate-400 font-black text-lg opacity-60">{siteConfig.summaryPageDesc}</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button onClick={() => setShowSyncModal(true)} className="flex items-center gap-2 px-8 py-4 bg-white dark:bg-slate-800 text-slate-950 dark:text-white border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-black shadow-sm hover:scale-105 transition-all">
            <Share2 size={20} /> 档案同步枢纽
          </button>
          <button onClick={exportDetailedCSV} className="flex items-center gap-2 px-10 py-4 bg-slate-950 dark:bg-emerald-600 text-white rounded-2xl font-black shadow-xl hover:bg-black transition-all">
            <FileSpreadsheet size={20} /> 导出全字段详细透视表
          </button>
        </div>
      </div>

      {/* 核心透视卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border-2 border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600"><Users size={28}/></div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">总体样本</span>
          </div>
          <div>
            <p className="text-4xl font-black text-slate-950 dark:text-white">{stats.total}</p>
            <p className="text-[11px] font-black text-slate-950 dark:text-slate-400 mt-1 opacity-60">累计筛查档案数</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border-2 border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center text-rose-600"><AlertTriangle size={28}/></div>
            <span className="text-rose-600 font-black text-xs">{stats.highRiskPer}% 风险占比</span>
          </div>
          <div>
            <p className="text-4xl font-black text-slate-950 dark:text-white">{stats.highRisk}</p>
            <p className="text-[11px] font-black text-slate-950 dark:text-slate-400 mt-1 opacity-60">高危及以上检出</p>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
               <div className="h-full bg-rose-500 transition-all duration-1000" style={{width: `${stats.highRiskPer}%`}} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border-2 border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600"><Microscope size={28}/></div>
            <span className="text-emerald-600 font-black text-xs">{stats.labPosPer}% 阳性率</span>
          </div>
          <div>
            <p className="text-4xl font-black text-slate-950 dark:text-white">{stats.labPos}</p>
            <p className="text-[11px] font-black text-slate-950 dark:text-slate-400 mt-1 opacity-60">实验室结果阳性</p>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
               <div className="h-full bg-emerald-500 transition-all duration-1000" style={{width: `${stats.labPosPer}%`}} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border-2 border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600"><BarChart3 size={28}/></div>
            <span className="text-amber-600 font-black text-[11px] uppercase tracking-widest">多维平均值</span>
          </div>
          <div className="space-y-1 text-[11px] font-black">
            <div className="flex justify-between items-center"><span className="text-slate-400 uppercase">平均年龄</span><span className="text-slate-950 dark:text-white">{stats.avgAge} 岁</span></div>
            <div className="flex justify-between items-center"><span className="text-slate-400 uppercase">平均 BMI</span><span className="text-slate-950 dark:text-white">{stats.avgBmi}</span></div>
            <div className="flex justify-between items-center"><span className="text-slate-400 uppercase">影像评分均值</span><span className="text-blue-600">+{stats.avgCtScore}</span></div>
            <div className="pt-2 mt-2 border-t border-slate-50 dark:border-slate-800 flex flex-wrap gap-1">
               {stats.symptomFreq.map(([name, count]) => (
                 <span key={name} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-black text-slate-500">{name} ({count})</span>
               ))}
            </div>
          </div>
        </div>
      </div>

      {/* 列表显示区 */}
      <div className="bg-white dark:bg-slate-900 rounded-[48px] border-2 border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="p-10 border-b border-slate-50 dark:border-slate-800 flex flex-col md:flex-row gap-6 bg-slate-50/10">
          <div className="flex-1 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
            <input 
              type="text" 
              placeholder="搜索患者姓名、ID或录入员姓名..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="w-full pl-16 pr-8 py-5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl focus:ring-4 focus:ring-emerald-500/10 outline-none font-black text-slate-950 dark:text-white transition-all" 
            />
          </div>
          <div className="flex items-center gap-4">
             <Filter className="text-slate-300" />
             <select 
               value={filterRisk} 
               onChange={e => setFilterRisk(e.target.value)}
               className="px-8 py-5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl font-black text-slate-950 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10"
             >
               <option value="all">所有风险分层</option>
               <option value="确诊结核病">确诊病例</option>
               <option value="极高危风险">极高危风险</option>
               <option value="高风险">高风险</option>
               <option value="中风险">中风险</option>
               <option value="低风险">低风险</option>
               <option value="无风险">无风险</option>
             </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="py-7 px-10 w-16 text-center">
                   <div className="cursor-pointer text-slate-300 hover:text-slate-400" onClick={() => setSelectedIds(selectedIds.length === filteredCases.length ? [] : filteredCases.map(c => c.id))}>
                     {selectedIds.length === filteredCases.length && filteredCases.length > 0 ? <CheckSquare size={22} className="text-emerald-500"/> : <Square size={22} />}
                   </div>
                </th>
                <th className="py-7 font-black text-slate-950 dark:text-slate-500 text-[11px] uppercase tracking-[0.2em] px-6">受检者肖像与渠道</th>
                <th className="py-7 font-black text-slate-950 dark:text-slate-500 text-[11px] uppercase tracking-[0.2em] px-6">关键核心指标结果</th>
                <th className="py-7 font-black text-slate-950 dark:text-slate-500 text-[11px] uppercase tracking-[0.2em] px-6 text-center">风险总分/层级</th>
                <th className="py-7 font-black text-slate-950 dark:text-slate-500 text-[11px] uppercase tracking-[0.2em] px-10 text-right">档案动作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredCases.map((c) => (
                <React.Fragment key={c.id}>
                  <tr 
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all cursor-pointer group ${expandedId === c.id ? 'bg-slate-50 dark:bg-slate-800/60' : ''}`} 
                    onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                  >
                    <td className="py-8 px-10 text-center" onClick={(e) => e.stopPropagation()}>
                      <button onClick={(e) => handleToggleSelect(c.id, e)} className={selectedIds.includes(c.id) ? 'text-emerald-500' : 'text-slate-300 hover:text-slate-400'}>
                        {selectedIds.includes(c.id) ? <CheckSquare size={22} /> : <Square size={22} />}
                      </button>
                    </td>
                    <td className="py-8 px-6">
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border-2 shadow-sm ${c.gender === '男' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{c.name ? c.name.charAt(0) : '?'}</div>
                        <div>
                          <div className="font-black text-slate-950 dark:text-white text-lg leading-none mb-1.5">{c.name} ({c.age}岁 / {c.gender})</div>
                          <div className="text-[10px] text-slate-950 dark:text-slate-400 font-black uppercase tracking-widest opacity-40">录入员: {c.creatorName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-8 px-6">
                      <div className="flex items-center gap-3">
                         <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-xl text-[10px] font-black text-slate-950 dark:text-slate-300">QFT: {c.qftResult}</div>
                         <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black ${c.smearResult === '阳性' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>涂片: {c.smearResult}</div>
                         <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black ${c.cultureResult === '阳性' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>培养: {c.cultureResult}</div>
                      </div>
                    </td>
                    <td className="py-8 px-6 text-center">
                      <div className="inline-flex items-center gap-5">
                        <div className="text-3xl font-black text-slate-950 dark:text-white tracking-tighter">{c.totalScore}</div>
                        <span className={`px-5 py-2 rounded-full text-[10px] font-black border-2 transition-all ${c.riskLevel === '确诊结核病' ? 'bg-rose-600 border-rose-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-950 dark:text-white'}`}>
                          {c.riskLevel}
                        </span>
                      </div>
                    </td>
                    <td className="py-8 px-10 text-right">
                      <div className="flex items-center justify-end gap-4">
                        {(isAdmin || currentUser?.id === c.creatorId) && (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/cases?edit=${c.id}`); }} className="p-2 text-slate-300 hover:text-emerald-500 transition-all"><Edit3 size={22} /></button>
                            <button onClick={(e) => { e.stopPropagation(); if(window.confirm('确认永久删除档案？此操作无法撤销。')) deleteCases([c.id]); }} className="p-2 text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={22} /></button>
                          </>
                        )}
                        {expandedId === c.id ? <ChevronUp size={24} className="text-slate-950 dark:text-white" /> : <ChevronDown size={24} className="text-slate-950 dark:text-white opacity-30" />}
                      </div>
                    </td>
                  </tr>
                  {expandedId === c.id && (
                    <tr className="bg-slate-50/80 dark:bg-slate-800/40 animate-in slide-in-from-top-4 duration-500">
                      <td colSpan={5} className="p-12 border-l-[12px] border-emerald-600">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                          <div className="space-y-6">
                            <p className="text-[11px] font-black text-slate-950 uppercase tracking-[0.2em] opacity-40">多维医学特征</p>
                            <div className="space-y-5">
                              <div>
                                <label className="text-[10px] text-slate-950 font-black opacity-30 block mb-2 uppercase tracking-widest">既往伴随病史</label>
                                <div className="flex flex-wrap gap-2">
                                  {(c.history || []).map(h => <span key={h} className="px-3 py-1 bg-white dark:bg-slate-700 rounded-lg text-xs font-black text-slate-950 shadow-sm border border-slate-100">{h}</span>)}
                                  {(!c.history || c.history.length === 0) && <span className="text-xs text-slate-400 italic font-black">无记录</span>}
                                </div>
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-950 font-black opacity-30 block mb-2 uppercase tracking-widest">核心临床体征</label>
                                <div className="flex flex-wrap gap-2">
                                  {(c.symptoms || []).map(s => <span key={s} className="px-3 py-1 bg-rose-50 dark:bg-rose-900/30 rounded-lg text-xs font-black text-rose-700 shadow-sm border border-rose-100">{s}</span>)}
                                  {(!c.symptoms || c.symptoms.length === 0) && <span className="text-xs text-slate-400 italic font-black">无不适表现</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-6">
                            <p className="text-[11px] font-black text-slate-950 uppercase tracking-[0.2em] opacity-40">原始参数快照</p>
                            <div className="space-y-3 bg-white/50 dark:bg-slate-800/50 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm">
                              <div className="flex justify-between text-xs font-black"><span className="text-slate-950 opacity-30">身高 / 体重:</span><span className="text-slate-950 dark:text-white">{c.height}cm / {c.weight}kg</span></div>
                              <div className="flex justify-between text-xs font-black"><span className="text-slate-950 opacity-30">BMI 指数:</span><span className="text-emerald-600">{c.bmi}</span></div>
                              <div className="flex justify-between text-xs font-black"><span className="text-slate-950 opacity-30">暴露接触史:</span><span className="text-slate-950 dark:text-white">{c.exposure}</span></div>
                              <div className="flex justify-between text-xs font-black"><span className="text-slate-950 opacity-30">影像评分分值:</span><span className="text-blue-600 font-black">+{c.ctScore}</span></div>
                            </div>
                          </div>

                          <div className="lg:col-span-2 p-10 bg-white dark:bg-slate-800 rounded-[48px] border-2 border-emerald-50 dark:border-emerald-900/20 shadow-xl relative overflow-hidden flex flex-col justify-center">
                            <Activity className="absolute -right-6 -bottom-6 text-emerald-500 opacity-10 w-48 h-48" />
                            <div className="relative z-10">
                              <p className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-4">智能评估及处置路径建议</p>
                              <p className="text-lg font-black leading-relaxed text-slate-950 dark:text-slate-200 italic tracking-tight">“{c.suggestion || '系统建议由临床医生依据各项指标结合实诊得出最终方案。'}”</p>
                              <div className="mt-8 flex items-center gap-3 text-[11px] font-black text-slate-950 opacity-20 border-t border-slate-50 dark:border-slate-800 pt-6">
                                <Database size={16} /> 档案溯源码: {c.id} · <PieChart size={16}/> 综合得分：{c.totalScore}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filteredCases.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-32 text-center">
                    <div className="flex flex-col items-center opacity-10">
                      <Database size={80} className="text-slate-950 mb-6" />
                      <p className="text-slate-950 font-black text-2xl">暂无符合条件的病例档案</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CaseSummaryPage;
