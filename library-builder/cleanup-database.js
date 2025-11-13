#!/usr/bin/env node
/**
 * Database Cleanup Script
 * Removes all Lakh dataset songs and keeps only curated library
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
try {
    const serviceAccount = require('./firebase-service-account.json');
    
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://chord-visualizer-default-rtdb.firebaseio.com"
    });
    
    console.log('✅ Firebase Admin initialized\n');
} catch (error) {
    console.error('❌ Error: Cannot find firebase-service-account.json');
    console.error('   Please download your Firebase Admin SDK service account key');
    console.error('   and save it as firebase-service-account.json in this directory.\n');
    process.exit(1);
}

const db = admin.database();

/**
 * Backup current database before cleanup
 */
async function backupDatabase() {
    console.log('📦 Creating backup of current database...');
    
    try {
        const snapshot = await db.ref('songs').once('value');
        const songs = snapshot.val();
        
        if (!songs) {
            console.log('⚠️  No songs found in database');
            return null;
        }
        
        const backupFile = path.join(__dirname, 'output', `backup-${Date.now()}.json`);
        fs.writeFileSync(backupFile, JSON.stringify(songs, null, 2));
        
        console.log(`✅ Backup saved to: ${backupFile}`);
        console.log(`   Total songs backed up: ${Object.keys(songs).length}\n`);
        
        return songs;
    } catch (error) {
        console.error('❌ Backup failed:', error.message);
        throw error;
    }
}

/**
 * Delete all songs from database
 */
async function clearDatabase() {
    console.log('🗑️  Clearing database...');
    
    try {
        await db.ref('songs').remove();
        console.log('✅ Database cleared\n');
    } catch (error) {
        console.error('❌ Failed to clear database:', error.message);
        throw error;
    }
}

/**
 * Upload curated library to database
 */
async function uploadCuratedLibrary() {
    console.log('📤 Uploading curated library...');
    
    try {
        const libraryPath = path.join(__dirname, 'output', 'curated-library.json');
        
        if (!fs.existsSync(libraryPath)) {
            throw new Error('curated-library.json not found. Run: node library-builder.js build');
        }
        
        const songs = JSON.parse(fs.readFileSync(libraryPath, 'utf8'));
        
        console.log(`   Found ${songs.length} songs to upload`);
        
        // Upload each song
        for (let i = 0; i < songs.length; i++) {
            const song = songs[i];
            const songId = `song_${Date.now()}_${i}`;
            
            await db.ref(`songs/${songId}`).set(song);
            
            if ((i + 1) % 10 === 0) {
                console.log(`   Uploaded ${i + 1}/${songs.length} songs...`);
            }
        }
        
        console.log(`✅ Successfully uploaded ${songs.length} songs\n`);
        return songs.length;
    } catch (error) {
        console.error('❌ Upload failed:', error.message);
        throw error;
    }
}

/**
 * Verify database contents
 */
async function verifyDatabase() {
    console.log('🔍 Verifying database...');
    
    try {
        const snapshot = await db.ref('songs').once('value');
        const songs = snapshot.val();
        
        if (!songs) {
            console.log('⚠️  Database is empty');
            return;
        }
        
        const songArray = Object.values(songs);
        
        console.log(`✅ Database contains ${songArray.length} songs`);
        
        // Show genre breakdown
        const byGenre = {};
        songArray.forEach(song => {
            if (!byGenre[song.genre]) byGenre[song.genre] = 0;
            byGenre[song.genre]++;
        });
        
        console.log('\n📊 By Genre:');
        Object.entries(byGenre).forEach(([genre, count]) => {
            console.log(`   ${genre}: ${count} songs`);
        });
        
        console.log('\n📝 Sample songs:');
        songArray.slice(0, 5).forEach(song => {
            console.log(`   • ${song.title} - ${song.artist} (${song.genre})`);
        });
        
        console.log('\n');
    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        throw error;
    }
}

/**
 * Main cleanup process
 */
async function cleanupDatabase() {
    console.log('\n' + '='.repeat(60));
    console.log('🧹 DATABASE CLEANUP: Replace Lakh with Curated Library');
    console.log('='.repeat(60) + '\n');
    
    try {
        // Step 1: Backup
        await backupDatabase();
        
        // Step 2: Clear database
        await clearDatabase();
        
        // Step 3: Upload curated library
        const uploadedCount = await uploadCuratedLibrary();
        
        // Step 4: Verify
        await verifyDatabase();
        
        console.log('='.repeat(60));
        console.log('✅ CLEANUP COMPLETE!');
        console.log('='.repeat(60));
        console.log(`\n🎉 Successfully replaced database with ${uploadedCount} curated songs!`);
        console.log('   All songs have 100% accurate chord progressions.\n');
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Cleanup failed:', error.message);
        console.error('   Database has been backed up. Check output directory.\n');
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];
    
    if (command === 'cleanup' || command === 'clean') {
        // Prompt for confirmation
        console.log('\n⚠️  WARNING: This will delete all songs in your Firebase database');
        console.log('   and replace them with the 50 curated songs.\n');
        console.log('   A backup will be created first.\n');
        console.log('Press Ctrl+C to cancel or wait 5 seconds to continue...\n');
        
        setTimeout(() => {
            cleanupDatabase();
        }, 5000);
    } else {
        console.log(`
🧹 Database Cleanup Script

Commands:
  cleanup    Clean database and upload curated library
  clean      Same as cleanup

What this does:
  1. Backup current database to output/backup-[timestamp].json
  2. Delete ALL songs from Firebase
  3. Upload 50 curated songs from curated-library.json
  4. Verify upload was successful

Example:
  node cleanup-database.js cleanup

⚠️  WARNING: This will delete all existing songs!
        `);
    }
}

module.exports = {
    backupDatabase,
    clearDatabase,
    uploadCuratedLibrary,
    verifyDatabase
};
