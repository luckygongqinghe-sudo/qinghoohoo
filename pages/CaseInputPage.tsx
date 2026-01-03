
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
  Scale,
  Ruler,
  History,
  AlertTriangle,
  User,
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

  // BMI 实时计算逻辑
  useEffect(() => {
    const h = parseFloat(formData.height) / 100;
    const w = parseFloat(formData.weight);
    if (h > 0.5 && w > 2.0) {
      setBmi(parseFloat((w / (h * h)).toFixed(1)));
    } else {
      setBmi(0);
    }
  }, [formData.height, formData.weight]);

  // 风险评分计算
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
      suggestion = '病原学阳性。请立即联系定点医疗机构启动抗结核化学治疗。';
    } else {
      const sortedThresholds = [...config.thresholds].sort((a,b) => b.min - a.min);
      const match = sortedThresholds.find(t => score >= t.min);
      level = match?.level || '无风险';
      suggestion = match?.suggestion || '目前风险较低。';
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
      // 使用 GEMINI_API_KEY 初始化，确保与 Vercel 注入对齐
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `结核病临床风险分析请求：
      患者: ${formData.name} (${formData.gender}/${formData.age}岁)
      体征: 身高${formData.height}cm, 体重${formData.weight}kg, BMI:${bmi}
      主诉症状: ${formData.symptoms.join(',') || '无'}
      既往史: ${formData.history.join(',') || '无'}
      影像特征: ${formData.ctFeature}
      实验室结果: QFT(${formData.qft}), 痰涂片(${formData.smear}), 痰培养(${formData.culture})
      系统初判: ${risk.level} (得分:${totalScore})
      补充信息: ${rawNotes}
      
      请结合临床指南，给出深度推理、修正分值及处置建议。`;
      
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
      console.error("AI Logic Error:", e);
      setAiError("AI 引擎调用失败。请确保您已在登录页“激活 AI 服务”并提供了有效的 Gemini 密钥。");
    } finally { setIsAiProcessing(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    const caseData: Case = {
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

    editId ? await updateCase(editId, caseData) : await addCase(caseData);
    setSubmitted(true);
    setTimeout(() => navigate('/dashboard/summary'), 800);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-xl">
          <Stethoscope className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{editId ? '修订评估报告' : '数字化结核病风险评估'}</h1>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1">Digital Clinical Assessment Suite</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左侧主要表单 */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-8">
          
          {/* 1. 基础体征卡片 - 解决显示不全问题 */}
          <section className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[40px] shadow-xl border border-slate-100 dark:border-slate-800 space-y-8">
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-6">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-3">
                <User size={18} className="text-emerald-500" /> 01. 基础生理指标
              </h3>
              <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest">关键生命体征</div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-2 space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">受检者姓名</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-slate-900 dark:text-white shadow-inner outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">年龄</label>
                <input required type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-slate-900 dark:text-white shadow-inner outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">性别</label>
                <div className="flex gap-2">
                  {['男', '女'].map(g => (
                    <button key={g} type="button" onClick={() => setFormData({...formData, gender: g as '男' | '女'})} className={`flex-1 py-4 rounded-2xl font-black text-xs transition-all border-2 ${formData.gender === g ? 'bg-slate-950 text-white border-slate-950 dark:bg-emerald-600 dark:border-emerald-600' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}>{g}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Ruler size={14}/> 身高 (cm)</label>
                <input required type="number" step="0.1" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-slate-900 dark:text-white shadow-inner outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Scale size={14}/> 体重 (kg)</label>
                <input required type="number" step="0.1" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-slate-900 dark:text-white shadow-inner outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
            </div>
          </section>

          {/* 2. 背景与症状卡片 */}
          <section className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[40px] shadow-xl border border-slate-100 dark:border-slate-800 space-y-8">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-6">
              <History size={18} className="text-indigo-500" /> 02. 临床背景与症状集
            </h3>
            
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">高危既往史 (多选)</label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(config.history).map(h => (
                    <button key={h} type="button" onClick={() => toggleItem('history', h)} className={`px-5 py-3 rounded-2xl border-2 font-black text-[11px] transition-all ${formData.history.includes(h) ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500'}`}>{h}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">临床核心症状 (多选)</label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(config.symptoms).map(s => (
                    <button key={s} type="button" onClick={() => toggleItem('symptoms', s)} className={`px-5 py-3 rounded-2xl border-2 font-black text-[11px] transition-all ${formData.symptoms.includes(s) ? 'bg-rose-600 text-white border-rose-600 shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500'}`}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 3. 风险与确诊卡片 */}
          <section className="bg-slate-950 p-8 md:p-10 rounded-[40px] shadow-2xl space-y-10 text-white">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Eye size={18} className="text-rose-500" /> 03. 实验室确诊与影像指标
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-500 uppercase">接触史风险</label>
                <div className="grid grid-cols-1 gap-2">
                  {Object.keys(config.exposure).map(e => (
                    <button key={e} type="button" onClick={() => setFormData({...formData, exposure: e})} className={`px-5 py-4 rounded-2xl border-2 text-left text-[11px] font-black transition-all ${formData.exposure === e ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white/5 border-white/10 text-slate-400'}`}>{e}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-500 uppercase">CT 影像特征</label>
                <div className="grid grid-cols-1 gap-2">
                  {Object.keys(config.ctFeatures).map(f => (
                    <button key={f} type="button" onClick={() => setFormData({...formData, ctFeature: f})} className={`px-5 py-4 rounded-2xl border-2 text-left text-[11px] font-black transition-all ${formData.ctFeature === f ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white/5 border-white/10 text-slate-400'}`}>{f}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-10 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-500 uppercase">QFT 结果</label>
                {Object.keys(config.qft).map(q => (
                  <button key={q} type="button" onClick={() => setFormData({...formData, qft: q})} className={`w-full py-3 rounded-xl border-2 text-xs font-black transition-all ${formData.qft === q ? 'bg-white text-slate-900 border-white' : 'bg-white/5 border-white/10 text-slate-500'}`}>{q}</button>
                ))}
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-rose-500 uppercase">痰涂片</label>
                {Object.keys(config.smear).map(s => (
                  <button key={s} type="button" onClick={() => setFormData({...formData, smear: s})} className={`w-full py-3 rounded-xl border-2 text-xs font-black transition-all ${formData.smear === s ? 'bg-rose-600 text-white border-rose-600' : 'bg-white/5 border-white/10 text-slate-500'}`}>{s}</button>
                ))}
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-rose-500 uppercase">痰培养</label>
                {Object.keys(config.culture).map(c => (
                  <button key={c} type="button" onClick={() => setFormData({...formData, culture: c})} className={`w-full py-3 rounded-xl border-2 text-xs font-black transition-all ${formData.culture === c ? 'bg-rose-600 text-white border-rose-600' : 'bg-white/5 border-white/10 text-slate-500'}`}>{c}</button>
                ))}
              </div>
            </div>
          </section>

          <button type="submit" disabled={submitted} className={`w-full py-6 rounded-[2.5rem] font-black text-xl text-white shadow-2xl transition-all ${submitted ? 'bg-emerald-600 scale-95 opacity-80' : 'bg-slate-950 dark:bg-emerald-600 hover:scale-[1.01]'}`}>
            {submitted ? '报告保存中...' : '提交评估并生成档案'}
          </button>
        </form>

        {/* 右侧实时分析 */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-xl border border-slate-100 dark:border-slate-800">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 flex items-center gap-2"><Calculator size={18} className="text-emerald-500"/> 实时计算面板</h3>
            
            <div className="grid grid-cols-2 gap-6 mb-10">
              <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl flex flex-col items-center">
                <span className="text-[9px] font-black text-slate-400 uppercase mb-2">BMI 指数</span>
                <span className={`text-3xl font-black ${bmi > 0 && bmi < 18.5 ? 'text-amber-500' : 'text-slate-900 dark:text-emerald-500'}`}>{bmi || '--'}</span>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl flex flex-col items-center">
                <span className="text-[9px] font-black text-slate-400 uppercase mb-2">标准评分</span>
                <span className="text-3xl font-black text-slate-900 dark:text-emerald-500">{totalScore}</span>
              </div>
            </div>

            <div className="text-center p-8 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
              <div className="text-[10px] font-black text-slate-400 uppercase mb-3">风险预测等级</div>
              <div className={`text-2xl font-black px-6 py-2 rounded-full inline-block ${risk.level === '确诊结核病' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-950 dark:text-white'}`}>{risk.level}</div>
              <div className="mt-6 flex gap-3 text-left">
                <Info size={16} className="shrink-0 text-emerald-500 mt-1" />
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 italic font-bold">“{risk.suggestion}”</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-10 rounded-[40px] shadow-2xl space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2"><BrainCircuit size={18} /> Synergy 推理引擎</h3>
              <Sparkles size={16} className="text-indigo-400 animate-pulse" />
            </div>
            
            <textarea value={rawNotes} onChange={e => setRawNotes(e.target.value)} placeholder="补充非结构化临床表现细节..." className="w-full h-36 bg-white/5 border border-white/10 rounded-3xl p-6 text-xs font-bold text-white outline-none resize-none focus:border-indigo-500" />
            
            <button type="button" onClick={runAiSynergy} disabled={isAiProcessing} className="w-full py-5 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] transition-all">
              {isAiProcessing ? <Loader2 className="animate-spin" size={18}/> : <Sparkles size={18}/>}
              {isAiProcessing ? '推理中...' : '启动 AI 协同分析'}
            </button>
            
            {aiError && <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-[10px] font-bold flex gap-3"><AlertCircle size={16} /> {aiError}</div>}
            
            {aiResult && (
              <div className="space-y-6 pt-6 border-t border-white/10 animate-in fade-in slide-in-from-top-4">
                <div className="flex justify-between items-center">
                   <div className="flex flex-col">
                     <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">AI 修正综合分</span>
                     <span className="text-3xl font-black text-indigo-400 tracking-tighter">{aiResult.fusionScore}</span>
                   </div>
                   <div className="text-right flex flex-col items-end">
                     <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">置信度</span>
                     <span className="text-lg font-black text-emerald-400">{(aiResult.confidence * 100).toFixed(0)}%</span>
                   </div>
                </div>
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                  <p className="text-[11px] text-slate-300 italic leading-relaxed font-medium">“{aiResult.reasoning}”</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseInputPage;
