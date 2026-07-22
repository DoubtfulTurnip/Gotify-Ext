import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

interface StoredSettings {
  autoLoadImages?: boolean;
}

@Injectable({
  providedIn: "root",
})
export class SettingsService {
  private static readonly STORAGE_KEY = "settings";

  private autoLoadImagesSubject = new BehaviorSubject<boolean>(false);
  public autoLoadImages$ = this.autoLoadImagesSubject.asObservable();

  /** True once the user has changed a setting this session, guards against a
   *  slow storage read clobbering a change made while it was in flight. */
  private userOverride = false;

  constructor() {
    chrome.storage.local.get(SettingsService.STORAGE_KEY, (res) => {
      if (this.userOverride) {
        return;
      }
      const stored = (res && res[SettingsService.STORAGE_KEY]) as StoredSettings | undefined;
      if (stored && typeof stored.autoLoadImages === "boolean") {
        this.autoLoadImagesSubject.next(stored.autoLoadImages);
      }
    });
  }

  public get autoLoadImages(): boolean {
    return this.autoLoadImagesSubject.value;
  }

  public setAutoLoadImages(value: boolean): void {
    this.userOverride = true;
    this.autoLoadImagesSubject.next(value);
    chrome.storage.local.set({ [SettingsService.STORAGE_KEY]: { autoLoadImages: value } });
  }
}
