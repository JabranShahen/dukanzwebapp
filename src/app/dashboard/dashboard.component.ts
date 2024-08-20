import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']  // Corrected the typo: "styleUrl" to "styleUrls"
})
export class DashboardComponent {

  constructor(private afAuth: AngularFireAuth, private router: Router) {}

  logout() {
    this.afAuth.signOut().then(() => {
      // Clear any stored token if applicable
      localStorage.removeItem('authToken');

      // Navigate back to login page
      this.router.navigate(['/login']);
    });
  }
}
