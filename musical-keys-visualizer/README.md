# Musical Keys Visualizer

A comprehensive tool for exploring musical keys, scales, chords, and chord progressions with interactive fretboard visualization and chord progression composition features.

## Features

### Core Functionality
- **Interactive Circle of Fifths** - Visual key selection interface
- **Fretboard Visualization** - Shows chord fingerings for guitar, mandolin, violin, etc.
- **Multiple Chord Types** - Triads, 7th chords, secondary dominants, diminished passing chords
- **Scale Information** - Complete scale degrees and enharmonic spellings

### Chord Progression System
- **Musical Staff Interface** - Professional lead sheet layout with measure-by-measure chord entry
- **Advanced Playback** - Count-in, metronome, looping, tempo control, and time signature selection
- **Roman Numeral Analysis** - Accurate music theory notation for all chord types
- **Responsive Design** - Multi-row staff system that adapts to different screen sizes

## File Structure

```
musical-keys-visualizer/
├── index.html                     # Basic version - key visualization and chord exploration
├── chord-progression-version.html # Enhanced version - includes chord progression composer
└── README.md                     # This file
```

## Versions

### Basic Version (`index.html`)
The original musical key visualizer focused on:
- Circle of fifths navigation
- Key and scale information display
- Individual chord exploration
- Fretboard visualization for multiple instruments

### Enhanced Version (`chord-progression-version.html`)
Includes all basic features plus:
- **Chord Progression Composer** - Create and edit multi-measure progressions
- **Musical Staff Display** - Professional notation layout with barlines and measure numbers
- **Advanced Playback Engine** - Complete with count-in, metronome clicks, and looping
- **Music Theory Analysis** - Roman numeral notation for diatonic, secondary, and diminished chords
- **Responsive Staff Layout** - Automatically organizes measures into rows

## Usage

### Basic Exploration
1. Open either version in a web browser
2. Click any key on the circle of fifths
3. Explore the chords using the chord type buttons (Triads, 7ths, Secondary, Diminished)
4. View chord fingerings on the fretboard visualization

### Chord Progression Composition (Enhanced Version Only)
1. **Setup**: Choose key, number of measures, time signature, and tempo
2. **Create**: Click "Create Progression" to generate the staff
3. **Compose**: Click chord buttons to place them in measures (auto-advances to next measure)
4. **Play**: Use playback controls with count-in and metronome
5. **Loop**: Enable looping for practice and analysis

## Technical Features

### Audio System
- Web Audio API for chord synthesis and metronome
- Configurable tempo (60-200 BPM)
- Multiple time signatures (4/4, 3/4, 2/4, 6/8)
- Enhanced metronome with beat 1 accent

### Music Theory Engine
- Accurate enharmonic spelling for all keys
- Roman numeral analysis for complex chord relationships
- Secondary dominant target calculation
- Diminished passing chord theory with proper flat spellings

### Responsive Design
- CSS Grid and Flexbox layout
- Scalable staff system (4 measures per row)
- Mobile-friendly interface
- Print-ready chord charts

## Browser Compatibility
- Modern browsers with Web Audio API support
- Chrome, Firefox, Safari, Edge (latest versions)
- Local file access or web server hosting

## Development
This project uses vanilla HTML, CSS, and JavaScript with no external dependencies beyond the Web Audio API.

## License
Open source - feel free to use, modify, and distribute.
