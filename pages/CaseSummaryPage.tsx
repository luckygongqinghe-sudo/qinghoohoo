
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { 
  Search, 
  Trash2, 
  Edit3, 
  CheckSquare, 
  Square, 
  PieChart as PieChartIcon,
  FileSpreadsheet,
  Filter,
  BarChart3,
  Download
} from 'lucide-react';

// 动态导入 recharts 组件
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';

const CaseSummaryPage: React.FC = () => {
  const { cases, currentUser, deleteCases, siteConfig } = useStore();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const isAdmin = currentUser?.username === 'qinghoohoo';

  const filteredCases = useMemo(() => {
    const list = cases || [];
    return list.filter(c => {
      if (!c) return false;
      const searchLower = searchTerm.toLowerCase();
      const name = c.name || '';
      const creator = c.creatorName || '';
      const cid = c.id || '';
      
      const matchesSearch = name.toLowerCase().includes(searchLower) || 
                           cid.includes(searchTerm) || 
                           creator.toLowerCase().includes(searchLower);
      const matchesRisk = filterRisk === 'all' || c.riskLevel === filterRisk;
      return matchesSearch && matchesRisk;
    });
  }, [cases, searchTerm, filterRisk]);

  const chartData = useMemo(() => {
    const riskCounts: Record<string, number> = {};
    const symMap: Record<string, number> = {};
    
    filteredCases.forEach(c => {
      if (c.riskLevel) {
        riskCounts[c.riskLevel] = (riskCounts[c.riskLevel] || 0) + 1;
      }
      if (c.symptoms && Array.isArray(c.symptoms)) {
        c.symptoms.forEach(s => symMap[s] = (symMap[s] || 0) + 1);
      }
    });

    const pieData = Object.entries(riskCounts).map(([name, value]) => ({ name, value }));
    const barData = Object.entries(symMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));

    return { pieData, barData };
  }, [filteredCases]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#9f1239', '#4c0519'];

  // 增强版：全维度详细导出
  const exportDetailedCSV = () => {
    const targetCases = selectedIds.length > 0 
      ? filteredCases.filter(c => selectedIds.includes(c.id))
      : filteredCases;

    if (targetCases.length === 0) return alert('当前视图无数据可导出');

    const headers = [
      '档案编号(ID)', 
      '评估日期', 
      '录入员', 
      '姓名', 
      '性别', 
      '年龄', 
      '身高(cm)', 
      '体重(kg)', 
      'BMI', 
      '既往史(History)', 
      '临床症状(Symptoms)', 
      '暴露史(Exposure)', 
      '影像学特征(CT_Feature)', 
      '影像学评分', 
      'QFT结果', 
      '痰涂片', 
      '痰培养', 
      '评估总分', 
      '风险等级', 
      '临床建议'
    ];

    const rows = targetCases.map(c => [
      c.id,
      new Date(c.timestamp).toLocaleString(),
      c.creatorName,
      c.name,
      c.gender,
      c.age,
      c.height,
      c.weight,
      c.bmi,
      (c.history || []).join('; '),
      (c.symptoms || []).join('; '),
      c.exposure,
      c.ctFeature,
      c.ctScore,
      c.qftResult,
      c.smearResult,
      c.cultureResult,
      c.totalScore,
      c.riskLevel,
      c.suggestion
    ].map(v => `"${String(v || '').replace(/"/g, '""')}"`));

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    
    // 添加 BOM (\uFEFF) 解决 Excel 打开中文乱码
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TB_Scan_Export_${new Date().toISOString().split('T')[0]}_${targetCases.length}cases.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-32 relative">
      
      {/* 头部展示 */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-950 dark:text-white tracking-tighter mb-1">{siteConfig.summaryPageTitle || '数据透视中心'}</h1>
          <p className="text-slate-950 dark:text-slate-400 font-black text-lg opacity-60">{siteConfig.summaryPageDesc || '跨维度病例分析与结构化数据导出'}</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={exportDetailedCSV} 
            className="flex items-center gap-3 px-10 py-4 bg-slate-950 dark:bg-emerald-600 text-white rounded-2xl font-black shadow-xl hover:bg-black hover:scale-[1.02] transition-all group"
          >
            <FileSpreadsheet size={20} className="group-hover:rotate-12 transition-transform" /> 
            {selectedIds.length > 0 ? `导出已选 (${selectedIds.length})` : '导出当前视图 (CSV)'}
          </button>
        </div>
      </div>

      {/* 可视化图表区 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border-2 border-slate-100 dark:border-slate-800 shadow-sm h-[380px] flex flex-col">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <PieChartIcon size={16} className="text-emerald-500" /> 风险程度分布
          </h3>
          <div className="flex-1">
            {chartData.pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={chartData.pieData} 
                    cx="50%" cy="50%" 
                    innerRadius={60} outerRadius={90} 
                    paddingAngle={5} dataKey="value"
                  >
                    {chartData.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-300 font-bold">暂无评估数据</div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border-2 border-slate-100 dark:border-slate-800 shadow-sm h-[380px] flex flex-col">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <BarChart3 size={16} className="text-blue-500" /> 临床症状检出 Top 6
          </h3>
          <div className="flex-1">
            {chartData.barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.barData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-300 font-bold">暂无症状统计</div>
            )}
          </div>
        </div>
      </div>

      {/* 列表显示区 */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border-2 border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden mt-8">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex flex-col md:flex-row gap-6">
          <div className="flex-1 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input 
              type="text" 
              placeholder="搜索患者姓名、ID..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-950 dark:text-white transition-all" 
            />
          </div>
          <div className="flex items-center gap-4">
             <Filter size={18} className="text-slate-300" />
             <select 
               value={filterRisk} 
               onChange={e => setFilterRisk(e.target.value)}
               className="px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-slate-900 dark:text-white outline-none border-2 border-transparent focus:border-emerald-500 transition-all cursor-pointer"
             >
               <option value="all">所有风险分层</option>
               <option value="确诊结核病">确诊病例</option>
               <option value="极高危风险">极高危风险</option>
               <option value="高风险">高风险</option>
               <option value="中风险">中风险</option>
               <option value="低风险">低风险</option>
               <option value="无风险">无风险</option>
             </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="py-6 px-8 w-16 text-center">
                   <button onClick={() => setSelectedIds(selectedIds.length === filteredCases.length ? [] : filteredCases.map(c => c.id))} className="text-slate-300 hover:text-emerald-500 transition-colors">
                     {selectedIds.length === filteredCases.length && filteredCases.length > 0 ? <CheckSquare className="text-emerald-500" /> : <Square />}
                   </button>
                </th>
                <th className="py-6 font-black text-slate-400 text-[10px] uppercase tracking-widest px-6">受检者档案</th>
                <th className="py-6 font-black text-slate-400 text-[10px] uppercase tracking-widest px-6">检测结果</th>
                <th className="py-6 font-black text-slate-400 text-[10px] uppercase tracking-widest px-6 text-center">风险评估</th>
                <th className="py-6 font-black text-slate-400 text-[10px] uppercase tracking-widest px-8 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredCases.map((c) => (
                <React.Fragment key={c.id}>
                  <tr 
                    className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all cursor-pointer ${expandedId === c.id ? 'bg-slate-50 dark:bg-slate-800/40' : ''}`} 
                    onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                  >
                    <td className="py-6 px-8 text-center" onClick={(e) => e.stopPropagation()}>
                      <button onClick={(e) => handleToggleSelect(c.id, e)} className={selectedIds.includes(c.id) ? 'text-emerald-500' : 'text-slate-200 hover:text-slate-300'}>
                        {selectedIds.includes(c.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                      </button>
                    </td>
                    <td className="py-6 px-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${c.gender === '男' ? 'bg-blue-50 text-blue-500' : 'bg-rose-50 text-rose-500'}`}>{c.name ? c.name.charAt(0) : '?'}</div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{c.name} ({c.age}岁)</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: {c.id.slice(-6)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-6">
                      <div className="flex gap-2">
                         <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-bold text-slate-500">QFT: {c.qftResult}</span>
                         <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${c.smearResult === '阳性' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>涂片: {c.smearResult}</span>
                      </div>
                    </td>
                    <td className="py-6 px-6 text-center">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black border-2 transition-all ${c.riskLevel === '确诊结核病' ? 'bg-rose-600 border-rose-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}>
                        {c.riskLevel} ({c.totalScore})
                      </span>
                    </td>
                    <td className="py-6 px-8 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {(isAdmin || currentUser?.id === c.creatorId) && (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/cases?edit=${c.id}`); }} className="p-2 text-slate-300 hover:text-emerald-500 transition-all"><Edit3 size={18} /></button>
                            <button onClick={(e) => { e.stopPropagation(); if(window.confirm('确认删除？')) deleteCases([c.id]); }} className="p-2 text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={18} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedId === c.id && (
                    <tr className="bg-slate-50/30 dark:bg-slate-800/20">
                      <td colSpan={5} className="p-8 border-l-4 border-emerald-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">临床特征细节</h4>
                            <div className="flex flex-wrap gap-2">
                              {c.symptoms.map(s => <span key={s} className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg text-xs font-bold">{s}</span>)}
                            </div>
                            <div className="text-xs font-bold text-slate-500 mt-2">影像特征: {c.ctFeature} (+{c.ctScore})</div>
                          </div>
                          <div className="p-6 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
                             <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">系统处置建议</h4>
                             <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed italic">“{c.suggestion}”</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CaseSummaryPage;
