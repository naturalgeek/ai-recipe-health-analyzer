import type { Recipe } from '../types/recipe';

export function parseRecipesHtml(html: string): Omit<Recipe, 'imageBlobs'>[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const recipeElements = doc.querySelectorAll('.recipe-details');

  const recipes: Omit<Recipe, 'imageBlobs'>[] = [];

  recipeElements.forEach((el) => {
    const recipe = parseRecipeElement(el);
    if (recipe) {
      recipes.push(recipe);
    }
  });

  return recipes;
}

function parseRecipeElement(el: Element): Omit<Recipe, 'imageBlobs'> | null {
  try {
    const id = el.querySelector('meta[itemprop="recipeId"]')?.getAttribute('content') || '';
    const shareId = el.querySelector('meta[itemprop="recipeShareId"]')?.getAttribute('content') || '';
    const isFavourite = el.querySelector('meta[itemprop="recipeIsFavourite"]')?.getAttribute('content') === 'True';
    const rating = parseInt(el.querySelector('meta[itemprop="recipeRating"]')?.getAttribute('content') || '0', 10);
    const name = el.querySelector('h2[itemprop="name"]')?.textContent?.trim() || '';

    // Parse course - handle both span and meta elements
    const courseSpan = el.querySelector('span[itemprop="recipeCourse"]');
    const courseMetas = el.querySelectorAll('meta[itemprop="recipeCourse"]');
    const course: string[] = [];
    if (courseSpan?.textContent?.trim()) {
      course.push(courseSpan.textContent.trim());
    }
    courseMetas.forEach(meta => {
      const content = meta.getAttribute('content');
      if (content) course.push(content);
    });

    // Parse categories
    const categoryMetas = el.querySelectorAll('meta[itemprop="recipeCategory"]');
    const categories: string[] = [];
    categoryMetas.forEach(meta => {
      const content = meta.getAttribute('content');
      if (content) categories.push(content);
    });

    // Parse collections
    const collectionMetas = el.querySelectorAll('meta[itemprop="recipeCollection"]');
    const collections: string[] = [];
    collectionMetas.forEach(meta => {
      const content = meta.getAttribute('content');
      if (content) collections.push(content);
    });

    const source = el.querySelector('span[itemprop="recipeSource"]')?.textContent?.trim() || '';
    const recipeYield = el.querySelector('span[itemprop="recipeYield"]')?.textContent?.trim() || '';
    const prepTime = el.querySelector('meta[itemprop="prepTime"]')?.getAttribute('content') || '';
    const cookTime = el.querySelector('meta[itemprop="cookTime"]')?.getAttribute('content') || '';

    // Parse ingredients
    const ingredientsDiv = el.querySelector('.recipe-ingredients');
    const ingredients: string[] = [];
    if (ingredientsDiv) {
      ingredientsDiv.querySelectorAll('p').forEach(p => {
        const text = p.textContent?.trim();
        if (text) ingredients.push(text);
      });
    }

    // Parse directions
    const directionsDiv = el.querySelector('div[itemprop="recipeDirections"]');
    const directions = directionsDiv?.textContent?.trim() || '';

    // Parse notes
    const notesDiv = el.querySelector('.recipe-notes');
    const notes = notesDiv?.textContent?.trim() || '';

    // Parse photos
    const photos: string[] = [];
    el.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src');
      if (src) photos.push(src);
    });

    return {
      id,
      shareId,
      isFavourite,
      rating,
      name,
      course,
      categories,
      collections,
      source,
      yield: recipeYield,
      prepTime,
      cookTime,
      ingredients,
      directions,
      notes,
      photos: [...new Set(photos)] // Remove duplicates
    };
  } catch (error) {
    console.error('Error parsing recipe element:', error);
    return null;
  }
}

export function formatPrepTime(iso: string): string {
  if (!iso || iso === 'PT0S') return '';
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return iso;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.join(' ') || '';
}
