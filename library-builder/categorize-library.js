// This script reads curated-library-rhythmic-fixed.json, adds a 'category' field to each song, and writes the result to curated-library-rhythmic-categorized.json.
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'output', 'curated-library-rhythmic-fixed.json');
const outputPath = path.join(__dirname, 'output', 'curated-library-rhythmic-categorized.json');

// Category rules
const categoryRules = [
  { name: 'Beatles', match: song => song.artist && song.artist.toLowerCase().includes('beatles') },
  { name: 'Jazz', match: song => (song.genre && song.genre.toLowerCase().includes('jazz')) || ['miles davis','chet baker','dave brubeck','jerome kern','george gershwin','frank sinatra','kenny dorham','gerald marks'].some(a => song.artist && song.artist.toLowerCase().includes(a)) },
  { name: 'Folk', match: song => (song.genre && song.genre.toLowerCase().includes('folk')) || ['bob dylan','simon & garfunkel','john denver','james taylor','neil young'].some(a => song.artist && song.artist.toLowerCase().includes(a)) },
  { name: 'Classic Rock', match: song => (song.genre && song.genre.toLowerCase().includes('classic rock')) || ['queen','pink floyd','led zeppelin','eagles','lynyrd skynyrd','boston','the rolling stones'].some(a => song.artist && song.artist.toLowerCase().includes(a)) },
  { name: 'Pop', match: song => (song.genre && song.genre.toLowerCase().includes('pop')) || ['adele','ed sheeran','john legend','billy joel','elton john','oasis','journey','leonard cohen','ben e. king'].some(a => song.artist && song.artist.toLowerCase().includes(a)) },
  { name: 'Blues', match: song => (song.genre && song.genre.toLowerCase().includes('blues')) || ['b.b. king','stevie ray vaughan','robert johnson'].some(a => song.artist && song.artist.toLowerCase().includes(a)) },
  { name: 'Teaching', match: song => (song.genre && song.genre.toLowerCase().includes('teaching')) || ['common progression','theory exercise'].some(a => song.artist && song.artist.toLowerCase().includes(a) || song.title && song.title.toLowerCase().includes('progression')) },
  { name: 'Hymn', match: song => (song.genre && song.genre.toLowerCase().includes('hymn')) || (song.title && song.title.toLowerCase().includes('amazing grace')) },
  { name: 'Children', match: song => (song.genre && song.genre.toLowerCase().includes('children')) || (song.title && song.title.toLowerCase().includes('twinkle twinkle')) },
  { name: 'Country', match: song => (song.genre && song.genre.toLowerCase().includes('country')) || (song.artist && song.artist.toLowerCase().includes('jimmie davis')) },
  { name: 'R&B', match: song => (song.genre && song.genre.toLowerCase().includes('r&b')) },
  { name: 'Traditional', match: song => (song.genre && song.genre.toLowerCase().includes('traditional')) || (song.artist && song.artist.toLowerCase().includes('traditional')) },
  { name: 'Basics', match: song => (song.title && song.title.toLowerCase().includes('basic')) },
];

function categorize(song) {
  for (const rule of categoryRules) {
    if (rule.match(song)) return rule.name;
  }
  return song.genre || 'Other';
}

function main() {
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const songs = data.songs.map(song => ({ ...song, category: categorize(song) }));
  fs.writeFileSync(outputPath, JSON.stringify({ songs }, null, 2));
  console.log('Categorized library written to', outputPath);
}

main();
