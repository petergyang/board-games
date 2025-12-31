import fs from 'fs';
import https from 'https';

const CSV_PATH = '/Users/pyang/Downloads/bg_info.csv';
const OLD_CSV_PATH = '/Users/pyang/Downloads/board_games.csv';
const OUTPUT_PATH = './public/data/games.json';
const TOP_N = 1000;
const CONCURRENT_REQUESTS = 3;

// Build a name -> game_id map from the old CSV (which has game IDs)
function buildGameIdMap() {
  try {
    const content = fs.readFileSync(OLD_CSV_PATH, 'utf-8');
    const lines = content.split('\n').slice(1);
    const map = new Map();

    for (const line of lines) {
      if (!line.trim()) continue;
      // Parse carefully - game_id is first, name is at index 8
      const match = line.match(/^(\d+),/);
      if (!match) continue;
      const gameId = match[1];

      // Find the name field (index 8) - need to handle commas in quoted fields
      const parts = [];
      let current = '';
      let inQuotes = false;
      for (const char of line) {
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) {
          parts.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      parts.push(current);

      if (parts.length > 8) {
        const name = parts[8].replace(/^"|"$/g, '').toLowerCase().trim();
        map.set(name, gameId);
      }
    }

    console.log(`Loaded ${map.size} game IDs from old dataset`);
    return map;
  } catch (e) {
    console.log('Could not load old dataset for ID mapping');
    return new Map();
  }
}

// Parse CSV line handling quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Fetch URL with promise
function fetch(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        let redirectUrl = res.headers.location;
        // Handle relative redirects
        if (redirectUrl.startsWith('/')) {
          redirectUrl = 'https://boardgamegeek.com' + redirectUrl;
        }
        return fetch(redirectUrl).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// Simplify title for better BGG search matching
function simplifyTitle(title) {
  return title
    .replace(/\s*:\s*.*/g, '')                    // Remove everything after colon
    .replace(/\s*–\s*.*/g, '')                    // Remove everything after dash
    .replace(/\s*\([^)]+\)\s*/g, ' ')             // Remove parenthetical text
    .replace(/\s*(First|Second|Third|\d+th)\s+Edition/gi, '')  // Remove edition text
    .replace(/\s*(Deluxe|Anniversary|Collector'?s?)\s*/gi, '') // Remove edition modifiers
    .trim();
}

// Search BGG website for game ID with retry and fallback
async function searchBGG(title, retries = 2) {
  const searchVariants = [title, simplifyTitle(title)].filter((v, i, a) => a.indexOf(v) === i);

  for (const searchTitle of searchVariants) {
    const encoded = encodeURIComponent(searchTitle);
    const url = `https://boardgamegeek.com/geeksearch.php?action=search&objecttype=boardgame&q=${encoded}`;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const html = await fetch(url);
        // Look for boardgame/ID pattern in the results
        const match = html.match(/boardgame\/(\d+)/);
        if (match) return match[1];
        // If no match but got a response, don't retry this variant
        if (html.length > 0) break;
      } catch (e) {
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }
  }
  return null;
}

// Fetch game details from BGG website
async function fetchGameDetails(gameId) {
  const url = `https://boardgamegeek.com/boardgame/${gameId}`;

  try {
    const html = await fetch(url);

    // Extract image from og:image meta tag
    const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    const image = imageMatch ? imageMatch[1] : null;

    // Extract description from og:description or meta description
    const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/);
    let description = descMatch ? descMatch[1] : '';
    description = description
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .slice(0, 1000);

    return {
      image: image,
      thumbnail: image,
      description,
      mechanics: [],
      categories: []
    };
  } catch (e) {
    return null;
  }
}

// Derive weight from complexity score
function deriveWeight(complexity) {
  if (complexity < 2.0) return 'light';
  if (complexity < 3.5) return 'medium';
  return 'heavy';
}

// Process games in batches
async function processInBatches(items, batchSize, processor) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);

    // Progress
    const done = Math.min(i + batchSize, items.length);
    process.stdout.write(`\rProcessed ${done}/${items.length} games...`);

    // Delay between batches to avoid rate limiting
    if (i + batchSize < items.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  console.log();
  return results;
}

