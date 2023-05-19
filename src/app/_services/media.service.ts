import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {CustomerService} from './customer.service';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MediaService {

  constructor(private httpClient: HttpClient, private customerService: CustomerService) {
  }

  getMedia(uuid: string): Observable<any> {
    const url = `${environment.API_URL}media/${uuid}`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()}),
      responseType: 'blob' as 'json',
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  getMediaBase64(uuid: string) {
  }

  async getMediaAsync(uuid: string) {
    const url = `${environment.API_URL}media/${uuid}`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()}),
      responseType: 'blob' as 'json',
    };
    const resp = await this.httpClient.get<any>(url, httpOptions).toPromise();
    return resp;
  }
}
