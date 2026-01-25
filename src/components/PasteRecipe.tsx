import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { assessRecipeNutrition, assessImageNutrition, extractRecipeFromUrl } from '../services/openai';
import type { Recipe, NutritionalAssessment } from '../types/recipe';

interface ParsedRecipe {
  name: string;
  servings: string | null;
  prepTime: string | null;
  cookTime: string | null;
  ingredients: string[];
  instructions: string[];
}

// Remove markdown citations like ([site.com](https://...)) or [site.com](https://...)
function stripCitations(text: string): string {
  return text
    // Remove citations in parentheses: ([text](url))
    .replace(/\s*\(\[.*?\]\(https?:\/\/[^)]+\)\)/g, '')
    // Remove standalone markdown links: [text](url)
    .replace(/\s*\[([^\]]*)\]\(https?:\/\/[^)]+\)/g, '')
    // Clean up extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
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

function parseRecipeFromText(text: string): ParsedRecipe {
  const lines = text.split('\n').map(l => stripCitations(l.trim())).filter(Boolean);

  let name = 'Recipe';
  let servings: string | null = null;
  let prepTime: string | null = null;
  let cookTime: string | null = null;
  const ingredients: string[] = [];
  const instructions: string[] = [];

  let section: 'unknown' | 'ingredients' | 'instructions' = 'unknown';

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // Detect recipe name (usually first line or after "Recipe name:")
    if (lowerLine.startsWith('recipe name:') || lowerLine.startsWith('recipe:')) {
      name = line.replace(/^recipe\s*name?:?\s*/i, '').trim();
      continue;
    }

    // Detect servings
    if (lowerLine.includes('serving') || lowerLine.includes('portion') || lowerLine.includes('yield')) {
      const match = line.match(/(\d+(?:\s*-\s*\d+)?)/);
      if (match) servings = match[1];
      continue;
    }

    // Detect prep time
    if (lowerLine.includes('prep time')) {
      prepTime = line.replace(/^prep\s*time:?\s*/i, '').trim();
      continue;
    }

    // Detect cook time
    if (lowerLine.includes('cook time')) {
      cookTime = line.replace(/^cook\s*time:?\s*/i, '').trim();
      continue;
    }

    // Detect section headers
    if (lowerLine.includes('ingredient')) {
      section = 'ingredients';
      continue;
    }
    if (lowerLine.includes('instruction') || lowerLine.includes('direction') || lowerLine.includes('step')) {
      section = 'instructions';
      continue;
    }

    // If we haven't found a name yet and this looks like a title
    if (name === 'Recipe' && lines.indexOf(line) === 0 && !line.match(/^\d/) && line.length < 100) {
      name = line.replace(/\[.*?\]/g, '').trim();
      continue;
    }

    // Add to appropriate section
    if (section === 'ingredients' && line.length > 0) {
      // Clean up ingredient line
      const cleaned = line.replace(/^[-•*]\s*/, '').trim();
      if (cleaned) ingredients.push(cleaned);
    } else if (section === 'instructions' && line.length > 0) {
      // Clean up instruction line
      const cleaned = line.replace(/^\d+[.)]\s*/, '').trim();
      if (cleaned) instructions.push(cleaned);
    }
  }

  return { name, servings, prepTime, cookTime, ingredients, instructions };
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
  const [isAssessing, setIsAssessing] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [assessment, setAssessment] = useState<NutritionalAssessment | null>(null);
  const [recipeImage, setRecipeImage] = useState<string | null>(null);
  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipe | null>(null);

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
      // Use GPT-5.2 Responses API with web_search to extract recipe from URL
      const extractedText = await extractRecipeFromUrl(recipeUrl, config.openaiApiKey);
      // Parse the recipe for nice display
      const parsed = parseRecipeFromText(extractedText);
      setParsedRecipe(parsed);
      handleTextChange(extractedText, true);
      if (parsed.servings) {
        setPortions(parsed.servings);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract recipe');
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
      if (!portions) setPortions('1');
    };
    reader.readAsDataURL(file);
  };

  const handleTextChange = (text: string, keepParsed = false) => {
    setRecipeText(text);
    setAssessment(null);
    if (!keepParsed) {
      setParsedRecipe(null);
    }

    const detected = detectPortions(text);
    if (detected) {
      setPortions(detected);
    } else if (!portions) {
      setPortions('');
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
      setError('Please specify the number of servings');
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
    setAssessment(null);
    setRecipeImage(null);
    setParsedRecipe(null);
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

        {!parsedRecipe ? (
          <input
            type="text"
            className="recipe-text-input"
            placeholder="Paste your recipe here..."
            value={recipeText}
            onChange={(e) => handleTextChange(e.target.value)}
          />
        ) : (
          <ParsedRecipeDisplay recipe={parsedRecipe} onEdit={() => setParsedRecipe(null)} />
        )}

        <div className="input-divider">
          <span>or upload a photo</span>
        </div>

        <div className="image-upload-section compact">
          {!recipeImage ? (
            <label className="image-upload-zone compact">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <span className="upload-icon">📷</span>
              <span>Upload photo</span>
            </label>
          ) : (
            <div className="image-preview compact">
              <img src={recipeImage} alt="Recipe" />
              <button className="remove-image-btn" onClick={handleRemoveImage}>
                Remove
              </button>
            </div>
          )}
        </div>

        <div className="action-row">
          <div className="portions-input-inline">
            <label htmlFor="portions">Servings:</label>
            <input
              id="portions"
              type="text"
              className="portions-field"
              placeholder="e.g., 4"
              value={portions}
              onChange={(e) => setPortions(e.target.value)}
            />
          </div>

          <button
            className="assess-btn"
            onClick={handleAssess}
            disabled={isAssessing || (!recipeText.trim() && !recipeImage) || !config.openaiApiKey}
          >
            {isAssessing ? 'Analyzing...' : 'Analyze Nutrition'}
          </button>
        </div>

        {(recipeText || recipeImage) && (
          <button className="clear-paste-btn" onClick={handleClear}>
            Clear
          </button>
        )}

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
  const { perServing, healthScore, healthNotes, warnings, benefits, dishName, detectedIngredients } = assessment;

  const getHealthScoreColor = (score: number) => {
    if (score >= 7) return '#4caf50';
    if (score >= 4) return '#ff9800';
    return '#f44336';
  };

  return (
    <div className="assessment-display paste-assessment">
      <h3>Nutritional Assessment</h3>

      {dishName && (
        <div className="detected-dish">
          <h4>{dishName}</h4>
        </div>
      )}

      {detectedIngredients && detectedIngredients.length > 0 && (
        <div className="detected-ingredients">
          <h5>Detected Ingredients</h5>
          <ul>
            {detectedIngredients.map((ing, i) => (
              <li key={i}>{ing}</li>
            ))}
          </ul>
        </div>
      )}

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

function ParsedRecipeDisplay({ recipe, onEdit }: { recipe: ParsedRecipe; onEdit: () => void }) {
  return (
    <div className="parsed-recipe">
      <div className="parsed-recipe-header">
        <h4>{recipe.name}</h4>
        <button className="edit-recipe-btn" onClick={onEdit}>Edit</button>
      </div>

      <div className="parsed-recipe-meta">
        {recipe.servings && <span>Servings: {recipe.servings}</span>}
        {recipe.prepTime && <span>Prep: {recipe.prepTime}</span>}
        {recipe.cookTime && <span>Cook: {recipe.cookTime}</span>}
      </div>

      {recipe.ingredients.length > 0 && (
        <div className="parsed-recipe-ingredients">
          <h5>Ingredients</h5>
          <ul>
            {recipe.ingredients.map((ing, i) => (
              <li key={i}>{ing}</li>
            ))}
          </ul>
        </div>
      )}

      {recipe.instructions.length > 0 && (
        <div className="parsed-recipe-instructions">
          <h5>Instructions</h5>
          <ol>
            {recipe.instructions.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
