import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import { MiniMapComponent } from './ui/mini-map/mini-map.component';

@NgModule({
    declarations: [
        AppComponent,
        MiniMapComponent
    ],
    imports: [
        BrowserModule,
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
