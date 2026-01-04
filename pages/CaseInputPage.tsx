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
  AlertTriangle,
  User,
  ChevronRight,
  FlaskConical,
  Target,
  FileText,
  Users,
  CheckCircle2,
  Eye,
  History
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
          ctFeature: c.ctFeature || '无显著特征',
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
    score += config.ctFeatures[formData.ctFeature] || 0;
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

    setTotalScore(score);
    setRisk({ level, suggestion });
  }, [formData, config, bmi]);

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
      const prompt = `你是一位结核病防治专家。请基于以下病例数据进行深度协同分析，并【重点识别】临床指征与检测结果之间的非典型或矛盾点（例如：病原学阴性但临床症状极重且BMI暴跌；或强暴露史且CT典型但痰检阴性）。
      
      【基本信息】：姓名 ${formData.name}, 性别 ${formData.gender}, 年龄 ${formData.age}
      【指征】：BMI ${bmi}, 暴露史 ${formData.exposure}, 既往史 ${formData.history.join(',')}, 症状 ${formData.symptoms.join(',')}
      【检查】：CT特征 ${formData.ctFeature}, QFT ${formData.qft}, 涂片 ${formData.smear}, 培养 ${formData.culture}, 分子检测 ${formData.molecular}
      【临床笔记】：${rawNotes || '无'}
      
      【任务】：
      1. anomalies: 必须是一个数组，列举你识别到的所有“非典型/矛盾风险点”。
      2. reasoning: 详细的推导逻辑链。
      3. fusionScore: 综合上述矛盾点后给出的修正评分（应在 ${totalScore} 的基础上调整）。
      4. suggestedAction: 下一步干预建议。
      回复必须是全中文 JSON 格式。`;
      
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
      setAiError("AI 协同引擎暂时不可用。");
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
          <p className="text-[10px] text-slate-400 font-black tracking-widest uppercase mt-1">Multi-Dimensional Diagnostic System</p>
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
              <div className="md:col-span-2 space-y-2">
                <Label><Ruler size={14} className="inline mr-1"/> 身高 (cm)</Label>
                <input required type="number" step="0.1" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-slate-900 dark:text-white outline-none shadow-inner" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label><Scale size={14} className="inline mr-1"/> 体重 (kg)</Label>
                <input required type="number" step="0.1" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-slate-900 dark:text-white outline-none shadow-inner" />
              </div>
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

          <section className="bg-slate-950 p-10 rounded-[48px] shadow-2xl space-y-12 text-white">
            <h3 className="text-xs font-black text-rose-500 uppercase tracking-[0.3em] flex items-center gap-3 border-b border-white/5 pb-6">
              <FlaskConical size={20} /> 03. 实验室指标
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

          <section className="bg-white dark:bg-slate-900 p-10 rounded-[48px] shadow-xl border border-slate-50 dark:border-slate-800 space-y-10">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-8">
              <Eye size={20} className="text-indigo-500" /> 04. 影像学特征 (CT)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(config.ctFeatures).map(f => (
                <button key={f} type="button" onClick={() => setFormData({...formData, ctFeature: f})} className={`p-6 rounded-[32px] border-2 text-left transition-all flex items-center justify-between group ${formData.ctFeature === f ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500 hover:bg-slate-100'}`}>
                  <span className="font-black text-xs">{f}</span>
                  {formData.ctFeature === f && <CheckCircle2 size={18} />}
                </button>
              ))}
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
            <ChevronRight size={24}/> {submitted ? '正在保存核心档案...' : '提交专家协议评估'}
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
                <span className="text-[9px] font-black text-slate-400 uppercase block mb-2">Guideline Score</span>
                <span className="text-4xl font-black text-emerald-500">{totalScore}</span>
              </div>
            </div>
            <div className="text-center p-10 bg-slate-50 dark:bg-slate-800 rounded-[40px] border-2 border-dashed border-slate-200">
               <div className={`text-lg font-black px-8 py-3 rounded-full inline-block mb-4 ${risk.level === '确诊结核病' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}>{risk.level}</div>
               <p className="text-[11px] text-slate-500 font-bold leading-relaxed">{risk.suggestion}</p>
            </div>
          </div>

          <div className="bg-slate-950 p-12 rounded-[48px] shadow-2xl text-white">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-3"><BrainCircuit size={20} /> Synergy 专家协同推理</h3>
              <Sparkles size={20} className="text-indigo-400 animate-pulse" />
            </div>
            <textarea value={rawNotes} onChange={e => setRawNotes(e.target.value)} placeholder="记录病例特殊细节，AI 将深度挖掘指征与检测结果间的矛盾逻辑..." className="w-full h-32 bg-white/5 border border-white/10 rounded-[32px] p-7 text-xs font-bold text-white outline-none mb-6 focus:border-indigo-400" />
            <button type="button" onClick={runAiSynergy} disabled={isAiProcessing} className="w-full py-6 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-4 hover:scale-[1.02] transition-all shadow-xl shadow-indigo-500/20">
              {isAiProcessing ? <Loader2 className="animate-spin" size={20}/> : <BrainCircuit size={20}/>}
              启动 AI 协同分析
            </button>
            
            {aiResult && (
              <div className="mt-10 pt-10 border-t border-white/10 space-y-8 animate-in fade-in">
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[8px] font-black text-white/40 uppercase flex items-center gap-1"><FileText size={10} /> Guideline Score</p>
                      <p className="text-2xl font-black text-white">{totalScore}</p>
                   </div>
                   <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                      <p className="text-[8px] font-black text-emerald-400 uppercase flex items-center gap-1"><Target size={10} /> Fusion Score</p>
                      <p className="text-2xl font-black text-emerald-400">{aiResult.fusionScore}</p>
                   </div>
                </div>

                <div className="space-y-6">
                  {/* 识别到的非典型/矛盾风险点 */}
                  {aiResult.anomalies && aiResult.anomalies.length > 0 && (
                    <div className="bg-rose-500/10 p-6 rounded-3xl border border-rose-500/20">
                      <span className="text-[9px] font-black text-rose-400 uppercase block mb-3 flex items-center gap-2">
                        <AlertTriangle size={14} /> 识别到的非典型/矛盾风险点
                      </span>
                      <ul className="space-y-2">
                        {aiResult.anomalies.map((a, i) => (
                          <li key={i} className="text-[11px] text-slate-100 font-medium flex items-start gap-2 italic leading-relaxed">
                            <span className="mt-1.5 w-1 h-1 rounded-full bg-rose-500 shrink-0"></span>
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                    <span className="text-[9px] font-black text-indigo-400 uppercase block mb-2">专家推导链分析</span>
                    <p className="text-[11px] text-slate-200 leading-relaxed font-medium">“{aiResult.reasoning}”</p>
                  </div>
                  
                  <div className="bg-emerald-500/10 p-6 rounded-3xl border border-emerald-500/20">
                    <span className="text-[9px] font-black text-emerald-400 uppercase block mb-2">临床协同建议</span>
                    <p className="text-[11px] text-emerald-50 font-bold leading-relaxed">{aiResult.suggestedAction}</p>
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
  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">{children}</label>
);

export default CaseInputPage;