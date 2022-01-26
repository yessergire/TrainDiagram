import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http'

import { AppComponent } from './app.component';
import { ScheduleComponent } from './components/schedule/schedule.component';
import { CitySelectorComponent } from './components/city-selector/city-selector.component';
import { TrainDiagramComponent } from './components/train-diagram/train-diagram.component';


@NgModule({
  declarations: [
    AppComponent,
    ScheduleComponent,
    CitySelectorComponent,
    TrainDiagramComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
