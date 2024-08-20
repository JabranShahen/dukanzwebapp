import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  email: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(public afAuth: AngularFireAuth, private router: Router) {}

  ngOnInit() {
    // Check if there is a persisted token and sign in with it
    const token = localStorage.getItem('authToken');
    if (token) {
      this.afAuth.signInWithCustomToken(token)
        .then(() => {
          this.router.navigate(['/dashboard']);
        })
        .catch(error => {
          console.error('Failed to sign in with persisted token', error);
          localStorage.removeItem('authToken'); // Remove invalid token
        });
    }
  }

  login() {
    this.afAuth.signInWithEmailAndPassword(this.email, this.password)
      .then(result => {
        // Fetch the ID token after successful login
        result.user?.getIdToken().then((token: string) => {
          // Store the token in localStorage
          localStorage.setItem('authToken', token);

          // Navigate to the dashboard
          this.router.navigate(['/dashboard']);
        });
      })
      .catch(error => {
        this.errorMessage = error.message;
      });
  }

  logout() {
    this.afAuth.signOut().then(() => {
      // Clear the token from localStorage
      localStorage.removeItem('authToken');

      // Navigate back to login page
      this.router.navigate(['/login']);
    });
  }
}
