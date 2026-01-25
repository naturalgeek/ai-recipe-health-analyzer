import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { Recipe } from '../types/recipe';

export function RecipeList() {
  const { recipes, selectedRecipe, selectRecipe } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  // Get all unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    recipes.forEach(r => r.categories.forEach(c => cats.add(c)));
    return Array.from(cats).sort();
  }, [recipes]);

  // Filter recipes
  const filteredRecipes = useMemo(() => {
    let result = recipes;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.name.toLowerCase().includes(query) ||
        r.ingredients.some(i => i.toLowerCase().includes(query))
      );
    }

    if (categoryFilter) {
      result = result.filter(r => r.categories.includes(categoryFilter));
    }

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [recipes, searchQuery, categoryFilter]);

  if (recipes.length === 0) {
    return (
      <div className="recipe-list-empty">
        <p>No recipes loaded. Upload a RecipeKeeper export to get started.</p>
      </div>
    );
  }

  return (
    <div className="recipe-list-container">
      <div className="search-filters">
        <input
          type="text"
          placeholder="Search recipes or ingredients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="category-select"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="recipe-count">
        {filteredRecipes.length} of {recipes.length} recipes
      </div>

      <div className="recipe-list">
        {filteredRecipes.map(recipe => (
          <RecipeListItem
            key={recipe.id}
            recipe={recipe}
            isSelected={selectedRecipe?.id === recipe.id}
            onSelect={() => selectRecipe(recipe)}
          />
        ))}
      </div>
    </div>
  );
}

interface RecipeListItemProps {
  recipe: Recipe;
  isSelected: boolean;
  onSelect: () => void;
}

function RecipeListItem({ recipe, isSelected, onSelect }: RecipeListItemProps) {
  const thumbnailSrc = recipe.photos[0] ? recipe.imageBlobs[recipe.photos[0]] : null;

  return (
    <div
      className={`recipe-list-item ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="recipe-thumbnail">
        {thumbnailSrc ? (
          <img src={thumbnailSrc} alt={recipe.name} />
        ) : (
          <div className="no-image">🍽️</div>
        )}
      </div>
      <div className="recipe-info">
        <h4 className="recipe-name">{recipe.name}</h4>
        {recipe.categories.length > 0 && (
          <div className="recipe-categories">
            {recipe.categories.slice(0, 3).map(cat => (
              <span key={cat} className="category-tag">{cat}</span>
            ))}
          </div>
        )}
        {recipe.rating > 0 && (
          <div className="recipe-rating">
            {'★'.repeat(recipe.rating)}{'☆'.repeat(5 - recipe.rating)}
          </div>
        )}
      </div>
    </div>
  );
}
