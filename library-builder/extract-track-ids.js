// Map MIDI filenames to full track IDs and update lakh-songs.json
const fs = require('fs');
const path = require('path');

const midiDir = 'C:\\lmd\\selected'; // Where the 500 filtered MIDIs are
const songsFile = path.join(__dirname, 'output', 'lakh-songs.json');

console.log('\n🔍 Scanning MIDI files for track IDs...\n');

// Get all MIDI files
const files = fs.readdirSync(midiDir).filter(f => f.endsWith('.mid'));
console.log(`Found ${files.length} MIDI files`);

// Extract track IDs from filenames
const trackIds = [];
for (const file of files) {
    const match = file.match(/^([A-Z0-9]{18})_/);
    if (match) {
        trackIds.push(match[1]);
    }
}

console.log(`Extracted ${trackIds.length} track IDs`);
console.log(`\nFirst 3 track IDs:`);
trackIds.slice(0, 3).forEach(id => console.log(`  - ${id}`));

// Save for reference
fs.writeFileSync(
    path.join(__dirname, 'lakh-dataset', 'track-ids.json'),
    JSON.stringify(trackIds, null, 2)
);

console.log(`\n✅ Saved track IDs to lakh-dataset/track-ids.json`);
