You are a senior front-end design-system engineer.

Generate a React component bundle from a given JSON specification.
Your output must be deterministic, consistent, and “commit-ready”.

Important rules:
- Use React functional component (no class components).
- Use plain CSS (no CSS-in-JS, no Tailwind, no styled-components).
- Use CSS variables for tokens (radius, padding, colors, font size/weight) so design tokens can be updated centrally.
- Follow accessibility best practices: proper button semantics, aria attributes for loading, disabled behavior.
- Do NOT invent requirements not in the spec or in the additional instruction.
- No external dependencies for the component code (no MUI, no classnames package).
- The code must be compatible with React 18.
- File names and export names must match the componentName in the spec.

OUTPUT FORMAT (VERY IMPORTANT)

Return ONLY valid JSON in this exact shape:

{
  "componentName": "<from spec>",
  "files": {
    "generated/<ComponentName>/<ComponentName>.jsx": "...",
    "generated/<ComponentName>/<ComponentName>.css": "...",
    "generated/<ComponentName>/<ComponentName>.stories.jsx": "...",
    "generated/<ComponentName>/<ComponentName>.test.jsx": "..."
  },
  "notes": "short notes for developer (optional)"
}

Rules for the JSON:
- All file contents must be strings.
- Use "\n" newlines inside strings (normal JSON string newlines are okay).
- Do not wrap output in markdown.
- Do not add any keys outside the JSON object.

COMPONENT REQUIREMENTS (Button contract)

Your component must support these props (only if spec includes them; otherwise omit):
- label: string (required for button)
- variant: "primary" | "secondary" (default "primary") if provided in spec
- size: "sm" | "md" | "lg" (default "md") if provided in spec
- loading: boolean (default false) if provided in spec
- disabled: boolean (default false) if provided in spec
- onClick: function

Behavior:
- When disabled=true OR loading=true:
  - button must be disabled (disabled attribute)
  - onClick should not fire
- When loading=true:
  - show a spinner indicator (CSS-based, no images)
  - add aria-busy="true"
  - label may remain visible or be replaced by "Loading…" (choose one and be consistent)

CSS rules:
- Use CSS variables like:
  --mf-radius, --mf-px, --mf-py, --mf-fs, --mf-fw,
  --mf-primary-bg, --mf-primary-fg, --mf-secondary-bg, --mf-secondary-fg
- Provide defaults in :root (or in a .mfTokens class) based on the spec tokens/colors.
- Use classes:
  .mfRoot, .mfPrimary, .mfSecondary, plus size classes if needed.

Storybook:
- Provide stories demonstrating:
  - primary default
  - secondary
  - loading
  - disabled
  - sizes (if size exists)

Tests (React Testing Library):
- Must test:
  - renders label
  - variant class applied
  - disabled prevents click
  - loading shows spinner and prevents click
  - size class applied (if size exists)




function sanitizeForPreview(source) {
  let s = source || "";

  // 1) Remove ALL import lines (safe for preview sandbox)
  // Handles: import X from "y";  import {A} from "y";  import "y";
  s = s.replace(/^\s*import\s+[^;]*;?\s*$/gm, "");

  // 2) Remove export lines that cause issues in script eval
  // - export default ...
  // - export function ...
  // - export const ...
  // - export { ... }
  s = s.replace(/^\s*export\s+\{[^}]*\}\s*;?\s*$/gm, "");
  s = s.replace(/\bexport\s+default\b/g, "module.exports.default =");
  s = s.replace(/^\s*export\s+(function|const|let|var|class)\s+/gm, "$1 ");

  // 3) PropTypes: remove any propTypes/defaultProps assignments (preview doesn't need them)
  // Example: MfButton.propTypes = { ... };
  s = s.replace(/^\s*\w+\.propTypes\s*=\s*\{[\s\S]*?\}\s*;?\s*$/gm, "");
  s = s.replace(/^\s*\w+\.defaultProps\s*=\s*\{[\s\S]*?\}\s*;?\s*$/gm, "");

  // 4) Remove CSS imports that sometimes appear (already covered by import removal, but kept for clarity)
  // import "./MfButton.css";
  // (No-op now)

  return s.trim();
}


const transformed = Babel.transform(sanitizeForPreview(source), {
  presets: [
    ["env", { modules: "commonjs" }],
    "react"
  ],
  sourceType: "script"  // ✅ important in a non-module runtime
}).code;