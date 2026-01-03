
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store.tsx';
import { Case, AiInference } from '../types.ts';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Calculator, 
  ChevronRight, 
  CheckCircle2, 
  Stethoscope,
  Eye,
  Sparkles,
  BrainCircuit,
  Loader2,
  AlertCircle,
  Users,
  Scale,
  Ruler,
  History,
  AlertTriangle
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

  // 初始化编辑数据
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
          history: c.history || [],
          symptoms: c.symptoms || [],
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

  // BMI 实时计算
  useEffect(() => {
    const h = parseFloat(formData.height) / 100;
    const w = parseFloat(formData.weight);
    if (h > 0 && w > 0) {
      setBmi(parseFloat((w / (h * h)).toFixed(1)));
    } else {
      setBmi(0);
    }
  }, [formData.height, formData.weight]);

  // 分值与风险阶梯计算
  useEffect(() => {
    let score = 0;
    formData.history.forEach(h => score += config.history[h] || 0);
    formData.symptoms.forEach(s => score += config.symptoms[s] || 0);
    score += config.exposure[formData.exposure] || 0;
    score += config.ctFeatures[formData.ctFeature] || 0;
    score += config.qft[formData.qft] || 0;
    score += config.smear[formData.smear] || 0;
    score += config.culture[formData.culture] || 0;

    const isConfirmed = formData.smear === '阳性' || formData.culture === '阳性';
    let level = '评估中';
    let suggestion = '';

    if (isConfirmed) {
      level = '确诊结核病';
      suggestion = '病原学阳性，请立即启动规范治疗。';
    } else {
      const match = [...config.thresholds].sort((a,b) => b.min - a.min).find(t => score >= t.min);
      level = match?.level || '无风险';
      suggestion = match?.suggestion || '维持监测。';
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
      const prompt = `分析结核风险：${formData.name}, ${formData.age}岁, BMI:${bmi}, 症状:${formData.symptoms.join(',')}, 影像:${formData.ctFeature}, QFT:${formData.qft}, 涂片:${formData.smear}。备注：${rawNotes}`;
      
      const res = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 10000 },
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
    } catch (e) {
      setAiError("AI 引擎未就绪。请确认在登录页配置了密钥。");
    } finally { setIsAiProcessing(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const data: Case = {
      id: editId || Date.now().toString(),
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

    editId ? await updateCase(editId, data) : await addCase(data);
    setSubmitted(true);
    setTimeout(() => navigate('/dashboard/summary'), 800);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-3 mb-4">
        <Stethoscope className="text-emerald-600" size={28} />
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">{editId ? '编辑病例' : '风险评估录入'}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-8 bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800">
          
          {/* 1. 基础体征 (核心修复项) */}
          <section className="space-y-6">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1 h-4 bg-emerald-500 rounded-full" /> 1. 基础体征与生理指标
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 mb-2 ml-1">受检者姓名</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 ml-1">年龄</label>
                <input required type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full px-5 py-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 ml-1">身高 (cm)</label>
                <div className="relative">
                  <input required type="number" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className="w-full px-5 py-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold" />
                  <Ruler size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 ml-1">体重 (kg)</label>
                <div className="relative">
                  <input required type="number" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full px-5 py-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold" />
                  <Scale size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {['男', '女'].map(g => (
                <button key={g} type="button" onClick={() => setFormData({...formData, gender: g as '男' | '女'})} className={`flex-1 py-4 rounded-xl border-2 font-black text-xs transition-all ${formData.gender === g ? 'bg-slate-950 text-white border-slate-950 dark:bg-emerald-600 dark:border-emerald-600' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}>{g}</button>
              ))}
            </div>
          </section>

          {/* 2. 既往史与症状 */}
          <section className="space-y-6">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1 h-4 bg-indigo-500 rounded-full" /> 2. 临床背景与症状
            </h3>
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-slate-400 mb-2 flex items-center gap-2"><History size={14}/> 既往高危史 (多选)</label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(config.history).map(h => (
                  <button key={h} type="button" onClick={() => toggleItem('history', h)} className={`px-4 py-3 rounded-xl border text-[11px] font-bold transition-all ${formData.history.includes(h) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500'}`}>{h}</button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-slate-400 mb-2 flex items-center gap-2"><AlertTriangle size={14}/> 核心临床症状 (多选)</label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(config.symptoms).map(s => (
                  <button key={s} type="button" onClick={() => toggleItem('symptoms', s)} className={`px-4 py-3 rounded-xl border text-[11px] font-bold transition-all ${formData.symptoms.includes(s) ? 'bg-rose-600 text-white border-rose-600' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500'}`}>{s}</button>
                ))}
              </div>
            </div>
          </section>

          {/* 3. 风险与实验室 */}
          <section className="space-y-6 bg-slate-50 dark:bg-slate-800/40 p-8 rounded-3xl">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1 h-4 bg-rose-500 rounded-full" /> 3. 影像学与病原学确诊指标
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400">接触史</label>
                <div className="grid grid-cols-1 gap-2">
                  {Object.keys(config.exposure).map(e => (
                    <button key={e} type="button" onClick={() => setFormData({...formData, exposure: e})} className={`px-4 py-3 rounded-xl border text-[11px] font-bold text-left ${formData.exposure === e ? 'bg-slate-900 text-white dark:bg-emerald-600' : 'bg-white dark:bg-slate-800 text-slate-500'}`}>{e}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400">CT 影像特征</label>
                <div className="grid grid-cols-1 gap-2">
                  {Object.keys(config.ctFeatures).map(f => (
                    <button key={f} type="button" onClick={() => setFormData({...formData, ctFeature: f})} className={`px-4 py-3 rounded-xl border text-[11px] font-bold text-left ${formData.ctFeature === f ? 'bg-slate-900 text-white dark:bg-emerald-600' : 'bg-white dark:bg-slate-800 text-slate-500'}`}>{f}</button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <button type="submit" disabled={submitted} className={`w-full py-6 rounded-2xl font-black text-xl text-white shadow-xl transition-all ${submitted ? 'bg-emerald-600' : 'bg-slate-950 dark:bg-emerald-600 hover:scale-[1.02]'}`}>
            {submitted ? '档案已保存' : '提交评估档案'}
          </button>
        </form>

        {/* 右侧实时分析看板 */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2"><Calculator size={16}/> 实时临床评估</h3>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex flex-col items-center">
                <span className="text-[8px] font-black text-slate-400 uppercase mb-1">BMI 指数</span>
                <span className={`text-2xl font-black ${bmi < 18.5 && bmi > 0 ? 'text-amber-500' : 'text-slate-900 dark:text-emerald-500'}`}>{bmi || '--'}</span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex flex-col items-center">
                <span className="text-[8px] font-black text-slate-400 uppercase mb-1">临床量表分</span>
                <span className="text-2xl font-black text-slate-900 dark:text-emerald-500">{totalScore}</span>
              </div>
            </div>
            <div className="text-center p-6 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
              <div className="text-[10px] font-black text-slate-400 uppercase mb-2">风险预判等级</div>
              <div className={`text-2xl font-black ${risk.level === '确诊结核病' ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>{risk.level}</div>
              <p className="mt-3 text-[11px] text-slate-500 italic font-bold leading-relaxed">“{risk.suggestion}”</p>
            </div>
          </div>

          <div className="bg-slate-950 p-8 rounded-[2.5rem] shadow-2xl border border-white/5 space-y-6">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2"><BrainCircuit size={16} className="text-indigo-400"/> AI 协同推理引擎</h3>
            <textarea value={rawNotes} onChange={e => setRawNotes(e.target.value)} placeholder="补充临床表现细节..." className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none resize-none" />
            <button type="button" onClick={runAiSynergy} disabled={isAiProcessing} className="w-full py-5 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase flex items-center justify-center gap-2 hover:bg-indigo-500">
              {isAiProcessing ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>}
              {isAiProcessing ? '推理中...' : '启动 AI 风险穿透'}
            </button>
            {aiError && <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold rounded-xl flex gap-2"><AlertCircle size={14}/> {aiError}</div>}
            {aiResult && (
              <div className="space-y-4 pt-4 border-t border-white/10 animate-in fade-in">
                <div className="flex justify-between items-center">
                   <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">AI 融合分值</span>
                   <span className="text-2xl font-black text-indigo-400">{aiResult.fusionScore}</span>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl text-[11px] text-slate-300 italic">“{aiResult.reasoning}”</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseInputPage;
