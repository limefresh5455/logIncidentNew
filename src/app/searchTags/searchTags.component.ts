import {Component, OnInit} from '@angular/core';
import {IncidentsService} from '../_services/incidents.service';
import {CompanyService} from '../_services/company.service';
import {ActivatedRoute, Router} from '@angular/router';
import {UsersService} from '../_services/users.service';
import {CustomerService} from '../_services/customer.service';
import {environment} from '../../environments/environment';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-searchTags',
  templateUrl: './searchTags.component.html',
  styleUrls: ['./searchTags.component.css']
})
export class SearchTagsComponent implements OnInit {
  incidentsLoaded = false;
  companyColor = null;
  accentColor = null;
  incidents;
  currentUser: any;
  hasBlueprintNumbers = false;
  queryParams = {'ids': []};
  searchTerm = null;
  availableTags = [] as any;

  constructor(private incidentService: IncidentsService,
              private companyService: CompanyService,
              private route: ActivatedRoute,
              private usersService: UsersService,
              private customerService: CustomerService,
              private router: Router,
              private _snackBar: MatSnackBar,) {
    this.currentUser = this.customerService.getUser();
    this.companyColor = this.currentUser.company.primary;
    this.accentColor = this.currentUser.company.accent;
    if (!this.currentUser.email) {
      this.router.navigateByUrl('/profile');
    }
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 4000,
    });
  }

  ngOnInit() {
    this.currentUser = this.customerService.getUser();
    if(this.currentUser.admin === true )
    {
     this.getSearchByTags()
    }else{
      this.router.navigateByUrl('/404');
    }
  }
  //get serach data by tags
  getSearchByTags(){
    this.companyService.getCompanyTags().subscribe(r => {
      this.availableTags = r.data.data;
    },
    e => {
      this.openSnackBar(e, 'Close');
    }
  );
  }

  search(tagId) {
    this.searchTerm = tagId;
    this.incidents = [];
    this.companyService.searchIncidentsByTag(tagId).subscribe(
      r => {
        this.incidents = r.data;
        this.incidents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.collectDescriptions();
        this.collectQueryParams();
        if (this.currentUser.company.name === 'logconcern') {
          this.collectBlueprintNumbers();
        }
        // this.incidentsLoaded = true;
        if (r.data.length <= 0) {
          this.incidentsLoaded = true;
          return;
        }
      }, e => {
        // window.location.reload();
        this.router.navigateByUrl('/login');
      }
    );
  }

  collectDescriptions() {
    for (const incident of this.incidents) {
      let description = '';

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

      if (description) {
        description = description.split(' ').slice(0, 20).join(' ') + '...';
        incident['shortDescription'] = description;
      }
    }
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
    for (const section of incident.data.sections) {
      for (const field of section.fields) {
        if ('fieldType' in field && field.fieldType === 'date') {
          date = new Date(field.fieldValue);
        } else if ('fieldType' in field && field.fieldType === 'time') {
          time = new Date(field.fieldValue);
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
