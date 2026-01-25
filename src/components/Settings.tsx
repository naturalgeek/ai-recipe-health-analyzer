import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { DEFAULT_SYSTEM_PROMPT } from '../services/openai';

export function Settings() {
  const { config, updateConfig } = useApp();
  const [apiKey, setApiKey] = useState(config.openaiApiKey);
  const [systemPrompt, setSystemPrompt] = useState(config.systemPrompt || '');
  const [dietaryRequirements, setDietaryRequirements] = useState(config.dietaryRequirements || 'I tolerate all foods');
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    setApiKey(config.openaiApiKey);
    setSystemPrompt(config.systemPrompt || '');
    setDietaryRequirements(config.dietaryRequirements || 'I tolerate all foods');
  }, [config.openaiApiKey, config.systemPrompt, config.dietaryRequirements]);

  const handleSave = async () => {
    await updateConfig({
      openaiApiKey: apiKey,
      systemPrompt: systemPrompt,
      dietaryRequirements: dietaryRequirements
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const hasChanges = apiKey !== config.openaiApiKey ||
    systemPrompt !== (config.systemPrompt || '') ||
    dietaryRequirements !== (config.dietaryRequirements || 'I tolerate all foods');

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

        <div className="dietary-input">
          <label htmlFor="dietaryRequirements">Dietary Requirements</label>
          <textarea
            id="dietaryRequirements"
            value={dietaryRequirements}
            onChange={(e) => setDietaryRequirements(e.target.value)}
            placeholder="e.g., I am lactose intolerant, allergic to nuts..."
            className="dietary-field"
            rows={2}
          />
          <p className="settings-hint">
            Describe any allergies, intolerances, or dietary preferences. This will be included in the nutritional analysis.
          </p>
        </div>

        <div className="system-prompt-input">
          <label htmlFor="systemPrompt">Custom System Prompt (Advanced)</label>
          <textarea
            id="systemPrompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder={DEFAULT_SYSTEM_PROMPT}
            className="system-prompt-field"
            rows={4}
          />
          <p className="settings-hint">
            Leave empty to use the default prompt. This defines how the AI analyzes recipes.
          </p>
        </div>

        <button
          className="save-btn"
          onClick={handleSave}
          disabled={!hasChanges}
        >
          {saved ? 'Saved!' : 'Save Settings'}
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
