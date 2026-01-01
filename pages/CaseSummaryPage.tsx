
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { RiskLevel, UserRole } from '../types';
import { 
  Download, 
  Search, 
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit3,
  CheckSquare,
  Square,
  Loader2,
  AlertCircle
} from 'lucide-react';

const CaseSummaryPage: React.FC = () => {
  const { cases, currentUser, deleteCases, siteConfig } = useStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const filteredCases = cases.filter(c => {
    const isOwner = c.creatorId === currentUser?.id;
    const canSee = isAdmin || isOwner;
    if (!canSee) return false;
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = filterRisk === 'all' || c.riskLevel === filterRisk;
    return matchesSearch && matchesRisk;
  });

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id] );
  };

  const handleEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    navigate(`/dashboard/cases?edit=${id}`);
  };

  const handleDeleteSingle = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (window.confirm('警告：确定要永久删除该条病例记录吗？此操作无法撤销。')) {
      setIsDeleting(true);
      try {
        deleteCases([id]);
        setSelectedIds(prev => prev.filter(i => i !== id));
        if (expandedId === id) setExpandedId(null);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleDeleteSelected = async () => {
    if (window.confirm(`确定要批量删除选中的 ${selectedIds.length} 条病例记录吗？`)) {
      setIsDeleting(true);
      try {
        deleteCases(selectedIds);
        setSelectedIds([]);
        if (selectedIds.includes(expandedId || '')) setExpandedId(null);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const exportCSV = () => {
    if (filteredCases.length === 0) return alert('当前没有可导出的数据');
    const headers = [ 'ID', '录入日期', '姓名', '年龄', '性别', 'BMI', '核心特征', 'QFT结果', '总得分', '风险等级' ];
    const rows = filteredCases.map(c => [ c.id, new Date(c.timestamp).toLocaleString(), c.name, c.age, c.gender, c.bmi, c.ctFeature, c.qftResult, c.totalScore, c.riskLevel ]);
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `结核病汇总表_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{siteConfig.summaryPageTitle}</h1>
          <p className="text-slate-500 font-medium">{siteConfig.summaryPageDesc}</p>
        </div>
        <div className="flex gap-3">
          {selectedIds.length > 0 && ( 
            <button 
              onClick={handleDeleteSelected} 
              disabled={isDeleting}
              className="flex items-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-all shadow-lg active:scale-95 disabled:opacity-50"
            > 
              {isDeleting ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
              删除选中 ({selectedIds.length}) 
            </button> 
          )}
          <button onClick={exportCSV} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg active:scale-95"> 
            <Download size={18} /> 导出汇总 CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="通过患者姓名搜索..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-slate-900" 
            />
          </div>
          <div className="flex items-center gap-3">
            <Filter size={18} className="text-slate-400" />
            <select 
              value={filterRisk} 
              onChange={e => setFilterRisk(e.target.value)} 
              className="bg-slate-50 border-none rounded-2xl px-6 py-3 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-700 font-bold"
            >
              <option value="all">所有风险等级</option>
              {Object.values(RiskLevel).map(l => ( <option key={l} value={l}>{l}</option> ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="py-4 px-6 w-12 text-center">
                  <button onClick={() => setSelectedIds(selectedIds.length === filteredCases.length ? [] : filteredCases.map(c => c.id))} className="text-slate-400 hover:text-emerald-500">
                    {selectedIds.length === filteredCases.length && filteredCases.length > 0 ? <CheckSquare size={20} className="text-emerald-500" /> : <Square size={20} />}
                  </button>
                </th>
                <th className="py-4 font-black text-slate-400 text-[10px] uppercase tracking-widest px-4">患者基本信息</th>
                <th className="py-4 font-black text-slate-400 text-[10px] uppercase tracking-widest px-4">临床诊断项</th>
                <th className="py-4 font-black text-slate-400 text-[10px] uppercase tracking-widest px-4">综合评估</th>
                <th className="py-4 font-black text-slate-400 text-[10px] uppercase tracking-widest px-6 text-right">管理操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredCases.map((c) => {
                const isSelected = selectedIds.includes(c.id);
                const isOwner = c.creatorId === currentUser?.id;
                const canManage = isAdmin || isOwner;

                return (
                  <React.Fragment key={c.id}>
                    <tr 
                      className={`hover:bg-slate-50 transition-all cursor-pointer group ${expandedId === c.id ? 'bg-slate-50' : ''} ${isSelected ? 'bg-emerald-50/30' : ''}`} 
                      onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                    >
                      <td className="py-5 px-6 text-center">
                        <button onClick={(e) => handleToggleSelect(c.id, e)} className={isSelected ? 'text-emerald-500' : 'text-slate-300'}>
                          {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                        </button>
                      </td>
                      <td className="py-5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black border ${c.gender === '男' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{c.name.charAt(0)}</div>
                          <div>
                            <div className="font-black text-slate-900 text-sm">{c.name}</div>
                            <div className="text-[11px] text-slate-500 font-bold">{c.age}岁 · {c.gender} · BMI {c.bmi}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-4">
                        <div className="text-[11px] text-slate-700 font-bold max-w-[150px] truncate">{c.ctFeature}</div>
                        <div className="text-[10px] text-slate-400 font-medium">QFT: {c.qftResult} | 涂片: {c.smearResult}</div>
                      </td>
                      <td className="py-5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="text-lg font-black text-slate-900">{c.totalScore}</div>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black border ${
                            c.riskLevel === RiskLevel.NONE ? 'bg-slate-50 text-slate-600' : 
                            c.riskLevel === RiskLevel.CONFIRMED ? 'bg-rose-600 text-white' : 
                            'bg-rose-50 text-rose-700'
                          }`}>{c.riskLevel}</span>
                        </div>
                      </td>
                      <td className="py-5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canManage && (
                            <>
                              <button 
                                onClick={(e) => handleEdit(c.id, e)} 
                                className="p-2.5 text-slate-300 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all" 
                                title="修改数据"
                              >
                                <Edit3 size={18} />
                              </button>
                              <button 
                                onClick={(e) => handleDeleteSingle(c.id, e)} 
                                disabled={isDeleting}
                                className="p-2.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-30" 
                                title="删除记录"
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}
                          <div className="p-2.5 text-slate-300 group-hover:text-emerald-500 transition-all">
                            {expandedId === c.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </div>
                        </div>
                      </td>
                    </tr>
                    {expandedId === c.id && (
                      <tr className="bg-slate-50/50 animate-in slide-in-from-top-2 duration-300">
                        <td colSpan={5} className="p-8 border-l-4 border-emerald-500">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="text-xs space-y-3">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                  <Calendar size={12} /> 临床详情回顾
                                </h4>
                                <div className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-500">症状表现:</span> <span className="font-bold text-slate-900">{c.symptoms.join('、') || '无'}</span></div>
                                <div className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-500">既往背景:</span> <span className="font-bold text-slate-900">{c.history.join('、') || '无'}</span></div>
                                <div className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-500">痰培养结果:</span> <span className={`font-bold ${c.cultureResult === '阳性' ? 'text-rose-600' : 'text-slate-900'}`}>{c.cultureResult}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">最后更新日期:</span> <span className="font-bold text-slate-900">{new Date(c.timestamp).toLocaleString()}</span></div>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <AlertCircle size={12} /> 临床分诊建议
                                </h4>
                                <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm text-sm text-slate-700 leading-relaxed italic font-medium">
                                  "{c.suggestion}"
                                </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filteredCases.length === 0 && ( 
                <tr><td colSpan={5} className="py-32 text-center text-slate-400 font-black italic">未发现匹配的病例记录</td></tr> 
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CaseSummaryPage;
