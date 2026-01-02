
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store.tsx';
import { Case, AiInference } from '../types.ts';
import { GoogleGenAI } from "@google/genai";
import { 
  Calculator, 
  ChevronRight, 
  CheckCircle2, 
  Thermometer,
  Edit3,
  ArrowLeft,
  Microscope,
  Zap,
  Eye,
  Stethoscope,
  AlertTriangle,
  Activity,
  Sparkles,
  BrainCircuit,
  Loader2,
  Terminal,
  ShieldCheck,
  Info
} from 'lucide-react';

const CaseInputPage: React.FC = () => {
  const { addCase, updateCase, config, siteConfig, currentUser, cases } = useStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get('edit');

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '男' as '男' | '女',
    height: '',
    weight: '',
    history: [] as string[],
    symptoms: [] as string[],
    exposure: Object.keys(config.exposure)[0] || '',
    ctFeature: '',
    qft: Object.keys(config.qft)[0] || '',
    smear: Object.keys(config.smear)[0] || '',
    culture: Object.keys(config.culture)[0] || ''
  });

  const [rawNotes, setRawNotes] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<AiInference | null>(null);

  const [bmi, setBmi] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [risk, setRisk] = useState<{ level: string; suggestion: string }>({ 
    level: '计算中...', 
    suggestion: '' 
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (editId) {
      const existingCase = cases.find(c => c.id === editId);
      if (existingCase) {
        setFormData({
          name: existingCase.name,
          age: existingCase.age.toString(),
          gender: existingCase.gender,
          height: existingCase.height.toString(),
          weight: existingCase.weight.toString(),
          history: existingCase.history,
          symptoms: existingCase.symptoms,
          exposure: existingCase.exposure,
          ctFeature: existingCase.ctFeature,
          qft: existingCase.qftResult,
          smear: existingCase.smearResult,
          culture: existingCase.cultureResult
        });
        if (existingCase.aiInference) {
          setAiResult(existingCase.aiInference);
          setRawNotes(existingCase.aiInference.reasoning || '');
        }
      }
    }
  }, [editId, cases]);

  useEffect(() => {
    const h = parseFloat(formData.height) / 100;
    const w = parseFloat(formData.weight);
    if (h > 0 && w > 0) {
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

    const isPathogenPositive = formData.smear === '阳性' || formData.culture === '阳性';
    
    let finalLevel = '未定义';
    let finalSuggestion = '当前分值未匹配到建议。';

    if (isPathogenPositive) {
      const confThreshold = config.thresholds.find(t => t.level.includes('确诊'));
      finalLevel = confThreshold?.level || '确诊结核病';
      finalSuggestion = confThreshold?.suggestion || '检测到阳性病原学结果，依据指南立即启动治疗。';
      if (score < 100) score = 100; 
    } else {
      const matchingThreshold = config.thresholds.find(t => score >= t.min && score <= t.max);
      if (matchingThreshold) {
        finalLevel = matchingThreshold.level;
        finalSuggestion = matchingThreshold.suggestion;
      }
    }

    setTotalScore(score);
    setRisk({ level: finalLevel, suggestion: finalSuggestion });
  }, [formData, config]);

  const runAiSynergy = async () => {
    setIsAiProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        你是一个基于神经网络与专家知识协同架构 (Neural-Expert Synergy 2.0) 的诊断引擎。
        当前的评估任务是结核病 (TB) 的多维精准筛查。

        【临床指标矩阵】:
        - 基本信息: 性别 ${formData.gender}, 年龄 ${formData.age} 岁, BMI: ${bmi}
        - 临床症状: ${formData.symptoms.join(', ') || '无明显症状'}
        - 既往史: ${formData.history.join(', ') || '无相关病史'}
        - 影像学(CT)表现: ${formData.ctFeature || '未描述影像特征'}
        - 环境/风险暴露史: ${formData.exposure}
        - 实验室检查: QFT 结果(${formData.qft}), 痰涂片结果(${formData.smear}), 培养结果(${formData.culture})
        - 临床指南路径原始分值: ${totalScore} 分

        【补充临床观察记录 (非结构化数据)】:
        "${rawNotes || '未提供补充信息'}"

        【算法执行目标】:
        1. 深度分析：识别不同指标间的协同效应（如：高龄+糖尿病+不典型浸润的非线性风险叠加）。
        2. 特征融合：将临床指南的确定性逻辑与深度学习的模式识别相结合。
        3. 提供建议：产出具备创造性且符合医学伦理的临床处置方案。

        【输出规范】:
        必须严格以 JSON 格式输出，内容语言为简体中文，包含以下字段：
        - "reasoning": 深度逻辑推导，解释指标间的相互印证关系。
        - "fusionScore": 基于协同效应修正后的综合决策分值 (0-150)。
        - "anomalies": 识别出的临床矛盾点或特殊高危信号。
        - "suggestedAction": 具备可执行性的临床建议。
        - "confidence": 0 到 1 之间的置信度。
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', // 指定具有 Qwen3-Max 推理能力的模型
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 32000 } // 最大思考预算以实现最强逻辑
        }
      });

      const cleanJson = response.text.trim().replace(/^```json/, '').replace(/```$/, '');
      const result = JSON.parse(cleanJson);
      setAiResult(result);
    } catch (err) {
      console.error("AI Synergy Fusion Error:", err);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleToggleList = (field: 'history' | 'symptoms', val: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(val) ? prev[field].filter(i => i !== val) : [...prev[field], val]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const caseData: Case = {
      id: editId || Date.now().toString(),
      timestamp: editId ? (cases.find(c => c.id === editId)?.timestamp || Date.now()) : Date.now(),
      name: formData.name,
      age: parseInt(formData.age),
      gender: formData.gender,
      height: parseFloat(formData.height),
      weight: parseFloat(formData.weight),
      bmi: bmi,
      history: formData.history,
      symptoms: formData.symptoms,
      exposure: formData.exposure,
      ctFeature: formData.ctFeature || '无显著特征',
      ctScore: config.ctFeatures[formData.ctFeature] || 0,
      qftResult: formData.qft,
      smearResult: formData.smear,
      cultureResult: formData.culture,
      totalScore: aiResult?.fusionScore || totalScore,
      riskLevel: aiResult ? (aiResult.fusionScore >= 100 ? '确诊结核病' : (aiResult.fusionScore > 60 ? '高风险' : risk.level)) : risk.level,
      suggestion: aiResult?.suggestedAction || risk.suggestion,
      creatorId: editId ? (cases.find(c => c.id === editId)?.creatorId || currentUser.id) : currentUser.id,
      creatorName: editId ? (cases.find(c => c.id === editId)?.creatorName || currentUser.username) : currentUser.username,
      aiInference: aiResult || undefined
    };

    if (editId) {
      updateCase(editId, caseData);
    } else {
      addCase(caseData);
    }

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      navigate('/dashboard/summary');
    }, 1500);
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-white">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-950 dark:text-white flex items-center gap-3">
            {editId ? <Edit3 size={24} className="text-amber-500" /> : <Stethoscope size={24} className="text-emerald-600" />}
            {editId ? '编辑诊断档案' : siteConfig.inputPageTitle}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold mt-0.5 text-sm italic">
             {editId ? `病例识别码: ${editId}` : siteConfig.inputPageDesc}
          </p>
        </div>
        {editId && (
          <button onClick={() => navigate('/dashboard/summary')} className="flex items-center gap-2 px-6 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-sm transition-all hover:bg-slate-50 shadow-sm">
            <ArrowLeft size={16} /> 返回列表中心
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <form id="screening-form" onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 border border-slate-100 dark:border-slate-800 shadow-xl space-y-10">
            <section className="space-y-6">
              <h3 className="text-lg font-black text-slate-950 dark:text-white flex items-center gap-3 uppercase tracking-tighter">
                <div className="w-1.5 h-6 bg-emerald-600 rounded-full" />
                患者基础生命体征
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <InputLabel label="患者姓名" />
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-black text-slate-950 dark:text-white shadow-inner outline-none focus:ring-1 focus:ring-emerald-500" placeholder="姓名"/>
                </div>
                <div>
                  <InputLabel label="实足年龄" />
                  <input required type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full px-5 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-black text-slate-950 dark:text-white shadow-inner outline-none" placeholder="岁"/>
                </div>
                <div>
                  <InputLabel label="生理性别" />
                  <div className="flex gap-2">
                    {['男', '女'].map(g => (
                      <button key={g} type="button" onClick={() => setFormData({...formData, gender: g as '男' | '女'})} className={`flex-1 py-3.5 rounded-xl border-2 transition-all font-black text-xs ${formData.gender === g ? 'bg-slate-950 text-white border-slate-950 dark:bg-emerald-600 dark:border-emerald-600 shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}>{g}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div>
                  <InputLabel label="身高 (cm)" />
                  <input required type="number" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className="w-full px-5 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-black text-slate-950 dark:text-white shadow-inner"/>
                </div>
                <div>
                  <InputLabel label="体重 (kg)" />
                  <input required type="number" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full px-5 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-black text-slate-950 dark:text-white shadow-inner"/>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800 flex items-center justify-between">
                  <span className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest">BMI 指数</span>
                  <span className={`text-xl font-black ${bmi >= 18.5 && bmi <= 24 ? 'text-emerald-600' : 'text-rose-600'}`}>{bmi || '--'}</span>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="text-lg font-black text-slate-950 dark:text-white flex items-center gap-3 uppercase tracking-tighter">
                <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                临床症状与既往史
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Thermometer size={14} /> 核心临床症状 (可多选)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(config.symptoms).map(item => (
                      <button 
                        key={item} type="button" 
                        onClick={() => handleToggleList('symptoms', item)} 
                        className={`px-4 py-2.5 rounded-xl border transition-all text-[11px] font-black ${formData.symptoms.includes(item) ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-600 text-rose-700 dark:text-rose-400' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}
                      >
                        {item} <span className="ml-1 opacity-40">+{config.symptoms[item]}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">高危背景/既往病史</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(config.history).map(item => (
                      <button 
                        key={item} type="button" 
                        onClick={() => handleToggleList('history', item)} 
                        className={`px-4 py-2.5 rounded-xl border transition-all text-[11px] font-black ${formData.history.includes(item) ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-600 text-blue-700 dark:text-blue-400' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}
                      >
                        {item} <span className="ml-1 opacity-40">+{config.history[item]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="text-lg font-black text-slate-950 dark:text-white flex items-center gap-3 uppercase tracking-tighter">
                <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                影像表现与风险接触
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Zap size={14} className="text-amber-500" /> 流行病学接触史
                  </label>
                  <select 
                    value={formData.exposure} 
                    onChange={e => setFormData({...formData, exposure: e.target.value})}
                    className="w-full px-5 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-white font-black text-sm outline-none shadow-inner"
                  >
                    {Object.keys(config.exposure).map(exp => (
                      <option key={exp} value={exp}>{exp} (+{config.exposure[exp]})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Eye size={14} className="text-blue-500" /> 胸部 CT 影像特征
                  </label>
                  <select 
                    value={formData.ctFeature} 
                    onChange={e => setFormData({...formData, ctFeature: e.target.value})}
                    className="w-full px-5 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-white font-black text-sm outline-none shadow-inner"
                  >
                    <option value="">请选择主要影像学改变...</option>
                    {Object.keys(config.ctFeatures).map(feat => (
                      <option key={feat} value={feat}>{feat} (+{config.ctFeatures[feat]})</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="space-y-6 bg-slate-50 dark:bg-slate-800/40 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-950 dark:text-white flex items-center gap-3 uppercase tracking-tighter">
                <div className="w-1.5 h-6 bg-rose-600 rounded-full" />
                实验室检测结果
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Microscope size={14} className="text-indigo-600" /> QFT 实验
                  </label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {Object.keys(config.qft).map(res => (
                      <button key={res} type="button" onClick={() => setFormData({...formData, qft: res})} className={`px-4 py-2.5 rounded-xl border transition-all text-[11px] font-black ${formData.qft === res ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-600 text-indigo-700 dark:text-indigo-400' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}>{res}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                    <AlertTriangle size={14} /> 痰涂片结果
                  </label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {Object.keys(config.smear).map(res => (
                      <button key={res} type="button" onClick={() => setFormData({...formData, smear: res})} className={`px-4 py-2.5 rounded-xl border transition-all text-[11px] font-black ${formData.smear === res ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-600 text-rose-700 dark:text-rose-400' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}>{res}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                    <AlertTriangle size={14} /> 痰培养结果
                  </label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {Object.keys(config.culture).map(res => (
                      <button key={res} type="button" onClick={() => setFormData({...formData, culture: res})} className={`px-4 py-2.5 rounded-xl border transition-all text-[11px] font-black ${formData.culture === res ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-600 text-rose-700 dark:text-rose-400' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}>{res}</button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <button type="submit" form="screening-form" disabled={submitted} className={`w-full py-5 rounded-2xl font-black text-lg text-white transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] ${submitted ? 'bg-emerald-600' : 'bg-slate-950 dark:bg-emerald-600 hover:scale-[1.01]'}`}>
              {submitted ? ( <><CheckCircle2 /> 报告已归档并同步分析</> ) : editId ? ( <><Edit3 size={18}/> 更新评估档案</> ) : ( <><ChevronRight /> 提交评估报告</> )}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col items-center">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-10 flex items-center gap-2">
              <Calculator size={16} className="text-emerald-600" /> 标准专家路径评分
            </h3>
            <div className="mb-10 text-center">
              <div className="text-8xl font-black text-slate-950 dark:text-emerald-500 tracking-tighter">{totalScore}</div>
              <div className="text-slate-400 text-[10px] font-black uppercase mt-2 tracking-widest">Medical Score</div>
            </div>
            <div className="w-full space-y-8">
              <div>
                <div className="flex justify-between items-end mb-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">专家风险等级</span>
                  <span className={`font-black px-4 py-1.5 rounded-full text-[10px] uppercase border-2 ${risk.level === '确诊结核病' ? 'bg-rose-600 border-rose-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-100 dark:border-slate-700'}`}>
                    {risk.level}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full transition-all duration-700 ease-out" style={{ width: `${Math.min((totalScore / 100) * 100, 100)}%`, backgroundColor: totalScore > 60 ? '#e11d48' : totalScore > 30 ? '#f59e0b' : '#10b981' }}></div>
                </div>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
                <div className="flex gap-4">
                  <Activity size={24} className="shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-[9px] font-black mb-2 text-slate-400 uppercase tracking-widest">临床参考建议</p>
                    <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 font-bold italic">“{risk.suggestion}”</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 rounded-[2.5rem] p-8 shadow-2xl flex flex-col border border-white/5">
            <div className="w-full flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <BrainCircuit size={16} className="text-indigo-400" /> Neural-Expert Synergy (AI)
              </h3>
              <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Qwen3 Max Thinking</span>
              </div>
            </div>

            <div className="w-full space-y-6">
              <div className="relative">
                <textarea 
                  value={rawNotes}
                  onChange={e => setRawNotes(e.target.value)}
                  placeholder="在此输入补充病历记录或临床不典型表现，激活深度决策引擎进行特征融合分析..."
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-[13px] font-bold text-white placeholder:text-slate-700 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none leading-relaxed"
                />
                <Terminal size={14} className="absolute bottom-4 right-4 text-slate-800 pointer-events-none" />
              </div>

              <button 
                type="button"
                onClick={runAiSynergy}
                disabled={isAiProcessing}
                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${isAiProcessing ? 'bg-slate-800 text-slate-500' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-600/20'}`}
              >
                {isAiProcessing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {isAiProcessing ? '决策融合运算中...' : '启动 AI 协同推理'}
              </button>

              {aiResult && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
                  <div className="flex items-center justify-between border-t border-white/10 pt-6">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">神经网络融合评分</span>
                      <span className="text-3xl font-black text-indigo-400 leading-none">{aiResult.fusionScore}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">决策置信度</span>
                      <span className="text-lg font-black text-emerald-400 leading-none">{(aiResult.confidence * 100).toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                      <div className="flex items-center gap-2 mb-3">
                        <Zap size={14} className="text-indigo-400" />
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">深度推理逻辑</span>
                      </div>
                      <p className="text-[12px] leading-relaxed text-slate-300 font-bold italic">“{aiResult.reasoning}”</p>
                    </div>

                    {aiResult.anomalies.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1.5">
                          <AlertTriangle size={12} /> 识别到的高危/冲突信号
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {aiResult.anomalies.map((anom, i) => (
                            <span key={i} className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[8px] font-black text-rose-400 uppercase tracking-tighter">
                              {anom}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-emerald-500/10 rounded-2xl p-5 border border-emerald-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Activity size={14} className="text-emerald-400" />
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">协同处置建议</span>
                      </div>
                      <p className="text-[12px] leading-relaxed text-slate-200 font-bold">{aiResult.suggestedAction}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-center gap-2">
                     <ShieldCheck size={12} className="text-slate-600" />
                     <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">结果已归档至病例分析库</span>
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

const InputLabel = ({ label }: { label: string }) => (
  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5 ml-1">{label}</label>
);

export default CaseInputPage;
