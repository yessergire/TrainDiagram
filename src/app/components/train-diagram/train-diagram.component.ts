import { Component, OnInit, Input, HostListener } from '@angular/core';
import { Station, TimeTable, TrackingEvent, Train } from '../../Types'
import * as d3 from 'd3';
import { UIService } from 'src/app/services/ui.service';

@Component({
  selector: 'app-train-diagram',
  templateUrl: './train-diagram.component.html',
  styleUrls: ['./train-diagram.component.css']
})
export class TrainDiagramComponent implements OnInit {
  @Input() departureCityCode: string;
  @Input() destinationCityCode: string;
  @Input() stations: { [key: string]: Station };
  @Input() trains: Train[];
  @Input() routeStations: string[];

  private svg: any;
  private chart: any;

  private xScale: any;
  private yScale: any;

  private margin = { left: 120, right: 10, top: 10, bottom: 50 };
  private height = window.innerHeight - 250;
  private width = window.innerWidth;
  private timeReference = new Date();

  private windowSize = 1;
  private get timeWindow() {
    return this.windowSize * 60 * 60 * 1000;
  }

  ngOnInit(): void {
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    this.width = window.innerWidth;
    this.createChart();
  }

  constructor(uiService: UIService) {
    uiService.dataUpdated$.subscribe(() => this.resetChart());
  }

  resetChart() {
    this.timeReference = new Date();
    this.createChart();
  }

  private filterStations = (station: string) => this.routeStations.indexOf(station) != -1

  private filterTimewindow = (d: TimeTable) => {
    const time = new Date(d.scheduledTime).getTime();
    return (time < this.timeReference.getTime() + this.timeWindow) && (time > this.timeReference.getTime() - this.timeWindow);
  };

  private filterScheduledTime = (d: TimeTable) => (this.filterStations(d.stationShortCode) && this.filterTimewindow(d))

  private yFromCode = (code: string) => this.yScale(this.routeStations.indexOf(code))

