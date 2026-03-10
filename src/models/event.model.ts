export interface Location {
  lat: number | null;
  long: number | null;
}

export class Event {
  constructor(
    public id: number = 0,
    public name: string = "",
    public location: Location = { lat: null, long: null },
  ) { }
}
