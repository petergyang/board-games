import { GameCard } from './GameCard';

export function GameGrid({ games, onGameClick, isFavorite, onToggleFavorite }) {
  if (games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <svg className="w-24 h-24 text-[var(--border)] mb-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2" style={{ fontFamily: 'Fraunces, Georgia, serif' }}>
          No games found
        </h3>
        <p className="text-sm text-[var(--text-secondary)] text-center max-w-md">
          Try adjusting your filters to discover more games. There are thousands of great board games waiting to be explored!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-4 p-2 sm:p-4 lg:p-6">
      {games.map(game => (
        <GameCard
          key={game.uid}
          game={game}
          onClick={() => onGameClick(game)}
          isFavorite={isFavorite(game.uid)}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}
