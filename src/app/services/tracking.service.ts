import { Injectable } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { TrackingEvent } from '../Types';

@Injectable({
  providedIn: 'root'
})
export class TrackingService {
  private apiURL = 'https://rata.digitraffic.fi/api/v1/train-tracking';

  constructor(private http: HttpClient) { }

  getTrackingData(trainNumber: number) : Observable<TrackingEvent[]> {
    const date = new Date().toISOString().slice(0,10);
    return this.http.get<TrackingEvent[]>(`${this.apiURL}/${date}/${trainNumber}`);
  }
}