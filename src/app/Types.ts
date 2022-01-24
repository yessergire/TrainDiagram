export interface TrackingEvent {
  id: number,
  version: number,
  trainNumber: string,
  departureDate: string,
  timestamp: string,
  trackSection: string,
  nextTrackSection?: string,
  previousTrackSection?: string,
  station: string,
  nextStation?: string,
  previousStation?: string,
  type: string,
}

export interface Station {
  passengerTraffic: boolean,
  countryCode: string,
  stationName: string,
  stationShortCode: string,
  stationUICCode: number,
  latitude: number,
  longitude: number,
  type: string,
}

export interface TimeTable {
  trainStopping?: boolean,
  stationShortCode: string,
  stationUICCode?: number,
  countryCode?: string,
  type?: string,
  commercialStop?: boolean,
  commercialTrack?: string,
  cancelled?: boolean,
  scheduledTime: string,
  liveEstimateTime?: string,
  estimateSource?: string,
  unknownDelay?: boolean,
  actualTime?: string,
  differenceInMinutes?: number,
  train?: Train,
}

export interface Train {
  trainNumber: number,
  departureDate: string,
  operatorUICCode: number,
  operatorShortCode: string,
  trainType: string,
  trainCategory: string,
  commuterLineID?: string,
  runningCurrently: boolean,
  cancelled: boolean,
  version: number,
  timetableType: string,
  timetableAcceptanceDate: string,
  deleted?: boolean,
  timeTableRows: TimeTable[],
  trackingEventRows?: TrackingEvent[]
}