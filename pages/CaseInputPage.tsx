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
  Scale,
  Ruler,
  User,
  Users,
  ChevronRight,
  FlaskConical,
  History,
  Zap,
  Layers,
  CheckCircle2,
  AlertCircle,
  Activity,
  TrendingUp,
  Info
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
    ctFeatures: [] as string[],
    qft: '阴性',
    smear: '阴性',
    culture: '阴性',
    molecular: '阴性'
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
          ctFeatures: Array.isArray(c.ctFeatures) ? c.ctFeatures : [],
          qft: c.qftResult || '阴性',
          smear: c.smearResult || '阴性',
          culture: c.cultureResult || '阴性',
          molecular: c.molecularResult || '阴性'
        });
        if (c.aiInference) setAiResult(c.aiInference);
        if (c.id === editId) isInitialLoad.current = false;
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
    
    if (formData.ctFeatures.length > 0) {
      const ctScores = formData.ctFeatures.map(f => config.ctFeatures[f] || 0).sort((a, b) => b - a);
      const mainScore = ctScores[0];
      const othersScore = ctScores.slice(1).reduce((acc, curr) => acc + (curr * 0.5), 0);
      score += (mainScore + othersScore);
    }

    score += config.qft[formData.qft] || 0;
    score += config.smear[formData.smear] || 0;
    score += config.culture[formData.culture] || 0;
    score += config.molecular[formData.molecular] || 0;

    if (bmi > 0 && bmi < 18.5) score += 10;
    const ageVal = parseInt(formData.age);
    if (ageVal < 5 || ageVal > 65) score += 5;

    const isPathogenPositive = formData.smear === '阳性' || formData.culture === '阳性' || formData.molecular === '阳性';
    
    let level = '评估中';
    let suggestion = '';

    if (isPathogenPositive) {
      level = '确诊结核病';
      suggestion = config.thresholds.find(t => t.level === '确诊结核病')?.suggestion || '';
    } else {
      const sortedThresholds = [...config.thresholds].sort((a,b) => b.min - a.min);
      const match = sortedThresholds.find(t => score >= t.min && t.level !== '确诊结核病');
      level = match?.level || '无风险';
      suggestion = match?.suggestion || '当前综合评估风险较低。';
    }

    setTotalScore(Math.round(score));
    setRisk({ level, suggestion });
  }, [formData, config, bmi]);

  const toggleItem = (field: 'history' | 'symptoms' | 'ctFeatures', val: string) => {
    setFormData(prev => {
      const currentList = prev[field] as string[];
      return {
        ...prev,
        [field]: currentList.includes(val) 
          ? currentList.filter(v => v !== val) 
          : [...currentList, val]
      };
    });
  };

  const runAiSynergy = async () => {
    setAiError(null);
    setIsAiProcessing(true);
    try {
      // Always initialize with named parameter and direct process.env.API_KEY reference.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `你是一位结核病防治专家。请分析以下病例的多维数据，并使用专业中文回答所有字段。
      受检者姓名：${formData.name}, 年龄：${formData.age}, BMI：${bmi}。
      多重CT影像征象：[${formData.ctFeatures.join(', ')}]。
      实验室检测指标：分子检测(Xpert) ${formData.molecular}, 痰涂片 ${formData.smear}, 痰培养 ${formData.culture}, 免疫学QFT ${formData.qft}。
      临床备注：${rawNotes}。
      
      请执行以下任务并以 JSON 格式返回：
      1. 执行【多模型逻辑追踪】逻辑审计。
      2. 识别临床数据间的冲突 (anomalies)。
      3. 计算综合修正后的协同分值 (fusionScore)。
      4. 为每个特征分配推理权重 (impactFactors)，包含 feature, impact, reason。
      5. 提供基于最新指南的【临床协议化处置建议】(suggestedAction)。
      6. 生成专家思维逻辑链 (reasoning)。
      7. 给出一个 0-1 之间的置信度评分 (confidence)。
      
      所有文本内容必须使用专业中文。`;
      
      const res = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
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
              confidence: { type: Type.NUMBER },
              impactFactors: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    feature: { type: Type.STRING },
                    impact: { type: Type.NUMBER },
                    reason: { type: Type.STRING }
                  },
                  required: ["feature", "impact", "reason"]
                }
              }
            },
            required: ["reasoning", "fusionScore", "anomalies", "suggestedAction", "confidence", "impactFactors"]
          }
        }
      });
      // Correctly access text property from GenerateContentResponse.
      const jsonStr = res.text.trim();
      setAiResult(JSON.parse(jsonStr || '{}'));
    } catch (e: any) {
      setAiError("AI 协同引擎暂时不可用，请稍后重试。");
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
      ctFeatures: formData.ctFeatures,
      ctScore: 0,
      qftResult: formData.qft,
      smearResult: formData.smear,
      cultureResult: formData.culture,
      molecularResult: formData.molecular,
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
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 bg-emerald-600 rounded-[2rem] flex items-center justify-center shadow-2xl">
          <Stethoscope className="text-white" size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">临床评估录入</h1>
          <p className="text-[10px] text-slate-400 font-black tracking-widest uppercase mt-1">Multi-Sign Imaging Analysis Matrix</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-10">
          <section className="bg-white dark:bg-slate-900 p-10 rounded-[48px] shadow-xl border border-slate-50 dark:border-slate-800 space-y-10">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-6">
              <User size={20} className="text-emerald-500" /> 01. 受检者概况
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-2 space-y-2">
                <Label>受检者全名</Label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-inner" />
              </div>
              <div className="space-y-2">
                <Label>年龄</Label>
                <input required type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-slate-900 dark:text-white outline-none shadow-inner" />
              </div>
              <div className="space-y-2">
                <Label>性别</Label>
                <div className="flex gap-2">
                  {['男', '女'].map(g => (
                    <button key={g} type="button" onClick={() => setFormData({...formData, gender: g as '男' | '女'})} className={`flex-1 py-4 rounded-2xl font-black text-xs transition-all border-2 ${formData.gender === g ? 'bg-slate-950 text-white border-slate-950' : 'bg-white dark:bg-slate-800 border-slate-100 text-slate-400'}`}>{g}</button>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 space-y-2"><Label><Ruler size={14} className="inline mr-1"/> 身高 (cm)</Label><input required type="number" step="0.1" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-slate-900 dark:text-white outline-none shadow-inner" /></div>
              <div className="md:col-span-2 space-y-2"><Label><Scale size={14} className="inline mr-1"/> 体重 (kg)</Label><input required type="number" step="0.1" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-slate-900 dark:text-white outline-none shadow-inner" /></div>
            </div>
          </section>

          <section className="bg-indigo-600 p-10 rounded-[48px] shadow-2xl space-y-8 text-white">
            <h3 className="text-sm font-black uppercase tracking-[0.3em] flex items-center gap-3 border-b border-white/10 pb-6">
              <Users size={20} /> 02. 流行病学与暴露
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.keys(config.exposure).map(e => (
                <button key={e} type="button" onClick={() => setFormData({...formData, exposure: e})} className={`p-6 rounded-3xl border-2 font-black text-xs transition-all text-center ${formData.exposure === e ? 'bg-white text-indigo-600 border-white shadow-xl scale-105' : 'bg-white/5 border-white/10 text-indigo-100 hover:bg-white/10'}`}>{e}</button>
              ))}
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 p-10 rounded-[48px] shadow-xl border border-slate-50 dark:border-slate-800 space-y-10">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-8">
              <Layers size={20} className="text-indigo-500" /> 03. 影像学特征 (CT 多征象并存)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(config.ctFeatures).map(f => (
                <button 
                  key={f} 
                  type="button" 
                  onClick={() => toggleItem('ctFeatures', f)} 
                  className={`p-6 rounded-[32px] border-2 text-left transition-all flex items-center justify-between group ${formData.ctFeatures.includes(f) ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-[1.02]' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500 hover:bg-slate-100'}`}
                >
                  <div className="flex flex-col">
                    <span className="font-black text-xs">{f}</span>
                    <span className="text-[8px] opacity-60 font-bold tracking-widest mt-1 uppercase">指南权重: {config.ctFeatures[f]}分</span>
                  </div>
                  {formData.ctFeatures.includes(f) ? <CheckCircle2 size={18} /> : <div className="w-5 h-5 rounded-full border-2 border-slate-200" />}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 font-bold italic">专家备注：系统已启用“Max + 0.5 * Others”科学算法，同时勾选多个征象将自动处理权重衰减，避免分值虚高。</p>
          </section>

          <section className="bg-slate-950 p-10 rounded-[48px] shadow-2xl space-y-12 text-white">
            <h3 className="text-xs font-black text-rose-500 uppercase tracking-[0.3em] flex items-center gap-3 border-b border-white/5 pb-6">
              <FlaskConical size={20} /> 04. 实验室指标
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest">分子检测 (Xpert)</label>
                <div className="flex gap-2">
                  {Object.keys(config.molecular || {}).map(m => (
                    <button key={m} type="button" onClick={() => setFormData({...formData, molecular: m})} className={`flex-1 py-3 rounded-xl border-2 text-[10px] font-black transition-all ${formData.molecular === m ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white/5 border-white/10 text-slate-500'}`}>{m}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-rose-400 uppercase tracking-widest">涂片</label>
                <div className="flex gap-2">
                  {Object.keys(config.smear).map(s => (
                    <button key={s} type="button" onClick={() => setFormData({...formData, smear: s})} className={`flex-1 py-3 rounded-xl border-2 text-[10px] font-black transition-all ${formData.smear === s ? 'bg-rose-600 border-rose-600 text-white' : 'bg-white/5 border-white/10 text-slate-500'}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-rose-400 uppercase tracking-widest">培养</label>
                <div className="flex gap-2">
                  {Object.keys(config.culture).map(c => (
                    <button key={c} type="button" onClick={() => setFormData({...formData, culture: c})} className={`flex-1 py-3 rounded-xl border-2 text-[10px] font-black transition-all ${formData.culture === c ? 'bg-rose-600 border-rose-600 text-white' : 'bg-white/5 border-white/10 text-slate-500'}`}>{c}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="pt-8 border-t border-white/10 space-y-4">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">免疫检测 (QFT)</label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(config.qft).map(q => (
                  <button key={q} type="button" onClick={() => setFormData({...formData, qft: q})} className={`px-6 py-2 rounded-xl border-2 font-black text-[10px] transition-all ${formData.qft === q ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white/5 border-white/10 text-slate-500'}`}>{q}</button>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 p-10 rounded-[48px] shadow-xl border border-slate-50 dark:border-slate-800 space-y-12">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-8">
              <History size={20} className="text-amber-500" /> 05. 既往史与症状
            </h3>
            <div className="space-y-10">
              <div className="space-y-4">
                <Label>高危历史</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(config.history).map(h => (
                    <button key={h} type="button" onClick={() => toggleItem('history', h)} className={`px-6 py-3 rounded-2xl border-2 font-black text-[10px] transition-all ${formData.history.includes(h) ? 'bg-slate-950 text-white border-slate-950' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400'}`}>{h}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <Label>临床典型症状</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(config.symptoms).map(s => (
                    <button key={s} type="button" onClick={() => toggleItem('symptoms', s)} className={`px-6 py-3 rounded-2xl border-2 font-black text-[10px] transition-all ${formData.symptoms.includes(s) ? 'bg-rose-600 text-white border-rose-600 shadow-md' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400'}`}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <button type="submit" disabled={submitted} className="w-full py-8 rounded-[40px] font-black text-xl text-white shadow-2xl transition-all flex items-center justify-center gap-4 bg-slate-950 hover:scale-[1.01]">
            <ChevronRight size={24}/> {submitted ? '正在保存档案...' : '提交评估并存档'}
          </button>
        </form>

        <div className="space-y-10">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[48px] shadow-2xl border border-slate-50 dark:border-slate-800 text-slate-900">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-12 flex items-center gap-3"><Calculator size={20} className="text-emerald-500"/> 指南决策看板</h3>
            <div className="grid grid-cols-2 gap-8 mb-12 text-center">
              <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-[32px]">
                <span className="text-[9px] font-black text-slate-400 uppercase block mb-2">BMI (自动评估)</span>
                <span className={`text-4xl font-black ${bmi > 0 && bmi < 18.5 ? 'text-amber-500' : 'text-emerald-500'}`}>{bmi || '--'}</span>
              </div>
              <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-[32px]">
                <span className="text-[9px] font-black text-slate-400 uppercase block mb-2">指南分值</span>
                <span className="text-4xl font-black text-emerald-500">{totalScore}</span>
              </div>
            </div>
            <div className="text-center p-10 bg-slate-50 dark:bg-slate-800 rounded-[40px] border-2 border-dashed border-slate-200">
               <div className={`text-lg font-black px-8 py-3 rounded-full inline-block mb-4 ${risk.level === '确诊结核病' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}>{risk.level}</div>
               <p className="text-[11px] text-slate-500 font-bold leading-relaxed">{risk.suggestion}</p>
            </div>
          </div>

          <div className="bg-slate-950 p-10 rounded-[48px] shadow-2xl text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Zap size={100} /></div>
            <div className="flex items-center justify-between mb-10 relative z-10">
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-3"><BrainCircuit size={20} /> AI 专家协同审计</h3>
              <Sparkles size={20} className="text-indigo-400 animate-pulse" />
            </div>
            
            <div className="space-y-6 relative z-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">临床补充笔记 (辅助审计)</label>
                <textarea 
                  value={rawNotes} 
                  onChange={e => setRawNotes(e.target.value)} 
                  placeholder="记录如：用药史、支气管镜表现、接触者排查详情等..." 
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-[32px] p-7 text-xs font-bold text-white outline-none focus:border-indigo-400" 
                />
              </div>

              <button 
                type="button" 
                onClick={runAiSynergy} 
                disabled={isAiProcessing} 
                className="w-full py-6 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-4 hover:scale-[1.02] transition-all shadow-xl shadow-indigo-600/20"
              >
                {isAiProcessing ? <Loader2 className="animate-spin" size={20}/> : <BrainCircuit size={20}/>} 
                {aiResult ? '重新启动逻辑审计' : '启动 AI 逻辑审计'}
              </button>

              {aiError && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex gap-3 text-rose-400 text-[10px] font-bold">
                  <AlertCircle size={14} /> {aiError}
                </div>
              )}

              {aiResult && (
                <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center justify-around bg-white/5 rounded-[2.5rem] p-8 border border-white/5">
                    <div className="text-center">
                      <span className="text-[8px] font-black text-slate-500 uppercase block mb-2">决策置信度</span>
                      <span className="text-2xl font-black text-emerald-400">{(aiResult.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-10 w-px bg-white/10"></div>
                    <div className="text-center">
                      <span className="text-[8px] font-black text-slate-500 uppercase block mb-2">协同修正分</span>
                      <span className="text-2xl font-black text-indigo-400">{aiResult.fusionScore}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Stethoscope size={14} /> 协议化处置建议
                    </h5>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl">
                      <p className="text-[11px] font-bold text-emerald-50 leading-relaxed">{aiResult.suggestedAction}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Activity size={14} /> 推理权重细节审计
                    </h5>
                    <div className="space-y-3">
                      {aiResult.impactFactors?.map((f, i) => (
                        <div key={i} className="flex flex-col gap-1 border-l-2 border-indigo-500/30 pl-4 py-1">
                          <div className="flex justify-between items-center text-[10px] font-black">
                            <span className="text-slate-300">{f.feature}</span>
                            <span className={f.impact >= 0 ? 'text-rose-400' : 'text-emerald-400'}>{f.impact > 0 ? `+${f.impact}` : f.impact} 分</span>
                          </div>
                          <p className="text-[9px] text-slate-500 font-bold leading-relaxed">{f.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {aiResult.anomalies && aiResult.anomalies.length > 0 && (
                    <div className="space-y-4">
                      <h5 className="text-[9px] font-black text-rose-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <AlertCircle size={14} /> 逻辑冲突审计
                      </h5>
                      <ul className="space-y-2">
                        {aiResult.anomalies.map((a, i) => (
                          <li key={i} className="text-[10px] font-bold text-rose-200 bg-rose-500/5 px-4 py-2 rounded-xl flex gap-2">
                            <span className="text-rose-500">•</span> {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="space-y-4">
                    <h5 className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Activity size={14} /> 专家思维逻辑链
                    </h5>
                    <p className="text-[10px] font-bold text-slate-400 leading-[1.8] italic bg-white/5 p-6 rounded-2xl border border-white/5">
                      "{aiResult.reasoning}"
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">{children}</label>
);

export default CaseInputPage;