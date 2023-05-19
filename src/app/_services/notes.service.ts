import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {CustomerService} from './customer.service';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotesService {

  constructor(private httpClient: HttpClient, private customerService: CustomerService) {
  }

  createNote(companyId: string, incidentId: string, noteType: string, note: string) {
    const url = `${environment.API_URL}note`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };

    const body = {
      companyId: companyId,
      incidentId: incidentId,
      typeId: noteType,
      note: note
    };

    return this.httpClient.post<any>(url, body, httpOptions);
  }
}
