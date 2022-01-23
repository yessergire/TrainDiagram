import { Component, OnInit, Input } from '@angular/core';
import { Station, TimeTable, TrackingEvent, Train } from '../../Types'
import { StationsService } from '../../services/stations.service'
import { ScheduleService } from '../../services/schedule.service'
import { TrackingService } from '../../services/tracking.service'
import * as d3 from 'd3';
import { UIService } from 'src/app/services/ui.service';
import { Subscription } from 'rxjs';


// FIXME: Make modular.
// FIXME: Remove data fetching.
// TODO: Add custom datatypes.
// One that merges TrackingEvent and TimeTable types (eg RouteEvents).
// Input should be a list of Train with route info attached to each train.

@Component({
  selector: 'app-train-diagram',
  templateUrl: './train-diagram.component.html',
  styleUrls: ['./train-diagram.component.css']
})
export class TrainDiagramComponent implements OnInit {
  @Input() stations: { [key: string]: Station };
  @Input() trains: Train[];
  @Input() departureCityCode: string;
  @Input() destinationCityCode: string;

  trainTrackingData: { [key: string]: TrackingEvent[] } = {};
  trainHash : { [key: number]: Train } = {};
  routeStations: string[] = [];
  svg :any;
  height = 600;
  width = 1000;
  margin = {left: 10, right: 10, top: 10, bottom: 50};
  tooltip: any;
  subscription : Subscription;

  constructor(
    private stationsService: StationsService,
    private scheduleService: ScheduleService,
    private trackingService: TrackingService,
    private       uiService:       UIService) {
      this.subscription = this.uiService.onSelectCityCode().subscribe((cityCode) => {
        this.destinationCityCode = cityCode;
        this.fetchData();
      });
  }

  private timeReference = new Date();

  private windowSize = 2;
  private timeWindow = this.windowSize * 60 * 60 * 1000;

  private filterStations = (d:TimeTable) => this.routeStations.indexOf(d.stationShortCode) != -1

  private filterTimewindow = (d:TimeTable) => {
    const time = new Date(d.scheduledTime).getTime();
    return (time < this.timeReference.getTime() + this.timeWindow) && (time > this.timeReference.getTime() - this.timeWindow);
  };

  private filterScheduledTime = (d:TimeTable) => (this.filterStations(d) && this.filterTimewindow(d))

  private createSvg(): void {
    const now = this.timeReference;
    const maxTextLength = Math.max.apply(null, this.routeStations.map(station => this.stations[station].stationName.length));
    this.margin.left = maxTextLength * 6;

    if (!!this.svg) this.svg.remove();

    this.svg = d3
      .select("#trainDiagram")
      .append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom);

    const x = d3.scaleTime()
      .domain([now.getTime() - this.timeWindow, now.getTime() + this.timeWindow])
  		.range([0, this.width]);

    const trains = this.trains.filter(train => train.timeTableRows.filter(this.filterScheduledTime).length > 0);

    // Draw vertical lines
    const y1 = 0, y2 = this.height;
    for (let i = 1; i <= this.windowSize*2; i++) {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      today.setHours(now.getHours() - this.windowSize + i);
      this.drawVerticalLine(x(today), "gray");
    }

    const y = d3.scaleLinear()
      .domain([0, this.routeStations.length-1])
      .range([this.height, 0]);

    const train = this.svg
      .selectAll("g")
      .data(trains).enter()
      .append("g")
      .attr("class", "train")
      .attr("stroke-width", 1.5);

    const yFromCode = (code: string) => y(this.routeStations.indexOf(code))

    const timeTableLines = d3.line<TimeTable>()
      .x(d => x(new Date(d.scheduledTime).getTime()))
      .y(d => yFromCode(d.stationShortCode));

    this.drawTrainLine(train, timeTableLines);

    this.svg.call(d3.drag().on("drag", this.onDrag));
    // const tooltipGroup = this.svg.append("g")
    //   .style("font", "14px sans-serif");

    // const tooltipPath = tooltipGroup.append("path")
    //   .attr("fill", "white");

    // const tooltipText = tooltipGroup.append("text");
    // const tooltipTitle = tooltipText.append("tspan");

    this.drawTrainLineCircles(train, x, y);

    // draw current time as vertical line
    this.drawVerticalLine(x(Date.now()), "red", 3);

