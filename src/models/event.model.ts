export class Event {
  constructor(
    public ID: number = 0,
    public Name: string = "",
    public Lat: number | null = null,
    public Lng: number | null = null,
  ) { }
}