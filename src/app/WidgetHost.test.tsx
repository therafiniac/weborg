import { render, screen } from "@testing-library/react";
import { fakeBrowser } from "wxt/testing/fake-browser";

import { defineWidget, type WidgetDefinition } from "@/core/widgets/types";

import WidgetHost from "./WidgetHost";

const crashing = defineWidget<{ value: number }>({
  type: "crashing",
  name: "Crashy",
  description: "Always throws",
  defaultData: { value: 1 },
  dataVersion: 1,
  Component: () => {
    throw new Error("boom");
  },
}) as unknown as WidgetDefinition;

describe("WidgetHost", () => {
  beforeEach(() => {
    fakeBrowser.reset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows an inline error instead of crashing the page", async () => {
    render(
      <WidgetHost
        definition={crashing}
        instance={{
          id: "x",
          type: "crashing",
          position: "top-left",
          order: 0,
          display: {},
        }}
      />,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Crashy stopped working",
    );
  });
});
