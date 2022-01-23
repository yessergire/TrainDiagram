import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { UIService } from '../../services/ui.service';
@Component({
  selector: 'app-city-selector',
  templateUrl: './city-selector.component.html'
})
export class CitySelectorComponent implements OnInit {

  cityCodes: string[] = ['LPV', 'KE', 'KKN', 'RI'];
  cityNames : {[index: string]: string} = {'LPV':'Leppävaara', 'KE':'Kerava', 'KKN':'Kirkkonummi', 'RI':'Riihimäki'};
  cityCode : string = 'LPV';

  @Output() onSelectCityCode : EventEmitter<string> = new EventEmitter();

  constructor(private uiService: UIService) {}

  ngOnInit(): void {
  }

  updateCityCode() {
    this.uiService.selectCityCode(this.cityCode);
  }
}
