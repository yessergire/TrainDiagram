import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UIService {
  private cityCode = 'LPV';
  private subject = new Subject<any>();
  constructor() { }

  selectCityCode(code: string) : void {
    this.cityCode = code;
    this.subject.next(code);
  }

  onSelectCityCode() : Observable<any> {
    return this.subject.asObservable();
  }

  getDepartureCityCode() {
    return 'HKI';
  }

  getArrivalCityCode() {
    return this.cityCode;
  }
}

