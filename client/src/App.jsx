import React, { useMemo, useState } from "react";
import { BUTTON_SPEC, INPUT_SPEC } from "./sampleSpecs";
import { makePreviewHtml } from "./previewHtml";
import SendIcon from "@mui/icons-material/Send";
import CommitSharpIcon from '@mui/icons-material/CommitSharp';
import CloudUploadSharpIcon from '@mui/icons-material/CloudUploadSharp';

function nowTime(){ return new Date().toLocaleString(); }
function sortPaths(paths){ return [...paths].sort((a,b)=>a.localeCompare(b)); }
function hashStr(s=""){ let h=0; for(let i=0;i<s.length;i++) h=(Math.imul(31,h)+s.charCodeAt(i))|0; return String(h); }

export default function App(){
  const [specText, setSpecText] = useState(JSON.stringify(BUTTON_SPEC, null, 2));
  const [status, setStatus] = useState({ kind:"idle", msg:"Ready." });

  // ✅ Version timeline (Option 1)
  const [versions, setVersions] = useState([]); // [{ id, label, createdAt, patchText, bundle }]
  const [activeVersionIndex, setActiveVersionIndex] = useState(-1);

  const activeBundle = useMemo(() => {
    if (activeVersionIndex < 0) return null;
    return versions[activeVersionIndex]?.bundle || null;
  }, [versions, activeVersionIndex]);

  const [activePath, setActivePath] = useState("");

  // Preview controls state
  const [demoVariant, setDemoVariant] = useState("primary");
  const [demoSize, setDemoSize] = useState("md");
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoDisabled, setDemoDisabled] = useState(false);
  const [buttonLabel, setButtonLabel] = useState("Continue");
  const [inputError, setInputError] = useState("");

  const [updateText, setUpdateText] = useState("Add size prop (sm/md/lg), default md, update CSS accordingly.");
  const [lastPatch, setLastPatch] = useState("");

  // Determine component type from spec (button vs textInput)
  const specType = useMemo(() => {
    try { return JSON.parse(specText)?.type || ""; }
    catch { return ""; }
  }, [specText]);

  // ✅ Feature caps by iteration index:
  // v0: base button -> label + variant only
  // v1: add loading + disabled
  // v2: add size sm/md/lg
  const featureCaps = useMemo(() => {
    if (activeVersionIndex < 0) {
      return { hasLoading:false, hasDisabled:false, hasSize:false };
    }
    return {
      hasLoading: activeVersionIndex >= 1,
      hasDisabled: activeVersionIndex >= 1,
      hasSize: activeVersionIndex >= 2
    };
  }, [activeVersionIndex]);

  const paths = useMemo(()=> activeBundle ? sortPaths(Object.keys(activeBundle.files||{})) : [], [activeBundle]);

  const activeContent = useMemo(()=>{
    if(!activeBundle || !activePath) return "";
    return activeBundle.files?.[activePath] ?? "";
  }, [activeBundle, activePath]);

  const componentName = useMemo(()=>{
    try { return JSON.parse(specText)?.componentName ?? "Component"; }
    catch { return "Component"; }
  }, [specText]);

  const componentFile = useMemo(()=> paths.find(p => p.endsWith(`/${componentName}.jsx`)) || "", [paths, componentName]);
  const cssFile = useMemo(()=> paths.find(p => p.endsWith(`/${componentName}.css`)) || "", [paths, componentName]);

  const previewHtml = useMemo(()=>{
    if(!activeBundle) return "";
    const jsx = componentFile ? (activeBundle.files?.[componentFile] || "") : "";
    const css = cssFile ? (activeBundle.files?.[cssFile] || "") : "";

    // ✅ Only pass props that exist at that iteration
    const demoProps = specType === "textInput"
      ? {
          label:"Email",
          placeholder:"name@bnpparibasfortis.com",
          helpText:"We will never share your email.",
          errorText: inputError
        }
      : {
          label: buttonLabel,
          variant: demoVariant,
          ...(featureCaps.hasSize ? { size: demoSize } : {}),
          ...(featureCaps.hasLoading ? { loading: demoLoading } : {}),
          ...(featureCaps.hasDisabled ? { disabled: demoDisabled } : {}),
          onClick: () => alert("Clicked!")
        };

    return makePreviewHtml({ componentName, componentJsx: jsx, cssText: css, demoProps });
  }, [
    activeBundle,
    componentFile,
    cssFile,
    componentName,
    specType,
    featureCaps,
    demoVariant,
    demoSize,
    demoLoading,
    demoDisabled,
    buttonLabel,
    inputError
  ]);

  const previewKey = useMemo(()=>{
    if(!activeBundle) return "empty";
    const jsx = componentFile ? (activeBundle.files?.[componentFile] || "") : "";
    const css = cssFile ? (activeBundle.files?.[cssFile] || "") : "";
    return activeBundle.id + ":" + hashStr(jsx + "||" + css);
  }, [activeBundle, componentFile, cssFile]);

  async function generate(){
    setStatus({ kind:"busy", msg:"Generating (Codestral or fallback)…" });
    setVersions([]); setActiveVersionIndex(-1);
    setActivePath(""); setLastPatch("");

    let spec;
    try { spec = JSON.parse(specText); }
    catch { setStatus({ kind:"bad", msg:"Invalid JSON." }); return; }

    try{
      const res = await fetch("/api/generate", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(spec)
      });
      const json = await res.json();
      if(!json.ok){ setStatus({ kind:"bad", msg:"Generation failed." }); return; }

      const v0 = {
        id: json.bundle.id,
        label: "v0 — Base component",
        createdAt: new Date().toISOString(),
        patchText: "",
        bundle: json.bundle
      };

      setVersions([v0]);
      setActiveVersionIndex(0);

      const first = Object.keys(json.bundle.files || {})[0] || "";
      setActivePath(first);

      // Reset controls to v0-friendly defaults
      setDemoLoading(false);
      setDemoDisabled(false);
      setDemoSize("md");

      setStatus({
        kind:"good",
        msg:`✅ ${String(json.used).toUpperCase()} generated at ${nowTime()} — ${json.bundle.summary}${json.reason ? ` (fallback reason: ${json.reason})` : ""}`
      });
    }catch{
      setStatus({ kind:"bad", msg:"Network error calling server." });
    }
  }

  async function updateBundle(){
    if(!activeBundle?.id) return;
    setStatus({ kind:"busy", msg:"Updating existing component (patch mode)..." });

    try{
      const res = await fetch("/api/update", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ bundleId: activeBundle.id, instruction: updateText })
      });
      const json = await res.json();
      if(!json.ok){ setStatus({ kind:"bad", msg:"Update failed." }); return; }

      const patchText = json.patchText || "";
      setLastPatch(patchText);

      setVersions((prev) => {
        const nextIndex = prev.length;
        const label = `v${nextIndex} — ${updateText.slice(0, 40)}${updateText.length > 40 ? "…" : ""}`;
        return [
          ...prev,
          {
            id: json.bundle.id,
            label,
            createdAt: new Date().toISOString(),
            patchText,
            bundle: json.bundle
          }
        ];
      });

      setActiveVersionIndex((prev) => prev + 1);

      // Keep activePath valid for the new bundle
      const nextPaths = Object.keys(json.bundle.files || {});
      if (!activePath || !json.bundle.files?.[activePath]) {
        setActivePath(nextPaths[0] || "");
      }

      setStatus({
        kind:"good",
        msg:`✅ ${String(json.used).toUpperCase()} updated at ${nowTime()}${json.reason ? ` — ${json.reason}` : ""}`
      });
    }catch{
      setStatus({ kind:"bad", msg:"Network error calling update endpoint." });
    }
  }

  function handleAction() {
  if (!activeBundle) {
    generate();       // first click → generate v0
  } else {
    updateBundle();   // next clicks → patch updates
  }
}
const actionHint = activeBundle
  ? "Applies the update instruction as a new version"
  : "Generates the base component (v0)";


  function loadSample(kind){
    if(kind==="button") setSpecText(JSON.stringify(BUTTON_SPEC, null, 2));
    if(kind==="input") setSpecText(JSON.stringify(INPUT_SPEC, null, 2));
    setVersions([]); setActiveVersionIndex(-1);
    setActivePath(""); setLastPatch("");
    setDemoLoading(false);
    setDemoDisabled(false);
    setDemoSize("md");
    setStatus({ kind:"idle", msg:"Loaded sample spec." });
  }

  const badge = status.kind === "good" ? "badgeGood" : status.kind === "bad" ? "badgeBad" : "";
  const badgeLabel = status.kind === "good" ? "OK" : status.kind === "bad" ? "ERROR" : status.kind === "busy" ? "WORKING" : "READY";

  return (
    <div>
      <div className="header">
        <div>
          <div className="brandTitle">Smart Module Catalogue — WOW POC v2</div>
          <div className="brandSub"> Provide spec & prompt → Generate files → Test & preview  → Commit and push</div>
        </div>
        <div className="actions">
          <div className="pill">
            Status: <span className={badge} style={{fontWeight:900}}>{badgeLabel}</span> — {status.msg}
          </div>
        </div>
      </div>

      <div className="grid">
        {/* Left panel */}
        <div className="panel">
          <div className="panelHeader">
            <div className="panelTitle">Add Specifications & instructions</div>
            <div className="row">
              <button className="btn small" onClick={()=>loadSample("button")}>Load Button</button>
              <button className="btn small" onClick={()=>loadSample("input")}>Load TextInput</button>
            </div>
          </div>
          <div className="panelBody">
            <div className="note">Paste a spec JSON or load a sample.</div>
            <hr />
            <textarea value={specText} onChange={(e)=>setSpecText(e.target.value)} />
            <hr />
            <div className="note" style={{marginBottom:8}}>Instructions (Prompt)</div>
            <textarea style={{minHeight:140}} value={updateText} onChange={(e)=>setUpdateText(e.target.value)} />


<div
  className="row"
  style={{
    marginTop: 10,
    justifyContent: "flex-end",
    gap: 0
  }}
>
<button
  className="btn btnPrimary"
  onClick={handleAction}
  disabled={status.kind === "busy" || (activeBundle && !updateText.trim())}
  style={{ minWidth: 100, display: "flex", alignItems: "center", gap: 8 }}
>
  
  <span>{"Send"}</span>
  <SendIcon fontSize="small" />
</button>
</div>

<div className="note" style={{  marginTop: 8,
    justifyContent: "flex-end",
    gap: 0 }}>
  {activeBundle
    ? "Each click applies the instruction as the next version (v1, v2, …)."
    : "First click generates the base component (v0)."}
</div>


<div className="note" style={{ marginTop: 8 }}>
  Demo flow: Generate v0 → Update v1 → Update v2 (time-travel in the preview).
</div>
          </div>
        </div>

        {/* Middle panel */}
        <div className="panel">
          <div className="panelHeader">
            <div className="panelTitle">Generated files: 4 (editable)</div>
            <div className="row">
              {activeBundle ? (
                <a className="btn small" href={`/api/download/${activeBundle.id}`} target="_blank" rel="noreferrer">Commit and Push <CloudUploadSharpIcon/></a>
              ) : <div className="note">No changes to commit.</div>}
            </div>
          </div>
          <div className="panelBody">
            {!activeBundle ? (
              <div className="note">Click <b>Generate</b> to produce a component bundle.</div>
            ) : (
              <div className="split">
                <div>
                  <div className="note" style={{marginBottom:8}}>File tree</div>
                  <div className="fileList">
                    {paths.map((p)=>(
                      <div
                        key={p}
                        className={"fileItem " + (p===activePath ? "fileItemActive": "")}
                        onClick={()=>setActivePath(p)}
                        title={p}
                      >
                        {p}
                      </div>
                    ))}
                  </div>
                  <hr />
                  <div className="note">
                    Preview uses:<br />
                    JSX: <span style={{fontFamily:"var(--mono)"}}>{componentFile || "(n/a)"}</span><br />
                    CSS: <span style={{fontFamily:"var(--mono)"}}>{cssFile || "(n/a)"}</span>
                  </div>
                </div>

                <div>
                  <div className="note" style={{marginBottom:8}}>Selected file (editable)</div>
                  <textarea
                    style={{minHeight:520}}
                    value={activeContent || ""}
                    onChange={(e)=>{
                      const nextText = e.target.value;

                      // ✅ Edit the ACTIVE version bundle
                      setVersions((prev) => {
                        if (activeVersionIndex < 0) return prev;
                        const next = [...prev];
                        const current = next[activeVersionIndex];
                        next[activeVersionIndex] = {
                          ...current,
                          bundle: {
                            ...current.bundle,
                            files: {
                              ...current.bundle.files,
                              [activePath]: nextText
                            }
                          }
                        };
                        return next;
                      });
                    }}
                  />

                  {lastPatch ? (
                    <>
                      <hr />
                      <div className="note" style={{marginBottom:8}}>Patch output (reviewable)</div>
                      <div className="code">{lastPatch}</div>
                    </>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="panel">
          <div className="panelHeader">
            <div className="panelTitle">Live Preview</div>

          </div>

          <div className="panelBody">
            {versions.length ? (
              <div className="fileList" style={{ marginBottom: 12 }}>
                {versions.map((v, idx) => (
                  <div
                    key={v.id}
                    className={"fileItem " + (idx === activeVersionIndex ? "fileItemActive" : "")}
                    onClick={() => {
                      setActiveVersionIndex(idx);
                      setLastPatch(v.patchText || "");

                      // Reset controls so earlier versions don’t “inherit” later toggles
                      setDemoLoading(false);
                      setDemoDisabled(false);
                      setDemoSize("md");

                      // Keep activePath valid for the selected version
                      const b = v.bundle;
                      if (!b?.files) return;
                      if (!activePath || !b.files[activePath]) {
                        const first = Object.keys(b.files)[0] || "";
                        setActivePath(first);
                      }
                    }}
                    title={v.createdAt}
                  >
                    {v.label}
                  </div>
                ))}
              </div>
            ) : null}

             {versions.length ? <div className="panelBody">
              <input
                type="text"
                value={buttonLabel}
                onChange={(e)=>setButtonLabel(e.target.value)}
                placeholder="Button text…"
                style={{minWidth:160}}
              />

              <select value={demoVariant} onChange={(e)=>setDemoVariant(e.target.value)} title="Variant">
                <option value="primary">primary</option>
                <option value="secondary">secondary</option>
              </select>

              {featureCaps.hasSize && (
                <select value={demoSize} onChange={(e)=>setDemoSize(e.target.value)} title="Size">
                  <option value="sm">sm</option>
                  <option value="md">md</option>
                  <option value="lg">lg</option>
                </select>
              )}

              {featureCaps.hasLoading && (
                <label className="note">
                  <input type="checkbox" checked={demoLoading} onChange={(e)=>setDemoLoading(e.target.checked)} /> loading
                </label>
              )}

              {featureCaps.hasDisabled && (
                <label className="note">
                  <input type="checkbox" checked={demoDisabled} onChange={(e)=>setDemoDisabled(e.target.checked)} /> disabled
                </label>
              )}

              {specType === "textInput" && (
                <input
                  type="text"
                  value={inputError}
                  onChange={(e)=>setInputError(e.target.value)}
                  placeholder="(TextInput) error text…"
                  style={{minWidth:180}}
                />
              )}
            </div> : null}
            {!activeBundle ? (
              <div className="note">Generate a bundle to render the component here.</div>
            ) : (
              <div className="previewWrap">
                <iframe key={previewKey} sandbox="allow-scripts allow-forms" srcDoc={previewHtml} title="preview" />
              </div>
            )}

            <hr />
            <div className="note">This is a preview of the UI component generated in the step 2.</div>
          </div>
        </div>
      </div>
    </div>
  );
}