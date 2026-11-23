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

  it("hides links that are not set up yet", () => {
    render(<AboutFooter />);
    // ABOUT.repositoryUrl and supportUrl start empty
    expect(screen.queryByRole("link")).toBeNull();
  });
});
