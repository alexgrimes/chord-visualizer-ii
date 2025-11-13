#!/usr/bin/env node
/**
 * Download Better MIDI Files
 * Searches BitMidi.com and downloads replacements for bad MIDI files
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Songs that need better MIDI files
const SONGS_TO_REPLACE = [
    { artist: 'Eagles', title: 'Hotel California', reason: 'Wrong key and chords', currentFile: '25_Eagles-Hotel_California.mid' },
    { artist: 'B.B. King', title: 'The Thrill Is Gone', reason: 'Melody only', currentFile: '81_B_B__King-The_Thrill_Is_Gone.mid' },
    // Add more as discovered
];

/**
 * Search BitMidi for a song
 */
async function searchBitMidi(artist, title) {
    const query = encodeURIComponent(`${artist} ${title}`);
    const searchUrl = `https://bitmidi.com/search?q=${query}`;
    
    console.log(`🔍 Searching BitMidi: ${artist} - ${title}`);
    
    return new Promise((resolve, reject) => {
        https.get(searchUrl, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                // Parse HTML for MIDI download links
                const midiLinks = [];
                const regex = /<a[^>]+href="(\/[^"]+\.mid)"[^>]*>([^<]+)<\/a>/gi;
                let match;
                
                while ((match = regex.exec(data)) !== null) {
                    midiLinks.push({
                        url: 'https://bitmidi.com' + match[1],
                        title: match[2].trim()
                    });
                }
                
                resolve(midiLinks);
            });
        }).on('error', reject);
    });
}

/**
 * Download MIDI file
 */
async function downloadMidi(url, outputPath) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const client = urlObj.protocol === 'https:' ? https : http;
        
        client.get(url, (res) => {
            // Follow redirects
            if (res.statusCode === 302 || res.statusCode === 301) {
                return downloadMidi(res.headers.location, outputPath)
                    .then(resolve)
                    .catch(reject);
            }
            
            const file = fs.createWriteStream(outputPath);
            res.pipe(file);
            
            file.on('finish', () => {
                file.close();
                resolve(outputPath);
            });
            
            file.on('error', (err) => {
                fs.unlink(outputPath, () => {});
                reject(err);
            });
        }).on('error', reject);
    });
}

/**
 * Main function
 */
async function findBetterMidis() {
    console.log('\n' + '='.repeat(60));
    console.log('🔄 DOWNLOADING BETTER MIDI FILES');
    console.log('='.repeat(60));
    console.log(`\nSearching for ${SONGS_TO_REPLACE.length} replacement files...\n`);
    
    const outputDir = './midi-library-replacements';
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const results = [];
    
    for (let i = 0; i < SONGS_TO_REPLACE.length; i++) {
        const song = SONGS_TO_REPLACE[i];
        
        console.log(`\n[${i + 1}/${SONGS_TO_REPLACE.length}] ${song.artist} - ${song.title}`);
        console.log(`Reason: ${song.reason}`);
        console.log(`Replacing: ${song.currentFile}`);
        console.log('-'.repeat(60));
        
        try {
            const midiLinks = await searchBitMidi(song.artist, song.title);
            
            if (midiLinks.length === 0) {
                console.log(`❌ No results found`);
                results.push({ ...song, success: false });
                continue;
            }
            
            console.log(`✓ Found ${midiLinks.length} results:`);
            midiLinks.slice(0, 3).forEach((link, idx) => {
                console.log(`   ${idx + 1}. ${link.title}`);
            });
            
            // Download best match
            const best = midiLinks[0];
            const outputPath = path.join(outputDir, song.currentFile);
            
            console.log(`\n📥 Downloading: ${best.title}...`);
            await downloadMidi(best.url, outputPath);
            console.log(`✅ Saved to: ${outputPath}`);
            
            results.push({ ...song, success: true, path: outputPath });
            
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
            results.push({ ...song, success: false, error: error.message });
        }
        
        // Be nice to the server
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('� SUMMARY');
    console.log('='.repeat(60));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`\n✅ Downloaded: ${successful.length}/${results.length}`);
    
    if (successful.length > 0) {
        console.log(`\n📁 New files in: ${outputDir}/`);
        successful.forEach(s => {
            console.log(`   • ${s.currentFile}`);
        });
    }
    
    if (failed.length > 0) {
        console.log(`\n❌ Failed:`);
        failed.forEach(f => {
            console.log(`   • ${f.artist} - ${f.title}`);
        });
    }
    
    console.log(`\n📝 Next steps:`);
    console.log(`1. Listen to files in ${outputDir}/ to verify quality`);
    console.log(`2. Move good ones to midi-library/:`);
    console.log(`   mv ${outputDir}/*.mid midi-library/`);
    console.log(`3. Re-run converter:`);
    console.log(`   node midi-to-song-converter.js`);
    console.log(`4. Upload updated songs:`);
    console.log(`   start force-update-uploader.html\n`);
}

