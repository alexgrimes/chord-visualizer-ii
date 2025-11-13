// Process Lakh MIDI files
const { batchProcessMIDIFiles } = require('./midi-to-song-converter');

async function processLakhLibrary() {
    console.log('Starting Lakh MIDI processing...\n');
    
    try {
        await batchProcessMIDIFiles('./lakh-dataset/filtered-midis', './output/lakh-songs.json');
        console.log('\n✅ Processing complete!');
        console.log('Songs saved to: ./output/lakh-songs.json');
        console.log('\nNext step: Run "node firebase-uploader.js" to upload to Firebase');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

processLakhLibrary();
