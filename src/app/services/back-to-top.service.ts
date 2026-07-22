import {Overlay, OverlayRef} from "@angular/cdk/overlay";
import {ComponentPortal} from "@angular/cdk/portal";
import {Injectable} from "@angular/core";
import {BackToTopComponent} from "../components/back-to-top/back-to-top.component";

@Injectable({
  providedIn: "root",
})
export class BackToTopService {
  private overlayRef: OverlayRef;

  constructor(private overlay: Overlay) {
    // Dock to the real viewport's bottom-right corner rather than a fixed
    // 800x500 virtual rectangle - the popup is that size, but a popped-out
    // window is user-resizable, and the old fixed anchor left the button
    // stranded mid-screen once the window grew past 800x500.
    this.overlayRef = this.overlay.create({
      positionStrategy: this.overlay.position().global().bottom("10px").right("10px"),
    });
  }

  public show() {
    if (!this.overlayRef.hasAttached()) {
      this.overlayRef.attach(new ComponentPortal(BackToTopComponent));
    }
  }

  public hide() {
    if (this.overlayRef.hasAttached()) {
      this.overlayRef.detach();
    }
  }
}
