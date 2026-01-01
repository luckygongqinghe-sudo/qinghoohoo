
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Case } from '../types';
import { 
  Calculator, 
  ChevronRight, 
  Info, 
  CheckCircle2, 
  Thermometer,
  Edit3,
  ArrowLeft,
  Microscope,
  Activity,
  Zap,
  ShieldCheck,
  Eye,
  Stethoscope
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

    const isLabPositive = formData.smear === '阳性' || formData.culture === '阳性';
    
    let finalLevel = '未定义';
    let finalSuggestion = '当前分值未匹配到建议。';

    if (isLabPositive) {
      const confThreshold = config.thresholds.find(t => t.level.includes('确诊'));
      finalLevel = confThreshold?.level || '确诊结核病';
      finalSuggestion = confThreshold?.suggestion || '检测到阳性病原学结果，建议立即治疗。';
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
      totalScore: totalScore,
      riskLevel: risk.level,
      suggestion: risk.suggestion,
      creatorId: editId ? (cases.find(c => c.id === editId)?.creatorId || currentUser.id) : currentUser.id,
      creatorName: editId ? (cases.find(c => c.id === editId)?.creatorName || currentUser.username) : currentUser.username
    };

    if (editId) {
      updateCase(editId, caseData);
    } else {
      addCase(caseData);
    }

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      if (editId) {
        navigate('/dashboard/summary');
      } else {
        setFormData({
          name: '', age: '', gender: '男', height: '', weight: '',
          history: [], symptoms: [], exposure: Object.keys(config.exposure)[0] || '',
          ctFeature: '', qft: Object.keys(config.qft)[0] || '',
          smear: Object.keys(config.smear)[0] || '', culture: Object.keys(config.culture)[0] || ''
        });
      }
    }, 1500);
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-950 dark:text-white flex items-center gap-4">
            {editId ? <Edit3 size={24} className="text-amber-500" /> : <Stethoscope size={24} className="text-emerald-600" />}
            {editId ? '编辑诊断记录' : siteConfig.inputPageTitle}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold mt-1">
             {editId ? `档案 ID: ${editId}` : siteConfig.inputPageDesc}
          </p>
        </div>
        {editId && (
          <button onClick={() => navigate('/dashboard/summary')} className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-black transition-all hover:bg-slate-50">
            <ArrowLeft size={18} /> 返回中心
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-[40px] p-10 border-2 border-slate-100 dark:border-slate-800 shadow-xl space-y-12">
            {/* Section 1: Demographics */}
            <section className="space-y-8">
              <h3 className="text-xl font-black text-slate-950 dark:text-white flex items-center gap-3">
                <div className="w-2 h-8 bg-emerald-600 rounded-full" />
                患者基本生命体征
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">患者全名</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 rounded-[20px] bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:border-emerald-500 outline-none text-slate-950 dark:text-white font-black transition-all" placeholder="输入姓名"/>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">实足年龄 (周岁)</label>
                  <input required type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full px-5 py-4 rounded-[20px] bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:border-emerald-500 outline-none text-slate-950 dark:text-white font-black transition-all" placeholder="岁"/>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">生理性别</label>
                  <div className="flex gap-2">
                    {['男', '女'].map(g => (
                      <button key={g} type="button" onClick={() => setFormData({...formData, gender: g as '男' | '女'})} className={`flex-1 py-4 rounded-[20px] border-2 transition-all font-black ${formData.gender === g ? 'bg-slate-950 text-white border-slate-950 dark:bg-emerald-600 dark:border-emerald-600 shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}>{g}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">身高 (cm)</label>
                  <input required type="number" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className="w-full px-5 py-4 rounded-[20px] bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:bg-white dark:focus:bg-slate-700 outline-none text-slate-950 dark:text-white font-black transition-all"/>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">体重 (kg)</label>
                  <input required type="number" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full px-5 py-4 rounded-[20px] bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:bg-white dark:focus:bg-slate-700 outline-none text-slate-950 dark:text-white font-black transition-all"/>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-5 rounded-[24px] border border-emerald-100 dark:border-emerald-800 flex items-center justify-between">
                  <span className="text-[11px] font-black text-emerald-600/60 uppercase tracking-widest">计算 BMI 指数</span>
                  <span className={`text-2xl font-black ${bmi >= 18.5 && bmi <= 24 ? 'text-emerald-600' : 'text-rose-600'}`}>{bmi || '--'}</span>
                </div>
              </div>
            </section>

            {/* Section 2: Clinical Profile */}
            <section className="space-y-8">
              <h3 className="text-xl font-black text-slate-950 dark:text-white flex items-center gap-3">
                <div className="w-2 h-8 bg-blue-600 rounded-full" />
                临床评估与既往病史
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Thermometer size={14} /> 核心临床症状
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(config.symptoms).map(item => (
                      <button 
                        key={item} type="button" 
                        onClick={() => handleToggleList('symptoms', item)} 
                        className={`px-5 py-3 rounded-2xl border-2 transition-all text-xs font-black ${formData.symptoms.includes(item) ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-600 text-rose-700 dark:text-rose-400' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}
                      >
                        {item} <span className="ml-1 opacity-50">+{config.symptoms[item]}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">伴随基础疾病</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(config.history).map(item => (
                      <button 
                        key={item} type="button" 
                        onClick={() => handleToggleList('history', item)} 
                        className={`px-5 py-3 rounded-2xl border-2 transition-all text-xs font-black ${formData.history.includes(item) ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-600 text-blue-700 dark:text-blue-400' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}
                      >
                        {item} <span className="ml-1 opacity-50">+{config.history[item]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Imaging & Exposure */}
            <section className="space-y-8">
              <h3 className="text-xl font-black text-slate-950 dark:text-white flex items-center gap-3">
                <div className="w-2 h-8 bg-amber-500 rounded-full" />
                影像特征与接触风险
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Zap size={14} className="text-amber-500" /> 流行病学接触史
                  </label>
                  <select 
                    value={formData.exposure} 
                    onChange={e => setFormData({...formData, exposure: e.target.value})}
                    className="w-full px-5 py-4 rounded-[20px] bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:border-amber-500 outline-none text-slate-900 dark:text-white font-black transition-all"
                  >
                    {Object.keys(config.exposure).map(exp => (
                      <option key={exp} value={exp}>{exp} (+{config.exposure[exp]})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Eye size={14} className="text-blue-500" /> 胸部 CT 影像主要特征
                  </label>
                  <select 
                    value={formData.ctFeature} 
                    onChange={e => setFormData({...formData, ctFeature: e.target.value})}
                    className="w-full px-5 py-4 rounded-[20px] bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:border-blue-500 outline-none text-slate-900 dark:text-white font-black transition-all"
                  >
                    <option value="">请选择主要影像表现...</option>
                    {Object.keys(config.ctFeatures).map(feat => (
                      <option key={feat} value={feat}>{feat} (+{config.ctFeatures[feat]})</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Section 4: Laboratory Results */}
            <section className="space-y-8">
              <h3 className="text-xl font-black text-slate-950 dark:text-white flex items-center gap-3">
                <div className="w-2 h-8 bg-indigo-600 rounded-full" />
                实验室病原学检测
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Microscope size={14} className="text-indigo-600" /> QFT 实验
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.keys(config.qft).map(res => (
                      <button 
                        key={res} type="button" 
                        onClick={() => setFormData({...formData, qft: res})}
                        className={`px-4 py-3 rounded-xl border-2 transition-all text-xs font-black ${formData.qft === res ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-600 text-indigo-700 dark:text-indigo-300' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}
                      >
                        {res}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">痰涂片抗酸染色</label>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.keys(config.smear).map(res => (
                      <button 
                        key={res} type="button" 
                        onClick={() => setFormData({...formData, smear: res})}
                        className={`px-4 py-3 rounded-xl border-2 transition-all text-xs font-black ${formData.smear === res ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-600 text-rose-700 dark:text-rose-400' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}
                      >
                        {res}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">分枝杆菌培养</label>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.keys(config.culture).map(res => (
                      <button 
                        key={res} type="button" 
                        onClick={() => setFormData({...formData, culture: res})}
                        className={`px-4 py-3 rounded-xl border-2 transition-all text-xs font-black ${formData.culture === res ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-600 text-rose-700 dark:text-rose-400' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}
                      >
                        {res}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <button type="submit" disabled={submitted} className={`w-full py-6 rounded-[30px] font-black text-xl text-white transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-[0.98] ${submitted ? 'bg-emerald-600' : 'bg-slate-950 dark:bg-emerald-600 hover:bg-black dark:hover:bg-emerald-700'}`}>
              {submitted ? ( <><CheckCircle2 /> 数据保存成功</> ) : editId ? ( <><Edit3 size={20}/> 更新诊断档案</> ) : ( <><ChevronRight /> 提交评估报告</> )}
            </button>
          </form>
        </div>

        {/* Floating Result Panel */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-[50px] p-10 border-2 border-slate-100 dark:border-slate-800 shadow-2xl sticky top-32 text-slate-950 dark:text-white flex flex-col items-center">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-12 flex items-center gap-2">
              <Calculator size={18} className="text-emerald-600" /> 实时风险分诊中心
            </h3>
            
            <div className="mb-12 text-center">
              <div className="text-slate-400 text-sm font-bold mb-4">当前医学评分总计</div>
              <div className="text-8xl font-black text-slate-950 dark:text-emerald-500 tracking-tighter">{totalScore}</div>
            </div>

            <div className="w-full space-y-10">
              <div>
                <div className="flex justify-between items-end mb-4">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">风险程度评级</span>
                  <span className={`font-black px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest border-2 ${risk.level === '确诊结核病' ? 'bg-rose-600 text-white border-rose-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700'}`}>
                    {risk.level}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full transition-all duration-1000 ease-out" style={{ width: `${Math.min((totalScore / 100) * 100, 100)}%`, backgroundColor: totalScore > 60 ? '#e11d48' : totalScore > 30 ? '#f59e0b' : '#10b981' }}></div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-[32px] border-2 border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                <div className="relative z-10 flex gap-4">
                  <Activity className="shrink-0 w-8 h-8 text-emerald-600" />
                  <div>
                    <p className="text-[11px] font-black mb-3 text-slate-400 uppercase tracking-widest">专家共识处置建议</p>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 font-bold italic">“{risk.suggestion}”</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseInputPage;
