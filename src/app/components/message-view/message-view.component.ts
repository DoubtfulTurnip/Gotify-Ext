import {ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {faTrashAlt} from "@fortawesome/free-solid-svg-icons/faTrashAlt";
import {Subject} from "rxjs";
import {takeUntil} from "rxjs/operators";
import {GotifySocket} from "../../classes/gotify-socket";
import {Application} from "../../models/application.model";
import {BulkMessages} from "../../models/bulk-messages.model";
import {Message} from "../../models/message.model";
import {AlertService} from "../../services/alert.service";
import {FilterService} from "../../services/filter.service";
import {GotifyAPIService} from "../../services/gotify-api.service";
import {ScrollService} from "../../services/scroll.service";
import {SocketService} from "../../services/socket.service";

@Component({
  standalone: false,
  selector: "app-message-view",
  styleUrls: ["./message-view.component.scss"],
  templateUrl: "./message-view.component.html",
})
export class MessageViewComponent implements OnInit, OnDestroy {
  // For keeping track of paging per server
  private oldestMsgPerServer = new Map<string, number>();
  private destroy$: Subject<boolean> = new Subject<boolean>();
  private isInitialLoad = true;

  private appIcons = new Map<string, string>();

  public faTrashAlt = faTrashAlt;
  public url: string;
  public messages: Message[];
  public viewMessages: Message[] = [];
  public showLoadMore = true;
  public numLoading = 0;
  public sortMode: "date" | "priority" = "date";
  private loadedMedia = new Set<string>();
  private expandedMessages = new Set<string>();

  constructor(private route: ActivatedRoute, private gotifyAPI: GotifyAPIService, private sockets: SocketService,
              private alert: AlertService, private filterService: FilterService, private scroll: ScrollService,
              private cdr: ChangeDetectorRef) {
  }

  public ngOnInit() {
    this.route.params.subscribe((params) => {
      this.destroy$.next(true);
      this.messages = [];
      this.url = params.url ? decodeURIComponent(params.url) : "All";
      this.oldestMsgPerServer.clear();
      this.appIcons.clear();
      this.LoadMessages();
      this.loadAppIcons();
      if (this.url === "All") {
        this.sockets.initSocket().pipe(takeUntil(this.destroy$)).subscribe((res: GotifySocket) => {
          res.GetMessageSubscription().subscribe((msg) => {
            this.AddMessage(msg);
            this.filterMessages();
            this.cdr.detectChanges();
          }, (err) => this.alert.error(err, `Unable to open socket to: ${res.url}`));
        });
      } else {
        this.sockets.getSocket(this.url).GetMessageSubscription().subscribe((msg) => {
          this.AddMessage(msg);
          this.filterMessages();
          this.cdr.detectChanges();
        }, (err) => this.alert.error(err, `Unable to open socket`));
      }

      this.filterService.changed$.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.filterMessages();
        this.cdr.detectChanges();
      });
    });
  }

  public ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  private AddMessage(...msgs: Message[]) {
    this.messages = this.messages.concat(...msgs);
    this.filterMessages();
  }

  public getAppIcon(message: Message): string | null {
    return this.appIcons.get(`${message.url}:${message.appid}`) || null;
  }

  private loadAppIcons() {
    const storeIcons = (apps: Application[], token: string) => {
      for (const app of apps) {
        if (!app.image) { continue; }
        const base = app.image.startsWith("http") ? app.image : `${app.url}/${app.image.replace(/^\//, "")}`;
        this.appIcons.set(`${app.url}:${app.id}`, base);
      }
      this.cdr.detectChanges();
    };
    if (this.url === "All") {
      this.sockets.initSocket().pipe(takeUntil(this.destroy$)).subscribe((res: GotifySocket) => {
        const token = res.GetToken();
        this.gotifyAPI.GetApplications(res.GetURL(), token).subscribe((apps) => storeIcons(apps, token));
      });
    } else {
      const token = this.sockets.getSocket(this.url).GetToken();
      this.gotifyAPI.GetApplications(this.url, token).subscribe((apps) => storeIcons(apps, token));
    }
  }

  private LoadMessages() {
    if (this.url === "All") {
      this.sockets.initSocket().pipe(takeUntil(this.destroy$)).subscribe((res: GotifySocket) => {
        this.numLoading++;
        const since = this.oldestMsgPerServer.get(res.GetURL()) ?? Number.MAX_SAFE_INTEGER;
        this.gotifyAPI.GetMessages(res.GetURL(), res.GetToken(), since)
          .subscribe((msgs: BulkMessages) => {
            this.AddMessage(...msgs.messages);
            this.oldestMsgPerServer.set(res.GetURL(), msgs.paging.since);
            this.filterMessages();
            this.decrementLoadingCount();
          }, (err) => this.alert.error(err, `Unable to load previous messages for: ${res.url}`));
      });
    } else {
      const since = this.oldestMsgPerServer.get(this.url) ?? Number.MAX_SAFE_INTEGER;
      this.numLoading++;
      this.gotifyAPI.GetMessages(this.url, this.sockets.getSocket(this.url).GetToken(), since)
        .subscribe((msgs: BulkMessages) => {
          this.AddMessage(...msgs.messages);
          this.oldestMsgPerServer.set(this.url, msgs.paging.since);
          this.filterMessages();
          this.decrementLoadingCount();
        }, (err) => this.alert.error(err, `Unable to load previous messages`));
    }
  }

  public DeleteMessage(msg: Message) {
    this.gotifyAPI.DeleteMessage(msg.url, this.sockets.getSocket(msg.url).GetToken(), msg.id).subscribe(() => {
      this.messages = this.messages.filter((candidate) => candidate !== msg);
      this.filterMessages();
    }, (err) => this.alert.error(err, `Unable to delete message`));
  }

  public DeleteAllMessages() {
    if (this.url === "All") {
      this.sockets.initSocket().pipe(takeUntil(this.destroy$)).subscribe((res: GotifySocket) => {
        this.gotifyAPI.DeleteAllMessages(res.GetURL(), res.GetToken()).subscribe(() => {
          // Maybe there's a nicer way of doing this. idk right now
          this.messages = this.messages.filter((msg) => {
            return msg.url !== res.GetURL();
          });
          this.filterMessages();
        }, (err) => this.alert.error(err, `Unable to delete all messages for ${res.url}`));
      });
    } else {
      this.gotifyAPI.DeleteAllMessages(this.url, this.sockets.getSocket(this.url).GetToken()).subscribe(() => {
        this.messages = [];
        this.filterMessages();
      }, (err) => this.alert.error(err, `Unable to delete all messages`));
    }
  }

  private filterMessages() {
    this.showLoadMore = !Array.from(this.oldestMsgPerServer.values()).every((val) => {
      return val === 0;
    });

    if (this.url === "All") {
      this.viewMessages = this.messages;
      return;
    }
    const acceptedApps = [];
    for (const app of this.filterService.applicationFiltered.entries()) {
      if (app[1] === true) {
        acceptedApps.push(app[0].id);
      }
    }
    this.viewMessages = this.messages.filter((element) => acceptedApps.indexOf(element.appid) !== -1);
  }

  private decrementLoadingCount() {
    this.numLoading--;
    if (!this.isInitialLoad && this.numLoading === 0) {
      // For some reason, if this is done instantly it doesn't work ¯\_(ツ)_/¯
      setTimeout(() => {
        this.scroll.scrollToBottom();
      }, 1);
    }
  }

  public LoadMore() {
    this.isInitialLoad = false;
    this.LoadMessages();
  }

  public sortedMessages(): Message[] {
    return this.viewMessages.map((message, index) => ({message, index})).sort((a, b) => {
      const dateDelta = new Date(b.message.date).getTime() - new Date(a.message.date).getTime();
      const result = this.sortMode === "priority"
        ? (b.message.priority || 0) - (a.message.priority || 0) || dateDelta
        : dateDelta;
      return result || a.index - b.index;
    }).map(({message}) => message);
  }

  public messageKey(message: Message): string {
    return message.url + ":" + message.id;
  }

  public mediaLoaded(message: Message): boolean {
    return this.loadedMedia.has(this.messageKey(message));
  }

  public loadMedia(message: Message): void {
    this.loadedMedia.add(this.messageKey(message));
  }

  public hasRemoteMedia(message: Message): boolean {
    return !!message.bigImageUrl() ||
      (message.isMarkdown() && /!\[[^\]]*\]\(https?:\/\//i.test(message.message || ""));
  }

  public isLong(message: Message): boolean {
    return (message.message || "").length > 600 || (message.message || "").split("\n").length > 10;
  }

  public isExpanded(message: Message): boolean {
    return this.expandedMessages.has(this.messageKey(message));
  }

  public toggleExpanded(message: Message): void {
    const key = this.messageKey(message);
    this.expandedMessages.has(key) ? this.expandedMessages.delete(key) : this.expandedMessages.add(key);
  }

  public priorityLabel(priority: number): string {
    if (priority >= 8) { return "Urgent " + priority; }
    if (priority >= 5) { return "High " + priority; }
    return "Priority " + (priority || 0);
  }

  public openUrl(url: string | null): void {
    const safe = Message.safeHttpUrl(url);
    if (!safe) { return; }
    const opened = window.open(safe, "_blank", "noopener,noreferrer");
    if (opened) { opened.opener = null; }
  }

  public copyMessage(message: Message): void {
    if (!navigator.clipboard?.writeText) {
      this.alert.error(new Error("Clipboard access is unavailable"), "Unable to copy message");
      return;
    }
    navigator.clipboard.writeText(message.message || "")
      .catch(() => this.alert.error(new Error("Clipboard access was denied"), "Unable to copy message"));
  }

  public downloadImage(message: Message): void {
    const url = message.bigImageUrl();
    if (!url || typeof chrome === "undefined" || !chrome.downloads?.download) { return; }
    chrome.downloads.download({url, saveAs: true}, () => {
      if (chrome.runtime?.lastError) {
        this.alert.error(new Error(chrome.runtime.lastError.message), "Unable to download image");
      }
    });
  }
}