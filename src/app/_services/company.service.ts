import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {CustomerService} from './customer.service';
import {Incident} from '../_models/incident';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  constructor(private httpClient: HttpClient, private customerService: CustomerService) {
  }

  searchCompany(companyName: string): Observable<any> {
    const url = `${environment.API_URL}search/companies?name=` + companyName;
    // const httpOptions = {
    //   headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    // };
    return this.httpClient.get<any>(url);
  }

  getUserCompany(): Observable<any> {
    const url = `${environment.API_URL}company/me`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  getUserCreatedExport(): Observable<any> {
    const url = `${environment.API_URL}user/me?includes=incidents&appendInjury=true`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  getUserAssignedExport(): Observable<any> {
    const url = `${environment.API_URL}user/me?includes=assignedIncidents&appendInjury=true`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  getIncidents(): Observable<Incident> {
    const company_id = this.customerService.getUser().company.id;
    const url = `${environment.API_URL}company/` + company_id + '/incidents?includes=incidentType,user,userGroup,userGroup.parent';
    // user,userGroup,userGroup.parent
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  searchIncidents(searchTerm: string, companyId): Observable<any> {
    const url = `${environment.API_URL}company/` + companyId + `/incidents/search?search=` + searchTerm + `&includes=incidentType,user,userGroup,userGroup.parent`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()}),
      'content-type': 'application/json',
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  searchIncidentsByTag(tagId: string): Observable<any> {
    const url = `${environment.API_URL}tag/` + tagId + `/incidents?includes=incidentType,user,userGroup,userGroup.parent`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()}),
      'content-type': 'application/json',
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  getIncidentsForExport(): Observable<Incident> {
    const company_id = this.customerService.getUser().company.id;
    // tslint:disable-next-line:max-line-length
    const url = `${environment.API_URL}company/` + company_id + '/incidents?includes=incidentType,user,userGroup,userGroup.parent&appendInjury=true';
    // user,userGroup,userGroup.parent
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  getCompany(id: string): Observable<any> {
    const url = `${environment.API_URL}company/${id}?includes=statuses,defaultStatus,noteTypes`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  getCompanyGroupTypes(id: string): Observable<any> {
    const url = `${environment.API_URL}company/${id}?includes=groupTypes`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  getCompanyGroupTypesWithGroups(id: string): Observable<any> {
    const url = `${environment.API_URL}company/${id}?includes=groupTypes,groupTypes.groups`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  getCompanyTags(): Observable<any> {
    const url = `${environment.API_URL}tags`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  getCompanyUsers(): Observable<any> {
    const url = `${environment.API_URL}company/me?includes=companyUsers`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  searchCompanyUsers(term = ''): Observable<any> {
    const url = `${environment.API_URL}company/users?term=${term}`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  searchCompanyUsersByTerm(term = ''): Observable<any> {
    const url = `${environment.API_URL}searchusers/${term}`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  getDashboardReport(id: string): Observable<any> {
    const url = `${environment.API_URL}company/${id}/incidenttotals?includes=incidentType`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  searchUsersIncidents(userId: string): Observable<any> {
    const company_id = this.customerService.getUser().company.id;
    const url = `${environment.API_URL}company/user/` + company_id + '/incidents/' + userId;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  getCompanyUserList(){
    const url = `${environment.API_URL}/company/me?includes=companyUsers`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }
  
  getGroupBranch(id: string): Observable<any> {
    const url = `${environment.API_URL}usergroups/company/${id}?includes=parent`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  
    
}
