import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const [isDark, setIsDark] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleGetStarted = () => {
    navigate('/register');
  };

  return (
    <div className="bg-white text-[#111318] antialiased font-display">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-solid border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between">
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="text-primary text-2xl font-black flex items-center gap-2">
              <svg className="size-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor"></path>
              </svg>
              <span className="text-[#111318] text-xl font-bold tracking-tight">AutoBI Studio</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a className="text-sm font-medium text-gray-600 hover:text-primary transition-colors" href="#workflow">Workflow</a>
            <a className="text-sm font-medium text-gray-600 hover:text-primary transition-colors" href="#features">Features</a>
            <a className="text-sm font-medium text-gray-600 hover:text-primary transition-colors" href="#pricing">Plans</a>
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center -ml-2"
              aria-label="Toggle Dark Mode"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="hidden sm:flex px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Log In</button>
            <button 
              onClick={handleGetStarted}
              className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-shadow shadow-sm"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section id="home" className="relative overflow-hidden pt-0 pb-8 lg:pt-0 lg:pb-12 bg-[#F9FAFB]">
          <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="flex flex-col gap-8 max-w-[600px] z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider w-fit">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                New: AI-Powered Insights 2.0
              </div>
              <h1 className="text-6xl lg:text-7xl font-black leading-[1.1] tracking-[-0.04em] text-[#111318]">
                Analytics <br /><span className="text-primary">Reimagined</span>
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed max-w-[500px]">
                The power of enterprise BI meets the speed of modern SaaS. Connect your entire data stack and generate board-ready insights in minutes, not weeks.
              </p>
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={handleGetStarted}
                  className="bg-primary text-white h-14 px-8 rounded-xl text-base font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
                >
                  Start Building Free
                </button>
              </div>
            </div>

            {/* Expanded 3D Dashboard Preview */}
            <div className="relative w-full h-[500px] lg:h-[600px] flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full -z-10 animate-pulse"></div>
              <div className="absolute top-1/4 right-0 w-64 h-64 bg-blue-400/10 blur-[80px] rounded-full -z-10"></div>

              <div className="relative w-full max-w-[640px] glass-container rounded-3xl overflow-hidden border border-white shadow-2xl transition-all duration-700 hover:scale-[1.01]">
                <div className="browser-chrome h-10 flex items-center px-4 gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#FF5F57]"></div>
                    <div className="w-2 h-2 rounded-full bg-[#FFBD2E]"></div>
                    <div className="w-2 h-2 rounded-full bg-[#28C840]"></div>
                  </div>
                  <div className="mx-auto bg-white/60 rounded-full h-5 px-3 flex items-center w-2/3 border border-gray-200/50">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2"></div>
                    <div className="h-1 w-full bg-gray-400/20 rounded-full"></div>
                  </div>
                </div>

                <div className="relative bg-white/80 aspect-4/3 overflow-hidden p-6">
                  {/* Floating Elements (The 3D part) */}
                  <div className="absolute top-10 right-10 w-48 h-32 floating-element data-glow z-20" style={{ animationDelay: '-1s' }}>
                    <div className="bg-white p-4 rounded-2xl shadow-2xl border border-gray-100 transform rotate-3 flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary text-[14px]">auto_fix_high</span>
                        </div>
                        <div className="h-2 w-20 bg-gray-100 rounded"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-1.5 w-full bg-primary/10 rounded"></div>
                        <div className="h-1.5 w-3/4 bg-primary/20 rounded"></div>
                        <div className="h-1.5 w-1/2 bg-primary/30 rounded"></div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-12 left-8 w-44 h-44 floating-element data-glow z-20" style={{ animationDelay: '-3s' }}>
                    <div className="bg-white p-6 rounded-full shadow-2xl border border-gray-100 transform -rotate-6 flex flex-col items-center justify-center text-center">
                      <div className="text-primary font-black text-2xl mb-1 leading-none">84%</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Accuracy</div>
                      <div className="mt-3 flex gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-full flex flex-col gap-6 relative">
                    {/* Background Grid Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, #135bec 1.5px, transparent 0)', backgroundSize: '24px 24px' }}></div>

                    <div className="grid grid-cols-2 gap-6 h-32 shrink-0">
                      <div className="bg-primary/5 rounded-2xl border border-primary/10 p-4 flex items-end gap-1.5 overflow-hidden">
                        <div className="flex-1 bg-primary/20 rounded-t-md h-[40%]"></div>
                        <div className="flex-1 bg-primary/40 rounded-t-md h-[70%]"></div>
                        <div className="flex-1 bg-primary/20 rounded-t-md h-[55%]"></div>
                        <div className="flex-1 bg-primary rounded-t-md h-[90%] shadow-lg shadow-primary/20"></div>
                        <div className="flex-1 bg-primary/40 rounded-t-md h-[65%]"></div>
                        <div className="flex-1 bg-primary/20 rounded-t-md h-[50%]"></div>
                      </div>
                      <div className="bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center p-6">
                        <div className="relative w-full h-full rounded-2xl border-2 border-gray-200 border-dashed flex items-center justify-center">
                          <span className="material-symbols-outlined text-gray-300 text-3xl">add_circle</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="h-4 w-32 bg-gray-50 rounded-full"></div>
                        <div className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full">LIVE REPORT</div>
                      </div>
                      <div className="space-y-3">
                        <div className="h-2.5 w-full bg-gray-50 rounded-full"></div>
                        <div className="h-2.5 w-full bg-gray-50 rounded-full"></div>
                        <div className="h-2.5 w-3/4 bg-gray-50 rounded-full"></div>
                      </div>
                      <div className="mt-auto flex justify-between items-center pt-6">
                        <div className="flex gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100"></div>
                          <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100"></div>
                        </div>
                        <div className="h-10 px-6 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
                          <div className="h-1.5 w-12 bg-white/40 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Decorative Glows */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                    <div className="absolute top-1/2 left-1/4 w-3 h-3 bg-primary rounded-full data-glow animate-ping"></div>
                    <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-blue-300 rounded-full data-glow animate-ping" style={{ animationDelay: '1.5s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* Workflow Section */}
        <section id="workflow" className="pt-8 pb-6 bg-white scroll-mt-20">
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="text-center max-w-[800px] mx-auto mb-20">
              <h2 className="text-primary font-bold mb-4 uppercase tracking-[0.2em] text-[10px]">Our Workflow</h2>
              <h3 className="text-4xl font-bold tracking-tight mb-6 text-[#111318]">From Raw Data to Radical Clarity</h3>
              <p className="text-gray-500 text-lg leading-relaxed">
                We've optimized every stage of the analytics lifecycle so you can spend less time wrestling with data and more time acting on it.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="flex flex-col items-center text-center group">
                <div className="size-14 rounded-2xl bg-primary flex items-center justify-center text-white mb-8 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl">magic_button</span>
                </div>
                <h4 className="text-xl font-bold mb-4 text-[#111318]">Clean</h4>
                <p className="text-gray-500 text-sm leading-relaxed px-4">Automated data prep and cleaning powered by AI. Transform messy rows into structured gold automatically.</p>
              </div>
              <div className="flex flex-col items-center text-center group">
                <div className="size-14 rounded-2xl bg-primary flex items-center justify-center text-white mb-8 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl">database</span>
                </div>
                <h4 className="text-xl font-bold mb-4 text-[#111318]">Store</h4>
                <p className="text-gray-500 text-sm leading-relaxed px-4">Secure cloud data warehouse integration. Store your cleaned data reliably with automatic scaling and backups.</p>
              </div>
              <div className="flex flex-col items-center text-center group">
                <div className="size-14 rounded-2xl bg-primary flex items-center justify-center text-white mb-8 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl">pie_chart</span>
                </div>
                <h4 className="text-xl font-bold mb-4 text-[#111318]">Visualize</h4>
                <p className="text-gray-500 text-sm leading-relaxed px-4">Drag-and-drop your way to stunning dashboards. Familiar Power BI-style editor without the steep learning curve.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="pt-6 pb-16 bg-[#F9FAFB] border-y border-gray-100 scroll-mt-20">
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div>
                <h2 className="text-4xl font-black tracking-tight mb-12 text-[#111318]">Your essential <br />data toolkit</h2>
                <div className="space-y-10">
                  <div className="flex gap-6">
                    <div className="shrink-0 size-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-primary shadow-sm">
                      <span className="material-symbols-outlined">cleaning_services</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold mb-2 text-[#111318]">Clean Raw Data</h4>
                      <p className="text-gray-500 text-sm leading-relaxed">Automatically identify duplicates, handle null values, and apply data types so your files are ready for analysis in seconds.</p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="shrink-0 size-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-primary shadow-sm">
                      <span className="material-symbols-outlined">folder</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold mb-2 text-[#111318]">Store Your Files</h4>
                      <p className="text-gray-500 text-sm leading-relaxed">Keep your cleaned datasets securely stored. Easily access, manage, and retrieve your work whenever you need it.</p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="shrink-0 size-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-primary shadow-sm">
                      <span className="material-symbols-outlined">dashboard</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold mb-2 text-[#111318]">Insights & Dashboards</h4>
                      <p className="text-gray-500 text-sm leading-relaxed">Use our intuitive editor to build visual dashboards. Transform rows of data into beautiful charts and clear insights instantly.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 pt-12">
                <div className="space-y-6">
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <span className="material-symbols-outlined text-primary mb-6 text-2xl">upload_file</span>
                    <h5 className="font-bold text-lg mb-2 text-[#111318]">Instant Uploads</h5>
                    <p className="text-xs text-gray-500 leading-relaxed">Drag and drop your CSV or Excel files seamlessly.</p>
                  </div>
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <span className="material-symbols-outlined text-primary mb-6 text-2xl">bolt</span>
                    <h5 className="font-bold text-lg mb-2 text-[#111318]">Fast Processing</h5>
                    <p className="text-xs text-gray-500 leading-relaxed">No lag or waiting times, even for large spreadsheets.</p>
                  </div>
                </div>
                <div className="space-y-6 pt-12">
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <span className="material-symbols-outlined text-primary mb-6 text-2xl font-bold">save</span>
                    <h5 className="font-bold text-lg mb-2 text-[#111318]">Easy Exports</h5>
                    <p className="text-xs text-gray-500 leading-relaxed">Download your clean data or dashboard reports in one click.</p>
                  </div>
                  <div className="bg-primary p-8 rounded-3xl shadow-xl shadow-primary/30 text-white">
                    <span className="material-symbols-outlined mb-6 text-2xl">auto_awesome</span>
                    <h5 className="font-bold text-lg mb-2">Smart Actions</h5>
                    <p className="text-xs text-white/80 leading-relaxed">Let AI suggest chart types and automatically detect data categories.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-12 bg-[#F9FAFB] scroll-mt-20 border-t border-gray-100">
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="text-center max-w-[800px] mx-auto mb-10">
              <h2 className="text-primary font-bold mb-4 uppercase tracking-[0.2em] text-[10px]">Pricing Plans</h2>
              <h3 className="text-4xl lg:text-5xl font-black tracking-tight mb-6 text-[#111318]">The right plan for every scale</h3>
              <p className="text-gray-500 text-lg leading-relaxed">
                Simple, transparent pricing that grows with your team.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-8">
              {/* Starter Plan */}
              <div className="bg-white p-8 rounded-4xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="mb-8">
                  <h4 className="text-lg font-bold text-[#111318] mb-2">Starter</h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-[#111318]">₹0</span>
                    <span className="text-gray-400 text-sm font-medium">/mo</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                    <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                    Clean Raw Data  
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                    <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                    Limited Insights & Reports 
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                    <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                    Limited Storage
                  </li>
                </ul>
                <button 
                  onClick={handleGetStarted}
                  className="w-full py-4 rounded-xl border-2 border-gray-100 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                >
                  Your Plan
                </button>
              </div>

              {/* Pro Plan */}
              <div className="bg-white p-8 rounded-4xl border-2 border-primary shadow-2xl shadow-primary/10 relative overflow-hidden flex flex-col md:scale-105 z-10">
                <div className="absolute top-4 right-6 px-3 py-1 bg-primary text-white text-[10px] font-black rounded-full uppercase tracking-wider">
                  Most Popular
                </div>
                <div className="mb-8">
                  <h4 className="text-lg font-bold text-[#111318] mb-2">Pro</h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-primary">₹99</span>
                    <span className="text-gray-400 text-sm font-medium">/mo</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                    <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                    Unlimited Data Cleaning
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                    <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                    Unlimited Storage
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                    <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                    Powerful Insights & Reports
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                    <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                    Access To Premium Features
                  </li>
                </ul>
                <button 
                  onClick={handleGetStarted}
                  className="w-full py-4 rounded-xl bg-primary text-white font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-primary/20"
                >
                  Buy Now
                </button>
              </div>


            </div>
          </div>
        </section>

      </main>


    </div>
  );
}

export default LandingPage;
