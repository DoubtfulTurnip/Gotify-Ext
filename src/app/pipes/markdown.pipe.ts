import {Pipe, PipeTransform} from "@angular/core";
import {DomSanitizer, SafeHtml} from "@angular/platform-browser";

@Pipe({
  name: "markdown",
})
export class MarkdownPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  private isSafeUrl(url: string): boolean {
    return /^https?:\/\//i.test(url);
  }

  private buildImageTag(url: string, alt: string, block: boolean): string {
    const imgTag = `<img src="${url}" alt="${alt}" class="md-image" loading="lazy">`;
    if (this.isSafeUrl(url)) {
      const linked = `<a href="${url}" target="_blank" rel="noopener noreferrer" class="md-image-link">${imgTag}</a>`;
      return block ? `<div class="md-image-block">${linked}</div>` : linked;
    }
    return block ? `<div class="md-image-block">${imgTag}</div>` : imgTag;
  }

  private parseInlineMarkdown(text: string): string {
    // Line breaks
    text = text.replace(/\n/g, "<br>");
    // Code (backticks)
    text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
    // Strikethrough (~~text~~)
    text = text.replace(/~~([^~]+)~~/g, "<del>$1</del>");
    // Bold (**text** or __text__)
    text = text.replace(/\*\*([^\*]+)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/__([^_]+)__/g, "<strong>$1</strong>");
    // Italic (*text* or _text_)
    text = text.replace(/\*([^\*]+)\*/g, "<em>$1</em>");
    text = text.replace(/_([^_]+)_/g, "<em>$1</em>");
    // Images ![alt](url) - MUST be before links
    text = text.replace(/!\[([^\]]*)\]\(([^\)]+)\)/g, (match, alt, url) => {
      return this.buildImageTag(url, alt, false);
    });
    // Links [text](url)
    text = text.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    return text;
  }

  private parseBlockMarkdown(text: string): string {
    let html = "";
    const lines = text.split("\n");
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // Empty lines
      if (!trimmed) {
        i++;
        continue;
      }

      // Code blocks (```)
      if (trimmed.startsWith("```")) {
        const langMatch = trimmed.match(/^```(\w+)?/);
        const lang = langMatch && langMatch[1] ? ` class="language-${this.escapeHtml(langMatch[1])}"` : "";
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith("```")) {
          codeLines.push(this.escapeHtml(lines[i]));
          i++;
        }
        html += `<pre><code${lang}>${codeLines.join("\n")}</code></pre>`;
        i++; // Skip closing ```
        continue;
      }

      // Horizontal rule (---, ***, ___)
      if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
        html += "<hr>";
        i++;
        continue;
      }

      // Headers (#, ##, ###, etc.)
      const headerMatch = trimmed.match(/^(#+)\s+(.+)$/);
      if (headerMatch) {
        const level = Math.min(headerMatch[1].length, 6);
        const content = this.parseInlineMarkdown(this.escapeHtml(headerMatch[2]));
        html += `<h${level}>${content}</h${level}>`;
        i++;
        continue;
      }

      // Block-level image (line is only an image)
      const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^\)]+)\)$/);
      if (imageMatch) {
        const alt = this.escapeHtml(imageMatch[1]);
        const url = this.escapeHtml(imageMatch[2]);
        html += this.buildImageTag(url, alt, true);
        i++;
        continue;
      }

      // Block quotes (>)
      if (trimmed.startsWith(">")) {
        const quoteLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith(">")) {
          const quoteLine = lines[i].trim().substring(1).trim();
          quoteLines.push(quoteLine);
          i++;
        }
        const quoteContent = this.parseInlineMarkdown(this.escapeHtml(quoteLines.join("\n")));
        html += `<blockquote>${quoteContent}</blockquote>`;
        continue;
      }

      // Unordered lists (-, *, +)
      if (/^[\-\*\+]\s+/.test(trimmed)) {
        html += "<ul>";
        while (i < lines.length && /^[\-\*\+]\s+/.test(lines[i].trim())) {
          const itemText = lines[i].trim().replace(/^[\-\*\+]\s+/, "");
          const content = this.parseInlineMarkdown(this.escapeHtml(itemText));
          html += `<li>${content}</li>`;
          i++;
        }
        html += "</ul>";
        continue;
      }

      // Ordered lists (1., 2., etc.)
      if (/^\d+\.\s+/.test(trimmed)) {
        html += "<ol>";
        while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
          const itemText = lines[i].trim().replace(/^\d+\.\s+/, "");
          const content = this.parseInlineMarkdown(this.escapeHtml(itemText));
          html += `<li>${content}</li>`;
          i++;
        }
        html += "</ol>";
        continue;
      }

      // Paragraphs
      const content = this.parseInlineMarkdown(this.escapeHtml(trimmed));
      html += `<p>${content}</p>`;
      i++;
    }

    return html;
  }

  public transform(value: string): SafeHtml {
    if (!value) {
      return "";
    }
    try {
      const html = this.parseBlockMarkdown(value);
      return this.sanitizer.bypassSecurityTrustHtml(html);
    } catch (error) {
      console.error("Error parsing markdown:", error);
      return this.escapeHtml(value);
    }
  }
}
