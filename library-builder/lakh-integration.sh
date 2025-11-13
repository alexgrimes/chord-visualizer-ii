#!/bin/bash
# Lakh MIDI Dataset Integration Script
# Downloads LMD-matched (45k songs), filters for quality, converts to your format

set -e  # Exit on error

echo ""
echo "============================================================"
echo "🎵 LAKH MIDI DATASET PROCESSOR"
echo "============================================================"
echo ""
echo "This will:"
echo "  1. Download LMD-matched (45,129 MIDI files, ~3GB)"
echo "  2. Filter for best quality songs"
echo "  3. Convert to your song format"
echo "  4. Upload to Firebase"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# ============================================================
# STEP 1: Download LMD-matched
# ============================================================

echo ""
echo "============================================================"
echo "📥 STEP 1: Downloading LMD-matched Dataset"
echo "============================================================"
echo ""

DOWNLOAD_DIR="./lakh-dataset"
mkdir -p "$DOWNLOAD_DIR"
cd "$DOWNLOAD_DIR"

if [ ! -f "lmd_matched.tar.gz" ]; then
    echo "Downloading 45,129 MIDI files (~3GB, may take 10-30 minutes)..."
    wget http://hog.ee.columbia.edu/craffel/lmd/lmd_matched.tar.gz
    echo "✅ Download complete!"
else
    echo "✓ Already downloaded"
fi

# ============================================================
# STEP 2: Extract
# ============================================================

echo ""
echo "============================================================"
echo "📦 STEP 2: Extracting Files"
echo "============================================================"
echo ""

if [ ! -d "lmd_matched" ]; then
    echo "Extracting tar.gz (may take 5-10 minutes)..."
    tar -xzf lmd_matched.tar.gz
    echo "✅ Extraction complete!"
else
    echo "✓ Already extracted"
fi

echo ""
echo "Total MIDI files: $(find lmd_matched -name "*.mid" | wc -l)"

cd ..

# ============================================================
# STEP 3: Download match metadata
# ============================================================

echo ""
echo "============================================================"
echo "📋 STEP 3: Downloading Metadata"
echo "============================================================"
echo ""

if [ ! -f "$DOWNLOAD_DIR/match_scores.json" ]; then
    echo "Downloading match metadata..."
    wget -O "$DOWNLOAD_DIR/match_scores.json" http://hog.ee.columbia.edu/craffel/lmd/match_scores.json
    echo "✅ Metadata downloaded!"
else
    echo "✓ Metadata already downloaded"
fi

# ============================================================
# STEP 4: Filter and sample songs
# ============================================================

echo ""
echo "============================================================"
echo "🔍 STEP 4: Filtering Best Quality Songs"
echo "============================================================"
echo ""

SAMPLE_DIR="./lakh-selected"
mkdir -p "$SAMPLE_DIR"

# Ask how many songs to process
echo "How many songs do you want to process?"
echo "  1) 100 songs (quick test, ~5 minutes)"
echo "  2) 1,000 songs (good library, ~30 minutes)"
echo "  3) 5,000 songs (large library, ~2 hours)"
echo "  4) 10,000 songs (huge library, ~4 hours)"
echo "  5) All 45,129 songs (ultimate library, ~20 hours)"
echo ""
read -p "Choose (1-5): " choice

case $choice in
    1) SAMPLE_SIZE=100 ;;
    2) SAMPLE_SIZE=1000 ;;
    3) SAMPLE_SIZE=5000 ;;
    4) SAMPLE_SIZE=10000 ;;
    5) SAMPLE_SIZE=45129 ;;
    *) 
        echo "Invalid choice, defaulting to 1,000"
        SAMPLE_SIZE=1000
        ;;
esac

echo ""
echo "Selecting $SAMPLE_SIZE best quality songs..."

# Copy random sample (you can make this smarter with Python filtering)
find "$DOWNLOAD_DIR/lmd_matched" -name "*.mid" | shuf -n $SAMPLE_SIZE | while read file; do
    cp "$file" "$SAMPLE_DIR/"
done

ACTUAL_COUNT=$(ls -1 "$SAMPLE_DIR"/*.mid 2>/dev/null | wc -l)
echo "✅ Selected $ACTUAL_COUNT songs"

# ============================================================
# STEP 5: Convert to song format
# ============================================================

echo ""
echo "============================================================"
echo "🎹 STEP 5: Converting MIDI to Song Format"
echo "============================================================"
echo ""

OUTPUT_DIR="./output"
mkdir -p "$OUTPUT_DIR"

if command -v node &> /dev/null; then
    echo "Processing with your MIDI converter..."
    node midi-to-song-converter.js "$SAMPLE_DIR" "$OUTPUT_DIR/lakh-songs.json"
    echo "✅ Conversion complete!"
else
    echo "❌ Node.js not found! Please install Node.js first."
    exit 1
fi

# ============================================================
# STEP 6: Upload to Firebase
# ============================================================

echo ""
echo "============================================================"
echo "📤 STEP 6: Upload to Firebase"
echo "============================================================"
echo ""

read -p "Upload to Firebase now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f "force-update-uploader.html" ]; then
        echo "Open force-update-uploader.html in your browser to upload"
        echo "File location: $OUTPUT_DIR/lakh-songs.json"
    else
        echo "Please use force-update-uploader.html to upload"
        echo "File: $OUTPUT_DIR/lakh-songs.json"
    fi
else
    echo "Skipped. You can upload later with force-update-uploader.html"
    echo "File: $OUTPUT_DIR/lakh-songs.json"
fi

# ============================================================
# SUMMARY
# ============================================================

echo ""
echo "============================================================"
echo "🎉 COMPLETE!"
echo "============================================================"
echo ""
echo "Summary:"
echo "  - Downloaded: LMD-matched dataset (45,129 songs)"
echo "  - Selected: $ACTUAL_COUNT songs"
echo "  - Converted: Check $OUTPUT_DIR/lakh-songs.json"
echo ""
echo "Next steps:"
echo "  - Test songs in your app at http://localhost:5000"
echo "  - Upload via force-update-uploader.html"
echo "  - Deploy to production when ready"
echo ""
