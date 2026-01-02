
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Case } from '../types';
import { 
  Calculator, 
  ChevronRight, 
  CheckCircle2, 
  Thermometer,
  Edit3,
  ArrowLeft,
  Microscope,
  Activity,
  Zap,
  Eye,
  Stethoscope,
  AlertTriangle
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

    // 严格医学逻辑：只有痰涂片阳性或培养阳性才能进入“确诊”状态
    const isPathogenPositive = formData.smear === '阳性' || formData.culture === '阳性';
    
    let finalLevel = '未定义';
    let finalSuggestion = '当前分值未匹配到建议。';

    if (isPathogenPositive) {
      // 满足病原学金标准
      const confThreshold = config.thresholds.find(t => t.level.includes('确诊'));
      finalLevel = confThreshold?.level || '确诊结核病';
      finalSuggestion = confThreshold?.suggestion || '检测到阳性病原学结果，依据指南立即启动治疗。';
      if (score < 100) score = 100; // 确诊后锁定为最高分层分值
    } else {
      // 不满足病原学金标准：即使分数再高，也只能匹配非确诊的分层
      const nonConfThresholds = config.thresholds.filter(t => !t.level.includes('确诊'));
      // 按分值范围寻找匹配
      const matchingThreshold = nonConfThresholds.find(t => score >= t.min && score <= t.max);
      
      if (matchingThreshold) {
        finalLevel = matchingThreshold.level;
        finalSuggestion = matchingThreshold.suggestion;
      } else if (score >= 100) {
        // 如果分值超过确诊阈值但无病原学证据，降级为非确诊类别的最高风险等级
        const highestNonConf = [...nonConfThresholds].sort((a,b) => b.max - a.max)[0];
        finalLevel = highestNonConf?.level || '极高危风险';
        finalSuggestion = `(分值偏高但缺乏病原学证据) ${highestNonConf?.suggestion || '建议进一步完善病原学检查。'}`;
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
          <h1 className="text-2xl font-black text-slate-950 dark:text-white flex items-center gap-3">
            {editId ? <Edit3 size={24} className="text-amber-500" /> : <Stethoscope size={24} className="text-emerald-600" />}
            {editId ? '编辑诊断记录' : siteConfig.inputPageTitle}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold mt-0.5 text-sm italic">
             {editId ? `档案 ID: ${editId}` : siteConfig.inputPageDesc}
          </p>
        </div>
        {editId && (
          <button onClick={() => navigate('/dashboard/summary')} className="flex items-center gap-2 px-6 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-sm transition-all hover:bg-slate-50 shadow-sm">
            <ArrowLeft size={16} /> 返回列表
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 border border-slate-100 dark:border-slate-800 shadow-xl space-y-10">
            {/* 患者体征 */}
            <section className="space-y-6">
              <h3 className="text-lg font-black text-slate-950 dark:text-white flex items-center gap-3 uppercase tracking-tighter">
                <div className="w-1.5 h-6 bg-emerald-600 rounded-full" />
                患者基本生命体征
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <InputLabel label="患者姓名" />
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-black text-slate-950 dark:text-white transition-all shadow-inner" placeholder="输入姓名"/>
                </div>
                <div>
                  <InputLabel label="实足年龄" />
                  <input required type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full px-5 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-black text-slate-950 dark:text-white shadow-inner" placeholder="岁"/>
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

            {/* 临床症状 */}
            <section className="space-y-6">
              <h3 className="text-lg font-black text-slate-950 dark:text-white flex items-center gap-3 uppercase tracking-tighter">
                <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                临床症状与既往病史
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Thermometer size={14} /> 核心临床症状 (多选)
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
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">合并症与既往史</label>
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

            {/* 病原学核心 - 确诊依据 */}
            <section className="space-y-6 bg-slate-50 dark:bg-slate-800/40 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-950 dark:text-white flex items-center gap-3 uppercase tracking-tighter">
                <div className="w-1.5 h-6 bg-rose-600 rounded-full" />
                病原学金标准检测 (确诊硬性指标)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Microscope size={14} className="text-indigo-600" /> QFT 实验结果
                  </label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {Object.keys(config.qft).map(res => (
                      <button key={res} type="button" onClick={() => setFormData({...formData, qft: res})} className={`px-4 py-2.5 rounded-xl border transition-all text-[11px] font-black ${formData.qft === res ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'bg-white border-slate-100 text-slate-400'}`}>{res}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                    <AlertTriangle size={14} /> 痰涂片抗酸染色
                  </label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {Object.keys(config.smear).map(res => (
                      <button key={res} type="button" onClick={() => setFormData({...formData, smear: res})} className={`px-4 py-2.5 rounded-xl border transition-all text-[11px] font-black ${formData.smear === res ? 'bg-rose-50 border-rose-600 text-rose-700 shadow-sm' : 'bg-white border-slate-100 text-slate-400'}`}>{res}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                    <AlertTriangle size={14} /> 分枝杆菌培养
                  </label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {Object.keys(config.culture).map(res => (
                      <button key={res} type="button" onClick={() => setFormData({...formData, culture: res})} className={`px-4 py-2.5 rounded-xl border transition-all text-[11px] font-black ${formData.culture === res ? 'bg-rose-50 border-rose-600 text-rose-700 shadow-sm' : 'bg-white border-slate-100 text-slate-400'}`}>{res}</button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <button type="submit" disabled={submitted} className={`w-full py-5 rounded-2xl font-black text-lg text-white transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] ${submitted ? 'bg-emerald-600' : 'bg-slate-950 dark:bg-emerald-600 hover:scale-[1.01]'}`}>
              {submitted ? ( <><CheckCircle2 /> 数据原子同步成功</> ) : editId ? ( <><Edit3 size={18}/> 更新档案记录</> ) : ( <><ChevronRight /> 提交评估报告</> )}
            </button>
          </form>
        </div>

        {/* 侧边实时评分 */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-2xl sticky top-28 flex flex-col items-center">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-10 flex items-center gap-2">
              <Calculator size={16} className="text-emerald-600" /> 实时诊断评分引擎
            </h3>
            
            <div className="mb-10 text-center">
              <div className="text-8xl font-black text-slate-950 dark:text-emerald-500 tracking-tighter">{totalScore}</div>
              <div className="text-slate-400 text-[10px] font-black uppercase mt-2 tracking-widest">Clinical Matrix Score</div>
            </div>

            <div className="w-full space-y-8">
              <div>
                <div className="flex justify-between items-end mb-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">预测风险分层</span>
                  <span className={`font-black px-4 py-1.5 rounded-full text-[10px] uppercase border-2 ${risk.level === '确诊结核病' ? 'bg-rose-600 border-rose-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-100'}`}>
                    {risk.level}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full transition-all duration-700 ease-out" style={{ width: `${Math.min((totalScore / 100) * 100, 100)}%`, backgroundColor: totalScore > 60 ? '#e11d48' : totalScore > 30 ? '#f59e0b' : '#10b981' }}></div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
                <div className="flex gap-4">
                  <Activity className="shrink-0 w-6 h-6 text-emerald-600" />
                  <div>
                    <p className="text-[9px] font-black mb-2 text-slate-400 uppercase tracking-widest">临床处置建议</p>
                    <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 font-bold italic">“{risk.suggestion}”</p>
                  </div>
                </div>
              </div>

              {(formData.smear === '阴性' && formData.culture === '阴性' && totalScore >= 100) && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3 items-center text-amber-700">
                   <AlertTriangle size={20} className="shrink-0" />
                   <p className="text-[10px] font-bold leading-snug">注意：临床总分已达确诊阈值，但病原学检测结果不支持确诊，系统已自动限制风险级别。请务必完善相关检查。</p>
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
  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">{label}</label>
);

export default CaseInputPage;
