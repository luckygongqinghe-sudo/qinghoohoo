
import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import * as LucideIcons from 'lucide-react';
import { 
  Activity, 
  ArrowRight,
  CheckCircle2,
  Lock,
  BrainCircuit,
  FlaskConical,
  Zap,
  Globe
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

  const highlightedWords = "数字化、智能化";
  const rawTitle = siteConfig.heroTitle || "数字化、智能化\n结核病筛查模型探索";
  const restOfTitle = rawTitle.replace(highlightedWords, "").replace(/\n/g, " ").trim();

  return (
    <div className="bg-[#fbfbfd] scroll-smooth overflow-x-hidden selection:bg-emerald-100">
      {/* Navigation - Ultra Slim */}
      <nav className="fixed top-0 w-full glass z-[100] border-b border-black/5">
        <div className="max-w-7xl mx-auto px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="bg-emerald-600 p-2 rounded-xl shadow-lg group-hover:scale-105 apple-transition">
              <Activity className="text-white w-4 h-4" />
            </div>
            <span className="text-lg font-[1000] text-slate-900 tracking-tighter uppercase">TB-Scan</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="px-6 py-2 bg-slate-900 text-white text-[10px] font-black rounded-full hover:bg-emerald-600 apple-transition uppercase tracking-widest">
              工作台
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Tighter Spacing */}
      <section className="relative pt-32 pb-16 px-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[40%] h-[60%] bg-emerald-50/50 -z-10 blur-[100px] rounded-full translate-x-1/4 -translate-y-1/4"></div>
        
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-[9px] font-black text-emerald-600 mb-6 shadow-sm tracking-widest uppercase">
              <Zap size={10} className="fill-emerald-600" /> {siteConfig.heroBadge}
            </div>
            
            <h1 className="font-[1000] text-slate-900 leading-[1.05] tracking-tighter mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <span className="block text-5xl sm:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-600 pb-2">
                {highlightedWords}
              </span>
              <span className="block text-4xl sm:text-5xl text-slate-900">
                {restOfTitle}
              </span>
            </h1>

            <p className="text-base md:text-lg text-slate-400 mb-10 leading-relaxed max-w-lg mx-auto lg:mx-0 font-bold opacity-80">
              {siteConfig.heroDescription}
            </p>

            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
              <Link to="/login" className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-xl hover:scale-105 hover:bg-emerald-500 apple-transition flex items-center justify-center gap-3">
                {siteConfig.ctaText} <ArrowRight size={16} />
              </Link>
              <button onClick={() => scrollToSection('features')} className="px-10 py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl font-black text-sm shadow-sm hover:bg-slate-50 apple-transition flex items-center justify-center gap-3">
                <Globe size={16} className="text-slate-300" /> 技术白皮书
              </button>
            </div>
          </div>
          
          <div className="flex-1 w-full max-w-lg relative animate-in zoom-in duration-1000">
            <div className="relative group">
              <div className="relative aspect-[4/5] bg-slate-950 rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5 apple-transition">
                <img src={siteConfig.heroImageUrl} className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent"></div>
                
                <div className="absolute top-6 right-6 flex flex-col items-end gap-2">
                   <div className="bg-white/10 backdrop-blur-xl p-2 rounded-xl border border-white/10"><FlaskConical size={18} className="text-emerald-400" /></div>
                   <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">AI Analysis</span>
                </div>

                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-5 rounded-3xl flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center"><BrainCircuit size={20} className="text-white" /></div>
                    <div><h4 className="text-white font-black text-sm">风险评分引擎</h4><p className="text-slate-400 text-[8px] font-black tracking-widest mt-0.5">Scoring & Inference System</p></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid - Professional Tightness */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-10">
          <div className="mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-lg">
              <h2 className="text-3xl font-[1000] text-slate-900 mb-2 tracking-tighter">{siteConfig.featuresTitle}</h2>
              <p className="text-base text-slate-400 font-bold">{siteConfig.featuresSubtitle}</p>
            </div>
            <div className="hidden lg:block h-px flex-1 bg-slate-100 mb-3 ml-6"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {siteConfig.features.map((f, i) => (
              <div key={f.id} className="group p-10 bg-[#fbfbfd] rounded-[2.5rem] hover:bg-white apple-transition hover:-translate-y-2 hover:shadow-2xl border border-transparent hover:border-slate-100">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-emerald-600 text-white shadow-xl shadow-emerald-50">
                  {renderIcon(f.iconName, 22)}
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-3 tracking-tight">{f.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-bold opacity-80">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section id="about" className="py-16 bg-[#fbfbfd]">
        <div className="max-w-7xl mx-auto px-10">
          <div className="bg-white rounded-[3.5rem] p-10 md:p-14 shadow-xl flex flex-col lg:flex-row gap-12 items-center border border-slate-100">
            <div className="lg:w-1/2">
              <span className="text-emerald-600 font-black tracking-widest text-[9px] uppercase block mb-4">Secured Protocol</span>
              <h2 className="text-3xl font-[1000] text-slate-900 mb-10 tracking-tighter leading-tight">{siteConfig.aboutTitle}</h2>
              <div className="space-y-6">
                {siteConfig.aboutItems.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-600 shrink-0">
                       <CheckCircle2 className="text-emerald-600" size={16} />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-900 mb-0.5">{item.title}</h4>
                      <p className="text-slate-400 text-xs font-bold leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-1/2 w-full">
               <div className="w-full aspect-video bg-slate-950 rounded-[2.5rem] p-8 flex flex-col justify-between text-white overflow-hidden shadow-2xl relative group">
                  <div className="flex justify-between items-start">
                     <div className="bg-white/10 backdrop-blur-xl p-3 rounded-xl border border-white/10 group-hover:scale-110 apple-transition"><Lock className="text-emerald-400" size={20} /></div>
                     <span className="text-[8px] font-black uppercase tracking-widest bg-emerald-400/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-400/20">Cloud Matrix</span>
                  </div>
                  <div>
                     <div className="text-5xl font-[1000] mb-2 tracking-tighter">99.9%</div>
                     <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Inference Accuracy Service</p>
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
