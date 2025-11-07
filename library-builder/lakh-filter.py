#!/usr/bin/env python3
"""
Lakh MIDI Dataset Quality Filter
Intelligently selects best songs based on match scores and metadata
"""

import json
import os
import shutil
from pathlib import Path
import argparse

def load_match_scores(match_file):
    """Load match scores from Lakh metadata"""
    print(f"📊 Loading match scores from {match_file}...")
    
    with open(match_file, 'r') as f:
        raw_data = json.load(f)
    
    # Convert nested dict to list format
    # Structure: {track_id: {md5_hash: score, ...}, ...}
    matches = []
    for track_id, midi_matches in raw_data.items():
        if not midi_matches:
            continue
        # Use the best (highest) score for this track
        best_score = max(midi_matches.values())
        # Get the MD5 hash with the best score
        best_md5 = max(midi_matches.items(), key=lambda x: x[1])[0]
        
        matches.append({
            'track_id': track_id,
            'md5': best_md5,
            'score': best_score,
            'artist': 'Unknown',  # Will need artist/title from separate file
            'title': 'Untitled',
            'midi_path': '',  # Will need to find in directory
            'tags': []
        })
    
    print(f"✓ Loaded {len(matches)} match scores")
    return matches

def filter_by_quality(matches, min_score=0.5):
    """Filter songs by match quality score"""
    filtered = [m for m in matches if m['score'] >= min_score]
    print(f"✓ Filtered to {len(filtered)} songs with score >= {min_score}")
    return filtered

def filter_by_genre(matches, genres=None):
    """Filter by music genre"""
    if not genres:
        return matches
    
    # Genre mapping from tags
    genre_keywords = {
        'rock': ['rock', 'metal', 'punk', 'grunge'],
        'pop': ['pop', 'dance', 'disco'],
        'jazz': ['jazz', 'blues', 'swing'],
        'classical': ['classical', 'orchestra', 'symphony'],
        'country': ['country', 'folk', 'bluegrass'],
        'electronic': ['electronic', 'techno', 'house', 'edm'],
        'hip-hop': ['hip-hop', 'rap', 'r&b']
    }
    
    filtered = []
    for match in matches:
        tags = match.get('tags', [])
        for genre in genres:
            keywords = genre_keywords.get(genre.lower(), [genre.lower()])
            if any(keyword in tag.lower() for tag in tags for keyword in keywords):
                filtered.append(match)
                break
    
    print(f"✓ Filtered to {len(filtered)} songs matching genres: {', '.join(genres)}")
    return filtered

def sort_by_popularity(matches):
    """Sort by popularity (match score + other factors)"""
    # Higher score = better match = more popular/accurate
    sorted_matches = sorted(matches, key=lambda x: x['score'], reverse=True)
    print(f"✓ Sorted by popularity")
    return sorted_matches

def select_diverse_artists(matches, max_per_artist=5):
    """Limit songs per artist for diversity"""
    artist_counts = {}
    selected = []
    
    for match in matches:
        artist = match.get('artist', 'Unknown')
        count = artist_counts.get(artist, 0)
        
        if count < max_per_artist:
            selected.append(match)
            artist_counts[artist] = count + 1
    
    print(f"✓ Selected {len(selected)} songs (max {max_per_artist} per artist)")
    return selected

def copy_selected_files(matches, lakh_dir, output_dir, limit=1000):
    """Copy selected MIDI files to output directory"""
    print(f"\n📦 Copying {min(limit, len(matches))} MIDI files...")
    
    # Build index of all MIDI files by searching directory
    print("  Building MIDI file index...")
    midi_index = {}
    lakh_path = Path(lakh_dir)
    
    # Walk the directory to find all MIDI files and their paths
    for midi_file in lakh_path.rglob('*.mid'):
        # Extract track ID from path (should be in parent directory name)
        # Path structure: lmd_matched/X/Y/Z/TRACKID/*.mid
        if len(midi_file.parts) >= 2:
            track_id = midi_file.parts[-2]  # Parent directory is track ID
            if track_id not in midi_index:
                midi_index[track_id] = []
            midi_index[track_id].append(midi_file)
    
    print(f"  Found {len(midi_index)} tracks with MIDI files")
    
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    copied = 0
    failed = 0
    
    for i, match in enumerate(matches[:limit]):
        if i % 100 == 0 and i > 0:
            print(f"  Progress: {i}/{min(limit, len(matches))} files...")
        
        track_id = match.get('track_id', '')
        if not track_id or track_id not in midi_index:
            failed += 1
            continue
        
        # Get the first MIDI file for this track (or find by MD5 if needed)
        midi_files = midi_index[track_id]
        if not midi_files:
            failed += 1
            continue
        
        source = midi_files[0]  # Use first file
        
        # Create better filename: ID_Artist-Title.mid
        artist = match.get('artist', 'Unknown').replace('/', '_').replace('\\', '_')
        title = match.get('title', 'Untitled').replace('/', '_').replace('\\', '_')
        score = match.get('score', 0)
        
        dest_name = f"{track_id}_{artist}-{title}_score{score:.3f}.mid"
        dest_name = "".join(c for c in dest_name if c.isalnum() or c in (' ', '-', '_', '.'))[:200]
        
        dest = output_path / dest_name
        
        try:
            shutil.copy2(source, dest)
            copied += 1
        except Exception as e:
            print(f"    Error copying {source}: {e}")
            failed += 1
    
    print(f"\n✅ Copied: {copied} files")
    if failed > 0:
        print(f"⚠️  Failed: {failed} files")
    
    return copied

