import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { CustomerService } from './customer.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SifService {

  constructor(private httpClient: HttpClient,
    private customerService: CustomerService) { }

    //get SIF Graph details
  getSIFGraph(incidentType:string,start:string,end:string): Observable<any> {
    const url = `${environment.API_URL}sifincidenttotals/${incidentType}/${start}/${end}`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()}),
      'content-type': 'application/json',
    };
    return this.httpClient.get<any>(url,httpOptions);
  }


}
