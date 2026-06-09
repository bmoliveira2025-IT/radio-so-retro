import { useEffect, useState } from 'react';
import './SplashScreen.css';

interface SplashScreenProps {
  onGetStarted: () => void;
}

export default function SplashScreen({ onGetStarted }: SplashScreenProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation after mount
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`splash-root ${visible ? 'splash-in' : ''}`}>

      {/* Gradient background top */}
      <div className="splash-bg-gradient" />

      {/* Text block */}
      <div className="splash-text-block">
        <h1 className="splash-headline">
          Enjoy<br />
          Your Radio,<br />
          Enjoy The Life
        </h1>
      </div>

      {/* Hero image */}
      <div className="splash-image-wrap">
        <img
          src="/splash-girl.png"
          alt="Mulher ouvindo rádio com fones de ouvido"
          className="splash-img"
          draggable={false}
        />
      </div>

      {/* Bottom area */}
      <div className="splash-bottom">
        {/* Pagination dots */}
        <div className="splash-dots" aria-hidden="true">
          <span className="splash-dot" />
          <span className="splash-dot active" />
          <span className="splash-dot" />
        </div>

        {/* CTA button */}
        <button
          className="splash-cta"
          onClick={onGetStarted}
          aria-label="Começar a ouvir"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
