import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {CustomerService} from './customer.service';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class IncidentsService {

  constructor(private httpClient: HttpClient, private customerService: CustomerService) {
  }

  getIncidentTypes(): Observable<any> {
    const companyId = this.customerService.getUser().company.id;
    const url = `${environment.API_URL}` +
      `incidentTypes/${companyId}?includes=sections,sections.children,sections.children.fields,sections.children.fields.options,sections.fields,sections.fields.fields,sections.fields.options,sections.fields.addresses`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  createIncident(incidentTypeId: string, incident: object): Observable<any> {
    const url = `${environment.API_URL}incidents?typeId=${incidentTypeId}`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()}),
      'content-type': 'application/json',
    };
    return this.httpClient.post<any>(url, incident, httpOptions);
  }

  editIncident(incidentId: string, body: object): Observable<any> {
    const url = `${environment.API_URL}incidents/${incidentId}`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()}),
      'content-type': 'application/json',
    };
    return this.httpClient.put<any>(url, body, httpOptions);
  }

  deleteIncident(incidentId: string): Observable<any> {
    const url = `${environment.API_URL}incidents/${incidentId}`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()}),
      'content-type': 'application/json',
    };
    return this.httpClient.delete<any>(url, httpOptions);
  }

  getIncident(incidentId: string): Observable<any> {
    const url = `${environment.API_URL}incidents/${incidentId}?includes=incidentType,incidentType.sections,logs,user,userGroup,userGroup.parent`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()}),
      'content-type': 'application/json',
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  getIncidentTags(incidentId: string): Observable<any> {
    const url = `${environment.API_URL}tag/${incidentId}`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()}),
      'content-type': 'application/json',
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  deleteIncidentTag(incidentId: string, tagId: string): Observable<any> {
    const url = `${environment.API_URL}tag/` + incidentId + '/' + tagId;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()}),
      'content-type': 'application/json',
    };
    return this.httpClient.delete<any>(url, httpOptions);
  }

  addIncidentTag(incidentId: string, tagId: string): Observable<any> {
    const url = `${environment.API_URL}tag/` + incidentId + '/' + tagId;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()}),
      'content-type': 'application/json',
    };
    return this.httpClient.post<any>(url, tagId, httpOptions);
  }

  postDetails(body): Observable<any> {
    const url = `${environment.API_URL}concernDetails`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()}),
      'content-type': 'application/json',
    };
    return this.httpClient.patch<any>(url, body, httpOptions);
  }

  postDocument(file): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('document', file, file.name);
    const url = `${environment.API_URL}document`;
    const httpOptions = {
      headers: new HttpHeaders({
        'Authorization': 'Bearer ' + this.customerService.getToken(),
      })
    };
    return this.httpClient.post<any>(url, formData, httpOptions);
  }

  postInvestigationDocuments(body): Observable<any> {
    const url = `${environment.API_URL}investigationDocuments`;
    const httpOptions = {
      headers: new HttpHeaders({
        'Authorization': 'Bearer ' + this.customerService.getToken(),
      })
    };
    return this.httpClient.post<any>(url, body, httpOptions);
  }

  getSoSIncidentsById(incidentId): Observable<any> {
    const company_id = this.customerService.getUser().company.id;
    const url = `${environment.API_URL}company/` + company_id + '/incidents/' + incidentId;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()})
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

   getIncidentByMonth(startDate1 ,endDate1): Observable<any> {
    const url = `${environment.API_URL}getcompanytotals/${startDate1}/${endDate1}`;
    const httpOptions = {
      headers: new HttpHeaders({'Authorization': 'Bearer ' + this.customerService.getToken()}),
      'content-type': 'application/json',
    };
    return this.httpClient.get<any>(url, httpOptions);
  }

  getConcernSuppliers() {
    return [
      {
        email: 'Marctarry@hartwellmanufacturing.co.uk',
        name: 'Hartwell Manufacturing Ltd',
        email2: 'paul@hartwellmanufacturing.co.uk',
        primaryContact: 'Marc Tarry',
        secondaryContact: 'Paul Tomlinson',
        primaryPhone: '',
        secondaryPhone: ''
      },
      {
        email: 'gary.kilbourne@bradgate.co.uk',
        name: 'Bradgate Containers Ltd',
        email2: 'richard.austin@bradgate.com',
        primaryContact: 'Gary Kilbourne',
        secondaryContact: 'Richard Austin',
        primaryPhone: '07823773626',
        secondaryPhone: '07766441709'
      },
      {
        email: 'Ali.Harding-Mabbs@agriemach.com',
        name: 'Agriemach Ltd',
        email2: 'david@agriemach.com',
        primaryContact: 'Ali Harding-Mabbs',
        secondaryContact: 'David Kallmann',
        primaryPhone: '',
        secondaryPhone: ''
      },
      {
        email: 'michael@otsgroup.co.uk',
        name: 'OTS Group Limited',
        email2: 'steve@otsgroup.co.uk',
        primaryContact: 'Michael Philip',
        secondaryContact: 'Steve Gain',
        primaryPhone: '01386 842 893',
        secondaryPhone: '01386 842 882'
      },
      {
        email: 'David.hughes@metcraft.co.uk',
        name: 'Metcraft',
        email2: 'richard@generatorinstallations.com',
        primaryContact: 'David Hughes',
        secondaryContact: 'Richard China',
        primaryPhone: '03300 577577',
        secondaryPhone: '03300 577577'
      },
      {
        email: 'rpheasant@finning.com',
        name: 'LogConcern Test Supplier 1',
        email2: 'rpheasant+1@finning.com',
        primaryContact: 'Bob Pheasant',
        secondaryContact: 'Bobby Pheasant',
        primaryPhone: '0800001066',
        secondaryPhone: '0800001067'
      },
      {
        email: 'fraser.gifford@murraycable.co.uk',
        name: 'Murray Cable',
        email2: 'alan.broughton@murraycable.co.uk',
        primaryContact: 'Fraser Gifford',
        secondaryContact: 'Alan Broughton',
        primaryPhone: '07741248607',
        secondaryPhone: '07903698053'
      },
      {
        email: 'jn@logincident.com',
        name: 'LogIncident Testing 1',
        email2: 'gwd@logincident.com',
        primaryContact: 'Jordan Nugent',
        secondaryContact: 'Gary Davidson',
        primaryPhone: '0800001066',
        secondaryPhone: '0800001067'
      },
      {
        email: 'logresponse@nebulalabs.co.uk',
        name: 'LogIncident Testing 2',
        email2: 'logresponse2@nebulalabs.co.uk',
        primaryContact: 'Dylan McKee',
        secondaryContact: 'David Campbell',
        primaryPhone: '0800001066',
        secondaryPhone: '0800001067'
      }, {
        email: 'jpc@millergroundbreaking.com',
        name: 'Miller',
        email2: '',
        primaryContact: 'John-Paul Calvert',
        secondaryContact: '',
        primaryPhone: '07730983248',
        secondaryPhone: ''
      }, {

        email: 'nicola.troy@stricklandmfguk.com',
        name: 'Strickland',
        email2: '',
        primaryContact: 'Nicola Troy',
        secondaryContact: '',
        primaryPhone: '07917081707',
        secondaryPhone: ''
      }, {

        email: 'jennifer.dollan@geith.com',
        name: 'Geith',
        email2: '',
        primaryContact: 'Jennifer Dollan',
        secondaryContact: '',
        primaryPhone: '07966001128',
        secondaryPhone: ''
      }, {

        email: 'David.mehaffey@hillattach.com',
        name: 'Hill',
        email2: '',
        primaryContact: 'David Mehaffey',
        secondaryContact: '',
        primaryPhone: '02830252555',
        secondaryPhone: ''
      }, {
        email: 'JasonPeriam@ulrich.co.uk',
        name: 'Ulrich',
        email2: '',
        primaryContact: 'Jason Periam',
        secondaryContact: '',
        primaryPhone: '07729828701',
        secondaryPhone: ''
      }, {

        email: 'mark.scutt@fireward.co.uk',
        name: 'Fireward',
        email2: '',
        primaryContact: 'Mark Scutt',
        secondaryContact: '',
        primaryPhone: '07572364087',
        secondaryPhone: ''
      }, {

        email: 'Gemma.Johnson@ardent-uk.com',
        name: 'Ardent',
        email2: '',
        primaryContact: 'Gemma Johnson',
        secondaryContact: '',
        primaryPhone: '01423326740',
        secondaryPhone: ''
      }, {

        email: 'k.ellis@groeneveld-beka.com',
        name: 'Groeneveld',
        email2: '',
        primaryContact: 'Kaylee Ellis',
        secondaryContact: '',
        primaryPhone: '07768836624',
        secondaryPhone: ''
      }, {
        email: 'caroline@hls.ie ',
        name: 'HLS',
        email2: '',
        primaryContact: 'Caroline Duffy',
        secondaryContact: '',
        primaryPhone: '018353208',
        secondaryPhone: ''
      }, {

        email: 'alex.hollands@halomec.com',
        name: 'Halomec',
        email2: '',
        primaryContact: 'Alex Hollands',
        secondaryContact: '',
        primaryPhone: '07772109310',
        secondaryPhone: ''
      }, {

        email: 'pspill@spillard.com',
        name: 'Spillard',
        email2: '',
        primaryContact: 'Peter Spillard',
        secondaryContact: '',
        primaryPhone: '07768632093',
        secondaryPhone: ''
      }, {
        email: 'paula@synergy-automotive.com',
        name: 'Synergy',
        email2: '',
        primaryContact: 'Paula',
        secondaryContact: '',
        primaryPhone: '07887668479',
        secondaryPhone: ''
      }, {

        email: 'rdavies@cabcare.com',
        name: 'Cabcare',
        email2: '',
        primaryContact: 'Richard Davies',
        secondaryContact: '',
        primaryPhone: '07721528678',
        secondaryPhone: ''
      }, {

        email: 'AEccles@vision-techniques.com',
        name: 'Vision Tech',
        email2: '',
        primaryContact: 'Andrew Eccles',
        secondaryContact: '',
        primaryPhone: '01254679717',
        secondaryPhone: ''
      }, {

        email: 'mark@mutley.co.uk',
        name: 'Mutley',
        email2: '',
        primaryContact: 'Mark Cheeseman',
        secondaryContact: '',
        primaryPhone: '01304840621',
        secondaryPhone: ''
      }, {

        email: 'terence.tuch@gkdtec.com',
        name: 'GKD',
        email2: '',
        primaryContact: 'Terence Tuch',
        secondaryContact: '',
        primaryPhone: '07725447674',
        secondaryPhone: ''
      }, {

        email: 'sales@kwmechanical.co.uk',
        name: 'K & W (Xwatch)',
        email2: '',
        primaryContact: 'Simon Wheat',
        secondaryContact: '',
        primaryPhone: '07966510561',
        secondaryPhone: ''
      }, {

        email: 'dadams@tcsiteservices.co.uk',
        name: 'T&C Site Services',
        email2: '',
        primaryContact: 'Derek Adams',
        secondaryContact: '',
        primaryPhone: '07967653423',
        secondaryPhone: ''
      }, {

        email: 'Darren_Flint@kaltire.com',
        name: 'Kaltire',
        email2: '',
        primaryContact: 'Darren Flint',
        secondaryContact: '',
        primaryPhone: '07768548203',
        secondaryPhone: ''
      }, {

        email: 'sales@carrydufftyres.com',
        name: ' CarryDuff Tyre Centre',
        email2: '',
        primaryContact: '',
        secondaryContact: '',
        primaryPhone: '',
        secondaryPhone: ''
      }, {
        email: 'claire@lyonstyre.com',
        name: 'Lyons Tyre Services',
        email2: '',
        primaryContact: 'Claire',
        secondaryContact: '',
        primaryPhone: '050421233',
        secondaryPhone: ''
      }, {

        email: 'Mark.BUTCHER@bridgestone.eu',
        name: 'Bridgestone',
        email2: '',
        primaryContact: 'Mark BUTCHER ',
        secondaryContact: '',
        primaryPhone: '07989359057',
        secondaryPhone: ''
      }, {

        email: 'jeremy_samuel@goodyear.com',
        name: 'Goodyear',
        email2: '',
        primaryContact: 'Jez Samuel',
        secondaryContact: '',
        primaryPhone: '',
        secondaryPhone: ''
      }, {

        email: 'joe.davies@michelin.com',
        name: 'Michelin',
        email2: '',
        primaryContact: 'Joe Davies',
        secondaryContact: '',
        primaryPhone: '07968317993',
        secondaryPhone: ''
      }, {

        email: 'rubyc@rhc.co.uk',
        name: 'RH Claydon',
        email2: '',
        primaryContact: 'Ruby Claydon',
        secondaryContact: '',
        primaryPhone: '01284778509',
        secondaryPhone: ''
      }, {

        email: 'Carlo.Bellocchi@trelleborg.com',
        name: 'Trelleborg',
        email2: '',
        primaryContact: 'Carlo Bellocchi',
        secondaryContact: '',
        primaryPhone: '01942608579',
        secondaryPhone: ''
      }, {

        email: 'mark@rdsmme.co.uk',
        name: 'RDS MME (TopCon)',
        email2: '',
        primaryContact: 'Mark Evans',
        secondaryContact: '',
        primaryPhone: '07976844100',
        secondaryPhone: ''
      }, {

        email: 'info@mechtronicsltd.com',
        name: 'Mechtronics',
        email2: '',
        primaryContact: 'Michael Hearn',
        secondaryContact: '',
        primaryPhone: '353872512682',
        secondaryPhone: ''
      }, {

        email: 'Richard@desertengineering.co.uk',
        name: 'Desert Engineering',
        email2: '',
        primaryContact: 'Richard Wood',
        secondaryContact: '',
        primaryPhone: '01788211120',
        secondaryPhone: ''
      }, {

        email: 'jlfenton@eircom.net',
        name: 'JL Fentons',
        email2: '',
        primaryContact: 'Jonathan',
        secondaryContact: '',
        primaryPhone: '',
        secondaryPhone: ''
      }, {

        email: 'Stuart.Taylor@indespension.co.uk',
        name: 'Indespension',
        email2: '',
        primaryContact: 'Stuart Taylor',
        secondaryContact: '',
        primaryPhone: '',
        secondaryPhone: ''
      }, {

        email: 'jamie.mcnee@turnkey-instruments.com',
        name: 'Turnkey',
        email2: '',
        primaryContact: 'Jamie McNee',
        secondaryContact: '',
        primaryPhone: '07879 415975',
        secondaryPhone: ''
      }, {
        email: 'gdoherty@cat.com',
        name: 'CAT / ADE',
        email2: 'CCARSON@cat.com',
        primaryContact: 'Gary Doherty',
        secondaryContact: 'Chris Carson',
        primaryPhone: '028 90495009',
        secondaryPhone: '028 90495160'
      }
    ];
  }
}
