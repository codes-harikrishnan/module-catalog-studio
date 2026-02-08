import React, { useMemo, useState } from "react";
import { BUTTON_SPEC, INPUT_SPEC } from "./sampleSpecs";
import { makePreviewHtml } from "./previewHtml";

function nowTime(){ return new Date().toLocaleString(); }
function sortPaths(paths){ return [...paths].sort((a,b)=>a.localeCompare(b)); }
function hashStr(s=""){ let h=0; for(let i=0;i<s.length;i++) h=(Math.imul(31,h)+s.charCodeAt(i))|0; return String(h); }

export default function App(){
  const [specText, setSpecText] = useState(JSON.stringify(BUTTON_SPEC, null, 2));
  const [status, setStatus] = useState({ kind:"idle", msg:"Ready." });
  const [bundle, setBundle] = useState(null);
  const [activePath, setActivePath] = useState("");
  const [demoVariant, setDemoVariant] = useState("primary");
  const [demoSize, setDemoSize] = useState("md");
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoDisabled, setDemoDisabled] = useState(false);
  const [buttonLabel, setButtonLabel] = useState("Continue");
  const [inputError, setInputError] = useState("");
  const [updateText, setUpdateText] = useState("Add size prop (sm/md/lg), default md, update CSS accordingly.");
  const [lastPatch, setLastPatch] = useState("");

  const paths = useMemo(()=> bundle ? sortPaths(Object.keys(bundle.files||{})) : [], [bundle]);

  const activeContent = useMemo(()=>{
    if(!bundle || !activePath) return "";
    return bundle.files?.[activePath] ?? "";
  }, [bundle, activePath]);

  const componentName = useMemo(()=>{
    try { return JSON.parse(specText)?.componentName ?? "Component"; }
    catch { return "Component"; }
  }, [specText]);

  const componentFile = useMemo(()=> paths.find(p => p.endsWith(`/${componentName}.jsx`)) || "", [paths, componentName]);
  const cssFile = useMemo(()=> paths.find(p => p.endsWith(`/${componentName}.css`)) || "", [paths, componentName]);

  const previewHtml = useMemo(()=>{
    if(!bundle) return "";
    const jsx = componentFile ? (bundle.files?.[componentFile] || "") : "";
    const css = cssFile ? (bundle.files?.[cssFile] || "") : "";
    const type = (()=>{ try{return JSON.parse(specText)?.type;}catch{return"";} })();

    const demoProps = type === "textInput"
      ? { label:"Email", placeholder:"name@company.com", helpText:"We will never share your email.", errorText: inputError }
      : { label: buttonLabel, variant: demoVariant, size: demoSize, loading: demoLoading, disabled: demoDisabled, onClick: () => alert("Clicked!") };

    return makePreviewHtml({ componentName, componentJsx: jsx, cssText: css, demoProps });
  }, [bundle, componentFile, cssFile, componentName, demoVariant, demoSize, demoLoading, demoDisabled, buttonLabel, inputError, specText]);

  const previewKey = useMemo(()=>{
    if(!bundle) return "empty";
    const jsx = componentFile ? (bundle.files?.[componentFile] || "") : "";
    const css = cssFile ? (bundle.files?.[cssFile] || "") : "";
    return bundle.id + ":" + hashStr(jsx + "||" + css);
  }, [bundle, componentFile, cssFile]);

  async function generate(){
    setStatus({ kind:"busy", msg:"Generating (Codestral or fallback)…" });
    setBundle(null); setActivePath(""); setLastPatch("");

    let spec;
    try { spec = JSON.parse(specText); }
    catch { setStatus({ kind:"bad", msg:"Invalid JSON." }); return; }

    try{
      const res = await fetch("/api/generate", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(spec) });
      const json = await res.json();
      if(!json.ok){ setStatus({ kind:"bad", msg:"Generation failed." }); return; }
      setBundle(json.bundle);
      const first = Object.keys(json.bundle.files || {})[0] || "";
      setActivePath(first);
      setStatus({ kind:"good", msg:`✅ ${String(json.used).toUpperCase()} generated at ${nowTime()} — ${json.bundle.summary}${json.reason ? ` (fallback reason: ${json.reason})` : ""}` });
    }catch{
      setStatus({ kind:"bad", msg:"Network error calling server." });
    }
  }

  async function updateBundle(){
    if(!bundle?.id) return;
    setStatus({ kind:"busy", msg:"Updating existing component (patch mode)..." });
    try{
      const res = await fetch("/api/update", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ bundleId: bundle.id, instruction: updateText }) });
      const json = await res.json();
      if(!json.ok){ setStatus({ kind:"bad", msg:"Update failed." }); return; }
      setBundle(json.bundle);
      setLastPatch(json.patchText || "");
      setStatus({ kind:"good", msg:`✅ ${String(json.used).toUpperCase()} updated at ${nowTime()}${json.reason ? ` — ${json.reason}` : ""}` });
    }catch{
      setStatus({ kind:"bad", msg:"Network error calling update endpoint." });
    }
  }

  function loadSample(kind){
    if(kind==="button") setSpecText(JSON.stringify(BUTTON_SPEC, null, 2));
    if(kind==="input") setSpecText(JSON.stringify(INPUT_SPEC, null, 2));
    setBundle(null); setActivePath(""); setLastPatch("");
    setStatus({ kind:"idle", msg:"Loaded sample spec." });
  }

  const badge = status.kind === "good" ? "badgeGood" : status.kind === "bad" ? "badgeBad" : "";
  const badgeLabel = status.kind === "good" ? "OK" : status.kind === "bad" ? "ERROR" : status.kind === "busy" ? "WORKING" : "READY";

  return (
    <div>
      <div className="header">
        <div>
          <div className="brandTitle">Smart Module Catalogue — WOW POC v2</div>
          <div className="brandSub">Generate + Patch Update + Live Preview + ZIP Download</div>
        </div>
        <div className="actions">
          <div className="pill">
            Status: <span className={badge} style={{fontWeight:900}}>{badgeLabel}</span> — {status.msg}
          </div>
          <button className="btn btnPrimary" onClick={generate}>✨ Generate</button>
          <button className="btn" onClick={updateBundle} disabled={!bundle}>🩹 Update (Patch)</button>
        </div>
      </div>

      <div className="grid">
        <div className="panel">
          <div className="panelHeader">
            <div className="panelTitle">1) Spec + Update instruction</div>
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
            <div className="note" style={{marginBottom:8}}>Update instruction (patch mode)</div>
            <textarea style={{minHeight:140}} value={updateText} onChange={(e)=>setUpdateText(e.target.value)} />
          </div>
        </div>

        <div className="panel">
          <div className="panelHeader">
            <div className="panelTitle">2) Generated Files (editable) + Patch</div>
            <div className="row">
              {bundle ? (
                <a className="btn small" href={`/api/download/${bundle.id}`} target="_blank" rel="noreferrer">⬇️ Download ZIP</a>
              ) : <div className="note">Generate to enable ZIP</div>}
            </div>
          </div>
          <div className="panelBody">
            {!bundle ? (
              <div className="note">Click <b>Generate</b> to produce a component bundle.</div>
            ) : (
              <div className="split">
                <div>
                  <div className="note" style={{marginBottom:8}}>File tree</div>
                  <div className="fileList">
                    {paths.map((p)=>(
                      <div key={p} className={"fileItem " + (p===activePath ? "fileItemActive": "")} onClick={()=>setActivePath(p)} title={p}>
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
                      const next = e.target.value;
                      setBundle((b)=>{
                        if(!b) return b;
                        return { ...b, files: { ...b.files, [activePath]: next } };
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

        <div className="panel">
          <div className="panelHeader">
            <div className="panelTitle">3) Live Preview</div>
            <div className="row">
              <input type="text" value={buttonLabel} onChange={(e)=>setButtonLabel(e.target.value)} placeholder="Button text…" style={{minWidth:160}}/>
              <select value={demoVariant} onChange={(e)=>setDemoVariant(e.target.value)} title="Variant">
                <option value="primary">primary</option>
                <option value="secondary">secondary</option>
              </select>
              <select value={demoSize} onChange={(e)=>setDemoSize(e.target.value)} title="Size">
                <option value="sm">sm</option>
                <option value="md">md</option>
                <option value="lg">lg</option>
              </select>
              <label className="note"><input type="checkbox" checked={demoLoading} onChange={(e)=>setDemoLoading(e.target.checked)} /> loading</label>
              <label className="note"><input type="checkbox" checked={demoDisabled} onChange={(e)=>setDemoDisabled(e.target.checked)} /> disabled</label>
              <input type="text" value={inputError} onChange={(e)=>setInputError(e.target.value)} placeholder="(TextInput) error text…" style={{minWidth:180}}/>
            </div>
          </div>
          <div className="panelBody">
            {!bundle ? (
              <div className="note">Generate a bundle to render the component here.</div>
            ) : (
              <div className="previewWrap">
                <iframe key={previewKey} sandbox="allow-scripts allow-forms" srcDoc={previewHtml} title="preview" />
              </div>
            )}
            <hr />
            <div className="note">Preview compiles JSX inside a sandboxed iframe (Babel + CommonJS transform).</div>
          </div>
        </div>
      </div>
    </div>
  );
}
