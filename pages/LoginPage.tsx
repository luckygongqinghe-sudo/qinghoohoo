
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { UserRole } from '../types';
import { Activity, ShieldCheck, ChevronRight, AlertCircle, Clock, Key } from 'lucide-react';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

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
    
    const checkKeyStatus = async () => {
      // 核心修正：使用正确的环境变量名 API_KEY，这是由系统自动注入的
      const envKeyExists = !!process.env.API_KEY && process.env.API_KEY !== "";
      if (envKeyExists) {
        setHasKey(true);
      } else if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }
    };
    checkKeyStatus();
  }, [currentUser, navigate]);

  const handleLinkKey = async () => {
    if (window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
        // 标记为已激活，后续调用 GoogleGenAI 时将自动读取 process.env.API_KEY
        setHasKey(true);
        setStatus({ type: 'info', msg: 'AI 密钥已激活，系统功能已完整解锁。' });
      } catch (err) {
        setStatus({ type: 'error', msg: '密钥激活失败。' });
      }
    } else {
      window.open('https://ai.google.dev/gemini-api/docs/billing', '_blank');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setIsProcessing(true);

    try {
      if (isLogin) {
        const user = users.find(u => u.username === username);
        if (user) {
          if (user.password !== password) {
            setStatus({ type: 'error', msg: '密码错误。' });
          } else if (user.username !== 'qinghoohoo' && !user.approved) {
            setStatus({ type: 'info', msg: '账户审核中，请联系管理员。' });
          } else {
            setCurrentUser(user);
            navigate('/dashboard/cases');
          }
        } else {
          setStatus({ type: 'error', msg: '用户不存在，请先注册。' });
        }
      } else {
        const exists = users.find(u => u.username === username);
        if (exists) {
          setStatus({ type: 'error', msg: '用户名已占用。' });
        } else {
          await addUser(username, UserRole.USER, password, false);
          setStatus({ type: 'info', msg: '注册成功，请等待审核通过。' });
          setIsLogin(true);
        }
      }
    } catch (err) {
      setStatus({ type: 'error', msg: '网络连接异常。' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbfd] dark:bg-slate-950 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-[1000px] bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row overflow-hidden">
        {/* 左侧：品牌信息 */}
        <div className="md:w-2/5 bg-slate-950 p-12 flex flex-col justify-between text-white relative">
          <div className="z-10">
            <div className="bg-emerald-600 w-12 h-12 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-emerald-500/20">
              <Activity size={24}/>
            </div>
            <h2 className="text-4xl font-black leading-tight tracking-tighter text-white">TB-Scan<br/>数字化筛查</h2>
            <p className="text-slate-400 text-sm mt-6 font-medium">临床决策辅助与病例追踪平台</p>
          </div>

          <div className="z-10 p-6 bg-white/5 rounded-3xl border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-2 h-2 rounded-full ${hasKey ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">AI 服务状态</span>
            </div>
            <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
              {hasKey ? '全维度模型已对齐。系统将使用自动注入的 API Key。' : '密钥未配置。请点击右侧“激活 AI 服务”进行配置。'}
            </p>
          </div>
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
        </div>

        {/* 右侧：操作区 */}
        <div className="flex-1 p-12 lg:p-16 flex flex-col justify-center">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">{isLogin ? '欢迎登录' : '医师注册'}</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Authorized Access Only</p>
            </div>
            {!hasKey && (
              <button onClick={handleLinkKey} className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-[10px] font-black shadow-sm hover:bg-amber-100 transition-colors">
                <Key size={14}/> 激活 AI 服务
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">用户名</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-inner" />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">密码</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-inner" />
            </div>

            {status && (
              <div className={`p-4 rounded-2xl text-[11px] font-bold flex gap-3 ${status.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-700'}`}>
                {status.type === 'error' ? <AlertCircle size={14}/> : <Clock size={14}/>}
                {status.msg}
              </div>
            )}

            <div className="pt-4 space-y-4">
              <button type="submit" disabled={isProcessing} className="w-full py-5 rounded-2xl bg-slate-950 dark:bg-emerald-600 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all">
                {isProcessing ? '处理中...' : <>{isLogin ? '登录工作台' : '提交注册申请'} <ChevronRight size={16}/></>}
              </button>
              <button type="button" onClick={() => { setIsLogin(!isLogin); setStatus(null); }} className="w-full py-2 text-[12px] font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors uppercase tracking-widest">
                {isLogin ? '没有账号？申请加入' : '已有账号？立即登录'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
