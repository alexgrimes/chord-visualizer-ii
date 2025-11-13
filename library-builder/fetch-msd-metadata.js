// Download and parse Million Song Dataset metadata
// Maps track IDs to actual artist and song names

const fs = require('fs');
const path = require('path');
const https = require('https');
const readline = require('readline');

/**
 * Download MSD unique tracks file (track_id -> artist, title mapping)
 */
async function downloadMSDTracks(outputPath) {
    const url = 'http://millionsongdataset.com/sites/default/files/AdditionalFiles/unique_tracks.txt';
    
    console.log('📥 Downloading MSD unique tracks metadata...');
    console.log('   URL:', url);
    console.log('   This is a ~7MB text file\n');
    
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(outputPath);
        
        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                // Follow redirect
                https.get(response.headers.location, (redirectResponse) => {
                    redirectResponse.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        console.log('✅ Download complete!\n');
                        resolve();
                    });
                }).on('error', reject);
            } else {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log('✅ Download complete!\n');
                    resolve();
                });
            }
        }).on('error', (err) => {
            fs.unlink(outputPath, () => {});
            reject(err);
        });
    });
}

/**
 * Parse unique_tracks.txt and extract metadata for our track IDs
 * File format: track_id<SEP>song_id<SEP>artist<SEP>title
 */
async function parseTracksFile(tracksFile, trackIds, outputFile) {
    console.log('📖 Parsing tracks file...');
    console.log(`   Looking for ${trackIds.length} track IDs\n`);
    
    const trackIdSet = new Set(trackIds);
    const metadata = {};
    let totalLines = 0;
    let foundCount = 0;
    
    const fileStream = fs.createReadStream(tracksFile);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    
    for await (const line of rl) {
        totalLines++;
        
        if (totalLines % 100000 === 0) {
            process.stdout.write(`\r   Processed: ${totalLines.toLocaleString()} lines, Found: ${foundCount}/${trackIds.length}`);
        }
        
        const parts = line.split('<SEP>');
        if (parts.length >= 4) {
            const trackId = parts[0].trim();
            const songId = parts[1].trim();
            const artist = parts[2].trim();
            const title = parts[3].trim();
            
            if (trackIdSet.has(trackId)) {
                metadata[trackId] = {
                    artist: artist,
                    title: title,
                    song_id: songId
                };
                foundCount++;
            }
        }
    }
    
    console.log(`\n\n✅ Parsed ${totalLines.toLocaleString()} total tracks`);
    console.log(`✅ Found metadata for ${foundCount}/${trackIds.length} track IDs\n`);
    
    fs.writeFileSync(outputFile, JSON.stringify(metadata, null, 2));
    console.log(`💾 Saved to: ${outputFile}\n`);
    
    return metadata;
}

/**
 * Get track IDs from MIDI filenames or JSON titles
 */
function getTrackIds() {
    console.log(`📋 Extracting track IDs...\n`);
    
    const lakhSongsFile = path.join(__dirname, 'output', 'lakh-songs.json');
    const lakhSelectedDir = path.join(__dirname, 'lakh-selected');
    
    let trackIds = [];
    
    // Try lakh-selected directory first
    if (fs.existsSync(lakhSelectedDir)) {
        const files = fs.readdirSync(lakhSelectedDir).filter(f => f.endsWith('.mid'));
        for (const file of files) {
            const match = file.match(/^([A-Z]{2}[A-Z0-9]{16})/);
            if (match) {
                trackIds.push(match[1]);
            }
        }
        console.log(`✓ Found ${trackIds.length} track IDs from lakh-selected/\n`);
    }
    
    // If still none, extract from lakh-songs.json
    if (trackIds.length === 0 && fs.existsSync(lakhSongsFile)) {
        const songs = JSON.parse(fs.readFileSync(lakhSongsFile, 'utf8'));
        console.log(`   Scanning ${songs.length} songs for track IDs...\n`);
        
        for (const song of songs) {
            // Look for track ID pattern in title
            const match = song.title.match(/([A-Z]{2}[A-Z0-9]{16})/);
            if (match) {
                trackIds.push(match[1]);
            }
        }
        console.log(`✓ Extracted ${trackIds.length} track IDs from song titles\n`);
    }
    
    return [...new Set(trackIds)]; // Remove duplicates
}

async function main() {
    const tracksFile = path.join(__dirname, 'lakh-dataset', 'unique_tracks.txt');
    const metadataFile = path.join(__dirname, 'lakh-dataset', 'track_metadata.json');
    
    console.log('\n' + '='.repeat(60));
    console.log('🎵 MILLION SONG DATASET METADATA FETCHER');
    console.log('='.repeat(60));
    console.log('\n');
    
    // Download tracks file if not exists
    if (!fs.existsSync(tracksFile)) {
        try {
            await downloadMSDTracks(tracksFile);
        } catch (error) {
            console.error('\n❌ Download failed:', error.message);
            console.log('\n💡 You can download it manually from:');
            console.log('   http://millionsongdataset.com/sites/default/files/AdditionalFiles/unique_tracks.txt');
            console.log(`\n   Save it to: ${tracksFile}\n`);
            process.exit(1);
        }
    } else {
        console.log('✅ Using existing unique_tracks.txt\n');
    }
    
    // Get track IDs
    const trackIds = getTrackIds();
    
    if (trackIds.length === 0) {
        console.error('❌ No track IDs found. Unable to fetch metadata.\n');
        process.exit(1);
    }
    
    // Parse tracks file and extract metadata
    await parseTracksFile(tracksFile, trackIds, metadataFile);
    
    console.log('='.repeat(60));
    console.log('✨ COMPLETE!');
    console.log('='.repeat(60));
    console.log(`\nMetadata file: ${metadataFile}`);
    console.log(`\nNext: Update fix-lakh-titles.js to use this metadata\n`);
}

main().catch(console.error);
