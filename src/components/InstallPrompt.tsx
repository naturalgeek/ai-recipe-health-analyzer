import { useState, useEffect } from 'react';

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

function isInStandaloneMode(): boolean {
  return ('standalone' in window.navigator && (window.navigator as unknown as { standalone: boolean }).standalone) ||
    window.matchMedia('(display-mode: standalone)').matches;
}

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if iOS and not already installed
    const dismissed = localStorage.getItem('install-prompt-dismissed');
    if (isIOS() && !isInStandaloneMode() && !dismissed) {
      // Delay showing the prompt
      const timer = setTimeout(() => setShowPrompt(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('install-prompt-dismissed', 'true');
  };

  const handleRemindLater = () => {
    setShowPrompt(false);
    // Don't set localStorage, so it will show again next visit
  };

  if (!showPrompt) return null;

  return (
    <div className="install-prompt-overlay">
      <div className="install-prompt">
        <div className="install-prompt-header">
          <h3>Add to Home Screen</h3>
          <button className="close-btn" onClick={handleDismiss}>&times;</button>
        </div>

        <p>Install AI Recipe Analyzer on your iPhone for quick access and a better experience.</p>

        <div className="install-steps">
          <div className="install-step">
            <span className="step-number">1</span>
            <span className="step-text">
              Tap the <strong>Share</strong> button
              <span className="share-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
              </span>
              at the bottom of Safari
            </span>
          </div>

          <div className="install-step">
            <span className="step-number">2</span>
            <span className="step-text">
              Scroll down and tap <strong>"Add to Home Screen"</strong>
              <span className="add-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              </span>
            </span>
          </div>

          <div className="install-step">
            <span className="step-number">3</span>
            <span className="step-text">
              Tap <strong>"Add"</strong> in the top right corner
            </span>
          </div>
        </div>

        <div className="install-prompt-actions">
          <button className="remind-btn" onClick={handleRemindLater}>
            Remind me later
          </button>
          <button className="got-it-btn" onClick={handleDismiss}>
            Don't show again
          </button>
        </div>
      </div>
    </div>
  );
}
