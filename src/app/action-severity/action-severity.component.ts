import {Component, OnInit, ElementRef} from '@angular/core';
import {CompanyService} from '../_services/company.service';
import {CustomerService} from '../_services/customer.service';
import {IncidentsService} from '../_services/incidents.service';
import {Router} from '@angular/router';
import {AngularCsv} from 'angular7-csv';

@Component({
  selector: 'app-action-severity',
  templateUrl: './action-severity.component.html',
  styleUrls: ['./action-severity.component.css']
})
export class ActionSeverityComponent implements OnInit {
  companyColor;
  currentUser;
  incidentTotals;

  incidentTypesData;
  incidentsType: any = [];
  incidents: any = [];

  constructor(private companyService: CompanyService,
              private customerService: CustomerService,
              private router: Router,
              private incidentService: IncidentsService
  ) {
    this.currentUser = this.customerService.getUser();
    this.companyColor = this.currentUser.company.primary;
    if (!this.currentUser.email) {
      this.router.navigateByUrl('/profile');
    }
  }

  ngOnInit() {
     this.currentUser = this.customerService.getUser();
        if(this.currentUser.company.name == 'Finning')
        {
          this.loadActionSeverity()
        }else
        {
          this.router.navigateByUrl('/404');
        }
  }

  //get data of action severity
  loadActionSeverity(){
    this.getIncidentTypes();
    this.companyService.getIncidents().subscribe(r => {
      this.incidents = r.data;
      this.incidents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, e => {
      this.router.navigateByUrl('/login');
    });

  }
  //for get all incidents type from api
  getIncidentTypes() {
    this.incidentService.getIncidentTypes().subscribe(response => {
      this.incidentTypesData = response.data;
      for (const incidentType of this.incidentTypesData) {
        if (incidentType.name != 'Guidance' && incidentType.name != 'Safe on Site' && incidentType.name != 'Audits' && incidentType.name != 'Managers Tour') {
          this.incidentsType.push(incidentType.name);
        }
      }
      this.getReport();
    });
  }

  //for get all incidents type report from api
  getReport() {
    this.companyService.getDashboardReport(this.customerService.getUser().company.id).subscribe(r => {
      this.incidentTotals=r.data;
      for (const incidentType of Object.keys(this.incidentTotals)) {
        if(incidentType == "Hazard / Near Miss"){
          this.incidentTotals[incidentType].high.color = "#800000";
          this.incidentTotals[incidentType].low.color = "#800000";
          this.incidentTotals[incidentType].medium.color = "#800000";
          this.incidentTotals[incidentType].total.color = "#800000";
        }
      }

      const filterData = {};
      for (let j = 0; j < this.incidentsType.length; j++) {
        for (const incidentType of Object.keys(this.incidentTotals)) {
          if (incidentType == this.incidentsType[j]) {
            filterData[incidentType] = this.incidentTotals[incidentType];
          }
        }
      }
      this.incidentTotals = filterData;
    });
  }

  //for get open and closed incident counts
  getOpenClosedCount(status, type){
    const filterData = [];
    for (const incident of this.incidents) {
      if(incident.type.name == type){
        if (incident.status.name == status) {
          filterData.push(incident);
        }
      }
    }
    return status+' - '+filterData.length;
  }

}
