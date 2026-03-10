import { Routes } from '@angular/router';
import { LoginComponent } from '../components/login/login.component';
import { DashboardComponent } from '../components/dashboard/dashboard.component';
import { authGuard } from '../guards/auth/auth.guard';
import { EventsListComponent } from '../components/event/list/eventsList.component';
import { CreateEventComponent } from '../components/event/create/createEvent.component';

export const routes: Routes = [
  { 
    path: 'login', 
    component: LoginComponent 
  },
  { 
    path: 'dashboard', 
    component: DashboardComponent, 
    canActivate: [authGuard] 
  },

  {
    path: 'events/create',
    component: CreateEventComponent,
    title: "Create a new event wivvus",
    canActivate: [authGuard],
    data: { message: 'You need to be logged in to create events' }
  },

  {
    path: '', 
    component: EventsListComponent, 
    title: "Come to events wivvus" 
  },

  { 
    path: '**', 
    redirectTo: '/dashboard' 
  }
];