
import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import * as LucideIcons from 'lucide-react';
import { 
  Activity, 
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  Cpu,
  BrainCircuit,
  Dna,
  FlaskConical
} from 'lucide-react';
import Footer from '../components/Footer';

const LandingPage: React.FC = () => {
  const { siteConfig } = useStore();
  
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const renderIcon = (name: string, size = 24) => {
    const IconComponent = (LucideIcons as any)[name] || LucideIcons.HelpCircle;
    return <IconComponent size={size} />;
  };

  // 确保“数字化、智能化”独立且醒目
  const highlightedWords = "数字化、智能化";
  const restOfTitle = siteConfig.heroTitle.replace(highlightedWords, "").replace(/\n/g, "").trim();

  return (
    <div className="bg-white scroll-smooth overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full glass z-[100] border-b border-black/5">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-2xl shadow-lg shadow-emerald-200">
              <Activity className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">TB-Scan</span>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <div className="flex items-center gap-8 text-[13px] font-semibold text-slate-500 uppercase tracking-wider">
              <button onClick={() => scrollToSection('features')} className="hover:text-emerald-600 apple-transition">核心技术</button>
              <button onClick={() => scrollToSection('about')} className="hover:text-emerald-600 apple-transition">安全性</button>
            </div>
            <Link to="/login" className="px-6 py-2.5 bg-black text-white text-[13px] font-bold rounded-full hover:bg-slate-800 apple-transition shadow-xl">
              工作台登录
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Futuristic Lab Style */}
      <section className="bg-white pt-32 pb-16 px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-center lg:text-left z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-[11px] font-black text-emerald-600 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 tracking-widest uppercase">
              <Sparkles size={12} /> {siteConfig.heroBadge}
            </div>
            
            <h1 className="font-[1000] text-slate-900 leading-[1.2] tracking-tighter mb-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
              <span className="block text-4xl sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 pb-3 whitespace-nowrap">
                {highlightedWords}
              </span>
              <span className="block text-3xl sm:text-4xl md:text-5xl text-slate-900 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                {restOfTitle}
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-500 mb-12 leading-[1.6] max-w-xl mx-auto lg:mx-0 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 font-medium opacity-90">
              {siteConfig.heroDescription}
            </p>

            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
              <Link to="/login" className="px-10 py-5 bg-emerald-600 text-white rounded-[22px] font-bold text-lg shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 apple-transition flex items-center justify-center gap-3">
                {siteConfig.ctaText} <ArrowRight size={22} />
              </Link>
              <button onClick={() => scrollToSection('features')} className="px-10 py-5 bg-white text-slate-900 border border-slate-200 rounded-[22px] font-bold text-lg shadow-xl hover:bg-slate-50 apple-transition">
                了解更多技术细节
              </button>
            </div>
          </div>
          
          <div className="flex-1 w-full relative animate-in fade-in zoom-in duration-1000 delay-400">
            <div className="relative group">
              {/* Decorative Blur Backdrops - Cooler Tones */}
              <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-100 rounded-full blur-[100px] opacity-40"></div>
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-100 rounded-full blur-[100px] opacity-40"></div>
              
              {/* Product Show Image - High-end Clinical Analyzer (No People) */}
              <div className="relative aspect-square md:aspect-[4/5] lg:aspect-square bg-slate-950 rounded-[4rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border border-white/10 group-hover:rotate-1 apple-transition">
                <img 
                  src={siteConfig.heroImageUrl || "https://images.unsplash.com/photo-1518152006812-edab29b069ac?auto=format&fit=crop&q=80&w=2000"} 
                  alt="High-end Medical Analysis System" 
                  className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-[25s]"
                />
                
                {/* Floating Tech Labels */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
                
                <div className="absolute top-10 right-10 flex flex-col items-end gap-3">
                   <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-3 rounded-2xl">
                      <FlaskConical size={24} className="text-cyan-400" />
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full border border-cyan-400/20">精密病理分析</span>
                </div>

                <div className="absolute bottom-10 left-10 right-10">
                  <div className="bg-white/5 backdrop-blur-3xl border border-white/10 p-6 rounded-[2.5rem] flex items-center gap-5">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                       <BrainCircuit size={24} className="text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm">结核病多维风险评分引擎</h4>
                      <p className="text-slate-400 text-[10px] font-medium tracking-wide uppercase mt-1">Multi-modal Scoring & AI Inference</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-8">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">{siteConfig.featuresTitle}</h2>
            <p className="text-lg text-slate-400 max-w-2xl leading-relaxed font-medium">
              {siteConfig.featuresSubtitle}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {siteConfig.features.map((f) => (
              <div key={f.id} className="group p-10 bg-slate-50/50 rounded-[3rem] border border-transparent hover:border-slate-100 hover:bg-white apple-transition hover:-translate-y-2 hover:shadow-2xl hover:shadow-slate-200/50">
                <div className={`w-14 h-14 rounded-[22px] flex items-center justify-center mb-8 shadow-xl transition-all duration-500 group-hover:scale-110 bg-emerald-600 text-white shadow-emerald-600/20`}>
                  {renderIcon(f.iconName, 28)}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4 tracking-tight">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed text-base font-medium">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="bg-white rounded-[4rem] p-10 md:p-20 premium-shadow flex flex-col lg:flex-row gap-16 items-center border border-slate-100">
            <div className="lg:w-1/2">
              <span className="text-emerald-600 font-black tracking-[0.2em] text-[11px] uppercase block mb-6">Security & Privacy</span>
              <h2 className="text-2xl md:text-4xl font-[900] text-slate-900 mb-10 leading-tight tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                {siteConfig.aboutTitle}
              </h2>
              <div className="space-y-6">
                {siteConfig.aboutItems.map((item) => (
                  <div key={item.id} className="flex gap-5 group">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-600 apple-transition">
                       <CheckCircle2 className="text-emerald-600 group-hover:text-white apple-transition" size={18} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h4>
                      <p className="text-slate-500 text-base leading-relaxed font-medium">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-1/2 relative w-full">
               <div className="w-full aspect-video bg-slate-950 rounded-[3rem] p-10 flex flex-col justify-between text-white overflow-hidden group shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 apple-transition"></div>
                  <div className="flex justify-between items-start relative z-10">
                     <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/10">
                        <Lock className="text-emerald-400" size={28} />
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-[0.25em] bg-emerald-400/10 text-emerald-400 px-4 py-1.5 rounded-full border border-emerald-400/20">Trusted Core</span>
                  </div>
                  <div className="relative z-10">
                     <div className="text-5xl font-black mb-3 tracking-tighter">99.99%</div>
                     <p className="text-slate-400 text-[11px] leading-relaxed max-w-xs font-bold uppercase tracking-widest">
                        System Stability & Data Integrity
                     </p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
