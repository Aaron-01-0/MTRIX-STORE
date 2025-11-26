import { useState, useEffect } from 'react';

interface MTRIXLogoProps {
  onAnimationComplete: () => void;
}

const MTRIXLogo = ({ onAnimationComplete }: MTRIXLogoProps) => {
  const [showLogo, setShowLogo] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLogo(false);
      setTimeout(onAnimationComplete, 500);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  if (!showLogo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-mtrix-black">
      <div className="text-center">
        <h1 
          className="mtrix-glitch text-8xl font-orbitron mb-8"
          data-text="MTRIX"
        >
          MTRIX
        </h1>
        <div className="flex items-center justify-center space-x-4 animate-fade-in">
          <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
          <div className="w-3 h-3 bg-primary rounded-full animate-pulse delay-100"></div>
          <div className="w-3 h-3 bg-primary rounded-full animate-pulse delay-200"></div>
        </div>
        <p className="text-muted-foreground mt-4 font-inter">
          Style. Protection. Customization.
        </p>
      </div>
    </div>
  );
};

export default MTRIXLogo;