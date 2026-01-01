
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { RiskLevel, Case } from '../types';
import { RISK_THRESHOLDS } from '../constants';
import { 
  Calculator, 
  ChevronRight, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  Thermometer,
  Edit3,
  ArrowLeft,
  Microscope,
  // Added Activity import to fix missing ActivitySquare error
  Activity
} from 'lucide-react';

const CaseInputPage: React.FC = () => {
  const { addCase, updateCase, config, siteConfig, currentUser, cases } = useStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get('edit');

  // 初始化状态，确保如果 config 中没有对应的 key，能优雅回退
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
  const [risk, setRisk] = useState<{ level: RiskLevel; suggestion: string }>({ 
    level: RiskLevel.NONE, 
    suggestion: '' 
  });
  const [submitted, setSubmitted] = useState(false);

  // 初始化加载编辑数据
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
          history: existingCase.history.filter(h => config.history[h] !== undefined), // 过滤掉已被管理员删除的项
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

  // 核心风险评估逻辑：根据 config 动态计算
  useEffect(() => {
    let score = 0;
    // 动态累加各项权重，使用 || 0 确保安全性
    formData.history.forEach(h => score += config.history[h] || 0);
    formData.symptoms.forEach(s => score += config.symptoms[s] || 0);
    score += config.exposure[formData.exposure] || 0;
    score += config.ctFeatures[formData.ctFeature] || 0;
    score += config.qft[formData.qft] || 0;
    score += config.smear[formData.smear] || 0;
    score += config.culture[formData.culture] || 0;

    // 关键判读：病原学阳性强制确诊
    const isLabPositive = formData.smear === '阳性' || formData.culture === '阳性';
    
    let finalLevel: RiskLevel = RiskLevel.NONE;
    let finalSuggestion = '';

    if (isLabPositive) {
      finalLevel = RiskLevel.CONFIRMED;
      const confThreshold = RISK_THRESHOLDS.find(t => t.level === '确诊结核病');
      finalSuggestion = confThreshold?.suggestion || '';
      if (score < 100) score = 100; // 确诊分值强制补齐
    } else {
      const matchingThreshold = RISK_THRESHOLDS.find(t => score >= t.min && score <= t.max);
      if (matchingThreshold) {
        if (matchingThreshold.level === '确诊结核病') {
          // 实验室阴性但分值过高，降级为极高危以示警惕
          finalLevel = RiskLevel.VERY_HIGH;
          finalSuggestion = '临床评分极高但病原学目前阴性，建议重复采样或考虑影像学动态观察。';
        } else {
          finalLevel = matchingThreshold.level as RiskLevel;
          finalSuggestion = matchingThreshold.suggestion;
        }
      } else if (score >= 100) {
        finalLevel = RiskLevel.VERY_HIGH;
        finalSuggestion = '临床评分已达极值，病原学检测目前阴性，建议进行支气管镜检查进一步排查。';
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
      creatorId: editId ? (cases.find(c => c.id === editId)?.creatorId || currentUser.id) : currentUser.id
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
        // 重置表单，并从当前 config 中动态获取默认项
        setFormData({
          name: '', age: '', gender: '男', height: '', weight: '',
          history: [], symptoms: [], 
          exposure: Object.keys(config.exposure)[0] || '', 
          ctFeature: '', 
          qft: Object.keys(config.qft)[0] || '', 
          smear: Object.keys(config.smear)[0] || '', 
          culture: Object.keys(config.culture)[0] || ''
        });
      }
    }, 1500);
  };

  return (
    <div className="space-y-6 text-slate-900">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-black text-slate-950 flex items-center gap-4">
            {editId && <div className="p-2 bg-amber-100 text-amber-600 rounded-xl"><Edit3 size={24}/></div>}
            {editId ? '修订患者评估档案' : siteConfig.inputPageTitle}
          </h1>
          <p className="text-slate-600 font-bold mt-1">{editId ? `正在为 ${formData.name} 更新诊断数据` : siteConfig.inputPageDesc}</p>
        </div>
        {editId && (
          <button onClick={() => navigate('/dashboard/summary')} className="flex items-center gap-2 px-6 py-3 text-slate-900 hover:bg-slate-100 rounded-2xl font-black transition-all">
            <ArrowLeft size={18} /> 中止并返回
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-[40px] p-10 border-2 border-slate-100 shadow-xl space-y-10">
            {/* 基本信息 */}
            <section>
              <h3 className="text-xl font-black text-slate-950 mb-8 flex items-center gap-3">
                <div className="w-2 h-8 bg-slate-950 rounded-full" />
                人口学基本特征
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <label className="block text-[12px] font-black text-slate-950 uppercase tracking-widest mb-3">患者全名</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 rounded-[20px] bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-950 outline-none text-slate-950 font-black transition-all" placeholder="输入姓名"/>
                </div>
                <div>
                  <label className="block text-[12px] font-black text-slate-950 uppercase tracking-widest mb-3">实足年龄</label>
                  <input required type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full px-5 py-4 rounded-[20px] bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-950 outline-none text-slate-950 font-black transition-all" placeholder="岁"/>
                </div>
                <div>
                  <label className="block text-[12px] font-black text-slate-950 uppercase tracking-widest mb-3">性别</label>
                  <div className="flex gap-3">
                    {['男', '女'].map(g => (
                      <button key={g} type="button" onClick={() => setFormData({...formData, gender: g as '男' | '女'})} className={`flex-1 py-4 rounded-[20px] border-2 transition-all font-black ${formData.gender === g ? 'border-slate-950 bg-slate-950 text-white shadow-xl' : 'border-slate-100 text-slate-500 hover:border-slate-300 bg-white'}`}>{g}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 items-end">
                <div>
                  <label className="block text-[12px] font-black text-slate-950 uppercase tracking-widest mb-3">身高 (cm)</label>
                  <input required type="number" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className="w-full px-5 py-4 rounded-[20px] bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-950 outline-none text-slate-950 font-black transition-all"/>
                </div>
                <div>
                  <label className="block text-[12px] font-black text-slate-950 uppercase tracking-widest mb-3">体重 (kg)</label>
                  <input required type="number" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full px-5 py-4 rounded-[20px] bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-950 outline-none text-slate-950 font-black transition-all"/>
                </div>
                <div className="bg-slate-50 p-5 rounded-[24px] border-2 border-slate-100 flex items-center justify-between shadow-inner">
                  <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest">BMI Index:</span>
                  <span className={`text-2xl font-black ${bmi >= 18.5 && bmi <= 24 ? 'text-emerald-600' : 'text-rose-600'}`}>{bmi || '--'}</span>
                </div>
              </div>
            </section>

            {/* 临床指标 - 动态从 config 渲染 */}
            <section>
              <h3 className="text-xl font-black text-slate-950 mb-8 flex items-center gap-3">
                <div className="w-2 h-8 bg-slate-950 rounded-full" />
                临床表征与病史
              </h3>
              <div className="space-y-8">
                <div>
                  <label className="block text-[12px] font-black text-slate-950 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <Thermometer size={16} className="text-rose-600" />
                    临床症状监测 (基于最新配置)
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {Object.keys(config.symptoms).map(item => (
                      <button 
                        key={item} 
                        type="button" 
                        onClick={() => handleToggleList('symptoms', item)} 
                        className={`px-6 py-3 rounded-[16px] border-2 transition-all text-[13px] font-black ${formData.symptoms.includes(item) ? 'bg-rose-50 border-rose-600 text-rose-700 shadow-md' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-950'}`}
                      >
                        {item} <span className="ml-2 text-[10px] opacity-60">+{config.symptoms[item]}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-black text-slate-950 uppercase tracking-widest mb-5">既往基础病史 (动态权重)</label>
                  <div className="flex flex-wrap gap-3">
                    {Object.keys(config.history).map(item => (
                      <button 
                        key={item} 
                        type="button" 
                        onClick={() => handleToggleList('history', item)} 
                        className={`px-6 py-3 rounded-[16px] border-2 transition-all text-[13px] font-black ${formData.history.includes(item) ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-md' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-950'}`}
                      >
                        {item} <span className="ml-2 text-[10px] opacity-60">+{config.history[item]}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-black text-slate-950 uppercase tracking-widest mb-5">结核病接触史评估</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.keys(config.exposure).map(exp => (
                      <button 
                        key={exp} 
                        type="button" 
                        onClick={() => setFormData({...formData, exposure: exp})} 
                        className={`p-4 rounded-[18px] border-2 text-left text-[13px] transition-all font-black ${formData.exposure === exp ? 'border-slate-950 bg-slate-950 text-white shadow-xl' : 'border-slate-100 text-slate-500 hover:border-slate-950 bg-white'}`}
                      >
                        {exp}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* 实验室检测 - 动态渲染 */}
            <section>
              <h3 className="text-xl font-black text-slate-950 mb-8 flex items-center gap-3">
                <div className="w-2 h-8 bg-slate-950 rounded-full" />
                实验室及影像中心
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                  <label className="block text-[12px] font-black text-slate-950 uppercase tracking-widest mb-3">胸部 CT 影像学表现</label>
                  <select value={formData.ctFeature} onChange={e => setFormData({...formData, ctFeature: e.target.value})} className="w-full px-5 py-4 rounded-[20px] bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-950 outline-none text-slate-950 font-black shadow-inner appearance-none transition-all">
                    <option value="">-- 请选择影像特征 --</option>
                    {Object.keys(config.ctFeatures).map(f => ( <option key={f} value={f}>{f} ({config.ctFeatures[f]}分)</option> ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-black text-slate-950 uppercase tracking-widest mb-3">QFT 干扰素释放试验</label>
                  <select value={formData.qft} onChange={e => setFormData({...formData, qft: e.target.value})} className="w-full px-5 py-4 rounded-[20px] bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-950 outline-none text-slate-950 font-black shadow-inner appearance-none transition-all">
                    {Object.keys(config.qft).map(f => ( <option key={f} value={f}>{f} ({config.qft[f]}分)</option> ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-black text-slate-950 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <Microscope size={14} className="text-rose-600" /> 痰抗酸染色涂片
                  </label>
                  <div className="flex gap-3">
                    {Object.keys(config.smear).map(r => ( 
                      <button key={r} type="button" onClick={() => setFormData({...formData, smear: r})} className={`flex-1 py-4 rounded-[20px] border-2 transition-all font-black text-[13px] ${formData.smear === r ? 'border-rose-600 bg-rose-50 text-rose-700 shadow-md' : 'border-slate-100 text-slate-500 bg-white hover:border-slate-950'}`}>{r}</button> 
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-black text-slate-950 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <Microscope size={14} className="text-rose-600" /> 分枝杆菌培养
                  </label>
                  <div className="flex gap-3">
                    {Object.keys(config.culture).map(r => ( 
                      <button key={r} type="button" onClick={() => setFormData({...formData, culture: r})} className={`flex-1 py-4 rounded-[20px] border-2 transition-all font-black text-[13px] ${formData.culture === r ? 'border-rose-600 bg-rose-50 text-rose-700 shadow-md' : 'border-slate-100 text-slate-500 bg-white hover:border-slate-950'}`}>{r}</button> 
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <button type="submit" disabled={submitted} className={`w-full py-6 rounded-[30px] font-black text-xl text-white transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-[0.98] ${submitted ? 'bg-emerald-600' : editId ? 'bg-slate-950 hover:bg-black ring-8 ring-slate-100' : 'bg-slate-950 hover:bg-black shadow-slate-200'}`}>
              {submitted ? ( <><CheckCircle2 /> 数据同步完成</> ) : editId ? ( <><Edit3 size={20}/> 确认更新病例档案</> ) : ( <><ChevronRight /> 提交并输出诊断报告</> )}
            </button>
          </form>
        </div>

        {/* 侧边风险透视面板 */}
        <div className="space-y-8">
          <div className="bg-white rounded-[50px] p-10 border-2 border-slate-100 shadow-2xl sticky top-8 text-slate-950 flex flex-col items-center">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-12 flex items-center gap-2">
              <Calculator size={18} /> 数字化实时分诊中心
            </h3>
            
            <div className="mb-12 text-center">
              <div className="text-slate-500 text-sm font-bold mb-4">实时综合评分 (Total Score)</div>
              <div className="text-8xl font-black text-slate-950 tracking-tighter">{totalScore}</div>
              {totalScore >= 100 && (formData.smear !== '阳性' && formData.culture !== '阳性') && (
                <div className="mt-4 px-4 py-2 bg-rose-50 text-rose-700 text-[11px] font-black rounded-full flex items-center gap-2 border border-rose-100 animate-in fade-in">
                  <AlertTriangle size={14}/> 核心实验指标阴性，当前强制锁定极高危
                </div>
              )}
            </div>

            <div className="w-full space-y-10">
              <div>
                <div className="flex justify-between items-end mb-4">
                  <span className="text-[12px] font-black text-slate-950 uppercase tracking-widest">风险等级判定</span>
                  <span className={`font-black px-4 py-1.5 rounded-full text-[12px] uppercase tracking-widest border-2 ${ 
                    risk.level === RiskLevel.NONE ? 'bg-slate-100 text-slate-600 border-slate-100' : 
                    risk.level === RiskLevel.LOW ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                    risk.level === RiskLevel.MEDIUM ? 'bg-amber-50 text-amber-700 border-amber-100' : 
                    risk.level === RiskLevel.HIGH ? 'bg-orange-50 text-orange-700 border-orange-100' : 
                    risk.level === RiskLevel.VERY_HIGH ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' : 
                    'bg-rose-950 text-white border-rose-950' 
                  }`}>{risk.level}</span>
                </div>
                <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden shadow-inner border border-slate-200">
                  <div className={`h-full transition-all duration-1000 ease-out ${ 
                    risk.level === RiskLevel.CONFIRMED ? 'bg-rose-950' : 
                    totalScore < 20 ? 'bg-emerald-500' : 
                    totalScore < 40 ? 'bg-amber-500' : 
                    totalScore < 60 ? 'bg-orange-500' : 
                    'bg-rose-600' 
                  }`} style={{ width: `${Math.min(totalScore, 100)}%` }}></div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 rounded-[32px] border-2 border-slate-100 shadow-inner relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                   <Info size={120} />
                </div>
                <div className="relative z-10 flex gap-5">
                  {/* Fixed ActivitySquare to Activity and ensure it is imported */}
                  <Activity className="shrink-0 w-8 h-8 text-slate-900" />
                  <div>
                    <p className="text-[12px] font-black mb-3 text-slate-950 uppercase tracking-widest">权威临床处置建议</p>
                    <p className="text-sm leading-relaxed text-slate-600 font-bold italic">“{risk.suggestion}”</p>
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
