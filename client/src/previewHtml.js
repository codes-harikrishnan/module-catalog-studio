export function makePreviewHtml({
  componentName,
  componentJsx,
  cssText,
  demoProps,
}) {
  const safeDemoProps = JSON.stringify(demoProps ?? {}, null, 0);

  // ✅ preview fix: CommonJS transform + ReactDOM.render
  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Preview</title>
    <style>
      body{margin:0;background:#0b1020;color:#e6eefc;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial}
      .wrap{padding:22px}
      .card{border:1px solid rgba(148,163,184,.18);background:rgba(15,23,42,.55);border-radius:16px;padding:16px}
      .row{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
      .hint{color:#93a4c7;font-size:12px;margin-top:10px;line-height:1.4}
      .chip{border:1px solid rgba(148,163,184,.18);border-radius:999px;padding:8px 10px;font-size:12px;color:#93a4c7}
      ${cssText || ""}
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="row" style="justify-content:space-between;margin-bottom:12px">
        <div class="chip">Live Module catalogue component preview</div>
        <div class="chip">${componentName}</div>
      </div>

      <div class="card">
        <div id="root"></div>
        <div class="hint">Design → Code → Preview → Commit-ready</div>
      </div>
    </div>

    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

    <script>
      const props = ${safeDemoProps};
      const source = ${JSON.stringify(componentJsx || "", null, 0)};

      function run(){
        const transformed = Babel.transform(source, {
          presets: ["react"],
          plugins: ["transform-modules-commonjs"]
        }).code;

        const moduleObj = { exports: {} };
        const exportsObj = moduleObj.exports;

        const fn = new Function("React", "module", "exports", transformed + "; return module.exports;");
        const mod = fn(React, moduleObj, exportsObj) || moduleObj.exports;

        const Component =
          mod.default ||
          mod["${componentName}"] ||
          moduleObj.exports.default ||
          moduleObj.exports["${componentName}"];

        if (!Component) throw new Error("Component not found in generated code.");

        ReactDOM.render(
          React.createElement(Component, props),
          document.getElementById("root")
        );
      }

      try { run(); }
      catch (e){
        document.getElementById("root").innerHTML =
          '<div style="color:#fb7185;font-weight:800">Preview Error</div><pre style="white-space:pre-wrap;color:#93a4c7">' +
          String(e && (e.stack || e.message || e)) + '</pre>';
      }
    </script>
  </body>
</html>`;
}
