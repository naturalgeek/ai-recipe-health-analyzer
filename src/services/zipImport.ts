import JSZip from 'jszip';
import type { Recipe } from '../types/recipe';
import { parseRecipesHtml } from './recipeParser';
import { saveRecipes } from './storage';

export interface ImportProgress {
  stage: 'reading' | 'parsing' | 'images' | 'saving' | 'done';
  current: number;
  total: number;
  message: string;
}

export async function importRecipeKeeperZip(
  file: File,
  onProgress?: (progress: ImportProgress) => void
): Promise<Recipe[]> {
  const report = (stage: ImportProgress['stage'], current: number, total: number, message: string) => {
    onProgress?.({ stage, current, total, message });
  };

  report('reading', 0, 100, 'Reading zip file...');

  const zip = await JSZip.loadAsync(file);

  // Find and parse recipes.html
  const recipesFile = zip.file('recipes.html');
  if (!recipesFile) {
    throw new Error('recipes.html not found in zip file');
  }

  report('parsing', 0, 100, 'Parsing recipes...');
  const recipesHtml = await recipesFile.async('string');
  const parsedRecipes = parseRecipesHtml(recipesHtml);

  report('parsing', 100, 100, `Found ${parsedRecipes.length} recipes`);

  // Load images
  const recipes: Recipe[] = [];
  const imageFiles = Object.keys(zip.files).filter(name => name.startsWith('images/'));

  for (let i = 0; i < parsedRecipes.length; i++) {
    const recipe = parsedRecipes[i];
    const imageBlobs: { [key: string]: string } = {};

    report('images', i, parsedRecipes.length, `Loading images for: ${recipe.name.substring(0, 40)}...`);

    // Load images for this recipe
    for (const photoPath of recipe.photos) {
      if (imageFiles.includes(photoPath)) {
        const imageFile = zip.file(photoPath);
        if (imageFile) {
          try {
            const imageData = await imageFile.async('base64');
            const extension = photoPath.split('.').pop()?.toLowerCase() || 'jpg';
            const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
            imageBlobs[photoPath] = `data:${mimeType};base64,${imageData}`;
          } catch (error) {
            console.warn(`Failed to load image ${photoPath}:`, error);
          }
        }
      }
    }

    recipes.push({
      ...recipe,
      imageBlobs
    });
  }

  report('saving', 0, 100, 'Saving to local database...');
  await saveRecipes(recipes);

  report('done', 100, 100, `Successfully imported ${recipes.length} recipes`);

  return recipes;
}