def create_metadata_file(matches, output_file, limit=1000):
    """Create JSON metadata file for selected songs"""
    print(f"\n📝 Creating metadata file...")
    
    metadata = []
    for match in matches[:limit]:
        metadata.append({
            'track_id': match.get('track_id'),
            'artist': match.get('artist', 'Unknown'),
            'title': match.get('title', 'Untitled'),
            'score': match.get('score', 0),
            'midi_path': match.get('midi_path'),
            'tags': match.get('tags', [])
        })
    
    with open(output_file, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"✅ Metadata saved to {output_file}")

def main():
    parser = argparse.ArgumentParser(description='Filter Lakh MIDI Dataset by quality')
    parser.add_argument('--lakh-dir', default='./lakh-dataset/lmd_matched',
                        help='Path to lmd_matched directory')
    parser.add_argument('--match-file', default='./lakh-dataset/match_scores.json',
                        help='Path to match_scores.json')
    parser.add_argument('--output-dir', default='./lakh-selected',
                        help='Output directory for selected MIDI files')
    parser.add_argument('--limit', type=int, default=1000,
                        help='Number of songs to select (default: 1000)')
    parser.add_argument('--min-score', type=float, default=0.5,
                        help='Minimum match score (0-1, default: 0.5)')
    parser.add_argument('--genres', nargs='+',
                        help='Filter by genres (e.g., rock pop jazz)')
    parser.add_argument('--max-per-artist', type=int, default=5,
                        help='Max songs per artist (default: 5)')
    
    args = parser.parse_args()
    
    print("\n" + "="*60)
    print("🎵 LAKH MIDI DATASET QUALITY FILTER")
    print("="*60 + "\n")
    
    # Load match scores
    if not os.path.exists(args.match_file):
        print(f"❌ Match file not found: {args.match_file}")
        print("Please download it first:")
        print("  wget -O ./lakh-dataset/match_scores.json http://hog.ee.columbia.edu/craffel/lmd/match_scores.json")
        return
    
    matches = load_match_scores(args.match_file)
    
    # Filter by quality
    print(f"\n🔍 Filtering songs...")
    matches = filter_by_quality(matches, args.min_score)
    
    # Filter by genre (if specified)
    if args.genres:
        matches = filter_by_genre(matches, args.genres)
    
    # Sort by popularity
    matches = sort_by_popularity(matches)
    
    # Diversify artists
    matches = select_diverse_artists(matches, args.max_per_artist)
    
    # Copy selected files
    print(f"\n📊 Selection Summary:")
    print(f"  Total available: {len(matches)}")
    print(f"  Will process: {min(args.limit, len(matches))}")
    print(f"  Min score: {args.min_score}")
    if args.genres:
        print(f"  Genres: {', '.join(args.genres)}")
    
    copied = copy_selected_files(matches, args.lakh_dir, args.output_dir, args.limit)
    
    # Create metadata file
    metadata_file = os.path.join(args.output_dir, 'metadata.json')
    create_metadata_file(matches, metadata_file, args.limit)
    
    print("\n" + "="*60)
    print("🎉 COMPLETE!")
    print("="*60)
    print(f"\nSelected files: {args.output_dir}")
    print(f"Metadata: {metadata_file}")
    print(f"\nNext step:")
    print(f"  node midi-to-song-converter.js {args.output_dir} ./output/lakh-songs.json")
    print()

if __name__ == '__main__':
    main()
