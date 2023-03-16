import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { MatProgressBar } from '@angular/material/progress-bar';
import { Validators, UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppLoaderService } from '../../../shared/services/app-loader/app-loader.service';
import { JwtAuthService } from '../../../shared/services/auth/jwt-auth.service';
import { DukanzAuthService } from 'app/shared/services/auth/dukanz-auth.service';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css']
})
export class SigninComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatProgressBar) progressBar: MatProgressBar;
  @ViewChild(MatButton) submitButton: MatButton;

  signinForm: UntypedFormGroup;
  errorMsg = '';
  return: string;


  constructor
  (        
    private authService: DukanzAuthService,
    private route: ActivatedRoute,
    private router: Router
  ) 
  {
    this.route.params.subscribe(params => {      
      if (params['return'])
      { 
        this.return = params['return']
      }
    });
  }

  ngOnInit() {
    this.signinForm = new UntypedFormGroup({
      username: new UntypedFormControl('jabranshaheen@hotmail.com', Validators.required),
      password: new UntypedFormControl('66J4br4n66', Validators.required),
      rememberMe: new UntypedFormControl(true)
    });

    // this.route.queryParams
    //   .pipe(takeUntil(this._unsubscribeAll))
    //   .subscribe(params => this.return = params['return'] || '/');
  }

  ngAfterViewInit() {
    // this.autoSignIn();
  }

  ngOnDestroy() {

  }

  signin() {
    this.submitButton.disabled = true;
    this.progressBar.mode = 'indeterminate';  
    this.authService.signInUser(this.signinForm.value.username,this.signinForm.value.password).subscribe    
    (

      data=>{
        console.log("Loggin function")
        this.router.navigateByUrl(this.return);
      }
    );
    }
}
