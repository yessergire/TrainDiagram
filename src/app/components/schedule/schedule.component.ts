import { Component, OnInit } from '@angular/core';
import { Station, TimeTable, TrackingEvent, Train } from '../../Types'
import { StationsService } from '../../services/stations.service'
import { ScheduleService } from '../../services/schedule.service'
import { UIService } from 'src/app/services/ui.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.component.html'
})
export class ScheduleComponent implements OnInit {
  allStations: { [key: string]: Station } = {};
  trainTrackingData: { [key: string]: TrackingEvent[] } = {};
  trains: Train[] = [];
  trainHash : { [key: number]: Train } = {};
  routeStations: string[] = [];
  departureCityCode = 'HKI';
  destinationCityCode = 'LPV';
  subscription : Subscription;

  constructor(
    private stationsService: StationsService,
    private scheduleService: ScheduleService,
    private uiService: UIService) {
      this.subscription = this.uiService.onSelectCityCode().subscribe((cityCode) => {
        this.destinationCityCode = cityCode;
        this.fetchData();
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
    this.fetchData();
  }

  private fetchData() {
    this.scheduleService.getTrains(this.departureCityCode, this.destinationCityCode).subscribe((trains) => {
      this.trains = trains;

      for (var train of this.trains) {
        this.trainHash[train.trainNumber] = train;
      }
      this.extractStations();
    });  
  }

  private extractStations() {
    let route = '';
    for (var train of this.trains) {
      const stations : string[] = [];
      for (var row of train.timeTableRows) {
        const stationCode = row.stationShortCode;
        if (['PAU', 'PSLT'].includes(stationCode)) continue;
        if (!stations.includes(stationCode))
          stations.push(stationCode);
        if (stationCode === this.destinationCityCode)
          break;
      }
      const newRoute = JSON.stringify(stations);
      if (route.length < newRoute.length) {
        route = newRoute;
        this.routeStations = stations;
      }
    }
  }

}

