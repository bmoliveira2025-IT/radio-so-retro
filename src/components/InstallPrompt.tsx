import React, { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import './InstallPrompt.css';

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Check if user dismissed it recently
      if (!localStorage.getItem('pwa_prompt_dismissed')) {
        setIsVisible(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Remember that the user dismissed it so we don't bother them again
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="install-prompt-overlay">
      <div className="install-prompt-card">
        <div className="install-prompt-content">
          <img src="/logo.svg" alt="Só Retrô" className="install-logo" />
          <div className="install-text">
            <h4>Instalar Aplicativo</h4>
            <p>Adicione à sua tela inicial</p>
          </div>
        </div>
        <div className="install-actions">
          <button className="install-btn-primary" onClick={handleInstall}>
            <Download size={14} /> Instalar
          </button>
          <button className="install-btn-close" onClick={handleDismiss}>
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
