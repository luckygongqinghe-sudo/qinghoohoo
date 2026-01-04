
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store.tsx';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Search, Trash2, Edit3, CheckSquare, PieChart as PieChartIcon,
  FileSpreadsheet, BarChart3, ChevronDown, ChevronUp, BrainCircuit,
  Sparkles, AlertTriangle, Stethoscope, FlaskConical, Loader2,
  CheckCircle2, Clock, Play, AlertCircle, History, Info, Users, ShieldAlert,
  Zap, Key, ShieldCheck, Scale, TrendingUp, ArrowRight, Download,
  ExternalLink, FileCheck, Layers, Terminal
} from 'lucide-react';

import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';

const CaseSummaryPage: React.FC = () => {
  const { cases, currentUser, deleteCases, config, updateCase } = useStore();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState({ current: 0, total: 0 });

  const isAdmin = currentUser?.username === 'qinghoohoo';

  const filteredCases = useMemo(() => {
    if (!Array.isArray(cases)) return [];
    return cases.filter(c => {
      const searchLower = (searchTerm || '').toLowerCase();
      const matchesSearch = (c.name || '').toLowerCase().includes(searchLower) || (c.id || '').toLowerCase().includes(searchLower);
      const matchesRisk = filterRisk === 'all' || c.riskLevel === filterRisk;
      return matchesSearch && matchesRisk;
    });
  }, [cases, searchTerm, filterRisk]);

  const cleanAndParseJson = (text: string) => {
    try {
      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (e) {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try { return JSON.parse(match[0]); } catch { return null; }
      }
      return null;
    }
  };

  const performInference = async (target: any) => {
    setProcessingIds(prev => new Set(prev).add(target.id));

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `你是一位结核病防治专家。请基于以下受检者数据进行临床逻辑协同推理。
      
      【受检者画像】：${target.name}, 性别 ${target.gender}, 年龄 ${target.age}
      【临床指征】：BMI ${target.bmi}, 暴露史 ${target.exposure}, 既往史 ${target.history?.join(',') || '无'}, 症状 ${target.symptoms?.join(',') || '无'}
      【影像CT】：${target.ctFeature}
      【实验室指标】：Xpert(${target.molecularResult}), 涂片(${target.smearResult}), 培养(${target.cultureResult}), QFT(${target.qftResult})
      【当前指南评分】：${target.totalScore}
      
      任务：
      1. 分析上述指标间的逻辑相关性（识别非典型矛盾点，如强症状但痰检阴性）。
      2. 给出融合修正评分 fusionScore（基于专家经验调整指南分）。
      3. 给出详细的推导逻辑 reasoning（要求思维链严密）。
      4. 给出临床干预建议 suggestedAction。
      
      必须返回标准 JSON 格式。`;

      let response;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: [{ parts: [{ text: prompt }] }],
          config: {
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 20000 },
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                reasoning: { type: Type.STRING },
                fusionScore: { type: Type.NUMBER },
                anomalies: { type: Type.ARRAY, items: { type: Type.STRING } },
                suggestedAction: { type: Type.STRING },
                confidence: { type: Type.NUMBER }
              },
              required: ["reasoning", "fusionScore", "anomalies", "suggestedAction", "confidence"]
            }
          }
        });
      } catch (proErr) {
        response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: [{ parts: [{ text: prompt }] }],
          config: { responseMimeType: "application/json" }
        });
      }

      const aiData = cleanAndParseJson(response.text || '{}');
      
      if (aiData && typeof aiData.fusionScore === 'number') {
        const originalScore = target.originalScore !== undefined ? target.originalScore : target.totalScore;
        
        let newRiskLevel = target.riskLevel;
        const isPathogenPositive = target.smearResult === '阳性' || target.cultureResult === '阳性' || target.molecularResult === '阳性';
        
        if (isPathogenPositive) {
          newRiskLevel = '确诊结核病';
        } else {
          const sortedThresholds = [...config.thresholds].sort((a,b) => b.min - a.min);
          const match = sortedThresholds.find(t => aiData.fusionScore >= t.min && t.level !== '确诊结核病');
          newRiskLevel = match?.level || '无风险';
        }

        await updateCase(target.id, { 
          ...target, 
          originalScore, 
          aiInference: aiData,
          totalScore: aiData.fusionScore,
          riskLevel: newRiskLevel,
          suggestion: aiData.suggestedAction || target.suggestion,
          timestamp: Date.now() // 更新时间戳以触发 [New AI] 标记
        });
      }
    } catch (err: any) {
      console.error(`Inference failed for ${target.id}:`, err);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(target.id);
        return next;
      });
    }
  };

  const runBatchInference = async () => {
    const targetsToProcess = selectedIds.length > 0 
      ? filteredCases.filter(c => selectedIds.includes(c.id))
      : filteredCases.filter(c => !c.aiInference);

    if (targetsToProcess.length === 0) {
      alert('当前视图内没有待处理的病例。');
      return;
    }

    if (!confirm(`准备启动针对 ${targetsToProcess.length} 个病例的顺序推理。过程中请勿刷新页面。`)) return;

    setIsBatchProcessing(true);
    setProcessProgress({ current: 0, total: targetsToProcess.length });

    for (let i = 0; i < targetsToProcess.length; i++) {
      setProcessProgress(p => ({ ...p, current: i + 1 }));
      try {
        await performInference(targetsToProcess[i]);
        await new Promise(r => setTimeout(r, 1200));
      } catch (err) {
        console.error("Batch failure:", err);
      }
    }
    
    setIsBatchProcessing(false);
    setSelectedIds([]);
    alert('批量协同推理已执行完毕。');
  };

  const handleExportStructuredData = () => {
    if (filteredCases.length === 0) {
      alert('列表无数据。');
      return;
    }

    const headers = [
      '档案ID', '姓名', '性别', '年龄', 'BMI', 
      '典型症状', '既往病史', '暴露背景', 'CT特征', 
      '分子检测(Xpert)', '痰涂片', '痰培养', 'QFT免疫',
      '指南原始分', 'AI修正分', '分值偏移', 'AI逻辑审计', '临床决策建议'
    ];

    const rows = filteredCases.map(c => {
      const original = c.originalScore ?? c.totalScore;
      const delta = c.aiInference ? (c.totalScore - original) : 0;
      return [
        c.id,
        c.name,
        c.gender,
        c.age,
        c.bmi,
        (c.symptoms || []).join(';'),
        (c.history || []).join(';'),
        c.exposure,
        c.ctFeature,
        c.molecularResult,
        c.smearResult,
        c.cultureResult,
        c.qftResult,
        original,
        c.totalScore,
        delta > 0 ? `+${delta}` : delta,
        c.aiInference?.reasoning?.replace(/[\r\n,]/g, ' ') || '未执行',
        (c.aiInference?.suggestedAction || c.suggestion).replace(/[\r\n,]/g, ' ')
      ];
    });

    const csvContent = "\ufeff" + [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `TB_Structured_Analysis_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = useMemo(() => {
    const riskCounts: Record<string, number> = {};
    const symMap: Record<string, number> = {};
    filteredCases.forEach(c => {
      riskCounts[c.riskLevel] = (riskCounts[c.riskLevel] || 0) + 1;
      (c.symptoms || []).forEach(s => symMap[s] = (symMap[s] || 0) + 1);
    });
    return {
      pieData: Object.entries(riskCounts).map(([name, value]) => ({ name, value })),
      barData: Object.entries(symMap).sort((a,b) => b[1]-a[1]).slice(0, 6).map(([name, count]) => ({ name, count }))
    };
  }, [filteredCases]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#9333ea', '#64748b'];

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-32">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
        <div>
          <h1 className="text-4xl font-black text-slate-950 dark:text-white tracking-tighter uppercase mb-1">决策协同中心</h1>
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-indigo-500" />
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Management & Logic Audit Control</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={handleExportStructuredData}
            className="flex items-center gap-3 px-8 py-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest border border-slate-100 dark:border-slate-800 shadow-xl hover:bg-slate-50 transition-all"
          >
            <FileSpreadsheet size={16} className="text-emerald-500" /> 导出结构化分析报告
          </button>
          {isAdmin && (
            <button 
              onClick={runBatchInference} 
              disabled={isBatchProcessing}
              className={`flex items-center gap-3 px-10 py-4 rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-2xl transition-all group ${isBatchProcessing ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-950 text-white hover:scale-[1.02]'}`}
            >
              {isBatchProcessing ? <Loader2 className="animate-spin" size={16}/> : <BrainCircuit size={16} className="text-indigo-400" />}
              批量协同推理 ({selectedIds.length > 0 ? `已选${selectedIds.length}` : '全量未覆盖'})
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm h-[400px] flex flex-col relative overflow-hidden group">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <PieChartIcon size={16} className="text-emerald-500" /> 病例风险分布图
            </h3>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData.pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                {chartData.pieData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm h-[400px] flex flex-col">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
            <BarChart3 size={16} className="text-blue-500" /> 临床指征热力分析
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.barData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
              <Tooltip cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="p-10 border-b border-slate-50 dark:border-slate-800 flex flex-col md:flex-row gap-8">
          <div className="flex-1 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input 
              type="text" 
              placeholder="搜索受检者姓名或存档ID..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-800 rounded-[2rem] font-black text-sm text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-inner" 
            />
          </div>
          <select 
            value={filterRisk}
            onChange={e => setFilterRisk(e.target.value)}
            className="px-8 py-5 bg-slate-50 dark:bg-slate-800 rounded-[2rem] font-black text-sm text-slate-900 dark:text-white outline-none cursor-pointer border-none shadow-inner"
          >
            <option value="all">所有风险定级</option>
            {config.thresholds.map(t => <option key={t.id} value={t.level}>{t.level}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="py-8 px-4 w-12 text-center">#</th>
                <th className="py-8 px-8 w-16 text-center">选择</th>
                <th className="py-8 px-6">受检者档案</th>
                <th className="py-8 px-6 text-center">分值演化 (指南 → AI)</th>
                <th className="py-8 px-6 text-center">风险评定</th>
                <th className="py-8 px-8 text-right">协同操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800 font-sans">
              {filteredCases.map((c, idx) => {
                const isNewAi = c.aiInference && (Date.now() - c.timestamp < 1000 * 60 * 60 * 24);
                const isAdjusted = c.aiInference && (c.totalScore !== (c.originalScore ?? c.totalScore));
                const original = c.originalScore ?? c.totalScore;

                return (
                  <React.Fragment key={c.id}>
                    <tr 
                      onClick={() => expandedId === c.id ? setExpandedId(null) : setExpandedId(c.id)}
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all cursor-pointer group/row ${expandedId === c.id ? 'bg-indigo-50/20' : ''}`}
                    >
                      <td className="py-8 px-4 text-center text-[10px] font-black text-slate-400">{idx + 1}</td>
                      <td className="py-8 px-8 text-center" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIds(prev => prev.includes(c.id) ? prev.filter(i => i !== c.id) : [...prev, c.id]);
                          }}
                          className={`transition-all ${selectedIds.includes(c.id) ? 'text-indigo-600' : 'text-slate-200 group-hover/row:text-slate-300'}`}
                        >
                          <CheckSquare size={20}/>
                        </button>
                      </td>
                      <td className="py-8 px-6">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 dark:text-white text-lg">{c.name}</span>
                            <span className="text-slate-400 font-bold text-sm">({c.gender}/{c.age}岁)</span>
                            {isNewAi && <span className="px-2 py-0.5 bg-indigo-500 text-white text-[8px] font-black rounded-full uppercase tracking-widest animate-pulse">New AI</span>}
                            {isAdjusted && <span className="px-2 py-0.5 bg-amber-500 text-white text-[8px] font-black rounded-full uppercase tracking-widest">分值修正</span>}
                          </div>
                          <div className="text-[9px] text-slate-400 font-black tracking-widest mt-1.5 uppercase opacity-60 flex items-center gap-2">
                             <Terminal size={10} /> ARCHIVE: {c.id}
                          </div>
                        </div>
                      </td>
                      <td className="py-8 px-6 text-center">
                        <div className="flex items-center justify-center gap-4">
                          <div className="flex flex-col items-center">
                             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Guide</span>
                             <span className="text-sm font-black text-slate-500">{original}</span>
                          </div>
                          {c.aiInference ? (
                            <>
                              <ArrowRight size={14} className="text-slate-300 group-hover/row:translate-x-1 transition-transform" />
                              <div className="flex flex-col items-center">
                                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Synergy</span>
                                <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800 shadow-sm">
                                  {c.totalScore}
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center opacity-30">
                              <span className="text-[8px] font-black uppercase tracking-widest mb-1">Synergy</span>
                              <div className="w-10 h-6 bg-slate-100 rounded-lg" />
                            </div>
                          )}
                          {processingIds.has(c.id) && <Loader2 size={16} className="animate-spin text-indigo-500" />}
                        </div>
                      </td>
                      <td className="py-8 px-6 text-center">
                        <div className={`px-6 py-2 rounded-full text-[10px] font-black inline-block shadow-sm ${
                          c.riskLevel === '确诊结核病' ? 'bg-rose-600 text-white shadow-rose-200' : 
                          c.riskLevel === '极高危风险' ? 'bg-amber-500 text-white shadow-amber-200' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-600'
                        }`}>
                          {c.riskLevel}
                        </div>
                      </td>
                      <td className="py-8 px-8 text-right">
                        <div className="flex items-center justify-end gap-3 text-slate-300">
                           <button 
                            onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/cases?edit=${c.id}`); }}
                            className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-2xl hover:text-indigo-600 transition-all border border-transparent hover:border-indigo-100"
                           >
                            <Edit3 size={18}/>
                           </button>
                           {isAdmin && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); if(confirm('确认永久删除此档案？')) deleteCases([c.id]); }}
                              className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-2xl hover:text-rose-500 transition-all border border-transparent hover:border-rose-100"
                            >
                              <Trash2 size={18}/>
                            </button>
                           )}
                           <div className="p-3 text-slate-300">
                             {expandedId === c.id ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                           </div>
                        </div>
                      </td>
                    </tr>
                    {expandedId === c.id && (
                      <tr className="bg-slate-50/30 dark:bg-slate-900/40 animate-in slide-in-from-top-4 duration-500">
                        <td colSpan={6} className="p-12">
                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                            <div className="space-y-10">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-5">
                                <FileCheck size={18} className="text-emerald-500"/> 录入临床证据清单 Clinical Evidence
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-8 bg-white dark:bg-slate-800 p-10 rounded-[3rem] shadow-xl border border-slate-50 dark:border-slate-700">
                                <DetailItem label="BMI (体质指数)" value={c.bmi || '--'} sub={c.bmi < 18.5 ? '体重偏低风险' : '正常'} />
                                <DetailItem label="CT 影像特征" value={c.ctFeature} />
                                <DetailItem label="分子检测(Xpert)" value={c.molecularResult} />
                                <DetailItem label="痰涂片" value={c.smearResult} />
                                <DetailItem label="痰培养" value={c.cultureResult} />
                                <DetailItem label="QFT 免疫" value={c.qftResult} />
                                <DetailItem label="录入时间" value={new Date(c.timestamp).toLocaleString()} />
                              </div>
                              <div className="p-8 bg-slate-900 rounded-[2.5rem] border border-white/5 text-white/90">
                                  <div className="flex items-center gap-3 mb-4 opacity-50">
                                    <Users size={16}/>
                                    <span className="text-[10px] font-black uppercase tracking-widest">流行病学与暴露史</span>
                                  </div>
                                  <p className="text-sm font-bold leading-relaxed">{c.exposure}</p>
                                  {c.history?.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-2">
                                      {c.history.map(h => <span key={h} className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black border border-white/5">{h}</span>)}
                                    </div>
                                  )}
                              </div>
                            </div>
                            
                            <div className="bg-slate-950 rounded-[4rem] p-12 space-y-10 border border-white/10 shadow-3xl relative overflow-hidden">
                               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full"></div>
                               <div className="flex items-center justify-between relative z-10">
                                 <div className="flex items-center gap-4">
                                   <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-indigo-500/20 shadow-2xl">
                                     <BrainCircuit size={24} className="text-white" />
                                   </div>
                                   <div>
                                      <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em]">专家级逻辑协同审计</h4>
                                      <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1">Multi-Model Synergy AuditChain</p>
                                   </div>
                                 </div>
                               </div>
                               
                               {c.aiInference ? (
                                 <div className="space-y-8 relative z-10">
                                   <div className="grid grid-cols-3 gap-6">
                                      <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 text-center flex flex-col justify-center">
                                        <span className="text-[8px] font-black text-slate-500 uppercase block mb-2">指南得分</span>
                                        <span className="text-3xl font-black text-slate-300">{original}</span>
                                      </div>
                                      <div className="flex flex-col items-center justify-center">
                                        <div className={`px-4 py-2 rounded-full text-[10px] font-black flex items-center gap-2 ${isAdjusted ? (c.totalScore > original ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400') : 'bg-slate-800 text-slate-500'}`}>
                                          {isAdjusted ? (c.totalScore > original ? <TrendingUp size={14}/> : <TrendingUp size={14} className="rotate-180"/>) : <Clock size={14}/>}
                                          {isAdjusted ? (c.totalScore - original > 0 ? `+${c.totalScore - original}` : c.totalScore - original) : '维持'}
                                        </div>
                                      </div>
                                      <div className="p-8 bg-indigo-600/10 rounded-[2.5rem] border border-indigo-500/20 text-center flex flex-col justify-center shadow-lg shadow-indigo-900/20">
                                        <span className="text-[8px] font-black text-indigo-400 uppercase block mb-2">AI 协同分</span>
                                        <span className="text-3xl font-black text-indigo-400">{c.totalScore}</span>
                                      </div>
                                   </div>

                                   {c.aiInference.anomalies?.length > 0 && (
                                     <div className="bg-rose-600/10 p-8 rounded-[3rem] border border-rose-500/20">
                                       <span className="text-[10px] font-black text-rose-400 uppercase block mb-4 flex items-center gap-2">
                                         <ShieldAlert size={16} /> 识别到的临床矛盾分析
                                       </span>
                                       <ul className="space-y-3">
                                         {c.aiInference.anomalies.map((a, i) => (
                                           <li key={i} className="text-[12px] text-slate-100 font-medium flex items-start gap-3 italic leading-relaxed">
                                             <span className="mt-2 w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 shadow-[0_0_10px_#f43f5e]"></span>
                                             {a}
                                           </li>
                                         ))}
                                       </ul>
                                     </div>
                                   )}
                                   
                                   <div className="space-y-4">
                                      <div className="bg-white/5 p-8 rounded-[3rem] border border-white/5 relative group/logic">
                                        <span className="text-[10px] font-black text-indigo-400 uppercase mb-3 block tracking-widest flex items-center gap-2">
                                          <Terminal size={14}/> 深度思维链推导 Reasoning
                                        </span>
                                        <p className="text-[12px] text-slate-300 leading-relaxed italic font-medium">“{c.aiInference.reasoning}”</p>
                                      </div>
                                      
                                      <div className="bg-emerald-600/10 p-8 rounded-[3rem] border border-emerald-500/20">
                                        <span className="text-[10px] font-black text-emerald-400 uppercase mb-2 block tracking-widest">专家组临床协议建议</span>
                                        <p className="text-[13px] text-white font-black leading-relaxed">{c.aiInference.suggestedAction}</p>
                                      </div>
                                   </div>
                                 </div>
                               ) : processingIds.has(c.id) ? (
                                 <div className="py-32 text-center relative z-10 space-y-6">
                                   <Loader2 size={48} className="mx-auto text-indigo-500 animate-spin" />
                                   <div className="space-y-2">
                                      <p className="text-[12px] text-indigo-400 font-black uppercase tracking-[0.3em]">深度逻辑矩阵计算中...</p>
                                      <p className="text-[10px] text-slate-600 font-bold uppercase">Synthesizing clinical evidence across models</p>
                                   </div>
                                 </div>
                               ) : (
                                 <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-[4rem] relative z-10 flex flex-col items-center">
                                   <AlertCircle size={40} className="text-slate-800 mb-6" />
                                   <p className="text-[11px] text-slate-600 font-black uppercase tracking-widest mb-10">当前尚未启动全维度协同推理</p>
                                   {isAdmin && (
                                     <button 
                                      onClick={(e) => { e.stopPropagation(); performInference(c); }}
                                      className="px-12 py-5 bg-indigo-600 text-white rounded-full text-[11px] font-black uppercase tracking-[0.2em] hover:bg-indigo-500 shadow-3xl shadow-indigo-600/20 active:scale-95 transition-all"
                                     >
                                       启动单例 AI 审计
                                     </button>
                                   )}
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
            </tbody>
          </table>
        </div>
      </div>
      
      {isBatchProcessing && (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-xl flex items-center justify-center p-8">
           <div className="bg-slate-900 text-white p-12 rounded-[4rem] shadow-3xl border border-white/10 flex flex-col items-center gap-10 min-w-[500px] animate-in zoom-in-95 duration-500">
             <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-indigo-600/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Loader2 className="animate-spin text-indigo-400" size={40} />
                </div>
                <h3 className="text-xl font-black uppercase tracking-[0.3em]">全维度协同审计中</h3>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">请勿关闭浏览器，系统正在跨模态对齐临床指征...</p>
             </div>

             <div className="w-full space-y-4">
                <div className="w-full bg-white/5 h-4 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-1000 ease-out shadow-[0_0_25px_#6366f1]" 
                    style={{ width: `${(processProgress.current / processProgress.total) * 100}%` }} 
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                  <span>进度: {processProgress.current} / {processProgress.total}</span>
                  <span className="text-indigo-400 italic">正在解析临床快照</span>
                </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

const DetailItem = ({ label, value, sub }: { label: string, value: string | number, sub?: string }) => (
  <div className="space-y-2">
    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</div>
    <div className="text-[13px] font-black text-slate-950 dark:text-white truncate">{value}</div>
    {sub && <div className="text-[8px] font-bold text-indigo-400 uppercase tracking-wider">{sub}</div>}
  </div>
);

export default CaseSummaryPage;
