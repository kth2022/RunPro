export interface Shoe {
  id: number;
  name: string;
  brand: string;
  mileage: number;
  maxMileage: number;
  color: string;
}

export interface IntervalDetails {
  sets: number;
  workDist: number;
  restTime: number;
}

export interface Goal {
  id: number;
  date: string;
  targetDist: number;
  targetPace: string;
  type: 'distance' | 'interval';
  achieved: boolean;
  intervalDetails?: IntervalDetails | null;
}

export interface Record {
  id: number;
  date: string;
  distance: number;
  time: string;
  pace: string;
  avgHr?: number | null;
  maxHr?: number | null;
  cadence?: number | null;
  shoeId?: number | string;
}

export interface TrainingPlanItem {
  dayOffset: number;
  type: 'distance' | 'interval';
  targetDist: number;
  targetPace: string;
  note: string;
  intervalDetails: IntervalDetails | null;
}

export type PickerState = {
  targetDistInt: number;
  targetPaceMin: number;
  targetPaceSec: number;
  intervalSets: number;
  intervalWorkDist: number;
  intervalRestTime: number;
  actualDistInt: number;
  actualTimeMin: number;
  actualTimeSec: number;
  shoeId: string;
  isComplete: boolean;
};
