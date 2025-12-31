# Board Game Discovery Tool - Technical Specification

## Overview

A beautiful, fast board game discovery tool with a cozy tabletop aesthetic. Users filter and sort a responsive grid of games, with click-through links to BoardGameGeek (BGG).

**Live URL Pattern:** `https://[domain]/?rating=7&players=4&time=60-120`

---

## Data Source

### Source Dataset
- **Kaggle BGG Dataset** by Sujay Kapadnis (October 2023)
- URL: https://www.kaggle.com/datasets/sujaykapadnis/board-games
- Contains 10,000+ board games with BGG metadata

### Required Fields
| Field | Type | Description |
|-------|------|-------------|
| `game_id` | number | BGG game ID (used for linking) |
| `name` | string | Game title |
| `thumbnail` | string | Small image URL |
| `image` | string | Large image URL |
| `average_rating` | number | BGG average rating (1-10) |
| `users_rated` | number | Number of ratings |
| `min_players` | number | Minimum player count |
| `max_players` | number | Maximum player count |
| `min_playtime` | number | Minimum play time (minutes) |
| `max_playtime` | number | Maximum play time (minutes) |
| `min_age` | number | Recommended minimum age |
| `category` | string | Comma-separated categories |
| `mechanic` | string | Comma-separated mechanics |
| `year_published` | number | Publication year |
| `description` | string | Game description (HTML entities to decode) |

### Data Processing Pipeline
1. Download CSV from Kaggle
2. Filter to games with `users_rated >= 1000`
3. Parse and clean data:
   - Decode HTML entities in descriptions
   - Split category/mechanic strings into arrays
   - Derive weight classification (see below)
4. Export as `games.json` (~500-800 games expected)
5. Place in `/public/data/games.json`

### Weight Derivation Logic
Since BGG weight isn't in this dataset, derive from categories/mechanics:

```
LIGHT indicators: "Children's Game", "Party Game", "Family Game",
                  "Push Your Luck", "Roll / Spin and Move"

HEAVY indicators: "Economic", "Civilization", "Wargame",
                  "Worker Placement", "Engine Building", "Area Control"

Default: MEDIUM
```

---

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  🎲 Board Game Explorer                    [Search...] [Sort ▼] │
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                  │
│   FILTERS    │     ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐             │
│   (280px)    │     │     │ │     │ │     │ │     │             │
│              │     │Game │ │Game │ │Game │ │Game │             │
│  Rating      │     │     │ │     │ │     │ │     │             │
│  ──────────  │     └─────┘ └─────┘ └─────┘ └─────┘             │
│              │                                                  │
│  Voters      │     ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐             │
│  [1K][5K]... │     │     │ │     │ │     │ │     │             │
│              │     │Game │ │Game │ │Game │ │Game │             │
│  Players     │     │     │ │     │ │     │ │     │             │
│  [Dropdown]  │     └─────┘ └─────┘ └─────┘ └─────┘             │
│              │                                                  │
│  Playtime    │                    ...                           │
│  ☐ < 30min   │                                                  │
│  ☐ 30-60     │                                                  │
│              │                                                  │
│  Weight      │                                                  │
│  [L][M][H]   │                                                  │
│              │                                                  │
│  Categories  │                                                  │
│  [Strategy]  │                                                  │
│  [Family]    │                                                  │
│              │                                                  │
└──────────────┴──────────────────────────────────────────────────┘
```

### Responsive Breakpoints
| Breakpoint | Grid Columns | Sidebar |
|------------|--------------|---------|
| < 768px | 2 columns | Collapsed (drawer) |
| 768-1024px | 3 columns | 240px |
| 1024-1440px | 4 columns | 280px |
| > 1440px | 5 columns | 280px |

---

## Components

### 1. TopBar
- **Logo/Title:** "Board Game Explorer" with meeple icon
- **Search Input:** Debounced (300ms), searches name field
- **Sort Dropdown:**
  - Rating (High → Low) [default]
  - Rating (Low → High)
  - Most Popular
  - Newest
  - Alphabetical

### 2. FilterSidebar

#### Rating Range Slider
- Dual-handle slider, range 1-10
- Default: 1-10 (no filter)
- Display current range: "6.5 - 9.0"
- Step: 0.5

#### Minimum Voters (Button Group)
- Options: `1K` | `5K` | `10K` | `25K`
- Single select, default: 1K
- Styled as segmented control

#### Player Count
- Dropdown with options: "Any", "1", "2", "3", "4", "5", "6", "7+"
- Filter logic: `min_players <= selected && max_players >= selected`
- Label: "Works at X players"

#### Playtime (Checkboxes)
- Multi-select checkboxes:
  - `< 30 min` (max_playtime < 30)
  - `30-60 min` (min_playtime <= 60 && max_playtime >= 30)
  - `60-120 min` (min_playtime <= 120 && max_playtime >= 60)
  - `120+ min` (min_playtime >= 120)
- No selection = show all

#### Weight Toggle
- Three-way toggle: `Light` | `Medium` | `Heavy`
- Multi-select allowed
- Default: all selected

#### Categories (Multi-select Chips)
- Display top 10-12 most common categories as chips
- Chip states: unselected (outline), selected (filled)
- Categories to prioritize:
  - Strategy, Family, Party, Thematic
  - Co-op, Two-Player, Solo, Abstract
  - Economic, Adventure, Wargame

#### Clear Filters Button
- Appears when any filter is active
- Resets all to defaults

### 3. GameCard

```
┌────────────────────────────┐
│  ┌──────────────────────┐  │
│  │                      │  │
│  │      THUMBNAIL       │  │
│  │       (16:9)         │  │
│  │                      │  │
│  └──────────────────────┘  │
│                            │
│  Game Title Here           │
│  2019                      │
│                            │
│  ⭐ 8.2    👥 2-4   ⏱ 60m  │
└────────────────────────────┘
```

**Elements:**
- Thumbnail: Aspect ratio 4:3, lazy loaded, fallback placeholder
- Name: Truncate at 2 lines with ellipsis
- Year: Muted text
- Rating: Gold badge if >= 8.0, standard otherwise
- Player count: Icon + "2-4" format
- Playtime: Icon + "60m" or "60-90m" format

**Interactions:**
- Hover: translateY(-4px), box-shadow increase, warm glow border
- Click: Opens detail modal
- Focus: Visible outline for accessibility

### 4. GameModal

```
┌─────────────────────────────────────────────────┐
│                                            [X]  │
│  ┌─────────────────┐                            │
│  │                 │  Game Title                │
│  │                 │  Published 2019            │
│  │   LARGE IMAGE   │                            │
│  │                 │  ⭐ 8.2 (45,231 ratings)   │
│  │                 │  👥 2-4 players            │
│  │                 │  ⏱ 60-90 minutes           │
│  │                 │  📅 Age 12+                │
│  └─────────────────┘                            │
│                                                 │
│  Description text goes here. Multiple lines    │
│  with full content from BGG...                  │
│                                                 │
│  Categories: [Strategy] [Economic]              │
│  Mechanics: [Worker Placement] [Drafting]       │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │       View on BoardGameGeek →           │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

