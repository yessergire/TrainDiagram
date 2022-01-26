import { Component, OnInit } from '@angular/core';
import { Station, TimeTable, TrackingEvent, Train } from '../../Types'
import { ScheduleService } from '../../services/schedule.service'
import { StationsService } from '../../services/stations.service'
import { TrackingService } from '../../services/tracking.service'
import { UIService } from 'src/app/services/ui.service';

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.component.html'
})
export class ScheduleComponent implements OnInit {
  allStations: { [key: string]: Station } = {};
  departureCityCode = 'HKI';
  destinationCityCode = 'LPV';
  trains: Train[] = [];
  routeStations: string[] = [];

  constructor(
    private scheduleService: ScheduleService,
    private stationsService: StationsService,
    private trackingService: TrackingService,
    private uiService: UIService) {
    this.uiService.cityCodeSelected$.subscribe(cityCode => {
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
      this.fetchData();
    });
  }

  private fetchData() {
    this.trains = [];

    this.scheduleService.getTrains(this.departureCityCode, this.destinationCityCode).subscribe((trains) => {
      this.trains.push(...trains);
      this.processStations(trains);
      this.scheduleService.getTrains(this.destinationCityCode, this.departureCityCode).subscribe((trains) => {
        this.trains.push(...trains);
        this.processTimetables(this.trains);
      });
    });

  }

  private processTimetables(trains: Train[]) {
    for (const train of trains) {
      const scheduleMap = new Map<string, TimeTable>(
        train.timeTableRows.map(table => [table.stationShortCode, table] as [string, TimeTable])
      );

      this.trackingService.getTrackingData(train.trainNumber)
        .subscribe(events => {
          const stations = this.routeStations
            .filter(station => events.map(event => event.station).includes(station));
          for (const station of stations) {
            const stationEvent = events.filter(event => event.station === station)
              .reduce((latestEvent, event) => (event.timestamp > latestEvent.timestamp) ? event : latestEvent);
            const table = scheduleMap.get(station);
            table!.actualTime = stationEvent.timestamp;
          }
          this.uiService.informDataUpdated();

          // const trackingEventRows = this.routeStations
          //   .filter(station => events.map(event => event.station).includes(station))
          //   .map(station => events.filter(event => event.station === station)
          //   .reduce((latestEvent, event) => {
          //     latestEvent = (event.timestamp > latestEvent.timestamp) ? event : latestEvent;
          //     const table = scheduleMap.get(event.station);
          //     table!.actualTime = latestEvent.timestamp;
          //     return latestEvent;
          //   }));
        });
    }
  }

  private processStations(trains: Train[]) {
    let route = '';
    for (var train of trains) {
      const stations: string[] = [];
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
