import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { Station } from '../Types';

@Injectable({
  providedIn: 'root'
})
export class StationsService {
  private apiURL = 'https://rata.digitraffic.fi/api/v1/metadata/stations';

  constructor(private http: HttpClient) { }

  getStations() : Observable<Station[]> {
    return this.http.get<Station[]>('assets/stations.json');
  }
}