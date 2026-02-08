import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { callCodestralJSON, rid } from "./codestral.js";
import { generateFallback } from "./fallbackGenerator.js";
import { fallbackUpdate } from "./fallbackUpdater.js";
import { sendZip } from "./zipper.js";
import { applyPatch } from "diff";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "4mb" }));

const PORT = Number(process.env.PORT ?? 8787);
const memory = new Map();

app.get("/health", (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.post("/api/generate", async (req, res) => {
  const spec = req.body || {};
  if (!spec.componentName || !spec.type) return res.status(400).json({ ok:false, error:"spec must include componentName and type" });

  const cfg = {
    baseUrl: process.env.CODESTRAL_BASE_URL,
    token: process.env.CODESTRAL_TOKEN,
    model: process.env.CODESTRAL_MODEL ?? "codestral-latest",
    route: process.env.CODESTRAL_ROUTE ?? "/v1/chat/completions"
  };

  const system = "You generate a React component bundle. Return ONLY JSON: {summary:string, files:{path:string}}";
  const user = `SPEC JSON:\n${JSON.stringify(spec, null, 2)}\n\nReturn files under generated/${spec.componentName}/ with .jsx/.css/.stories.jsx/.test.jsx`;

  const llm = await callCodestralJSON(cfg, [{ role:"system", content: system }, { role:"user", content: user }], 0.1);

  let bundle, used="fallback", reason="";
  if (llm.ok && llm.data?.files) {
    used="codestral";
    bundle = { id: rid(), createdAt: new Date().toISOString(), summary: llm.data.summary || "Generated.", files: llm.data.files };
  } else {
    reason = llm.reason || "LLM unavailable";
    bundle = generateFallback(spec);
  }

  memory.set(bundle.id, bundle);
  res.json({ ok:true, used, reason, bundle });
});

app.post("/api/update", async (req, res) => {
  const { bundleId, instruction } = req.body || {};
  if (!bundleId || !instruction) return res.status(400).json({ ok:false, error:"bundleId and instruction are required" });

  const bundle = memory.get(bundleId);
  if (!bundle) return res.status(404).json({ ok:false, error:"Bundle not found" });

  const cfg = {
    baseUrl: process.env.CODESTRAL_BASE_URL,
    token: process.env.CODESTRAL_TOKEN,
    model: process.env.CODESTRAL_MODEL ?? "codestral-latest",
    route: process.env.CODESTRAL_ROUTE ?? "/v1/chat/completions"
  };

  const system = "You output ONLY JSON: {patches:[{path,patch}], summary:string}. Patches must be unified diff and apply cleanly.";
  const user = `INSTRUCTION:\n${instruction}\n\nFILES (path->content):\n${JSON.stringify(bundle.files, null, 2)}`;
  const llm = await callCodestralJSON(cfg, [{ role:"system", content: system }, { role:"user", content: user }], 0.0);

  if (llm.ok && Array.isArray(llm.data?.patches) && llm.data.patches.length) {
    try {
      const nextFiles = { ...bundle.files };
      for (const p of llm.data.patches) {
        if (nextFiles[p.path] == null) throw new Error("Unknown path: " + p.path);
        const out = applyPatch(nextFiles[p.path], p.patch);
        if (out === false) throw new Error("Patch failed to apply: " + p.path);
        nextFiles[p.path] = out;
      }
      const next = { ...bundle, id: rid(), createdAt: new Date().toISOString(), summary: llm.data.summary || (bundle.summary + " Updated."), files: nextFiles };
      memory.set(next.id, next);
      return res.json({ ok:true, used:"codestral", patchText: llm.data.patches.map(x=>x.patch).join("\n\n"), bundle: next });
    } catch (e) {
      const fb = fallbackUpdate(bundle, instruction);
      const next = { ...fb.next, id: rid() };
      memory.set(next.id, next);
      return res.json({ ok:true, used:"fallback", reason: String(e?.message || e), patchText: fb.patchText, bundle: next });
    }
  }

  const fb = fallbackUpdate(bundle, instruction);
  const next = { ...fb.next, id: rid() };
  memory.set(next.id, next);
  return res.json({ ok:true, used:"fallback", reason: llm.reason || "LLM not configured", patchText: fb.patchText, bundle: next });
});

app.get("/api/download/:id", async (req, res) => {
  const b = memory.get(req.params.id);
  if (!b) return res.status(404).send("Not found");
  await sendZip(res, `${b.id}-generated.zip`, b.files);
});

app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