**Features:**
- Large image (fallback to thumbnail if unavailable)
- Full description (sanitized HTML, truncated with "read more" if > 500 chars)
- Category/mechanic chips
- External link: `https://boardgamegeek.com/boardgame/{game_id}`
- Close: X button, click outside, Escape key
- Scroll lock on body when open

### 5. EmptyState
- Shown when filters return 0 results
- Decorative meeple illustration (Imagen-generated)
- Message: "No games match your filters"
- "Clear filters" button

### 6. LoadingState
- Skeleton cards matching GameCard dimensions
- Subtle shimmer animation

---

## Design System

### Color Palette

```css
:root {
  /* Backgrounds */
  --bg-primary: #F5F0E6;      /* Cream/parchment */
  --bg-card: #FFFDF9;         /* Off-white cards */
  --bg-sidebar: #EDE8DC;      /* Slightly darker cream */

  /* Primary */
  --navy: #1E3A5F;            /* Deep navy - headings, buttons */
  --navy-light: #2D4A6F;      /* Hover state */

  /* Accent */
  --gold: #C9A227;            /* Muted gold - highlights, ratings */
  --gold-light: #D4B23D;      /* Hover state */

  /* Text */
  --text-primary: #2C2C2C;    /* Near-black */
  --text-secondary: #5C5C5C;  /* Muted */
  --text-tertiary: #8C8C8C;   /* Subtle */

  /* Utility */
  --border: #DDD5C5;          /* Warm gray border */
  --shadow: rgba(30, 58, 95, 0.1);
}
```

### Typography

```css
/* Headers - Warm serif */
font-family: 'Fraunces', 'Libre Baskerville', Georgia, serif;

/* Body - Clean sans */
font-family: 'DM Sans', 'Inter', system-ui, sans-serif;
```

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Page title | Fraunces | 28px | 600 |
| Card title | Fraunces | 16px | 500 |
| Modal title | Fraunces | 24px | 600 |
| Filter headers | DM Sans | 14px | 600 |
| Body text | DM Sans | 14px | 400 |
| Small text | DM Sans | 12px | 400 |

### Spacing Scale
```
4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px
```

### Border Radius
- Cards: 12px
- Buttons: 8px
- Chips: 16px (pill)
- Inputs: 8px

### Shadows
```css
--shadow-sm: 0 1px 2px var(--shadow);
--shadow-md: 0 4px 6px var(--shadow);
--shadow-lg: 0 10px 15px var(--shadow);
--shadow-hover: 0 8px 25px rgba(30, 58, 95, 0.15);
```

