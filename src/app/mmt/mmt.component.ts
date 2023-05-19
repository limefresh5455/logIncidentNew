import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {CustomerService} from '../_services/customer.service';
import {CompanyService} from '../_services/company.service';
import {ActivatedRoute, Router, NavigationEnd} from '@angular/router';
import {User} from '../_models/user';
import {IncidentsService} from '../_services/incidents.service';
import {MmtService} from '../_services/mmt.service';
import {UsersService} from '../_services/users.service';

@Component({
  selector: 'app-mmt',
  templateUrl: './mmt.component.html',
  styleUrls: ['./mmt.component.css']
})
export class MmtComponent implements OnInit {

  mmtView = true;
  showSection:number = 1;
  currentUser: User;
  sosColor = null;
  accentColor = null;
  tabSections: any;
  tabTitles: any;
  user: any;

  mmtValue: boolean = false;
  loadingIncidents: boolean = false;
  auditValue: boolean = false;
  auditActionValue: boolean = false;
  incidents;
  auditIncidents: any = [];
  incidentId;
  mTour: any = [];
  audits: any = [];
  incidentTypes;

  constructor(
    private companyService: CompanyService,
    private customerService: CustomerService,
    private router: Router,
    private route: ActivatedRoute,
    private incidentService: IncidentsService,
    private mmtService: MmtService,
    private usersService: UsersService
  ) {
    const currentUser = this.customerService.getUser();
    this.sosColor = currentUser.company.primary;
    this.accentColor = currentUser.company.accent;
  }

  ngOnInit() {
    this.loadingIncidents = true;
    this.getUserData()
  }

  getUserData(){
    this.usersService.getUserData().subscribe(
      r => {
        this.user = r.data;
        if(this.user.isAuditor === true) {
          this.loadMmtData();
        } else {
          this.router.navigateByUrl('/404');
        }
      }, error => {
        console.log(error);
      });
  }

  async loadMmtData() {
    //for get router url on load and onclick any route
    this.tabSections = this.router.url;
    if(this.tabSections == "/mmt/audits"){
      this.showSection = 1;
      this.tabTitles = "Audits";
    }else if(this.tabSections == "/mmt/monthly-tours"){
      this.showSection = 2;
      this.tabTitles = "Monthly Tours";
    }else if(this.tabSections == "/mmt/actions"){
      this.showSection = 3;
      this.tabTitles = "Audit Actions";
    }else if(this.tabSections == "/mmt/question-pool-mmt"){
      this.showSection = 4;
      this.tabTitles = "Question Pool MMT";
    }else if(this.tabSections == "/mmt/question-pool-ae"){
      this.showSection = 5;
      this.tabTitles = "Question Pool Audits";
    }else if(this.tabSections == "/mmt/future-mmt"){
      this.showSection = 6;
      this.tabTitles = "Future MMTs";
    }else if(this.tabSections == "/mmt/future-aes"){
      this.showSection = 7;
      this.tabTitles = "Future Audits";
    }
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.tabSections = event.url;
        if(this.tabSections == "/mmt/audits"){
          this.showSection = 1;
          this.tabTitles = "Audits";
        }else if(this.tabSections == "/mmt/monthly-tours"){
          this.showSection = 2;
          this.tabTitles = "Monthly Tours";
        }else if(this.tabSections == "/mmt/actions"){
          this.showSection = 3;
          this.tabTitles = "Audit Actions";
        }else if(this.tabSections == "/mmt/question-pool-mmt"){
          this.showSection = 4;
          this.tabTitles = "Question Pool MMT";
        }else if(this.tabSections == "/mmt/question-pool-ae"){
          this.showSection = 5;
          this.tabTitles = "Question Pool Audits";
        }else if(this.tabSections == "/mmt/future-mmt"){
          this.showSection = 6;
          this.tabTitles = "Future MMTs";
        }else if(this.tabSections == "/mmt/future-aes"){
          this.showSection = 7;
          this.tabTitles = "Future Audits";
        }
      }
    });

    const r = await this.incidentService.getIncidentTypes().toPromise();
    if(r.data){
      this.incidentTypes = r;
      for(var i = 0; i <= r.data.length; i++){
        if(r.data[i]){
          this.incidentId = r.data[i].id;
          if(r.data[i].name == "Managers Tour"){
            this.mmtValue = true;
            await this.mmtService.getMonthlyTours(this.incidentId).subscribe(resp => {
              this.mTour = resp.data;
            });
          }else if(r.data[i].name == "Audits"){
            this.auditValue = true;
            await this.mmtService.getMonthlyTours(this.incidentId).subscribe(resp => {
              this.audits = resp.data;
            });
          }else if(r.data[i].name == "Audit Action"){
            this.auditActionValue = true;
          }
        }
      }
      this.loadingIncidents = false;

    } else {
      this.loadingIncidents = false;
    }

     const incidents = await this.companyService.getIncidents().toPromise();
    //  => {
    this.incidents = incidents.data;
    for (const incident of this.incidents) {
      if (incident.type.name === "Audit Action") {
        this.auditIncidents.push(incident)
      }
    }
    // });
  }

  //for tab section on click
  tabSection(content, count, urls) {
    if(content == "audits") {
      this.showSection = count;
      this.tabSections = urls;
      this.tabTitles = "Audits";
    }else if(content == "monthlyTour") {
      this.showSection = count;
      this.tabSections = urls;
      this.tabTitles = "Monthly Tours";
    }else if(content == "actions"){
      this.showSection = count;
      this.tabSections = urls;
      this.tabTitles = "Audit Actions";
    }else if(content == "questionPoolMmt"){
      this.showSection = count;
      this.tabSections = urls;
      this.tabTitles = "Question Pool MMT";
    }else if(content == "questionPoolAE"){
      this.showSection = count;
      this.tabSections = urls;
      this.tabTitles = "Question Pool Audits";
    }else if(content == "futureMmt"){
      this.showSection = count;
      this.tabSections = urls;
      this.tabTitles = "Future MMTs";
    }else if(content == "futureAudits"){
      this.showSection = count;
      this.tabSections = urls;
      this.tabTitles = "Future Audits";
    }
  }

}
