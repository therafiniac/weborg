import { render, screen } from "@testing-library/react";

import AboutFooter from "./AboutFooter";

describe("About footer", () => {
  it("names the author and licence", () => {
    render(<AboutFooter />);
    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveTextContent("by therafiniac");
    expect(footer).toHaveTextContent("MIT licence");
    expect(footer).toHaveTextContent("no tracking");
  });

  it("links to the source code and Ko-fi", () => {
    render(<AboutFooter />);
    expect(screen.getByRole("link", { name: /Source code/ })).toHaveAttribute(
      "href",
      "https://github.com/therafiniac/weborg",
    );
    expect(
      screen.getByRole("link", { name: "Buy me a coffee on Ko-fi" }),
    ).toHaveAttribute("href", "https://ko-fi.com/Q3C02B5R99");
  });
});
