import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  constructor(private afAuth: AngularFireAuth, private router: Router) {}

  ngOnInit() {
    // Retrieve and log the token when the component is initialized
    this.afAuth.idToken.subscribe(token => {
      if (token) {
        console.log('Auth Token:', token);
      } else {
        console.log('No Auth Token available.');
      }
    });
  }

  logout() {
    this.afAuth.signOut().then(() => {
      // Clear any stored token if applicable
      localStorage.removeItem('authToken');

      // Navigate back to login page
      this.router.navigate(['/login']);
    });
  }
}
