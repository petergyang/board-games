// Script to convert Kaggle BGG dataset to app JSON format
// Source: https://www.kaggle.com/datasets/sujaykapadnis/board-games

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const FETCH_IMAGES = process.argv.includes('--fetch-images');
const args = process.argv.filter(a => !a.startsWith('--'));
const INPUT_CSV = args[2] || '/Users/pyang/Downloads/board_games.csv';
const OUTPUT_JSON = path.join(__dirname, '../public/data/games.json');
const TOP_N_GAMES = 1000;
const MIN_USERS_RATED = 500; // Filter out games with too few ratings
const PARALLEL_REQUESTS = 10; // Concurrent image fetches

function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const headers = parseCSVLine(lines[0]);
  const games = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    games.push(row);
  }

  return games;
}

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());

  return values;
}

function parseArray(str) {
  if (!str || str === 'NA') return [];
  return str.split(',').map(s => s.trim()).filter(Boolean).slice(0, 5);
}

function fixImageUrl(url) {
  if (!url) return '';
  // URLs in CSV start with // - add https:
  if (url.startsWith('//')) {
    return 'https:' + url;
  }
  return url;
}

function deriveWeight(categories, mechanics) {
  const lightIndicators = ["Children's Game", 'Party Game', 'Family Game', 'Push Your Luck', 'Roll / Spin and Move', 'Trivia'];
  const heavyIndicators = ['Economic', 'Civilization', 'Wargame', 'Worker Placement', 'Engine Building', 'Area Control', 'Area Majority'];

  const allTags = [...categories, ...mechanics];

  const lightCount = allTags.filter(t =>
    lightIndicators.some(l => t.toLowerCase().includes(l.toLowerCase()))
  ).length;

  const heavyCount = allTags.filter(t =>
    heavyIndicators.some(h => t.toLowerCase().includes(h.toLowerCase()))
  ).length;

  if (lightCount > heavyCount) return 'light';
  if (heavyCount >= 2) return 'heavy';
  return 'medium';
}

function cleanDescription(desc) {
  if (!desc) return '';
  return desc
    .replace(/&#10;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 500);
}

function convertGame(row) {
  const categories = parseArray(row.category);
  const mechanics = parseArray(row.mechanic);

  return {
    game_id: parseInt(row.game_id) || 0,
    name: row.name || '',
    thumbnail: fixImageUrl(row.thumbnail),
    image: fixImageUrl(row.image),
    average_rating: Math.round(parseFloat(row.average_rating || 0) * 10) / 10,
    users_rated: parseInt(row.users_rated) || 0,
    min_players: parseInt(row.min_players) || 1,
    max_players: parseInt(row.max_players) || 4,
    min_playtime: parseInt(row.min_playtime) || 30,
    max_playtime: parseInt(row.max_playtime) || 60,
    min_age: parseInt(row.min_age) || 10,
    categories,
    mechanics,
    year_published: parseInt(row.year_published) || 2000,
    description: cleanDescription(row.description),
    weight: deriveWeight(categories, mechanics)
  };
}

async function fetchImageUrl(gameId) {
  try {
    const url = `https://boardgamegeek.com/boardgame/${gameId}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      }
    });
    if (!response.ok) return null;

    const html = await response.text();
    const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    if (ogImageMatch) {
      const image = ogImageMatch[1];
      // Create thumbnail by changing size parameter
      const thumbnail = image.replace('__opengraph', '__thumb').replace('__original', '__thumb');
      return { image, thumbnail };
    }
    return null;
  } catch (err) {
    return null;
  }
}

async function fetchImagesInParallel(games, batchSize = PARALLEL_REQUESTS) {
  console.log(`\nFetching fresh image URLs from BGG (${games.length} games)...`);

  for (let i = 0; i < games.length; i += batchSize) {
    const batch = games.slice(i, i + batchSize);
    const progress = Math.round((i / games.length) * 100);
    process.stdout.write(`\r  Progress: ${progress}% (${i}/${games.length})`);

    const results = await Promise.all(
      batch.map(async (game) => {
        const urls = await fetchImageUrl(game.game_id);
        if (urls) {
          game.image = urls.image;
          game.thumbnail = urls.thumbnail;
        }
        return game;
      })
    );

    // Small delay between batches to be nice to BGG
    if (i + batchSize < games.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  console.log(`\r  Progress: 100% (${games.length}/${games.length})`);
  return games;
}

async function main() {
  console.log(`Reading CSV from: ${INPUT_CSV}`);

  const csvText = fs.readFileSync(INPUT_CSV, 'utf8');
  const rawGames = parseCSV(csvText);

  console.log(`Parsed ${rawGames.length} games from CSV`);

  // Filter and convert games
  let games = rawGames
    .filter(row => {
      const usersRated = parseInt(row.users_rated) || 0;
      const rating = parseFloat(row.average_rating) || 0;
      return usersRated >= MIN_USERS_RATED && rating > 0 && row.name;
    })
    .map(convertGame)
    .sort((a, b) => b.average_rating - a.average_rating)
    .slice(0, TOP_N_GAMES);

  console.log(`Filtered to top ${games.length} games (min ${MIN_USERS_RATED} ratings)`);

  // Fetch fresh image URLs if requested
  if (FETCH_IMAGES) {
    games = await fetchImagesInParallel(games);
  } else {
    console.log(`\nNote: Using old image URLs from Kaggle. Run with --fetch-images to get fresh URLs.`);
  }

  // Stats
  const withImages = games.filter(g => g.thumbnail).length;
  const avgRating = (games.reduce((sum, g) => sum + g.average_rating, 0) / games.length).toFixed(2);
  const categories = new Set(games.flatMap(g => g.categories));
  const mechanics = new Set(games.flatMap(g => g.mechanics));

  console.log(`\nStats:`);
  console.log(`  Games with images: ${withImages}/${games.length}`);
  console.log(`  Average rating: ${avgRating}`);
  console.log(`  Unique categories: ${categories.size}`);
  console.log(`  Unique mechanics: ${mechanics.size}`);
  console.log(`  Year range: ${Math.min(...games.map(g => g.year_published))} - ${Math.max(...games.map(g => g.year_published))}`);

  // Write output
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(games, null, 2));
  console.log(`\nSaved to: ${OUTPUT_JSON}`);
}

main();
