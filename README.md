# RecipeKeeper Assesser

**Live App:** https://naturalgeek.github.io/ai-recipe-health-analyzer/

A client-side web application that provides AI-powered nutritional assessment for your recipes. Import recipes from RecipeKeeper or paste any recipe text to get instant nutritional analysis.

## Features

- **Import RecipeKeeper exports** - Upload your RecipeKeeper .zip backup file to import all recipes with images
- **Quick Recipe Assessment** - Paste any recipe text for instant nutritional analysis
- **AI-Powered Analysis** - Get detailed nutritional information per serving using OpenAI's GPT
- **Health Score** - Each recipe receives a 1-10 health score with benefits and warnings
- **Ingredient Search** - Browse recipes by ingredient
- **Offline Storage** - All data stored locally in your browser (IndexedDB)
- **Privacy First** - Your recipes and API key never leave your browser except for OpenAI API calls

## How to Use

### 1. Set Up Your OpenAI API Key

1. Go to the **Settings** tab
2. Follow the tutorial to create an OpenAI account and generate an API key
3. Paste your API key and click **Save**

Your key is stored only in your browser's local storage.

### 2. Import Recipes from RecipeKeeper

1. Export your recipes from RecipeKeeper app (creates a .zip file)
2. Go to the **Recipes** tab
3. Drag and drop the .zip file or click to browse
4. Your recipes will be imported with images

### 3. Quick Recipe Assessment

Don't have a RecipeKeeper export? Use **Quick Assess**:

1. Go to the **Quick Assess** tab
2. Paste any recipe text (ingredients, instructions, etc.)
3. If portions aren't detected, enter the number of servings
4. Click **Analyze Nutrition**

### 4. Get Nutritional Analysis

1. Select a recipe from your imported list
2. Click **Analyze Nutrition**
3. View the results:
   - **Health Score** (1-10)
   - **Per-serving nutrients**: calories, protein, carbs, fat, fiber, sugar, sodium
   - **Health benefits** and **warnings**

## Privacy & Data

- All recipes and assessments are stored locally in your browser
- Your OpenAI API key is stored locally and only sent to OpenAI
- No data is sent to any server except OpenAI for analysis
- Clear all data anytime from Settings

## Development

```bash
npm install      # Install dependencies
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Production build
npm run lint     # Run ESLint
```

## Tech Stack

- React 19 + TypeScript
- Vite
- IndexedDB for local storage
- JSZip for recipe import
- OpenAI API for nutritional analysis

## License

MIT
