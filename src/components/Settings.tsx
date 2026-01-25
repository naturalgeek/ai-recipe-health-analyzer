import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export function Settings() {
  const { config, updateConfig } = useApp();
  const [apiKey, setApiKey] = useState(config.openaiApiKey);
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    setApiKey(config.openaiApiKey);
  }, [config.openaiApiKey]);

  const handleSave = async () => {
    await updateConfig({ openaiApiKey: apiKey });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const maskedKey = apiKey
    ? apiKey.substring(0, 7) + '...' + apiKey.substring(apiKey.length - 4)
    : '';

  return (
    <div className="settings-container">
      <h2>Settings</h2>

      <div className="settings-section">
        <h3>OpenAI API Configuration</h3>
        <p className="settings-description">
          Enter your OpenAI API key to enable nutritional assessment using GPT-5.2.
          Your key is stored locally in your browser and never sent to any server except OpenAI.
        </p>

        <div className="api-key-input">
          <label htmlFor="apiKey">API Key</label>
          <div className="input-group">
            <input
              id="apiKey"
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="api-key-field"
            />
            <button
              className="toggle-visibility"
              onClick={() => setShowKey(!showKey)}
              type="button"
            >
              {showKey ? '🙈' : '👁️'}
            </button>
          </div>
          {config.openaiApiKey && !showKey && (
            <p className="current-key">Current: {maskedKey}</p>
          )}
        </div>

        <button
          className="save-btn"
          onClick={handleSave}
          disabled={apiKey === config.openaiApiKey}
        >
          {saved ? 'Saved!' : 'Save API Key'}
        </button>

        <div className="api-help">
          <h4>How to get an API key:</h4>
          <ol>
            <li>Go to <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer">platform.openai.com</a></li>
            <li>Sign in or create an account</li>
            <li>Navigate to API Keys section</li>
            <li>Create a new secret key</li>
            <li>Copy and paste it above</li>
          </ol>
        </div>
      </div>

      <div className="settings-section">
        <h3>About</h3>
        <p>
          RecipeKeeper Assesser analyzes your recipes using AI to provide estimated
          nutritional information per serving. The assessments are estimates based on
          typical ingredient quantities and may vary from actual values.
        </p>
        <p className="disclaimer">
          <strong>Disclaimer:</strong> Nutritional information is AI-generated and should
          be used for general guidance only. For precise dietary needs, consult a
          registered dietitian or use verified nutritional databases.
        </p>
      </div>
    </div>
  );
}
