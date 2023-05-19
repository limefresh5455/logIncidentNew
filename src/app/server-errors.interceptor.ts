import {Injectable} from '@angular/core';
import {
  HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpClient
} from '@angular/common/http';

import {Observable, throwError} from 'rxjs';
import {catchError, tap, map, switchMap} from 'rxjs/operators';
import {CustomerService} from './_services/customer.service';
import {AuthService} from './_services/auth.service';

/** Pass untouched request through to the next request handler. */
@Injectable()
export class ServerErrorsInterceptor implements HttpInterceptor {

  private refreshTokenInProgress = false;

  constructor(private customerService: CustomerService, private authService: AuthService) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(catchError(err => {
      if (err.status === 401) {
        console.log('401: ', err);

        console.log('old token: ', this.customerService.getToken());
        // return this.handleUnauthorized(req, next);

        if (this.refreshTokenInProgress) {
          console.log('refresh in progress');
          // todo
        } else {
          this.refreshTokenInProgress = true;

          return this.authService.refreshToken(this.customerService.getToken()).pipe(
            switchMap((r: any) => {
              console.log('refreshed data ?', r);
              this.customerService.setToken(r.data.token);
              const newRequest = req.clone({
                setHeaders: {
                  Authorization: 'Bearer ' + r.data.token
                }
              });
              console.log(newRequest);
              // newRequest.headers.set('Authorization', 'Bearer ' + this.customerService.getToken());
              return next.handle(newRequest);
            })
          );
        }

      } else {
        return throwError(err);
      }
    }));
  }

  // this.authService.refreshToken(this.customerService.getToken()).subscribe(r => {
  //   console.log(r);
  //   this.customerService.setToken(r.data.token);
  //
  //   console.log('new token: ', this.customerService.getToken());
  //   const newRequest = req.clone();
  //   newRequest.headers.set('Authorization', 'Bearer ' + this.customerService.getToken());
  //   return next.handle(newRequest);
  // });

  handleUnauthorized(req: HttpRequest<any>, next: HttpHandler) {
    this.authService.refreshToken(this.customerService.getToken()).pipe(
      switchMap((r: any) => {
        // console.log(r);
        this.customerService.setToken(r.data.token);

        // console.log('new token: ', this.customerService.getToken());
        const newRequest = req.clone();
        newRequest.headers.set('Authorization', 'Bearer ' + this.customerService.getToken());
        return next.handle(newRequest);
      })
    );


    // this.authService.refreshToken(this.customerService.getToken()).subscribe(r => {
    // });
  }


}
