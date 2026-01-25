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
          <h4>How to get an OpenAI API key:</h4>

          <div className="tutorial-section">
            <h5>Step 1: Create an OpenAI Account</h5>
            <ol>
              <li>Go to <a href="https://platform.openai.com/signup" target="_blank" rel="noopener noreferrer">platform.openai.com/signup</a></li>
              <li>Sign up with your email, Google, Microsoft, or Apple account</li>
              <li>Verify your email address if required</li>
            </ol>
          </div>

          <div className="tutorial-section">
            <h5>Step 2: Add Payment Method (Required)</h5>
            <ol>
              <li>Go to <a href="https://platform.openai.com/account/billing" target="_blank" rel="noopener noreferrer">Billing settings</a></li>
              <li>Click "Add payment method"</li>
              <li>Enter your credit card details</li>
              <li>Optionally set a usage limit to control costs</li>
            </ol>
            <p className="tutorial-note">
              API usage is pay-as-you-go. Analyzing a recipe typically costs less than $0.01.
              You can set a monthly budget limit to avoid unexpected charges.
            </p>
          </div>

          <div className="tutorial-section">
            <h5>Step 3: Generate Your API Key</h5>
            <ol>
              <li>Go to <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">API Keys page</a></li>
              <li>Click "Create new secret key"</li>
              <li>Give it a name (e.g., "Recipe Assesser")</li>
              <li>Click "Create secret key"</li>
              <li><strong>Important:</strong> Copy the key immediately - you won't be able to see it again!</li>
              <li>Paste the key in the field above</li>
            </ol>
          </div>

          <div className="tutorial-section">
            <h5>Security Tips</h5>
            <ul>
              <li>Never share your API key with anyone</li>
              <li>Your key is stored only in your browser's local storage</li>
              <li>If you suspect your key is compromised, delete it and create a new one</li>
            </ul>
          </div>
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