### Textures (Imagen-generated, subtle)
- **Background:** Faint paper/linen texture overlay at 3-5% opacity
- **Empty states:** Meeple silhouettes, scattered dice
- **Decorative:** Wood grain accents for section dividers

---

## Technical Implementation

### Tech Stack
- **Framework:** React 18 (Vite)
- **Styling:** Tailwind CSS 3.x
- **State:** React hooks (useState, useMemo)
- **Routing:** URL search params (no router needed)
- **Deployment:** Vercel

### Project Structure
```
/src
  /components
    TopBar.jsx
    FilterSidebar.jsx
    GameCard.jsx
    GameGrid.jsx
    GameModal.jsx
    EmptyState.jsx
    LoadingState.jsx
    /ui
      RangeSlider.jsx
      ButtonGroup.jsx
      Chip.jsx
      Checkbox.jsx
  /hooks
    useGames.js         # Data loading
    useFilters.js       # Filter state + URL sync
  /utils
    filterGames.js      # Filter logic
    deriveWeight.js     # Weight classification
  /data
    categories.js       # Category definitions
  App.jsx
  main.jsx
  index.css             # Tailwind + custom styles
/public
  /data
    games.json
  /images
    placeholder.svg
    meeple.svg
```

### Data Loading
```javascript
// useGames.js
const useGames = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/games.json')
      .then(res => res.json())
      .then(data => {
        setGames(data);
        setLoading(false);
      });
  }, []);

  return { games, loading };
};
```

### Filter State + URL Sync
```javascript
// useFilters.js
const useFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = {
    search: searchParams.get('q') || '',
    ratingMin: parseFloat(searchParams.get('rmin')) || 1,
    ratingMax: parseFloat(searchParams.get('rmax')) || 10,
    minVoters: parseInt(searchParams.get('voters')) || 1000,
    playerCount: searchParams.get('players') || null,
    playtime: searchParams.getAll('time'),
    weight: searchParams.getAll('weight'),
    categories: searchParams.getAll('cat'),
    sort: searchParams.get('sort') || 'rating-desc',
  };

  const setFilter = (key, value) => {
    // Update URL params
  };

  return { filters, setFilter, clearFilters };
};
```

### Filtering Logic (useMemo)
```javascript
const filteredGames = useMemo(() => {
  return games
    .filter(game => {
      // Search
      if (filters.search && !game.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Rating range
      if (game.average_rating < filters.ratingMin || game.average_rating > filters.ratingMax) {
        return false;
      }

      // Min voters
      if (game.users_rated < filters.minVoters) {
        return false;
      }

      // Player count
      if (filters.playerCount) {
        const count = parseInt(filters.playerCount);
        if (game.min_players > count || game.max_players < count) {
          return false;
        }
      }

      // Playtime (OR logic for multi-select)
      // Weight (OR logic for multi-select)
      // Categories (OR logic for multi-select)

      return true;
    })
    .sort(/* based on filters.sort */);
}, [games, filters]);
```

### Performance Optimizations
- Lazy load images with `loading="lazy"`
- Virtualize grid if > 200 visible games (react-window)
- Debounce search input (300ms)
- Memoize filter computations
- Skeleton loading states

---

## URL Parameters

| Param | Type | Example | Description |
|-------|------|---------|-------------|
| `q` | string | `q=catan` | Search query |
| `rmin` | number | `rmin=7` | Min rating |
| `rmax` | number | `rmax=10` | Max rating |
| `voters` | number | `voters=5000` | Min voters |
| `players` | number | `players=4` | Player count |
| `time` | string[] | `time=30-60&time=60-120` | Playtime ranges |
| `weight` | string[] | `weight=light&weight=medium` | Weight filters |
| `cat` | string[] | `cat=strategy&cat=economic` | Categories |
| `sort` | string | `sort=popular` | Sort order |

**Example URL:**
```
/?q=&rmin=7&voters=5000&players=4&time=60-120&cat=strategy&sort=rating-desc
```

---

## Accessibility

- Semantic HTML (header, main, aside, nav)
- ARIA labels on interactive elements
- Focus management for modal
- Keyboard navigation (Tab, Enter, Escape)
- Color contrast AA compliant
- Reduced motion support
- Screen reader announcements for filter changes

---

## Future Enhancements (Out of Scope)

- User accounts / saved favorites
- Comparison mode
- Collection import from BGG
- Advanced filters (designer, publisher)
- Similar game recommendations
- Dark mode toggle

---

## Milestones

### Phase 1: Foundation
- [ ] Project setup (Vite + React + Tailwind)
- [ ] Data processing script
- [ ] Basic layout structure

### Phase 2: Core Features
- [ ] Game grid with cards
- [ ] All filters functional
- [ ] URL state sync
- [ ] Detail modal

### Phase 3: Polish
- [ ] Design system implementation
- [ ] Animations and hover states
- [ ] Responsive design
- [ ] Loading/empty states

### Phase 4: Launch
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Deploy to Vercel
