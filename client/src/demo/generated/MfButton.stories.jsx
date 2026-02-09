import React from "react";
import MfButton from "./MfButton";

export default {
  title: "Generated/MfButton",
  component: MfButton,
  args: {
    label: "Continue",
    variant: "primary",
    size: "md",
    loading: false,
    disabled: false
  }
};

export const Primary = {};
export const Disabled = { args: { disabled: true } };
export const Loading = { args: { loading: true } };