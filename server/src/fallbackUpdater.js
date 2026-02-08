export function fallbackUpdate(bundle, instruction){
  const wantsSize = /\bsize\b|\bsm\b|\bmd\b|\blg\b/i.test(instruction || "");
  if (!wantsSize) {
    return { patchText: "--- a/NOOP\n+++ b/NOOP\n@@\n+ No fallback rule matched.\n", next: bundle };
  }

  const jsxPath = Object.keys(bundle.files).find(p => p.endsWith("/MfButton.jsx"));
  const cssPath = Object.keys(bundle.files).find(p => p.endsWith("/MfButton.css"));
  if (!jsxPath || !cssPath) {
    return { patchText: "--- a/ERR\n+++ b/ERR\n@@\n+ MfButton.jsx/css not found\n", next: bundle };
  }

  let jsx = bundle.files[jsxPath];
  let css = bundle.files[cssPath];

  if (!/\bsize\s*=\s*"md"/.test(jsx)) {
    jsx = jsx.replace(/variant\s*=\s*"primary",/, 'variant = "primary",\n  size = "md",');
  }
  if (!/mfSm|mfMd|mfLg/.test(jsx)) {
    jsx = jsx.replace(/"mfRoot",/, '"mfRoot",\n    size === "sm" ? "mfSm" : size === "lg" ? "mfLg" : "mfMd",');
  }
  if (!css.includes(".mfSm")) {
    css += "\n\n/* Size variants (patch) */\n.mfSm{padding:8px 12px;font-size:13px;border-radius:10px;}\n.mfMd{padding:10px 16px;font-size:14px;border-radius:12px;}\n.mfLg{padding:12px 18px;font-size:15px;border-radius:14px;}\n";
  }

  const next = { ...bundle, createdAt: new Date().toISOString(), summary: bundle.summary + " Updated: size variants.", files: { ...bundle.files, [jsxPath]: jsx, [cssPath]: css } };
  const patchText = `--- a/${jsxPath}\n+++ b/${jsxPath}\n@@\n+ Added size prop\n\n--- a/${cssPath}\n+++ b/${cssPath}\n@@\n+ Added size CSS\n`;
  return { patchText, next };
}
