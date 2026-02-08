export const BUTTON_SPEC = {
  componentName: "MfButton",
  type: "button",
  description: "Primary CTA button with variants, sizes and loading state",
  variants: ["primary", "secondary"],
  tokens: {
    fontSize: 14,
    fontWeight: 700,
    borderRadius: 8,
    paddingX: 16,
    paddingY: 10,
  },
  colors: {
    primaryBg: "#00965e",
    primaryText: "#FFFFFF",
    secondaryBg: "#111827",
    secondaryText: "#FFFFFF",
  },
};

export const INPUT_SPEC = {
  componentName: "MfTextInput",
  type: "textInput",
  description: "Text input with label, help text and error message",
  tokens: { fontSize: 14, borderRadius: 8, paddingX: 12, paddingY: 10 },
  colors: {
    border: "#D1D5DB",
    focus: "#00965e",
    bg: "#FFFFFF",
    fg: "#111827",
    hint: "#6B7280",
  },
};
