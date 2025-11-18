# Rhythmic Format Guide

## Format Explanation
- Each measure contains a `chords` array.
- Each chord has a `symbol` and a `duration`.
- Durations must add up to the measure's time signature.

## Duration Types
- `whole` (4 beats in 4/4)
- `dotted-half` (3 beats)
- `half` (2 beats)
- `quarter` (1 beat)
- `eighth` (0.5 beats)
- `dotted-quarter` (1.5 beats)
- `dotted-eighth` (0.75 beats)
- `sixteenth` (0.25 beats)

## Common Patterns
- 1 chord per measure: `{ "chords": [{ "symbol": "C", "duration": "whole" }] }`
- 2 chords per measure: `{ "chords": [{ "symbol": "C", "duration": "half" }, { "symbol": "G", "duration": "half" }] }`
- Waltz (3/4): `{ "chords": [{ "symbol": "G", "duration": "dotted-half" }] }`

## Real-World Examples
- "Hey Jude" (slow): 1 chord per measure
- "Autumn Leaves" (jazz): 2 chords per measure
- "Amazing Grace" (3/4): 1 chord per measure, `dotted-half`

## Validation Rules
- All measures must have a `chords` array.
- All chords must have a `duration`.
- Durations must sum to the measure's time signature.

## Template for New Songs
```json
{
  "title": "Song Title",
  "artist": "Artist",
  "sections": [
    {
      "name": "Verse",
      "measures": [
        { "chords": [{ "symbol": "C", "duration": "whole" }], "timeSignature": "4/4" }
      ]
    }
  ]
}
```

---

For a quick start, see `RHYTHMIC-FORMAT-QUICKSTART.md`.
