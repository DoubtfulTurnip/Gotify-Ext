import { TestBed } from '@angular/core/testing';
import {AppModule} from "../app.module";

import { AlertService } from './alert.service';

describe('AlertsService', () => {
  let service: AlertService;

  beforeEach(() => {
    TestBed.configureTestingModule({imports: [AppModule]});
    service = TestBed.inject(AlertService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
