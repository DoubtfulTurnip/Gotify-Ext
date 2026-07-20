import {Deserializable} from "./deserializable.model";

export interface GotifyDisplayExtras {
  contentType?: string;
}

export interface GotifyNotificationExtras {
  bigImageUrl?: string;
  click?: {url?: string};
}

export interface GotifyMessageExtras {
  "client::display"?: GotifyDisplayExtras;
  "client::notification"?: GotifyNotificationExtras;
  [key: string]: unknown;
}

export class Message implements Deserializable {
  public id: number;
  public appid: number;
  public message: string;
  public title: string;
  public priority: number;
  public date: string;
  public extras: GotifyMessageExtras = {};
  public url: string;

  public deserialize(input: any): this {
    Object.assign(this, input);
    this.extras = input && typeof input.extras === "object" && input.extras !== null && !Array.isArray(input.extras)
      ? input.extras as GotifyMessageExtras
      : {};
    return this;
  }

  public setURL(url: string): this {
    this.url = url;
    return this;
  }

  public isMarkdown(): boolean {
    return this.extras["client::display"]?.contentType === "text/markdown";
  }

  public clickUrl(): string | null {
    return Message.safeHttpUrl(this.extras["client::notification"]?.click?.url);
  }

  public bigImageUrl(): string | null {
    return Message.safeHttpUrl(this.extras["client::notification"]?.bigImageUrl);
  }

  public static safeHttpUrl(value: unknown): string | null {
    if (typeof value !== "string") { return null; }
    try {
      const parsed = new URL(value);
      return (parsed.protocol === "http:" || parsed.protocol === "https:") && parsed.hostname ? parsed.href : null;
    } catch (_) {
      return null;
    }
  }
}
