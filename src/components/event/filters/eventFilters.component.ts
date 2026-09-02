import { Component, Input, Output, EventEmitter, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventFilters } from '../../../models/event.model';

const LENGTH_MIN = 0;
const LENGTH_MAX = 50;
const PACE_MIN = 3;
const PACE_MAX = 15;

@Component({
  selector: 'event-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './eventFilters.template.html',
  styleUrl: './eventFilters.style.less'
})
export class EventFiltersComponent implements OnInit {
  @Input() floating = false;
  @Output() filtersChange = new EventEmitter<EventFilters>();

  readonly lengthMin = LENGTH_MIN;
  readonly lengthMax = LENGTH_MAX;
  readonly paceMin = PACE_MIN;
  readonly paceMax = PACE_MAX;

  lengthLow = LENGTH_MIN;
  lengthHigh = LENGTH_MAX;
  paceLow = PACE_MIN;
  paceHigh = PACE_MAX;
  dateFrom: string = '';
  collapsed = false;
  private platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    this.collapsed = isPlatformBrowser(this.platformId) ? window.innerWidth < 768 : false;
  }

  get hasActiveFilters(): boolean {
    return this.lengthLow > LENGTH_MIN || this.lengthHigh < LENGTH_MAX
      || this.paceLow > PACE_MIN || this.paceHigh < PACE_MAX
      || !!this.dateFrom;
  }

  trackFill(low: number, high: number, min: number, max: number): string {
    const lo = ((low - min) / (max - min)) * 100;
    const hi = ((high - min) / (max - min)) * 100;
    return `linear-gradient(to right, var(--border) ${lo}%, var(--red) ${lo}%, var(--red) ${hi}%, var(--border) ${hi}%)`;
  }

  onLengthLowChange(): void {
    if (this.lengthLow > this.lengthHigh) this.lengthHigh = this.lengthLow;
    this.apply();
  }

  onLengthHighChange(): void {
    if (this.lengthHigh < this.lengthLow) this.lengthLow = this.lengthHigh;
    this.apply();
  }

  onPaceLowChange(): void {
    if (this.paceLow > this.paceHigh) this.paceHigh = this.paceLow;
    this.apply();
  }

  onPaceHighChange(): void {
    if (this.paceHigh < this.paceLow) this.paceLow = this.paceHigh;
    this.apply();
  }

  apply(): void {
    const f: EventFilters = {};
    if (this.lengthLow > LENGTH_MIN) f.minLength = this.lengthLow;
    if (this.lengthHigh < LENGTH_MAX) f.maxLength = this.lengthHigh;
    if (this.paceLow > PACE_MIN) f.minPace = this.paceLow;
    if (this.paceHigh < PACE_MAX) f.maxPace = this.paceHigh;
    if (this.dateFrom) f.dateFrom = this.dateFrom;
    this.filtersChange.emit(f);
  }

  clear(): void {
    this.lengthLow = LENGTH_MIN;
    this.lengthHigh = LENGTH_MAX;
    this.paceLow = PACE_MIN;
    this.paceHigh = PACE_MAX;
    this.dateFrom = '';
    this.filtersChange.emit({});
  }
}
