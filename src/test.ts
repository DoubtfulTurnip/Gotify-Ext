(globalThis as any).chrome = {
  storage: {
    local: {
      get: (_key: string, callback: (value: object) => void) => callback({}),
      set: (_value: object) => undefined,
    },
    onChanged: {addListener: () => undefined},
  },
  runtime: {connect: () => ({})},
  browserAction: {setBadgeText: () => undefined},
};

// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import {getTestBed} from "@angular/core/testing";
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from "@angular/platform-browser-dynamic/testing";
import "zone.js/testing";

declare const require: any;

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);
