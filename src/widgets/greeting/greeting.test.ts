import { greetingFor, greetingText } from "./greeting";

describe("greeting", () => {
  it.each([
    [4, "Good night"],
    [5, "Good morning"],
    [11, "Good morning"],
    [12, "Good afternoon"],
    [17, "Good evening"],
    [22, "Good night"],
  ])("hour %i -> %s", (hour, text) => {
    expect(greetingFor(hour)).toBe(text);
  });

  it("adds the name when set", () => {
    expect(greetingText(9, "  Rafi ")).toBe("Good morning, Rafi");
    expect(greetingText(9, " ")).toBe("Good morning");
  });
});
