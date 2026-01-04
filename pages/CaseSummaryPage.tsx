
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store.tsx';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Search, Trash2, Edit3, 
  FileSpreadsheet, BrainCircuit,
  AlertTriangle, Loader2, Play, 
  Users, TrendingUp, Activity,
  ArrowRight, MoreHorizontal, ChevronDown, AlertCircle,
  Stethoscope, Download, Zap, ClipboardList, Cpu,
  CheckCircle2
} from 'lucide-react';
import { Case } from '../types.ts';

const CaseSummaryPage: React.FC = () => {
  const { cases, currentUser, deleteCases, config, updateCase, batchStatus, setBatchStatus } = useStore();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const isAdmin = currentUser?.username === 'qinghoohoo';

  const maskName = (name: string) => {
    if (isAdmin) return name;
    if (!name || name.length < 2) return name;
    return `${name[0]}*${name[name.length - 1]}`;
  };

  const filteredCases = useMemo(() => {
    return (cases || []).filter(c => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = (c.name || '').toLowerCase().includes(search) || (c.id || '').toLowerCase().includes(search);
      const matchesRisk = filterRisk === 'all' || c.riskLevel === filterRisk;
      return matchesSearch && matchesRisk;
    });
  }, [cases, searchTerm, filterRisk]);

  const stats = useMemo(() => {
    const total = cases.length;
    if (total === 0) return { total: 0, highRisk: '0%', aiCover: '0%' };
    const high = cases.filter(c => ['高风险', '极高危风险', '确诊结核病'].includes(c.riskLevel)).length;
    const ai = cases.filter(c => c.aiInference).length;
    return {
      total,
      highRisk: `${((high / total) * 100).toFixed(1)}%`,
      aiCover: `${((ai / total) * 100).toFixed(1)}%`
    };
  }, [cases]);

  // 深度导出单例临床报告 (详细全面版)
  const exportSingleReport = (c: Case) => {
    const impactFactorsStr = c.aiInference?.impactFactors?.map(f => 
      `  - ${f.feature}: ${f.impact > 0 ? '+' : ''}${f.impact}分 (${f.reason})`
    ).join('\n') || '  (无权重分配细节)';

    const anomaliesStr = c.aiInference?.anomalies?.map(a => `  [!] ${a}`).join('\n') || '  (未识别到明显逻辑冲突)';

    const reportContent = `
=========================================
      结核病精准筛查深度分析报告
=========================================
【报告基础信息】
报告编号: ${c.id}
打印医师: ${currentUser?.username || '系统'}
导出时间: ${new Date().toLocaleString()}
系统版本: TB-Scan 协同中心 v3.1

【1. 受检者结构化档案】
姓名: ${c.name}
性别: ${c.gender}
年龄: ${c.age} 岁
身高/体重: ${c.height}cm / ${c.weight}kg
BMI 指数: ${c.bmi} (${c.bmi < 18.5 ? '体重过低 - 预警' : '正常'})

【2. 临床指征清单】
既往病史: ${c.history?.join('; ') || '无'}
典型症状: ${c.symptoms?.join('; ') || '无'}
暴露接触史: ${c.exposure}
影像学(CT)征象: ${c.ctFeatures?.join(', ') || '阴性/未发现'}
分子检测(Xpert): ${c.molecularResult}
痰涂片结果: ${c.smearResult}
痰培养结果: ${c.cultureResult}
免疫学(QFT): ${c.qftResult}

【3. AI 专家协同审计结果】
指南共识原始分: ${c.originalScore ?? c.totalScore}
专家协同修正分: ${c.totalScore}
最终风险评级: ${c.riskLevel}
模型置信度: ${c.aiInference?.confidence ? (c.aiInference.confidence * 100).toFixed(2) + '%' : '暂无'}

【4. 推理权重审计】
${impactFactorsStr}

【5. 临床逻辑矛盾审计】
${anomaliesStr}

【6. 专家思维链】
${c.aiInference?.reasoning || '未生成 AI 深度推理链'}

【7. 协议化处置建议】
${c.aiInference?.suggestedAction || c.suggestion || '建议结合临床进一步观察，必要时进行动态随访。'}

-----------------------------------------
注：本报告由 AI 辅助决策系统生成，仅供临床医师参考。
=========================================
    `;
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `结核病深度报告_${c.name}_${c.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 批量导出 CSV (包含 AI 数据列)
  const exportBatchCSV = () => {
    if (filteredCases.length === 0) return;
    const headers = [
      '档案ID', '姓名', '性别', '年龄', 'BMI', 
      '影像学征象', '分子检测', '痰涂片', '痰培养', 'QFT', 
      '症状', '暴露史', '指南原始分', 'AI修正分', 
      '风险等级', 'AI置信度', 'AI审计建议', 'AI逻辑链'
    ];
    
    const rows = filteredCases.map(c => [
      c.id, 
      c.name, 
      c.gender, 
      c.age, 
      c.bmi, 
      `"${(c.ctFeatures || []).join(';')}"`, 
      c.molecularResult, 
      c.smearResult, 
      c.cultureResult, 
      c.qftResult,
      `"${(c.symptoms || []).join(';')}"`,
      c.exposure,
      c.originalScore || c.totalScore, 
      c.totalScore, 
      c.riskLevel,
      c.aiInference?.confidence ? `${(c.aiInference.confidence * 100).toFixed(2)}%` : 'N/A',
      `"${(c.aiInference?.suggestedAction || c.suggestion || '').replace(/"/g, '""')}"`,
      `"${(c.aiInference?.reasoning || '').replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `结核病筛查数据批量导出_${new Date().getTime()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const performInference = async (target: any) => {
    setProcessingIds(prev => new Set(prev).add(target.id));
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `结核病防治专家协同推理系统。请使用中文回答所有字段。
      受检者：${target.name}, 年龄 ${target.age}, BMI ${target.bmi}。
      指南原始分：${target.totalScore}。
      当前影像学征象：[${(target.ctFeatures || []).join(', ')}]。
      实验室检测指标：Xpert/分子 ${target.molecularResult}, 痰涂片 ${target.smearResult}, 痰培养 ${target.cultureResult}, QFT ${target.qftResult}。
      
      请执行以下任务：
      1. 执行【多模型逻辑追踪】逻辑审计。
      2. 识别临床数据间的冲突（例如BMI极低但病原学阴性的逻辑悖论）。
      3. 计算修正后的 协同分值 (fusionScore)。
      4. 为每个特征分配推理权重 (impactFactors)，并说明理由。
      5. 提供基于最新指南的【建议协议化处置方案】(suggestedAction)。
      
      必须返回标准 JSON 响应。`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 20000 },
          responseSchema: {
            type: Type.OBJECT,
            properties: { 
              reasoning: { type: Type.STRING }, 
              fusionScore: { type: Type.NUMBER }, 
              suggestedAction: { type: Type.STRING }, 
              confidence: { type: Type.NUMBER }, 
              anomalies: { type: Type.ARRAY, items: { type: Type.STRING } },
              impactFactors: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT, 
                  properties: { 
                    feature: { type: Type.STRING }, 
                    impact: { type: Type.NUMBER }, 
                    reason: { type: Type.STRING } 
                  } 
                } 
              } 
            }
          }
        }
      });
      const aiData = JSON.parse(response.text || '{}');
      if (aiData.fusionScore !== undefined) {
        const original = target.originalScore ?? target.totalScore;
        await updateCase(target.id, { 
          ...target, 
          originalScore: original, 
          aiInference: aiData, 
          totalScore: aiData.fusionScore, 
          timestamp: Date.now() 
        });
      }
    } catch (e) { console.error("推理失败:", e); }
    finally { setProcessingIds(prev => { const n = new Set(prev); n.delete(target.id); return n; }); }
  };

  const runBatchInference = async () => {
    const targets = filteredCases.filter(c => !c.aiInference);
    if (targets.length === 0) return alert("当前视图中所有病例均已完成专家审计。");
    setBatchStatus({ isProcessing: true, current: 0, total: targets.length });
    for (let i = 0; i < targets.length; i++) {
      setBatchStatus({ current: i + 1 });
      await performInference(targets[i]);
    }
    setBatchStatus({ isProcessing: false });
  };

  return (
    <div className="space-y-10 pb-32 animate-in fade-in duration-500 text-slate-900">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: '档案总数', val: stats.total, icon: Users, color: 'text-slate-900', bg: 'bg-white' },
          { label: '高危群体占比', val: stats.highRisk, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'AI 协同覆盖率', val: stats.aiCover, icon: BrainCircuit, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} p-8 rounded-[2.5rem] border border-slate-100 flex flex-col justify-between h-40 shadow-sm transition-all hover:shadow-md`}>
             <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{s.label}</span>
             <span className={`text-4xl font-black ${s.color} tracking-tighter`}>{s.val}</span>
          </div>
        ))}
      </div>

      {/* 控制条 + 批量处理后台动画 */}
      <div className="bg-slate-950 p-8 rounded-[3rem] shadow-2xl flex flex-col items-center justify-between text-white overflow-hidden relative gap-6 min-h-[140px]">
        {/* 背景扫描动画 - 仅在处理中显示 */}
        {batchStatus.isProcessing && (
          <div className="absolute inset-0 z-0 overflow-hidden opacity-30 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-[scan_2s_ease-in-out_infinite]"></div>
            <div className="absolute inset-0 flex items-center justify-around">
               {[...Array(6)].map((_, i) => (
                 <div key={i} className="w-px h-full bg-indigo-500/20 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }}></div>
               ))}
            </div>
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-600/20 blur-[100px] rounded-full animate-pulse"></div>
          </div>
        )}

        <div className="absolute top-0 right-0 p-4 opacity-10"><Zap size={100} className="text-white" /></div>
        
        <div className="w-full flex flex-col lg:flex-row items-center justify-between relative z-10 gap-6">
          <div className="text-center lg:text-left">
            <h3 className="text-lg font-black tracking-tight uppercase flex items-center gap-3 justify-center lg:justify-start">
              {batchStatus.isProcessing && <Cpu className="text-indigo-400 animate-spin" size={20} />}
              结构化数据与协同中心
            </h3>
            <p className="text-indigo-400 text-[10px] uppercase font-black tracking-widest mt-1">多模型协同审计中心 v3.1</p>
          </div>

          {/* 进度条动画 */}
          {batchStatus.isProcessing && (
            <div className="flex-1 max-w-md w-full px-6">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">正在并发计算临床语义...</span>
                <span className="text-xs font-black text-white">{batchStatus.current} / {batchStatus.total}</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)] transition-all duration-500 ease-out"
                  style={{ width: `${(batchStatus.current / batchStatus.total) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="flex gap-4 relative z-10 w-full lg:w-auto">
            <button onClick={exportBatchCSV} className="flex-1 lg:flex-none px-8 py-4 bg-slate-800 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-xl hover:bg-slate-700 transition-all">
              <FileSpreadsheet size={16}/> 导出结构化分析报告 (CSV)
            </button>
            <button onClick={runBatchInference} disabled={batchStatus.isProcessing} className="flex-1 lg:flex-none px-8 py-4 bg-indigo-600 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-xl hover:scale-105 transition-all disabled:opacity-50">
              {batchStatus.isProcessing ? <Loader2 className="animate-spin" size={16}/> : <Play size={16}/>} 批量协同推理 (仅未完成项)
            </button>
          </div>
        </div>
      </div>

      {/* 搜索过滤 */}
      <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
        <div className="p-10 border-b flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input placeholder="档案检索 (姓名/ID)..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 py-5 bg-slate-50 rounded-[2rem] font-black text-sm outline-none shadow-inner text-slate-900" />
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)} className="px-8 py-5 bg-slate-50 rounded-[2rem] font-black text-[11px] uppercase tracking-widest outline-none border-none shadow-inner min-w-[200px] text-slate-900">
              <option value="all">全风险维度</option>
              {config.thresholds.map(t => <option key={t.id} value={t.level}>{t.level}</option>)}
            </select>
          </div>
        </div>

        {/* 表格视图 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b">
                <th className="py-8 px-6 text-center w-16">#</th>
                <th className="py-8 px-6">受检者档案摘要</th>
                <th className="py-8 px-6 text-center">审计偏移 (指南 → AI)</th>
                <th className="py-8 px-6 text-center w-48">风险定级</th>
                <th className="py-8 px-10 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-sans">
              {filteredCases.map((c, index) => (
                <React.Fragment key={c.id}>
                  {/* 行摘要 */}
                  <tr onClick={() => setExpandedId(expandedId === c.id ? null : c.id)} className="hover:bg-slate-50/20 cursor-pointer group transition-all">
                    <td className="py-8 px-6 text-center font-black text-slate-400 text-xs">{index + 1}</td>
                    <td className="py-8 px-6">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                          <span className="font-black text-slate-900 text-lg leading-none">{maskName(c.name)} ({c.gender}/{c.age}岁)</span>
                          {/* AI 状态标记 */}
                          {c.aiInference ? (
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[8px] font-black uppercase tracking-widest flex items-center gap-1 border border-indigo-100/50 whitespace-nowrap">
                              <CheckCircle2 size={10} /> 已协同
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-200/50 rounded-md text-[8px] font-black uppercase tracking-widest flex items-center gap-1 whitespace-nowrap">
                              <AlertCircle size={10} /> AI 待协同
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-wider">档案编号: {c.id}</span>
                      </div>
                    </td>
                    <td className="py-8 px-6 text-center">
                      <div className="flex items-center justify-center gap-4">
                        <div className="flex flex-col items-center">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">指南分值</span>
                          <span className="text-lg font-black text-slate-400">{c.originalScore ?? c.totalScore}</span>
                        </div>
                        <ArrowRight size={14} className="text-slate-300" />
                        <div className="flex flex-col items-center p-3 bg-indigo-50 rounded-2xl border border-indigo-100/50">
                          <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">专家协同分</span>
                          <span className="text-xl font-black text-indigo-600">{c.totalScore}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-8 px-6 text-center w-48">
                       <span className={`inline-flex items-center justify-center px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.1em] whitespace-nowrap ${c.riskLevel === '确诊结核病' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                         {c.riskLevel}
                       </span>
                    </td>
                    <td className="py-8 px-10 text-right">
                      <div className="flex justify-end gap-3">
                        <button onClick={(e) => {e.stopPropagation(); exportSingleReport(c);}} title="导出报告" className="p-3 bg-white border border-slate-100 rounded-xl hover:text-emerald-600 transition-all text-slate-400"><Download size={18}/></button>
                        <button onClick={(e) => {e.stopPropagation(); navigate(`/dashboard/cases?edit=${c.id}`);}} className="p-3 bg-white border border-slate-100 rounded-xl hover:text-indigo-600 transition-all text-slate-400"><Edit3 size={18}/></button>
                        <button onClick={(e) => {e.stopPropagation(); if(confirm('确认删除此档案？')) deleteCases([c.id]);}} className="p-3 bg-white border border-slate-100 text-slate-400 rounded-xl hover:text-rose-600 transition-all"><Trash2 size={18}/></button>
                        <ChevronDown size={20} className={`text-slate-300 transition-transform ${expandedId === c.id ? 'rotate-180' : ''}`} />
                      </div>
                    </td>
                  </tr>

                  {/* 核心详情展示区 */}
                  {expandedId === c.id && (
                    <tr className="bg-[#fcfcfd]">
                      <td colSpan={5} className="p-12">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in slide-in-from-top-4 duration-500">
                          
                          {/* 左侧：指标清单 CHECKLIST */}
                          <div className="space-y-10">
                            <div>
                              <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 mb-10">
                                <ClipboardList size={16} className="text-emerald-500" /> 结构化指标清单
                              </h4>
                              
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-12 gap-x-8 bg-white p-10 rounded-[3rem] shadow-sm border border-slate-50">
                                <IndicatorItem label="受检者全名" value={maskName(c.name)} />
                                <IndicatorItem label="体质指数 (BMI)" value={c.bmi} subValue={c.bmi < 18.5 ? "体重过低" : "正常"} subColor="text-indigo-500" />
                                <IndicatorItem label="CT 影像特征" value={c.ctFeatures?.[0] || "无"} more={c.ctFeatures?.length > 1} />
                                <IndicatorItem label="分子检测 (Xpert)" value={c.molecularResult} />
                                <IndicatorItem label="痰涂片结果" value={c.smearResult} />
                                <IndicatorItem label="痰培养结果" value={c.cultureResult} />
                                <IndicatorItem label="QFT 免疫学结果" value={c.qftResult} />
                                <IndicatorItem label="档案建立时间" value={new Date(c.timestamp).toLocaleString().split(' ')[0]} subValue={new Date(c.timestamp).toLocaleString().split(' ')[1]} />
                              </div>
                            </div>

                            <div className="bg-slate-900/5 p-10 rounded-[3rem] space-y-6">
                              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Users size={14} /> 环境暴露史与背景
                              </h5>
                              <p className="text-lg font-black text-slate-900">{c.exposure || '无接触史'}</p>
                              <div className="flex flex-wrap gap-2">
                                {c.history?.map((h: string, idx: number) => (
                                  <span key={idx} className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest">{h}</span>
                                ))}
                                {(!c.history || c.history.length === 0) && <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">无显著既往史</span>}
                              </div>
                            </div>
                          </div>

                          {/* 右侧：AI 专家协同审计面板 (深色背景) */}
                          <div className="bg-[#0a0c1a] rounded-[3.5rem] p-12 text-white shadow-2xl relative overflow-hidden">
                             {/* 背景装饰 */}
                             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full"></div>
                             
                             <div className="relative z-10 flex flex-col h-full">
                                {/* 头部：置信度与标题 */}
                                <div className="flex justify-between items-start mb-12">
                                   <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                                        <BrainCircuit size={24} className="text-white" />
                                      </div>
                                      <div>
                                        <h4 className="text-lg font-black tracking-tight uppercase">AI 专家协同逻辑审计</h4>
                                        <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mt-1">多模型决策追踪中心</p>
                                      </div>
                                   </div>
                                   <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-right">
                                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">临床决策置信度</span>
                                      <div className="flex items-center gap-3">
                                        <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                          <div className="h-full bg-emerald-500" style={{ width: `${(c.aiInference?.confidence || 0.9) * 100}%` }}></div>
                                        </div>
                                        <span className="text-sm font-black text-emerald-500">{(c.aiInference?.confidence || 0.92) * 100}%</span>
                                      </div>
                                   </div>
                                </div>

                                {/* 分数核心对比区域 */}
                                <div className="flex items-center justify-around bg-white/5 rounded-[2.5rem] p-10 mb-12 border border-white/5">
                                   <div className="text-center">
                                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-4">指南原始分</span>
                                      <span className="text-6xl font-black text-slate-500">{c.originalScore ?? c.totalScore}</span>
                                   </div>
                                   <div className="flex flex-col items-center">
                                      <div className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-full mb-4">
                                         <TrendingUp size={12} />
                                         <span className="text-[10px] font-black">专家偏移: {(c.totalScore - (c.originalScore ?? c.totalScore)).toFixed(2)}</span>
                                      </div>
                                      <ArrowRight size={24} className="text-indigo-500 opacity-50" />
                                   </div>
                                   <div className="text-center relative">
                                      <div className="absolute inset-0 bg-indigo-600/20 blur-3xl rounded-full"></div>
                                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-4 relative z-10">协同修正分</span>
                                      <span className="text-6xl font-black text-indigo-400 relative z-10">{c.totalScore}</span>
                                   </div>
                                </div>

                                {/* 协议化建议 */}
                                {c.aiInference?.suggestedAction && (
                                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] p-8 mb-12 animate-in fade-in zoom-in duration-500">
                                     <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500">
                                           <Stethoscope size={16} />
                                        </div>
                                        <h5 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">临床协议化处置建议</h5>
                                     </div>
                                     <p className="text-[11px] font-bold text-emerald-50 leading-relaxed bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10">
                                       {c.aiInference.suggestedAction}
                                     </p>
                                  </div>
                                )}

                                {/* 推理权重细节审计 */}
                                <div className="space-y-6 mb-12">
                                   <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4">推理权重细节审计</h5>
                                   <div className="space-y-4">
                                      {c.aiInference?.impactFactors?.map((f: any, i: number) => (
                                        <div key={i} className="flex flex-col gap-1">
                                          <div className="flex justify-between items-center text-xs">
                                             <span className="font-black text-slate-300">{f.feature}</span>
                                             <span className={`font-black ${f.impact >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                               {f.impact > 0 ? `+${f.impact}` : f.impact} 分
                                             </span>
                                          </div>
                                          <p className="text-[9px] text-slate-500 font-bold leading-relaxed">{f.reason}</p>
                                        </div>
                                      )) || (
                                        <div className="text-slate-600 text-[10px] font-bold italic">未生成权重细节...</div>
                                      )}
                                   </div>
                                </div>

                                {/* 逻辑冲突审计 */}
                                {c.aiInference?.anomalies && c.aiInference.anomalies.length > 0 && (
                                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-8 mb-12">
                                     <div className="flex items-center gap-2 mb-4">
                                        <AlertCircle size={16} className="text-rose-500" />
                                        <h5 className="text-[10px] font-black text-rose-500 uppercase tracking-widest">识别到的临床逻辑冲突</h5>
                                     </div>
                                     <ul className="space-y-2">
                                        {c.aiInference.anomalies.map((a: string, i: number) => (
                                          <li key={i} className="text-[11px] font-bold text-rose-100 flex gap-2">
                                            <span className="text-rose-500">•</span> {a}
                                          </li>
                                        ))}
                                     </ul>
                                  </div>
                                )}

                                {/* 专家思维逻辑链 */}
                                <div className="mt-auto">
                                   <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                     <Activity size={14} /> 专家思维逻辑链
                                   </h5>
                                   <p className="text-[11px] font-bold text-slate-400 leading-[1.8] italic bg-white/5 p-8 rounded-[2rem] border border-white/5">
                                      "{c.aiInference?.reasoning || '正在进行病理逻辑一致性校验...'}"
                                   </p>
                                </div>
                                
                                {!c.aiInference && (
                                  <button onClick={() => performInference(c)} disabled={processingIds.has(c.id)} className="w-full mt-8 py-6 bg-indigo-600 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20">
                                    {processingIds.has(c.id) ? <Loader2 className="animate-spin" /> : <BrainCircuit />} 启动单例深度审计
                                  </button>
                                )}
                             </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          {filteredCases.length === 0 && (
            <div className="py-40 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300"><Search size={40}/></div>
              <p className="text-slate-400 font-black uppercase tracking-widest text-xs">未找到匹配的临床档案</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          50% { transform: translateY(140px); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

const IndicatorItem: React.FC<{ label: string, value: any, subValue?: string, subColor?: string, more?: boolean }> = ({ label, value, subValue, subColor, more }) => (
  <div className="flex flex-col gap-2">
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    <div className="flex flex-col">
       <div className="flex items-center gap-2">
         <span className="text-xl font-black text-slate-900">{value}</span>
         {more && <MoreHorizontal size={16} className="text-slate-300" />}
       </div>
       {subValue && <span className={`text-[10px] font-black mt-1 ${subColor || 'text-slate-400'}`}>{subValue}</span>}
    </div>
  </div>
);

export default CaseSummaryPage;