    this.drawAxis(x, y);
  }

  private drawTooltip(element: any, onMouseMove: any) {
    this.tooltip = d3.select("#tooltip").style("opacity", 0);
    element
      .on("mouseover", (e: any, train: Train) => this.tooltip.style("opacity", 1))
      .on("mousemove", onMouseMove)
      // .on("mouseleave", (e: any, d: any) => {
      //   this.tooltip.transition()
      //     .duration(1000)
      //     .style("opacity", 0)
      // });
  }

  private drawTrainLine(trainPath: any, timeTableLines: d3.Line<TimeTable>) {
    const trainLine = trainPath.append("path")
      .attr("fill", "none")
      .style("stroke-width", "2")
      .attr("stroke", (d: Train) => d3.schemeCategory10[d.trainNumber % 10])
      .attr("d", (d: Train) => timeTableLines(d.timeTableRows.filter(this.filterScheduledTime)))
      .attr("class", "trainLine")
      .attr("class", (d: Train) => `train-${d.trainNumber}`)
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`)
      .on("mouseover", (d:any, train: Train) => {
        d3.select(`.train-${train.trainNumber}`)
          .style("stroke-width", "3");
      })
      .on("mouseleave", (d:any, train: Train) => {
        d3.select(`.train-${train.trainNumber}`)
          .style("stroke-width", "2");
      });
  }

  private drawTrainLineCircles(train: any, x: any, y: any) : any {
    const dx = (timetable:TimeTable) => this.margin.left + x(new Date(timetable.scheduledTime).getTime());
    const dy = (timetable:TimeTable) => this.margin.top  + y(this.routeStations.indexOf(timetable.stationShortCode));
    const circles = train.append("g")
        .attr("fill", (d: Train) => d3.schemeCategory10[d.trainNumber % 10])
      .selectAll("circle")
      .data((d:Train) => d.timeTableRows.filter(this.filterScheduledTime).map(table => {
        table.train = d;
        return table;
      }))
      .join("circle")
        .attr("transform", (d:TimeTable) => `translate(${dx(d)},${dy(d)})`)
        .attr("stroke", (d:TimeTable) => `${(d.trainStopping)? 'black': 'white'}`)
        .attr("r", 3);

    this.drawTooltip(circles, (e: any, table: TimeTable) => {
      this.tooltip
        .style("left", e.x + "px")
        .style("top", e.y - 20 + "px");

      const currentTrain = table.train!;

      d3.select(".trainLine").style("stroke-width", "2");
      d3.select(`.train-${currentTrain.trainNumber}`)
        .style("stroke-width", "3");

      const trainNumberLink = `<a href="/train/${currentTrain.trainNumber}">${currentTrain.trainNumber}</a>`;
      if (!currentTrain.commuterLineID){
        this.tooltip
          .select(".commuter-title")
          .html(`<th>${currentTrain.trainType}</th><td>${trainNumberLink}</td>`);
      } else {
        this.tooltip
          .select(".commuter-title")
          .html(`<th>${currentTrain.trainType} ${currentTrain.commuterLineID}</th><td>${trainNumberLink}</td>`);
      }
      this.tooltip
        .select(".commuter-station")
        .html(`<td>Station:</td><td>${this.stations[table.stationShortCode].stationName} (${(table.trainStopping)? 'stop': 'skip'})</td>`);
      this.tooltip
        .select(".commuter-time")
        .html(`<td>Time:</td><td>${new Date(table.scheduledTime).toTimeString().slice(0,8)}</td>`);
    });
  }

  private drawVerticalLine(xPosition: number, color: string, width: number = 1) {
    this.svg.append("line")
      .attr("x1", xPosition).attr("y1", 0)
      .attr("x2", xPosition).attr("y2", this.height)
      .style("stroke", color).style("stroke-width", width)
      .style("fill", "none")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
  }

  private drawAxis(x: any, y: any) {
    this.svg.append('g')
    .attr("transform", `translate(${this.margin.left},${this.height+this.margin.top})`)
    .call(d3.axisBottom(x))

    this.svg.append('g')
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`)
      .call(d3.axisLeft(y)
        .ticks(this.routeStations.length)
        .tickFormat((d,i) => this.stations[this.routeStations[i]].stationName));
  }

  private onDrag = (e:any) => {
    this.timeReference = new Date(this.timeReference.getTime() - e.dx * 60*1000);
    this.createSvg();
  };

  ngOnInit(): void {
    this.stationsService.getStations().subscribe((stations) => {
      for (var station of stations) {
        const code = station.stationShortCode;
        station.stationName = station.stationName.replace(' asema', '');
        this.stations[code] = station;
      }
      this.fetchData();
    });
  }

  private fetchData() {
    this.scheduleService
      .getTrains(this.departureCityCode, this.destinationCityCode)
      .subscribe((trains) => {
        this.trains = trains;

        for (var train of this.trains) {
          this.trainHash[train.trainNumber] = train;
        }

        this.extractStations();
        this.createSvg();
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

