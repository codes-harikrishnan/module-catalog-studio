import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import MfButton from "./MfButton";

test("renders label", () => {
  render(<MfButton label="Hello" />);
  expect(screen.getByText("Hello")).toBeInTheDocument();
});

test("disabled prevents click", () => {
  const onClick = jest.fn();
  render(<MfButton label="X" disabled onClick={onClick} />);
  fireEvent.click(screen.getByTestId("mfbutton"));
  expect(onClick).not.toHaveBeenCalled();
});

test("loading prevents click", () => {
  const onClick = jest.fn();
  render(<MfButton label="X" loading onClick={onClick} />);
  fireEvent.click(screen.getByTestId("mfbutton"));
  expect(onClick).not.toHaveBeenCalled();
});

test("spinner is rendered when loading", () => {
  render(<MfButton label="X" loading />);
  expect(document.querySelector(".mfSpinner")).toBeTruthy();
});