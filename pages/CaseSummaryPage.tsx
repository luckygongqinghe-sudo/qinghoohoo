
import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { UserRole } from '../types';
import { 
  Download, 
  Search, 
  Trash2, 
  Edit3, 
  CheckSquare, 
  Square, 
  Loader2, 
  User as UserIcon,
  PieChart,
  Users,
  AlertTriangle,
  Microscope,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  Activity,
  UploadCloud,
  Share2
} from 'lucide-react';

const CaseSummaryPage: React.FC = () => {
  const { cases, currentUser, deleteCases, siteConfig, addCase } = useStore();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  // 关键数据过滤逻辑：管理员看全部，用户看自己
  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      const isOwner = c.creatorId === currentUser?.id;
      const canSee = isAdmin || isOwner;
      if (!canSee) return false;
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.id.includes(searchTerm);
      const matchesRisk = filterRisk === 'all' || c.riskLevel === filterRisk;
      return matchesSearch && matchesRisk;
    });
  }, [cases, currentUser, isAdmin, searchTerm, filterRisk]);

  // 统计指标
  const stats = useMemo(() => {
    const total = filteredCases.length;
    const highRisk = filteredCases.filter(c => c.riskLevel.includes('高') || c.riskLevel.includes('确诊')).length;
    const labPositive = filteredCases.filter(c => c.smearResult === '阳性' || c.cultureResult === '阳性').length;
    const averageScore = total > 0 ? (filteredCases.reduce((acc, c) => acc + c.totalScore, 0) / total).toFixed(1) : 0;
    return { total, highRisk, labPositive, averageScore };
  }, [filteredCases]);

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id] );
  };

  const formatList = (list: string[]) => (list && list.length > 0 ? list.join('、') : <span className="text-rose-400 italic">未录入</span>);
  const formatVal = (val: string | number | undefined) => (val === undefined || val === '' || val === null ? <span className="text-rose-400 italic">未录入</span> : val);

  // CSV 导出：全字段详细导出
  const exportCSV = () => {
    if (filteredCases.length === 0) return alert('没有可导出的数据');
    const headers = [
      '系统流水号', '评估日期', '姓名', '年龄', '性别', '身高(cm)', '体重(kg)', 'BMI',
      '既往史', '临床症状', '流行病接触史', '影像特征', '影像评分', 'QFT实验', '痰涂片', '培养结果',
      '总分', '风险等级', '临床建议', '录入医生'
    ];
    const rows = filteredCases.map(c => [
      c.id, new Date(c.timestamp).toLocaleString(), c.name, c.age, c.gender, c.height, c.weight, c.bmi,
      c.history.join(';'), c.symptoms.join(';'), c.exposure || '未填', c.ctFeature || '未填', c.ctScore,
      c.qftResult || '未填', c.smearResult || '未填', c.cultureResult || '未填',
      c.totalScore, c.riskLevel, c.suggestion, c.creatorName
    ].map(v => `"${String(v).replace(/"/g, '""')}"`));

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `TB_Export_${new Date().getTime()}.csv`;
    link.click();
  };

  // 数据同步：导出 JSON (用于在不同电脑间转移数据)
  const exportJSON = () => {
    const dataStr = JSON.stringify(filteredCases, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `TB_Sync_Data_${new Date().getTime()}.json`;
    link.click();
  };

  // 数据同步：导入 JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedCases = JSON.parse(event.target?.result as string) as any[];
        let count = 0;
        importedCases.forEach(c => {
          // 避免重复导入相同的 ID
          if (!cases.find(existing => existing.id === c.id)) {
            addCase(c);
            count++;
          }
        });
        alert(`成功导入 ${count} 条新记录！`);
        window.location.reload();
      } catch (err) {
        alert('导入失败：文件格式不正确');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 dark:text-white">
      {/* 顶部标题栏 */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-950 dark:text-white tracking-tighter">{siteConfig.summaryPageTitle}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold mt-1">{siteConfig.summaryPageDesc}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input type="file" ref={fileInputRef} onChange={handleImportJSON} className="hidden" accept=".json" />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-black hover:bg-slate-50 apple-transition shadow-sm">
            <UploadCloud size={18} /> 导入同步数据
          </button>
          <button onClick={exportJSON} className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-black hover:bg-slate-50 apple-transition shadow-sm">
            <Share2 size={18} /> 导出同步包
          </button>
          <button onClick={exportCSV} className="flex items-center gap-2 px-8 py-3 bg-slate-950 dark:bg-emerald-600 text-white rounded-2xl font-black hover:bg-black apple-transition shadow-xl">
            <FileSpreadsheet size={18} /> 导出全量 CSV
          </button>
        </div>
      </div>

      {/* 统计看板 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: '筛选病例总数', val: stats.total, icon: Users, color: 'blue' },
          { label: '风险预警占比', val: `${stats.total > 0 ? ((stats.highRisk/stats.total)*100).toFixed(0) : 0}%`, icon: AlertTriangle, color: 'rose' },
          { label: '病原学阳性率', val: stats.labPositive, icon: Microscope, color: 'emerald' },
          { label: '平均评估得分', val: stats.averageScore, icon: PieChart, color: 'amber' }
        ].map((s, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border-2 border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-${s.color}-50 dark:bg-${s.color}-900/20 text-${s.color}-600 dark:text-${s.color}-400`}>
              <s.icon size={26} />
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
              <p className="text-3xl font-black text-slate-950 dark:text-white leading-none mt-1">{s.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 列表中心 */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border-2 border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden apple-transition">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex flex-col md:flex-row gap-6 bg-slate-50/30 dark:bg-transparent">
          <div className="flex-1 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input 
              type="text" 
              placeholder="搜索患者姓名、流水号..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-950 dark:text-white transition-all shadow-sm" 
            />
          </div>
          <select 
            value={filterRisk} 
            onChange={e => setFilterRisk(e.target.value)}
            className="px-6 py-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-black text-slate-950 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
          >
            <option value="all">风险等级筛选</option>
            <option value="确诊结核病">确诊病例</option>
            <option value="极高危风险">极高危</option>
            <option value="高风险">高风险</option>
            <option value="中风险">中风险</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                <th className="py-6 px-8 w-12 text-center">
                   <div className="cursor-pointer text-slate-300 hover:text-slate-400" onClick={() => setSelectedIds(selectedIds.length === filteredCases.length ? [] : filteredCases.map(c => c.id))}>
                     {selectedIds.length === filteredCases.length && filteredCases.length > 0 ? <CheckSquare size={20} /> : <Square size={20} />}
                   </div>
                </th>
                <th className="py-6 font-black text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-[0.2em] px-4">患者核心档案</th>
                <th className="py-6 font-black text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-[0.2em] px-4">辅助检查指标</th>
                <th className="py-6 font-black text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-[0.2em] px-4">评分与等级</th>
                <th className="py-6 font-black text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-[0.2em] px-8 text-right">管理操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredCases.map((c) => (
                <React.Fragment key={c.id}>
                  <tr 
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all cursor-pointer group ${expandedId === c.id ? 'bg-slate-50 dark:bg-slate-800/60' : ''}`} 
                    onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                  >
                    <td className="py-7 px-8 text-center" onClick={(e) => e.stopPropagation()}>
                      <button onClick={(e) => handleToggleSelect(c.id, e)} className={selectedIds.includes(c.id) ? 'text-emerald-500' : 'text-slate-300'}>
                        {selectedIds.includes(c.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                      </button>
                    </td>
                    <td className="py-7 px-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg border-2 ${c.gender === '男' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/30' : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:border-rose-900/30'}`}>{c.name.charAt(0)}</div>
                        <div>
                          <div className="font-black text-slate-950 dark:text-white text-base leading-none mb-1">{c.name}</div>
                          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{c.age}岁 · {c.gender} · ID: {c.id.slice(-6)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-7 px-4">
                      <div className="flex items-center gap-2">
                         <div className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-[10px] font-black text-slate-600 dark:text-slate-300">BMI: {c.bmi}</div>
                         <div className={`px-3 py-1 rounded-lg text-[10px] font-black ${c.smearResult === '阳性' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'}`}>涂片: {formatVal(c.smearResult)}</div>
                         <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-[10px] font-black text-indigo-600">QFT: {formatVal(c.qftResult)}</div>
                      </div>
                    </td>
                    <td className="py-7 px-4">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-black text-slate-950 dark:text-white">{c.totalScore}</div>
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black border-2 ${c.riskLevel === '确诊结核病' ? 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-200' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'}`}>
                          {c.riskLevel}
                        </span>
                      </div>
                    </td>
                    <td className="py-7 px-8 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <span className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full text-[10px] font-bold text-slate-400">
                          <UserIcon size={10} /> {c.creatorName}
                        </span>
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/cases?edit=${c.id}`); }} className="p-2 text-slate-300 hover:text-emerald-500 transition-all"><Edit3 size={20} /></button>
                        <button onClick={(e) => { e.stopPropagation(); if(window.confirm('确认删除？')) deleteCases([c.id]); }} className="p-2 text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={20} /></button>
                        {expandedId === c.id ? <ChevronUp size={22} className="text-slate-300" /> : <ChevronDown size={22} className="text-slate-300" />}
                      </div>
                    </td>
                  </tr>
                  {expandedId === c.id && (
                    <tr className="bg-slate-50/50 dark:bg-slate-800/40 animate-in slide-in-from-top-2">
                      <td colSpan={5} className="p-10 border-l-8 border-emerald-500">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                          <div className="space-y-6">
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">既往史与主诉症状</p>
                              <div className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                  <span className="text-xs text-slate-400 font-bold w-full">既往史:</span>
                                  {c.history.map(h => <span key={h} className="px-3 py-1 bg-white dark:bg-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white shadow-sm">{h}</span>)}
                                  {c.history.length === 0 && <span className="text-xs text-rose-400 italic">未录入</span>}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <span className="text-xs text-slate-400 font-bold w-full">主诉症状:</span>
                                  {c.symptoms.map(s => <span key={s} className="px-3 py-1 bg-rose-50 dark:bg-rose-900/20 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 shadow-sm">{s}</span>)}
                                  {c.symptoms.length === 0 && <span className="text-xs text-rose-400 italic">未录入</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-6">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">流行病与影像学细节</p>
                            <div className="space-y-3 bg-white/50 dark:bg-slate-800/50 p-5 rounded-3xl border border-slate-100 dark:border-slate-700">
                              <div className="flex justify-between text-xs font-bold">
                                <span className="text-slate-400">接触史详情:</span>
                                <span className="text-slate-900 dark:text-white">{formatVal(c.exposure)}</span>
                              </div>
                              <div className="flex justify-between text-xs font-bold">
                                <span className="text-slate-400">影像学核心特征:</span>
                                <span className="text-slate-900 dark:text-white">{formatVal(c.ctFeature)}</span>
                              </div>
                              <div className="flex justify-between text-xs font-bold">
                                <span className="text-slate-400">细菌培养结果:</span>
                                <span className="text-slate-900 dark:text-white">{formatVal(c.cultureResult)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="p-8 bg-white dark:bg-slate-800 rounded-[32px] border-2 border-slate-100 dark:border-slate-700 shadow-xl relative overflow-hidden">
                            <Activity className="absolute -right-4 -bottom-4 text-emerald-500 opacity-10 w-32 h-32" />
                            <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-4">临床分诊决策建议 (Expert Advice)</p>
                            <p className="text-sm font-bold leading-relaxed text-slate-950 dark:text-slate-200 italic">“{c.suggestion}”</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filteredCases.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center opacity-30">
                      <Search size={64} className="text-slate-300 mb-6" />
                      <p className="text-slate-400 font-black text-xl">暂无符合条件的病例档案</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CaseSummaryPage;
