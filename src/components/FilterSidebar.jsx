const VOTER_OPTIONS = [
  { value: 1000, label: '1K+' },
  { value: 5000, label: '5K+' },
  { value: 10000, label: '10K+' },
  { value: 25000, label: '25K+' },
];

const PLAYER_OPTIONS = [
  { value: null, label: 'Any' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
  { value: '6', label: '6' },
  { value: '7', label: '7+' },
];

const PLAYTIME_OPTIONS = [
  { value: '<30', label: '< 30 min' },
  { value: '30-60', label: '30-60 min' },
  { value: '60-120', label: '1-2 hours' },
  { value: '120+', label: '2+ hours' },
];

const WEIGHT_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'heavy', label: 'Heavy' },
];

const CATEGORY_OPTIONS = [
  'Strategy', 'Economic', 'Adventure', 'Fantasy', 'Science Fiction',
  'Card Game', 'Cooperative', 'Wargame', 'Party Game', 'Puzzle',
  'Medieval', 'Civilization',
];

export function FilterSidebar({ filters, setFilter, toggleArrayFilter, clearFilters, hasActiveFilters, isOpen, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 lg:z-30
          h-screen lg:h-[calc(100vh-64px)] w-72 lg:w-[280px]
          bg-[var(--bg-sidebar)] border-r border-[var(--border)]
          overflow-y-auto
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-4 space-y-6">
          {/* Mobile header */}
          <div className="flex items-center justify-between lg:hidden">
            <h2 className="text-lg font-semibold text-[var(--navy)]" style={{ fontFamily: 'Fraunces, Georgia, serif' }}>
              Filters
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--border)] rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="w-full py-2 px-4 text-sm font-medium text-[var(--navy)] bg-[var(--bg-card)] border border-[var(--border)] rounded-lg hover:bg-[var(--border)] transition-colors"
            >
              Clear all filters
            </button>
          )}

          {/* Rating Range */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
              Rating: {filters.ratingMin.toFixed(1)} - {filters.ratingMax.toFixed(1)}
            </label>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--text-tertiary)] w-6">Min</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={filters.ratingMin}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (val < filters.ratingMax) setFilter('ratingMin', val);
                  }}
                  className="flex-1"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--text-tertiary)] w-6">Max</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={filters.ratingMax}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (val > filters.ratingMin) setFilter('ratingMax', val);
                  }}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Min Voters */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
              Minimum Ratings
            </label>
            <div className="flex flex-wrap gap-2">
              {VOTER_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFilter('minVoters', opt.value)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${
                    filters.minVoters === opt.value
                      ? 'bg-[var(--navy)] text-white border-[var(--navy)]'
                      : 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border)] hover:border-[var(--navy)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Player Count */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
              Player Count
            </label>
            <select
              value={filters.playerCount || ''}
              onChange={(e) => setFilter('playerCount', e.target.value || null)}
              className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--navy)]"
            >
              {PLAYER_OPTIONS.map(opt => (
                <option key={opt.label} value={opt.value || ''}>
                  {opt.value ? `Works at ${opt.label} players` : 'Any player count'}
                </option>
              ))}
            </select>
          </div>

          {/* Playtime */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
              Playtime
            </label>
            <div className="space-y-2">
              {PLAYTIME_OPTIONS.map(opt => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.playtime.includes(opt.value)}
                    onChange={() => toggleArrayFilter('playtime', opt.value)}
                    className="w-4 h-4 rounded border-[var(--border)] text-[var(--navy)] focus:ring-[var(--navy)]"
                  />
                  <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Weight */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
              Complexity
            </label>
            <div className="flex gap-1 p-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg">
              {WEIGHT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => toggleArrayFilter('weight', opt.value)}
                  className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    filters.weight.includes(opt.value)
                      ? 'bg-[var(--navy)] text-white'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
              Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map(cat => (
                <button
                  key={cat}
                  onClick={() => toggleArrayFilter('categories', cat.toLowerCase())}
                  className={`px-3 py-1 text-sm rounded-full border transition-all ${
                    filters.categories.includes(cat.toLowerCase())
                      ? 'bg-[var(--gold)] text-white border-[var(--gold)]'
                      : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--gold)] hover:text-[var(--gold)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
