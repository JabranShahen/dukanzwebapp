import { Injectable } from "@angular/core";
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from "@angular/router";
import { DukanzAuthService } from "../services/auth/dukanz-auth.service";
import { JwtAuthService } from "../services/auth/jwt-auth.service";

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(private router: Router, private auth: DukanzAuthService) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    console.log("canActivate called");
    if (this.auth.idToken!="") {
      console.log("this.auth.idToken!=blank");
      return true;
    } else {
      console.log("logged in");
      this.router.navigate(["/sessions/signin"], {
        queryParams: {
          return: state.url
        }
      });
      return false;
    }
  }
}
