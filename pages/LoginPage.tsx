
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { UserRole } from '../types';
import { Activity, ChevronRight, AlertCircle, Key, ExternalLink } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [status, setStatus] = useState<{ type: 'error' | 'info'; msg: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasKey, setHasKey] = useState<boolean>(false);

  const { users, currentUser, setCurrentUser, addUser } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) navigate('/dashboard/cases');
    
    const checkKey = async () => {
      if ((window as any).aistudio) {
        const selected = await (window as any).aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }
    };
    checkKey();
  }, [currentUser, navigate]);

  const handleOpenKeyDialog = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      setHasKey(true); // 假设选择成功并继续
      setStatus({ type: 'info', msg: 'API Key 已连接，系统功能已解锁。' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setIsProcessing(true);

    try {
      // 验证逻辑
      const user = users.find(u => u.username === username);
      if (isLogin) {
        if (user && user.password === password) {
          if (user.username !== 'qinghoohoo' && !user.approved) {
            setStatus({ type: 'info', msg: '账户审核中...' });
          } else {
            setCurrentUser(user);
            navigate('/dashboard/cases');
          }
        } else {
          setStatus({ type: 'error', msg: '用户名或密码错误' });
        }
      } else {
        if (user) {
          setStatus({ type: 'error', msg: '用户名已存在' });
        } else {
          await addUser(username, UserRole.USER, password, false);
          setStatus({ type: 'info', msg: '申请提交成功，请等待审核' });
          setIsLogin(true);
        }
      }
    } catch (err) {
      setStatus({ type: 'error', msg: '连接失败' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbfd] dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-[900px] bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row overflow-hidden">
        <div className="md:w-5/12 bg-slate-950 p-12 text-white flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-emerald-500/20">
              <Activity size={24}/>
            </div>
            <h2 className="text-3xl font-black leading-tight">TB-Scan<br/>精准医学门户</h2>
            <p className="text-slate-400 text-xs mt-4 font-bold uppercase tracking-widest">Medical Decision Support</p>
          </div>
          
          <div className="space-y-4">
            <div className={`p-5 rounded-2xl border ${hasKey ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
              <p className="text-[10px] font-black uppercase text-slate-400 mb-2">AI 引擎状态</p>
              <p className="text-[11px] font-bold text-slate-200">
                {hasKey ? '云端专家库已就绪 (免VPN模式)' : '需要选择有效的付费 API Key'}
              </p>
            </div>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-[10px] font-black text-slate-500 hover:text-emerald-500 flex items-center gap-1 transition-colors uppercase tracking-widest">
              查看计费说明 <ExternalLink size={10} />
            </a>
          </div>
        </div>

        <div className="flex-1 p-12 lg:p-16">
          <div className="flex justify-between items-center mb-10">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">{isLogin ? '工作台登录' : '医师入驻'}</h1>
            <button type="button" onClick={handleOpenKeyDialog} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all">
              <Key size={14}/> 激活 AI 服务
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">用户名</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold outline-none focus:ring-2 focus:ring-emerald-500/20" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">密码</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold outline-none focus:ring-2 focus:ring-emerald-500/20" />
            </div>

            {status && (
              <div className={`p-4 rounded-2xl text-[11px] font-bold flex gap-3 ${status.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-700'}`}>
                <AlertCircle size={14}/> {status.msg}
              </div>
            )}

            <button type="submit" disabled={isProcessing} className="w-full py-5 rounded-2xl bg-emerald-600 text-white font-black text-sm shadow-xl shadow-emerald-500/20 hover:scale-[1.02] transition-all">
              {isLogin ? '进入工作站' : '提交申请'}
            </button>
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
              {isLogin ? '没有账号？申请加入' : '已有账号？返回登录'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
