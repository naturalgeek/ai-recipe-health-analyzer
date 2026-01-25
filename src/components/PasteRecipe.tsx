import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { assessRecipeNutrition, assessImageNutrition, extractRecipeFromHtml } from '../services/openai';
import type { Recipe, NutritionalAssessment } from '../types/recipe';

async function fetchHtmlFromUrl(url: string): Promise<string> {
  // List of CORS proxies to try
  const proxies = [
    (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
    (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
  ];

  // Try direct fetch first
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (response.ok) {
      return await response.text();
    }
  } catch {
    // CORS error expected, continue with proxies
  }

  // Try each proxy
  for (const getProxyUrl of proxies) {
    try {
      const proxyUrl = getProxyUrl(url);
      const response = await fetch(proxyUrl);
      if (response.ok) {
        const html = await response.text();
        if (html.length > 100) {
          return html;
        }
      }
    } catch {
      // Try next proxy
    }
  }

  throw new Error('Could not fetch the webpage. Please copy and paste the recipe text instead.');
}

function detectPortions(text: string): string | null {
  const patterns = [
    /(?:serves?|servings?|portions?|yields?)\s*[:\-]?\s*(\d+(?:\s*-\s*\d+)?)/i,
    /(\d+)\s*(?:serves?|servings?|portions?)/i,
    /makes?\s*(\d+(?:\s*-\s*\d+)?)\s*(?:servings?|portions?)?/i,
    /for\s*(\d+)\s*(?:people|persons?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

function parseRecipeText(text: string, portions: string): Recipe {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Try to extract a name from the first non-empty line
  const name = lines[0] || 'Pasted Recipe';

  return {
    id: `pasted-${Date.now()}`,
    shareId: '',
    isFavourite: false,
    rating: 0,
    name,
    course: [],
    categories: [],
    collections: [],
    source: 'Pasted',
    yield: portions,
    prepTime: '',
    cookTime: '',
    ingredients: [],
    directions: text,
    notes: '',
    photos: [],
    imageBlobs: {}
  };
}

export function PasteRecipe() {
  const { config, setError } = useApp();
  const [recipeText, setRecipeText] = useState('');
  const [recipeUrl, setRecipeUrl] = useState('');
  const [portions, setPortions] = useState('');
  const [showPortionsInput, setShowPortionsInput] = useState(false);
  const [isAssessing, setIsAssessing] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [assessment, setAssessment] = useState<NutritionalAssessment | null>(null);
  const [recipeImage, setRecipeImage] = useState<string | null>(null);

  const handleFetchUrl = async () => {
    if (!recipeUrl.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!config.openaiApiKey) {
      setError('Please configure your OpenAI API key in Settings first');
      return;
    }

    setIsFetching(true);
    setError(null);

    try {
      // Fetch the HTML from the URL
      const html = await fetchHtmlFromUrl(recipeUrl);
      // Use AI to extract the recipe
      const recipeText = await extractRecipeFromHtml(html, recipeUrl, config.openaiApiKey);
      handleTextChange(recipeText);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recipe');
    } finally {
      setIsFetching(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRecipeImage(reader.result as string);
      setAssessment(null);
      setShowPortionsInput(true); // Always ask for portions with images
      if (!portions) setPortions('1');
    };
    reader.readAsDataURL(file);
  };

  const handleTextChange = (text: string) => {
    setRecipeText(text);
    setAssessment(null);

    const detected = detectPortions(text);
    if (detected) {
      setPortions(detected);
      setShowPortionsInput(false);
    } else {
      setShowPortionsInput(text.length > 50);
      if (!portions) setPortions('');
    }
  };

  const handleAssess = async () => {
    const hasText = recipeText.trim().length > 0;
    const hasImage = recipeImage !== null;

    if (!hasText && !hasImage) {
      setError('Please paste a recipe, enter a URL, or upload an image');
      return;
    }

    if (!portions.trim()) {
      setShowPortionsInput(true);
      setError('Please specify the number of portions');
      return;
    }

    if (!config.openaiApiKey) {
      setError('Please configure your OpenAI API key in Settings first');
      return;
    }

    setIsAssessing(true);
    setError(null);

    try {
      let result: NutritionalAssessment;

      if (hasImage) {
        result = await assessImageNutrition(recipeImage, portions, config.openaiApiKey);
      } else {
        const recipe = parseRecipeText(recipeText, portions);
        result = await assessRecipeNutrition(recipe, config.openaiApiKey);
      }

      setAssessment(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assessment failed');
    } finally {
      setIsAssessing(false);
    }
  };

  const handleClear = () => {
    setRecipeText('');
    setRecipeUrl('');
    setPortions('');
    setShowPortionsInput(false);
    setAssessment(null);
    setRecipeImage(null);
    setError(null);
  };

  const handleRemoveImage = () => {
    setRecipeImage(null);
  };

  return (
    <div className="paste-recipe">
      <div className="paste-recipe-input">
        <h3>Quick Recipe Assessment</h3>
        <p className="paste-description">
          Paste recipe text, enter a URL, or upload a photo to get instant nutritional analysis.
        </p>

        <div className="url-input-section">
          <label htmlFor="recipeUrl">Recipe URL:</label>
          <div className="url-input-group">
            <input
              id="recipeUrl"
              type="url"
              className="url-field"
              placeholder="https://example.com/recipe..."
              value={recipeUrl}
              onChange={(e) => setRecipeUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFetchUrl()}
            />
            <button
              className="fetch-btn"
              onClick={handleFetchUrl}
              disabled={isFetching || !recipeUrl.trim() || !config.openaiApiKey}
            >
              {isFetching ? 'Extracting...' : 'Fetch'}
            </button>
          </div>
        </div>

        <div className="input-divider">
          <span>or paste text</span>
        </div>

        <textarea
          className="recipe-textarea"
          placeholder="Paste your recipe here (ingredients, instructions, etc.)..."
          value={recipeText}
          onChange={(e) => handleTextChange(e.target.value)}
          rows={10}
        />

        <div className="input-divider">
          <span>or upload a photo</span>
        </div>

        <div className="image-upload-section">
          {!recipeImage ? (
            <label className="image-upload-zone">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <span className="upload-icon">📷</span>
              <span>Click to upload a recipe or dish photo</span>
            </label>
          ) : (
            <div className="image-preview">
              <img src={recipeImage} alt="Recipe" />
              <button className="remove-image-btn" onClick={handleRemoveImage}>
                Remove
              </button>
            </div>
          )}
        </div>

        {showPortionsInput && (
          <div className="portions-input">
            <label htmlFor="portions">Number of portions/servings:</label>
            <input
              id="portions"
              type="text"
              className="portions-field"
              placeholder="e.g., 4"
              value={portions}
              onChange={(e) => setPortions(e.target.value)}
            />
          </div>
        )}

        {portions && !showPortionsInput && (
          <div className="detected-portions">
            Detected portions: <strong>{portions}</strong>
            <button
              className="edit-portions-btn"
              onClick={() => setShowPortionsInput(true)}
            >
              Edit
            </button>
          </div>
        )}

        <div className="paste-actions">
          <button
            className="assess-btn"
            onClick={handleAssess}
            disabled={isAssessing || (!recipeText.trim() && !recipeImage) || !config.openaiApiKey}
          >
            {isAssessing ? 'Analyzing...' : 'Analyze Nutrition'}
          </button>

          {recipeText && (
            <button className="clear-paste-btn" onClick={handleClear}>
              Clear
            </button>
          )}
        </div>

        {!config.openaiApiKey && (
          <p className="config-warning">Configure OpenAI API key in Settings first</p>
        )}
      </div>

      {isAssessing && (
        <div className="assessing-indicator">
          <div className="spinner"></div>
          <p>Analyzing recipe...</p>
        </div>
      )}

      {assessment && <PasteAssessmentDisplay assessment={assessment} />}
    </div>
  );
}

function PasteAssessmentDisplay({ assessment }: { assessment: NutritionalAssessment }) {
  const { perServing, healthScore, healthNotes, warnings, benefits } = assessment;

  const getHealthScoreColor = (score: number) => {
    if (score >= 7) return '#4caf50';
    if (score >= 4) return '#ff9800';
    return '#f44336';
  };

  return (
    <div className="assessment-display paste-assessment">
      <h3>Nutritional Assessment</h3>

      <div className="health-score">
        <div
          className="score-circle"
          style={{ borderColor: getHealthScoreColor(healthScore) }}
        >
          <span className="score-value">{healthScore}</span>
          <span className="score-label">/10</span>
        </div>
        <span className="score-text">Health Score</span>
      </div>

      <div className="nutrition-grid">
        <NutrientCard label="Calories" value={perServing.calories} unit="kcal" />
        <NutrientCard label="Protein" value={perServing.protein} unit="g" />
        <NutrientCard label="Carbs" value={perServing.carbohydrates} unit="g" />
        <NutrientCard label="Fat" value={perServing.fat} unit="g" />
        <NutrientCard label="Fiber" value={perServing.fiber} unit="g" />
        <NutrientCard label="Sugar" value={perServing.sugar} unit="g" />
        <NutrientCard label="Sodium" value={perServing.sodium} unit="mg" />
      </div>

      {benefits.length > 0 && (
        <div className="assessment-list benefits">
          <h4>Health Benefits</h4>
          <ul>
            {benefits.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="assessment-list warnings">
          <h4>Things to Consider</h4>
          <ul>
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {healthNotes.length > 0 && (
        <div className="assessment-list notes">
          <h4>Notes</h4>
          <ul>
            {healthNotes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function NutrientCard({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="nutrient-card">
      <span className="nutrient-value">{Math.round(value)}</span>
      <span className="nutrient-unit">{unit}</span>
      <span className="nutrient-label">{label}</span>
    </div>
  );
}
