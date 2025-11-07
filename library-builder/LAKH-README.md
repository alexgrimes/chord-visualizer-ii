# Lakh MIDI Dataset Integration Guide

## 🎯 Quick Start

### Windows Users (PowerShell)

Since you're on Windows, use this instead of the bash script:

```powershell
# Step 1: Download dataset
New-Item -ItemType Directory -Force -Path "lakh-dataset"
cd lakh-dataset

# Download LMD-matched (3GB)
Invoke-WebRequest -Uri "http://hog.ee.columbia.edu/craffel/lmd/lmd_matched.tar.gz" -OutFile "lmd_matched.tar.gz"

# Download metadata
Invoke-WebRequest -Uri "http://hog.ee.columbia.edu/craffel/lmd/match_scores.json" -OutFile "match_scores.json"

# You'll need 7-Zip or similar to extract .tar.gz on Windows
# Download 7-Zip: https://www.7-zip.org/
# Then: Right-click lmd_matched.tar.gz -> 7-Zip -> Extract Here

cd ..

# Step 2: Filter songs (requires Python)
python lakh-filter.py --limit 1000 --min-score 0.7

# Step 3: Convert
node midi-to-song-converter.js ./lakh-selected ./output/lakh-songs.json

# Step 4: Upload via browser
# Open force-update-uploader.html
# Select output/lakh-songs.json
```

## 📊 Recommended Approach

### Option 1: Small Test (100 songs, 10 minutes)
```powershell
python lakh-filter.py --limit 100 --min-score 0.8
node midi-to-song-converter.js ./lakh-selected ./output/lakh-songs.json
```

### Option 2: Production Library (1,000 songs, 45 minutes)
```powershell
python lakh-filter.py --limit 1000 --min-score 0.7
node midi-to-song-converter.js ./lakh-selected ./output/lakh-songs.json
```

### Option 3: Large Library (5,000 songs, 3 hours)
```powershell
python lakh-filter.py --limit 5000 --min-score 0.6
node midi-to-song-converter.js ./lakh-selected ./output/lakh-songs.json
```

## 🔧 Requirements

Before starting:

1. **Disk Space**: 20 GB free
2. **Python 3**: `python --version` (should show 3.x)
3. **Node.js**: Already installed ✓
4. **7-Zip**: For extracting .tar.gz files
   - Download: https://www.7-zip.org/

## 📥 Step-by-Step

### 1. Download Dataset (One-Time, ~30 minutes)

```powershell
# Create directory
New-Item -ItemType Directory -Force -Path "lakh-dataset"
cd lakh-dataset

# Download (3GB)
Invoke-WebRequest -Uri "http://hog.ee.columbia.edu/craffel/lmd/lmd_matched.tar.gz" -OutFile "lmd_matched.tar.gz"

# Download metadata
Invoke-WebRequest -Uri "http://hog.ee.columbia.edu/craffel/lmd/match_scores.json" -OutFile "match_scores.json"
```

### 2. Extract Files

Option A: Using 7-Zip (Recommended)
- Right-click `lmd_matched.tar.gz`
- 7-Zip → Extract Here
- Then extract the resulting `.tar` file again

Option B: Using tar (if you have Git Bash)
```bash
tar -xzf lmd_matched.tar.gz
```

### 3. Filter Best Songs

```powershell
cd ..  # Back to library-builder

# Filter 1,000 high-quality songs
python lakh-filter.py --limit 1000 --min-score 0.7 --max-per-artist 3
```

**Parameters:**
- `--limit 1000` - Number of songs
- `--min-score 0.7` - Quality threshold (0.5-1.0)
- `--max-per-artist 3` - Diversity (max 3 per artist)

**Genre filtering:**
```powershell
# Only rock songs
python lakh-filter.py --limit 500 --genres rock

# Rock and jazz
python lakh-filter.py --limit 1000 --genres rock jazz
```

### 4. Convert to Song Format

```powershell
# This processes all selected MIDI files
node midi-to-song-converter.js ./lakh-selected ./output/lakh-songs.json
```

**Expected output:**
```
Processing 1/1000: Hey_Jude.mid
✓ Key: F major (92%)
✓ Chords: 38
✓ Sections: 5
✅ Success

...

📊 SUMMARY
✅ Successful: 987/1000
❌ Failed: 13
📄 Output: ./output/lakh-songs.json
```

### 5. Upload to Firebase

```powershell
# Open in browser
start force-update-uploader.html

# Then:
# 1. Click "Choose File"
# 2. Select: output/lakh-songs.json
# 3. Click "Upload Songs"
# 4. Wait for completion
```

## 🎯 What You'll Get

### 1,000 Songs Example:

- **By Genre:**
  - Rock: ~350 songs
  - Pop: ~250 songs
  - Jazz: ~150 songs
  - Electronic: ~100 songs
  - Country: ~75 songs
  - Hip-Hop: ~50 songs
  - Other: ~25 songs

- **By Era:**
  - 1960s-1970s: ~150 songs
  - 1980s: ~200 songs
  - 1990s: ~300 songs
  - 2000s-2010s: ~350 songs

- **Quality:**
  - Average confidence: 82%
  - Average sections: 4-5
  - Average length: 32 bars

## ⏱️ Time Estimates

| Songs | Download* | Filter | Convert | Upload | Total |
|-------|-----------|--------|---------|--------|-------|
| 100   | 30 min    | 1 min  | 3 min   | 1 min  | 35 min |
| 1,000 | 30 min    | 2 min  | 30 min  | 3 min  | 65 min |
| 5,000 | 30 min    | 5 min  | 2.5 hrs | 15 min | 3+ hrs |

*One-time download

## 💾 Disk Space

| Component | Size |
|-----------|------|
| Download (.tar.gz) | 3 GB |
| Extracted files | 8 GB |
| Selected (1,000) | 500 MB |
| Converted JSON | 100 MB |
| **Total needed** | **12 GB** |

## 🔧 Troubleshooting

### Python not found
```powershell
# Install Python 3
# Download from: https://www.python.org/downloads/
# Make sure to check "Add Python to PATH" during installation
```

### tar.gz extraction fails
- Install 7-Zip: https://www.7-zip.org/
- Right-click file → 7-Zip → Extract Here

### Download interrupted
```powershell
# Resume download (if server supports it)
# Or use a download manager like Free Download Manager
```

### Conversion too slow
```powershell
# Process in smaller batches
python lakh-filter.py --limit 500
node midi-to-song-converter.js ./lakh-selected ./output/batch1.json

# Clean and repeat
Remove-Item -Recurse -Force ./lakh-selected/*
python lakh-filter.py --limit 500
# etc.
```

## ✅ Recommended Workflow

1. **Start small** - Test with 100 songs first
2. **Check quality** - Look at a few songs in your app
3. **Scale up** - If good, process 1,000 songs
4. **Deploy** - Upload and deploy to production
5. **Iterate** - Add more genres/songs as needed

## 🎉 Ready to Start?

```powershell
# Quick start (100 songs)
python lakh-filter.py --limit 100 --min-score 0.8
node midi-to-song-converter.js ./lakh-selected ./output/lakh-songs.json
start force-update-uploader.html
```

Good luck building your massive chord library! 🎸
