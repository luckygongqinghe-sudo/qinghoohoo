
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store.tsx';
import { 
  Search, 
  Trash2, 
  Edit3, 
  CheckSquare, 
  Square, 
  PieChart as PieChartIcon,
  FileSpreadsheet,
  Filter,
  BarChart3,
  Download,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  Zap,
  Activity,
  ShieldCheck,
  AlertTriangle,
  Info
} from 'lucide-react';

import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';

const CaseSummaryPage: React.FC = () => {
  const { cases, currentUser, deleteCases, siteConfig, config } = useStore();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const isAdmin = currentUser?.username === 'qinghoohoo';

  const filteredCases = useMemo(() => {
    if (!Array.isArray(cases)) return [];
    return cases.filter(c => {
      if (!c) return false;
      const searchLower = searchTerm.toLowerCase();
      const name = (c.name || '').toLowerCase();
      const creator = (c.creatorName || '').toLowerCase();
      const cid = (c.id || '').toLowerCase();
      
      const matchesSearch = name.includes(searchLower) || 
                           cid.includes(searchLower) || 
                           creator.includes(searchLower);
      const matchesRisk = filterRisk === 'all' || c.riskLevel === filterRisk;
      return matchesSearch && matchesRisk;
    });
  }, [cases, searchTerm, filterRisk]);

  const chartData = useMemo(() => {
    const riskCounts: Record<string, number> = {};
    const symMap: Record<string, number> = {};
    
    filteredCases.forEach(c => {
      if (c.riskLevel) {
        riskCounts[c.riskLevel] = (riskCounts[c.riskLevel] || 0) + 1;
      }
      const symptoms = Array.isArray(c.symptoms) ? c.symptoms : [];
      symptoms.forEach(s => symMap[s] = (symMap[s] || 0) + 1);
    });

    const pieData = Object.entries(riskCounts).map(([name, value]) => ({ name, value }));
    const barData = Object.entries(symMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));

    return { pieData, barData };
  }, [filteredCases]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#9f1239', '#4c0519'];

  const calculateClinicalScore = (c: any) => {
    let score = 0;
    (Array.isArray(c.history) ? c.history : []).forEach((h: string) => score += config.history[h] || 0);
    (Array.isArray(c.symptoms) ? c.symptoms : []).forEach((s: string) => score += config.symptoms[s] || 0);
    score += config.exposure[c.exposure] || 0;
    score += config.ctFeatures[c.ctFeature] || 0;
    score += config.qft[c.qftResult] || 0;
    score += config.smear[c.smearResult] || 0;
    score += config.culture[c.cultureResult] || 0;
    return score;
  };

  const exportDetailedCSV = () => {
    const targetCases = selectedIds.length > 0 
      ? filteredCases.filter(c => selectedIds.includes(c.id))
      : filteredCases;

    if (targetCases.length === 0) return alert('当前视图无数据可导出');

    const headers = [
      '档案编号(ID)', '评估日期', '录入员', '姓名', '性别', '年龄', '身高(cm)', '体重(kg)', 'BMI', 
      '既往史', '临床症状', '暴露史', '影像学特征', '标准临床分值', 'QFT结果', '痰涂片', '痰培养', 
      '系统综合分值', '风险等级', '处置建议', 'AI推理报告', 'AI融合分值', 'AI异常信号', 'AI专家处置建议', 'AI置信度'
    ];

    const rows = targetCases.map(c => {
      const rawScore = calculateClinicalScore(c);

      return [
        c.id, 
        new Date(c.timestamp).toLocaleString(), 
        c.creatorName, 
        c.name, 
        c.gender, 
        c.age, 
        c.height, 
        c.weight, 
        c.bmi,
        (Array.isArray(c.history) ? c.history : []).join('; '), 
        (Array.isArray(c.symptoms) ? c.symptoms : []).join('; '), 
        c.exposure, 
        c.ctFeature, 
        rawScore, 
        c.qftResult,
        c.smearResult, 
        c.cultureResult, 
        c.totalScore, 
        c.riskLevel, 
        c.suggestion,
        c.aiInference?.reasoning || '--',
        c.aiInference?.fusionScore || '--',
        (c.aiInference?.anomalies || []).join('; '),
        c.aiInference?.suggestedAction || '--',
        c.aiInference?.confidence ? `${(c.aiInference.confidence * 100).toFixed(1)}%` : '--'
      ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`);
    });

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TB_Inference_Analysis_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-32 relative">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-950 dark:text-white tracking-tighter mb-1 uppercase">{siteConfig.summaryPageTitle}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-black text-lg opacity-60 italic">{siteConfig.summaryPageDesc}</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={exportDetailedCSV} 
            className="flex items-center gap-3 px-10 py-4 bg-slate-950 dark:bg-emerald-600 text-white rounded-2xl font-black shadow-xl hover:scale-[1.02] transition-all group"
          >
            <FileSpreadsheet size={20} /> 
            {selectedIds.length > 0 ? `导出已选 (${selectedIds.length})` : '导出结构化比对数据'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border-2 border-slate-100 dark:border-slate-800 shadow-sm h-[380px] flex flex-col">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><PieChartIcon size={16} className="text-emerald-500" /> 风险阶梯分布</h3>
          <div className="flex-1">
            {chartData.pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData.pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                    {chartData.pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-slate-300 font-bold italic uppercase tracking-widest text-[10px]">Cloud Sync: Waiting for Data</div>}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border-2 border-slate-100 dark:border-slate-800 shadow-sm h-[380px] flex flex-col">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><BarChart3 size={16} className="text-blue-500" /> 症状统计透视</h3>
          <div className="flex-1">
            {chartData.barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.barData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-slate-300 font-bold italic uppercase tracking-widest text-[10px]">No Data Points Detected</div>}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[40px] border-2 border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden mt-8">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex flex-col md:flex-row gap-6">
          <div className="flex-1 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input type="text" placeholder="搜索受检者姓名、档案ID、操作人员..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-950 dark:text-white transition-all shadow-inner" />
          </div>
          <div className="flex items-center gap-4">
             <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)} className="px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-slate-900 dark:text-white outline-none border-2 border-transparent focus:border-emerald-500 transition-all cursor-pointer shadow-sm">
               <option value="all">所有风险分类</option>
               <option value="确诊结核病">临床确诊</option>
               <option value="极高危风险">极高危</option>
               <option value="高风险">高风险</option>
               <option value="中风险">中风险</option>
               <option value="低风险">低风险</option>
               <option value="无风险">无风险</option>
             </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="py-6 px-8 w-16 text-center">
                   <button onClick={() => setSelectedIds(selectedIds.length === filteredCases.length ? [] : filteredCases.map(c => c.id))}>{selectedIds.length === filteredCases.length && filteredCases.length > 0 ? <CheckSquare className="text-emerald-500" /> : <Square />}</button>
                </th>
                <th className="py-6 px-6">摘要与状态</th>
                <th className="py-6 px-6">Neural-Synergy (AI)</th>
                <th className="py-6 px-6 text-center">综合分值</th>
                <th className="py-6 px-8 text-right">审计管理</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredCases.map((c) => {
                const clinicalScore = calculateClinicalScore(c);

                return (
                  <React.Fragment key={c.id}>
                    <tr 
                      onClick={() => toggleExpand(c.id)}
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all cursor-pointer ${expandedId === c.id ? 'bg-indigo-50/20 dark:bg-indigo-900/10' : ''}`}
                    >
                      <td className="py-6 px-8 text-center" onClick={(e) => e.stopPropagation()}>
                        <button onClick={(e) => handleToggleSelect(c.id, e)} className={selectedIds.includes(c.id) ? 'text-emerald-500' : 'text-slate-200'}><CheckSquare size={20}/></button>
                      </td>
                      <td className="py-6 px-6">
                        <div className="flex items-center gap-3">
                          <div className="font-bold text-slate-900 dark:text-white">{c.name} ({c.gender}/{c.age}岁)</div>
                          {c.aiInference && <div className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 rounded text-[8px] font-black uppercase tracking-widest border border-indigo-500/20 flex items-center gap-1"><BrainCircuit size={10} /> Synergy v2.0</div>}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">UUID: {c.id.slice(-8)} • {new Date(c.timestamp).toLocaleDateString()}</div>
                      </td>
                      <td className="py-6 px-6">
                        {c.aiInference ? (
                          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                            <Zap size={14} className="animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest">推理引擎已对齐</span>
                          </div>
                        ) : (
                          <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">标准临床路径</div>
                        )}
                      </td>
                      <td className="py-6 px-6 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black border-2 ${c.riskLevel === '确诊结核病' ? 'bg-rose-600 border-rose-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}>
                            {c.riskLevel}
                          </span>
                          <span className="text-[14px] font-black text-slate-900 dark:text-white tracking-tighter">{c.totalScore}</span>
                        </div>
                      </td>
                      <td className="py-6 px-8 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <div className="text-slate-300">{expandedId === c.id ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}</div>
                          {(isAdmin || currentUser?.id === c.creatorId) && (
                            <>
                              <button onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/cases?edit=${c.id}`); }} className="p-2 text-slate-300 hover:text-emerald-500 transition-colors"><Edit3 size={18} /></button>
                              <button onClick={(e) => { e.stopPropagation(); if(window.confirm('警告：确认从全球数据库永久移除该病例档案？')) deleteCases([c.id]); }} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    
                    {expandedId === c.id && (
                      <tr className="bg-slate-50/30 dark:bg-slate-900/50">
                        <td colSpan={5} className="p-10 border-b border-slate-100 dark:border-slate-800">
                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                            <div className="space-y-6">
                              <div className="flex items-center gap-3">
                                <Info size={18} className="text-slate-400" />
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">临床路径结构化指标报告</h4>
                              </div>
                              <div className="grid grid-cols-2 gap-x-12 gap-y-4 bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-inner border border-slate-100 dark:border-slate-700">
                                <DetailItem label="BMI 指数" value={`${c.bmi} (${c.bmi < 18.5 ? '偏低' : c.bmi > 24 ? '偏高' : '正常'})`} />
                                <DetailItem label="影像表现识别" value={c.ctFeature || '无显著发现'} />
                                <DetailItem label="实验室检测矩阵" value={`QFT:${c.qftResult} | 涂片:${c.smearResult} | 培养:${c.cultureResult}`} />
                                <DetailItem label="临床核心症状" value={(Array.isArray(c.symptoms) ? c.symptoms : []).join(', ') || '未监测到'} />
                                <DetailItem label="高危/接触背景" value={(Array.isArray(c.history) ? c.history : []).join(', ') || '无特定背景'} />
                                <DetailItem label="录入审计人员" value={c.creatorName} />
                              </div>
                              <div className="p-6 bg-slate-950 rounded-2xl border border-white/5">
                                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">标准化临床指南建议</p>
                                 <p className="text-xs text-slate-300 italic font-medium leading-relaxed">“{c.suggestion}”</p>
                              </div>
                            </div>

                            <div className="bg-slate-950 rounded-[2.5rem] p-8 space-y-8 border border-white/5 shadow-2xl relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-[60px] rounded-full"></div>
                              <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-3">
                                  <BrainCircuit size={20} className="text-indigo-400" />
                                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Synergy 2.0 AI 深度推理</h4>
                                </div>
                                {c.aiInference && (
                                  <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                                    <ShieldCheck size={12} /> 置信评级: {(c.aiInference.confidence * 100).toFixed(0)}%
                                  </div>
                                )}
                              </div>

                              {c.aiInference ? (
                                <div className="space-y-6 relative z-10">
                                  <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                                    <div className="flex items-center gap-2 text-indigo-400">
                                      <Zap size={14} />
                                      <span className="text-[9px] font-black uppercase tracking-widest">可解释性推导链报告</span>
                                    </div>
                                    <p className="text-[12px] text-slate-300 leading-relaxed italic font-medium">“{c.aiInference.reasoning}”</p>
                                  </div>

                                  {c.aiInference.anomalies && c.aiInference.anomalies.length > 0 && (
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-2 text-rose-500">
                                        <AlertTriangle size={14} />
                                        <span className="text-[9px] font-black uppercase tracking-widest">识别到的非典型/矛盾风险点</span>
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        {c.aiInference.anomalies.map((a, i) => (
                                          <span key={i} className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-[9px] text-rose-400 font-black rounded-lg uppercase tracking-tighter">{a}</span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  <div className="bg-emerald-500/10 p-6 rounded-3xl border border-emerald-500/20 space-y-3 shadow-lg">
                                    <div className="flex items-center gap-2 text-emerald-400">
                                      <Activity size={14} />
                                      <span className="text-[9px] font-black uppercase tracking-widest">AI 增强协同建议</span>
                                    </div>
                                    <p className="text-[12px] text-slate-200 font-bold leading-relaxed">{c.aiInference.suggestedAction}</p>
                                  </div>

                                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                    <div className="flex flex-col">
                                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Fusion Score</span>
                                      <span className="text-3xl font-black text-indigo-400 tracking-tighter">{c.aiInference.fusionScore}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Clinical Guideline Score</span>
                                      <span className="text-2xl font-black text-slate-400 tracking-tighter">{clinicalScore}</span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="py-24 text-center space-y-6">
                                  <Zap size={48} className="text-slate-800 mx-auto opacity-10" />
                                  <p className="text-[11px] text-slate-600 font-black uppercase tracking-[0.3em] max-w-[220px] mx-auto leading-relaxed">该病例档案尚未激活 Synergy v2.0 决策引擎，建议重新评估以获取深度分析报告</p>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/cases?edit=${c.id}`); }}
                                    className="px-8 py-3 bg-indigo-600/10 text-indigo-400 rounded-full text-[10px] font-black shadow-xl hover:bg-indigo-600 hover:text-white transition-all border border-indigo-600/20 uppercase tracking-widest"
                                  >
                                    启动协同推理
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filteredCases.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-40 text-center">
                    <PieChartIcon size={64} className="text-slate-100 dark:text-slate-900 mx-auto mb-6 opacity-10" />
                    <p className="text-slate-400 font-black text-sm uppercase tracking-[0.4em]">Cloud: Empty Database</p>
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

const DetailItem = ({ label, value }: { label: string, value: string | number }) => (
  <div className="space-y-1">
    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</div>
    <div className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate">{value}</div>
  </div>
);

export default CaseSummaryPage;
