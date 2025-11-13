#!/usr/bin/env node
/**
 * Chord Progression Library Builder
 * Researches and creates song library from chord progression data
 * NO MIDI FILES NEEDED - uses web research for chord progressions
 */

const fs = require('fs');
const path = require('path');

/**
 * Master song list to research and build
 * Start with most popular, teachable songs
 */
const SONG_LIST = [
    // BEATLES (Most popular, well-documented)
    { title: 'Hey Jude', artist: 'The Beatles', genre: 'Classic Rock', priority: 1 },
    { title: 'Let It Be', artist: 'The Beatles', genre: 'Classic Rock', priority: 1 },
    { title: 'Yesterday', artist: 'The Beatles', genre: 'Classic Rock', priority: 1 },
    { title: 'Come Together', artist: 'The Beatles', genre: 'Classic Rock', priority: 1 },
    { title: 'Here Comes the Sun', artist: 'The Beatles', genre: 'Classic Rock', priority: 1 },
    { title: 'Blackbird', artist: 'The Beatles', genre: 'Classic Rock', priority: 1 },
    { title: 'While My Guitar Gently Weeps', artist: 'The Beatles', genre: 'Classic Rock', priority: 1 },
    { title: 'Something', artist: 'The Beatles', genre: 'Classic Rock', priority: 1 },
    { title: 'Eleanor Rigby', artist: 'The Beatles', genre: 'Classic Rock', priority: 1 },
    { title: 'Ob-La-Di, Ob-La-Da', artist: 'The Beatles', genre: 'Classic Rock', priority: 2 },
    
    // CLASSIC ROCK
    { title: 'Stairway to Heaven', artist: 'Led Zeppelin', genre: 'Classic Rock', priority: 1 },
    { title: 'Wish You Were Here', artist: 'Pink Floyd', genre: 'Classic Rock', priority: 1 },
    { title: 'Hotel California', artist: 'Eagles', genre: 'Classic Rock', priority: 1 },
    { title: 'Sweet Home Alabama', artist: 'Lynyrd Skynyrd', genre: 'Classic Rock', priority: 1 },
    { title: 'Bohemian Rhapsody', artist: 'Queen', genre: 'Classic Rock', priority: 1 },
    { title: 'Comfortably Numb', artist: 'Pink Floyd', genre: 'Classic Rock', priority: 2 },
    { title: 'Free Bird', artist: 'Lynyrd Skynyrd', genre: 'Classic Rock', priority: 2 },
    { title: 'More Than a Feeling', artist: 'Boston', genre: 'Classic Rock', priority: 2 },
    
    // POP/CONTEMPORARY
    { title: 'Wonderwall', artist: 'Oasis', genre: 'Pop', priority: 1 },
    { title: 'Hallelujah', artist: 'Leonard Cohen', genre: 'Pop', priority: 1 },
    { title: 'Someone Like You', artist: 'Adele', genre: 'Pop', priority: 1 },
    { title: 'Perfect', artist: 'Ed Sheeran', genre: 'Pop', priority: 1 },
    { title: 'All of Me', artist: 'John Legend', genre: 'Pop', priority: 1 },
    { title: 'Piano Man', artist: 'Billy Joel', genre: 'Pop', priority: 1 },
    { title: 'Imagine', artist: 'John Lennon', genre: 'Pop', priority: 1 },
    { title: 'Your Song', artist: 'Elton John', genre: 'Pop', priority: 2 },
    { title: "Don't Stop Believin'", artist: 'Journey', genre: 'Pop', priority: 1 },
    
    // JAZZ STANDARDS
    { title: 'Autumn Leaves', artist: 'Joseph Kosma', genre: 'Jazz', priority: 1 },
    { title: 'Fly Me to the Moon', artist: 'Frank Sinatra', genre: 'Jazz', priority: 1 },
    { title: 'All of Me', artist: 'Gerald Marks', genre: 'Jazz', priority: 1 },
    { title: 'Blue Bossa', artist: 'Kenny Dorham', genre: 'Jazz', priority: 1 },
    { title: 'Take Five', artist: 'Dave Brubeck', genre: 'Jazz', priority: 1 },
    { title: 'So What', artist: 'Miles Davis', genre: 'Jazz', priority: 2 },
    { title: 'All the Things You Are', artist: 'Jerome Kern', genre: 'Jazz', priority: 2 },
    { title: 'Summertime', artist: 'George Gershwin', genre: 'Jazz', priority: 1 },
    { title: 'My Funny Valentine', artist: 'Chet Baker', genre: 'Jazz', priority: 2 },
    
    // FOLK/SINGER-SONGWRITER
    { title: 'Take Me Home, Country Roads', artist: 'John Denver', genre: 'Folk', priority: 1 },
    { title: 'The Sound of Silence', artist: 'Simon & Garfunkel', genre: 'Folk', priority: 1 },
    { title: "Blowin' in the Wind", artist: 'Bob Dylan', genre: 'Folk', priority: 1 },
    { title: 'Fire and Rain', artist: 'James Taylor', genre: 'Folk', priority: 2 },
    { title: 'Heart of Gold', artist: 'Neil Young', genre: 'Folk', priority: 2 },
    
    // BLUES
    { title: '12-Bar Blues in A', artist: 'Traditional', genre: 'Blues', priority: 1 },
    { title: 'The Thrill Is Gone', artist: 'B.B. King', genre: 'Blues', priority: 1 },
    { title: 'Pride and Joy', artist: 'Stevie Ray Vaughan', genre: 'Blues', priority: 2 },
    { title: 'Sweet Home Chicago', artist: 'Robert Johnson', genre: 'Blues', priority: 1 },
    
    // COMMON PROGRESSIONS (Teaching)
    { title: 'I-V-vi-IV Progression', artist: 'Common Progression', genre: 'Teaching', priority: 1 },
    { title: 'I-IV-V Progression', artist: 'Common Progression', genre: 'Teaching', priority: 1 },
    { title: 'ii-V-I Progression', artist: 'Common Progression', genre: 'Teaching', priority: 1 },
    { title: '50s Progression (I-vi-IV-V)', artist: 'Common Progression', genre: 'Teaching', priority: 1 },
    { title: 'Circle of Fifths', artist: 'Theory Exercise', genre: 'Teaching', priority: 1 },
];

