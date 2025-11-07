// Production MIDI to Song Converter
// Features: Krumhansl-Schmuckler key detection, smart defaults, pattern-based sections, comprehensive chord analysis

const fs = require('fs');
const path = require('path');
const { Midi } = require('@tonejs/midi');

/**
 * Convert MIDI file to song structure
 */
async function convertMIDIToSong(midiFilePath, metadata = {}) {
    try {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🎵 Processing: ${path.basename(midiFilePath)}`);
        console.log('='.repeat(60));
        
        // Read and parse MIDI
        const midiData = fs.readFileSync(midiFilePath);
        const midi = new Midi(midiData);
        
        // Find best track for chord analysis
        const mainTrack = findBestTrack(midi);
        if (!mainTrack) {
            throw new Error('No usable tracks found');
        }
        
        console.log(`✓ Found main track: ${mainTrack.notes.length} notes`);
        
        // Extract time signature with 4/4 default
        let timeSignature = extractTimeSignature(midi);
        
        // Manual overrides for known songs with incorrect MIDI time signatures
        const filename = path.basename(midiFilePath, '.mid');
        const timeSignatureOverrides = {
            '33_Dave_Brubeck-Take_Five': { numerator: 5, denominator: 4, display: '5/4', beatsPerBar: 5 },
            // Add more overrides here as needed
        };
        
        if (timeSignatureOverrides[filename]) {
            timeSignature = timeSignatureOverrides[filename];
            console.log(`⚠️  Time signature overridden to: ${timeSignature.display}`);
        }
        
        console.log(`⏱️  Time: ${timeSignature.display}`);
        
        // Extract tempo
        const tempo = extractTempo(midi);
        console.log(`🎶 Tempo: ${tempo} BPM`);
        
        // Advanced key detection (Krumhansl-Schmuckler algorithm)
        const keyInfo = detectKeyAdvanced(midi);
        console.log(`🎼 Key: ${keyInfo.key} ${keyInfo.mode} (${(keyInfo.confidence * 100).toFixed(0)}% confidence)`);
        
        // Extract chord progression
        const chordProgression = extractChordProgression(mainTrack, timeSignature);
        console.log(`🎸 Chords: ${chordProgression.length} chord changes`);
        
        // Quality validation
        const qualityIssues = validateMIDIQuality(filename, keyInfo, chordProgression, timeSignature);
        
        if (qualityIssues.length > 0) {
            console.log(`❌ SKIPPING - Quality issues detected:`);
            qualityIssues.forEach(issue => console.log(`   • ${issue}`));
            return null;
        }
        
        // Validate: Skip songs with insufficient chord data (melody-only MIDIs)
        if (chordProgression.length < 4) {
            console.log(`⚠️  SKIPPING: Insufficient chord data (${chordProgression.length} chords found)`);
            console.log(`   This MIDI appears to be melody-only, not a chord progression`);
            return null;
        }
        
        // Detect sections with max 32 bars
        const sections = detectSectionsWithMaxLength(chordProgression, timeSignature, 32);
        console.log(`📑 Sections: ${sections.length} (${sections.map(s => s.name).join(', ')})`);
        
        // Calculate difficulty
        const difficulty = calculateDifficulty(chordProgression);
        
        // Generate tags
        const tags = generateTags(metadata.genre, keyInfo, tempo, timeSignature);
        
        // Build song object
        const song = {
            title: metadata.title || path.basename(midiFilePath, '.mid'),
            artist: metadata.artist || 'Unknown',
            genre: metadata.genre || 'Unknown',
            year: metadata.year || null,
            
            // Musical properties
            key: keyInfo.key,
            timeSignature: timeSignature.display,
            tempo: tempo,
            
            // Structure
            sections: sections,
            
            // Metadata
            difficulty: difficulty,
            tags: tags,
            copyrightStatus: 'chord_progression_only',
            verified: false,
            dateAdded: new Date().toISOString()
        };
        
        const totalBars = sections.reduce((sum, s) => sum + s.bars, 0);
        console.log(`✅ Success: ${totalBars} bars total\n`);
        
        return song;
        
    } catch (error) {
        console.error(`\n❌ Failed: ${error.message}\n`);
        throw error;
    }
}

/**
 * Find best track for analysis (prefers bass/chord tracks)
 */
function findBestTrack(midi) {
    let bestTrack = null;
    let bestScore = -1;
    
    midi.tracks.forEach(track => {
        if (track.notes.length === 0) return;
        
        const pitches = track.notes.map(n => n.midi);
        const avgPitch = pitches.reduce((a, b) => a + b, 0) / pitches.length;
        
        // Score: prefer tracks with many notes in bass/chord range (48-72)
        let score = track.notes.length;
        if (avgPitch >= 48 && avgPitch <= 72) score *= 2; // Sweet spot for chords
        if (avgPitch < 48) score *= 1.5; // Bass is good too
        
        if (score > bestScore) {
            bestScore = score;
            bestTrack = track;
        }
    });
    
    return bestTrack;
}

/**
 * Extract time signature with 4/4 default
 */
function extractTimeSignature(midi) {
    const timeSigs = midi.header.timeSignatures;
    
    if (timeSigs && timeSigs.length > 0) {
        const ts = timeSigs[0];
        // Handle both possible property structures
        const numerator = ts.timeSignature ? ts.timeSignature[0] : (ts.numerator || 4);
        const denominator = ts.timeSignature ? ts.timeSignature[1] : (ts.denominator || 4);
        
        return {
            numerator: numerator,
            denominator: denominator,
            display: `${numerator}/${denominator}`,
            beatsPerBar: numerator
        };
    }
    
    // Default to 4/4
    return {
        numerator: 4,
        denominator: 4,
        display: '4/4',
        beatsPerBar: 4
    };
}

/**
 * Extract tempo (first tempo or default to 120)
 */
function extractTempo(midi) {
    const tempos = midi.header.tempos;
    
    if (tempos && tempos.length > 0) {
        return Math.round(tempos[0].bpm);
    }
    
    return 120; // Default
}

/**
 * Advanced key detection using Krumhansl-Schmuckler algorithm
 */
function detectKeyAdvanced(midi) {
    // Krumhansl-Schmuckler key profiles (psychological weightings)
    const majorProfile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
    const minorProfile = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
    
    // Count all pitch classes across all tracks
    const pitchCounts = new Array(12).fill(0);
    let totalNotes = 0;
    
    midi.tracks.forEach(track => {
        track.notes.forEach(note => {
            const pitchClass = note.midi % 12;
            pitchCounts[pitchClass]++;
            totalNotes++;
        });
    });
    
    if (totalNotes === 0) {
        return { key: 'C', mode: 'major', confidence: 0.5 };
    }
    
    // Normalize to distribution
    const distribution = pitchCounts.map(count => count / totalNotes);
    
    // Test all 24 keys (12 major + 12 minor)
    let bestKey = 'C';
    let bestMode = 'major';
    let bestCorrelation = -Infinity;
    
    const noteNames = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
    
    for (let tonic = 0; tonic < 12; tonic++) {
        // Rotate distribution to test this tonic
        const rotated = [...distribution.slice(tonic), ...distribution.slice(0, tonic)];
        
        // Test major
        const majorCorr = pearsonCorrelation(rotated, majorProfile);
        if (majorCorr > bestCorrelation) {
            bestCorrelation = majorCorr;
            bestKey = noteNames[tonic];
            bestMode = 'major';
        }
        
        // Test minor
        const minorCorr = pearsonCorrelation(rotated, minorProfile);
        if (minorCorr > bestCorrelation) {
            bestCorrelation = minorCorr;
            bestKey = noteNames[tonic];
            bestMode = 'minor';
        }
    }
    
    // Normalize correlation to 0-1 confidence
    const confidence = Math.max(0, Math.min(1, (bestCorrelation + 1) / 2));
    
    return {
        key: bestKey,
        mode: bestMode,
        confidence: confidence
    };
}

/**
 * Pearson correlation coefficient
 */
function pearsonCorrelation(x, y) {
    const n = x.length;
    const meanX = x.reduce((a, b) => a + b) / n;
    const meanY = y.reduce((a, b) => a + b) / n;
    
    let numerator = 0;
    let sumXSquared = 0;
    let sumYSquared = 0;
    
    for (let i = 0; i < n; i++) {
        const xDiff = x[i] - meanX;
        const yDiff = y[i] - meanY;
        numerator += xDiff * yDiff;
        sumXSquared += xDiff * xDiff;
        sumYSquared += yDiff * yDiff;
    }
    
    const denominator = Math.sqrt(sumXSquared * sumYSquared);
    return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Extract chord progression from track
 */
function extractChordProgression(track, timeSignature) {
    const chords = [];
    const tolerance = 0.1; // 100ms simultaneity window
    
    // Group notes by time
    const noteGroups = new Map();
    
    track.notes.forEach(note => {
        const quantizedTime = Math.round(note.time / tolerance) * tolerance;
        
        if (!noteGroups.has(quantizedTime)) {
            noteGroups.set(quantizedTime, []);
        }
        
        noteGroups.get(quantizedTime).push(note);
    });
    
    // Analyze each group
    const times = Array.from(noteGroups.keys()).sort((a, b) => a - b);
    
    times.forEach((time, i) => {
        const notes = noteGroups.get(time);
        
        // Only analyze if we have 2+ simultaneous notes (actual chords)
        if (notes.length >= 2) {
            const chord = analyzeChord(notes.map(n => n.midi));
            
            if (chord) {
                const nextTime = i < times.length - 1 ? times[i + 1] : time + 4;
                const duration = nextTime - time;
                
                chords.push({
                    symbol: chord.symbol,
                    root: chord.root,
                    quality: chord.quality,
                    time: time,
                    duration: duration,
                    bar: Math.floor(time / timeSignature.beatsPerBar)
                });
            }
        }
        // Don't create fake chords from single notes - that's inventing music
    });
    
    // Remove consecutive duplicates
    return removeDuplicateChords(chords);
}

/**
 * Analyze chord from MIDI notes
 */
function analyzeChord(midiNotes) {
    // Get unique pitch classes
    const pitchClasses = [...new Set(midiNotes.map(n => n % 12))];
    if (pitchClasses.length < 2) return null;
    
    // Try each note as potential root
    let bestMatch = null;
    let bestScore = 0;
    
    pitchClasses.forEach(root => {
        const intervals = pitchClasses
            .map(pc => (pc - root + 12) % 12)
            .sort((a, b) => a - b);
        
        const match = matchChordPattern(intervals, root);
        if (match && match.score > bestScore) {
            bestScore = match.score;
            bestMatch = match;
        }
    });
    
    return bestMatch;
}

/**
 * Match intervals to chord patterns
 */
function matchChordPattern(intervals, root) {
    const noteNames = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
    const rootName = noteNames[root];
    const pattern = intervals.join(',');
    
    // Comprehensive chord library
    const patterns = {
        // Triads
        '0,4,7': { quality: '', score: 10 },
        '0,3,7': { quality: 'm', score: 10 },
        '0,3,6': { quality: 'dim', score: 9 },
        '0,4,8': { quality: 'aug', score: 9 },
        
        // Sevenths
        '0,4,7,10': { quality: '7', score: 10 },
        '0,4,7,11': { quality: 'maj7', score: 10 },
        '0,3,7,10': { quality: 'm7', score: 10 },
        '0,3,6,10': { quality: 'm7b5', score: 9 },
        '0,3,6,9': { quality: 'dim7', score: 9 },
        '0,3,7,11': { quality: 'mMaj7', score: 8 },
        
        // Suspended
        '0,2,7': { quality: 'sus2', score: 9 },
        '0,5,7': { quality: 'sus4', score: 9 },
        '0,5,7,10': { quality: '7sus4', score: 9 },
        
        // Sixths
        '0,4,7,9': { quality: '6', score: 9 },
        '0,3,7,9': { quality: 'm6', score: 9 },
        
        // Extended (9ths, 11ths, 13ths)
        '0,4,7,10,14': { quality: '9', score: 9 },
        '0,4,7,11,14': { quality: 'maj9', score: 9 },
        '0,3,7,10,14': { quality: 'm9', score: 9 },
        '0,4,7,10,14,17': { quality: '11', score: 8 },
        '0,4,7,10,14,21': { quality: '13', score: 8 },
        
        // Add chords
        '0,4,7,14': { quality: 'add9', score: 8 },
        '0,3,7,14': { quality: 'madd9', score: 8 },
        
        // Altered
        '0,4,7,10,13': { quality: '7b9', score: 8 },
        '0,4,7,10,15': { quality: '7#9', score: 8 },
        '0,4,6,10': { quality: '7b5', score: 7 },
        '0,4,8,10': { quality: '7#5', score: 7 },
        
        // Power chord
        '0,7': { quality: '5', score: 7 }
    };
    
    const match = patterns[pattern];
    
    if (match) {
        return {
            symbol: rootName + match.quality,
            root: rootName,
            quality: match.quality,
            score: match.score
        };
    }
    
    // Default to root major
    return {
        symbol: rootName,
        root: rootName,
        quality: '',
        score: 5
    };
}

/**
 * Remove consecutive duplicate chords
 */
function removeDuplicateChords(chords) {
    const unique = [];
    let lastChord = null;
    
    chords.forEach(chord => {
        if (!lastChord || chord.symbol !== lastChord.symbol || chord.bar !== lastChord.bar) {
            unique.push(chord);
            lastChord = chord;
        }
    });
    
    return unique;
}

/**
 * Detect sections with maximum length (32 bars)
 */
function detectSectionsWithMaxLength(chords, timeSignature, maxBars = 32) {
    if (chords.length === 0) {
        return [{
            name: 'Main',
            bars: 8,
            measures: createEmptyMeasures(8, timeSignature)
        }];
    }
    
    // Convert chords to measures
    const allMeasures = chordProgressionToMeasures(chords, timeSignature);
    
    // Split into sections of max length
    const sections = [];
    let currentSection = [];
    let sectionIndex = 0;
    
    allMeasures.forEach((measure, i) => {
        currentSection.push(measure);
        
        // Create new section if reached max bars or end of song
        if (currentSection.length >= maxBars || i === allMeasures.length - 1) {
            const sectionName = getSectionName(sectionIndex, currentSection.length, sections.length, allMeasures.length);
            
            sections.push({
                name: sectionName,
                bars: currentSection.length,
                key: null,
                measures: currentSection
            });
            
            currentSection = [];
            sectionIndex++;
        }
    });
    
    return sections;
}

/**
 * Convert chord progression to measures
 */
function chordProgressionToMeasures(chords, timeSignature) {
    const measures = [];
    const maxBar = Math.max(...chords.map(c => c.bar), 0);
    
    for (let bar = 0; bar <= maxBar; bar++) {
        const chordsInBar = chords.filter(c => c.bar === bar);
        
        const chordData = chordsInBar.length > 0 ? chordsInBar[0] : null;
        
        measures.push({
            chord: {
                symbol: chordData ? chordData.symbol : 'N.C.',
                root: chordData ? chordData.root : null,
                quality: chordData ? chordData.quality : null,
                notes: []
            },
            timeSignature: timeSignature.display,
            localKey: null
        });
    }
    
    return measures;
}

/**
 * Create empty measures
 */
function createEmptyMeasures(count, timeSignature) {
    const measures = [];
    
    for (let i = 0; i < count; i++) {
        measures.push({
            chord: {
                symbol: 'N.C.',
                root: null,
                quality: null,
                notes: []
            },
            timeSignature: timeSignature.display,
            localKey: null
        });
    }
    
    return measures;
}

/**
 * Get intelligent section name
 */
function getSectionName(index, bars, totalSections, totalBars) {
    // Special cases for first/last sections
    if (index === 0 && bars <= 8) {
        return 'Intro';
    }
    
    if (index === totalSections && bars <= 8) {
        return 'Outro';
    }
    
    // Pattern: Intro -> Verse -> Chorus -> Verse -> Chorus -> Bridge -> Chorus -> Outro
    const patterns = ['Verse', 'Chorus', 'Verse', 'Chorus', 'Bridge', 'Verse', 'Chorus'];
    
    if (index > 0 && index - 1 < patterns.length) {
        return patterns[index - 1];
    }
    
    // Fallback
    return `Section ${index + 1}`;
}

/**
 * Validate MIDI quality
 */
function validateMIDIQuality(filename, keyInfo, chordProgression, timeSignature) {
    const issues = [];
    
    // Blacklist of known bad MIDI files
    const blacklist = [
        '25_Eagles-Hotel_California',  // Wrong key (G instead of Bm), wrong chords
        '81_B_B__King-The_Thrill_Is_Gone', // Melody only
        // Add more as discovered
    ];
    
    if (blacklist.includes(filename)) {
        issues.push('Known bad MIDI file (blacklisted)');
        return issues;
    }
    
    // Check key confidence - should be at least 70%
    if (keyInfo.confidence < 0.70) {
        issues.push(`Low key confidence (${(keyInfo.confidence * 100).toFixed(0)}% - need 70%+)`);
    }
    
    // Check for chord variety - need at least 3 unique chords
    const uniqueChords = new Set(chordProgression.map(c => c.symbol).filter(s => s !== 'N.C.'));
    if (uniqueChords.size < 3) {
        issues.push(`Insufficient chord variety (${uniqueChords.size} unique chords - need 3+)`);
    }
    
    // Check for suspiciously high tempo (likely wrong)
    if (timeSignature.display === '12/8' && keyInfo.key === 'G') {
        // Hotel California pattern - 12/8 in G is likely wrong
        issues.push('Suspicious time signature + key combination');
    }
    
    return issues;
}

/**
 * Calculate difficulty
 */
function calculateDifficulty(chords) {
    const uniqueChords = new Set(chords.map(c => c.symbol));
    const complexChords = chords.filter(c => 
        c.quality && (c.quality.includes('7') || c.quality.includes('9') || 
        c.quality.includes('dim') || c.quality.includes('aug') || 
        c.quality.includes('sus'))
    );
    
    const complexityRatio = chords.length > 0 ? complexChords.length / chords.length : 0;
    
    if (uniqueChords.size <= 4 && complexityRatio < 0.2) return 'Beginner';
    if (uniqueChords.size <= 8 && complexityRatio < 0.4) return 'Intermediate';
    return 'Advanced';
}

/**
 * Generate tags
 */
function generateTags(genre, keyInfo, tempo, timeSignature) {
    const tags = [];
    
    if (genre && genre !== 'Unknown') tags.push(genre);
    if (keyInfo.key) tags.push(`Key of ${keyInfo.key}`);
    if (tempo < 80) tags.push('Slow');
    else if (tempo > 140) tags.push('Fast');
    if (timeSignature.display !== '4/4') tags.push(timeSignature.display);
    
    return tags;
}

/**
 * Batch process multiple MIDI files
 */
async function batchProcessMIDIFiles(inputDir, outputFile) {
    console.log('\n' + '='.repeat(60));
    console.log('🎹 BATCH MIDI PROCESSOR');
    console.log('='.repeat(60));
    
    const files = fs.readdirSync(inputDir)
        .filter(f => f.endsWith('.mid'))
        .sort();
    
    if (files.length === 0) {
        console.log(`\n❌ No MIDI files found in ${inputDir}\n`);
        return [];
    }
    
    console.log(`\nProcessing ${files.length} files...\n`);
    
    const songs = [];
    const errors = [];
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = path.join(inputDir, file);
        
        console.log(`[${i + 1}/${files.length}]`);
        
        // Extract metadata from filename (format: "1_Artist-Title.mid")
        const match = file.match(/^(\d+)_(.+?)-(.+?)\.mid$/);
        
        let metadata = {
            title: file.replace('.mid', ''),
            artist: 'Unknown',
            genre: 'Unknown'
        };
        
        if (match) {
            const [, id, artist, title] = match;
            metadata = {
                title: title.replace(/_/g, ' '),
                artist: artist.replace(/_/g, ' '),
                genre: guessGenre(artist)
            };
        }
        
        try {
            const song = await convertMIDIToSong(filePath, metadata);
            if (song) {
                songs.push(song);
            } else {
                errors.push({ file, error: 'Skipped: Insufficient chord data (melody-only MIDI)' });
            }
        } catch (error) {
            errors.push({ file, error: error.message });
        }
    }
    
    // Save output
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputFile, JSON.stringify(songs, null, 2));
    
    // Summary
    console.log('='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${songs.length}/${files.length}`);
    console.log(`❌ Failed: ${errors.length}`);
    console.log(`📄 Output: ${outputFile}`);
    
    if (errors.length > 0) {
        console.log('\n❌ Errors:');
        errors.forEach(({ file, error }) => {
            console.log(`  - ${file}: ${error}`);
        });
    }
    
    console.log('\n✨ Next: Upload to Firebase');
    console.log(`   start simple-uploader.html\n`);
    
    return songs;
}

