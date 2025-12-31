import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'boardGameFavorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync to localStorage whenever favorites change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = useCallback((gameId) => {
    setFavorites(prev => {
      if (prev.includes(gameId)) return prev;
      return [...prev, gameId];
    });
  }, []);

  const removeFavorite = useCallback((gameId) => {
    setFavorites(prev => prev.filter(id => id !== gameId));
  }, []);

  const toggleFavorite = useCallback((gameId) => {
    setFavorites(prev => {
      if (prev.includes(gameId)) {
        return prev.filter(id => id !== gameId);
      }
      return [...prev, gameId];
    });
  }, []);

  const isFavorite = useCallback((gameId) => {
    return favorites.includes(gameId);
  }, [favorites]);

  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

  return {
    favorites,
    favoriteCount: favorites.length,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    clearFavorites
  };
}
