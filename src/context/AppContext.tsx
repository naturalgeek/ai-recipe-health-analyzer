import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Recipe, NutritionalAssessment, AppConfig } from '../types/recipe';
import { getAllRecipes, getConfig, saveConfig, getAssessment, saveAssessment, clearAllData } from '../services/storage';
import { assessRecipeNutrition } from '../services/openai';

interface AppState {
  recipes: Recipe[];
  selectedRecipe: Recipe | null;
  assessment: NutritionalAssessment | null;
  config: AppConfig;
  isLoading: boolean;
  isAssessing: boolean;
  error: string | null;
}

interface AppContextType extends AppState {
  setRecipes: (recipes: Recipe[]) => void;
  selectRecipe: (recipe: Recipe | null) => void;
  updateConfig: (config: AppConfig) => Promise<void>;
  assessRecipe: (recipe: Recipe) => Promise<NutritionalAssessment>;
  refreshRecipes: () => Promise<void>;
  clearData: () => Promise<void>;
  setError: (error: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    recipes: [],
    selectedRecipe: null,
    assessment: null,
    config: { openaiApiKey: '', systemPrompt: '', dietaryRequirements: 'I tolerate all foods', knusprEmail: '', knusprPassword: '', knusprPrompt: '' },
    isLoading: true,
    isAssessing: false,
    error: null
  });

  const refreshRecipes = useCallback(async () => {
    try {
      const recipes = await getAllRecipes();
      setState(s => ({ ...s, recipes, isLoading: false }));
    } catch (error) {
      console.error('Failed to load recipes:', error);
      setState(s => ({ ...s, isLoading: false, error: 'Failed to load recipes' }));
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const [recipes, config] = await Promise.all([
          getAllRecipes(),
          getConfig()
        ]);
        setState(s => ({ ...s, recipes, config, isLoading: false }));
      } catch (error) {
        console.error('Failed to initialize:', error);
        setState(s => ({ ...s, isLoading: false, error: 'Failed to initialize app' }));
      }
    };
    init();
  }, []);

  const setRecipes = useCallback((recipes: Recipe[]) => {
    setState(s => ({ ...s, recipes }));
  }, []);

  const selectRecipe = useCallback(async (recipe: Recipe | null) => {
    setState(s => ({ ...s, selectedRecipe: recipe, assessment: null }));

    if (recipe) {
      // Load existing assessment if available
      const assessment = await getAssessment(recipe.id);
      if (assessment) {
        setState(s => ({ ...s, assessment }));
      }
    }
  }, []);

  const updateConfig = useCallback(async (config: AppConfig) => {
    await saveConfig(config);
    setState(s => ({ ...s, config }));
  }, []);

  const assessRecipe = useCallback(async (recipe: Recipe): Promise<NutritionalAssessment> => {
    if (!state.config.openaiApiKey) {
      throw new Error('Please configure your OpenAI API key first');
    }

    setState(s => ({ ...s, isAssessing: true, error: null }));

    try {
      const assessment = await assessRecipeNutrition(recipe, state.config);
      await saveAssessment(assessment);
      setState(s => ({ ...s, assessment, isAssessing: false }));
      return assessment;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Assessment failed';
      setState(s => ({ ...s, isAssessing: false, error: message }));
      throw error;
    }
  }, [state.config]);

  const clearData = useCallback(async () => {
    await clearAllData();
    setState(s => ({
      ...s,
      recipes: [],
      selectedRecipe: null,
      assessment: null
    }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(s => ({ ...s, error }));
  }, []);

  return (
    <AppContext.Provider
      value={{
        ...state,
        setRecipes,
        selectRecipe,
        updateConfig,
        assessRecipe,
        refreshRecipes,
        clearData,
        setError
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
