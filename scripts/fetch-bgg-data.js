// Script to fetch real BGG data by scraping game pages
// BGG XML API is currently blocked (401), so we scrape the website instead

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOP_GAME_IDS = [
  174430, 167791, 169786, 224517, 312484, 233078, 291457, 220308, 161936, 822,
  13, 68448, 173346, 124361, 28720, 9209, 266192, 205637, 30549, 36218,
  148228, 2651, 31260, 84876, 178900, 237182, 126163, 182028, 12333, 102794,
  40834, 199792, 193738, 55690, 276025, 251247, 295947, 342942, 256960, 215,
  167355, 172386, 164928, 246900, 185343, 187645, 162886, 175914, 230802, 244521,
  284083, 316554, 328871, 366013, 341169, 314040, 269385, 271324, 192135, 194655,
  183394, 184267, 157354, 171623, 209010, 170216, 283155, 247030, 191189, 229853,
  180263, 159675, 204583, 230085, 236457, 163412, 37111, 35677, 96848, 70149,
  103343, 175117, 155821, 184921, 198928, 204583, 286096, 300531, 314491, 318084,
  297562, 366161, 358828, 317985, 329839, 336986, 359871, 354568, 370591, 359438
];

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchGamePage(gameId) {
  const url = `https://boardgamegeek.com/boardgame/${gameId}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    }
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.text();
}

function parseGamePage(html, gameId) {
  // Extract JSON-LD data which contains structured game info
  const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);

  // Extract image URL from og:image meta tag
  const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
  const image = ogImageMatch ? ogImageMatch[1] : '';

  // Create thumbnail from image URL by changing size parameter
  let thumbnail = image;
  if (image.includes('__original')) {
    thumbnail = image.replace('__original', '__thumb');
  }

  // Extract title from og:title
  const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
  const name = titleMatch ? titleMatch[1].replace(/\s*\|.*$/, '').trim() : '';

  // Extract description
  const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/);
  const description = descMatch ? descMatch[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"') : '';

  // Try to extract more data from GEEK.geekitemPreload script
  const preloadMatch = html.match(/GEEK\.geekitemPreload\s*=\s*(\{[\s\S]*?\});/);
  let preloadData = null;
  if (preloadMatch) {
    try {
      preloadData = JSON.parse(preloadMatch[1]);
    } catch (e) {}
  }

  // Extract stats from the page
  const ratingMatch = html.match(/(\d+\.\d+)\s*<\/span>\s*<span[^>]*>avg rating/i) ||
                      html.match(/"ratingValue":\s*"?(\d+\.?\d*)/) ||
                      html.match(/geekrating.*?(\d+\.\d+)/i);
  const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 7.0;

  // Try to find player count
  const playersMatch = html.match(/(\d+)[–-](\d+)\s*Players/i) || html.match(/(\d+)\s*Players/i);
  let minPlayers = 1, maxPlayers = 4;
  if (playersMatch) {
    minPlayers = parseInt(playersMatch[1]);
    maxPlayers = playersMatch[2] ? parseInt(playersMatch[2]) : minPlayers;
  }

  // Try to find playtime
  const playtimeMatch = html.match(/(\d+)[–-](\d+)\s*Min/i) || html.match(/(\d+)\s*Min/i);
  let minPlaytime = 60, maxPlaytime = 120;
  if (playtimeMatch) {
    minPlaytime = parseInt(playtimeMatch[1]);
    maxPlaytime = playtimeMatch[2] ? parseInt(playtimeMatch[2]) : minPlaytime;
  }

  // Try to find year
  const yearMatch = html.match(/\((\d{4})\)/);
  const year = yearMatch ? parseInt(yearMatch[1]) : 2020;

  return {
    game_id: gameId,
    name,
    thumbnail,
    image,
    average_rating: Math.round(rating * 10) / 10,
    users_rated: 10000,
    min_players: minPlayers,
    max_players: maxPlayers,
    min_playtime: minPlaytime,
    max_playtime: maxPlaytime,
    min_age: 10,
    categories: [],
    mechanics: [],
    year_published: year,
    description: description.substring(0, 500),
    weight: 'medium'
  };
}

async function main() {
  console.log('Fetching BGG data from website...');
  const allGames = [];
  const existingDataPath = path.join(__dirname, '../public/data/games.json');

  // Load existing data to merge with
  let existingGames = [];
  try {
    existingGames = JSON.parse(fs.readFileSync(existingDataPath, 'utf8'));
    console.log(`Loaded ${existingGames.length} existing games for reference`);
  } catch (e) {
    console.log('No existing data found');
  }

  const existingMap = new Map(existingGames.map(g => [g.game_id, g]));

  for (let i = 0; i < TOP_GAME_IDS.length; i++) {
    const gameId = TOP_GAME_IDS[i];
    console.log(`Fetching game ${i + 1}/${TOP_GAME_IDS.length}: ID ${gameId}...`);

    try {
      const html = await fetchGamePage(gameId);
      const game = parseGamePage(html, gameId);

      // Merge with existing data if available (to preserve categories, mechanics, etc.)
      const existing = existingMap.get(gameId);
      if (existing) {
        game.categories = existing.categories || [];
        game.mechanics = existing.mechanics || [];
        game.weight = existing.weight || 'medium';
        game.users_rated = existing.users_rated || 10000;
        game.min_age = existing.min_age || 10;
        // Keep existing values if scraped ones are defaults
        if (game.average_rating === 7.0 && existing.average_rating) {
          game.average_rating = existing.average_rating;
        }
        if (game.min_players === 1 && game.max_players === 4 && existing.min_players) {
          game.min_players = existing.min_players;
          game.max_players = existing.max_players;
        }
        if (game.min_playtime === 60 && game.max_playtime === 120 && existing.min_playtime) {
          game.min_playtime = existing.min_playtime;
          game.max_playtime = existing.max_playtime;
        }
        if (!game.description && existing.description) {
          game.description = existing.description;
        }
      }

      if (game.name && game.image) {
        allGames.push(game);
      } else {
        console.log(`  Warning: Missing name or image for ${gameId}`);
      }
    } catch (err) {
      console.error(`  Error fetching ${gameId}:`, err.message);
      // Use existing data if available
      const existing = existingMap.get(gameId);
      if (existing) {
        allGames.push(existing);
        console.log(`  Using existing data for ${gameId}`);
      }
    }

    // Rate limiting - be gentle with BGG
    if (i < TOP_GAME_IDS.length - 1) {
      await delay(500);
    }
  }

  // Remove duplicates
  const uniqueGames = Array.from(new Map(allGames.map(g => [g.game_id, g])).values());

  console.log(`\nFetched ${uniqueGames.length} games`);

  // Write to file
  const outputPath = path.join(__dirname, '../public/data/games.json');
  fs.writeFileSync(outputPath, JSON.stringify(uniqueGames, null, 2));
  console.log(`Saved to ${outputPath}`);
}

main();
