# Folder Contents API

## New Endpoint Added

### GET /api/v1/workspace/folder/{path}

Returns the contents of a specific folder in the workspace.

**Parameters:**
- `path` (path parameter): The folder path to get contents for (relative to workspace root)

**Examples:**
```
GET /api/v1/workspace/folder/src
GET /api/v1/workspace/folder/src/components
GET /api/v1/workspace/folder/ (returns root folders)
```

**Response Format:**
```json
{
  "path": "src",
  "name": "src",
  "type": "folder",
  "children": [
    {
      "name": "components",
      "path": "src/components",
      "type": "folder",
      "uri": "file:///path/to/workspace/src/components"
    },
    {
      "name": "App.tsx",
      "path": "src/App.tsx",
      "type": "file",
      "uri": "file:///path/to/workspace/src/App.tsx",
      "size": 1234
    }
  ]
}
```

**Child Properties:**
- `name`: File/folder name
- `path`: Full path from workspace root
- `type`: Either "folder" or "file"
- `uri`: Full file URI
- `size`: File size in bytes (only for files)

## Usage in Mobile App

Your mobile app can now use this endpoint to fetch folder contents when users tap on folders:

```javascript
async function loadFolderContents(folderPath) {
  try {
    const response = await fetch(`/api/v1/workspace/folder/${folderPath}`);
    const data = await response.json();
    return data.contents.children;
  } catch (error) {
    console.error('Failed to load folder contents:', error);
    return [];
  }
}
```

## Implementation Details

The endpoint uses VS Code's `fileService.resolve()` to get folder contents, which:
- Returns both files and folders
- Provides file sizes for files
- Handles nested folder structures
- Works with workspace-relative paths

For the root workspace (empty path), it returns the workspace folders.
