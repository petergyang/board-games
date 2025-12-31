export function GameCard({ game, onClick, isFavorite, onToggleFavorite }) {
  const formatPlaytime = (min, max) => {
    if (min === max) return `${min}m`;
    return `${min}-${max}m`;
  };

  const formatPlayers = (min, max) => {
    if (min === max) return `${min}`;
    return `${min}-${max}`;
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    onToggleFavorite?.(game.uid);
  };

  return (
    <article
      onClick={onClick}
      className="group bg-[var(--bg-card)] rounded-lg sm:rounded-xl border border-[var(--border)] overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-[var(--shadow)] hover:border-[var(--gold)]/30"
    >
      {/* Image */}
      <div className="relative aspect-square sm:aspect-[4/3] bg-[var(--bg-sidebar)] overflow-hidden">
        <img
          src={game.thumbnail}
          alt={game.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23EDE8DC" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%238C8C8C" font-size="12">No Image</text></svg>';
          }}
        />
        {/* Favorite button */}
        <button
          onClick={handleFavoriteClick}
          className={`absolute top-1 left-1 sm:top-2 sm:left-2 p-1 sm:p-1.5 rounded-full transition-all duration-200 ${
            isFavorite
              ? 'bg-red-500 text-white shadow-md'
              : 'bg-[var(--bg-card)]/80 text-[var(--text-tertiary)] hover:bg-[var(--bg-card)] hover:text-red-500'
          }`}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <svg
            className="w-3.5 h-3.5 sm:w-4 sm:h-4"
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
        {/* Rating badge */}
        <div className={`absolute top-1 right-1 sm:top-2 sm:right-2 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm font-bold ${
          game.average_rating >= 8
            ? 'bg-[var(--gold)] text-white'
            : 'bg-[var(--bg-card)]/90 text-[var(--text-primary)]'
        }`}>
          {game.average_rating.toFixed(1)}
        </div>
      </div>

      {/* Content */}
      <div className="p-2 sm:p-3">
        <h3
          className="font-medium text-[var(--text-primary)] line-clamp-1 sm:line-clamp-2 text-xs sm:text-sm mb-0.5 sm:mb-1 group-hover:text-[var(--navy)] transition-colors"
          style={{ fontFamily: 'Fraunces, Georgia, serif' }}
        >
          {game.name}
        </h3>
        <p className="text-[10px] sm:text-xs text-[var(--text-tertiary)] mb-1 sm:mb-2">
          {game.year_published}
        </p>

        {/* Meta - hidden on small mobile, compact on larger screens */}
        <div className="hidden xs:flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-[var(--text-secondary)]">
          <span className="flex items-center gap-0.5 sm:gap-1" title="Players">
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {formatPlayers(game.min_players, game.max_players)}
          </span>
          <span className="flex items-center gap-0.5 sm:gap-1" title="Playtime">
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatPlaytime(game.min_playtime, game.max_playtime)}
          </span>
          <span className={`ml-auto px-1.5 sm:px-2 py-0.5 rounded text-[8px] sm:text-[10px] uppercase font-medium ${
            game.weight === 'light' ? 'bg-green-100 text-green-700' :
            game.weight === 'medium' ? 'bg-amber-100 text-amber-700' :
            'bg-red-100 text-red-700'
          }`}>
            {game.weight}
          </span>
        </div>
        {/* Simplified meta for very small screens */}
        <div className="flex xs:hidden items-center justify-between text-[10px] text-[var(--text-secondary)]">
          <span>{formatPlayers(game.min_players, game.max_players)}P · {formatPlaytime(game.min_playtime, game.max_playtime)}</span>
          <span className={`px-1 py-0.5 rounded text-[8px] uppercase font-medium ${
            game.weight === 'light' ? 'bg-green-100 text-green-700' :
            game.weight === 'medium' ? 'bg-amber-100 text-amber-700' :
            'bg-red-100 text-red-700'
          }`}>
            {game.weight}
          </span>
        </div>
      </div>
    </article>
  );
}
