import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

function PageLoader() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Start loading on route change
    setLoading(true);
    setProgress(20);

    const t1 = setTimeout(() => setProgress(60), 100);
    const t2 = setTimeout(() => setProgress(85), 250);
    const t3 = setTimeout(() => setProgress(100), 450);
    const t4 = setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 650);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [location.pathname]);

  if (!loading) return null;

  return (
    <>
      {/* Top progress bar */}
      <div
        className="fixed top-0 left-0 z-[9999] h-0.5 bg-primary shadow-lg shadow-primary/40 transition-all ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? '150ms' : '400ms',
        }}
      />

      {/* Subtle full-page overlay with spinner */}
      <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-white/60 backdrop-blur-sm">
        {/* AutoBI logo spinner */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-10 h-10">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
            {/* Spinning arc */}
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
            {/* Inner logo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor" />
              </svg>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest animate-pulse">
            Loading
          </span>
        </div>
      </div>
    </>
  );
}

export default PageLoader;
