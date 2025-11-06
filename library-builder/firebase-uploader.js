// Firebase Upload Script
// Uploads converted songs to Firebase library

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
// You'll need to download your service account key from Firebase Console
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/**
 * Upload songs to Firebase library
 */
async function uploadSongsToFirebase(songsFilePath, options = {}) {
    const {
        collection = 'library_songs',
        batchSize = 10,
        dryRun = false
    } = options;
    
    console.log('Reading songs file...');
    const songs = JSON.parse(fs.readFileSync(songsFilePath, 'utf8'));
    
    console.log(`Found ${songs.length} songs to upload`);
    console.log(`Collection: ${collection}`);
    console.log(`Dry run: ${dryRun ? 'YES' : 'NO'}\n`);
    
    if (dryRun) {
        console.log('DRY RUN - No data will be written to Firebase');
        songs.forEach((song, i) => {
            console.log(`${i + 1}. ${song.title} by ${song.artist} (${song.genre})`);
        });
        return;
    }
    
    const results = {
        successful: [],
        failed: [],
        skipped: []
    };
    
    // Process in batches
    for (let i = 0; i < songs.length; i += batchSize) {
        const batch = songs.slice(i, i + batchSize);
        console.log(`\nProcessing batch ${Math.floor(i / batchSize) + 1} (songs ${i + 1}-${i + batch.length})...`);
        
        const promises = batch.map(song => uploadSong(song, collection));
        const batchResults = await Promise.allSettled(promises);
        
        batchResults.forEach((result, index) => {
            const song = batch[index];
            
            if (result.status === 'fulfilled') {
                if (result.value.status === 'skipped') {
                    results.skipped.push(song);
                    console.log(`⊘ Skipped: ${song.title} (already exists)`);
                } else {
                    results.successful.push(song);
                    console.log(`✓ Uploaded: ${song.title}`);
                }
            } else {
                results.failed.push({ song, error: result.reason.message });
                console.error(`✗ Failed: ${song.title} - ${result.reason.message}`);
            }
        });
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('UPLOAD SUMMARY');
    console.log('='.repeat(50));
    console.log(`✓ Successfully uploaded: ${results.successful.length}`);
    console.log(`⊘ Skipped (already exist): ${results.skipped.length}`);
    console.log(`✗ Failed: ${results.failed.length}`);
    console.log(`Total: ${songs.length} songs`);
    
    if (results.failed.length > 0) {
        console.log('\nFailed uploads:');
        results.failed.forEach(({ song, error }) => {
            console.log(`  - ${song.title}: ${error}`);
        });
    }
    
    return results;
}

/**
 * Upload a single song document
 */
async function uploadSong(song, collectionName) {
    // Generate document ID from title and artist
    const docId = generateDocId(song.title, song.artist);
    
    const docRef = db.collection(collectionName).doc(docId);
    
    // Check if already exists
    const doc = await docRef.get();
    if (doc.exists) {
        return { status: 'skipped', id: docId };
    }
    
    // Prepare document data
    const songDocument = {
        // Metadata
        title: song.title || 'Untitled',
        artist: song.artist || 'Unknown',
        genre: song.genre || 'Unknown',
        year: song.year || null,
        
        // Music info
        key: song.key || 'C',
        timeSignature: song.timeSignature || '4/4',
        tempo: song.tempo || 120,
        
        // Sections
        sections: song.sections || [],
        
        // Legal
        copyrightStatus: 'chord_progression_only',
        copyright: song.copyright || null,
        disclaimer: 'Chord progression only - for educational use',
        
        // Source
        source: 'midi',
        midiFile: song.midiFile || null,
        
        // Metadata
        difficulty: calculateDifficulty(song),
        totalBars: calculateTotalBars(song.sections),
        tags: generateTags(song),
        
        // Engagement (initialize to 0)
        downloads: 0,
        favorites: 0,
        rating: 0,
        ratingCount: 0,
        
        // Admin
        verified: true,
        status: 'active',
        submittedBy: 'admin',
        dateAdded: admin.firestore.FieldValue.serverTimestamp(),
        lastModified: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Upload
    await docRef.set(songDocument);
    
    return { status: 'uploaded', id: docId };
}

/**
 * Generate document ID from title and artist
 */
function generateDocId(title, artist) {
    const slug = `${artist}-${title}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    
    return slug;
}

/**
 * Calculate difficulty based on chord complexity
 */
function calculateDifficulty(song) {
    if (!song.sections || song.sections.length === 0) {
        return 'Beginner';
    }
    
    let complexityScore = 0;
    
    // Count unique chords
    const allChords = song.sections.flatMap(section => 
        section.measures.map(m => m.chord.symbol)
    );
    const uniqueChords = new Set(allChords);
    complexityScore += uniqueChords.size;
    
    // Check for complex chords
    allChords.forEach(chord => {
        if (chord.includes('maj7') || chord.includes('M7')) complexityScore += 1;
        if (chord.includes('m7b5') || chord.includes('ø')) complexityScore += 2;
        if (chord.includes('dim7') || chord.includes('°7')) complexityScore += 2;
        if (chord.includes('9') || chord.includes('11') || chord.includes('13')) complexityScore += 1;
    });
    
    // Check for modulations
    const keys = song.sections.map(s => s.key).filter(k => k);
    if (new Set(keys).size > 1) {
        complexityScore += 5;
    }
    
    // Determine difficulty
    if (complexityScore < 10) return 'Beginner';
    if (complexityScore < 20) return 'Intermediate';
    return 'Advanced';
}

/**
 * Calculate total bars in song
 */
function calculateTotalBars(sections) {
    if (!sections) return 0;
    return sections.reduce((total, section) => total + (section.bars || 0), 0);
}

/**
 * Generate search tags
 */
function generateTags(song) {
    const tags = [];
    
    // Genre
    if (song.genre) tags.push(song.genre.toLowerCase());
    
    // Artist
    if (song.artist) {
        tags.push(song.artist.toLowerCase());
        tags.push(...song.artist.toLowerCase().split(/\s+/));
    }
    
    // Key
    if (song.key) {
        const keyLower = song.key.toLowerCase();
        tags.push(keyLower);
        if (keyLower.includes('minor') || keyLower.includes('m')) {
            tags.push('minor');
        } else {
            tags.push('major');
        }
    }
    
    // Common descriptors
    if (song.title) {
        const titleLower = song.title.toLowerCase();
        if (titleLower.includes('blues')) tags.push('blues');
        if (titleLower.includes('love')) tags.push('love song');
        if (titleLower.includes('ballad')) tags.push('ballad');
    }
    
    // Deduplicate
    return [...new Set(tags)];
}

/**
 * Update existing song
 */
async function updateSong(songId, updates, collectionName = 'library_songs') {
    const docRef = db.collection(collectionName).doc(songId);
    
    await docRef.update({
        ...updates,
        lastModified: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✓ Updated: ${songId}`);
}

/**
 * Delete song
 */
async function deleteSong(songId, collectionName = 'library_songs') {
    const docRef = db.collection(collectionName).doc(songId);
    await docRef.delete();
    console.log(`✓ Deleted: ${songId}`);
}

/**
 * List all songs in library
 */
async function listAllSongs(collectionName = 'library_songs') {
    const snapshot = await db.collection(collectionName).get();
    
    console.log(`\nTotal songs in library: ${snapshot.size}\n`);
    
    snapshot.forEach(doc => {
        const song = doc.data();
        console.log(`- ${song.title} by ${song.artist} (${song.genre})`);
    });
}

/**
 * Search songs
 */
async function searchSongs(query, collectionName = 'library_songs') {
    const snapshot = await db.collection(collectionName)
        .where('tags', 'array-contains', query.toLowerCase())
        .get();
    
    const results = [];
    snapshot.forEach(doc => {
        results.push({ id: doc.id, ...doc.data() });
    });
    
    return results;
}

/**
 * Backup library to JSON
 */
async function backupLibrary(outputPath, collectionName = 'library_songs') {
    console.log('Backing up library...');
    
    const snapshot = await db.collection(collectionName).get();
    const songs = [];
    
    snapshot.forEach(doc => {
        songs.push({
            id: doc.id,
            ...doc.data()
        });
    });
    
    fs.writeFileSync(outputPath, JSON.stringify(songs, null, 2));
    console.log(`✓ Backed up ${songs.length} songs to ${outputPath}`);
}

// ============================================
// USAGE EXAMPLES
// ============================================

if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
        case 'upload':
            // node firebase-uploader.js upload ./output/songs.json
            const filePath = args[1] || './output/songs.json';
            uploadSongsToFirebase(filePath)
                .then(() => process.exit(0))
                .catch(err => {
                    console.error('Error:', err);
                    process.exit(1);
                });
            break;
            
        case 'dry-run':
            // node firebase-uploader.js dry-run ./output/songs.json
            const dryRunPath = args[1] || './output/songs.json';
            uploadSongsToFirebase(dryRunPath, { dryRun: true })
                .then(() => process.exit(0))
                .catch(err => {
                    console.error('Error:', err);
                    process.exit(1);
                });
            break;
            
        case 'list':
            // node firebase-uploader.js list
            listAllSongs()
                .then(() => process.exit(0))
                .catch(err => {
                    console.error('Error:', err);
                    process.exit(1);
                });
            break;
            
        case 'backup':
            // node firebase-uploader.js backup ./backup/library.json
            const backupPath = args[1] || './backup/library.json';
            backupLibrary(backupPath)
                .then(() => process.exit(0))
                .catch(err => {
                    console.error('Error:', err);
                    process.exit(1);
                });
            break;
            
        case 'search':
            // node firebase-uploader.js search jazz
            const searchQuery = args[1];
            if (!searchQuery) {
                console.error('Please provide a search query');
                process.exit(1);
            }
            searchSongs(searchQuery)
                .then(results => {
                    console.log(`\nFound ${results.length} results for "${searchQuery}":\n`);
                    results.forEach(song => {
                        console.log(`- ${song.title} by ${song.artist}`);
                    });
                    process.exit(0);
                })
                .catch(err => {
                    console.error('Error:', err);
                    process.exit(1);
                });
            break;
            
        default:
            console.log(`
Firebase Library Uploader

Commands:
  upload <file>     Upload songs from JSON file
  dry-run <file>    Preview upload without writing
  list              List all songs in library
  backup <file>     Backup library to JSON
  search <query>    Search songs by tag

Examples:
  node firebase-uploader.js upload ./output/songs.json
  node firebase-uploader.js dry-run ./output/songs.json
  node firebase-uploader.js list
  node firebase-uploader.js backup ./backup.json
  node firebase-uploader.js search beatles
            `);
            process.exit(0);
    }
}

module.exports = {
    uploadSongsToFirebase,
    uploadSong,
    updateSong,
    deleteSong,
    listAllSongs,
    searchSongs,
    backupLibrary
};
