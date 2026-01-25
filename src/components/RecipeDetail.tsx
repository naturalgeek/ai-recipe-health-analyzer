import { useApp } from '../context/AppContext';
import { formatPrepTime } from '../services/recipeParser';
import type { NutritionalAssessment } from '../types/recipe';

export function RecipeDetail() {
  const { selectedRecipe, assessment, isAssessing, assessRecipe, config, error, setError } = useApp();

  if (!selectedRecipe) {
    return (
      <div className="recipe-detail-empty">
        <p>Select a recipe to view details and nutritional assessment</p>
      </div>
    );
  }

  const handleAssess = async () => {
    if (!config.openaiApiKey) {
      setError('Please configure your OpenAI API key in the Settings tab first');
      return;
    }

    try {
      await assessRecipe(selectedRecipe);
    } catch (err) {
      // Error is already handled in context
    }
  };

  const mainImage = selectedRecipe.photos[0]
    ? selectedRecipe.imageBlobs[selectedRecipe.photos[0]]
    : null;

  return (
    <div className="recipe-detail">
      <div className="recipe-header">
        {mainImage && (
          <img src={mainImage} alt={selectedRecipe.name} className="recipe-main-image" />
        )}
        <div className="recipe-header-info">
          <h2>{selectedRecipe.name}</h2>
          {selectedRecipe.categories.length > 0 && (
            <div className="recipe-categories">
              {selectedRecipe.categories.map(cat => (
                <span key={cat} className="category-tag">{cat}</span>
              ))}
            </div>
          )}
          <div className="recipe-meta">
            {selectedRecipe.yield && <span>Servings: {selectedRecipe.yield}</span>}
            {selectedRecipe.prepTime && formatPrepTime(selectedRecipe.prepTime) && (
              <span>Prep: {formatPrepTime(selectedRecipe.prepTime)}</span>
            )}
            {selectedRecipe.cookTime && formatPrepTime(selectedRecipe.cookTime) && (
              <span>Cook: {formatPrepTime(selectedRecipe.cookTime)}</span>
            )}
          </div>
          {selectedRecipe.source && (
            <div className="recipe-source">
              Source: {selectedRecipe.source.startsWith('http') ? (
                <a href={selectedRecipe.source} target="_blank" rel="noopener noreferrer">
                  {selectedRecipe.source}
                </a>
              ) : (
                selectedRecipe.source
              )}
            </div>
          )}
        </div>
      </div>

      <div className="recipe-content">
        <div className="recipe-ingredients">
          <h3>Ingredients</h3>
          <ul>
            {selectedRecipe.ingredients.map((ing, idx) => (
              <li key={idx}>{ing}</li>
            ))}
          </ul>
        </div>

        <div className="recipe-directions">
          <h3>Instructions</h3>
          <div className="directions-text">
            {selectedRecipe.directions.split('\n').map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </div>
        </div>

        {selectedRecipe.notes && (
          <div className="recipe-notes">
            <h3>Notes</h3>
            <p>{selectedRecipe.notes}</p>
          </div>
        )}
      </div>

      <div className="assessment-section">
        <h3>Nutritional Assessment</h3>

        {error && <div className="error-message">{error}</div>}

        {!assessment && !isAssessing && (
          <div className="assess-prompt">
            <p>Get AI-powered nutritional analysis for this recipe.</p>
            <button
              className="assess-btn"
              onClick={handleAssess}
              disabled={!config.openaiApiKey}
            >
              Analyze Nutrition
            </button>
            {!config.openaiApiKey && (
              <p className="config-warning">Configure OpenAI API key in Settings first</p>
            )}
          </div>
        )}

        {isAssessing && (
          <div className="assessing-indicator">
            <div className="spinner"></div>
            <p>Analyzing recipe with GPT-5.2...</p>
          </div>
        )}

        {assessment && <AssessmentDisplay assessment={assessment} />}
      </div>
    </div>
  );
}

function AssessmentDisplay({ assessment }: { assessment: NutritionalAssessment }) {
  const { perServing, healthScore, healthNotes, warnings, benefits } = assessment;

  const getHealthScoreColor = (score: number) => {
    if (score >= 7) return '#4caf50';
    if (score >= 4) return '#ff9800';
    return '#f44336';
  };

  return (
    <div className="assessment-display">
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

      <div className="assessment-timestamp">
        Assessed on {new Date(assessment.timestamp).toLocaleDateString()}
      </div>
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
