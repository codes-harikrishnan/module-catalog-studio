import React from "react";
import "./MfButton.css";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

export default function MfButton({
  label = "Continue",
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  onClick
}) {
  const cls = cx(
    "mfRoot",
    variant === "secondary" ? "mfSecondary" : "mfPrimary",
    size === "sm" ? "mfSm" : size === "lg" ? "mfLg" : "mfMd",
    disabled ? "mfDisabled" : ""
  );

  return (
    <button
      className={cls}
      disabled={disabled}                 
      aria-busy={loading ? "true" : "false"}
      onClick={onClick}                   
      type="button"
      data-testid="mfbutton"
    >
      {loading ? <span className="mfSpinner" /> : null}
      <span className="mfLabel">{label}</span>
    </button>
  );
}