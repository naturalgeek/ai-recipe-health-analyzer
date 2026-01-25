# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RecipeKeeper Assesser is a client-side React web application that imports RecipeKeeper export files (.zip containing recipes.html and images), stores them locally in IndexedDB, and provides AI-powered nutritional assessment using the OpenAI API. It also supports quick assessment of pasted recipe text.

## Commands

```bash
npm run dev      # Start development server (http://localhost:5173)
npm run build    # TypeScript check + production build to dist/
npm run lint     # Run ESLint
npm run preview  # Preview production build locally
```

## Architecture

### Data Flow

1. **Import**: User uploads RecipeKeeper .zip → `zipImport.ts` extracts with JSZip → `recipeParser.ts` parses HTML → `storage.ts` saves to IndexedDB
2. **Quick Assess**: User pastes recipe text → `PasteRecipe.tsx` detects portions → `openai.ts` assesses directly (no storage)
3. **Display**: `AppContext.tsx` loads from IndexedDB → components render recipes
4. **Assessment**: User clicks assess → `openai.ts` calls GPT API → result saved to IndexedDB

### Key Services (`src/services/`)

- **zipImport.ts**: Extracts .zip, loads images as base64, orchestrates import
- **recipeParser.ts**: Parses RecipeKeeper HTML format using DOMParser, extracts recipe metadata
- **storage.ts**: IndexedDB wrapper with stores for `recipes`, `assessments`, `config`
- **openai.ts**: Builds nutritional analysis prompt, calls OpenAI chat completions API

### State Management

Single React Context (`AppContext.tsx`) manages all app state: recipes, selected recipe, assessment results, config (API key), loading states.

### Storage

All data persists in browser IndexedDB (`recipekeeper-assesser` database):
- Recipes with embedded base64 images
- Nutritional assessments keyed by recipe ID
- User config (OpenAI API key)

## TypeScript Notes

- Use `import type` for type-only imports (verbatimModuleSyntax enabled)
- Types defined in `src/types/recipe.ts`

## CI/CD

- **GitHub Pages**: Auto-deploys on push to main via `.github/workflows/pages.yml`
- **Releases**: Auto version bump and release on push to main via `.github/workflows/release.yml`
- Vite base path is set to `/ai-recipe-health-analyzer/` for GitHub Pages

## Deployment

Static site - build outputs to `dist/`, serve with any web server. No backend required.
