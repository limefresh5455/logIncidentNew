import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {CustomerService} from './customer.service';
import {environment} from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor(
    private httpClient: HttpClient,
    private customerService: CustomerService,
  ) {
  }

  exportToPDF(body): Observable<any> {
    const url = `${environment.API_URL}generate/pdf`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()}),
      'content-type': 'application/json',
    };
    return this.httpClient.post<any>(url, body, httpOptions);
  }
}
