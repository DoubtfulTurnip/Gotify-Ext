import { waitForAsync, ComponentFixture, TestBed } from "@angular/core/testing";
import {AppModule} from "../../app.module";

import {of} from "rxjs";
import {Message} from "../../models/message.model";
import { MessageViewComponent } from "./message-view.component";

describe("MessageViewComponent", () => {
  let component: MessageViewComponent;
  let fixture: ComponentFixture<MessageViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({imports: [AppModule]})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MessageViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("message behavior", () => {
    function bareComponent(api: any = {}): MessageViewComponent {
      return new MessageViewComponent({} as any, api, {} as any, {} as any, {} as any, {} as any, {} as any);
    }

    function message(id: number, priority: number, date: string): Message {
      return new Message().deserialize({id, priority, date, message: "body", extras: {}}).setURL("https://gotify.example");
    }

    it("sorts by date by default and stably by priority then date", () => {
      const target = bareComponent();
      target.viewMessages = [
        message(1, 5, "2024-01-01T00:00:00Z"),
        message(2, 1, "2024-03-01T00:00:00Z"),
        message(3, 5, "2024-02-01T00:00:00Z"),
      ];
      expect(target.sortedMessages().map((item) => item.id)).toEqual([2, 3, 1]);
      target.sortMode = "priority";
      expect(target.sortedMessages().map((item) => item.id)).toEqual([3, 1, 2]);
    });

    it("deletes the selected object rather than a sorted-view index", () => {
      const api = {DeleteMessage: jasmine.createSpy().and.returnValue(of(undefined))};
      const target = bareComponent(api);
      const older = message(1, 0, "2024-01-01T00:00:00Z");
      const newer = message(2, 0, "2024-02-01T00:00:00Z");
      target.messages = [older, newer];
      target.url = "All";
      (target as any).sockets = {getSocket: () => ({GetToken: () => "token"})};
      target.DeleteMessage(newer);
      expect(target.messages).toEqual([older]);
    });

    it("keeps remote media blocked until opted in for that message", () => {
      const target = bareComponent();
      const first = message(1, 0, "2024-01-01T00:00:00Z");
      first.extras = {"client::notification": {bigImageUrl: "https://example.com/image.png"}};
      const second = message(2, 0, "2024-01-01T00:00:00Z");
      expect(target.hasRemoteMedia(first)).toBeTrue();
      expect(target.mediaLoaded(first)).toBeFalse();
      target.loadMedia(first);
      expect(target.mediaLoaded(first)).toBeTrue();
      expect(target.mediaLoaded(second)).toBeFalse();
    });
  });});