import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { DEFAULT_SYSTEM_PROMPT } from '../services/openai';

export function Settings() {
  const { config, updateConfig } = useApp();
  const [apiKey, setApiKey] = useState(config.openaiApiKey);
  const [systemPrompt, setSystemPrompt] = useState(config.systemPrompt || DEFAULT_SYSTEM_PROMPT);
  const [dietaryRequirements, setDietaryRequirements] = useState(config.dietaryRequirements || 'I tolerate all foods');
  const [knusprEmail, setKnusprEmail] = useState(config.knusprEmail);
  const [knusprPassword, setKnusprPassword] = useState(config.knusprPassword);
  const [saved, setSaved] = useState(false);
  const [knusprSaved, setKnusprSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [showKnusprPassword, setShowKnusprPassword] = useState(false);

  useEffect(() => {
    setApiKey(config.openaiApiKey);
    setSystemPrompt(config.systemPrompt || DEFAULT_SYSTEM_PROMPT);
    setDietaryRequirements(config.dietaryRequirements || 'I tolerate all foods');
  }, [config.openaiApiKey, config.systemPrompt, config.dietaryRequirements]);

  useEffect(() => {
    setKnusprEmail(config.knusprEmail);
    setKnusprPassword(config.knusprPassword);
  }, [config.knusprEmail, config.knusprPassword]);

  const handleSave = async () => {
    await updateConfig({
      ...config,
      openaiApiKey: apiKey,
      systemPrompt: systemPrompt,
      dietaryRequirements: dietaryRequirements
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleKnusprSave = async () => {
    await updateConfig({ ...config, knusprEmail, knusprPassword });
    setKnusprSaved(true);
    setTimeout(() => setKnusprSaved(false), 2000);
  };

  const knusprChanged = knusprEmail !== config.knusprEmail || knusprPassword !== config.knusprPassword;

  const hasChanges = apiKey !== config.openaiApiKey ||
    systemPrompt !== (config.systemPrompt || DEFAULT_SYSTEM_PROMPT) ||
    dietaryRequirements !== (config.dietaryRequirements || 'I tolerate all foods');

  const isSystemPromptDefault = systemPrompt === DEFAULT_SYSTEM_PROMPT;

  const handleResetSystemPrompt = () => {
    setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
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

        <div className="dietary-input">
          <label htmlFor="dietaryRequirements">Personal Dietary Requirements</label>
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
          <div className="system-prompt-header">
            <label htmlFor="systemPrompt">System Prompt (Advanced)</label>
            {!isSystemPromptDefault && (
              <button
                type="button"
                className="reset-btn"
                onClick={handleResetSystemPrompt}
              >
                Reset to Default
              </button>
            )}
          </div>
          <textarea
            id="systemPrompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="system-prompt-field"
            rows={5}
          />
          <p className="settings-hint">
            This defines how the AI analyzes recipes. Edit to customize the analysis behavior.
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
        <h3>Knuspr Grocery Ordering</h3>
        <p className="settings-description">
          Enter your Knuspr account credentials to enable adding recipe ingredients
          to your Knuspr shopping cart. Credentials are stored locally in your browser.
        </p>

        <div className="api-key-input">
          <label htmlFor="knusprEmail">Email</label>
          <div className="input-group">
            <input
              id="knusprEmail"
              type="email"
              value={knusprEmail}
              onChange={(e) => setKnusprEmail(e.target.value)}
              placeholder="your@email.com"
              className="api-key-field"
            />
          </div>
        </div>

        <div className="api-key-input">
          <label htmlFor="knusprPassword">Password</label>
          <div className="input-group">
            <input
              id="knusprPassword"
              type={showKnusprPassword ? 'text' : 'password'}
              value={knusprPassword}
              onChange={(e) => setKnusprPassword(e.target.value)}
              placeholder="Password"
              className="api-key-field"
            />
            <button
              className="toggle-visibility"
              onClick={() => setShowKnusprPassword(!showKnusprPassword)}
              type="button"
            >
              {showKnusprPassword ? '\u{1F648}' : '\u{1F441}\u{FE0F}'}
            </button>
          </div>
        </div>

        <button
          className="save-btn"
          onClick={handleKnusprSave}
          disabled={!knusprChanged}
        >
          {knusprSaved ? 'Saved!' : 'Save Knuspr Credentials'}
        </button>
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
