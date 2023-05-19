import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {CustomerService} from './customer.service';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  constructor(private httpClient: HttpClient, private customerService: CustomerService) {
  }

  getUserAssignedIncidents(): Observable<any> {
    const url = `${environment.API_URL}user/me?includes=assignedIncidents`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  getManagerAssignedIncidents(companyId): Observable<any> {
    const url = `${environment.API_URL}company/` + companyId + `/incidents/project?includes=incidentType,user,userGroup,userGroup.parent`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  getManagerAssignedIncidentsExport(companyId): Observable<any> {
    const url = `${environment.API_URL}company/` + companyId + `/incidents/project?includes=incidentType,user,userGroup,userGroup.parent,assignedIncidents&appendInjury=true`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  getUserIncidents(): Observable<any> {
    const url = `${environment.API_URL}user/me?includes=userGroup,userGroup.users,userGroup.users.incidents`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  getUserCreatedIncidents(): Observable<any> {
    const url = `${environment.API_URL}user/me?includes=incidents`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  getUser(): Observable<any> {
    const url = `${environment.API_URL}user/me?includes=userGroup`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  updateUser(userId: string, firstName: string, lastName: string, email: string, phone: string, groupId?: string, supervisor?: string): Observable<any> {
    const url = `${environment.API_URL}user/` + userId;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };

    const body = {
      firstName: firstName,
      lastName: lastName,
      email: email,
      phone: phone,
      supervisor: supervisor,
    };

    if (groupId) {
      body['groupId'] = groupId;
    }
    return this.httpClient.patch<any>(url, this.clean(body), httpOptions);
  }

  clean(obj: any) {
    for (const propName in obj) {
      if (obj[propName] === '' || !obj[propName]) {
        delete obj[propName];
      }
    }
    return obj;
  }

  updateCustomFields(body) {
    const url = `${environment.API_URL}profileData`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()}),
      'content-type': 'application/json',
    };
    return this.httpClient.post<any>(url, body, httpOptions);
  }

  getProfileData() {
    const url = `${environment.API_URL}user/me?includes=company,company.profileData,profileData,userGroup`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  getUserGroups(companyId: string): Observable<any> {
    const url = `${environment.API_URL}usergroups/company/` + companyId + '?includes=children';
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  getUserDisplay(user: { firstName: string; lastName: string; email: any; phone: any; code: any; }) {
    if (user.firstName && user.lastName) {
      return (user.firstName + ' ' + user.lastName);
    } else if (user.email) {
      return user.email;
    } else if (user.phone) {
      return user.phone;
    }

    return user.code;
  }

  //for get user group data by company id
  getUserGroupsID(companyId: string): Observable<any> {
    const url = `${environment.API_URL}usergroups/company/` + companyId + '?includes=parent';
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  //for get user data by user id
  getUserGroupDetail(userId: string): Observable<any> {
    const url = `${environment.API_URL}mycompany/` + userId + '?includes=userGroup';
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  //for add user data
  addUser(body: string): Observable<any> {
    const url = `${environment.API_URL}user`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.post<any>(url, body, httpOptions);
  }

  //for update user data by user id
  updateManagerUser(body: string, userId: string): Observable<any> {
    const url = `${environment.API_URL}user/` + userId;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.patch<any>(url, body, httpOptions);
  }

  //for get user list data
  getUserList(): Observable<any> {
    const url = `${environment.API_URL}company/me?includes=companyUsers,userGroups,userGroupsParent`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  //for get user list data
  getUserPaginateList(page: number, limit: number, term: any): Observable<any> {
    let url = `${environment.API_URL}company/users?includes=userGroup,userGroup.childGroups,userGroup.type&page=${page}&limit=${limit}`;
    if (term != '') {
      url = `${environment.API_URL}company/users?includes=userGroup,userGroup.childGroups,userGroup.type&page=${page}&limit=${limit}&term=${term}`;
    }
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  //for add business units and branch data
  addBusinessUnitsBranch(body: string): Observable<any> {
    const url = `${environment.API_URL}usergroup`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.post<any>(url, body, httpOptions);
  }

  getUserData() {
    const url = `${environment.API_URL}user/me`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  //for reset password of the user
  resetUserPassword(body: string, userId: string): Observable<any> {
    const url = `${environment.API_URL}user/` + userId + '/password';
    // https://de13api.logincident.com/user/mEMZAXQ9/password
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.patch<any>(url, body, httpOptions);
  }

  resetPasswordDashboard(body: any, userId: string): Observable<any> {
    const url = `${environment.API_URL}user/` + userId;
    // https://de13api.logincident.com/user/mEMZAXQ9/password
    // https://de13api.logincident.com/user/VQAr87MB
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.patch<any>(url, body, httpOptions);
  }

  //for add business units and branch data


}
