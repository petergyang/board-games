import { useEffect } from 'react';

export function GameModal({ game, onClose, isFavorite, onToggleFavorite }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!game) return null;

  const formatPlaytime = (min, max) => {
    if (min === max) return `${min} minutes`;
    return `${min}-${max} minutes`;
  };

  const formatPlayers = (min, max) => {
    if (min === max) return `${min} player${min > 1 ? 's' : ''}`;
    return `${min}-${max} players`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] bg-[var(--bg-card)] rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Action buttons */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          {/* Favorite button */}
          <button
            onClick={() => onToggleFavorite?.(game.uid)}
            className={`p-2 rounded-full transition-all duration-200 shadow-md ${
              isFavorite
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-[var(--bg-card)]/80 hover:bg-[var(--bg-card)] text-[var(--text-tertiary)] hover:text-red-500'
            }`}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <svg
              className="w-5 h-5"
              fill={isFavorite ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 bg-[var(--bg-card)]/80 hover:bg-[var(--bg-card)] rounded-full transition-colors shadow-md"
            aria-label="Close"
          >
            <svg className="w-5 h-5 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto max-h-[90vh]">
          {/* Header with image */}
          <div className="relative">
            <div className="aspect-video bg-[var(--bg-sidebar)]">
              <img
                src={game.image || game.thumbnail}
                alt={game.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = game.thumbnail;
                }}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-1" style={{ fontFamily: 'Fraunces, Georgia, serif' }}>
                {game.name}
              </h2>
              <p className="text-white/80 text-sm">
                Published {game.year_published}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-[var(--bg-sidebar)] rounded-lg p-3 text-center">
                <div className={`text-2xl font-bold ${game.average_rating >= 8 ? 'text-[var(--gold)]' : 'text-[var(--navy)]'}`}>
                  {game.average_rating.toFixed(1)}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">
                  {game.users_rated.toLocaleString()} ratings
                </div>
              </div>
              <div className="bg-[var(--bg-sidebar)] rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-[var(--navy)]">
                  {formatPlayers(game.min_players, game.max_players).split(' ')[0]}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">players</div>
              </div>
              <div className="bg-[var(--bg-sidebar)] rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-[var(--navy)]">
                  {game.min_playtime === game.max_playtime ? game.min_playtime : `${game.min_playtime}-${game.max_playtime}`}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">minutes</div>
              </div>
              <div className="bg-[var(--bg-sidebar)] rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-[var(--navy)]">{game.min_age}+</div>
                <div className="text-xs text-[var(--text-secondary)]">age</div>
              </div>
            </div>

            {/* Description */}
            <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
              {game.description}
            </p>

            {/* Categories */}
            {game.categories?.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {game.categories.map(cat => (
                    <span key={cat} className="px-3 py-1 text-sm bg-[var(--bg-sidebar)] text-[var(--text-secondary)] rounded-full">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Mechanics */}
            {game.mechanics?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Mechanics</h3>
                <div className="flex flex-wrap gap-2">
                  {game.mechanics.map(mech => (
                    <span key={mech} className="px-3 py-1 text-sm bg-[var(--navy)]/10 text-[var(--navy)] rounded-full">
                      {mech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* BGG Link */}
            <a
              href={`https://boardgamegeek.com/boardgame/${game.game_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-[var(--navy)] hover:bg-[var(--navy-light)] text-white font-medium rounded-lg transition-colors"
            >
              View on BoardGameGeek
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
