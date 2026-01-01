
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store';
import { UserRole } from '../types';
import { Activity, ShieldCheck, ArrowLeft, ChevronRight, CheckCircle } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { users, currentUser, setCurrentUser, addUser } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard/cases');
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // 模拟网络延迟
    setTimeout(() => {
      if (isLogin) {
        const user = users.find(u => u.username === username);
        if (user) {
          if (!user.approved || !user.active) {
            setError('该账户目前不可用，请联系管理员。');
            setIsLoading(false);
            return;
          }
          if (user.password !== password) {
            setError('用户名或密码错误。');
            setIsLoading(false);
            return;
          }
          setCurrentUser(user);
          navigate('/dashboard/cases');
        } else {
          setError('未找到该账户。');
        }
      } else {
        const exists = users.find(u => u.username === username);
        if (exists) {
          setError('该用户名已被占用。');
        } else {
          // 注册即激活逻辑
          const newUser = addUser(username, UserRole.USER, password, true);
          // 注册成功直接登录
          setCurrentUser(newUser);
          navigate('/dashboard/cases');
        }
      }
      setIsLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-6 selection:bg-emerald-100">
      <div className="fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-100/40 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/30 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-[1000px] bg-white/80 backdrop-blur-3xl rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-white flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-1000">
        <div className="hidden md:flex md:w-[45%] bg-slate-900 p-12 flex-col justify-between text-white relative">
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2.5 group mb-16">
               <div className="bg-emerald-600 p-2 rounded-xl group-hover:scale-110 apple-transition shadow-lg shadow-emerald-500/20">
                 <Activity size={24} />
               </div>
               <span className="text-xl font-bold tracking-tight">TB-Screen</span>
            </Link>
            <div className="space-y-6">
              <h2 className="text-4xl font-extrabold leading-[1.1] tracking-tight">临床评估，<br />全速进行。</h2>
              <p className="text-slate-400 font-medium leading-relaxed max-w-[240px]">
                基于大数据评分模型的数字化结核病精准筛查。
              </p>
            </div>
          </div>
          <div className="relative z-10">
            <div className="p-6 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400">
                   <ShieldCheck size={18} />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Instant Access</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-bold">
                系统现已开启即时注册机制，新用户注册后无需审核即可直接进入工作台。
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-10 lg:p-16 flex flex-col justify-center">
          <div className="mb-10">
             <Link to="/" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-400 hover:text-emerald-600 apple-transition mb-8">
               <ArrowLeft size={14} /> 返回门户首页
             </Link>
             <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
               {isLogin ? '欢迎登录' : '创建新账户'}
             </h1>
             <p className="text-slate-500 font-bold">结核病防治数字化协作平台。</p>
          </div>

          <div className="bg-slate-100/80 p-1 rounded-[20px] flex mb-8">
            <button onClick={() => { setIsLogin(true); setError(''); }} className={`flex-1 py-2.5 text-[13px] font-bold rounded-[16px] apple-transition ${isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>登录</button>
            <button onClick={() => { setIsLogin(false); setError(''); }} className={`flex-1 py-2.5 text-[13px] font-bold rounded-[16px] apple-transition ${!isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>注册</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">用户名</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full px-5 py-4 rounded-2xl bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-emerald-500 focus:ring-[4px] focus:ring-emerald-500/10 outline-none apple-transition font-bold text-slate-900" placeholder="Username"/>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">密码</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-5 py-4 rounded-2xl bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-emerald-500 focus:ring-[4px] focus:ring-emerald-500/10 outline-none apple-transition text-slate-900 font-bold" placeholder="••••••••"/>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-[12px] font-bold rounded-2xl">
                {error}
              </div>
            )}

            <button type="submit" disabled={isLoading} className={`w-full py-4 rounded-2xl font-black apple-transition active:scale-[0.97] flex items-center justify-center gap-2 shadow-xl ${isLoading ? 'bg-slate-200 text-slate-400' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'}`}>
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>{isLogin ? '登录工作台' : '注册并即刻进入'} <ChevronRight size={18} /></>
              )}
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-[11px] text-slate-400 font-bold">
              © TB-Screen 数字化防治中心 · 自动激活已启用
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
