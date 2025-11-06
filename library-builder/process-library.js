// Process all downloaded MIDI files
const { batchProcessMIDIFiles } = require('./midi-to-song-converter');

async function processLibrary() {
    console.log('Starting MIDI processing...\n');
    
    try {
        await batchProcessMIDIFiles('./midi-library', './output/songs.json');
        console.log('\n✅ Processing complete!');
        console.log('Songs saved to: ./output/songs.json');
        console.log('\nNext step: Run "node firebase-uploader.js" to upload to Firebase');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

processLibrary();
