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
  const isDisabled = disabled || loading;

  const cls = cx(
    "mfRoot",
    variant === "secondary" ? "mfSecondary" : "mfPrimary",
    size === "sm" ? "mfSm" : size === "lg" ? "mfLg" : "mfMd",
    isDisabled ? "mfDisabled" : ""
  );

  return (
    <button
      className={cls}
      disabled={isDisabled}
      aria-busy={loading ? "true" : "false"}
      onClick={isDisabled ? undefined : onClick}
      type="button"
      data-testid="mfbutton"
    >
      {loading ? <span className="mfSpinner" aria-hidden="true" /> : null}
      <span className="mfLabel">{label}</span>
    </button>
  );
}