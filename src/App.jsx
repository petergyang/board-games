import { useState, useMemo } from 'react';
import { useGames } from './hooks/useGames';
import { useFilters } from './hooks/useFilters';
import { filterGames } from './utils/filterGames';
import { TopBar } from './components/TopBar';
import { FilterSidebar } from './components/FilterSidebar';
import { GameGrid } from './components/GameGrid';
import { GameModal } from './components/GameModal';
import { LoadingState } from './components/LoadingState';

function App() {
  const { games, loading, error } = useGames();
  const { filters, setFilter, toggleArrayFilter, clearFilters, hasActiveFilters } = useFilters();
  const [selectedGame, setSelectedGame] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredGames = useMemo(() => {
    return filterGames(games, filters);
  }, [games, filters]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-[var(--navy)] mb-2">Error Loading Games</h1>
          <p className="text-[var(--text-secondary)]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] paper-texture">
      <TopBar
        filters={filters}
        setFilter={setFilter}
        onMenuClick={() => setSidebarOpen(true)}
      />

      <div className="flex">
        <FilterSidebar
          filters={filters}
          setFilter={setFilter}
          toggleArrayFilter={toggleArrayFilter}
          clearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 min-h-[calc(100vh-64px)]">
          {/* Results count */}
          <div className="px-4 lg:px-6 pt-4 pb-2 flex items-center justify-between">
            <p className="text-sm text-[var(--text-secondary)]">
              {loading ? 'Loading...' : `${filteredGames.length} games found`}
            </p>
            {/* Mobile sort */}
            <select
              value={filters.sort}
              onChange={(e) => setFilter('sort', e.target.value)}
              className="sm:hidden px-2 py-1 text-sm bg-[var(--bg-card)] border border-[var(--border)] rounded-lg"
            >
              <option value="rating-desc">Top Rated</option>
              <option value="popular">Popular</option>
              <option value="newest">Newest</option>
              <option value="name">A-Z</option>
            </select>
          </div>

          {loading ? (
            <LoadingState />
          ) : (
            <GameGrid
              games={filteredGames}
              onGameClick={setSelectedGame}
            />
          )}
        </main>
      </div>

      {selectedGame && (
        <GameModal
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
        />
      )}
    </div>
  );
}

export default App;
