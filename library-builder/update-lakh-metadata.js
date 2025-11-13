// Update Lakh song metadata with real artist and title names from MSD
const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * Parse unique_tracks.txt and build track ID lookup
 * Format: <Track ID><SEP><Song ID><SEP><Artist><SEP><Title>
 */
async function buildTrackLookup(uniqueTracksFile) {
    console.log('\n📖 Parsing unique_tracks.txt...');
    console.log('   (This may take a minute - 1 million tracks)\n');
    
    const lookup = {};
    let count = 0;
    
    const fileStream = fs.createReadStream(uniqueTracksFile);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    
    for await (const line of rl) {
        const parts = line.split('<SEP>');
        if (parts.length >= 4) {
            const trackId = parts[0];
            const artist = parts[2];
            const title = parts[3];
            
            lookup[trackId] = {
                artist: artist,
                title: title
            };
            
            count++;
            if (count % 100000 === 0) {
                process.stdout.write(`\r   Processed: ${(count / 1000).toFixed(0)}k tracks`);
            }
        }
    }
    
    console.log(`\r   ✓ Loaded ${count.toLocaleString()} track mappings\n`);
    return lookup;
}

/**
 * Extract track ID from song title or trackId field
 */
function extractTrackId(song) {
    // Check if trackId field exists
    if (song.trackId) return song.trackId;
    
    // Format: "Track TRACKID" (full track ID, not truncated)
    const match = song.title.match(/^Track ([A-Z0-9]{18})$/);
    if (match) return match[1];
    
    // Format: "TRACKID_..."
    const match2 = song.title.match(/^([A-Z0-9]{18})_/);
    if (match2) return match2[1];
    
    return null;
}

/**
 * Update song metadata
 */
async function updateMetadata(songsFile, uniqueTracksFile, outputFile) {
    console.log('\n' + '='.repeat(60));
    console.log('🎵 UPDATE LAKH METADATA WITH MSD TRACK INFO');
    console.log('='.repeat(60));
    
    // Build lookup table
    const lookup = await buildTrackLookup(uniqueTracksFile);
    
    // Load songs
    console.log(`📖 Reading ${songsFile}...`);
    const songs = JSON.parse(fs.readFileSync(songsFile, 'utf8'));
    console.log(`✓ Loaded ${songs.length} songs\n`);
    
    // Update songs
    console.log('🔄 Updating metadata...\n');
    let updated = 0;
    let notFound = 0;
    
    for (const song of songs) {
        const trackId = extractTrackId(song);
        
        if (trackId && lookup[trackId]) {
            const metadata = lookup[trackId];
            song.title = metadata.title;
            song.artist = metadata.artist;
            delete song.trackId; // Remove temporary field
            updated++;
            
            if (updated <= 5) {
                console.log(`   ✓ ${trackId.substring(0, 8)}: "${metadata.artist}" - "${metadata.title}"`);
            }
        } else if (trackId) {
            notFound++;
        }
    }
    
    if (updated > 5) {
        console.log(`   ... and ${updated - 5} more`);
    }
    
    console.log(`\n📊 Results:`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Not found: ${notFound}`);
    console.log(`   Unchanged: ${songs.length - updated - notFound}\n`);
    
    // Save
    console.log(`💾 Saving to ${outputFile}...`);
    fs.writeFileSync(outputFile, JSON.stringify(songs, null, 2));
    console.log('✅ Done!\n');
    console.log('='.repeat(60));
}

// Run
const songsFile = path.join(__dirname, 'output', 'lakh-songs.json');
const uniqueTracksFile = path.join(__dirname, 'lakh-dataset', 'unique_tracks.txt');
const outputFile = songsFile; // Overwrite

updateMetadata(songsFile, uniqueTracksFile, outputFile);
