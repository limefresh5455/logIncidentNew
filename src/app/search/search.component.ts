import { Component, OnInit } from '@angular/core';
import { IncidentsService } from '../_services/incidents.service';
import { CompanyService } from '../_services/company.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UsersService } from '../_services/users.service';
import { CustomerService } from '../_services/customer.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit {
  companyColor = null;
  accentColor = null;
  incidents;
  currentUser: any;
  hasBlueprintNumbers = false;
  queryParams = { 'ids': [] };
  searchTerm = null;
  loading = false;
  company: any;

  incidentTypesData;
  incidentsType: any = [];

  constructor(private incidentService: IncidentsService,
    private companyService: CompanyService,
    private route: ActivatedRoute,
    private usersService: UsersService,
    private customerService: CustomerService,
    private router: Router) {
    this.currentUser = this.customerService.getUser();
    this.companyColor = this.currentUser.company.primary;
    this.accentColor = this.currentUser.company.accent;
    if (!this.currentUser.email) {
      this.router.navigateByUrl('/profile');
    }
  }

  ngOnInit() {
    this.currentUser = this.customerService.getUser();
    if (this.currentUser.admin === true) {
      this.loadSearchbar()
    } else {
      this.router.navigateByUrl('/404');
    }
  }

  //load searchbar
  loadSearchbar() {
    this.companyService.getUserCompany().subscribe(
      r => {
        this.company = r.data;
      }, error => {
        console.log(error);
      });
    const root = document.documentElement;
    root.style.setProperty('--company-primary', this.currentUser.company.primary);
    this.getIncidentTypes();
  }

  //for hexa convert into rgb color code for close incidents
  hexToRGB(h) {
    var r: any = 0;
    var g: any = 0;
    var b: any = 0;
    var p: any = 60;

    // 3 digits
    if (h.length == 4) {
      r = "0x" + h[1] + h[1];
      g = "0x" + h[2] + h[2];
      b = "0x" + h[3] + h[3];

      // 6 digits
    } else if (h.length == 7) {
      r = "0x" + h[1] + h[2];
      g = "0x" + h[3] + h[4];
      b = "0x" + h[5] + h[6];
    }
    return "rgb(" + +r + " " + +g + " " + +b + "/" + +p + "%)";
  }

  getIncidentTypes() {
    this.incidentService.getIncidentTypes().subscribe(response => {
      this.incidentTypesData = response.data;
      for (const incidentType of this.incidentTypesData) {
        if (incidentType.name != 'Guidance' && incidentType.name != 'Safe on Site' && incidentType.name != 'Audits' && incidentType.name != 'Managers Tour') {
          this.incidentsType.push(incidentType.name);
        }
      }
    });
  }

  search(text) {
    this.loading = true;
    this.searchTerm = text.value;
    this.incidents = [];
    if (text.value == "") {
      alert('Please enter any keyword');
      this.loading = false;
    } else {
      this.companyService.searchIncidents(text.value, this.currentUser.company.id).subscribe(
        r => {
          this.incidents = r.data;
          this.incidents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          for (let i = 0; i < this.incidents.length; i++) {
            if (this.incidents[i].type.name == "Hazard / Near Miss") {
              this.incidents[i].type.color = "#800000";
            }
          }
          const filterData = [];
          for (let j = 0; j < this.incidentsType.length; j++) {
            for (const incident of this.incidents) {
              if (incident.type.name == this.incidentsType[j]) {
                filterData.push(incident);
              }
            }
          }
          this.incidents = filterData;
          this.collectDescriptions();
          this.collectQueryParams();
          if (this.currentUser.company.name === 'logconcern') {
            this.collectBlueprintNumbers();
          }
          if (r.data.length <= 0) {
            this.loading = false;
            return;
          }
        }, e => {
          this.loading = false;
          this.router.navigateByUrl('/login');
        }
      );
    }
  }

  collectDescriptions() {
    for (const incident of this.incidents) {
      let description = '';

      if (incident.sosdata) {

      } else if (incident.data) {
        for (const section of incident.data.sections) {
          for (const field of section.fields) {
            if (incident.type.name == 'Dangerous Occurrence' && field.fieldTitle === 'Details of What Happened') {
              description = field.fieldValue;
            } else if (incident.type.name == 'Environmental Incident' && field.fieldTitle === 'Environmental Incident') {
              description = field.fieldValue;
            } else if (incident.type.name == 'Enforcement Agency Visit' && field.fieldTitle === 'Inspectors Comments') {
              description = field.fieldValue;
            } else if (incident.type.name == 'Incident' && field.fieldTitle === 'Description of Incident') {
              description = field.fieldValue;
            } else if (incident.type.name == 'Injuries' && field.fieldTitle === 'Description of Accident') {
              description = field.fieldValue;
            } else if (incident.type.name == 'Non Conformance' && field.fieldTitle === 'Details of Non Conformance') {
              description = field.fieldValue;
            } else if (incident.type.name == 'Positive Observation' && field.fieldTitle === 'Description of Observation') {
              description = field.fieldValue;
            } else if (incident.type.name == 'COVID-19 Notification' && field.fieldTitle === 'Comments/Action') {
              description = field.fieldValue;
            } else if (field.fieldTitle.includes('Description and')) {
              description = field.fieldValue;
            } else if (field.fieldTitle.includes('Description of')) {
              description = field.fieldValue;
            } else {
              if (field.fieldTitle === 'Description') {
                if (field.fieldValue && description == '') {
                  description = field.fieldValue;
                }
              }
            }
          }
        }
      }

      if (description) {
        description = description.split(' ').slice(0, 20).join(' ') + '...';
        incident['shortDescription'] = description;
      }
    }
    this.loading = false;
  }

  collectBlueprintNumbers() {
    for (const incident of this.incidents) {
      let blueprintNumber = null;

      for (const section of incident.data.sections) {
        for (const field of section.fields) {
          if (field.fieldTitle === 'SAP Blueprint Project Number') {
            blueprintNumber = field.fieldValue;
          }
        }
      }
      if (blueprintNumber) {
        this.hasBlueprintNumbers = true;
        incident['SAP Blueprint Project Number'] = blueprintNumber;
      }
    }
  }

  goToIncident(id) {
    const url = '/incidents/' + id;
    const win = window.open(url, '_blank');
    win.focus();
  }

  collectQueryParams() {
    this.queryParams.ids = [];

    for (const incident of this.incidents) {
      this.queryParams.ids.push(incident.id);
    }
  }

  getWhenIncidentHappened(incident) {
    let date = null;
    let time = null;
    if (incident.sosdata) {

    } else if (incident.data) {
      for (const section of incident.data.sections) {
        for (const field of section.fields) {
          if ('fieldType' in field && field.fieldType === 'date') {
            date = new Date(field.fieldValue);
          } else if ('fieldType' in field && field.fieldType === 'time') {
            time = new Date(field.fieldValue);
          }
        }
      }
    }

    if (date && time && time != 'Invalid Date') {
      date.setHours(time.getHours());
      date.setMinutes(time.getMinutes());

      return date;
    }
    return incident.createdAt;
  }

  getProjectId(incident) {
    for (const section of incident.data.sections) {
      if (section.title === 'Select Project') {
        return section.fields[0].fieldValue;
      }
    }
  }

  exportToPDF(id: string) {
    const downloadLink = `${environment.API_URL}generate/pdf/incident/` + id;
    const pwa = window.open(downloadLink);
    if (!pwa || pwa.closed || typeof pwa.closed == 'undefined') {
      alert('Please disable your Pop-up blocker and try again.');
    }
  }
}
