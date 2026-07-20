import {SecurityContext} from "@angular/core";
import {TestBed} from "@angular/core/testing";
import {DomSanitizer} from "@angular/platform-browser";
import {AppModule} from "../app.module";
import {MarkdownPipe} from "./markdown.pipe";

describe("MarkdownPipe URL safety", () => {
  let pipe: MarkdownPipe;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({imports: [AppModule]});
    sanitizer = TestBed.inject(DomSanitizer);
    pipe = new MarkdownPipe(sanitizer);
  });

  function render(markdown: string): string {
    return sanitizer.sanitize(SecurityContext.HTML, pipe.transform(markdown)) || "";
  }

  it("keeps HTTPS links", () => {
    expect(render("[safe](https://example.com)")).toContain('href="https://example.com/"');
  });

  it("does not load remote images until explicitly enabled", () => {
    const blocked = render("![x](https://example.com/image.png)");
    expect(blocked).not.toContain("<img");
    expect(blocked).toContain("Remote image blocked");

    const loaded = sanitizer.sanitize(
      SecurityContext.HTML,
      pipe.transform("![x](https://example.com/image.png)", true),
    ) || "";
    expect(loaded).toContain('<img src="https://example.com/image.png"');
  });

  it("rejects deceptive URLs that merely begin like HTTP URLs", () => {
    expect(render("[bad](https://)")).not.toContain('href="https://');
  });
  it("attribute-encodes image alt text at the trusted HTML boundary", () => {
    const html = sanitizer.sanitize(
      SecurityContext.HTML,
      pipe.transform('![x" onerror="alert(1)](https://example.com/image.png)', true),
    ) || "";
    expect(html).toContain('alt="x&quot; onerror=&quot;alert(1)"');
    expect(html).not.toContain(' onerror="alert(1)"');
  });

  it("canonicalizes and encodes URLs without corrupting query separators", () => {
    const html = render("[safe](https://example.com/path?a=1&b=2)");
    expect(html).toContain('href="https://example.com/path?a=1&amp;b=2"');
  });

  it("does not permit quote injection to create event-handler attributes", () => {
    const html = render('[safe](https://example.com/\" onmouseover=\"alert(1))');
    expect(html).not.toContain(' onmouseover="alert(1)"');
  });
  it("removes executable link and image schemes", () => {
    const html = render("[click](javascript:alert(1)) ![x](data:text/html,payload)");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("data:text/html");
    expect(html).not.toContain("<img");
  });
});