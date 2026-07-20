import { GotifySocket } from "./gotify-socket";

describe("GotifySocket", () => {
  it("should create an instance", () => {
    expect(new GotifySocket("https://gotify.example")).toBeTruthy();
  });
});
