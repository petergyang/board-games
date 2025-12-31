export function filterGames(games, filters, favorites = []) {
  return games
    .filter(game => {
      // Favorites filter
      if (filters.showFavorites && !favorites.includes(game.game_id)) {
        return false;
      }

      // Search by name
      if (filters.search && !game.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Rating range
      if (game.average_rating < filters.ratingMin || game.average_rating > filters.ratingMax) {
        return false;
      }

      // Minimum voters
      if (game.users_rated < filters.minVoters) {
        return false;
      }

      // Player count
      if (filters.playerCount) {
        const count = parseInt(filters.playerCount);
        if (count === 7) {
          // 7+ means max_players >= 7
          if (game.max_players < 7) return false;
        } else {
          if (game.min_players > count || game.max_players < count) return false;
        }
      }

      // Playtime (OR logic)
      if (filters.playtime.length > 0) {
        const matchesPlaytime = filters.playtime.some(range => {
          switch (range) {
            case '<30':
              return game.max_playtime < 30;
            case '30-60':
              return game.min_playtime <= 60 && game.max_playtime >= 30;
            case '60-120':
              return game.min_playtime <= 120 && game.max_playtime >= 60;
            case '120+':
              return game.max_playtime >= 120;
            default:
              return true;
          }
        });
        if (!matchesPlaytime) return false;
      }

      // Weight (OR logic)
      if (filters.weight.length > 0 && filters.weight.length < 3) {
        if (!filters.weight.includes(game.weight)) return false;
      }

      // Categories (OR logic)
      if (filters.categories.length > 0) {
        const gameCategories = game.categories.map(c => c.toLowerCase());
        const matchesCategory = filters.categories.some(cat =>
          gameCategories.some(gc => gc.includes(cat.toLowerCase()))
        );
        if (!matchesCategory) return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (filters.sort) {
        case 'rating-desc':
          return b.average_rating - a.average_rating;
        case 'rating-asc':
          return a.average_rating - b.average_rating;
        case 'popular':
          return b.users_rated - a.users_rated;
        case 'newest':
          return b.year_published - a.year_published;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return b.average_rating - a.average_rating;
      }
    });
}
