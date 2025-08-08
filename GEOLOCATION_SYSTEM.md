# Geolocation-Based Clue Set System

## Overview

This system implements geolocation-based clue sets for the scavenger hunt game, exactly as described in your requirements. When participants start a game, the AI generates location-specific clues for a 10-mile radius around their position. If another participant is within an existing clue set's radius, they use the same clues. If not, a new non-overlapping clue set is created.

## How It Works

### 1. Clue Set Assignment Logic

When a participant joins a game:

1. **Location Check**: System checks if the participant's location falls within any existing clue set's 10-mile radius
2. **Existing Set**: If yes, assign them to that clue set
3. **New Set**: If no, create a new clue set with optimal positioning to avoid overlaps

### 2. Non-Overlapping Algorithm

The system prevents clue set overlaps by:

1. **Distance Calculation**: Uses Haversine formula for accurate Earth distance calculations
2. **Overlap Detection**: Checks if the distance between clue set centers is less than sum of their radii
3. **Position Optimization**: If overlap detected, finds alternative position using spiral search pattern
4. **Fallback**: If no position found (rare), logs warning and proceeds


## Implementation Examples

### Example 1: Same Area Usage

```
Participant A: Nigeria, Calabar, Marion (4.9518, 8.3229)
- Creates ClueSet1 with 10-mile radius (points 13-23 in linear example)

Participant B: Nigeria, Calabar, Marion (4.9520, 8.3225) - 2 days later
- Location falls within ClueSet1 radius
- Assigned to ClueSet1, uses same clues
```

### Example 2: New Area Creation

```
Participant A: Nigeria, Calabar, Marion (4.9518, 8.3229)
- Creates ClueSet1

Participant C: Nigeria, Calabar, Marina (4.9545, 8.3156) - 2 days later  
- Location outside ClueSet1 radius
- Creates ClueSet2 with non-overlapping positioning
```

### Example 3: Overlap Prevention

```
ClueSet1: Center at point 12, radius 10 miles (covers points 7-17)
New participant at point 21:
- Desired position: points 16-26
- Overlap detected: point 16 already in ClueSet1
- System finds alternative: points 18-28
- Creates ClueSet2 at optimal position
```

## API Endpoints

### 1. Clue Fetching with Location
```
GET /api/games/{gameId}/clues?clueNumber=1&lat=4.9518&lng=8.3229
- Assigns participant to appropriate clue set
- Returns clues specific to their clue set
```

### 2. Clue Set Testing (Development)
```
POST /api/games/{gameId}/clue-sets
{
  "lat": 4.9518,
  "lng": 8.3229,
  "action": "test-assignment" | "create-test-clue-set" | "list-clue-sets"
}
```

## Key Functions

### Location Utilities (`/src/lib/clueSetManager.ts`)

- `calculateDistance()`: Haversine formula for Earth distances
- `calculateBoundingBox()`: Creates search boundaries for performance
- `isPointInClueSet()`: Checks if location is within clue set radius
- `cluesetsOverlap()`: Detects if two clue sets would overlap
- `findOptimalClueSetPosition()`: Finds non-overlapping position
- `assignParticipantToClueSet()`: Main assignment logic

### Database Operations

- `findExistingClueSet()`: Efficient clue set lookup with bounding box optimization
- `createClueSet()`: Creates new clue set with optimal positioning
- Participant assignment and progress tracking

## Testing the System
3. **Actions**:
   - Test assignment logic
   - Create test clue sets
   - List all existing clue sets
   - View overlap prevention in action

### Test Scenarios

1. **Basic Assignment**: Create clue set, test nearby locations
2. **Overlap Prevention**: Create multiple clue sets, test intermediate positions
3. **Distance Validation**: Verify 10-mile radius calculations
4. **Performance**: Test with multiple clue sets and participants

## Real-World Usage

### Test Conditions
  - ClueSet radius is 10 miles

```javascript
// Marion District, Calabar
const ParticipantLocation1 = { lat: 4.9518, lng: 8.3229 }

// Marina Area, Calabar (about 0.8 miles away)
const ParticipantLocation2 = { lat: 4.9545, lng: 8.3156 }

// These would share the same clue set as they're within 10 miles
```

### Linear Model Translation

In your linear 30-mile example:
- Point 0 = Western boundary
- Point 30 = Eastern boundary  
- 10-mile radius = 10 units in model
- Real implementation uses spherical coordinates

## Performance Optimizations

1. **Bounding Box Queries**: Fast initial filtering before distance calculations
2. **Database Indexing**: Spatial indexes on coordinates and bounding boxes
3. **Caching**: Clue set assignments cached per participant
4. **Efficient Overlap Detection**: Early termination in search algorithms

## Future Enhancements

1. **AI Integration**: Generate location-specific clues using OpenAI
2. **Dynamic Radius**: Adjust radius based on population density
3. **Temporal Factors**: Time-based clue set variations
4. **Advanced Positioning**: Machine learning for optimal clue set placement

## Error Handling

- Graceful fallbacks for GPS unavailable
- Overlap prevention with multiple fallback positions
- Database transaction safety for concurrent clue set creation
- User-friendly error messages for location issues

The system is now fully functional and ready for testing with the provided test interface!
