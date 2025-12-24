# Product Clarity Workspace Architecture

This document outlines the high-level architecture of the Product Clarity Workspace, aligning with the "Guided Interview" and "Analysis Engine" concepts.

## Directory Structure

### `src/components/`
Contains the React UI components, organized by domain.
- `layout/`: App shell, navigation, wrappers.
- `interview/`: Components for the Guided Interview experience (questions, navigation).
- `preview/`: Components for the Live Documentation Preview (rendered output, status).

### `src/analyzers/`
Contains pure logic modules for specific analysis tasks.
- `painPointAnalyzer.ts`: Detects gaps in pain point descriptions.
- `personaAnalyzer.ts`: Validates target audience definitions.
- `types.ts`: Shared interfaces for analysis results (`AnalyzerResult`, `Provenance`).
**Note**: Analyzers should not contain React code.

### `src/engine/`
The orchestration layer for the analysis pipeline.
- `normalize.ts`: Prepares raw session data for analysis.
- `analysisEngine.ts`: Main entry point (`runAnalysis`) that invokes individual analyzers.
- `validation.ts`: Checks section completeness and hard constraints.
- `generation.ts`: Drives content generation using templates.

### `src/config/`
Loaders for static configuration and assets.
- `questions.ts`: Loads interview questions.
- `blueprints.ts`: Loads interview blueprints.
- `templates.ts`: Loads Handlebars templates.

### `src/templates/`
Handling of string generation and export formats.
- `handlebarsEngine.ts`: Wrapper around Handlebars compilation/safety.
- `previewRenderer.ts`: Prepares data for the Preview UI.
- `exportRenderer.ts`: logic for PDF/DOCX generation.

### `src/state/`
State management (Zustand).
- `sessionStore.ts`: The single source of truth for the active session.

## Data Flow
1.  **User Input** -> `GuidedInterviewPanel` -> `sessionStore` (Raw Answers).
2.  **Auto-Analysis** -> `App` (Effect) -> `analysisEngine.runAnalysis()` -> `analyzers/*` -> `sessionStore` (Derived Inferences).
3.  **Preview** -> `sessionStore` -> `generation.ts` -> `templates/*` -> `DocumentationPreviewPanel`.
