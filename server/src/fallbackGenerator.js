import { rid } from "./codestral.js";

function cssButton(spec) {
  const t = spec.tokens || {};
  const c = spec.colors || {};
  const radius = t.borderRadius ?? 12;
  const px = t.paddingX ?? 16;
  const py = t.paddingY ?? 10;
  const fs = t.fontSize ?? 14;
  const fw = t.fontWeight ?? 700;

  const primaryBg = c.primaryBg ?? "#00965e";
  const primaryText = c.primaryText ?? "#FFFFFF";
  const secondaryBg = c.secondaryBg ?? "#111827";
  const secondaryText = c.secondaryText ?? "#FFFFFF";

  return `:root{--mf-radius:${radius}px;--mf-px:${px}px;--mf-py:${py}px;--mf-fs:${fs}px;--mf-fw:${fw};--mf-primary-bg:${primaryBg};--mf-primary-fg:${primaryText};--mf-secondary-bg:${secondaryBg};--mf-secondary-fg:${secondaryText};}
.mfRoot{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:var(--mf-radius);padding:var(--mf-py) var(--mf-px);font-size:var(--mf-fs);font-weight:var(--mf-fw);border:1px solid transparent;cursor:pointer;user-select:none;transition:transform .05s ease, filter .15s ease, opacity .15s ease, box-shadow .15s ease;}
.mfRoot:active{transform:translateY(1px);}
.mfRoot:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(37,99,235,.35);}
.mfPrimary{background:var(--mf-primary-bg);color:var(--mf-primary-fg);}
.mfSecondary{background:var(--mf-secondary-bg);color:var(--mf-secondary-fg);}
.mfDisabled{opacity:.55;cursor:not-allowed;}
.mfLoading{opacity:.85;cursor:progress;}
.mfSpinner{width:14px;height:14px;border-radius:999px;border:2px solid rgba(255,255,255,.35);border-top-color:rgba(255,255,255,.95);animation:spin .8s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
/* Size variants (v2) */
.mfSm{padding:8px 12px;font-size:13px;border-radius:10px;}
.mfMd{padding:10px 16px;font-size:14px;border-radius:12px;}
.mfLg{padding:12px 18px;font-size:15px;border-radius:14px;}`;
}

function jsButton(name) {
  const tid = name.toLowerCase();
  return `function cx(...parts){return parts.filter(Boolean).join(" ");}

export function ${name}({
  label = "Continue",
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  onClick,
  testId = "${tid}",
  ariaLabel
}){
  const isDisabled = disabled || loading;
  const cls = cx(
    "mfRoot",
    size === "sm" ? "mfSm" : size === "lg" ? "mfLg" : "mfMd",
    variant === "secondary" ? "mfSecondary" : "mfPrimary",
    isDisabled ? "mfDisabled" : "",
    loading ? "mfLoading" : ""
  );

  return (
    <button
      type="button"
      className={cls}
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      data-testid={testId}
      aria-label={ariaLabel || label}
    >
      {loading ? <span className="mfSpinner" aria-hidden="true" /> : null}
      <span>{label}</span>
    </button>
  );
}

export default ${name};`;
}

function storyButton(name) {
  return `import React from "react";
import ${name} from "./${name}";

export default {
  title: "SmartCatalogue/${name}",
  component: ${name},
  argTypes: {
    variant: { control: { type: "select" }, options: ["primary","secondary"] },
    size: { control: { type: "select" }, options: ["sm","md","lg"] }
  }
};

export const Playground = (args) => <${name} {...args} />;
Playground.args = { label:"Continue", variant:"primary", size:"md", loading:false, disabled:false };`;
}

function testButton(name) {
  return `import React from "react";
import { render, screen } from "@testing-library/react";
import ${name} from "./${name}";

describe("${name}", () => {
  it("renders label", () => {
    render(<${name} label="Save" />);
    expect(screen.getByText("Save")).toBeInTheDocument();
  });
});`;
}

