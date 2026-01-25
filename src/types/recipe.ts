export interface Recipe {
  id: string;
  shareId: string;
  isFavourite: boolean;
  rating: number;
  name: string;
  course: string[];
  categories: string[];
  collections: string[];
  source: string;
  yield: string;
  prepTime: string;
  cookTime: string;
  ingredients: string[];
  directions: string;
  notes: string;
  photos: string[];
  imageBlobs: { [key: string]: string }; // base64 encoded images
}

export interface NutritionalAssessment {
  recipeId: string;
  timestamp: number;
  perServing: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  healthScore: number; // 1-10
  healthNotes: string[];
  warnings: string[];
  benefits: string[];
  rawResponse: string;
  // Optional fields for image/URL assessments
  dishName?: string;
  detectedIngredients?: string[];
}

export interface AppConfig {
  openaiApiKey: string;
  systemPrompt?: string;
  dietaryRequirements?: string;
}
