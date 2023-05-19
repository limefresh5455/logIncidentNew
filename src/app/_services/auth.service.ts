import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {shareReplay, tap, catchError} from 'rxjs/operators';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private httpClient: HttpClient) {
  }

  login(val: any): Observable<any> {
    const url = `${environment.API_URL}auth/login`;
    return this.httpClient.post<any>(url, val).pipe(
      tap(response => {
        // console.log('Post successful.');
      })
    );
  }

  forgetRequest(val: any): Observable<any> {
    const url = `${environment.API_URL}forget/request`;
    return this.httpClient.post<any>(url, val);
  }

  refreshToken(token: string): Observable<any> {
    const url = `${environment.API_URL}auth/token`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + token})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  getUser(token: string): Observable<any> {
    const url = `${environment.API_URL}user/me`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + token})
    };
    return this.httpClient.get<any>(url, httpOptions).pipe(
      tap(response => {
        // console.log(response);
      })
    );
  }

  postQrSet(body: any): Observable<any> {
    const url = `${environment.API_URL}auth/qrset`;
      return this.httpClient.post<any>(url,body).pipe(
      tap(response => {
        // console.log('Post successful.',response);
      })
    );
  }

  postQrLogin(val: any): Observable<any> {
    const url = `${environment.API_URL}auth/qrlogin`;
    const qrToken = localStorage.getItem('qrToken');
    console.log( qrToken)
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + qrToken})
    };
    return this.httpClient.post<any>(url, val, httpOptions);
  }

  postQrToken(val: any): Observable<any> {
    const url = `${environment.API_URL}auth/qrgettoken`;
    return this.httpClient.post<any>(url, val);
  }

  setQRCode(data:any){
    const url = `${environment.API_URL}auth/qrset`;
    return this.httpClient.post<any>(url,data)

  }

  qrLogin(qrCode){
    const url = `${environment.API_URL}auth/qrlogin`;
    return this.httpClient.post<any>(url,qrCode)
  }

  qrGetToken(data){
    const url = `${environment.API_URL}auth/qrgettoken`;
    return this.httpClient.post<any>(url,data)
  }

}