/**
 * Song data templates based on research
 * These are SIMPLIFIED progressions for practice - not full transcriptions
 */
const SONG_DATABASE = {
    'Hey Jude': {
        key: 'F',
        mode: 'major',
        timeSignature: '4/4',
        tempo: 73,
        sections: [
            {
                id: 'verse',
                name: 'Verse',
                bars: 8,
                repeat: 1,
                key: 'F',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'F' }, timeSignature: '4/4' },
                    { chord: { symbol: 'C' }, timeSignature: '4/4' },
                    { chord: { symbol: 'C7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Bb' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F' }, timeSignature: '4/4' },
                    { chord: { symbol: 'C' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F' }, timeSignature: '4/4' }
                ]
            },
            {
                id: 'bridge',
                name: 'Bridge',
                bars: 8,
                repeat: 1,
                key: 'F',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'F7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Bb' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Dm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Gm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'C' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F' }, timeSignature: '4/4' },
                    { chord: { symbol: 'C7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    'Let It Be': {
        key: 'C',
        mode: 'major',
        timeSignature: '4/4',
        tempo: 76,
        sections: [
            {
                id: 'verse',
                name: 'Verse',
                bars: 8,
                repeat: 1,
                key: 'C',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'C' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Am' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F' }, timeSignature: '4/4' },
                    { chord: { symbol: 'C' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F' }, timeSignature: '4/4' },
                    { chord: { symbol: 'C' }, timeSignature: '4/4' }
                ]
            },
            {
                id: 'chorus',
                name: 'Chorus',
                bars: 4,
                repeat: 1,
                key: 'C',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'Am' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F' }, timeSignature: '4/4' },
                    { chord: { symbol: 'C' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    'Wonderwall': {
        key: 'F#m',
        mode: 'minor',
        timeSignature: '4/4',
        tempo: 87,
        sections: [
            {
                id: 'verse',
                name: 'Verse',
                bars: 8,
                repeat: 1,
                key: 'F#m',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'F#m' }, timeSignature: '4/4' },
                    { chord: { symbol: 'A' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Esus4' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Esus4' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F#m' }, timeSignature: '4/4' },
                    { chord: { symbol: 'A' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Esus4' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Esus4' }, timeSignature: '4/4' }
                ]
            },
            {
                id: 'chorus',
                name: 'Chorus',
                bars: 8,
                repeat: 1,
                key: 'F#m',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'D' }, timeSignature: '4/4' },
                    { chord: { symbol: 'A' }, timeSignature: '4/4' },
                    { chord: { symbol: 'E' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F#m' }, timeSignature: '4/4' },
                    { chord: { symbol: 'D' }, timeSignature: '4/4' },
                    { chord: { symbol: 'A' }, timeSignature: '4/4' },
                    { chord: { symbol: 'E' }, timeSignature: '4/4' },
                    { chord: { symbol: 'E' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    '12-Bar Blues in A': {
        key: 'A',
        mode: 'major',
        timeSignature: '4/4',
        tempo: 120,
        sections: [
            {
                id: 'blues',
                name: 'Blues Form',
                bars: 12,
                repeat: 1,
                key: 'A',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'A7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'A7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'A7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'A7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'D7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'D7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'A7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'A7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'E7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'D7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'A7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'E7' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    'I-V-vi-IV Progression': {
        key: 'C',
        mode: 'major',
        timeSignature: '4/4',
        tempo: 120,
        sections: [
            {
                id: 'progression',
                name: 'Common Pop Progression',
                bars: 4,
                repeat: 1,
                key: 'C',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'C' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Am' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    'ii-V-I Progression': {
        key: 'C',
        mode: 'major',
        timeSignature: '4/4',
        tempo: 120,
        sections: [
            {
                id: 'progression',
                name: 'Jazz Progression',
                bars: 4,
                repeat: 1,
                key: 'C',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'Dm7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Cmaj7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Cmaj7' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    'Autumn Leaves': {
        key: 'Gm',
        mode: 'minor',
        timeSignature: '4/4',
        tempo: 140,
        sections: [
            {
                id: 'a-section',
                name: 'A Section',
                bars: 8,
                repeat: 1,
                key: 'Gm',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'Cm7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Bbmaj7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Ebmaj7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Am7b5' }, timeSignature: '4/4' },
                    { chord: { symbol: 'D7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Gm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Gm' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    'Yesterday': {
        key: 'F',
        mode: 'major',
        timeSignature: '4/4',
        tempo: 95,
        sections: [
            {
                id: 'verse',
                name: 'Verse',
                bars: 8,
                repeat: 1,
                key: 'F',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'F' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Em7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'A7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Dm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Dm/C' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Bb' }, timeSignature: '4/4' },
                    { chord: { symbol: 'C' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F' }, timeSignature: '4/4' }
                ]
            },
            {
                id: 'bridge',
                name: 'Bridge',
                bars: 4,
                repeat: 1,
                key: 'F',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'Dm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Bb' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    'Hotel California': {
        key: 'Bm',
        mode: 'minor',
        timeSignature: '4/4',
        tempo: 74,
        sections: [
            {
                id: 'verse',
                name: 'Verse',
                bars: 8,
                repeat: 1,
                key: 'Bm',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'Bm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F#' }, timeSignature: '4/4' },
                    { chord: { symbol: 'A' }, timeSignature: '4/4' },
                    { chord: { symbol: 'E' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G' }, timeSignature: '4/4' },
                    { chord: { symbol: 'D' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Em' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F#' }, timeSignature: '4/4' }
                ]
            },
            {
                id: 'chorus',
                name: 'Chorus',
                bars: 4,
                repeat: 1,
                key: 'Bm',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'G' }, timeSignature: '4/4' },
                    { chord: { symbol: 'D' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F#' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Bm' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    'Sweet Home Alabama': {
        key: 'D',
        mode: 'major',
        timeSignature: '4/4',
        tempo: 100,
        sections: [
            {
                id: 'main',
                name: 'Main Riff',
                bars: 4,
                repeat: 1,
                key: 'D',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'D' }, timeSignature: '4/4' },
                    { chord: { symbol: 'C' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G' }, timeSignature: '4/4' }
                ]
            },
            {
                id: 'chorus',
                name: 'Chorus',
                bars: 4,
                repeat: 1,
                key: 'D',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'D' }, timeSignature: '4/4' },
                    { chord: { symbol: 'C' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G' }, timeSignature: '4/4' },
                    { chord: { symbol: 'D' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    'Hallelujah': {
        key: 'C',
        mode: 'major',
        timeSignature: '6/8',
        tempo: 60,
        sections: [
            {
                id: 'verse',
                name: 'Verse',
                bars: 8,
                repeat: 1,
                key: 'C',
                timeSignature: '6/8',
                measures: [
                    { chord: { symbol: 'C' }, timeSignature: '6/8' },
                    { chord: { symbol: 'Am' }, timeSignature: '6/8' },
                    { chord: { symbol: 'C' }, timeSignature: '6/8' },
                    { chord: { symbol: 'Am' }, timeSignature: '6/8' },
                    { chord: { symbol: 'F' }, timeSignature: '6/8' },
                    { chord: { symbol: 'G' }, timeSignature: '6/8' },
                    { chord: { symbol: 'C' }, timeSignature: '6/8' },
                    { chord: { symbol: 'G' }, timeSignature: '6/8' }
                ]
            },
            {
                id: 'chorus',
                name: 'Chorus',
                bars: 4,
                repeat: 1,
                key: 'C',
                timeSignature: '6/8',
                measures: [
                    { chord: { symbol: 'F' }, timeSignature: '6/8' },
                    { chord: { symbol: 'G' }, timeSignature: '6/8' },
                    { chord: { symbol: 'C' }, timeSignature: '6/8' },
                    { chord: { symbol: 'G' }, timeSignature: '6/8' }
                ]
            }
        ]
    },
    
    'Someone Like You': {
        key: 'A',
        mode: 'major',
        timeSignature: '4/4',
        tempo: 67,
        sections: [
            {
                id: 'verse',
                name: 'Verse',
                bars: 4,
                repeat: 1,
                key: 'A',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'A' }, timeSignature: '4/4' },
                    { chord: { symbol: 'C#m' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F#m' }, timeSignature: '4/4' },
                    { chord: { symbol: 'D' }, timeSignature: '4/4' }
                ]
            },
            {
                id: 'chorus',
                name: 'Chorus',
                bars: 4,
                repeat: 1,
                key: 'A',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'A' }, timeSignature: '4/4' },
                    { chord: { symbol: 'E' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F#m' }, timeSignature: '4/4' },
                    { chord: { symbol: 'D' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    'Imagine': {
        key: 'C',
        mode: 'major',
        timeSignature: '4/4',
        tempo: 76,
        sections: [
            {
                id: 'verse',
                name: 'Verse',
                bars: 8,
                repeat: 1,
                key: 'C',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'C' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Cmaj7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F' }, timeSignature: '4/4' },
                    { chord: { symbol: 'C' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Cmaj7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F' }, timeSignature: '4/4' }
                ]
            },
            {
                id: 'chorus',
                name: 'Chorus',
                bars: 4,
                repeat: 1,
                key: 'C',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'F' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Am' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Dm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    'Take Me Home, Country Roads': {
        key: 'A',
        mode: 'major',
        timeSignature: '4/4',
        tempo: 80,
        sections: [
            {
                id: 'verse',
                name: 'Verse',
                bars: 8,
                repeat: 1,
                key: 'A',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'A' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F#m' }, timeSignature: '4/4' },
                    { chord: { symbol: 'E' }, timeSignature: '4/4' },
                    { chord: { symbol: 'D' }, timeSignature: '4/4' },
                    { chord: { symbol: 'A' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F#m' }, timeSignature: '4/4' },
                    { chord: { symbol: 'E' }, timeSignature: '4/4' },
                    { chord: { symbol: 'E' }, timeSignature: '4/4' }
                ]
            },
            {
                id: 'chorus',
                name: 'Chorus',
                bars: 4,
                repeat: 1,
                key: 'A',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'A' }, timeSignature: '4/4' },
                    { chord: { symbol: 'E' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F#m' }, timeSignature: '4/4' },
                    { chord: { symbol: 'D' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    'Fly Me to the Moon': {
        key: 'C',
        mode: 'major',
        timeSignature: '4/4',
        tempo: 120,
        sections: [
            {
                id: 'verse',
                name: 'Verse',
                bars: 8,
                repeat: 1,
                key: 'C',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'Am7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Dm7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Cmaj7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Fmaj7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Bm7b5' }, timeSignature: '4/4' },
                    { chord: { symbol: 'E7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Am7' }, timeSignature: '4/4' }
                ]
            },
            {
                id: 'bridge',
                name: 'Bridge',
                bars: 8,
                repeat: 1,
                key: 'C',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'A7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Dm7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Cmaj7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Am7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'D7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Dm7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G7' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    'The Thrill Is Gone': {
        key: 'Bm',
        mode: 'minor',
        timeSignature: '4/4',
        tempo: 60,
        sections: [
            {
                id: 'verse',
                name: 'Verse',
                bars: 12,
                repeat: 1,
                key: 'Bm',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'Bm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Bm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Bm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Bm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Em' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Em' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Bm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Bm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F#7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Em' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Bm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F#7' }, timeSignature: '4/4' }
                ]
            },
            {
                id: 'chorus',
                name: 'Chorus',
                bars: 4,
                repeat: 1,
                key: 'Bm',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'Bm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Em' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Bm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F#7' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    'Come Together': {
        key: 'Dm',
        mode: 'minor',
        timeSignature: '4/4',
        tempo: 82,
        sections: [
            {
                id: 'verse',
                name: 'Verse',
                bars: 8,
                repeat: 1,
                key: 'Dm',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'Dm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Dm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Dm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Dm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'A' }, timeSignature: '4/4' },
                    { chord: { symbol: 'A' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G' }, timeSignature: '4/4' }
                ]
            },
            {
                id: 'chorus',
                name: 'Chorus',
                bars: 4,
                repeat: 1,
                key: 'Dm',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'Bm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Bm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Dm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Dm' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    'Here Comes the Sun': {
        key: 'A',
        mode: 'major',
        timeSignature: '4/4',
        tempo: 129,
        sections: [
            {
                id: 'chorus',
                name: 'Chorus',
                bars: 4,
                repeat: 1,
                key: 'A',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'A' }, timeSignature: '4/4' },
                    { chord: { symbol: 'D' }, timeSignature: '4/4' },
                    { chord: { symbol: 'E7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'A' }, timeSignature: '4/4' }
                ]
            },
            {
                id: 'bridge',
                name: 'Bridge',
                bars: 8,
                repeat: 1,
                key: 'A',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'F' }, timeSignature: '4/4' },
                    { chord: { symbol: 'C' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G' }, timeSignature: '4/4' },
                    { chord: { symbol: 'D' }, timeSignature: '4/4' },
                    { chord: { symbol: 'A' }, timeSignature: '4/4' },
                    { chord: { symbol: 'A' }, timeSignature: '4/4' },
                    { chord: { symbol: 'E7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'E7' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    'Stairway to Heaven': {
        key: 'Am',
        mode: 'minor',
        timeSignature: '4/4',
        tempo: 72,
        sections: [
            {
                id: 'intro',
                name: 'Intro',
                bars: 8,
                repeat: 1,
                key: 'Am',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'Am' }, timeSignature: '4/4' },
                    { chord: { symbol: 'E/G#' }, timeSignature: '4/4' },
                    { chord: { symbol: 'C/G' }, timeSignature: '4/4' },
                    { chord: { symbol: 'D/F#' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Fmaj7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Am' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Am' }, timeSignature: '4/4' }
                ]
            },
            {
                id: 'verse',
                name: 'Verse',
                bars: 4,
                repeat: 1,
                key: 'Am',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'C' }, timeSignature: '4/4' },
                    { chord: { symbol: 'D' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Fmaj7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Am' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    'Wish You Were Here': {
        key: 'G',
        mode: 'major',
        timeSignature: '4/4',
        tempo: 63,
        sections: [
            {
                id: 'intro',
                name: 'Intro',
                bars: 4,
                repeat: 1,
                key: 'G',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'Em7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Em7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'A7sus4' }, timeSignature: '4/4' }
                ]
            },
            {
                id: 'verse',
                name: 'Verse',
                bars: 8,
                repeat: 1,
                key: 'G',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'C' }, timeSignature: '4/4' },
                    { chord: { symbol: 'D' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Am' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G' }, timeSignature: '4/4' },
                    { chord: { symbol: 'D' }, timeSignature: '4/4' },
                    { chord: { symbol: 'C' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Am' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    'Perfect': {
        key: 'Ab',
        mode: 'major',
        timeSignature: '6/8',
        tempo: 63,
        sections: [
            {
                id: 'verse',
                name: 'Verse',
                bars: 4,
                repeat: 1,
                key: 'Ab',
                timeSignature: '6/8',
                measures: [
                    { chord: { symbol: 'Ab' }, timeSignature: '6/8' },
                    { chord: { symbol: 'Fm7' }, timeSignature: '6/8' },
                    { chord: { symbol: 'Db' }, timeSignature: '6/8' },
                    { chord: { symbol: 'Eb' }, timeSignature: '6/8' }
                ]
            },
            {
                id: 'chorus',
                name: 'Chorus',
                bars: 4,
                repeat: 1,
                key: 'Ab',
                timeSignature: '6/8',
                measures: [
                    { chord: { symbol: 'Ab' }, timeSignature: '6/8' },
                    { chord: { symbol: 'Fm7' }, timeSignature: '6/8' },
                    { chord: { symbol: 'Db' }, timeSignature: '6/8' },
                    { chord: { symbol: 'Eb' }, timeSignature: '6/8' }
                ]
            }
        ]
    },
    
    'Piano Man': {
        key: 'C',
        mode: 'major',
        timeSignature: '3/4',
        tempo: 90,
        sections: [
            {
                id: 'verse',
                name: 'Verse',
                bars: 8,
                repeat: 1,
                key: 'C',
                timeSignature: '3/4',
                measures: [
                    { chord: { symbol: 'C' }, timeSignature: '3/4' },
                    { chord: { symbol: 'G/B' }, timeSignature: '3/4' },
                    { chord: { symbol: 'F/A' }, timeSignature: '3/4' },
                    { chord: { symbol: 'C/G' }, timeSignature: '3/4' },
                    { chord: { symbol: 'F' }, timeSignature: '3/4' },
                    { chord: { symbol: 'C/E' }, timeSignature: '3/4' },
                    { chord: { symbol: 'D7' }, timeSignature: '3/4' },
                    { chord: { symbol: 'G' }, timeSignature: '3/4' }
                ]
            },
            {
                id: 'chorus',
                name: 'Chorus',
                bars: 8,
                repeat: 1,
                key: 'C',
                timeSignature: '3/4',
                measures: [
                    { chord: { symbol: 'C' }, timeSignature: '3/4' },
                    { chord: { symbol: 'Am' }, timeSignature: '3/4' },
                    { chord: { symbol: 'D7' }, timeSignature: '3/4' },
                    { chord: { symbol: 'G' }, timeSignature: '3/4' },
                    { chord: { symbol: 'C' }, timeSignature: '3/4' },
                    { chord: { symbol: 'G/B' }, timeSignature: '3/4' },
                    { chord: { symbol: 'F/A' }, timeSignature: '3/4' },
                    { chord: { symbol: 'G' }, timeSignature: '3/4' }
                ]
            }
        ]
    },
    
    'Blue Bossa': {
        key: 'Cm',
        mode: 'minor',
        timeSignature: '4/4',
        tempo: 140,
        sections: [
            {
                id: 'a-section',
                name: 'A Section',
                bars: 8,
                repeat: 1,
                key: 'Cm',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'Cm7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Cm7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Fm7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Fm7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Dm7b5' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Cm7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Cm7' }, timeSignature: '4/4' }
                ]
            },
            {
                id: 'b-section',
                name: 'B Section',
                bars: 8,
                repeat: 1,
                key: 'Cm',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'Ebm7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Ab7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Dbmaj7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Dbmaj7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Dm7b5' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Cm7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Cm7' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    'Take Five': {
        key: 'Ebm',
        mode: 'minor',
        timeSignature: '5/4',
        tempo: 170,
        sections: [
            {
                id: 'head',
                name: 'Head',
                bars: 8,
                repeat: 1,
                key: 'Ebm',
                timeSignature: '5/4',
                measures: [
                    { chord: { symbol: 'Ebm' }, timeSignature: '5/4' },
                    { chord: { symbol: 'Ebm' }, timeSignature: '5/4' },
                    { chord: { symbol: 'Bbm7' }, timeSignature: '5/4' },
                    { chord: { symbol: 'Bbm7' }, timeSignature: '5/4' },
                    { chord: { symbol: 'Ebm' }, timeSignature: '5/4' },
                    { chord: { symbol: 'Ebm' }, timeSignature: '5/4' },
                    { chord: { symbol: 'Bbm7' }, timeSignature: '5/4' },
                    { chord: { symbol: 'Bbm7' }, timeSignature: '5/4' }
                ]
            },
            {
                id: 'bridge',
                name: 'Bridge',
                bars: 8,
                repeat: 1,
                key: 'Ebm',
                timeSignature: '5/4',
                measures: [
                    { chord: { symbol: 'Abm7' }, timeSignature: '5/4' },
                    { chord: { symbol: 'Db7' }, timeSignature: '5/4' },
                    { chord: { symbol: 'Gbmaj7' }, timeSignature: '5/4' },
                    { chord: { symbol: 'Gbmaj7' }, timeSignature: '5/4' },
                    { chord: { symbol: 'Fm7' }, timeSignature: '5/4' },
                    { chord: { symbol: 'Bb7' }, timeSignature: '5/4' },
                    { chord: { symbol: 'Ebm' }, timeSignature: '5/4' },
                    { chord: { symbol: 'Ebm' }, timeSignature: '5/4' }
                ]
            }
        ]
    },
    
    'The Sound of Silence': {
        key: 'Dm',
        mode: 'minor',
        timeSignature: '4/4',
        tempo: 100,
        sections: [
            {
                id: 'verse',
                name: 'Verse',
                bars: 8,
                repeat: 1,
                key: 'Dm',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'Dm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'C' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Dm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Dm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F' }, timeSignature: '4/4' },
                    { chord: { symbol: 'C' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Dm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Dm' }, timeSignature: '4/4' }
                ]
            },
            {
                id: 'chorus',
                name: 'Chorus',
                bars: 4,
                repeat: 1,
                key: 'Dm',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'F' }, timeSignature: '4/4' },
                    { chord: { symbol: 'C' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Dm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Dm' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    'Sweet Home Chicago': {
        key: 'E',
        mode: 'major',
        timeSignature: '4/4',
        tempo: 120,
        sections: [
            {
                id: 'blues',
                name: 'Blues Form',
                bars: 12,
                repeat: 1,
                key: 'E',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'E7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'E7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'E7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'E7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'A7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'A7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'E7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'E7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'B7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'A7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'E7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'B7' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    'Blackbird': {
        key: 'G',
        mode: 'major',
        timeSignature: '3/4',
        tempo: 96,
        sections: [
            {
                id: 'verse',
                name: 'Verse',
                bars: 8,
                repeat: 1,
                key: 'G',
                timeSignature: '3/4',
                measures: [
                    { chord: { symbol: 'G' }, timeSignature: '3/4' },
                    { chord: { symbol: 'Am7' }, timeSignature: '3/4' },
                    { chord: { symbol: 'G/B' }, timeSignature: '3/4' },
                    { chord: { symbol: 'G' }, timeSignature: '3/4' },
                    { chord: { symbol: 'C' }, timeSignature: '3/4' },
                    { chord: { symbol: 'C#dim' }, timeSignature: '3/4' },
                    { chord: { symbol: 'D' }, timeSignature: '3/4' },
                    { chord: { symbol: 'D#dim' }, timeSignature: '3/4' }
                ]
            },
            {
                id: 'chorus',
                name: 'Chorus',
                bars: 4,
                repeat: 1,
                key: 'G',
                timeSignature: '3/4',
                measures: [
                    { chord: { symbol: 'F' }, timeSignature: '3/4' },
                    { chord: { symbol: 'C/E' }, timeSignature: '3/4' },
                    { chord: { symbol: 'Dm' }, timeSignature: '3/4' },
                    { chord: { symbol: 'C' }, timeSignature: '3/4' }
                ]
            }
        ]
    },
    
    'While My Guitar Gently Weeps': {
        key: 'Am',
        mode: 'minor',
        timeSignature: '4/4',
        tempo: 112,
        sections: [
            {
                id: 'verse',
                name: 'Verse',
                bars: 8,
                repeat: 1,
                key: 'Am',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'Am' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Am/G' }, timeSignature: '4/4' },
                    { chord: { symbol: 'D/F#' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Am' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G' }, timeSignature: '4/4' },
                    { chord: { symbol: 'D' }, timeSignature: '4/4' },
                    { chord: { symbol: 'E' }, timeSignature: '4/4' }
                ]
            },
            {
                id: 'chorus',
                name: 'Chorus',
                bars: 8,
                repeat: 1,
                key: 'Am',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'A' }, timeSignature: '4/4' },
                    { chord: { symbol: 'C#m' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F#m' }, timeSignature: '4/4' },
                    { chord: { symbol: 'C#m' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Bm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'E' }, timeSignature: '4/4' },
                    { chord: { symbol: 'A' }, timeSignature: '4/4' },
                    { chord: { symbol: 'E' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    'Something': {
        key: 'C',
        mode: 'major',
        timeSignature: '4/4',
        tempo: 66,
        sections: [
            {
                id: 'verse',
                name: 'Verse',
                bars: 8,
                repeat: 1,
                key: 'C',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'C' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Cmaj7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'C7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F' }, timeSignature: '4/4' },
                    { chord: { symbol: 'D' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Am' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Am/G' }, timeSignature: '4/4' }
                ]
            },
            {
                id: 'bridge',
                name: 'Bridge',
                bars: 8,
                repeat: 1,
                key: 'C',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'A' }, timeSignature: '4/4' },
                    { chord: { symbol: 'C#m' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F#m' }, timeSignature: '4/4' },
                    { chord: { symbol: 'A' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Eb' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G' }, timeSignature: '4/4' },
                    { chord: { symbol: 'C' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    'Eleanor Rigby': {
        key: 'Em',
        mode: 'minor',
        timeSignature: '4/4',
        tempo: 136,
        sections: [
            {
                id: 'verse',
                name: 'Verse',
                bars: 4,
                repeat: 1,
                key: 'Em',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'Em' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Em' }, timeSignature: '4/4' },
                    { chord: { symbol: 'C' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Em' }, timeSignature: '4/4' }
                ]
            },
            {
                id: 'chorus',
                name: 'Chorus',
                bars: 4,
                repeat: 1,
                key: 'Em',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'Em' }, timeSignature: '4/4' },
                    { chord: { symbol: 'C' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Em' }, timeSignature: '4/4' },
                    { chord: { symbol: 'C' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    "Don't Stop Believin'": {
        key: 'E',
        mode: 'major',
        timeSignature: '4/4',
        tempo: 119,
        sections: [
            {
                id: 'verse',
                name: 'Verse',
                bars: 4,
                repeat: 1,
                key: 'E',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'E' }, timeSignature: '4/4' },
                    { chord: { symbol: 'B' }, timeSignature: '4/4' },
                    { chord: { symbol: 'C#m' }, timeSignature: '4/4' },
                    { chord: { symbol: 'A' }, timeSignature: '4/4' }
                ]
            },
            {
                id: 'chorus',
                name: 'Chorus',
                bars: 4,
                repeat: 1,
                key: 'E',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'E' }, timeSignature: '4/4' },
                    { chord: { symbol: 'B' }, timeSignature: '4/4' },
                    { chord: { symbol: 'A' }, timeSignature: '4/4' },
                    { chord: { symbol: 'B' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    'Your Song': {
        key: 'Eb',
        mode: 'major',
        timeSignature: '4/4',
        tempo: 63,
        sections: [
            {
                id: 'verse',
                name: 'Verse',
                bars: 8,
                repeat: 1,
                key: 'Eb',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'Eb' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Bb/D' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Cm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Cm/Bb' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Ab' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Bb' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Gm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Cm' }, timeSignature: '4/4' }
                ]
            },
            {
                id: 'chorus',
                name: 'Chorus',
                bars: 4,
                repeat: 1,
                key: 'Eb',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'Ab' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Bb' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Gm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Cm' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    'All of Me': {
        key: 'Ab',
        mode: 'major',
        timeSignature: '4/4',
        tempo: 120,
        sections: [
            {
                id: 'verse',
                name: 'Verse',
                bars: 4,
                repeat: 1,
                key: 'Ab',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'Ab' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Fm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Db' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Eb' }, timeSignature: '4/4' }
                ]
            },
            {
                id: 'chorus',
                name: 'Chorus',
                bars: 4,
                repeat: 1,
                key: 'Ab',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'Fm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Db' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Ab' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Eb' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    'Summertime': {
        key: 'Am',
        mode: 'minor',
        timeSignature: '4/4',
        tempo: 80,
        sections: [
            {
                id: 'verse',
                name: 'Verse',
                bars: 8,
                repeat: 1,
                key: 'Am',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'Am6' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Am6' }, timeSignature: '4/4' },
                    { chord: { symbol: 'E7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'E7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Am6' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Am6' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Dm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'E7' }, timeSignature: '4/4' }
                ]
            },
            {
                id: 'bridge',
                name: 'Bridge',
                bars: 8,
                repeat: 1,
                key: 'Am',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'F' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Dm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Am6' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Am6' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Dm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'E7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Am6' }, timeSignature: '4/4' },
                    { chord: { symbol: 'E7' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    'My Funny Valentine': {
        key: 'Cm',
        mode: 'minor',
        timeSignature: '4/4',
        tempo: 90,
        sections: [
            {
                id: 'verse',
                name: 'Verse',
                bars: 8,
                repeat: 1,
                key: 'Cm',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'Cm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Cm/Bb' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Ab7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Gm7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Cm7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Cm6' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Dm7b5' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G7' }, timeSignature: '4/4' }
                ]
            },
            {
                id: 'bridge',
                name: 'Bridge',
                bars: 8,
                repeat: 1,
                key: 'Cm',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'Fm7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Fm7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Bb7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Ebmaj7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Abmaj7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Dm7b5' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Cm' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    'So What': {
        key: 'Dm',
        mode: 'dorian',
        timeSignature: '4/4',
        tempo: 135,
        sections: [
            {
                id: 'a-section',
                name: 'A Section',
                bars: 8,
                repeat: 1,
                key: 'Dm',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'Dm7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Dm7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Dm7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Dm7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Dm7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Dm7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Dm7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Dm7' }, timeSignature: '4/4' }
                ]
            },
            {
                id: 'b-section',
                name: 'B Section',
                bars: 8,
                repeat: 1,
                key: 'Ebm',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'Ebm7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Ebm7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Ebm7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Ebm7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Ebm7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Ebm7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Ebm7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Ebm7' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    'All the Things You Are': {
        key: 'Ab',
        mode: 'major',
        timeSignature: '4/4',
        tempo: 140,
        sections: [
            {
                id: 'a-section',
                name: 'A Section',
                bars: 8,
                repeat: 1,
                key: 'Ab',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'Fm7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Bbm7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Eb7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Abmaj7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Dbmaj7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Cmaj7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Cmaj7' }, timeSignature: '4/4' }
                ]
            },
            {
                id: 'b-section',
                name: 'B Section',
                bars: 8,
                repeat: 1,
                key: 'Ab',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'Cm7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Fm7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Bb7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Ebmaj7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Abmaj7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Am7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'D7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Gmaj7' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    "Blowin' in the Wind": {
        key: 'D',
        mode: 'major',
        timeSignature: '4/4',
        tempo: 88,
        sections: [
            {
                id: 'verse',
                name: 'Verse',
                bars: 8,
                repeat: 1,
                key: 'D',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'D' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G' }, timeSignature: '4/4' },
                    { chord: { symbol: 'A' }, timeSignature: '4/4' },
                    { chord: { symbol: 'D' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G' }, timeSignature: '4/4' },
                    { chord: { symbol: 'A' }, timeSignature: '4/4' },
                    { chord: { symbol: 'D' }, timeSignature: '4/4' },
                    { chord: { symbol: 'D' }, timeSignature: '4/4' }
                ]
            },
            {
                id: 'chorus',
                name: 'Chorus',
                bars: 4,
                repeat: 1,
                key: 'D',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'G' }, timeSignature: '4/4' },
                    { chord: { symbol: 'A' }, timeSignature: '4/4' },
                    { chord: { symbol: 'D' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    'Fire and Rain': {
        key: 'C',
        mode: 'major',
        timeSignature: '4/4',
        tempo: 76,
        sections: [
            {
                id: 'verse',
                name: 'Verse',
                bars: 8,
                repeat: 1,
                key: 'C',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'C' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Gm7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F' }, timeSignature: '4/4' },
                    { chord: { symbol: 'C' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Bb' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F' }, timeSignature: '4/4' },
                    { chord: { symbol: 'C' }, timeSignature: '4/4' },
                    { chord: { symbol: 'C' }, timeSignature: '4/4' }
                ]
            },
            {
                id: 'chorus',
                name: 'Chorus',
                bars: 4,
                repeat: 1,
                key: 'C',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'F' }, timeSignature: '4/4' },
                    { chord: { symbol: 'C' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Bb' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    'Heart of Gold': {
        key: 'Em',
        mode: 'minor',
        timeSignature: '4/4',
        tempo: 104,
        sections: [
            {
                id: 'verse',
                name: 'Verse',
                bars: 4,
                repeat: 1,
                key: 'Em',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'Em' }, timeSignature: '4/4' },
                    { chord: { symbol: 'C' }, timeSignature: '4/4' },
                    { chord: { symbol: 'D' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G' }, timeSignature: '4/4' }
                ]
            },
            {
                id: 'chorus',
                name: 'Chorus',
                bars: 4,
                repeat: 1,
                key: 'Em',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'Em' }, timeSignature: '4/4' },
                    { chord: { symbol: 'D' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Em' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Em' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    'Pride and Joy': {
        key: 'E',
        mode: 'major',
        timeSignature: '12/8',
        tempo: 122,
        sections: [
            {
                id: 'verse',
                name: 'Verse',
                bars: 12,
                repeat: 1,
                key: 'E',
                timeSignature: '12/8',
                measures: [
                    { chord: { symbol: 'E7' }, timeSignature: '12/8' },
                    { chord: { symbol: 'E7' }, timeSignature: '12/8' },
                    { chord: { symbol: 'E7' }, timeSignature: '12/8' },
                    { chord: { symbol: 'E7' }, timeSignature: '12/8' },
                    { chord: { symbol: 'A7' }, timeSignature: '12/8' },
                    { chord: { symbol: 'A7' }, timeSignature: '12/8' },
                    { chord: { symbol: 'E7' }, timeSignature: '12/8' },
                    { chord: { symbol: 'E7' }, timeSignature: '12/8' },
                    { chord: { symbol: 'B7' }, timeSignature: '12/8' },
                    { chord: { symbol: 'A7' }, timeSignature: '12/8' },
                    { chord: { symbol: 'E7' }, timeSignature: '12/8' },
                    { chord: { symbol: 'B7' }, timeSignature: '12/8' }
                ]
            }
        ]
    },
    
    'Comfortably Numb': {
        key: 'Bm',
        mode: 'minor',
        timeSignature: '4/4',
        tempo: 63,
        sections: [
            {
                id: 'verse',
                name: 'Verse',
                bars: 8,
                repeat: 1,
                key: 'Bm',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'Bm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Bm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'A' }, timeSignature: '4/4' },
                    { chord: { symbol: 'A' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Em' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Bm' }, timeSignature: '4/4' }
                ]
            },
            {
                id: 'chorus',
                name: 'Chorus',
                bars: 4,
                repeat: 1,
                key: 'D',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'D' }, timeSignature: '4/4' },
                    { chord: { symbol: 'A' }, timeSignature: '4/4' },
                    { chord: { symbol: 'D' }, timeSignature: '4/4' },
                    { chord: { symbol: 'A' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    'Free Bird': {
        key: 'G',
        mode: 'major',
        timeSignature: '4/4',
        tempo: 63,
        sections: [
            {
                id: 'verse',
                name: 'Verse',
                bars: 8,
                repeat: 1,
                key: 'G',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'G' }, timeSignature: '4/4' },
                    { chord: { symbol: 'D/F#' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Em' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Em' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F' }, timeSignature: '4/4' },
                    { chord: { symbol: 'C' }, timeSignature: '4/4' },
                    { chord: { symbol: 'D' }, timeSignature: '4/4' },
                    { chord: { symbol: 'D' }, timeSignature: '4/4' }
                ]
            },
            {
                id: 'chorus',
                name: 'Chorus',
                bars: 4,
                repeat: 1,
                key: 'G',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'G' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Bb' }, timeSignature: '4/4' },
                    { chord: { symbol: 'C' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    'More Than a Feeling': {
        key: 'D',
        mode: 'major',
        timeSignature: '4/4',
        tempo: 108,
        sections: [
            {
                id: 'verse',
                name: 'Verse',
                bars: 8,
                repeat: 1,
                key: 'D',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'D' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Csus2' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G/B' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G' }, timeSignature: '4/4' },
                    { chord: { symbol: 'D' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Csus2' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G/B' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G' }, timeSignature: '4/4' }
                ]
            },
            {
                id: 'chorus',
                name: 'Chorus',
                bars: 4,
                repeat: 1,
                key: 'D',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'G' }, timeSignature: '4/4' },
                    { chord: { symbol: 'C' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Em' }, timeSignature: '4/4' },
                    { chord: { symbol: 'D' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    'Bohemian Rhapsody': {
        key: 'Bb',
        mode: 'major',
        timeSignature: '4/4',
        tempo: 72,
        sections: [
            {
                id: 'intro',
                name: 'Intro',
                bars: 6,
                repeat: 1,
                key: 'Bb',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'Bb' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Gm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Cm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Bb' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F7' }, timeSignature: '4/4' }
                ]
            },
            {
                id: 'verse',
                name: 'Verse',
                bars: 8,
                repeat: 1,
                key: 'Bb',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'Bb' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Gm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Cm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Bb' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Gm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Cm' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F7' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    'Ob-La-Di, Ob-La-Da': {
        key: 'Bb',
        mode: 'major',
        timeSignature: '4/4',
        tempo: 113,
        sections: [
            {
                id: 'verse',
                name: 'Verse',
                bars: 8,
                repeat: 1,
                key: 'Bb',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'Bb' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Bb' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Bb' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Bb' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Bb' }, timeSignature: '4/4' }
                ]
            },
            {
                id: 'chorus',
                name: 'Chorus',
                bars: 4,
                repeat: 1,
                key: 'Bb',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'Bb' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Eb' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F7' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Bb' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    'I-IV-V Progression': {
        key: 'C',
        mode: 'major',
        timeSignature: '4/4',
        tempo: 120,
        sections: [
            {
                id: 'progression',
                name: 'Rock Progression',
                bars: 4,
                repeat: 1,
                key: 'C',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'C' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G' }, timeSignature: '4/4' },
                    { chord: { symbol: 'C' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    '50s Progression (I-vi-IV-V)': {
        key: 'C',
        mode: 'major',
        timeSignature: '4/4',
        tempo: 120,
        sections: [
            {
                id: 'progression',
                name: '50s Doo-Wop',
                bars: 4,
                repeat: 1,
                key: 'C',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'C' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Am' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G' }, timeSignature: '4/4' }
                ]
            }
        ]
    },
    
    'Circle of Fifths': {
        key: 'C',
        mode: 'major',
        timeSignature: '4/4',
        tempo: 100,
        sections: [
            {
                id: 'exercise',
                name: 'Circle of Fifths',
                bars: 12,
                repeat: 1,
                key: 'C',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'C' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Bb' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Eb' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Ab' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Db' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Gb' }, timeSignature: '4/4' },
                    { chord: { symbol: 'B' }, timeSignature: '4/4' },
                    { chord: { symbol: 'E' }, timeSignature: '4/4' },
                    { chord: { symbol: 'A' }, timeSignature: '4/4' },
                    { chord: { symbol: 'D' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G' }, timeSignature: '4/4' }
                ]
            }
        ]
    }
};

/**
 * Build song object from database
 */
function buildSong(songInfo) {
    const songData = SONG_DATABASE[songInfo.title];
    
    if (!songData) {
        console.log(`⚠️  No data yet for: ${songInfo.title}`);
        return null;
    }
    
    return {
        title: songInfo.title,
        artist: songInfo.artist,
        genre: songInfo.genre,
        year: songInfo.year || null,
        ...songData,
        source: 'curated',
        copyrightStatus: 'chord_progression_only',
        dateAdded: new Date().toISOString(),
        verified: true
    };
}

/**
 * Generate library from song list
 */
function generateLibrary(priority = null) {
    console.log('\n' + '='.repeat(60));
    console.log('🎸 CHORD PROGRESSION LIBRARY BUILDER');
    console.log('='.repeat(60));
    
    const songs = SONG_LIST
        .filter(s => priority === null || s.priority <= priority)
        .map(buildSong)
        .filter(s => s !== null);
    
    console.log(`\n✅ Built ${songs.length} songs`);
    
    // Group by genre
    const byGenre = {};
    songs.forEach(song => {
        if (!byGenre[song.genre]) byGenre[song.genre] = [];
        byGenre[song.genre].push(song);
    });
    
    console.log('\n📊 By Genre:');
    Object.entries(byGenre).forEach(([genre, songs]) => {
        console.log(`  ${genre}: ${songs.length} songs`);
    });
    
    return songs;
}

/**
 * Save library to JSON
 */
function saveLibrary(songs, outputFile) {
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputFile, JSON.stringify(songs, null, 2));
    console.log(`\n💾 Saved to: ${outputFile}`);
}

/**
 * Print instructions for adding more songs
 */
function printInstructions() {
    console.log('\n' + '='.repeat(60));
    console.log('📝 HOW TO ADD MORE SONGS');
    console.log('='.repeat(60));
    console.log(`
1. Research chord progression (Ultimate Guitar, Hooktheory, etc.)
2. Simplify to main sections (verse, chorus, bridge)
3. Add to SONG_DATABASE object in this file
4. Run script again to regenerate library

Example:
    'Your Song Title': {
        key: 'C',
        mode: 'major',
        timeSignature: '4/4',
        tempo: 120,
        sections: [
            {
                id: 'verse',
                name: 'Verse',
                bars: 4,
                repeat: 1,
                key: 'C',
                timeSignature: '4/4',
                measures: [
                    { chord: { symbol: 'C' }, timeSignature: '4/4' },
                    { chord: { symbol: 'G' }, timeSignature: '4/4' },
                    { chord: { symbol: 'Am' }, timeSignature: '4/4' },
                    { chord: { symbol: 'F' }, timeSignature: '4/4' }
                ]
            }
        ]
    }

Current progress: ${Object.keys(SONG_DATABASE).length}/${SONG_LIST.length} songs completed
    `);
}

// CLI
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
        case 'build':
        case 'generate':
            const priority = args[1] ? parseInt(args[1]) : null;
            const outputFile = args[2] || './output/curated-library.json';
            
            const songs = generateLibrary(priority);
            saveLibrary(songs, outputFile);
            printInstructions();
            
            console.log('\n✨ Next step: Upload to Firebase');
            console.log(`   node firebase-uploader.js upload ${outputFile}\n`);
            break;
            
        case 'list':
            console.log('\n📋 SONG LIST:\n');
            SONG_LIST.forEach((song, i) => {
                const status = SONG_DATABASE[song.title] ? '✅' : '⏳';
                console.log(`${status} ${i + 1}. ${song.title} - ${song.artist} (${song.genre})`);
            });
            console.log(`\n✅ Complete: ${Object.keys(SONG_DATABASE).length}/${SONG_LIST.length}`);
            break;
            
        default:
            console.log(`
🎸 Chord Progression Library Builder

Commands:
  build [priority] [output]    Generate library
  list                         Show song list and status

Examples:
  node library-builder.js build
  node library-builder.js build 1 ./priority-songs.json
  node library-builder.js list

Priority levels:
  1 = Essential (most popular, must-have)
  2 = Important (very popular)
  3 = Nice to have
            `);
    }
}

module.exports = {
    generateLibrary,
    SONG_LIST,
    SONG_DATABASE
};
