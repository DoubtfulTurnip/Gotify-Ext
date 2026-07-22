import {NgModule} from "@angular/core";
import {RouterModule, Routes} from "@angular/router";
import {AddViewComponent} from "../../components/add-view/add-view.component";
import {MessageViewComponent} from "../../components/message-view/message-view.component";

const routes: Routes = [
  {path: "", redirectTo: "/add", pathMatch: "full"},
  {path: "server", component: MessageViewComponent},
  {path: "server/:url", component: MessageViewComponent},
  {path: "add", component: AddViewComponent},
];

@NgModule({
  exports: [RouterModule],
  // Hash-based routing: the extension page is loaded from a literal
  // "index.html" path (popup and pop-out window alike), which the default
  // PathLocationStrategy can't match against any route ("" != "index.html"),
  // causing a hard NG04002 navigation failure on every load. Hash routing
  // matches on the URL fragment instead, which is independent of the path.
  imports: [RouterModule.forRoot(routes, { useHash: true })],
})
export class AppRoutingModule {
}
