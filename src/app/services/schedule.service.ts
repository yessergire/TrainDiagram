import { Injectable } from '@angular/core';
import { Observable, concat, filter, first, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Train } from '../Types';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private apiURL = 'https://rata.digitraffic.fi/api/v1/live-trains/station/';

  constructor(private http: HttpClient) { }
  private trains : Observable<Train[]>;

  private fetchData(departure: string, arrival: string) {
    this.trains = this.http.get<Train[]>(`${this.apiURL}/${departure}/${arrival}?departure_date=${(new Date().toISOString().slice(0,10))}`);
    //this.trains = this.http.get<Train[]>('assets/schedules.json');
  }

  getTrains(departure: string, arrival: string) : Observable<Train[]> {
    this.fetchData(departure, arrival);
    //const second = this.http.get<Train[]>(`${this.apiURL}/${arrival}/${departure}`);
    //return concat(first, second);
    return this.trains;
  }

  getTrainInfo(id: number, departure: string, arrival: string) {
    this.fetchData(departure, arrival);
    return this.trains.pipe(map((trains:Train[]) => trains.filter(train => train.trainNumber === id)[0]));
  }
}