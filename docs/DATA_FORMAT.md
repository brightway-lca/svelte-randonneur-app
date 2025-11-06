# Randonneur Data Format Specification

## Overview
This application expects randonneur data files in the standardized format as used in `newapp/example-data`.

## File Format Structure

### Top-Level Properties
All data files must include these standard properties:
- `name`: String - Unique identifier for the dataset
- `version`: String - Version number
- `description`: String - Description of the dataset
- `contributors`: Array - List of contributor objects with `title`, `path`, `role`
- `licenses`: Array - List of license objects
- `created`: String - ISO 8601 timestamp
- `source_id`: String - Source database identifier
- `target_id`: String - Target database identifier
- `homepage`: String (optional) - Homepage URL
- `mapping`: Object (optional) - Mapping configuration
- `graph_context`: Array (optional) - Graph context types

### Data Sections

The following data sections are supported (all are arrays of objects):
- `create-datasets`: Array of dataset objects to create
- `delete`: Array of deletion specifications
- `disaggregate`: Array of disaggregation specifications
- `mapping`: Array of mapping items
- `replace`: Array of replacement specifications
- `update`: Array of update specifications

### Expected Data Item Formats

#### Replace Items (Standard Format)
```json
{
  "source": {
    "uuid": "...",
    "name": "..."
  },
  "target": {
    "uuid": "...",
    "name": "..."
  },
  "comment": "..."
}
```

#### Delete Items (Standard Format)
```json
{
  "source": {
    "uuid": "...",
    "name": "..."
  },
  "comment": "..."
}
```

#### Update Items
```json
{
  "source": {
    "uuid": "...",
    "name": "...",
    "code": "...",
    "categories": [...],
    "unit": "..."
  },
  "target": {
    "name": "...",
    // ... other target fields
  }
}
```

### Nested Object Support
The application automatically flattens nested structures for table display:
- `source.uuid` → Column: "Source / UUID"
- `source.name` → Column: "Source / Name"
- `target.uuid` → Column: "Target / UUID"
- etc.

## Notes

- All data sections should use nested `source` and `target` objects (not flat structures)
- The application derives table column specifications automatically from the data structure
- Empty arrays are allowed for any data section
- Additional fields beyond the standard structure are preserved and displayed

## Migration from Old Format

Old format files with flat structures (e.g., `delete` items with direct `name`, `code`, `categories` fields) may still work, but the new nested format is preferred and recommended for all new data files.


