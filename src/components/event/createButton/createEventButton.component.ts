import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, UserInfo } from '../../../services/authentication/auth.service';
import { ApiService, UserData, UserProfile } from '../../../services/api/api.service';

@Component({
  selector: 'create-event-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./createEventButton.template.html",
  styleUrl: "./createEventButton.style.less"
})

export class CreateEventButtonComponent {
  constructor(private router: Router){}
  onClick(): void {
    this.router.navigate(['/events/create'])
  }
}