import { Component, OnInit, ViewChild } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatProgressBar } from '@angular/material/progress-bar';
import { Validators, UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { DukanzAuthService } from 'app/shared/services/auth/dukanz-auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
  @ViewChild(MatProgressBar) progressBar: MatProgressBar;
  @ViewChild(MatButton) submitButton: MatButton;

  signupForm: UntypedFormGroup
  constructor(private authService: DukanzAuthService) 
  {    

  }

  ngOnInit() {
    const password = new UntypedFormControl('', Validators.required);

    this.signupForm = new UntypedFormGroup({
      email: new UntypedFormControl('', [Validators.required, Validators.email]),
      password: password,
      agreed: new UntypedFormControl('', (control: UntypedFormControl) => {
        const agreed = control.value;
        if(!agreed) {
          return { agreed: true }
        }
        return null;
      })
    })
  }

  signup() {
    const signupData = this.signupForm.value;
    console.log(signupData);
    this.authService.createUser(this.signupForm.value.email,this.signupForm.value.password).subscribe(
      data=>      
      {
        console.log(data.email.toString());
      }
    );
    this.submitButton.disabled = true;
    this.progressBar.mode = 'indeterminate';

  }

}
