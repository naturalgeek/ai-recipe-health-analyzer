# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Recipe Analyzer is a Progressive Web App (PWA) that provides AI-powered nutritional assessment for recipes. It supports multiple input methods: RecipeKeeper .zip import, pasted text, URL fetching, and photo upload. All data is stored locally in IndexedDB. Uses OpenAI GPT-5.2 (with vision) for analysis.

## Commands

```bash
npm run dev      # Start development server (http://localhost:5173)
npm run build    # Generate icons + TypeScript check + production build to dist/
npm run lint     # Run ESLint
npm run preview  # Preview production build locally
```

## Architecture

### Data Flow

1. **Import**: User uploads RecipeKeeper .zip → `zipImport.ts` extracts with JSZip → `recipeParser.ts` parses HTML → `storage.ts` saves to IndexedDB
2. **Quick Assess (Text)**: User pastes text or fetches URL → `PasteRecipe.tsx` detects portions → `openai.ts` assesses
3. **Quick Assess (Image)**: User uploads photo → `openai.ts` uses GPT-5.2 vision to analyze
4. **Display**: `AppContext.tsx` loads from IndexedDB → components render recipes
5. **Assessment**: User clicks assess → `openai.ts` calls GPT API → result saved to IndexedDB

### Key Services (`src/services/`)

- **zipImport.ts**: Extracts .zip, loads images as base64, orchestrates import
- **recipeParser.ts**: Parses RecipeKeeper HTML format using DOMParser
- **storage.ts**: IndexedDB wrapper with stores for `recipes`, `assessments`, `config`
- **openai.ts**: Nutritional analysis via GPT-5.2, supports text and image (vision) analysis. System prompt is embedded directly in the prompt text (not via API `instructions` parameter). Includes dietary requirements in prompt when configured.

### Key Components (`src/components/`)

- **PasteRecipe.tsx**: Quick assessment with URL fetch, text paste, and image upload. Contains `DietaryTooltip` component.
- **InstallPrompt.tsx**: PWA install prompts for iOS and Android (mobile banner with instructions), plus desktop toast promoting mobile app
- **RecipeDetail.tsx**: Recipe display with editable servings, assessment results, re-analyze button. Contains `DietaryTooltip` component.
- **Settings.tsx**: API key configuration with setup tutorial, personal dietary requirements, custom system prompt

### Assessment Scores

- **Health Score** (1-10): General healthiness of the recipe
- **Personal Diet Score** (1-10): Compliance with user's dietary requirements (configured in Settings)

### State Management

Single React Context (`AppContext.tsx`) manages: recipes, selected recipe, assessments, config (API key, dietary requirements, system prompt), loading states.

### PWA Features (`public/`)

- **manifest.json**: Web app manifest for installability
- **sw.js**: Service worker for offline caching (network-first strategy)
- **icon.svg**: Source icon (leaf design)
- **icon-192.png, icon-512.png**: Generated from SVG via `scripts/generate-icons.js`

## TypeScript Notes

- Use `import type` for type-only imports (verbatimModuleSyntax enabled)
- Types defined in `src/types/recipe.ts`

## CI/CD

- **GitHub Pages**: Auto-deploys on push to main via `.github/workflows/pages.yml`
- **Releases**: Auto version bump and release on push to main via `.github/workflows/release.yml`
- Vite base path is `/ai-recipe-health-analyzer/` for GitHub Pages

## URL Fetching

Recipe URL fetching uses GPT-5.2 with web_search tool via the Responses API to extract recipe content directly from URLs.
