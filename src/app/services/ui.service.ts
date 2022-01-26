import { Injectable } from '@angular/core';
import { select } from 'd3';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UIService {
  private cityCode = 'LPV';
  private cityCodeSelectedSource = new Subject<any>();
  cityCodeSelected$ = this.cityCodeSelectedSource.asObservable();

  private dataUpdatedSource = new Subject<any>();
  dataUpdated$ = this.dataUpdatedSource.asObservable();

  constructor() { }

  selectCityCode(code: string) : void {
    this.cityCode = code;
    this.cityCodeSelectedSource.next(code);
  }

  informDataUpdated() {
    this.dataUpdatedSource.next('updated');
  }

  getDepartureCityCode() {
    return 'HKI';
  }

  getArrivalCityCode() {
    return this.cityCode;
  }
}

