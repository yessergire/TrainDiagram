import { Component, OnInit, Input, HostListener } from '@angular/core';
import { Station, TimeTable, Train } from '../../Types'

import { StationsService } from '../../services/stations.service'
import { ScheduleService } from '../../services/schedule.service'
import { UIService } from 'src/app/services/ui.service';

import * as d3 from 'd3';

@Component({
  selector: 'app-train-diagram',
  templateUrl: './train-diagram.component.html',
  styleUrls: ['./train-diagram.component.css']
})
export class TrainDiagramComponent implements OnInit {
  @Input() stations: { [key: string]: Station };
  @Input() departureCityCode: string;
  @Input() destinationCityCode: string;

  trains: Train[];

  private routeStations: string[] = [];

  private svg: any;
  private chart: any;
  private height = 600;
  private width = window.innerWidth;

  private margin = { left: 120, right: 10, top: 10, bottom: 50 };
  private tooltip: any;

  xScale: any;
  yScale: any;
  trainGroup: any;

  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    this.width = window.innerWidth;
    this.createChart();
  }

  constructor(
    private stationsService: StationsService,
    private scheduleService: ScheduleService,
    private uiService: UIService) {
    this.uiService.onSelectCityCode().subscribe((cityCode) => {
      this.destinationCityCode = cityCode;
      this.fetchData();
    });
  }

  private timeReference = new Date();

  private windowSize = 1;
  private timeWindow = this.windowSize * 60 * 60 * 1000;

  private filterStations = (d: TimeTable) => this.routeStations.indexOf(d.stationShortCode) != -1

  private filterTimewindow = (d: TimeTable) => {
    const time = new Date(d.scheduledTime).getTime();
    return (time < this.timeReference.getTime() + this.timeWindow) && (time > this.timeReference.getTime() - this.timeWindow);
  };

  private filterScheduledTime = (d: TimeTable) => (this.filterStations(d) && this.filterTimewindow(d))

  private createChart(): void {
    //this.margin.left = (d3.max(this.routeStations, station => this.stations[station].stationName.length) || 10) * 6 ;
    this.svg?.remove();
    this.svg = d3
      .select("#trainDiagram")
      .append("svg")
      .attr("width", this.width - this.margin.left - this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom);

    this.chart = this.svg.append('g')
    .attr("transform", `translate(${this.margin.left},${this.margin.top})`)

    this.xScale = d3.scaleTime()
      .domain([this.timeReference.getTime() - this.timeWindow, this.timeReference.getTime() + this.timeWindow])
      .range([0, this.width]);

    this.yScale = d3.scaleLinear()
      .domain([0, this.routeStations.length - 1])
      .range([this.height, 0]);

    this.drawTrains();

    // Draw vertical lines indicating time
    this.drawTimeLines();

    this.drawAxis();

    this.svg.call(d3.drag().on("drag", this.onDrag));
  }



  private drawTrains() {    
    this.trainGroup = this.chart
      .selectAll("g")
      .data(this.trains.filter(train => train.timeTableRows.filter(this.filterScheduledTime).length > 0))
      .join("g")
      .attr("class", "train")
      .attr("stroke", (d: Train) => d3.schemeCategory10[d.trainNumber % 10]);

    this.drawTrainLine();

    this.drawTooltipCircles();
  }

  private drawTimeLines() {
    this.drawVerticalLine(this.xScale(Date.now()), "red", 3);
    for (let i = 1; i <= this.windowSize * 2; i++) {
      const date = new Date(this.timeReference.getFullYear(), this.timeReference.getMonth(), this.timeReference.getDate());
      date.setHours(this.timeReference.getHours() - this.windowSize + i);
      this.drawVerticalLine(this.xScale(date), "black");
    }
  }

  private redrawChart(): void {
    d3.selectAll(".vertical-line").remove();
    this.drawTimeLines();

    this.xScale.domain([this.timeReference.getTime() - this.timeWindow, this.timeReference.getTime() + this.timeWindow]);
    this.drawAxisX();

    this.trainGroup.remove();
    this.drawTrains();
    }

  private onDrag = (e: any) => {
    this.timeReference = new Date(this.timeReference.getTime() - e.dx * 5000);
    this.redrawChart();
  };

  private drawAxis() {
    this.drawAxisX();
    this.chart.append('g')
        .attr("class", "y-axis")
      .call(d3.axisLeft(this.yScale)
        .ticks(this.routeStations.length)
        .tickFormat((d, i) => this.stations[this.routeStations[i]].stationName));
  }

  private drawAxisX() {
    d3.selectAll(".x-axis").remove();
    this.chart.append('g')
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${this.height})`)
      .call(d3.axisBottom(this.xScale));
  }

  private drawVerticalLine(xPosition: number, color: string, width: number = 1) {
    this.chart.append("line")
      .attr("class", "vertical-line")
      .attr("x1", xPosition).attr("y1", 0)
      .attr("x2", xPosition).attr("y2", this.height)
      .style("stroke", color).style("stroke-width", width)
      .style("fill", "none");
  }

  private drawTrainLine() {
    const yFromCode = (code: string) => this.yScale(this.routeStations.indexOf(code))

    const scheduledTimeLines = d3.line<TimeTable>()
      .x(d => this.xScale(new Date(d.scheduledTime).getTime()))
      .y(d => yFromCode(d.stationShortCode));

    const scheduledTimePath = this.trainGroup.append("path")
      .attr("d", (d: Train) => scheduledTimeLines(d.timeTableRows.filter(this.filterScheduledTime)))
      .attr("class", (d: Train) => `train-${d.trainNumber}`)
      .style("fill", "none")
      .style("stroke-width", "2");

    // const actualTimeLines = d3.line<TrackingEvent>()
    //    .x(d => x(new Date(d.timestamp).getTime()))
    //    .y(d => yFromCode(d.station));

    // const actualTimePath = trainGroup.append("path")
    //   .attr("d", (d: Train) => {
    //     console.log(d.trainNumber, d.trackingEventRows);
    //     return actualTimeLines(d.trackingEventRows ?? []);
    //   })
    //   .attr("class", "trainLine")
    //   .attr("class", (d: Train) => `train-${d.trainNumber}`);

    // scheduledTimePath.on("mouseover", (d: any, train: Train) => {
    //   d3.select(`.train-${train.trainNumber}`).style("stroke-width", "3");
    // })
    // scheduledTimePath.on("mouseleave", (d: any, train: Train) => {
    //   d3.select(`.train-${train.trainNumber}`).style("stroke-width", "2");
    // });
  }

  private drawTooltipCircles(): any {
    const dx = (timetable: TimeTable) => this.xScale(new Date(timetable.scheduledTime).getTime());
    const dy = (timetable: TimeTable) => this.yScale(this.routeStations.indexOf(timetable.stationShortCode));

    const tooltipCircles = this.trainGroup.append("g")
      .attr("fill", (d: Train) => d3.schemeCategory10[d.trainNumber % 10])
      .selectAll("circle")
      .data((train: Train) => train.timeTableRows.filter(this.filterScheduledTime).map((table: TimeTable) => {
        table.train = train;
        return table;
      }))
      .join("circle")
      .attr("transform", (table: TimeTable) => `translate(${dx(table)},${dy(table)})`)
      .attr("stroke", (table: TimeTable) => `${(table.trainStopping) ? 'black' : 'white'}`)
      .attr("r", 5);

    this.tooltip = d3.select("#tooltip");
    this.tooltip.style("opacity", 0);
    tooltipCircles
    .on("mouseover", (e: any, table: TimeTable) => {
      //d3.select(".trainLine").style("stroke-width", "2");
      this.tooltip
      .style("left", e.x + 5 + "px")
      .style("top", e.y - 35 + "px");

      d3.select(`.train-${table.train?.trainNumber}`)
        .style("stroke-width", "5");
      this.tooltip.style("opacity", 1);
    })
    .on("mousemove", (e: any, table: TimeTable) => {
      this.tooltip
        .style("left", e.x + 5 + "px")
        .style("top", e.y - 35 + "px");

      this.tooltip
        .select(".commuter-title")
        .html(`<td>(${table.train?.trainType}) ${table.train?.commuterLineID}</th><td>${table.train?.trainNumber}</td>`);
      this.tooltip
        .select(".commuter-station")
        .html(`<td>Station:</td><td>${this.stations[table.stationShortCode].stationName} (${(table.trainStopping) ? 'stop' : 'skip'})</td>`);
      this.tooltip
        .select(".commuter-time")
        .html(`<td>Time:</td><td>${new Date(table.scheduledTime).toTimeString().slice(0, 8)}</td>`);
    })
    .on("mouseout", (e: any, table: TimeTable) => {
      d3.select(`.train-${table.train?.trainNumber}`)
        .style("stroke-width", "2");
      this.tooltip.style("opacity", 0);
    });

  }

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
    this.scheduleService.getTrains(this.departureCityCode, this.destinationCityCode).subscribe((trains) => {
      this.trains = trains;

      // for (const train of this.trains) {
      //   this.trackingService.getTrackingData(train.trainNumber)
      //       .subscribe(events => {
      //         console.log("Fetched events for train", train.trainNumber);
      //         console.log("events", events);
      //         train.trackingEventRows = events;
      //       });
      // }

      this.processStations();
      this.createChart();
    });  
  }

  private processStations() {
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

