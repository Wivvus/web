import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Event } from '../../../models/event.model';
import { FormControl, FormGroup, FormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../services/api/api.service';
import { Router } from '@angular/router';
import { LeafletModule, LeafletUtil } from "@asymmetrik/ngx-leaflet";
import * as Leaflet from 'leaflet';

@Component({
  selector: 'create-event',
  standalone: true,
  imports: [CommonModule, FormsModule, LeafletModule],
  templateUrl: "./createEvent.template.html",
  styleUrl: "./createEvent.style.less"
})

export class CreateEventComponent {
    event: Event = new Event()
    
    options: Leaflet.MapOptions = {
    layers: this.getLayers(),
    zoom: 12,
    center: new Leaflet.LatLng(43.530147, 16.488932)
  };
    constructor(
        private apiService: ApiService,
        private router: Router
    ) {}

    onSubmit(): void{
        var me = this
        this.apiService.createEvent(this.event).subscribe({
            next() {
                me.router.navigate(['/'])
            },
            error(err){
                if (err.status == 401) {
                    me.router.navigate(['/login'])
                } 
            },
        })
    }
    
    getLayers(): Leaflet.Layer[] {
    return [
        new Leaflet.TileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
        } as Leaflet.TileLayerOptions),
    ] as Leaflet.Layer[];
    }    
}