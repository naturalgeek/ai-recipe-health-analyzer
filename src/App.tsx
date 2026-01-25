import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { FileUpload } from './components/FileUpload';
import { RecipeList } from './components/RecipeList';
import { RecipeDetail } from './components/RecipeDetail';
import { Settings } from './components/Settings';
import { IngredientSearch } from './components/IngredientSearch';
import { PasteRecipe } from './components/PasteRecipe';
import './App.css';

type Tab = 'recipes' | 'quick' | 'settings';
type SidebarView = 'recipes' | 'ingredients';

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('recipes');
  const [sidebarView, setSidebarView] = useState<SidebarView>('recipes');
  const { isLoading, recipes } = useApp();

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>RecipeKeeper Assesser</h1>
        <nav className="app-nav">
          <button
            className={`nav-btn ${activeTab === 'recipes' ? 'active' : ''}`}
            onClick={() => setActiveTab('recipes')}
          >
            Recipes
          </button>
          <button
            className={`nav-btn ${activeTab === 'quick' ? 'active' : ''}`}
            onClick={() => setActiveTab('quick')}
          >
            Quick Assess
          </button>
          <button
            className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </nav>
      </header>

      <main className="app-main">
        {activeTab === 'settings' ? (
          <Settings />
        ) : activeTab === 'quick' ? (
          <PasteRecipe />
        ) : (
          <>
            {recipes.length === 0 && (
              <div className="upload-container">
                <FileUpload />
              </div>
            )}
            {recipes.length > 0 && (
              <div className="recipes-layout">
                <aside className="recipes-sidebar">
                  <FileUpload />
                  <div className="sidebar-tabs">
                    <button
                      className={`sidebar-tab ${sidebarView === 'recipes' ? 'active' : ''}`}
                      onClick={() => setSidebarView('recipes')}
                    >
                      Recipes
                    </button>
                    <button
                      className={`sidebar-tab ${sidebarView === 'ingredients' ? 'active' : ''}`}
                      onClick={() => setSidebarView('ingredients')}
                    >
                      Ingredients
                    </button>
                  </div>
                  {sidebarView === 'recipes' ? <RecipeList /> : <IngredientSearch />}
                </aside>
                <section className="recipe-main">
                  <RecipeDetail />
                </section>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
