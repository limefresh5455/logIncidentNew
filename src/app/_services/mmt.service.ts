import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {CustomerService} from './customer.service';

@Injectable({
  providedIn: 'root'
})
export class MmtService {
  constructor(private httpClient: HttpClient, private customerService: CustomerService) {}

  //for get monthly tour data from api
  getMonthlyTours(incidentId: string): Observable<any> {
    const url = `${environment.API_URL}audittracker/audits/${incidentId}`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions); 
  }

  //for get monthly tour question from api data
  getNewMmtquestion(incidentId: string): Observable<any> {
    const url = `${environment.API_URL}incidents/${incidentId}`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  //for get future mmt questions file data
  getFutureMmt(incidentId: string, startDate: string, endDate: string): Observable<any> {
    const url = `${environment.API_URL}auditschedule/${incidentId}/${startDate}/${endDate}`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  //for replace future mmt questions file data
  replaceFutureMmt(questionId: string, replaceId: string): Observable<any> {
    const url = `${environment.API_URL}auditschedule/${questionId}`;
    const body = {
      "replacement": replaceId
    }
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()}),
      'content-type': 'application/json',
    };
    return this.httpClient.put<any>(url, body, httpOptions);
  }

  //for generate question in future mmt
  generateQuestion(incidentId: string, body: object): Observable<any> {
    const url = `${environment.API_URL}auditschedule/${incidentId}`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()}),
      'content-type': 'application/json',
    };
    return this.httpClient.post<any>(url, body, httpOptions);
  }

  //for trigger audit now in future mmt and audit
  triggerAuditNow(incidentId: string, gDate, auditGroup, qNumber): Observable<any> {
    const url = `${environment.API_URL}audittracker/${incidentId}/${gDate}/${auditGroup}/${qNumber}`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  //for delete generate question
  deleteGenerateQuestion(incidentId: string, gDate): Observable<any> {
    const url = `${environment.API_URL}auditschedule/${incidentId}/${gDate}`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()}),
      'content-type': 'application/json',
    };
    return this.httpClient.delete<any>(url, httpOptions);
  }

  //for update owners in generate questions
  updateOwnersInQuestion(body): Observable<any> {
    const url = `${environment.API_URL}auditscheduleowners`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()}),
      'content-type': 'application/json',
    };
    return this.httpClient.put<any>(url, body, httpOptions);
  }

  //for get mmt question pool file data
  getMmtQuestionPool(incidentId: string): Observable<any> {
    const url = `${environment.API_URL}auditquestions/${incidentId}`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  //for create mmt question pool
  createQuestionPool(incidentId: string, questionPool: object): Observable<any> {
    const url = `${environment.API_URL}auditquestions/${incidentId}`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()}),
      'content-type': 'application/json',
    };
    return this.httpClient.post<any>(url, questionPool, httpOptions);
  }

  //for update and change status mmt question pool
  editQuestionPool(questionId: string, body: object): Observable<any> {
    const url = `${environment.API_URL}auditquestions/${questionId}`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()}),
      'content-type': 'application/json',
    };
    return this.httpClient.put<any>(url, body, httpOptions);
  }

  //for get mmt admin list data
  getMmtAdminList(): Observable<any> {
    const company_id = this.customerService.getUser().company.id;
    const url = `${environment.API_URL}auditgroup/company/${company_id}`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  //for get mmt admin user list data
  getMmtAdminUserList(): Observable<any> {
    const company_id = this.customerService.getUser().company.id;
    const url = `${environment.API_URL}company/me?includes=companyUsers,userGroups,userGroupsParent`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  //for create mmt admin account
  createMmtAdminAccount(body: object): Observable<any> {
    const company_id = this.customerService.getUser().company.id;
    const url = `${environment.API_URL}auditgroup/company/${company_id}`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()}),
      'content-type': 'application/json',
    };
    return this.httpClient.post<any>(url, body, httpOptions);
  }

  //for delete mmt admin account
  deleteMmtAdminAccount(groupId: string): Observable<any> {
    const company_id = this.customerService.getUser().company.id;
    const url = `${environment.API_URL}auditgroup/company/${company_id}/${groupId}`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()}),
      'content-type': 'application/json',
    };
    return this.httpClient.delete<any>(url, httpOptions);
  }

  //for edit mmt admin account
  updateMmtAdminAccount(body: object): Observable<any> {
    const company_id = this.customerService.getUser().company.id;
    const url = `${environment.API_URL}auditgroup/company/${company_id}`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()}),
      'content-type': 'application/json',
    };
    return this.httpClient.patch<any>(url, body, httpOptions);
  }

  //for get incidents by incident id
  getIncidentsByTypeId(incidentId): Observable<any> {
    const company_id = this.customerService.getUser().company.id;
    const url = `${environment.API_URL}company/` + company_id + '/incidents/' + incidentId;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  //for get incidents detail by incident id
  getIncident(incidentId: string): Observable<any> {
    const url = `${environment.API_URL}incidents/${incidentId}?includes=incidentType,incidentType.sections,logs,user,userGroup,userGroup.parent`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()}),
      'content-type': 'application/json',
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

}
