# Smart Module Catalogue — WOW POC v2 (Full)

## Run
```bash
npm i
npm run install:all
npm run dev
```

Open:
- http://localhost:5173 (client)
- http://localhost:8787/health (server)

## Notes
- Works without Codestral (fallback generator + fallback patch update).
- Live Preview uses Babel Standalone + `transform-modules-commonjs` + `ReactDOM.render` (UMD safe).
- Update mode demonstrates maintainability using patch-style updates.


## Prompt

You are a senior frontend architect working on a design-system automation platform.

Your task is to convert a raw Figma "Selection JSON" (exported from a Figma plugin)
into a clean, normalized JSON specification used by a Smart Module Catalogue.

The output JSON MUST:
- Be deterministic (no hallucinated values)
- Contain only what can be inferred from the input
- Follow the exact schema described below
- Use sensible defaults only when values are missing
- Be suitable for LLM-based code generation and future patch updates

{
  "componentName": "MfButton",
  "type": "button",
  "description": "",
  "variants": [],
  "states": [],
  "tokens": {
    "fontSize": number,
    "fontWeight": number,
    "borderRadius": number,
    "paddingX": number,
    "paddingY": number,
    "gap": number
  },
  "colors": {
    "primaryBg": "",
    "primaryText": "",
    "secondaryBg": "",
    "secondaryText": ""
  },
  "figma": {
    "source": "selection-json",
    "componentName": "",
    "componentProperties": {},
    "boundVariables": {},
    "notes": ""
  }
}
## CONVERSION RULES
1. componentName:
   - Use the Figma component or instance name.
   - Prefix with "Mf" (e.g., "Button" → "MfButton").

2. variants:
   - Extract from componentProperties with type "VARIANT".
   - Example: size, stack, arrangement.

3. tokens:
   - Extract numeric values from layout, padding, spacing.
   - If a variable alias exists, prefer numeric fallback if visible.

4. colors:
   - Extract from fills / selection colors.
   - If token names are present, preserve them in figma.boundVariables.

5. figma.componentProperties:
   - Copy all variant-like properties exactly as key → value.

6. figma.boundVariables:
   - Copy variable alias IDs if present.

7. DO NOT:
   - Generate JSX, HTML, CSS, or React code
   - Invent values not present in the input
   - Rename keys beyond the schema
  
## INPUT (FIGMA SELECTION JSON)

## OUTPUT REQUIREMENTS
- Output ONLY valid JSON
- No markdown
- No explanation
- No comments
