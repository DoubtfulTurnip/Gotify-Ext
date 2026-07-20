import { Message } from "./message.model";

describe("Message.Model", () => {
  it("should create an instance", () => {
    expect(new Message()).toBeTruthy();
  });

  it("uses Markdown only for the exact Gotify content type", () => {
    const markdown = new Message().deserialize({
      extras: {"client::display": {contentType: "text/markdown"}},
    });
    const missing = new Message().deserialize({extras: {}});
    expect(markdown.isMarkdown()).toBeTrue();
    expect(missing.isMarkdown()).toBeFalse();
  });

  it("accepts only absolute HTTP(S) action and image URLs", () => {
    const message = new Message().deserialize({
      extras: {
        "client::notification": {
          bigImageUrl: "https://example.com/image.png",
          click: {url: "javascript:alert(1)"},
        },
      },
    });
    expect(message.bigImageUrl()).toBe("https://example.com/image.png");
    expect(message.clickUrl()).toBeNull();
    expect(Message.safeHttpUrl("/relative")).toBeNull();
  });

  it("normalizes malformed extras to an empty object", () => {
    const message = new Message().deserialize({extras: "bad"});
    expect(message.extras).toEqual({});
    expect(message.isMarkdown()).toBeFalse();
  });
});
