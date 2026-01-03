
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store.tsx';
import { Case, AiInference } from '../types.ts';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Calculator, 
  Stethoscope,
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
  Fingerprint,
  Activity,
  ChevronRight,
  Eye,
  Users
} from 'lucide-react';

const CaseInputPage: React.FC = () => {
  const { addCase, updateCase, config, currentUser, cases } = useStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get('edit');
  const isInitialLoad = useRef(true);

  // 状态初始化，确保包含所有权重维度：体征、病史、症状、接触史、CT、QFT、病原学
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

  // 初始化编辑数据
  useEffect(() => {
    if (editId && isInitialLoad.current && cases.length > 0) {
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

  // BMI 计算
  useEffect(() => {
    const h = parseFloat(formData.height) / 100;
    const w = parseFloat(formData.weight);
    if (h > 0.5 && w > 2.0) {
      setBmi(parseFloat((w / (h * h)).toFixed(1)));
    } else {
      setBmi(0);
    }
  }, [formData.height, formData.weight]);

  // 全量分值计算与确诊逻辑
  useEffect(() => {
    let score = 0;
    formData.history.forEach(h => score += config.history[h] || 0);
    formData.symptoms.forEach(s => score += config.symptoms[s] || 0);
    score += config.exposure[formData.exposure] || 0;
    score += config.ctFeatures[formData.ctFeature] || 0;
    score += config.qft[formData.qft] || 0;
    score += config.smear[formData.smear] || 0;
    score += config.culture[formData.culture] || 0;

    // 核心逻辑：病原学（涂片或培养）阳性是确诊结核病的金标准
    const isPathogenPositive = formData.smear === '阳性' || formData.culture === '阳性';
    
    let level = '评估中';
    let suggestion = '';

    if (isPathogenPositive) {
      level = '确诊结核病';
      suggestion = '实验室检测（病原学）结果为阳性。符合结核病临床确诊标准，请立即建立病例档案并启动标准化治疗。';
    } else {
      const sortedThresholds = [...config.thresholds].sort((a,b) => b.min - a.min);
      const match = sortedThresholds.find(t => score >= t.min && t.level !== '确诊结核病');
      level = match?.level || '无风险';
      suggestion = match?.suggestion || '当前综合评估风险处于较低水平，建议维持健康生活。';
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
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // 构建全量医学上下文，强制要求中文输出
      const prompt = `请作为资深结核病专家，分析以下病例。
      【重要指令】：请务必使用中文进行回复，不要包含英文分析。
      
      【受检者】${formData.name} (${formData.gender}/${formData.age}岁)
      【体格检查】BMI: ${bmi}, 身高: ${formData.height}cm, 体重: ${formData.weight}kg
      【结核患者接触史】${formData.exposure}
      【临床症状】${formData.symptoms.join(',') || '无典型症状'}
      【既往病史及合并症】${formData.history.join(',') || '无显著既往史'}
      【影像学特征 (胸部CT)】${formData.ctFeature}
      【实验室指标】痰涂片: ${formData.smear}, 痰培养: ${formData.culture}, QFT检测: ${formData.qft}
      【指南判定】风险定级: ${risk.level}, 评估总分: ${totalScore}
      【医师补充笔记】${rawNotes || '未提供'}
      
      请提供：
      1. 推导逻辑链 (reasoning)：深度分析各项指标（特别是接触史、影像与化验）的临床意义。
      2. 识别异常风险点 (anomalies)：指出数据中不符合常规临床表现的潜在疑点。
      3. AI 协同建议 (suggestedAction)：提供具体的临床决策支持建议。
      4. 最终融合评分 (fusionScore, 0-150)：结合所有信息的 AI 评分。`;
      
      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 15000 },
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reasoning: { type: Type.STRING, description: "推导逻辑，必须使用中文" },
              fusionScore: { type: Type.NUMBER },
              anomalies: { type: Type.ARRAY, items: { type: Type.STRING }, description: "异常列表，每个条目必须是中文" },
              suggestedAction: { type: Type.STRING, description: "建议措施，必须使用中文" },
              confidence: { type: Type.NUMBER }
            },
            required: ["reasoning", "fusionScore", "anomalies", "suggestedAction", "confidence"]
          }
        }
      });
      setAiResult(JSON.parse(res.text || '{}'));
    } catch (e: any) {
      setAiError("AI 引擎调用失败，请检查配置。");
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
    <div className="max-w-7xl mx-auto space-y-10 pb-40 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-emerald-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-200">
            <Stethoscope className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">精准评估录入中心</h1>
            <p className="text-[10px] text-slate-400 font-black tracking-widest uppercase mt-1">Multi-modal Clinical Data Assessment</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-10">
          
          {/* 1. 基础体征 */}
          <section className="bg-white dark:bg-slate-900 p-10 md:p-12 rounded-[48px] shadow-xl border border-slate-50 dark:border-slate-800 space-y-10">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-6">
              <User size={20} className="text-emerald-500" /> 01. 基础信息与生理指标
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-2 space-y-2">
                <Label>受检者姓名</Label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-slate-950 dark:text-white shadow-inner outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              <div className="space-y-2">
                <Label>年龄</Label>
                <input required type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-slate-950 dark:text-white shadow-inner outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              <div className="space-y-2">
                <Label>性别</Label>
                <div className="flex gap-2">
                  {['男', '女'].map(g => (
                    <button key={g} type="button" onClick={() => setFormData({...formData, gender: g as '男' | '女'})} className={`flex-1 py-4 rounded-2xl font-black text-xs transition-all border-2 ${formData.gender === g ? 'bg-slate-950 text-white border-slate-950 dark:bg-emerald-600 shadow-xl' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}>{g}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-50 dark:border-slate-800">
              <div className="space-y-2">
                <Label><Ruler size={14} className="inline mr-1"/> 身高 (cm)</Label>
                <input required type="number" step="0.1" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-slate-950 dark:text-white shadow-inner outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              <div className="space-y-2">
                <Label><Scale size={14} className="inline mr-1"/> 体重 (kg)</Label>
                <input required type="number" step="0.1" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-slate-950 dark:text-white shadow-inner outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
            </div>
          </section>

          {/* 2. 结核患者接触史 (修复点：确保在录入界面醒目显示) */}
          <section className="bg-indigo-600 p-10 md:p-12 rounded-[48px] shadow-2xl space-y-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[100px] rounded-full"></div>
            <h3 className="text-sm font-black uppercase tracking-[0.3em] flex items-center gap-3 border-b border-white/10 pb-6 relative z-10">
              <Users size={20} /> 02. 结核患者接触史 (流行病学权重)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
              {Object.keys(config.exposure).map(e => (
                <button key={e} type="button" onClick={() => setFormData({...formData, exposure: e})} 
                  className={`p-6 rounded-3xl border-2 font-black text-xs transition-all text-center flex items-center justify-center leading-relaxed ${formData.exposure === e ? 'bg-white text-indigo-600 border-white shadow-2xl scale-105' : 'bg-white/5 border-white/10 text-indigo-100 hover:bg-white/10'}`}>
                  {e}
                </button>
              ))}
            </div>
          </section>

          {/* 3. 实验室判据 */}
          <section className="bg-slate-950 p-10 md:p-12 rounded-[48px] shadow-2xl space-y-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
            <h3 className="text-xs font-black text-rose-500 uppercase tracking-[0.3em] flex items-center gap-3 relative z-10 border-b border-white/5 pb-6">
              <AlertTriangle size={20} /> 03. 实验室检测与病原学确诊
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
              <div className="space-y-6">
                <label className="block text-[11px] font-black text-rose-400 uppercase tracking-widest">痰涂片结果 (病原学硬指标)</label>
                <div className="flex gap-4">
                  {Object.keys(config.smear).map(s => (
                    <button key={s} type="button" onClick={() => setFormData({...formData, smear: s})} className={`flex-1 py-4 rounded-2xl border-2 font-black transition-all ${formData.smear === s ? 'bg-rose-600 border-rose-600 text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10'}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <label className="block text-[11px] font-black text-rose-400 uppercase tracking-widest">痰培养结果 (病原学硬指标)</label>
                <div className="flex gap-4">
                  {Object.keys(config.culture).map(c => (
                    <button key={c} type="button" onClick={() => setFormData({...formData, culture: c})} className={`flex-1 py-4 rounded-2xl border-2 font-black transition-all ${formData.culture === c ? 'bg-rose-600 border-rose-600 text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10'}`}>{c}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="pt-8 border-t border-white/10 space-y-6 relative z-10">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest">QFT-Interferon 免疫检测辅助</label>
              <div className="flex flex-wrap gap-3">
                {Object.keys(config.qft).map(q => (
                  <button key={q} type="button" onClick={() => setFormData({...formData, qft: q})} className={`px-8 py-3 rounded-xl border-2 font-black text-xs transition-all ${formData.qft === q ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10'}`}>{q}</button>
                ))}
              </div>
            </div>
          </section>

          {/* 4. 影像学 */}
          <section className="bg-white dark:bg-slate-900 p-10 md:p-12 rounded-[48px] shadow-xl border border-slate-50 dark:border-slate-800 space-y-10">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-8">
              <Eye size={20} className="text-indigo-500" /> 04. 胸部 CT 数字化影像特征
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(config.ctFeatures).map(f => (
                <button key={f} type="button" onClick={() => setFormData({...formData, ctFeature: f})} className={`p-6 rounded-[32px] border-2 text-left transition-all flex items-center justify-between group ${formData.ctFeature === f ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500 hover:bg-slate-100'}`}>
                  <span className="font-black text-xs">{f}</span>
                  {formData.ctFeature === f ? <CheckCircle2 size={18} /> : <div className="w-5 h-5 rounded-full border-2 border-slate-200 group-hover:border-indigo-400"></div>}
                </button>
              ))}
            </div>
          </section>

          {/* 5. 症状背景 */}
          <section className="bg-white dark:bg-slate-900 p-10 md:p-12 rounded-[48px] shadow-xl border border-slate-50 dark:border-slate-800 space-y-12">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-8">
              <History size={20} className="text-amber-500" /> 05. 核心临床症状与既往病史
            </h3>
            <div className="space-y-10">
              <div className="space-y-4">
                <Label>高危既往背景 (多选)</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(config.history).map(h => (
                    <button key={h} type="button" onClick={() => toggleItem('history', h)} className={`px-6 py-3 rounded-2xl border-2 font-black text-[11px] transition-all ${formData.history.includes(h) ? 'bg-slate-950 text-white border-slate-950 shadow-xl' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400 hover:bg-slate-100'}`}>{h}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <Label>典型临床症状 (多选)</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(config.symptoms).map(s => (
                    <button key={s} type="button" onClick={() => toggleItem('symptoms', s)} className={`px-6 py-3 rounded-2xl border-2 font-black text-[11px] transition-all ${formData.symptoms.includes(s) ? 'bg-rose-600 text-white border-rose-600 shadow-xl' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400 hover:bg-slate-100'}`}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <button type="submit" disabled={submitted} className={`w-full py-8 rounded-[40px] font-black text-xl text-white shadow-2xl transition-all flex items-center justify-center gap-4 active:scale-95 ${submitted ? 'bg-emerald-600 opacity-80' : 'bg-slate-950 dark:bg-emerald-600 hover:scale-[1.01]'}`}>
            {submitted ? <CheckCircle2 size={24}/> : <ChevronRight size={24}/>}
            {submitted ? '正在保存评估档案...' : '提交评估报告'}
          </button>
        </form>

        <div className="space-y-10">
          {/* 指南分值看板 */}
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[48px] shadow-2xl border border-slate-50 dark:border-slate-800">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-12 flex items-center gap-3">
              <Calculator size={20} className="text-emerald-500"/> 决策支持核心面板
            </h3>
            <div className="grid grid-cols-2 gap-8 mb-12">
              <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-[32px] text-center shadow-inner">
                <span className="text-[9px] font-black text-slate-400 uppercase mb-2 block">BMI 指数</span>
                <span className={`text-4xl font-black ${bmi > 0 && bmi < 18.5 ? 'text-amber-500' : 'text-slate-950 dark:text-emerald-500'}`}>{bmi || '--'}</span>
              </div>
              <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-[32px] text-center shadow-inner">
                <span className="text-[9px] font-black text-slate-400 uppercase mb-2 block">指南评分</span>
                <span className="text-4xl font-black text-slate-950 dark:text-emerald-500">{totalScore}</span>
              </div>
            </div>
            <div className="text-center p-10 bg-slate-50 dark:bg-slate-800 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-700">
               <div className={`text-lg font-black px-8 py-3 rounded-full inline-block mb-8 shadow-sm ${risk.level === '确诊结核病' ? 'bg-rose-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-950 dark:text-white'}`}>{risk.level}</div>
               <div className="flex gap-4 text-left p-6 bg-white dark:bg-slate-700 rounded-3xl shadow-sm">
                 <p className="text-xs text-slate-500 dark:text-slate-300 font-bold leading-relaxed italic">“{risk.suggestion}”</p>
               </div>
            </div>
          </div>

          {/* AI 协同推理引擎 */}
          <div className="bg-slate-950 p-12 rounded-[48px] shadow-2xl space-y-10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 blur-[100px] rounded-full"></div>
            <div className="flex items-center justify-between relative z-10">
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-3"><BrainCircuit size={20} /> Synergy 逻辑引擎</h3>
              <Sparkles size={20} className="text-indigo-400 animate-pulse" />
            </div>
            <div className="space-y-4 relative z-10">
              <Label><span className="text-indigo-400 opacity-60">医师补充笔记 (非结构化)</span></Label>
              <textarea value={rawNotes} onChange={e => setRawNotes(e.target.value)} placeholder="记录临床特殊考量，这些信息将被 AI 抓取分析..." className="w-full h-40 bg-white/5 border border-white/10 rounded-[32px] p-7 text-xs font-bold text-white outline-none resize-none focus:border-indigo-500 transition-all placeholder:text-slate-700 shadow-inner" />
            </div>
            <button type="button" onClick={runAiSynergy} disabled={isAiProcessing} className="w-full py-6 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-4 hover:scale-[1.02] transition-all shadow-xl shadow-indigo-900/40 relative z-10">
              {isAiProcessing ? <Loader2 className="animate-spin" size={20}/> : <BrainCircuit size={20}/>}
              {isAiProcessing ? '推理分析中...' : '启动 AI 协同分析'}
            </button>
            {aiError && <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-[11px] font-bold flex gap-4 animate-in shake"><AlertCircle size={20} /> {aiError}</div>}
            {aiResult && (
              <div className="space-y-10 pt-10 border-t border-white/10 animate-in fade-in slide-in-from-top-6 duration-500 relative z-10">
                <div className="flex justify-between items-end">
                   <div className="flex flex-col">
                     <span className="text-[9px] font-black text-slate-500 uppercase mb-1">Fusion Score</span>
                     <span className="text-4xl font-black text-indigo-400 tracking-tighter">{aiResult.fusionScore}</span>
                   </div>
                   <div className="text-right flex flex-col items-end">
                     <span className="text-[9px] font-black text-slate-500 uppercase mb-1">推理置信度</span>
                     <span className="text-xl font-black text-emerald-400">{(aiResult.confidence * 100).toFixed(0)}%</span>
                   </div>
                </div>
                <div className="space-y-8">
                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2"><Fingerprint size={14}/> 核心逻辑推导报告 (中文)</span>
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                      <p className="text-[11px] text-slate-200 leading-relaxed italic font-medium">“{aiResult.reasoning}”</p>
                    </div>
                  </div>
                  {aiResult.anomalies && aiResult.anomalies.length > 0 && (
                    <div className="space-y-3">
                      <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2"><AlertTriangle size={14}/> 临床矛盾/风险识别 (中文)</span>
                      <div className="grid grid-cols-1 gap-2">
                        {aiResult.anomalies.map((a, i) => (
                          <div key={i} className="px-5 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[10px] text-rose-400 font-bold flex items-center gap-3">
                            <span className="w-1 h-1 bg-rose-500 rounded-full"></span>
                            {a}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2"><CheckCircle2 size={14}/> AI 协同临床建议 (中文)</span>
                    <div className="bg-emerald-500/10 p-6 rounded-3xl border border-emerald-500/20 shadow-inner">
                      <p className="text-[11px] text-emerald-50 font-bold leading-relaxed">{aiResult.suggestedAction}</p>
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
