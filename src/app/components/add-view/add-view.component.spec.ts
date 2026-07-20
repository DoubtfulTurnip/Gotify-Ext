import { waitForAsync, ComponentFixture, TestBed } from "@angular/core/testing";
import {AppModule} from "../../app.module";

import { AddViewComponent } from "./add-view.component";

describe("AddViewComponent", () => {
  let component: AddViewComponent;
  let fixture: ComponentFixture<AddViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({imports: [AppModule]})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
