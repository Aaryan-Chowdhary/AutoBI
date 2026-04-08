import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function AuthLayout({ children, isLogin }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef(null);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Trigger enter animation on mount
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 50);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const handleNavigate = (to) => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setShowContent(false);
    setPendingNavigation(to);

    // Wait for exit animation to complete before navigating
    setTimeout(() => {
      navigate(to);
      setIsAnimating(false);
      setPendingNavigation(null);
    }, 800);
  };

  return (
    <div ref={containerRef} className="h-screen flex overflow-hidden relative">
      {/* Wrapper for both panels */}
      <div 
        className={`
          w-full flex transition-all duration-800 ease-in-out
          ${isLogin ? 'flex-row' : 'flex-row-reverse'}
        `}
        style={{
          transform: showContent ? 'translateX(0)' : (isLogin ? 'translateX(-5%)' : 'translateX(5%)'),
          opacity: showContent ? 1 : 0
        }}
      >
        {/* Blue Panel */}
        <div 
          className={`
            hidden lg:flex lg:w-1/2 bg-linear-to-br from-[#1e5dd3] via-[#1a69f0] to-[#2080ff] 
            flex-col justify-center px-8 xl:px-12 relative overflow-hidden
            transition-all duration-800 ease-in-out
          `}
          style={{
            transform: showContent ? 'translateX(0)' : (isLogin ? 'translateX(-30%)' : 'translateX(30%)'),
            opacity: showContent ? 1 : 0,
            transitionDelay: '100ms'
          }}
        >
          {/* Background decorative elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 w-48 h-48 bg-white/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 left-10 w-56 h-56 bg-white/10 rounded-full blur-3xl"></div>
          </div>
          
          {isLogin ? (
            <>
              {/* Background chart lines for Login */}
              <div className="absolute inset-0 opacity-5">
                <svg className="w-full h-full" viewBox="0 0 400 400" preserveAspectRatio="none">
                  <path d="M 0 200 Q 100 150 200 180 T 400 160" stroke="white" strokeWidth="2" fill="none"/>
                  <path d="M 0 250 Q 100 200 200 230 T 400 210" stroke="white" strokeWidth="2" fill="none"/>
                  <path d="M 0 300 Q 100 250 200 280 T 400 260" stroke="white" strokeWidth="2" fill="none"/>
                </svg>
              </div>

              <div className="relative z-10 max-w-md">
                {/* Logo */}
                <div className="flex items-center gap-2 mb-8">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <svg className="size-6 text-white" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                      <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor"></path>
                    </svg>
                  </div>
                  <span className="text-white text-xl font-bold tracking-tight">AutoBI Studio</span>
                </div>

                <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4">
                  Analyze your data with <span className="text-blue-200">unmatched precision.</span>
                </h2>
                <p className="text-blue-100 text-sm leading-relaxed mb-8">
                  Experience the power of a modern BI engine. AutoBI Studio combines intuitive visual exploration with robust enterprise-grade analytics.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mb-2">
                      <span className="material-symbols-outlined text-white text-lg">bar_chart</span>
                    </div>
                    <h3 className="font-bold text-white text-sm mb-1">Dynamic Reporting</h3>
                    <p className="text-xs text-blue-100/80 leading-relaxed">Create complex dashboards with drag-and-drop simplicity.</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mb-2">
                      <span className="material-symbols-outlined text-white text-lg">security</span>
                    </div>
                    <h3 className="font-bold text-white text-sm mb-1">Secure & Scalable</h3>
                    <p className="text-xs text-blue-100/80 leading-relaxed">Enterprise-ready security for teams of any size.</p>
                  </div>
                </div>

                <div className="mt-8 flex items-center gap-3 text-[9px] font-bold text-white/40 uppercase tracking-[0.15em]">
                  <span>Powered by Next-Gen AI</span>
                  <span className="w-6 h-px bg-white/30"></span>
                  <span>Trusted by 500+ Enterprises</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="relative z-10 max-w-md">
                <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4">
                  Connect every dot in your <span className="text-blue-200">business ecosystem.</span>
                </h2>
                <p className="text-blue-100 text-sm leading-relaxed mb-6">
                  Experience the first BI tool that thinks like an analyst. Join 5,000+ data-driven teams using AutoBI Studio.
                </p>

                <div className="space-y-3">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-white text-lg">trending_up</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm mb-0.5">Predictive Modeling</h3>
                        <p className="text-xs text-blue-100/80 leading-relaxed">Forecast future trends with 99% accuracy using our proprietary ML engine.</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-white text-lg">dashboard</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm mb-0.5">Intuitive Studio</h3>
                        <p className="text-xs text-blue-100/80 leading-relaxed">Drag-and-drop dashboard builder that mimics the Power BI experience you love.</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-white text-lg">security</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm mb-0.5">Enterprise Security</h3>
                        <p className="text-xs text-blue-100/80 leading-relaxed">SOC2 Type II compliant with end-to-end encryption.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-[9px] font-bold text-white/50 uppercase tracking-[0.2em] mb-2">Trusted by Industry Leaders</p>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-6 bg-white/20 rounded"></div>
                    <div className="w-16 h-6 bg-white/20 rounded"></div>
                    <div className="w-16 h-6 bg-white/20 rounded"></div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Form Panel */}
        <div 
          className={`
            w-full lg:w-1/2 bg-white flex flex-col
            transition-all duration-800 ease-in-out
          `}
          style={{
            transform: showContent ? 'translateX(0)' : (isLogin ? 'translateX(30%)' : 'translateX(-30%)'),
            opacity: showContent ? 1 : 0,
            transitionDelay: '150ms'
          }}
        >
          {React.cloneElement(children, { onNavigate: handleNavigate })}
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