  private createChart(): void {
    if (this.svg != undefined)
      this.svg.remove();

    this.svg = d3
      .select("#trainDiagram")
      .append("svg")
      .attr("width", this.width - this.margin.left - this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom);

    if (this.routeStations.length > 0)
      this.margin.left = (d3.max(this.routeStations, station => this.stations[station].stationName.length) || 10) * 6;

    this.chart = this.svg.append('g')
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`)

    this.xScale = d3.scaleTime()
      .domain([this.timeReference.getTime() - this.timeWindow, this.timeReference.getTime() + this.timeWindow])
      .range([0, this.width]);

    this.yScale = d3.scaleLinear()
      .domain([0, this.routeStations.length - 1])
      .range([this.height, 0]);

    // Draw vertical lines indicating time
    this.drawTimeLines();
    this.drawTrains();
    this.drawAxis();
    this.svg.call(d3.drag().on("drag", this.onDrag));
  }

  private drawTrains() {
    const trainGroup = this.chart
      .selectAll("g")
      .data(this.trains.filter(train => train.timeTableRows.filter(this.filterScheduledTime).length > 0))
      .join("g")
      .attr("class", "train")
      .attr("stroke", (d: Train) => d3.schemeCategory10[d.trainNumber % 10]);

    this.drawTrainLines(trainGroup);
    this.drawTooltipCircles(trainGroup);
  }

  private drawMinuteLine() {
    d3.select(".minuteline").remove();
    this.drawVerticalLine(this.xScale(Date.now()), "red", 3, "minuteline");
  }

  private drawTimeLines() {
    this.drawMinuteLine();
    setInterval(() => this.drawMinuteLine(), 60 * 1000);

    for (let i = 1; i <= this.windowSize * 2; i++) {
      const date = new Date(this.timeReference.getFullYear(), this.timeReference.getMonth(), this.timeReference.getDate());
      date.setHours(this.timeReference.getHours() - this.windowSize + i);
      this.drawVerticalLine(this.xScale(date), "black");
    }
  }

  private onDrag = (e: any) => {
    this.timeReference = new Date(this.timeReference.getTime() - e.dx * 5000);
    this.createChart();
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

  private drawVerticalLine(xPosition: number, color: string, width: number = 1, domClass = "vertical-line") {
    this.chart.append("line")
      .attr("class", "vertical-line")
      .attr("x1", xPosition).attr("y1", 0)
      .attr("x2", xPosition).attr("y2", this.height)
      .attr("class", domClass)
      .style("stroke", color).style("stroke-width", width)
      .style("fill", "none");
  }

  private dxScheduled = (d: TimeTable) => this.xScale(new Date(d.scheduledTime).getTime());
  private dxActual = (d: TimeTable) => this.xScale(new Date(d.actualTime!).getTime());
  private dy = (d: TimeTable) => this.yFromCode(d.stationShortCode);

  private drawTrainLines(trainGroup: any) {
    const scheduledTimeLines = d3.line<TimeTable>()
      .x(this.dxScheduled).y(this.dy);

    trainGroup.append("path")
      .attr("d", (d: Train) => scheduledTimeLines(d.timeTableRows.filter(this.filterScheduledTime)))
      .attr("class", (d: Train) => `train-${d.trainNumber}`)
      .style("fill", "none")
      .style("stroke-width", "1");

    const actualTimeLines = d3.line<TimeTable>()
      .x(this.dxActual).y(this.dy);

    trainGroup.append("path")
      .attr("d", (d: Train) => {
        return actualTimeLines(d.timeTableRows.filter(this.filterScheduledTime).filter(table => !!table.actualTime));
      })
      .attr("class", (d: Train) => `train-actual-${d.trainNumber}`)
      .style("fill", "none")
      .style("stroke-width", "3");
  }

  private drawTooltipCircles(trainGroup: any): any {
    this.drawTooltip(trainGroup.append("g")
    .attr("fill", (d: Train) => d3.schemeCategory10[d.trainNumber % 10])
    .selectAll("circle")
    .data((train: Train) => train.timeTableRows.filter(this.filterScheduledTime).filter(table => !!table.actualTime).map((table: TimeTable) => {
      table.train = train;
      return table;
    }))
    .join("circle")
    .attr("transform", (table: TimeTable) => `translate(${this.dxActual(table)},${this.dy(table)})`)
    .attr("stroke", (table: TimeTable) => `${(table.trainStopping) ? 'black' : 'white'}`)
    .attr("r", 3));

    this.drawTooltip(trainGroup.append("g")
    .attr("fill", (d: Train) => d3.schemeCategory10[d.trainNumber % 10])
    .selectAll("circle")
    .data((train: Train) => train.timeTableRows.filter(this.filterScheduledTime).map((table: TimeTable) => {
      table.train = train;
      return table;
    }))
    .join("circle")
    .attr("transform", (table: TimeTable) => `translate(${this.dxScheduled(table)},${this.dy(table)})`)
    .attr("stroke", (table: TimeTable) => `${(table.trainStopping) ? 'black' : 'white'}`)
    .attr("r", 3));
  }

  private drawTooltip(element: any) {
    const tooltip = d3.select("#tooltip");
    element
      .on("mouseover", (e: any, table: TimeTable) => {
        tooltip.style("left", e.x + 5 + "px")
          .style("top", e.y - 50 + "px");

        d3.select(`.train-${table.train?.trainNumber}`)
          .style("stroke-width", "3");
        tooltip.style("visibility", "visible");
      })
      .on("mousemove", (e: any, table: TimeTable) => {
        tooltip
          .style("left", e.x + 5 + "px")
          .style("top", e.y - 50 + "px");
        tooltip
          .select(".commuter-title")
          .html(`<th>(${table.train?.trainType}) ${table.train?.commuterLineID}</th><th>${table.train?.trainNumber}</th>`);
        tooltip
          .select(".commuter-station")
          .html(`<td>Station:</td><td>${this.stations[table.stationShortCode].stationName} (${(table.trainStopping) ? 'stop' : 'skip'})</td>`);

        let timeString = `${new Date(table.scheduledTime).toTimeString().slice(0, 8)}`;
        if (table.actualTime == undefined) {
          timeString = `<td>Scheduled:</td><td>${timeString}</td>`
        } else {
          timeString = `<td>Arrived:</td><td>${timeString} ${this.getTimeDifference(table)}</td>`
        }
        tooltip
          .select(".commuter-time")
          .html(timeString);
      })
      .on("mouseout", (e: any, table: TimeTable) => {
        d3.select(`.train-${table.train?.trainNumber}`)
          .style("stroke-width", "1");
        tooltip.style("visibility", "hidden");
      });
  }

  getTimeDifference(table: TimeTable) {
    const actual = new Date(table.actualTime!).getTime();
    const scheduled = new Date(table.scheduledTime).getTime();
    const difference = Math.round((actual - scheduled)  / (60 * 1000));
    if (Math.abs(difference) < 1) return '';

    const sign = (difference > 0)? '+' : '';
    return `${sign}${difference} min`;
  }

  resetTimeReference() {
    this.timeReference = new Date();
    this.createChart();
  }
}
