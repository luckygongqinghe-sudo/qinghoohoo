
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store';
import { UserRole } from '../types';
import { Activity, ShieldCheck, ArrowLeft, Clock, Sparkles, ChevronRight } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { users, currentUser, setCurrentUser, addUser } = useStore();
  const navigate = useNavigate();

  // 如果已经登录，直接进入工作台
  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard/cases');
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    // 模拟苹果风格的微小加载延迟，增加仪式感
    setTimeout(() => {
      if (isLogin) {
        const user = users.find(u => u.username === username);
        if (user) {
          if (!user.approved) {
            setError('您的账号正在进行安全性审核，请联系管理员确认。');
            setIsLoading(false);
            return;
          }
          if (!user.active) {
            setError('该账户已被系统管理员锁定或停用。');
            setIsLoading(false);
            return;
          }
          if (user.password && user.password !== password) {
            setError('提供的用户名或密码不匹配。');
            setIsLoading(false);
            return;
          }
          setCurrentUser(user);
          navigate('/dashboard/cases');
        } else {
          setError('未找到匹配的账户凭据。');
        }
      } else {
        const exists = users.find(u => u.username === username);
        if (exists) {
          setError('该用户名已被注册。');
        } else {
          addUser(username, UserRole.USER, password, false);
          setIsLogin(true);
          setSuccess('注册成功。您的账号已提交审核，请在审核通过后登录。');
          setUsername('');
          setPassword('');
        }
      }
      setIsLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-6 selection:bg-emerald-100">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-100/40 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/30 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-[1000px] bg-white/80 backdrop-blur-3xl rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-white flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-1000">
        
        {/* Left Side: Branding/Mood */}
        <div className="hidden md:flex md:w-[45%] bg-slate-900 p-12 flex-col justify-between text-white relative">
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2.5 group mb-16">
               <div className="bg-emerald-600 p-2 rounded-xl group-hover:scale-110 apple-transition shadow-lg shadow-emerald-500/20">
                 <Activity size={24} />
               </div>
               <span className="text-xl font-bold tracking-tight">TB-Screen</span>
            </Link>
            <div className="space-y-6">
              <h2 className="text-4xl font-extrabold leading-[1.1] tracking-tight">临床评估，<br />从未如此优雅。</h2>
              <p className="text-slate-400 font-medium leading-relaxed max-w-[240px]">
                基于苹果设计准则构建，为您提供无缝、高效的结核病数字化筛查体验。
              </p>
            </div>
          </div>

          <div className="relative z-10">
            <div className="p-6 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400">
                   <ShieldCheck size={18} />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Security Core</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                全平台端到端数据加密，符合 HIPAA 与中国卫生数据保护指南。
              </p>
            </div>
          </div>
          
          {/* Subtle patterns */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,rgba(16,185,129,0.15),transparent_50%)]"></div>
          </div>
        </div>

        {/* Right Side: Interactive Form */}
        <div className="flex-1 p-10 lg:p-16 flex flex-col justify-center">
          <div className="mb-10">
             <Link to="/" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-400 hover:text-emerald-600 apple-transition mb-8">
               <ArrowLeft size={14} /> 退出至首页
             </Link>
             <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
               {isLogin ? '用户登录' : '申请加入'}
             </h1>
             <p className="text-slate-500 font-medium">访问您的受信任工作台。</p>
          </div>

          <div className="bg-slate-100/80 p-1 rounded-[20px] flex mb-8">
            <button 
              onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}
              className={`flex-1 py-2.5 text-[13px] font-bold rounded-[16px] apple-transition ${isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              登录
            </button>
            <button 
              onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}
              className={`flex-1 py-2.5 text-[13px] font-bold rounded-[16px] apple-transition ${!isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">用户名</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-5 py-4 rounded-2xl bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-emerald-500 focus:ring-[4px] focus:ring-emerald-500/10 outline-none apple-transition font-medium text-slate-900"
                placeholder="Username"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">密码</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-5 py-4 rounded-2xl bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-emerald-500 focus:ring-[4px] focus:ring-emerald-500/10 outline-none apple-transition text-slate-900"
                placeholder="••••••••"
              />
            </div>

            {!isLogin && (
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50 flex gap-3 animate-in fade-in slide-in-from-top-2">
                <Clock className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                <p className="text-[11px] text-emerald-800 leading-relaxed font-bold">
                  审核提醒：新账号在管理员批准后方可生效。审核通过后您将可以访问所有核心筛查工具。
                </p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-[12px] font-bold rounded-2xl animate-shake">
                {error}
              </div>
            )}
            
            {success && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[12px] font-bold rounded-2xl">
                {success}
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 rounded-2xl font-black apple-transition active:scale-[0.97] flex items-center justify-center gap-2 shadow-xl ${isLoading ? 'bg-slate-200 text-slate-400' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'}`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>{isLogin ? '登录工作台' : '提交审核申请'} <ChevronRight size={18} /></>
              )}
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-[11px] text-slate-400 font-medium">
              由数字化结核病防控技术中心提供支持
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
