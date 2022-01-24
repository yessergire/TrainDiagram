import { Component, OnInit } from '@angular/core';
import { Station } from '../../Types'
import { StationsService } from '../../services/stations.service'
import { UIService } from 'src/app/services/ui.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.component.html'
})
export class ScheduleComponent implements OnInit {
  allStations: { [key: string]: Station } = {};
  departureCityCode = 'HKI';
  destinationCityCode = 'LPV';
  subscription : Subscription;

  constructor(private stationsService: StationsService, private uiService: UIService) {
      this.subscription = this.uiService.onSelectCityCode()
          .subscribe((cityCode) => {
            this.destinationCityCode = cityCode;
          });
  }

  ngOnInit(): void {
    this.stationsService.getStations().subscribe((stations) => {
      for (var station of stations) {
        const code = station.stationShortCode;
        station.stationName = station.stationName.replace(' asema', '');
        this.allStations[code] = station;
      }
    });
  }
}
