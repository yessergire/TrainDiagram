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

  getTrains(departure: string, arrival: string) : Observable<Train[]> {
    const date = new Date().toISOString().slice(0,10);
    return this.http.get<Train[]>(`${this.apiURL}/${departure}/${arrival}?departure_date=${date}`);
  }
}