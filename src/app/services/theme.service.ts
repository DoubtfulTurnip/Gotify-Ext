import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

export type Theme = "light" | "dark";

@Injectable({
  providedIn: "root",
})
export class ThemeService {
  private static readonly STORAGE_KEY = "theme";
  private static readonly DARK_CLASS = "dark-theme";

  private themeSubject = new BehaviorSubject<Theme>("light");
  public theme$ = this.themeSubject.asObservable();

  constructor() {
    this.loadTheme();
  }

  /**
   * Load saved theme preference, falling back to system prefers-color-scheme.
   */
  private loadTheme(): void {
    chrome.storage.local.get(ThemeService.STORAGE_KEY, (res) => {
      if (res && ThemeService.STORAGE_KEY in res) {
        this.applyTheme(res[ThemeService.STORAGE_KEY] as Theme);
      } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        this.applyTheme(prefersDark ? "dark" : "light");
      }
    });
  }

  /** Toggle between light and dark. Persists the choice. */
  public toggle(): void {
    const newTheme: Theme = this.themeSubject.value === "light" ? "dark" : "light";
    this.applyTheme(newTheme);
    chrome.storage.local.set({ [ThemeService.STORAGE_KEY]: newTheme });
  }

  /** Current theme is dark? */
  public isDark(): boolean {
    return this.themeSubject.value === "dark";
  }

  private applyTheme(theme: Theme): void {
    if (theme === "dark") {
      document.body.classList.add(ThemeService.DARK_CLASS);
    } else {
      document.body.classList.remove(ThemeService.DARK_CLASS);
    }
    this.themeSubject.next(theme);
  }
}
