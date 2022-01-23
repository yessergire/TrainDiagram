import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http'
import { RouterModule, Routes } from '@angular/router'

import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';
import { ScheduleComponent } from './components/schedule/schedule.component';
import { TrainComponent } from './components/train/train.component';
import { CitySelectorComponent } from './components/city-selector/city-selector.component';
import { TrainDiagramComponent } from './components/train-diagram/train-diagram.component';

const appRoutes: Routes = [
  {path: "", component: ScheduleComponent},
  {path: "train/:id", component: TrainComponent},
]

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    ScheduleComponent,
    CitySelectorComponent,
    TrainDiagramComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forRoot(appRoutes),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
