# AI Recipe Analyzer

**Live App:** https://naturalgeek.github.io/ai-recipe-health-analyzer/

A Progressive Web App that provides AI-powered nutritional assessment for your recipes. Import recipes from RecipeKeeper, paste recipe text, fetch from URL, or upload a photo to get instant nutritional analysis.

## Features

- **Import RecipeKeeper exports** - Upload your RecipeKeeper .zip backup file to import all recipes with images
- **Quick Recipe Assessment** - Multiple input methods:
  - Paste recipe text directly
  - Fetch recipe from any URL
  - Upload a photo of a dish or recipe
- **AI-Powered Analysis** - Get detailed nutritional information per serving using OpenAI's GPT-5.2
- **Image Analysis** - Upload a photo and AI will identify the dish and estimate nutrition
- **Health Score** - Each recipe receives a 1-10 health score with benefits and warnings
- **Personal Diet Score** - Get a personalized 1-10 score based on your dietary requirements
- **Dietary Requirements** - Configure allergies, intolerances, or preferences (e.g., gluten-free, low sodium)
- **Custom System Prompt** - Advanced users can customize the AI analysis behavior
- **Ingredient Search** - Browse recipes by ingredient
- **Offline Support** - Works offline after first load (PWA with service worker)
- **Install as App** - Add to home screen on iOS and Android for native app experience
- **Privacy First** - All data stored locally in your browser

## Install as Mobile App

### iOS (iPhone/iPad)

1. Open the app in Safari
2. Tap the **Share** button at the bottom
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **"Add"** in the top right

### Android

1. Open the app in Chrome
2. Tap the menu (three dots)
3. Tap **"Add to Home Screen"** or **"Install app"**

## How to Use

### 1. Set Up Your OpenAI API Key

1. Go to the **Settings** tab
2. Follow the step-by-step tutorial to create an OpenAI account and generate an API key
3. Paste your API key and click **Save**

Your key is stored only in your browser's local storage.

You can also configure:
- **Personal Dietary Requirements** - Allergies, intolerances, or diet preferences
- **Custom System Prompt** - Advanced customization of AI analysis behavior

### 2. Import Recipes from RecipeKeeper

1. Export your recipes from RecipeKeeper app (creates a .zip file)
2. Go to the **Recipes** tab
3. Drag and drop the .zip file or click to browse
4. Your recipes will be imported with images

### 3. Quick Recipe Assessment

Go to the **Quick Assess** tab and choose one of three methods:

**From URL:**
1. Paste a recipe URL and click **Fetch**
2. Review the extracted text
3. Click **Analyze Nutrition**

**From Text:**
1. Paste any recipe text (ingredients, instructions, etc.)
2. If portions aren't detected, enter the number of servings
3. Click **Analyze Nutrition**

**From Photo:**
1. Click the photo upload area
2. Select a photo of a dish or recipe
3. Enter the number of portions
4. Click **Analyze Nutrition**

### 4. Configure Personal Dietary Requirements (Optional)

1. Go to the **Settings** tab
2. Under **Personal Dietary Requirements**, enter any allergies, intolerances, or preferences
3. Examples: "gluten intolerant", "lactose free", "low sodium diet", "vegetarian"
4. The AI will factor these into your Personal Diet Score

### 5. View Nutritional Analysis

Results include:
- **Health Score** (1-10) - General healthiness of the recipe
- **Personal Diet Score** (1-10) - How well the recipe fits your dietary requirements
- **Per-serving nutrients**: calories, protein, carbs, fat, fiber, sugar, sodium
- **Health benefits** and **warnings**
- **Nutritional notes**

## Privacy & Data

- All recipes and assessments are stored locally in your browser (IndexedDB)
- Your OpenAI API key is stored locally and only sent to OpenAI
- Recipe URLs are fetched via CORS proxies for compatibility
- Images are sent to OpenAI for analysis (not stored on any server)
- Clear all data anytime from Settings

## Development

```bash
npm install      # Install dependencies
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Generate icons + TypeScript check + production build
npm run lint     # Run ESLint
```

## Tech Stack

- React 19 + TypeScript
- Vite
- PWA (Service Worker + Web App Manifest)
- IndexedDB for local storage
- JSZip for recipe import
- OpenAI API (GPT-5.2 with vision) for nutritional analysis
- Sharp for icon generation

## License

MIT
