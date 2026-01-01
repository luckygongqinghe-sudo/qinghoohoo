
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store';
import { UserRole } from '../types';
import { Activity, ShieldCheck, ArrowLeft, ChevronRight, AlertCircle, Clock } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [status, setStatus] = useState<{ type: 'error' | 'info'; msg: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { users, currentUser, setCurrentUser, addUser, siteConfig, isLoading } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard/cases');
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setIsProcessing(true);

    try {
      if (isLogin) {
        const user = users.find(u => u.username === username);
        
        if (user) {
          if (user.password !== password) {
            setStatus({ type: 'error', msg: '密码不正确，请重新输入。' });
          } else if (user.username !== 'qinghoohoo' && !user.approved) {
            // qinghoohoo 免审，其他用户检查 approved
            setStatus({ type: 'info', msg: '您的账户正在等待超级管理员 (qinghoohoo) 审批，通过后方可登录。' });
          } else if (!user.active) {
            setStatus({ type: 'error', msg: '该账户已被禁用。' });
          } else {
            setCurrentUser(user);
            navigate('/dashboard/cases');
          }
        } else {
          setStatus({ type: 'error', msg: '未找到该账户，请核对用户名。' });
        }
      } else {
        const exists = users.find(u => u.username === username);
        if (exists) {
          setStatus({ type: 'error', msg: '该用户名已被占用。' });
        } else {
          // 注册用户时 approved 默认为 false
          await addUser(username, UserRole.USER, password, false);
          setStatus({ type: 'info', msg: '注册申请已提交！请联系 qinghoohoo 审批。' });
          setIsLogin(true); 
        }
      }
    } catch (err) {
      setStatus({ type: 'error', msg: '网络异常，请重试。' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-6 selection:bg-emerald-100 dark:bg-slate-950">
      <div className="fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-100/40 dark:bg-emerald-900/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/30 dark:bg-blue-900/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-[1000px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-white dark:border-slate-800 flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-1000">
        <div className="hidden md:flex md:w-[45%] bg-slate-900 p-12 flex-col justify-between text-white relative">
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2.5 group mb-16">
               <div className="bg-emerald-600 p-2 rounded-xl group-hover:scale-110 apple-transition shadow-lg shadow-emerald-500/20">
                 <Activity size={24} />
               </div>
               <span className="text-xl font-bold tracking-tight">TB-Scan</span>
            </Link>
            <div className="space-y-6">
              <h2 className="text-4xl font-extrabold leading-[1.1] tracking-tight">临床协作，<br />受控准入。</h2>
              <p className="text-slate-400 font-medium leading-relaxed max-w-[240px]">
                集成云端审批流，确保每一位医疗协作人员均经过身份核验。
              </p>
            </div>
          </div>
          <div className="relative z-10">
            <div className="p-6 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400">
                   <ShieldCheck size={18} />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">安全合规审计</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-bold">
                只有经由 qinghoohoo 授权的账户才能访问敏感临床数据中心。
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-10 lg:p-16 flex flex-col justify-center">
          <div className="mb-10">
             <Link to="/" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-400 hover:text-emerald-600 apple-transition mb-8">
               <ArrowLeft size={14} /> 返回首页
             </Link>
             <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
               {isLogin ? '欢迎登录' : '提交准入申请'}
             </h1>
             <p className="text-slate-500 dark:text-slate-400 font-bold">数字化结核病精准筛查平台。</p>
          </div>

          <div className="bg-slate-100/80 dark:bg-slate-800/50 p-1 rounded-[20px] flex mb-8">
            <button onClick={() => { setIsLogin(true); setStatus(null); }} className={`flex-1 py-2.5 text-[13px] font-bold rounded-[16px] apple-transition ${isLogin ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>登录</button>
            <button onClick={() => { setIsLogin(false); setStatus(null); }} className={`flex-1 py-2.5 text-[13px] font-bold rounded-[16px] apple-transition ${!isLogin ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>申请注册</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">用户名</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full px-5 py-4 rounded-2xl bg-[#F5F5F7] dark:bg-slate-800 border border-transparent focus:bg-white dark:focus:bg-slate-700 focus:border-emerald-500 focus:ring-[4px] focus:ring-emerald-500/10 outline-none apple-transition font-bold text-slate-900 dark:text-white" placeholder="Username"/>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">密码</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-5 py-4 rounded-2xl bg-[#F5F5F7] dark:bg-slate-800 border border-transparent focus:bg-white dark:focus:bg-slate-700 focus:border-emerald-500 focus:ring-[4px] focus:ring-emerald-500/10 outline-none apple-transition text-slate-900 dark:text-white font-bold" placeholder="••••••••"/>
            </div>

            {status && (
              <div className={`p-4 rounded-2xl border flex items-start gap-3 animate-in slide-in-from-top-2 ${status.type === 'error' ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/50 text-amber-600 dark:text-amber-400'}`}>
                {status.type === 'error' ? <AlertCircle className="shrink-0" size={18} /> : <Clock className="shrink-0" size={18} />}
                <p className="text-[12px] font-bold leading-relaxed">{status.msg}</p>
              </div>
            )}

            <button type="submit" disabled={isProcessing || isLoading} className={`w-full py-4 rounded-2xl font-black apple-transition active:scale-[0.97] flex items-center justify-center gap-2 shadow-xl ${isProcessing || isLoading ? 'bg-slate-200 dark:bg-slate-800 text-slate-400' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'}`}>
              {(isProcessing || isLoading) ? (
                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>{isLogin ? '登录工作台' : '提交注册申请'} <ChevronRight size={18} /></>
              )}
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-[11px] text-slate-400 font-bold">
              {siteConfig.footerCopyright}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