function cssTextInput(spec) {
  const t = spec.tokens || {};
  const c = spec.colors || {};
  const radius = t.borderRadius ?? 12;
  const px = t.paddingX ?? 12;
  const py = t.paddingY ?? 10;
  const fs = t.fontSize ?? 14;
  const border = c.border ?? "#D1D5DB";
  const focus = c.focus ?? "#2563EB";
  const bg = c.bg ?? "#FFFFFF";
  const fg = c.fg ?? "#111827";
  const hint = c.hint ?? "#6B7280";
  return `:root{--mf-radius:${radius}px;--mf-px:${px}px;--mf-py:${py}px;--mf-fs:${fs}px;--mf-border:${border};--mf-focus:${focus};--mf-bg:${bg};--mf-fg:${fg};--mf-hint:${hint};}
.mfField{display:flex;flex-direction:column;gap:6px;max-width:360px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;}
.mfLabel{font-size:12px;color:var(--mf-hint);font-weight:600;}
.mfInput{border:1px solid var(--mf-border);border-radius:var(--mf-radius);padding:var(--mf-py) var(--mf-px);font-size:var(--mf-fs);background:var(--mf-bg);color:var(--mf-fg);outline:none;transition:box-shadow .15s ease,border-color .15s ease;}
.mfInput:focus{border-color:var(--mf-focus);box-shadow:0 0 0 3px rgba(37,99,235,.25);}
.mfHelp{font-size:12px;color:var(--mf-hint);}
.mfError{font-size:12px;color:#B91C1C;font-weight:600;}
.mfInputError{border-color:#B91C1C;box-shadow:0 0 0 3px rgba(185,28,28,.18);}`;
}

function jsTextInput(name) {
  const tid = name.toLowerCase();
  return `export function ${name}({
  label = "Email",
  value,
  defaultValue,
  placeholder = "name@company.com",
  onChange,
  helpText,
  errorText,
  disabled = false,
  testId = "${tid}",
  ariaLabel
}){
  const isError = Boolean(errorText);
  return (
    <div className="mfField" data-testid={testId}>
      {label ? <div className="mfLabel">{label}</div> : null}
      <input
        className={isError ? "mfInput mfInputError" : "mfInput"}
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel || label || "input"}
        onChange={(e) => onChange?.(e.target.value, e)}
      />
      {isError ? <div className="mfError">{errorText}</div> : null}
      {!isError && helpText ? <div className="mfHelp">{helpText}</div> : null}
    </div>
  );
}
export default ${name};`;
}

function storyTextInput(name) {
  return `import React, { useState } from "react";
import ${name} from "./${name}";
export default { title: "SmartCatalogue/${name}", component: ${name} };
export const Playground = (args) => {
  const [v, setV] = useState(args.defaultValue || "");
  return <${name} {...args} value={v} onChange={(nv) => setV(nv)} />;
};
Playground.args = { label:"Email", placeholder:"name@company.com", helpText:"We will never share your email.", errorText:"" };`;
}

function testTextInput(name) {
  return `import React from "react";
import { render, screen } from "@testing-library/react";
import ${name} from "./${name}";
describe("${name}", () => {
  it("renders label", () => {
    render(<${name} label="Email" />);
    expect(screen.getByText("Email")).toBeInTheDocument();
  });
});`;
}

export function generateFallback(spec) {
  const id = rid();
  const createdAt = new Date().toISOString();
  const name = spec.componentName || "Component";
  const base = `generated/${name}`;
  const files = {};
  if (spec.type === "textInput") {
    files[`${base}/${name}.jsx`] = jsTextInput(name);
    files[`${base}/${name}.css`] = cssTextInput(spec);
    files[`${base}/${name}.stories.jsx`] = storyTextInput(name);
    files[`${base}/${name}.test.jsx`] = testTextInput(name);
  } else {
    files[`${base}/${name}.jsx`] = jsButton(name);
    files[`${base}/${name}.css`] = cssButton(spec);
    files[`${base}/${name}.stories.jsx`] = storyButton(name);
    files[`${base}/${name}.test.jsx`] = testButton(name);
  }
  return { id, createdAt, summary: `Generated ${spec.type} "${name}"`, files };
}
