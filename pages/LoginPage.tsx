
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { UserRole } from '../types';
import { Activity, ShieldCheck, ChevronRight, AlertCircle, Clock, Key } from 'lucide-react';

/* 
 * Fix: Define the AIStudio interface in the global scope and update the Window interface 
 * property declaration to match the required type name 'AIStudio' and ensure identical modifiers.
 */
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio: AIStudio;
  }
}

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [status, setStatus] = useState<{ type: 'error' | 'info'; msg: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasKey, setHasKey] = useState<boolean>(!!process.env.API_KEY);

  const { users, currentUser, setCurrentUser, addUser } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) navigate('/dashboard/cases');
    
    // 检查 AI Studio 密钥状态
    const checkKey = async () => {
      if (!process.env.API_KEY && window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }
    };
    checkKey();
  }, [currentUser, navigate]);

  const handleLinkKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasKey(true);
      setStatus({ type: 'info', msg: 'AI 密钥已配置，服务连接中...' });
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
            setStatus({ type: 'error', msg: '密码不正确。' });
          } else if (user.username !== 'qinghoohoo' && !user.approved) {
            setStatus({ type: 'info', msg: '账户待审批。请联系超级管理员 qinghoohoo。' });
          } else {
            setCurrentUser(user);
            navigate('/dashboard/cases');
          }
        } else {
          setStatus({ type: 'error', msg: '未找到账户，请检查用户名。' });
        }
      } else {
        const exists = users.find(u => u.username === username);
        if (exists) {
          setStatus({ type: 'error', msg: '用户名已存在。' });
        } else {
          await addUser(username, UserRole.USER, password, false);
          setStatus({ type: 'info', msg: '注册申请已提交，请等待审批。' });
          setIsLogin(true); 
        }
      }
    } catch (err) {
      setStatus({ type: 'error', msg: '网络异常。' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-[900px] bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-800 flex overflow-hidden">
        {/* 左侧装饰栏 */}
        <div className="hidden md:flex w-1/3 bg-slate-950 p-10 flex-col justify-between text-white relative">
          <div className="z-10">
            <div className="bg-emerald-600 w-10 h-10 rounded-xl flex items-center justify-center mb-8"><Activity size={20}/></div>
            <h2 className="text-3xl font-black leading-tight">TB-Scan<br/>准入管理</h2>
            <p className="text-slate-500 text-xs mt-4 font-bold">受控临床数据环境</p>
          </div>
          <div className="z-10 p-4 bg-white/5 rounded-2xl border border-white/10 text-[10px] text-slate-400">
            <ShieldCheck className="text-emerald-500 mb-2" size={16}/>
            AI 协同筛查模式已就绪，所有诊断建议均需临床医师最终确认。
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
        </div>

        {/* 右侧登录表单 */}
        <div className="flex-1 p-10 lg:p-16">
          <div className="mb-10 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{isLogin ? '欢迎登录' : '申请注册'}</h1>
              <p className="text-slate-500 text-sm font-bold">数字化结核病精准筛查平台</p>
            </div>
            {!hasKey && (
              <button onClick={handleLinkKey} className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-400 text-[10px] font-black animate-pulse">
                <Key size={12}/> 配置 AI 密钥
              </button>
            )}
          </div>

          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex mb-8">
            <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${isLogin ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-400'}`}>登录</button>
            <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${!isLogin ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-400'}`}>注册</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">用户名</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="w-full px-5 py-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">密码</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-5 py-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20" />
            </div>

            {status && (
              <div className={`p-4 rounded-xl text-xs font-bold flex gap-2 ${status.type === 'error' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600'}`}>
                {status.type === 'error' ? <AlertCircle size={14}/> : <Clock size={14}/>}
                {status.msg}
              </div>
            )}

            <button type="submit" disabled={isProcessing} className="w-full py-5 rounded-2xl bg-slate-950 dark:bg-emerald-600 text-white font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2 hover:opacity-90 active:scale-95">
              {isProcessing ? '处理中...' : <>{isLogin ? '进入系统' : '提交申请'} <ChevronRight size={16}/></>}
            </button>
          </form>
        </div>
      </div>
      <div className="fixed bottom-6 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
        系统状态: 
        {hasKey ? (
          <span className="text-emerald-500 flex items-center gap-1">● AI 云端对齐</span>
        ) : (
          <span className="text-rose-500 flex items-center gap-1">○ AI 链路未激活 (环境变量无效)</span>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