/**
 * Guess genre from artist name
 */
function guessGenre(artist) {
    const artistLower = artist.toLowerCase();
    
    if (artistLower.includes('beatles') || artistLower.includes('zeppelin') || artistLower.includes('floyd')) {
        return 'Classic Rock';
    }
    if (artistLower.includes('grateful') || artistLower.includes('dead')) {
        return 'Classic Rock';
    }
    if (artistLower.includes('beethoven') || artistLower.includes('mozart') || artistLower.includes('bach')) {
        return 'Classical';
    }
    if (artistLower.includes('adele') || artistLower.includes('sheeran') || artistLower.includes('legend')) {
        return 'Pop';
    }
    if (artistLower.includes('mario') || artistLower.includes('zelda') || artistLower.includes('nintendo')) {
        return 'Video Game';
    }
    
    return 'Unknown';
}

// CLI
if (require.main === module) {
    const args = process.argv.slice(2);
    const inputDir = args[0] || './midi-library';
    const outputFile = args[1] || './output/songs.json';
    
    batchProcessMIDIFiles(inputDir, outputFile)
        .then(() => process.exit(0))
        .catch(err => {
            console.error('\n💥 Fatal error:', err);
            process.exit(1);
        });
}

module.exports = {
    convertMIDIToSong,
    batchProcessMIDIFiles
};
