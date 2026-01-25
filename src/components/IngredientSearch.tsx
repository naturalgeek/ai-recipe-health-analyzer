import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';

interface ParsedIngredient {
  original: string;
  name: string;
  recipeCount: number;
  recipeIds: string[];
}

function parseIngredientName(ingredient: string): string {
  // Remove quantities, units, and parentheticals to extract the main ingredient
  let name = ingredient.toLowerCase();

  // Remove parenthetical content
  name = name.replace(/\([^)]*\)/g, '');

  // Remove common quantity patterns
  name = name.replace(/^\d+[\d\/\.,]*\s*/g, ''); // Leading numbers
  name = name.replace(/^[\u00BC-\u00BE\u2150-\u215E]+\s*/g, ''); // Unicode fractions

  // Remove common units
  const units = [
    'tbsp', 'tsp', 'cup', 'cups', 'oz', 'lb', 'lbs', 'kg', 'g', 'ml', 'l',
    'tablespoon', 'tablespoons', 'teaspoon', 'teaspoons', 'ounce', 'ounces',
    'pound', 'pounds', 'gram', 'grams', 'kilogram', 'kilograms',
    'liter', 'liters', 'milliliter', 'milliliters',
    'piece', 'pieces', 'slice', 'slices', 'clove', 'cloves',
    'bunch', 'bunches', 'head', 'heads', 'stalk', 'stalks',
    'can', 'cans', 'jar', 'jars', 'package', 'packages', 'pkg',
    'pinch', 'dash', 'handful', 'handfuls',
    'small', 'medium', 'large', 'extra-large',
    // German units
    'el', 'tl', 'esslöffel', 'teelöffel', 'prise', 'bund', 'stück', 'stk',
    'scheibe', 'scheiben', 'zehe', 'zehen', 'dose', 'dosen', 'glas', 'päckchen'
  ];

  const unitPattern = new RegExp(`^(${units.join('|')})\\.?\\s+`, 'i');
  name = name.replace(unitPattern, '');

  // Remove leading "of" if present
  name = name.replace(/^of\s+/i, '');

  // Clean up extra whitespace
  name = name.replace(/\s+/g, ' ').trim();

  // Remove trailing commas and prep instructions
  name = name.replace(/,.*$/, '').trim();

  return name;
}

export function IngredientSearch() {
  const { recipes, selectRecipe } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIngredient, setSelectedIngredient] = useState<string | null>(null);

  // Extract and normalize all ingredients
  const ingredientIndex = useMemo(() => {
    const index = new Map<string, ParsedIngredient>();

    recipes.forEach(recipe => {
      recipe.ingredients.forEach(ing => {
        const parsed = parseIngredientName(ing);
        if (parsed.length < 2) return; // Skip very short strings

        const existing = index.get(parsed);
        if (existing) {
          if (!existing.recipeIds.includes(recipe.id)) {
            existing.recipeCount++;
            existing.recipeIds.push(recipe.id);
          }
        } else {
          index.set(parsed, {
            original: ing,
            name: parsed,
            recipeCount: 1,
            recipeIds: [recipe.id]
          });
        }
      });
    });

    return Array.from(index.values())
      .filter(i => i.name.length >= 2)
      .sort((a, b) => b.recipeCount - a.recipeCount);
  }, [recipes]);

  // Filter ingredients based on search
  const filteredIngredients = useMemo(() => {
    if (!searchQuery) {
      return ingredientIndex.slice(0, 50); // Show top 50 by default
    }

    const query = searchQuery.toLowerCase();
    return ingredientIndex
      .filter(ing => ing.name.includes(query))
      .slice(0, 100);
  }, [ingredientIndex, searchQuery]);

  // Get recipes for selected ingredient
  const matchingRecipes = useMemo(() => {
    if (!selectedIngredient) return [];

    const ingredient = ingredientIndex.find(i => i.name === selectedIngredient);
    if (!ingredient) return [];

    return recipes.filter(r => ingredient.recipeIds.includes(r.id));
  }, [selectedIngredient, ingredientIndex, recipes]);

  if (recipes.length === 0) {
    return null;
  }

  return (
    <div className="ingredient-search">
      <h3>Ingredients</h3>
      <input
        type="text"
        placeholder="Search ingredients..."
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setSelectedIngredient(null);
        }}
        className="search-input"
      />

      {selectedIngredient ? (
        <div className="ingredient-recipes">
          <button
            className="back-btn"
            onClick={() => setSelectedIngredient(null)}
          >
            ← Back to ingredients
          </button>
          <div className="selected-ingredient-header">
            <span className="ingredient-name">{selectedIngredient}</span>
            <span className="recipe-count">{matchingRecipes.length} recipes</span>
          </div>
          <div className="ingredient-recipe-list">
            {matchingRecipes.map(recipe => (
              <div
                key={recipe.id}
                className="ingredient-recipe-item"
                onClick={() => selectRecipe(recipe)}
              >
                {recipe.name}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="ingredient-list">
          {filteredIngredients.map(ing => (
            <div
              key={ing.name}
              className="ingredient-item"
              onClick={() => setSelectedIngredient(ing.name)}
            >
              <span className="ingredient-name">{ing.name}</span>
              <span className="ingredient-count">{ing.recipeCount}</span>
            </div>
          ))}
          {filteredIngredients.length === 0 && searchQuery && (
            <div className="no-results">No ingredients found</div>
          )}
        </div>
      )}

      <div className="ingredient-stats">
        {ingredientIndex.length} unique ingredients
      </div>
    </div>
  );
}
