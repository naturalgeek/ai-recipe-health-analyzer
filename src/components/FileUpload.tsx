import { useState, useRef } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { importRecipeKeeperZip } from '../services/zipImport';
import type { ImportProgress } from '../services/zipImport';
import { useApp } from '../context/AppContext';

export function FileUpload() {
  const { setRecipes, recipes, clearData } = useApp();
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.zip')) {
      setError('Please upload a .zip file');
      return;
    }

    setError(null);
    setProgress({ stage: 'reading', current: 0, total: 100, message: 'Starting import...' });

    try {
      console.log('Starting import of:', file.name, 'Size:', file.size);
      const importedRecipes = await importRecipeKeeperZip(file, setProgress);
      console.log('Import complete. Recipes:', importedRecipes.length);
      setRecipes(importedRecipes);
    } catch (err) {
      console.error('Import failed:', err);
      setError(err instanceof Error ? err.message : 'Import failed');
      setProgress(null);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClear = async () => {
    if (confirm('Are you sure you want to clear all imported recipes?')) {
      await clearData();
      setProgress(null);
    }
  };

  return (
    <div className="upload-section">
      <div
        className={`upload-zone ${isDragging ? 'dragging' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <div className="upload-icon">📁</div>
        <p className="upload-text">
          {recipes.length > 0
            ? `${recipes.length} recipes loaded. Drop a new file to replace.`
            : 'Drop your RecipeKeeper .zip file here or click to browse'}
        </p>
      </div>

      {progress && (
        <div className="progress-section">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
          <p className={`progress-message ${progress.stage === 'done' ? 'success' : ''}`}>
            {progress.message}
          </p>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {recipes.length > 0 && (
        <button className="clear-btn" onClick={handleClear}>
          Clear All Data
        </button>
      )}
    </div>
  );
}
