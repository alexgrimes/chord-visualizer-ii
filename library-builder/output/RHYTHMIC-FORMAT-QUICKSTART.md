# Rhythmic Format Quickstart

## Overview
- Each measure now supports multiple chords with explicit durations.
- Chord durations: `whole`, `dotted-half`, `half`, `quarter`, `eighth`, etc.
- Example:

```json
{
  "measures": [
    { "chords": [ { "symbol": "C", "duration": "half" }, { "symbol": "G", "duration": "half" } ], "timeSignature": "4/4" }
  ]
}
```

## Integration
- Use the `chords` array in each measure.
- Each chord has a `symbol` and a `duration`.

## Duration Reference
| Duration         | Beats (4/4) |
|------------------|-------------|
| whole            | 4           |
| dotted-half      | 3           |
| half             | 2           |
| quarter          | 1           |
| eighth           | 0.5         |

## Adding New Songs
- Use the template above for each measure.
- Validate durations add up to the measure's time signature.

## Example Usage
```js
measure.chords.forEach(chord => {
  playChord(chord.symbol, chord.duration);
});
```

---

For more, see `rhythmic-format-guide.md`.
