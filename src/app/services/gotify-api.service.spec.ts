import { TestBed } from "@angular/core/testing";

import { GotifyAPIService } from "./gotify-api.service";

describe("GotifyAPIService", () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it("should be created", () => {
    const service: GotifyAPIService = TestBed.inject(GotifyAPIService);
    expect(service).toBeTruthy();
  });
});
