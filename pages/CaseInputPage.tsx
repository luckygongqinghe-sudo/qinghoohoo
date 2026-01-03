
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store.tsx';
import { Case, AiInference } from '../types.ts';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Calculator, 
  ChevronRight, 
  Stethoscope,
  Eye,
  Sparkles,
  BrainCircuit,
  Loader2,
  AlertCircle,
  Scale,
  Ruler,
  History,
  AlertTriangle,
  User,
  Info,
  CheckCircle2,
  ClipboardList,
  Fingerprint
} from 'lucide-react';

const CaseInputPage: React.FC = () => {
  const { addCase, updateCase, config, currentUser, cases } = useStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get('edit');
  const isInitialLoad = useRef(true);

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '男' as '男' | '女',
    height: '',
    weight: '',
    history: [] as string[],
    symptoms: [] as string[],
    exposure: '无接触史',
    ctFeature: '无显著特征',
    qft: '阴性',
    smear: '阴性',
    culture: '阴性'
  });

  const [rawNotes, setRawNotes] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AiInference | null>(null);
  const [bmi, setBmi] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [risk, setRisk] = useState({ level: '计算中...', suggestion: '' });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (editId && isInitialLoad.current) {
      const c = cases.find(item => item.id === editId);
      if (c) {
        setFormData({
          name: c.name || '',
          age: c.age?.toString() || '',
          gender: c.gender || '男',
          height: c.height?.toString() || '',
          weight: c.weight?.toString() || '',
          history: Array.isArray(c.history) ? c.history : [],
          symptoms: Array.isArray(c.symptoms) ? c.symptoms : [],
          exposure: c.exposure || '无接触史',
          ctFeature: c.ctFeature || '无显著特征',
          qft: c.qftResult || '阴性',
          smear: c.smearResult || '阴性',
          culture: c.cultureResult || '阴性'
        });
        if (c.aiInference) setAiResult(c.aiInference);
        isInitialLoad.current = false;
      }
    }
  }, [editId, cases]);

  useEffect(() => {
    const h = parseFloat(formData.height) / 100;
    const w = parseFloat(formData.weight);
    if (h > 0.5 && w > 2.0) {
      setBmi(parseFloat((w / (h * h)).toFixed(1)));
    } else {
      setBmi(0);
    }
  }, [formData.height, formData.weight]);

  useEffect(() => {
    let score = 0;
    formData.history.forEach(h => score += config.history[h] || 0);
    formData.symptoms.forEach(s => score += config.symptoms[s] || 0);
    score += config.exposure[formData.exposure] || 0;
    score += config.ctFeatures[formData.ctFeature] || 0;
    score += config.qft[formData.qft] || 0;
    score += config.smear[formData.smear] || 0;
    score += config.culture[formData.culture] || 0;

    // 确诊逻辑：仅病原学阳性方可确诊
    const isConfirmed = formData.smear === '阳性' || formData.culture === '阳性';
    let level = '评估中';
    let suggestion = '';

    if (isConfirmed) {
      level = '确诊结核病';
      suggestion = '病原学指标（涂片或培养）阳性，符合临床确诊标准。请立即启动标准化化学治疗。';
    } else {
      const sortedThresholds = [...config.thresholds].sort((a,b) => b.min - a.min);
      // 若非病原学阳性，最高仅能是极高危
      const match = sortedThresholds.find(t => score >= t.min && t.level !== '确诊结核病');
      level = match?.level || '无风险';
      suggestion = match?.suggestion || '当前临床分值较低，请定期随访。';
    }

    setTotalScore(score);
    setRisk({ level, suggestion });
  }, [formData, config]);

  const toggleItem = (field: 'history' | 'symptoms', val: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(val) ? prev[field].filter(v => v !== val) : [...prev[field], val]
    }));
  };

  const runAiSynergy = async () => {
    setAiError(null);
    setIsAiProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `结核病精准医学推理请求：
      患者摘要: ${formData.name} (${formData.gender}/${formData.age}岁)
      体征数据: BMI ${bmi} (H:${formData.height}cm/W:${formData.weight}kg)
      症状集: ${formData.symptoms.join(',') || '无显性症状'}
      背景史: ${formData.history.join(',') || '无高危背景'}
      CT影像: ${formData.ctFeature}
      病原学: 涂片(${formData.smear}), 培养(${formData.culture}), QFT(${formData.qft})
      指南分值 (Clinical Guideline Score): ${totalScore}
      初步定级: ${risk.level}
      非结构化笔记: ${rawNotes}
      
      请结合最新指南给出：
      1. 可解释性推导链：详细阐述从临床表现到结论的逻辑过程。
      2. 矛盾风险点：识别数据中逻辑不一致或非典型的点。
      3. AI 增强协同建议：基于 AI 的深度洞察建议下一步行动。
      4. Fusion Score (0-150): 融合多维数据的修正分。`;
      
      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 15000 },
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
      setAiResult(JSON.parse(res.text || '{}'));
    } catch (e: any) {
      setAiError("AI 引擎调用失败。请确认环境变量 GEMINI_API_KEY 是否正确配置。");
    } finally { setIsAiProcessing(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    const caseData: Case = {
      id: editId || `TB-${Date.now()}`,
      timestamp: Date.now(),
      name: formData.name,
      age: parseInt(formData.age) || 0,
      gender: formData.gender,
      height: parseFloat(formData.height) || 0,
      weight: parseFloat(formData.weight) || 0,
      bmi,
      history: formData.history,
      symptoms: formData.symptoms,
      exposure: formData.exposure,
      ctFeature: formData.ctFeature,
      ctScore: config.ctFeatures[formData.ctFeature] || 0,
      qftResult: formData.qft,
      smearResult: formData.smear,
      cultureResult: formData.culture,
      totalScore: aiResult?.fusionScore ?? totalScore,
      riskLevel: risk.level,
      suggestion: aiResult?.suggestedAction ?? risk.suggestion,
      creatorId: currentUser.id,
      creatorName: currentUser.username,
      aiInference: aiResult || undefined
    };

    editId ? await updateCase(editId, caseData) : await addCase(caseData);
    setSubmitted(true);
    setTimeout(() => navigate('/dashboard/summary'), 800);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-32 animate-in fade-in duration-500">
      {/* 头部状态 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-emerald-600 rounded-[24px] flex items-center justify-center shadow-2xl shadow-emerald-200">
            <Stethoscope className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">结核病风险精准评估</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[9px] font-black rounded uppercase border border-rose-100">Diagnosis Level: High Rigor</span>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">病原学阳性为确诊唯一金标准</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* 左侧：临床表单 */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-8">
          
          {/* 1. 基础体征与生理卡片 */}
          <section className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[48px] shadow-2xl border border-slate-50 dark:border-slate-800 space-y-10">
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-8">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-3">
                <User size={20} className="text-emerald-500" /> 01. 基础体征数据采集
              </h3>
              <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                Vital Signs Required
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-2 space-y-2">
                <Label>受检者姓名</Label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-slate-900 dark:text-white shadow-inner outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="请输入姓名" />
              </div>
              <div className="space-y-2">
                <Label>年龄</Label>
                <input required type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-slate-900 dark:text-white shadow-inner outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="岁" />
              </div>
              <div className="space-y-2">
                <Label>性别</Label>
                <div className="flex gap-2">
                  {['男', '女'].map(g => (
                    <button key={g} type="button" onClick={() => setFormData({...formData, gender: g as '男' | '女'})} className={`flex-1 py-4 rounded-2xl font-black text-xs transition-all border-2 ${formData.gender === g ? 'bg-slate-950 text-white border-slate-950 dark:bg-emerald-600 dark:border-emerald-600 shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}>{g}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="space-y-2">
                <Label><Ruler size={14} className="inline mr-1"/> 身高 (cm)</Label>
                <input required type="number" step="0.1" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-slate-900 dark:text-white shadow-inner outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="170.0" />
              </div>
              <div className="space-y-2">
                <Label><Scale size={14} className="inline mr-1"/> 体重 (kg)</Label>
                <input required type="number" step="0.1" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-slate-900 dark:text-white shadow-inner outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="65.0" />
              </div>
            </div>
          </section>

          {/* 2. 影像学与病原学 (CT 修复项) */}
          <section className="bg-slate-950 p-8 md:p-12 rounded-[48px] shadow-2xl space-y-12 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
            <h3 className="text-sm font-black text-rose-500 uppercase tracking-[0.3em] flex items-center gap-3 relative z-10">
              <AlertTriangle size={20} /> 02. 核心确诊与影像学特征
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
              {/* CT 影像修复 */}
              <div className="space-y-6">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">胸部 CT 影像特征 (必选)</label>
                <div className="grid grid-cols-1 gap-3">
                  {Object.keys(config.ctFeatures).map(f => (
                    <button key={f} type="button" onClick={() => setFormData({...formData, ctFeature: f})} className={`w-full p-5 rounded-2xl border-2 text-left text-[11px] font-bold transition-all ${formData.ctFeature === f ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl translate-x-2' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>
                      <div className="flex items-center justify-between">
                        <span>{f}</span>
                        {formData.ctFeature === f && <CheckCircle2 size={16} />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 病原学实验室逻辑 */}
              <div className="space-y-10">
                <div className="space-y-6">
                  <label className="block text-[11px] font-black text-rose-500 uppercase tracking-widest">病原学核心结果 (确诊金标准)</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <span className="text-[10px] font-black text-slate-500 uppercase block ml-1">痰涂片</span>
                      {['阴性', '阳性'].map(s => (
                        <button key={s} type="button" onClick={() => setFormData({...formData, smear: s})} className={`w-full py-4 rounded-xl border-2 font-black text-xs transition-all ${formData.smear === s ? 'bg-rose-600 border-rose-600 text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-500'}`}>{s}</button>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <span className="text-[10px] font-black text-slate-500 uppercase block ml-1">痰培养</span>
                      {['阴性', '阳性'].map(c => (
                        <button key={c} type="button" onClick={() => setFormData({...formData, culture: c})} className={`w-full py-4 rounded-xl border-2 font-black text-xs transition-all ${formData.culture === c ? 'bg-rose-600 border-rose-600 text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-500'}`}>{c}</button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">辅助学检测 (QFT)</label>
                  <div className="flex gap-3">
                    {['阴性', '弱阳性', '阳性'].map(q => (
                      <button key={q} type="button" onClick={() => setFormData({...formData, qft: q})} className={`flex-1 py-4 rounded-xl border-2 font-black text-xs transition-all ${formData.qft === q ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-500'}`}>{q}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 3. 既往史与临床症状卡片 */}
          <section className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[48px] shadow-2xl border border-slate-50 dark:border-slate-800 space-y-10">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-8">
              <History size={20} className="text-indigo-500" /> 03. 临床表征与高危史
            </h3>
            
            <div className="space-y-10">
              <div className="space-y-4">
                <Label>高危既往史 (多选)</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(config.history).map(h => (
                    <button key={h} type="button" onClick={() => toggleItem('history', h)} className={`px-5 py-3 rounded-2xl border-2 font-black text-[11px] transition-all ${formData.history.includes(h) ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400 hover:bg-slate-100'}`}>{h}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label>核心临床表现 (多选)</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(config.symptoms).map(s => (
                    <button key={s} type="button" onClick={() => toggleItem('symptoms', s)} className={`px-5 py-3 rounded-2xl border-2 font-black text-[11px] transition-all ${formData.symptoms.includes(s) ? 'bg-rose-600 text-white border-rose-600 shadow-xl' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400 hover:bg-slate-100'}`}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <button type="submit" disabled={submitted} className={`w-full py-7 rounded-[32px] font-black text-xl text-white shadow-2xl transition-all flex items-center justify-center gap-4 active:scale-95 ${submitted ? 'bg-emerald-600 opacity-80' : 'bg-slate-950 dark:bg-emerald-600 hover:scale-[1.01] hover:shadow-emerald-200'}`}>
            {submitted ? <CheckCircle2 size={24}/> : <ClipboardList size={24}/>}
            {submitted ? '正在建立临床档案...' : '提交评估并生成报告'}
          </button>
        </form>

        {/* 右侧：AI 推理与评分看板 */}
        <div className="space-y-10">
          {/* 指南评分卡 */}
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[48px] shadow-2xl border border-slate-50 dark:border-slate-800">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-12 flex items-center gap-3">
              <Calculator size={20} className="text-emerald-500"/> 指南评估引擎 (Standard)
            </h3>
            
            <div className="grid grid-cols-2 gap-8 mb-12">
              <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-[32px] text-center shadow-inner">
                <span className="text-[9px] font-black text-slate-400 uppercase mb-2 block">BMI 指数</span>
                <span className={`text-3xl font-black ${bmi > 0 && bmi < 18.5 ? 'text-amber-500' : 'text-slate-950 dark:text-emerald-500'}`}>{bmi || '--'}</span>
              </div>
              <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-[32px] text-center shadow-inner">
                <span className="text-[9px] font-black text-slate-400 uppercase mb-2 block">指南分</span>
                <span className="text-3xl font-black text-slate-950 dark:text-emerald-500">{totalScore}</span>
              </div>
            </div>

            <div className="text-center p-10 bg-slate-50 dark:bg-slate-800 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-700">
               <div className={`text-xl font-black px-8 py-3 rounded-full inline-block mb-8 shadow-sm ${risk.level === '确诊结核病' ? 'bg-rose-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white'}`}>{risk.level}</div>
               <div className="flex gap-4 text-left p-6 bg-white dark:bg-slate-700 rounded-3xl shadow-sm">
                 <Info size={20} className="shrink-0 text-emerald-500" />
                 <p className="text-xs text-slate-500 dark:text-slate-300 font-bold leading-relaxed italic">“{risk.suggestion}”</p>
               </div>
            </div>
          </div>

          {/* AI 推理详细报告区 (XAI) */}
          <div className="bg-slate-950 p-12 rounded-[48px] shadow-2xl space-y-10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 blur-[100px] rounded-full"></div>
            
            <div className="flex items-center justify-between relative z-10">
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-3"><BrainCircuit size={20} /> Synergy 协同决策引擎</h3>
              <Sparkles size={20} className="text-indigo-400 animate-pulse" />
            </div>
            
            <div className="space-y-4 relative z-10">
              <Label><span className="text-indigo-400 opacity-60">非结构化临床笔记 (供 AI 增强分析)</span></Label>
              <textarea value={rawNotes} onChange={e => setRawNotes(e.target.value)} placeholder="记录患者家族聚集性、非典型影像表现演变等细节..." className="w-full h-40 bg-white/5 border border-white/10 rounded-3xl p-7 text-xs font-bold text-white outline-none resize-none focus:border-indigo-500 transition-all placeholder:text-slate-700 shadow-inner" />
            </div>
            
            <button type="button" onClick={runAiSynergy} disabled={isAiProcessing} className="w-full py-6 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-4 hover:scale-[1.02] transition-all shadow-xl shadow-indigo-900/40 relative z-10">
              {isAiProcessing ? <Loader2 className="animate-spin" size={20}/> : <BrainCircuit size={20}/>}
              {isAiProcessing ? '正在生成医学逻辑链...' : '执行 AI 深度协同推理'}
            </button>
            
            {aiError && <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-[11px] font-bold flex gap-4 animate-in shake"><AlertCircle size={20} /> {aiError}</div>}
            
            {aiResult && (
              <div className="space-y-10 pt-10 border-t border-white/10 animate-in fade-in slide-in-from-top-6 duration-500 relative z-10">
                {/* 评分面板 */}
                <div className="flex justify-between items-end">
                   <div className="flex flex-col">
                     <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Fusion Score</span>
                     <span className="text-4xl font-black text-indigo-400 tracking-tighter">{aiResult.fusionScore}</span>
                   </div>
                   <div className="text-right flex flex-col items-end">
                     <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">推理置信度</span>
                     <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-emerald-400">{(aiResult.confidence * 100).toFixed(0)}%</span>
                        <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 transition-all duration-1000" style={{ width: `${aiResult.confidence * 100}%` }}></div>
                        </div>
                     </div>
                   </div>
                </div>

                {/* 详细内容列表 */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2"><Fingerprint size={14}/> 推导链报告 (Chain-of-Thought)</span>
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                      <p className="text-[12px] text-slate-200 leading-relaxed italic font-medium">“{aiResult.reasoning}”</p>
                    </div>
                  </div>

                  {aiResult.anomalies && aiResult.anomalies.length > 0 && (
                    <div className="space-y-3">
                      <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2"><AlertTriangle size={14}/> 矛盾与非典型风险点</span>
                      <div className="grid grid-cols-1 gap-3">
                        {aiResult.anomalies.map((a, i) => (
                          <div key={i} className="px-5 py-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-[11px] text-rose-400 font-bold flex items-center gap-3">
                            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                            {a}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2"><CheckCircle2 size={14}/> AI 增强协同建议</span>
                    <div className="bg-emerald-500/10 p-7 rounded-3xl border border-emerald-500/20 shadow-inner">
                      <p className="text-[12px] text-emerald-50 font-bold leading-relaxed">{aiResult.suggestedAction}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">{children}</label>
);

export default CaseInputPage;
