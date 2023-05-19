import {CanActivate, CanActivateChild, Router} from '@angular/router';
import {Injectable} from '@angular/core';
import {CustomerService} from './_services/customer.service';
import {ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router/src/router_state';

@Injectable()
export class NeedAuthGuard implements CanActivate, CanActivateChild {

  constructor(private customerService: CustomerService, private router: Router) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {

    const redirectUrl = route['_routerState']['url'];
    // console.log(this.customerService.isLogged());

    if (this.customerService.isLogged()) {
      // console.log(this.customerService.getToken());
      // console.log(this.customerService.getUser().company.id);
      // console.log(this.customerService.getUser().company);
      return true;
    }

    this.router.navigateByUrl(
      this.router.createUrlTree(
        ['/login'], {
          queryParams: {
            redirectUrl
          }
        }
      )
    );

    return false;
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):  boolean {
    return this.canActivate(route, state);
  }
}
