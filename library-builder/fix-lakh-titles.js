// Fix titles in existing lakh-songs.json
// Updates "TRACKID_Unknown-Untitled_score0.XXX" to "Track TRACKID"

const fs = require('fs');
const path = require('path');

function fixTitles(inputFile, outputFile) {
    console.log('\n' + '='.repeat(60));
    console.log('🔧 FIXING LAKH SONG TITLES');
    console.log('='.repeat(60));
    
    console.log(`\n📖 Reading ${inputFile}...`);
    const songs = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
    
    console.log(`✓ Loaded ${songs.length} songs\n`);
    console.log('🔄 Updating titles...');
    
    let updated = 0;
    for (const song of songs) {
        // Check if title matches Lakh pattern: TRACKID_Unknown-Untitled_score0.XXX
        const match = song.title.match(/^([A-Z0-9]+)_Unknown-Untitled_score[\d.]+$/);
        
        if (match) {
            const trackId = match[1];
            song.title = `Track ${trackId}`; // Keep full track ID for lookup
            song.artist = 'Various Artists';
            song.trackId = trackId; // Store track ID for metadata lookup
            updated++;
        }
    }
    
    console.log(`✓ Updated ${updated} titles\n`);
    console.log(`💾 Saving to ${outputFile}...`);
    fs.writeFileSync(outputFile, JSON.stringify(songs, null, 2));
    console.log('✅ Done!\n');
    console.log('='.repeat(60));
}

// Run
const inputFile = path.join(__dirname, 'output', 'lakh-songs.json');
const outputFile = inputFile; // Overwrite same file

fixTitles(inputFile, outputFile);