async function main() {
  console.log('Building game ID map from old dataset...');
  const gameIdMap = buildGameIdMap();

  console.log('Reading CSV...');
  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = content.split('\n').slice(1).filter(l => l.trim());

  console.log(`Found ${lines.length} games in CSV`);

  // Parse all games
  const games = lines.map(line => {
    const cols = parseCSVLine(line);
    return {
      title: cols[0],
      geekRating: parseFloat(cols[1]) || 0,
      avgRating: parseFloat(cols[2]) || 0,
      numVoters: parseInt(cols[3]) || 0,
      year: parseInt(cols[5]) || 0,
      complexity: parseFloat(cols[6]) || 2.5,
      minPlayers: parseInt(cols[7]) || 1,
      maxPlayers: parseInt(cols[8]) || 4,
      minTime: parseInt(cols[9]) || 30,
      maxTime: parseInt(cols[10]) || 60,
      minAge: parseInt(cols[11]) || 10,
      type1: cols[12] || '',
      type2: cols[13] || ''
    };
  });

  // Filter and sort by geek rating (BGG's bayesian rating)
  const topGames = games
    .filter(g => g.numVoters >= 1000 && g.year >= 1980)
    .sort((a, b) => b.geekRating - a.geekRating)
    .slice(0, TOP_N);

  console.log(`Selected top ${topGames.length} games by rating`);
  console.log(`Year range: ${Math.min(...topGames.map(g => g.year))} - ${Math.max(...topGames.map(g => g.year))}`);

  // Step 1: Find game IDs - first from map, then search BGG for missing ones
  console.log('\nLooking up game IDs...');

  // First pass: use the ID map
  let foundFromMap = 0;
  const gamesWithMapIds = topGames.map(game => {
    const normalizedTitle = game.title.toLowerCase().trim();
    let gameId = gameIdMap.get(normalizedTitle);

    // Try simplified title too
    if (!gameId) {
      const simplified = simplifyTitle(game.title).toLowerCase().trim();
      gameId = gameIdMap.get(simplified);
    }

    if (gameId) foundFromMap++;
    return { ...game, gameId };
  });

  console.log(`Found ${foundFromMap}/${topGames.length} game IDs from old dataset`);

  // Second pass: search BGG for games without IDs
  const needsSearch = gamesWithMapIds.filter(g => !g.gameId);
  console.log(`Searching BGG for ${needsSearch.length} remaining games...`);

  const searchedGames = await processInBatches(needsSearch, CONCURRENT_REQUESTS, async (game) => {
    const gameId = await searchBGG(game.title);
    return { ...game, gameId };
  });

  // Merge results
  const gamesWithIds = gamesWithMapIds.map(g => {
    if (g.gameId) return g;
    const searched = searchedGames.find(s => s.title === g.title);
    return searched || g;
  });

  const foundIds = gamesWithIds.filter(g => g.gameId).length;
  console.log(`Found ${foundIds}/${topGames.length} game IDs`);

  // Step 2: Fetch details for games with IDs
  console.log('\nFetching game details from BGG...');
  const gamesWithDetails = await processInBatches(
    gamesWithIds.filter(g => g.gameId),
    CONCURRENT_REQUESTS,
    async (game) => {
      const details = await fetchGameDetails(game.gameId);
      return { ...game, details };
    }
  );

  // Step 3: Build final output
  const output = gamesWithDetails
    .filter(g => g.details && g.details.thumbnail)
    .map(g => ({
      game_id: parseInt(g.gameId),
      name: g.title,
      year_published: g.year,
      min_players: g.minPlayers,
      max_players: g.maxPlayers,
      min_playtime: g.minTime,
      max_playtime: g.maxTime,
      min_age: g.minAge,
      geek_rating: g.geekRating,
      average_rating: g.avgRating,
      users_rated: g.numVoters,
      weight: deriveWeight(g.complexity),
      complexity: g.complexity,
      thumbnail: g.details.thumbnail,
      image: g.details.image || g.details.thumbnail,
      description: g.details.description || `${g.title} is a board game published in ${g.year}.`,
      categories: [g.type1, g.type2].filter(Boolean),
      mechanics: []
    }));

  console.log(`\nWriting ${output.length} games to ${OUTPUT_PATH}`);
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

  // Summary
  const years = output.map(g => g.year_published);
  console.log('\nDone!');
  console.log(`Games: ${output.length}`);
  console.log(`Year range: ${Math.min(...years)} - ${Math.max(...years)}`);
  console.log(`Games 2020+: ${output.filter(g => g.year_published >= 2020).length}`);
  console.log(`Games 2023+: ${output.filter(g => g.year_published >= 2023).length}`);
}

main().catch(console.error);
