import type { Recipe, NutritionalAssessment, AppConfig } from '../types/recipe';

const DB_NAME = 'recipekeeper-assesser';
const DB_VERSION = 1;

let db: IDBDatabase | null = null;

export async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Recipes store
      if (!database.objectStoreNames.contains('recipes')) {
        const recipeStore = database.createObjectStore('recipes', { keyPath: 'id' });
        recipeStore.createIndex('name', 'name', { unique: false });
        recipeStore.createIndex('categories', 'categories', { unique: false, multiEntry: true });
      }

      // Nutritional assessments store
      if (!database.objectStoreNames.contains('assessments')) {
        const assessmentStore = database.createObjectStore('assessments', { keyPath: 'recipeId' });
        assessmentStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Config store
      if (!database.objectStoreNames.contains('config')) {
        database.createObjectStore('config', { keyPath: 'key' });
      }
    };
  });
}

// Recipes
export async function saveRecipes(recipes: Recipe[]): Promise<void> {
  const database = await initDB();
  const transaction = database.transaction('recipes', 'readwrite');
  const store = transaction.objectStore('recipes');

  // Clear existing recipes
  store.clear();

  // Add new recipes
  for (const recipe of recipes) {
    store.put(recipe);
  }

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getAllRecipes(): Promise<Recipe[]> {
  const database = await initDB();
  const transaction = database.transaction('recipes', 'readonly');
  const store = transaction.objectStore('recipes');
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getRecipeById(id: string): Promise<Recipe | undefined> {
  const database = await initDB();
  const transaction = database.transaction('recipes', 'readonly');
  const store = transaction.objectStore('recipes');
  const request = store.get(id);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function searchRecipes(query: string): Promise<Recipe[]> {
  const allRecipes = await getAllRecipes();
  const lowerQuery = query.toLowerCase();

  return allRecipes.filter(recipe =>
    recipe.name.toLowerCase().includes(lowerQuery) ||
    recipe.ingredients.some(i => i.toLowerCase().includes(lowerQuery)) ||
    recipe.categories.some(c => c.toLowerCase().includes(lowerQuery))
  );
}

// Assessments
export async function saveAssessment(assessment: NutritionalAssessment): Promise<void> {
  const database = await initDB();
  const transaction = database.transaction('assessments', 'readwrite');
  const store = transaction.objectStore('assessments');
  store.put(assessment);

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getAssessment(recipeId: string): Promise<NutritionalAssessment | undefined> {
  const database = await initDB();
  const transaction = database.transaction('assessments', 'readonly');
  const store = transaction.objectStore('assessments');
  const request = store.get(recipeId);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Config
export async function saveConfig(config: AppConfig): Promise<void> {
  const database = await initDB();
  const transaction = database.transaction('config', 'readwrite');
  const store = transaction.objectStore('config');
  store.put({ key: 'appConfig', ...config });

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getConfig(): Promise<AppConfig> {
  const database = await initDB();
  const transaction = database.transaction('config', 'readonly');
  const store = transaction.objectStore('config');
  const request = store.get('appConfig');

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const result = request.result;
      resolve({
        openaiApiKey: result?.openaiApiKey || ''
      });
    };
    request.onerror = () => reject(request.error);
  });
}

export async function clearAllData(): Promise<void> {
  const database = await initDB();
  const transaction = database.transaction(['recipes', 'assessments'], 'readwrite');

  transaction.objectStore('recipes').clear();
  transaction.objectStore('assessments').clear();

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}
