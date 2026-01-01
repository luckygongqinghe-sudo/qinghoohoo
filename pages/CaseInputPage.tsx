
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
  Eye
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
          history: existingCase.history.filter(h => config.history[h] !== undefined),
          symptoms: existingCase.symptoms.filter(s => config.symptoms[s] !== undefined),
          exposure: config.exposure[existingCase.exposure] !== undefined ? existingCase.exposure : Object.keys(config.exposure)[0] || '',
          ctFeature: config.ctFeatures[existingCase.ctFeature] !== undefined ? existingCase.ctFeature : '',
          qft: config.qft[existingCase.qftResult] !== undefined ? existingCase.qftResult : Object.keys(config.qft)[0] || '',
          smear: config.smear[existingCase.smearResult] !== undefined ? existingCase.smearResult : Object.keys(config.smear)[0] || '',
          culture: config.culture[existingCase.cultureResult] !== undefined ? existingCase.cultureResult : Object.keys(config.culture)[0] || ''
        });
      }
    }
  }, [editId, cases, config]);

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
    let finalSuggestion = '当前分值未匹配到任何临床建议，请联系管理员配置风险等级。';

    if (isLabPositive) {
      const confThreshold = config.thresholds.find(t => t.level.includes('确诊'));
      finalLevel = confThreshold?.level || '确诊结核病';
      finalSuggestion = confThreshold?.suggestion || '检测到阳性病原学结果，建议立即按照指南治疗。';
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
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-black text-slate-950 dark:text-white flex items-center gap-4">
            {editId && <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-xl"><Edit3 size={24}/></div>}
            {editId ? '修订患者评估档案' : siteConfig.inputPageTitle}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 font-bold mt-1">{editId ? `正在为 ${formData.name} 更新诊断数据` : siteConfig.inputPageDesc}</p>
        </div>
        {editId && (
          <button onClick={() => navigate('/dashboard/summary')} className="flex items-center gap-2 px-6 py-3 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl font-black transition-all">
            <ArrowLeft size={18} /> 中止并返回
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-[40px] p-10 border-2 border-slate-100 dark:border-slate-800 shadow-xl space-y-12 apple-transition">
            {/* Section 1: Demographics */}
            <section>
              <h3 className="text-xl font-black text-slate-950 dark:text-white mb-8 flex items-center gap-3">
                <div className="w-2 h-8 bg-slate-950 dark:bg-emerald-500 rounded-full" />
                人口学基本特征
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <label className="block text-[12px] font-black text-slate-950 dark:text-slate-400 uppercase tracking-widest mb-3">患者全名</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 rounded-[20px] bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:border-slate-950 dark:focus:border-emerald-500 outline-none text-slate-950 dark:text-white font-black transition-all" placeholder="输入姓名"/>
                </div>
                <div>
                  <label className="block text-[12px] font-black text-slate-950 dark:text-slate-400 uppercase tracking-widest mb-3">实足年龄</label>
                  <input required type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full px-5 py-4 rounded-[20px] bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:border-slate-950 dark:focus:border-emerald-500 outline-none text-slate-950 dark:text-white font-black transition-all" placeholder="岁"/>
                </div>
                <div>
                  <label className="block text-[12px] font-black text-slate-950 dark:text-slate-400 uppercase tracking-widest mb-3">性别</label>
                  <div className="flex gap-3">
                    {['男', '女'].map(g => (
                      <button key={g} type="button" onClick={() => setFormData({...formData, gender: g as '男' | '女'})} className={`flex-1 py-4 rounded-[20px] border-2 transition-all font-black ${formData.gender === g ? 'border-slate-950 bg-slate-950 text-white dark:border-emerald-500 dark:bg-emerald-600 shadow-xl' : 'border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800'}`}>{g}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 items-end">
                <div>
                  <label className="block text-[12px] font-black text-slate-950 dark:text-slate-400 uppercase tracking-widest mb-3">身高 (cm)</label>
                  <input required type="number" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className="w-full px-5 py-4 rounded-[20px] bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:bg-white dark:focus:bg-slate-700 outline-none text-slate-950 dark:text-white font-black transition-all"/>
                </div>
                <div>
                  <label className="block text-[12px] font-black text-slate-950 dark:text-slate-400 uppercase tracking-widest mb-3">体重 (kg)</label>
                  <input required type="number" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full px-5 py-4 rounded-[20px] bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:bg-white dark:focus:bg-slate-700 outline-none text-slate-950 dark:text-white font-black transition-all"/>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-[24px] border-2 border-slate-100 dark:border-slate-700 flex items-center justify-between shadow-inner">
                  <span className="text-[12px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">BMI Index:</span>
                  <span className={`text-2xl font-black ${bmi >= 18.5 && bmi <= 24 ? 'text-emerald-600' : 'text-rose-600'}`}>{bmi || '--'}</span>
                </div>
              </div>
            </section>

            {/* Section 2: History and Symptoms */}
            <section>
              <h3 className="text-xl font-black text-slate-950 dark:text-white mb-8 flex items-center gap-3">
                <div className="w-2 h-8 bg-slate-950 dark:bg-emerald-500 rounded-full" />
                临床表征与病史
              </h3>
              <div className="space-y-8">
                <div>
                  <label className="block text-[12px] font-black text-slate-950 dark:text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <Thermometer size={16} className="text-rose-600" />
                    临床症状监测
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {Object.keys(config.symptoms).map(item => (
                      <button 
                        key={item} 
                        type="button" 
                        onClick={() => handleToggleList('symptoms', item)} 
                        className={`px-6 py-3 rounded-[16px] border-2 transition-all text-[13px] font-black ${formData.symptoms.includes(item) ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-600 text-rose-700 dark:text-rose-400 shadow-md' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-950'}`}
                      >
                        {item} <span className="ml-2 text-[10px] opacity-60">+{config.symptoms[item]}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-black text-slate-950 dark:text-slate-400 uppercase tracking-widest mb-5">既往基础病史</label>
                  <div className="flex flex-wrap gap-3">
                    {Object.keys(config.history).map(item => (
                      <button 
                        key={item} 
                        type="button" 
                        onClick={() => handleToggleList('history', item)} 
                        className={`px-6 py-3 rounded-[16px] border-2 transition-all text-[13px] font-black ${formData.history.includes(item) ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-600 text-indigo-700 dark:text-indigo-400 shadow-md' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-950'}`}
                      >
                        {item} <span className="ml-2 text-[10px] opacity-60">+{config.history[item]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Exposure and CT Features (Restored) */}
            <section>
              <h3 className="text-xl font-black text-slate-950 dark:text-white mb-8 flex items-center gap-3">
                <div className="w-2 h-8 bg-slate-950 dark:bg-emerald-500 rounded-full" />
                接触史与影像特征
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[12px] font-black text-slate-950 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Zap size={16} className="text-amber-500" /> 流行病学接触史
                  </label>
                  <select 
                    value={formData.exposure} 
                    onChange={e => setFormData({...formData, exposure: e.target.value})}
                    className="w-full px-5 py-4 rounded-[20px] bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:border-slate-950 dark:focus:border-emerald-500 outline-none text-slate-900 dark:text-white font-black transition-all"
                  >
                    {Object.keys(config.exposure).map(exp => (
                      <option key={exp} value={exp}>{exp} (+{config.exposure[exp]})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-black text-slate-950 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Eye size={16} className="text-blue-500" /> CT 影像特征
                  </label>
                  <select 
                    value={formData.ctFeature} 
                    onChange={e => setFormData({...formData, ctFeature: e.target.value})}
                    className="w-full px-5 py-4 rounded-[20px] bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:border-slate-950 dark:focus:border-emerald-500 outline-none text-slate-900 dark:text-white font-black transition-all"
                  >
                    <option value="">请选择主要影像特征...</option>
                    {Object.keys(config.ctFeatures).map(feat => (
                      <option key={feat} value={feat}>{feat} (+{config.ctFeatures[feat]})</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Section 4: Laboratory Tests (Restored) */}
            <section>
              <h3 className="text-xl font-black text-slate-950 dark:text-white mb-8 flex items-center gap-3">
                <div className="w-2 h-8 bg-slate-950 dark:bg-emerald-500 rounded-full" />
                实验室检测结果
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* QFT */}
                <div className="space-y-4">
                  <label className="block text-[12px] font-black text-slate-950 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Microscope size={16} className="text-emerald-500" /> QFT 结果
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.keys(config.qft).map(res => (
                      <button 
                        key={res} type="button" 
                        onClick={() => setFormData({...formData, qft: res})}
                        className={`px-4 py-3 rounded-xl border-2 transition-all text-xs font-black ${formData.qft === res ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-600 text-emerald-700 dark:text-emerald-400' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500'}`}
                      >
                        {res}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Smear */}
                <div className="space-y-4">
                  <label className="block text-[12px] font-black text-slate-950 dark:text-slate-400 uppercase tracking-widest">痰涂片结果</label>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.keys(config.smear).map(res => (
                      <button 
                        key={res} type="button" 
                        onClick={() => setFormData({...formData, smear: res})}
                        className={`px-4 py-3 rounded-xl border-2 transition-all text-xs font-black ${formData.smear === res ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-600 text-emerald-700 dark:text-emerald-400' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500'}`}
                      >
                        {res}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Culture */}
                <div className="space-y-4">
                  <label className="block text-[12px] font-black text-slate-950 dark:text-slate-400 uppercase tracking-widest">分枝杆菌培养</label>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.keys(config.culture).map(res => (
                      <button 
                        key={res} type="button" 
                        onClick={() => setFormData({...formData, culture: res})}
                        className={`px-4 py-3 rounded-xl border-2 transition-all text-xs font-black ${formData.culture === res ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-600 text-emerald-700 dark:text-emerald-400' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500'}`}
                      >
                        {res}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <button type="submit" disabled={submitted} className={`w-full py-6 rounded-[30px] font-black text-xl text-white transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-[0.98] ${submitted ? 'bg-emerald-600' : 'bg-slate-950 dark:bg-emerald-600 hover:bg-black dark:hover:bg-emerald-700 shadow-slate-200 dark:shadow-emerald-900/40'}`}>
              {submitted ? ( <><CheckCircle2 /> 数据已同步</> ) : editId ? ( <><Edit3 size={20}/> 确认更新</> ) : ( <><ChevronRight /> 提交诊断报告</> )}
            </button>
          </form>
        </div>

        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-[50px] p-10 border-2 border-slate-100 dark:border-slate-800 shadow-2xl sticky top-8 text-slate-950 dark:text-white flex flex-col items-center apple-transition">
            <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-12 flex items-center gap-2">
              <Calculator size={18} /> 分诊中心
            </h3>
            
            <div className="mb-12 text-center">
              <div className="text-slate-500 dark:text-slate-400 text-sm font-bold mb-4">实时评分 (Total)</div>
              <div className="text-8xl font-black text-slate-950 dark:text-emerald-500 tracking-tighter">{totalScore}</div>
            </div>

            <div className="w-full space-y-10">
              <div>
                <div className="flex justify-between items-end mb-4">
                  <span className="text-[12px] font-black text-slate-950 dark:text-slate-400 uppercase tracking-widest">风险判定</span>
                  <span className="font-black px-4 py-1.5 rounded-full text-[12px] uppercase tracking-widest border-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700">
                    {risk.level}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-4 rounded-full overflow-hidden shadow-inner border border-slate-200 dark:border-slate-700">
                  <div className={`h-full transition-all duration-1000 ease-out`} style={{ width: `${Math.min((totalScore / 100) * 100, 100)}%`, backgroundColor: totalScore > 60 ? '#e11d48' : totalScore > 40 ? '#f59e0b' : '#10b981' }}></div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-[32px] border-2 border-slate-100 dark:border-slate-700 shadow-inner relative overflow-hidden group">
                <div className="relative z-10 flex gap-5">
                  <Activity className="shrink-0 w-8 h-8 text-slate-900 dark:text-emerald-500" />
                  <div>
                    <p className="text-[12px] font-black mb-3 text-slate-950 dark:text-slate-300 uppercase tracking-widest">临床建议</p>
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