// Run
if (require.main === module) {
    findBetterMidis().catch(console.error);
}

module.exports = { searchBitMidi, downloadMidi };
            });
        });
        
        if (uniqueChords.size < 3) {
            problems.push(`Only ${uniqueChords.size} unique chords`);
        }
        
        // Suspicious patterns
        if (song.timeSignature === '12/8' && song.key === 'G') {
            problems.push('Suspicious 12/8 + G major (likely wrong)');
        }
        
        // Too many sections (likely bad sectioning)
        if (song.sections && song.sections.length > 15) {
            problems.push(`Too many sections (${song.sections.length})`);
        }
        
        if (problems.length > 0) {
            issues.push({
                title: song.title,
                artist: song.artist,
                key: song.key,
                problems: problems
            });
        }
    });
    
    // Display issues
    console.log(`📊 Total songs analyzed: ${songs.length}`);
    console.log(`⚠️  Songs with issues: ${issues.length}\n`);
    
    if (issues.length > 0) {
        console.log('Issues found:\n');
        issues.forEach((song, i) => {
            console.log(`${i + 1}. ${song.title} by ${song.artist}`);
            console.log(`   Key: ${song.key}`);
            song.problems.forEach(p => console.log(`   ⚠️  ${p}`));
            console.log();
        });
    }
    
    // Known bad files
    console.log('\n' + '='.repeat(60));
    console.log('📋 KNOWN BAD FILES (Blacklisted)');
    console.log('='.repeat(60) + '\n');
    
    Object.entries(BAD_FILES).forEach(([filename, info]) => {
        const name = filename.split('_').slice(1).join('_').replace(/-/g, ' - ');
        console.log(`❌ ${name}`);
        console.log(`   Issue: ${info.issue}`);
        console.log(`   Should be: ${info.correctKey} - ${info.correctProgression}`);
        console.log(`   Fix: ${info.suggestedSource}`);
        console.log();
    });
    
    // Recommendations
    console.log('\n' + '='.repeat(60));
    console.log('💡 RECOMMENDATIONS');
    console.log('='.repeat(60) + '\n');
    
    console.log('1. Better MIDI Sources:');
    console.log('   • https://freemidi.org/ - Large collection, mixed quality');
    console.log('   • https://www.midiworld.com/ - Curated MIDIs');
    console.log('   • https://bitmidi.com/ - Modern interface, good search');
    console.log('   • Search "song name backing track MIDI" for band arrangements\n');
    
    console.log('2. Quick Fixes:');
    console.log(`   • Delete ${issues.length} problem songs from midi-library/`);
    console.log('   • Download better versions from suggested sources');
    console.log('   • Re-run converter: node midi-to-song-converter.js\n');
    
    console.log('3. Quality Checks:');
    console.log('   • Preview MIDIs before downloading (most sites have players)');
    console.log('   • Look for "band" or "full" arrangements, not melody-only');
    console.log('   • Check comments/ratings on MIDI sites\n');
    
    // Generate delete commands
    if (issues.length > 0) {
        console.log('\n' + '='.repeat(60));
        console.log('🗑️  DELETE COMMANDS (PowerShell)');
        console.log('='.repeat(60) + '\n');
        
        console.log('# Delete problem files:\n');
        issues.forEach(song => {
            const searchPattern = `*${song.artist.split(' ')[0]}*${song.title.split(' ')[0]}*.mid`;
            console.log(`Remove-Item -Path "midi-library/${searchPattern}" -ErrorAction SilentlyContinue`);
        });
    }
    
    console.log('\n✅ Analysis complete!\n');
}

// Run analysis
analyzeLibrary();
