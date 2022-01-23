import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Station, TimeTable, TrackingEvent, Train } from 'src/app/Types'

import { StationsService } from 'src/app/services/stations.service'
import { ScheduleService } from 'src/app/services/schedule.service'
import { TrackingService } from 'src/app/services/tracking.service'
import {       UIService } from 'src/app/services/ui.service';

import { Subscription } from 'rxjs';

import * as d3 from 'd3';

@Component({
  selector: 'app-train',
  templateUrl: './train.component.html'
})
export class TrainComponent implements OnInit {

  constructor(private route: ActivatedRoute,
    private stationsService: StationsService,
    private scheduleService: ScheduleService,
    private trackingService: TrackingService,
    private       uiService:       UIService) { }

  trainNumber : number;
  trainInfo: Train;
  private allStations: { [key: string]: Station } = {};
  private trainTrackingData: TrackingEvent[] = [];
  private routeStations: string[] = [];

  ngOnInit(): void {
    this.route.params['subscribe'](
      (params: { [x: string]: string; }) => {
        this.trainNumber =  parseInt(params['id']);
      }
    );
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
    this.scheduleService
      .getTrainInfo(this.trainNumber,
                    this.uiService.getDepartureCityCode(),
                    this.uiService.getArrivalCityCode())
      .subscribe((train: Train) => {
        this.trainInfo = train;
    });

    this.trackingService.getTrackingData(this.trainNumber).subscribe((data) => {
      this.trainTrackingData = data;
      console.log(this.trainNumber, data);
      this.extractStations();
    });
  }

  private extractStations() {
    for (var event of this.trainTrackingData) {
      if (!this.routeStations.includes(event.station))
        this.routeStations.push(event.station);
    }
    this.routeStations = this.routeStations.reverse();
    console.log(this.routeStations);
  }
}
