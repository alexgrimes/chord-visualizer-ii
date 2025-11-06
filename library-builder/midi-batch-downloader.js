// Automated MIDI File Downloader
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const songLibrary = [
    // CLASSIC ROCK - Beatles
    { id: 1, title: 'Hey Jude', artist: 'The Beatles', url: 'https://bitmidi.com/the-beatles-hey-jude-k-mid', genre: 'Classic Rock' },
    { id: 2, title: 'Let It Be', artist: 'The Beatles', url: 'https://bitmidi.com/the-beatles-let-it-be-mid', genre: 'Classic Rock' },
    { id: 3, title: 'Yesterday', artist: 'The Beatles', url: 'https://bitmidi.com/the-beatles-yesterday-mid', genre: 'Classic Rock' },
    { id: 4, title: 'Come Together', artist: 'The Beatles', url: 'https://bitmidi.com/the-beatles-come-together-mid', genre: 'Classic Rock' },
    { id: 5, title: 'Here Comes the Sun', artist: 'The Beatles', url: 'https://bitmidi.com/the-beatles-here-comes-the-sun-mid', genre: 'Classic Rock' },
    { id: 11, title: 'Friend of the Devil', artist: 'Grateful Dead', url: 'https://bitmidi.com/grateful-dead-friend-of-the-devil-mid', genre: 'Classic Rock' },
    { id: 16, title: 'Stairway to Heaven', artist: 'Led Zeppelin', url: 'https://bitmidi.com/stairway-to-heaven-mid', genre: 'Classic Rock' },
    { id: 19, title: 'Wish You Were Here', artist: 'Pink Floyd', url: 'https://bitmidi.com/pink-floyd-wish-you-were-here-mid', genre: 'Classic Rock' },
    { id: 25, title: 'Hotel California', artist: 'Eagles', url: 'https://bitmidi.com/hotel-california-mid', genre: 'Classic Rock' },
    { id: 31, title: 'Autumn Leaves', artist: 'Joseph Kosma', url: 'https://bitmidi.com/autumn-leaves-mid', genre: 'Jazz' },
    { id: 33, title: 'Take Five', artist: 'Dave Brubeck', url: 'https://bitmidi.com/take-five-dave-brubeck-mid', genre: 'Jazz' },
    { id: 36, title: 'Fly Me to the Moon', artist: 'Frank Sinatra', url: 'https://bitmidi.com/fly-me-to-the-moon-mid', genre: 'Jazz' },
    { id: 63, title: 'Wonderwall', artist: 'Oasis', url: 'https://bitmidi.com/wonderwall-mid', genre: 'Pop' },
    { id: 68, title: 'Imagine', artist: 'John Lennon', url: 'https://bitmidi.com/imagine-mid', genre: 'Pop' },
];

function downloadMIDI(song, outputDir) {
    return new Promise((resolve, reject) => {
        const fileName = `${song.artist.replace(/[^a-z0-9]/gi, '_')}-${song.title.replace(/[^a-z0-9]/gi, '_')}.mid`;
        const filePath = path.join(outputDir, fileName);
        
        if (fs.existsSync(filePath)) {
            console.log(`✓ Already exists: ${song.title}`);
            return resolve({ song, filePath, status: 'exists' });
        }
        
        console.log(`Downloading: ${song.title} by ${song.artist}...`);
        
        const url = new URL(song.url);
        const protocol = url.protocol === 'https:' ? https : http;
        
        const request = protocol.get(song.url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                downloadMIDI({ ...song, url: response.headers.location }, outputDir)
                    .then(resolve).catch(reject);
                return;
            }
            
            if (response.statusCode !== 200) {
                reject(new Error(`Failed: ${response.statusCode}`));
                return;
            }
            
            const fileStream = fs.createWriteStream(filePath);
            response.pipe(fileStream);
            
            fileStream.on('finish', () => {
                fileStream.close();
                console.log(`✓ Downloaded: ${song.title}`);
                resolve({ song, filePath, status: 'downloaded' });
            });
            
            fileStream.on('error', (err) => {
                fs.unlink(filePath, () => {});
                reject(err);
            });
        });
        
        request.on('error', reject);
        request.setTimeout(30000, () => {
            request.abort();
            reject(new Error('Timeout'));
        });
    });
}

async function downloadAllMIDIs(outputDir = './midi-library', concurrency = 3) {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    console.log(`Starting download of ${songLibrary.length} songs...\n`);
    
    const results = { successful: [], failed: [], exists: [] };
    
    for (let i = 0; i < songLibrary.length; i += concurrency) {
        const batch = songLibrary.slice(i, i + concurrency);
        
        const promises = batch.map(song => 
            downloadMIDI(song, outputDir)
                .then(result => {
                    if (result.status === 'exists') results.exists.push(result);
                    else results.successful.push(result);
                    return result;
                })
                .catch(error => {
                    console.error(`✗ Failed: ${song.title}`);
                    results.failed.push({ song, error: error.message });
                    return null;
                })
        );
        
        await Promise.all(promises);
        if (i + concurrency < songLibrary.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('DOWNLOAD SUMMARY');
    console.log('='.repeat(50));
    console.log(`✓ Downloaded: ${results.successful.length}`);
    console.log(`✓ Already existed: ${results.exists.length}`);
    console.log(`✗ Failed: ${results.failed.length}`);
    
    const reportPath = path.join(outputDir, 'download-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\nReport saved to: ${reportPath}`);
    
    return results;
}

if (require.main === module) {
    downloadAllMIDIs('./midi-library', 3)
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { downloadMIDI, downloadAllMIDIs, songLibrary };
