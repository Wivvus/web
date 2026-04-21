import { Routes } from '@angular/router';
import { LoginComponent } from '../components/login/login.component';
import { AuthGoogleCallbackComponent } from '../components/auth-google-callback/authGoogleCallback.component';
import { RegisterComponent } from '../components/register/register.component';
import { SetPasswordComponent } from '../components/set-password/setPassword.component';
import { authGuard } from '../guards/auth/auth.guard';
import { EventsListComponent } from '../components/event/list/eventsList.component';
import { CreateEventComponent } from '../components/event/create/createEvent.component';
import { EventDetailComponent } from '../components/event/detail/eventDetail.component';
import { EditEventComponent } from '../components/event/edit/editEvent.component';
import { AccountComponent } from '../components/account/account.component';
import { NotFoundComponent } from '../components/not-found/notFound.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'auth/google/callback', component: AuthGoogleCallbackComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'set-password', component: SetPasswordComponent },
  {
    path: 'account',
    component: AccountComponent,
    title: 'Account Settings',
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
    path: 'events/:id/edit',
    component: EditEventComponent,
    title: 'Edit Event',
    canActivate: [authGuard],
    data: { message: 'You need to be logged in to edit events' }
  },
  {
    path: 'events/:id',
    component: EventDetailComponent,
    title: 'Event'
  },

  {
    path: '', 
    component: EventsListComponent, 
    title: "Come to events wivvus" 
  },

  {
    path: '**',
    component: NotFoundComponent,
    title: 'Page not found'
  }
];