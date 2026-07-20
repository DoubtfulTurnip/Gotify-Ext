import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import {AppModule} from "../../app.module";

import { BackToTopComponent } from './back-to-top.component';

describe('BackToTopComponent', () => {
  let component: BackToTopComponent;
  let fixture: ComponentFixture<BackToTopComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({imports: [AppModule]})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BackToTopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
