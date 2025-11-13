// Final script: Update lakh-songs.json with real metadata from MSD
const fs = require('fs');
const path = require('path');
const readline = require('readline');

async function buildTrackLookup(uniqueTracksFile) {
    console.log('\n📖 Parsing unique_tracks.txt...');
    console.log('   (Processing 1 million tracks)\n');
    
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
            
            lookup[trackId] = { artist, title };
            
            count++;
            if (count % 100000 === 0) {
                process.stdout.write(`\r   Processed: ${(count / 1000).toFixed(0)}k tracks`);
            }
        }
    }
    
    console.log(`\r   ✓ Loaded ${count.toLocaleString()} track mappings\n`);
    return lookup;
}

async function updateMetadata() {
    console.log('\n' + '='.repeat(60));
    console.log('🎵 UPDATE LAKH SONGS WITH REAL METADATA');
    console.log('='.repeat(60));
    
    // Load track ID mapping (in order of MIDI files)
    const trackIdsFile = path.join(__dirname, 'lakh-dataset', 'track-ids.json');
    const trackIds = JSON.parse(fs.readFileSync(trackIdsFile, 'utf8'));
    console.log(`\n📋 Loaded ${trackIds.length} track IDs from MIDI files`);
    
    // Build MSD lookup
    const uniqueTracksFile = path.join(__dirname, 'lakh-dataset', 'unique_tracks.txt');
    const lookup = await buildTrackLookup(uniqueTracksFile);
    
    // Load songs
    const songsFile = path.join(__dirname, 'output', 'lakh-songs.json');
    console.log(`📖 Reading lakh-songs.json...`);
    const songs = JSON.parse(fs.readFileSync(songsFile, 'utf8'));
    console.log(`✓ Loaded ${songs.length} songs\n`);
    
    // Update: Match songs to track IDs by filename sorting
    console.log('🔄 Matching songs to track IDs...\n');
    
    // Get MIDI files in same order as converter processed them
    const midiDir = 'C:\\lmd\\selected';
    const midiFiles = fs.readdirSync(midiDir)
        .filter(f => f.endsWith('.mid'))
        .sort(); // Same sort as converter
    
    let updated = 0;
    let notFound = 0;
    let songIndex = 0;
    
    for (let i = 0; i < midiFiles.length && songIndex < songs.length; i++) {
        const filename = midiFiles[i];
        const trackIdMatch = filename.match(/^([A-Z0-9]{18})_/);
        
        if (!trackIdMatch) continue;
        
        const trackId = trackIdMatch[1];
        const song = songs[songIndex];
        
        // Check if this MIDI was converted (some were skipped)
        // Match by checking if title contains track ID
        if (song.title.includes(trackId.substring(0, 8))) {
            if (lookup[trackId]) {
                const metadata = lookup[trackId];
                song.title = metadata.title;
                song.artist = metadata.artist;
                updated++;
                
                if (updated <= 5) {
                    console.log(`   ✓ "${metadata.artist}" - "${metadata.title}"`);
                }
            } else {
                notFound++;
            }
            songIndex++; // Move to next song
        }
        // else: MIDI was skipped during conversion, don't increment songIndex
    }
    
    if (updated > 5) {
        console.log(`   ... and ${updated - 5} more`);
    }
    
    console.log(`\n📊 Results:`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Not found in MSD: ${notFound}`);
    console.log(`   Total songs: ${songs.length}\n`);
    
    // Save
    console.log(`💾 Saving updated songs...`);
    fs.writeFileSync(songsFile, JSON.stringify(songs, null, 2));
    console.log('✅ Done!\n');
    console.log('='.repeat(60));
}

updateMetadata();
