# Output Configuration System

The application supports multiple configurable output types through a flexible configuration system.

## Overview

Instead of hardcoding document templates and types, outputs are defined in `/public/config/outputs.json`. This allows you to create different document types (product briefs, personas reports, market sizing) each with their own templates, formats, and section filtering.

## Configuration Structure

### outputs.json

Location: `/public/config/outputs.json`

```json
[
  {
    "id": "product-brief",
    "label": "Product Brief",
    "description": "Complete product documentation",
    "formats": ["md", "docx", "pdf"],
    "templateId": "product-brief-v1",
    "sections": [],
    "analyzers": [],
    "fileNamePattern": "product-brief-{sessionId}.{ext}"
  }
]
```

### OutputFileConfig Interface

```typescript
interface OutputFileConfig {
  id: string                    // Unique identifier
  label: string                 // Display name in UI
  description?: string          // Optional description
  formats: ('md' | 'docx' | 'pdf')[]  // Supported export formats
  templateId: string            // References template ID
  sections?: string[]           // Optional: filter to specific sections
  analyzers?: string[]          // Optional: required analyzers
  fileNamePattern?: string      // Filename template with {sessionId}, {ext}
}
```

## How It Works

### 1. Loading Outputs

```typescript
import { loadOutputs, getOutputById } from './config/outputs'

// Load all available outputs
const outputs = await loadOutputs()

// Get specific output
const brief = await getOutputById('product-brief')
```

### 2. Generation Pipeline

The generation system uses output configs:

```typescript
// In generation.ts
const output = await generateOutput(session, 'product-brief')
// Returns: { html, templateId, outputId, metadata }
```

### 3. UI Selection

Users can switch between outputs in the preview panel:
- Dropdown shows all configured outputs
- Selecting an output regenerates the preview
- Export respects the selected output's supported formats

## Adding a New Output

### Step 1: Create Template

Create a new Handlebars template in `/public/config/templates/`:

```handlebars
<!-- personas-report.hbs -->
<h1>User Personas</h1>
{{#each derivedInferences.personas}}
  <h2>{{this.label}}</h2>
  <p>{{smartSpan this.description this}}</p>
{{/each}}
```

### Step 2: Register Template

Add to `/public/config/templates/index.json`:

```json
{
  "id": "personas-v1",
  "path": "/config/templates/personas-report.hbs",
  "version": "1.0"
}
```

### Step 3: Add Output Config

Add to `/public/config/outputs.json`:

```json
{
  "id": "personas-report",
  "label": "Personas Report",
  "description": "Detailed user personas analysis",
  "formats": ["md", "pdf"],
  "templateId": "personas-v1",
  "sections": ["target-audience"],
  "analyzers": ["personaAnalyzer"],
  "fileNamePattern": "personas-{sessionId}.{ext}"
}
```

### Step 4: Test

1. Reload the application
2. Select "Personas Report" from output dropdown
3. Verify preview updates correctly
4. Test export in MD and PDF formats

## Advanced Features

### Section Filtering

Use `sections` array to limit which parts of the document appear:

```json
{
  "sections": ["problem-statement", "target-audience"]
}
```

### Analyzer Selection

Use `analyzers` array to specify which analysis modules are required:

```json
{
  "analyzers": ["personaAnalyzer", "marketSizingAnalyzer"]
}
```

This enables future optimization where only required analyzers run.

### Filename Patterns

Customize export filenames with placeholders:

```json
{
  "fileNamePattern": "my-report-{sessionId}-v2.{ext}"
}
```

Supported placeholders:
- `{sessionId}` - Current session ID
- `{ext}` - File extension (md, docx, pdf)

## File Locations

- **Config**: `/public/config/outputs.json`
- **Loader**: `/src/config/outputs.ts`
- **Types**: `/src/config/types.ts` (OutputFileConfig interface)
- **Templates**: `/public/config/templates/`
- **Generation**: `/src/templates/generation.ts`
- **Preview**: `/src/templates/previewRenderer.ts`
- **Export**: `/src/templates/exportRenderer.ts`
- **UI**: `/src/components/preview/DocumentationPreviewPanel.tsx`

## Benefits

✅ **Flexible**: Add new document types without code changes  
✅ **Modular**: Each output can have different templates and formats  
✅ **User Choice**: Users select which output they want to generate  
✅ **Format Control**: Define which export formats are available per output  
✅ **Performance**: Future: Run only required analyzers per output
