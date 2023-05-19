import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {CustomerService} from './customer.service';
import {Incident} from '../_models/incident';

@Injectable({
  providedIn: 'root'
})
export class SosService {
  constructor(private httpClient: HttpClient, private customerService: CustomerService) {
  }

  //for get safe on site (sos) file data
  getSafeOnSite(): Observable<any> {
    const url = './assets/jsondata/sos_json.json';
    return this.httpClient.get<any>(url); 
  }

  //for get sos incidents by incident id from api
  getSoSIncidentsById(incidentId): Observable<any> {
    const company_id = this.customerService.getUser().company.id;
    const url = `${environment.API_URL}company/` + company_id + '/incidents/' + incidentId + '?includes=user';
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

}
