import {AfterContentChecked, AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {IncidentsService} from '../_services/incidents.service';
import {CompanyService} from '../_services/company.service';
import {Chart} from 'chart.js';
import {FormBuilder, FormGroup} from '@angular/forms';
import {ExportService} from '../_services/export.service';
import {ActivatedRoute, Router} from '@angular/router';
import {UsersService} from '../_services/users.service';
import {NgxDrpOptions, PresetItem, Range} from 'ngx-mat-daterange-picker';
import {CustomerService} from '../_services/customer.service';
import {User} from '../_models/user';
import {environment} from '../../environments/environment';
import {Observable} from 'rxjs/Observable';
import {startWith} from 'rxjs/operators/startWith';
import {map} from 'rxjs/operators/map';
import {FormControl} from '@angular/forms';
import {MmtService} from '../_services/mmt.service';
import * as moment from 'moment';
import {ChartComponent} from 'ng-apexcharts';

import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {MatAutocompleteSelectedEvent, MatAutocomplete} from '@angular/material/autocomplete';
import {MatChipInputEvent} from '@angular/material/chips';

@Component({
  selector: 'app-company-view',
  templateUrl: './company-view.component.html',
  styleUrls: ['./company-view.component.css']
})
export class CompanyViewComponent implements OnInit, AfterContentChecked {

  @ViewChild('dateRangePicker') dateRangePicker;
  incidentsLoaded = false;
  companyView = true; // this decides whether it's company view or my-view
  assignedView = false;
  myView = false;
  loaded = false;
  incidentTypes;
  incidentTypesData;
  incidentStatuses;
  groupTypes;
  incidents;
  incidentsFilter;
  selectedIncidents = [];
  clientNameIncident = [];
  orderedIncidentsByUser = [];
  selectedTypeIncidents = [];
  incidentTypeCount = [];
  originatorName = [];
  currentIncidentType = 'All';
  incidentsByManager = {};
  hasBlueprintNumbers = false;
  p = 1;
  IncidentCountChart;
  IncidentDetailSummaryChart;
  currentUser: User;
  result;
  company: any;
  firstIncidentDate;

  // filter
  filterForm: FormGroup;
  filterForm1: FormGroup;
  filterForm2: FormGroup;
  filterForm3: FormGroup;
  public filters = [];
  public isTab = false;
  selectedFilters = {};

  // date range
  fromDate;
  toDate;
  initUpdateRange = false; // tells if initial updateRange was already called. Initialization of date range picker calls updateRange()
  range: Range = {fromDate: new Date(), toDate: new Date()};
  options: NgxDrpOptions;
  presets: Array<PresetItem> = [];

  queryParams = {'ids': ['All']};

  companyColor = null;
  accentColor = null;
  topLevelGroupName = 'Business Unit';
  requiresIncidentDocuments = false;

  bluePrintNumberSearchForm: FormGroup;
  searchingBlueprintNumber;
  incidentByUserBarChart;
  incidentWhatBarChart;
  incidentWhyItBarChart;
  incidentCountBarChart;
  whatHappendoption;
  whyItHappendoption;
  paramValue;
  chartParam = false;
  incidentCount;
  totalincidentCount;
  statuses;

  allLength: any = [];
  SosGraphCountChart;
  sosData: any = [];


  concernedTypes = [{
    name: 'Electric Power',
    color: '#fff',
    graphs: []
  }, {
    name: 'Equipment Solutions',
    color: '#fff',
    graphs: []
  }];
  concernedGraphs = ['Business Category', 'Concern Category', 'Category'];

  filteredCreators: Observable<any[]>;
  toHighlight = '';
  creatorsList: any = [];
  creatorsField = new FormControl();
  incidentsType: any = [];
  paramsFilter: any;
  concerned = false;
  visible = true;
  selectable = true;
  removable = true;
  addOnBlur = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  selectedUsers: any = [];

  polarChartOptions = {
    chart: {
      type: 'polarArea'
    },
    legend: {
      position: 'bottom',
    }
  };

  @ViewChild('userInput') userInput: ElementRef<HTMLInputElement>;
  @ViewChild('auto') matAutocomplete: MatAutocomplete;

  dashUsers: any = [];
  usersSelected = 'All';
  selectedManagers: any = [];
  managersIncident: any = [];
  assigenIncident: any = [];
  originatorIncident : any = [];

  dashAssigned: any = [];
  assignedSelected = 'All';
  selectedAssigned: any = [];
  assignedIncident: any = [];

  dashOrginitor: any = [];
  originatorSelected = 'All';


  constructor(
    private incidentService: IncidentsService,
    private companyService: CompanyService,
    private elementRef: ElementRef,
    private fb: FormBuilder,
    private exportService: ExportService,
    private route: ActivatedRoute,
    private usersService: UsersService,
    private customerService: CustomerService,
    private router: Router,
    private cdref: ChangeDetectorRef,
    private mmtService: MmtService,
  ) {
    const currentUser = this.customerService.getUser();
    this.companyColor = currentUser.company.primary;
    this.accentColor = currentUser.company.accent;
    if (!currentUser.email) {
      this.router.navigateByUrl('/profile');
    }
    this.route.params
      .subscribe(params => {
        if (params.id) {
          this.concerned = true;
        }
      });
  }

  ngAfterContentChecked() {
    this.cdref.detectChanges();
  }

  ngOnInit() {
    this.companyService.getCompany(this.customerService.getUser().company.id).subscribe(r => {
      this.requiresIncidentDocuments = r.data.requiresIncidentDocuments;
    });

    this.currentUser = this.customerService.getUser();
    this.companyService.getUserCompany().subscribe(
      r => {
        this.company = r.data;
        if (this.concerned) {
          this.company.incidentPluralName = 'Concerns';
          this.company.incidentSingularName = 'Concern';
        }
      }, error => {
        console.error(error);
      });
    // if (this.route.snapshot.routeConfig.path.includes('company-view')) {
    //     if(this.currentUser.admin === true) {
    //       this.companyView = true;
    //       this.myView = false;
    //       this.assignedView = false;
    //     } else {
    //       this.router.navigateByUrl('/404');
    //     }
    // }
    if (this.route.snapshot.routeConfig.path.includes('my-view')) {
      this.companyView = false;
      this.myView = true;
      this.assignedView = false;
    } else if (this.route.snapshot.routeConfig.path.includes('assigned')) {
      this.companyView = false;
      this.myView = false;
      this.assignedView = true;
    }
    this.filterForm = this.fb.group({
      status: ['All']
    });
    this.filterForm1 = this.fb.group({
      user_name: ['All']
    });
    this.filterForm2 = this.fb.group({
      assign_name: ['All']
    });
    this.filterForm3 = this.fb.group({
      originator_name: ['All']
    });
    this.getIncidents();
    this.getIncidentTypes();
    if (this.companyView) {
      this.getTopLevelGroupName();
    }

    this.route.queryParams.subscribe(params => {
      if (params.type) {
        this.paramValue = params.type;
        this.chartParam = true;
        if (params.number) {
          this.searchingBlueprintNumber = params.number;
          this.bluePrintNumberSearchForm = this.fb.group({bluePrintNumberInput: params.number});
        }
        const type = 'Query';
        this.selectIncidents(params.type, type);
        if (params.countType) {
          this.addFilter('Status', params.countType);
        }
      } else {
        this.chartParam = false;
      }
      if (params.filter) {
        this.chartParam = true;
        this.paramsFilter = {
          name: params.filter,
          value: params.value,
          inputUpdated: false
        };
        this.addFilter(params.filter, params.value);
        this.selectIncidents('All');
      }
    });
    this.companyService.getCompany(this.customerService.getUser().company.id).subscribe(r => {
      if ('statuses' in r.data && r.data.statuses.length > 0) {
        this.statuses = r.data.statuses;
      } else {
      }
    });
    // console.log(this.dashOrginitor.sort((a, b) => a.firstname !== b.firstname ? a.firstname < b.firstname ? -1 : 1 : 0))
    this.dashOrginitor.sort((a, b) => a.firstName.localeCompare(b.firstName))
  }

  // for display user name on select mat-autocomplete
  displayFn(user): string {
    return user && user.name ? user.name : '';
  }

  // for get autocomplete users list
  filterCreators(name: string) {
    this.toHighlight = name;
    return this.creatorsList.filter(state =>
      state.name.toLowerCase().indexOf(name.toLowerCase()) >= 0);
  }

  // for get users list by type user name from api
  searchCompanyUsers(term) {
    if (term) {
      this.companyService.searchCompanyUsersByTerm(term).subscribe(response => {
        this.creatorsList = [];
        const users = response.data;
        users.forEach((user, index) => {
          const userData = {'name': user.firstName + ' ' + user.lastName, 'value': user.id};
          this.creatorsList.push(userData);
          this.filteredCreators = this.creatorsField.valueChanges
            .pipe(
              startWith(''),
              map(value => typeof value === 'string' ? value : value.name),
              map(name => name ? this.filterCreators(name) : this.creatorsList.slice())
            );
        });
      }, e => {
      });

    }
  }

  add(event: MatChipInputEvent): void {
    if (!this.matAutocomplete.isOpen) {
      const input = event.input;
      const value = event.value;
      // if ((value || '').trim()) {
      //   this.fruits.push(value.trim());
      // }
      if (input) {
        input.value = '';
      }
    }
  }

  remove(user: string): void {
    const index = this.selectedUsers.indexOf(user);
    if (index >= 0) {
      this.selectedUsers.splice(index, 1);
    }
    if (this.selectedUsers.length > 0) {
      this.getUsersIncidents();
    } else {
      this.getIncidents();
    }
  }

  // for get incidents list by users onselect and onchange from api
  onSelectionChanged(event): void {
    this.selectedUsers.push(event);
    this.userInput.nativeElement.value = '';
    if (this.selectedUsers.length > 0) {
      this.getUsersIncidents();
      this.p = 1;
    } else {
      this.getIncidents();
    }
  }

  getUsersIncidents() {
    this.selectedIncidents = [];
    for (const user of this.selectedUsers) {
      this.companyService.searchUsersIncidents(user.value).subscribe(resp => {
        const incidents = resp.data;
        const filterData = [];
        for (let j = 0; j < this.incidentsType.length; j++) {
          for (const incident of incidents) {
            if (incident.type.name == this.incidentsType[j]) {
              filterData.push(incident);
            }
          }
        }
        for (let i = 0; i < filterData.length; i++) {
          if (filterData[i].type.name == 'Hazard / Near Miss') {
            filterData[i].type.color = '#800000';
          }
        }
        const sortedIncidents = filterData;
        sortedIncidents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        for (const incident of sortedIncidents) {
          if (this.currentIncidentType == 'All') {
            this.selectedIncidents.push(incident);
          } else if (this.currentIncidentType == incident.type.name) {
            this.selectedIncidents.push(incident);
          }
        }
        this.countIncidentsByDepartment(filterData);
        this.countIncidents(filterData);
        this.countIncidentsByManager(filterData);
        this.collectDescriptions(filterData);
        this.selectedTypeIncidents = this.selectedIncidents;
      });
    }
  }

  // // for display user name on select mat-autocomplete
  // displayFn(user): string {
  //   return user && user.name ? user.name : '';
  // }

  // // for get autocomplete users list
  // filterCreators(name: string) {
  //   this.toHighlight = name;
  //   return this.creatorsList.filter(state =>
  //     state.name.toLowerCase().indexOf(name.toLowerCase()) >= 0);
  // }

  // // for get users list by type user name from api
  // searchCompanyUsers(term) {
  //   if (term) {
  //     this.companyService.searchCompanyUsers(term).subscribe(response => {
  //       this.creatorsList = [];
  //       const users = response.data;
  //       users.forEach((user, index) => {
  //         const userData = {'name': user.firstName + ' ' + user.lastName, 'value': user.id};
  //         this.creatorsList.push(userData);
  //         this.filteredCreators = this.creatorsField.valueChanges
  //           .pipe(
  //             startWith(''),
  //             map(value => typeof value === 'string' ? value : value.name),
  //             map(name => name ? this.filterCreators(name) : this.creatorsList.slice())
  //           );
  //       });
  //     }, e => {
  //     });
  //   }
  // }

  // for get incidents list by users onselect and onchange from api
  // onSelectionChanged(event) {
  //   this.selectedIncidents = [];
  //   this.companyService.searchUsersIncidents(event.value).subscribe(resp => {
  //     const incidents = resp.data;
  //     const filterData = [];
  //     for (let j = 0; j < this.incidentsType.length; j++) {
  //       for (const incident of incidents) {
  //         if (incident.type.name == this.incidentsType[j]) {
  //           filterData.push(incident);
  //         }
  //       }
  //     }
  //     for (let i = 0; i < filterData.length; i++) {
  //       if (filterData[i].type.name == 'Hazard / Near Miss') {
  //         filterData[i].type.color = '#800000';
  //       }
  //     }
  //     const sortedIncidents = filterData;
  //     sortedIncidents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  //     for (const incident of sortedIncidents) {
  //       if (this.currentIncidentType == 'All') {
  //         this.selectedIncidents.push(incident);
  //       } else if (this.currentIncidentType == incident.type.name) {
  //         this.selectedIncidents.push(incident);
  //       }
  //     }
  //     this.collectDescriptions(filterData);
  //     this.selectedTypeIncidents = this.selectedIncidents;
  //   });
  // }

  // for hexa convert into rgb color code for close incidents
  hexToRGB(h) {
    let r: any = 0;
    let g: any = 0;
    let b: any = 0;
    const p: any = 60;

    // 3 digits
    if (h.length == 4) {
      r = '0x' + h[1] + h[1];
      g = '0x' + h[2] + h[2];
      b = '0x' + h[3] + h[3];

      // 6 digits
    } else if (h.length == 7) {
      r = '0x' + h[1] + h[2];
      g = '0x' + h[3] + h[4];
      b = '0x' + h[5] + h[6];
    }
    return 'rgb(' + +r + ' ' + +g + ' ' + +b + '/' + +p + '%)';
  }

  getIncidents() {
    this.incidentService.getIncidentTypes().subscribe(response => {
      this.incidentTypesData = response.data;
      const incidentsType = [];
      for (const incidentType of this.incidentTypesData) {
        if (incidentType.name != 'Guidance' && incidentType.name != 'Safe on Site' && incidentType.name != 'Audits' && incidentType.name != 'Managers Tour') {
          incidentsType.push(incidentType.name);
        }
      }
      if (this.companyView) {
        this.companyService.getIncidents().subscribe(
          r => {
            // Added lint ignore due to compiling error in checking data.length. This is not an issue in this case as data will always be an array
            // @ts-ignore
            if (r.data.length <= 0) {
              this.incidentsLoaded = true;
              return;
            }
            const filterData = [];
            this.incidents = [];
            this.incidents = r.data;
            this.incidents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            if (this.concerned) {
              for (const incident of this.incidents) {
                const i = this.concernedTypes.findIndex(x => x.name === incident.type.name);
                if (i >= 0) {
                  // here i would like to set the color and also fill out the data.
                  this.concernedTypes[i].color = incident.type.color;

                  for (const section of incident.data.sections) {
                    for (const field of section.fields) {

                      // if fieldtitle matches a requested concern graph the start the data processing
                      if (this.concernedGraphs.includes(field.fieldTitle)) {

                        // If the graph hasnt already begun begin now
                        let graph = this.concernedTypes[i].graphs.findIndex(x => x.name === field.fieldTitle);
                        if (graph < 0) {
                          this.concernedTypes[i].graphs.push({name: field.fieldTitle, labels: [], values: []});
                          // Does not exist so add to graphs array
                          graph = this.concernedTypes[i].graphs.findIndex(x => x.name === field.fieldTitle);
                        }

                        let value = field.fieldValue;
                        // Specific data processing change for Business Category graph
                        if (field.fieldValue == 'Equipment Solutions') {
                          const index = section.fields.findIndex(x => x.fieldTitle === 'Specific Category');
                          value = 'Equipment Solutions: ' + section.fields[index].fieldValue;
                        }
                        if (value) {
                          const ind = this.concernedTypes[i].graphs[graph].labels.indexOf(value);
                          if (ind >= 0) {
                            this.concernedTypes[i].graphs[graph].values[ind]++;
                          } else {
                            this.concernedTypes[i].graphs[graph].labels.push(value);
                            this.concernedTypes[i].graphs[graph].values.push(1);
                          }
                        }
                      }
                    }
                  }
                  filterData.push(incident);
                }
                if (incident.user) {
                  const username = incident.user.firstName + ' ' + incident.user.lastName;
                  this.dashUsers.push(username);
                }
              }
            } else {
              for (const incident of this.incidents) {
                // console.log(incident)
                for (let j = 0; j < incidentsType.length; j++) {
                  if (incident.type.name == incidentsType[j]) {
                    filterData.push(incident);
                  }
                }
                if (incident.user) {
                  const username = incident.user.firstName + ' ' + incident.user.lastName;
                  this.dashUsers.push(username);
                }
                if (incident.assignments[0] && incident.assignments[0].user) {
                  const username = incident.assignments[0].user.firstName + ' ' + incident.assignments[0].user.lastName;
                  this.dashAssigned.push(username);
                }
                if (incident.user) {
                  const username = incident.user.firstName + ' ' + incident.user.lastName;
                    // console.log(username)


                   // const username = this.originator[0].user.firstName+ ' ' + this.originator[0].user.lastName;
                  this.dashOrginitor.push(username);
                }


              }
            }
            this.dashUsers = this.dashUsers.filter((v, i, a) => a.indexOf(v) === i);
            this.dashUsers.sort(function (a, b) {
              if (a < b) {
                return -1;
              }
              if (a > b) {
                return 1;
              }
              return 0;
            });
            this.dashUsers.unshift('All');
            this.filterForm1.get('user_name').setValue(this.dashUsers);

            this.dashAssigned = this.dashAssigned.filter((v, i, a) => a.indexOf(v) === i);
            this.dashAssigned.sort(function (a, b) {
              if (a < b) {
                return -1;
              }
              if (a > b) {
                return 1;
              }
              return 0;
            });
            this.dashAssigned.unshift('All');
            this.filterForm2.get('assign_name').setValue(this.dashAssigned);
            this.dashOrginitor = this.dashOrginitor.filter((v, i, a) => a.indexOf(v) === i);
            this.dashOrginitor.sort(function (a, b) {
              if (a < b) {
                return -1;
              }
              if (a > b) {
                return 1;
              }
              return 0;
            });
            this.dashOrginitor.unshift('All');
            this.filterForm3.get('originator_name').setValue(this.dashOrginitor);

            this.incidents = filterData;
            this.incidentsFilter = filterData;
            this.setupDateRangeSelector();
            this.collectDescriptions(this.incidents);

            if (this.currentUser.company.name === 'logconcern') {
              this.collectBlueprintNumbers();
            } else if (this.currentUser.company.name === 'Finninguk' || this.currentUser.company.name == 'Finning') {
              this.getSOSGraphData();
            }
            this.collectClientNames(this.incidents);

            this.collectIncidentTypes();
            this.collectIncidentStatuses();
            this.countIncidentsByManager(this.incidents);
            setTimeout(() => {
              this.createIncidentByUserBarChart();
              this.countIncidentsByDepartment(this.incidents);
              this.createIncidentCountChart(this.incidents);
              this.createIncidentCountBarChart();
              this.countIncidents(this.incidents);
              this.whatAndWhyHappendoptions();
              this.createIncidentWhatBarChart(this.incidents);
              this.createIncidentWhyItBarChart(this.incidents);
            }, 2000);
            this.incidentsLoaded = true;

          }, e => {
            this.router.navigateByUrl('/login');
          }
        );
      } else if (this.assignedView) {
        if (this.currentUser.isProjectManager) {
          this.usersService.getManagerAssignedIncidents(this.currentUser.company.id).subscribe(r => {
            if (r.data <= 0) {
              this.incidentsLoaded = true;
              return;
            }
            const filterData = [];
            this.incidents = [];
            this.incidents = r.data;
            this.incidents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            for (const incident of this.incidents) {
              for (let j = 0; j < incidentsType.length; j++) {
                if (incident.type.name == incidentsType[j]) {
                  filterData.push(incident);
                }
              }
            }
            for (let i = 0; i < filterData.length; i++) {
              if (filterData[i].type.name == 'Hazard / Near Miss') {
                filterData[i].type.color = '#800000';
              }
            }
            this.incidents = filterData;
            this.incidentsFilter = filterData;
            if (!this.paramValue) {
              this.selectIncidents('All');
            } else {
              this.selectIncidents(this.paramValue, 'Query');
            }
            this.setupDateRangeSelector();
            this.collectDescriptions(this.incidents);

            if (this.currentUser.company.name === 'logconcern') {
              this.collectBlueprintNumbers();
            }
            this.incidentsLoaded = true;
          }, e => {
            this.router.navigateByUrl('/login');
          });
        } else {
          // this.usersService.getUserAssignedIncidents().subscribe(r => {
          this.companyService.getIncidents().subscribe(r => {
            // if (r.data.assignedIncidents <= 0) {
            //   this.incidentsLoaded = true;
            //   return;
            // }
            // Added lint ignore due to compiling error in checking data.length. This is not an issue in this case as data will always be an array
            // @ts-ignore
            if (r.data.length <= 0) {
              this.incidentsLoaded = true;
              return;
            }
            const filterData = [];
            this.incidents = [];
            this.incidents = r.data;
            this.incidents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            for (const incident of this.incidents) {
              if (incident.assignments.length > 0) {
                if (incident.assignments[0].user.id == this.currentUser.id) {
                  for (let j = 0; j < incidentsType.length; j++) {
                    if (incident.type.name == incidentsType[j]) {
                      filterData.push(incident);
                    }
                  }
                }
              }
            }
            for (let i = 0; i < filterData.length; i++) {
              if (filterData[i].type.name == 'Hazard / Near Miss') {
                filterData[i].type.color = '#800000';
              }
            }
            this.incidents = filterData;
            this.incidentsFilter = filterData;
            if (this.incidents.length > 0) {
              this.setupDateRangeSelector();
            }
            this.collectDescriptions(this.incidents);

            if (this.currentUser.company.name === 'logconcern') {
              this.collectBlueprintNumbers();
            }
            this.incidentsLoaded = true;
          }, e => {
            this.router.navigateByUrl('/login');
          });
        }
      } else if (this.myView) {
        // this.usersService.getUserCreatedIncidents().subscribe(r => {
        this.companyService.getIncidents().subscribe(r => {
          // if (r.data.incidents <= 0) {
          //   this.incidentsLoaded = true;
          //   return;
          // }
          // Added lint ignore due to compiling error in checking data.length. This is not an issue in this case as data will always be an array
          // @ts-ignore
          if (r.data.length <= 0) {
            this.incidentsLoaded = true;
            return;
          }
          const filterData = [];
          this.incidents = [];
          this.incidents = r.data;
          this.incidents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          for (const incident of this.incidents) {
            if (incident.user) {
              if (incident.user.id == this.currentUser.id) {
                for (let j = 0; j < incidentsType.length; j++) {
                  if (incident.type.name == incidentsType[j]) {
                    filterData.push(incident);
                  }
                }
              }
            }
          }
          for (let i = 0; i < filterData.length; i++) {
            if (filterData[i].type.name == 'Hazard / Near Miss') {
              filterData[i].type.color = '#800000';
            }
          }
          this.incidents = filterData;
          this.incidentsFilter = filterData;
          if (!this.paramValue) {
            this.selectIncidents('All');
          } else {
            this.selectIncidents(this.paramValue, 'Query');
          }
          if (this.incidents.length > 0) {
            this.setupDateRangeSelector();
          }
          this.collectDescriptions(this.incidents);

          if (this.currentUser.company.name === 'logconcern') {
            this.collectBlueprintNumbers();
          }
          this.incidentsLoaded = true;
        }, e => {
          console.error(e);
          this.router.navigateByUrl('/login');
        });
      }
    });
  }

  // get form user_name field
  get user_name(): FormControl {
    return this.filterForm1.get('user_name') as FormControl;
  }

  // get form assign_name field
  get assign_name(): FormControl {
    return this.filterForm2.get('assign_name') as FormControl;
  }

  // get form assign_name field
  get originator_name(): FormControl {
    return this.filterForm3.get('originator_name') as FormControl;
  }

  selectAllUsers(ev1) {
    if (ev1.value == 'All') {
      if (ev1._selected) {
        this.user_name.setValue(this.dashUsers);
        ev1._selected = true;
      }
      if (ev1._selected == false) {
        this.user_name.setValue([]);
        this.filterForm1.controls.user_name.patchValue([]);
      }
    } else {
      if (ev1._selected == false) {
        const reported = this.user_name.value;
        const index = reported.indexOf('All');
        if (index == 0 || index > 0) {
          reported.splice(index, 1);
        }
        this.user_name.setValue(reported);
      } else if (this.dashUsers.length - 1 == this.user_name.value.length) {
        this.user_name.setValue(this.dashUsers);
      }
    }
    this.usersSelected = this.filterForm1.controls['user_name'].value;
    if (this.usersSelected.length > 0) {
      this.getManagerIncidents(this.usersSelected);
      this.p = 1;
    }
  }

  selectAllAssigned(ev1) {
    if (ev1.value == 'All') {
      if (ev1._selected) {
        this.assign_name.setValue(this.dashAssigned);
        ev1._selected = true;
      }
      if (ev1._selected == false) {
        this.assign_name.setValue([]);
        this.filterForm2.controls.assign_name.patchValue([]);
      }
    } else {
      if (ev1._selected == false) {
        const reported = this.assign_name.value;
        const index = reported.indexOf('All');
        if (index == 0 || index > 0) {
          reported.splice(index, 1);
        }
        this.assign_name.setValue(reported);
      } else if (this.dashAssigned.length - 1 == this.assign_name.value.length) {
        this.assign_name.setValue(this.dashAssigned);
      }
    }
    this.assignedSelected = this.filterForm2.controls['assign_name'].value;
    if (this.assignedSelected.length > 0) {
      this.getAssigenIncidents(this.assignedSelected);
      this.p = 1;
    }
  }

  // selectAllOrgintior(ev1) {
  //   if (ev1.value == 'All') {
  //     if (ev1._selected) {
  //       this.originator_name.setValue(this.dashOrginitor);
  //       ev1._selected = true;
  //     }
  //     if (ev1._selected == false) {
  //       this.originator_name.setValue([]);
  //       this.filterForm3.controls.originator_name.patchValue([]);
  //     }
  //   } else {
  //     if (ev1._selected == false) {
  //       const reported = this.originator_name.value;
  //       const index = reported.indexOf('All');
  //       if (index == 0 || index > 0) {
  //         reported.splice(index, 1);
  //       }
  //       this.originator_name.setValue(reported);
  //     } else if (this.dashOrginitor.length - 1 == this.originator_name.value.length) {
  //       this.originator_name.setValue(this.dashOrginitor);
  //     }
  //   }
  //   this.originatorSelected = this.filterForm3.controls['originator_name'].value;
  //   if (this.originatorSelected.length > 0) {
  //     this.getOriginator(this.originatorSelected);
  //     this.p = 1;
  //   }
  // }

  getOriginator(data){
    this.selectedIncidents = [];
    this.companyService.getIncidents().subscribe(
      r => {
        // Added lint ignore due to compiling error in checking data.length. This is not an issue in this case as data will always be an array
        // @ts-ignore
        if (r.data.length <= 0) {
          this.incidentsLoaded = true;
          return;
        }
        const filterData = [];
        this.originatorIncident = [];
        this.originatorIncident = r.data;
        this.originatorIncident.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        for (let j = 0; j < this.incidentsType.length; j++) {
          for (const incident of this.originatorIncident) {
              // console.log(incident)
            if (incident.type.name == this.incidentsType[j]) {
              for (let j = 0; j < data.length; j++) {
                if (incident.user) {
                  // console.log(incident.user)
                  const name = incident.user.firstName + ' ' + incident.user.lastName;
                  if (name == data[j]) {
                    if (this.currentIncidentType == 'All') {
                      filterData.push(incident);
                    } else if (this.currentIncidentType == incident.type.name) {
                      filterData.push(incident);
                    }
                  }
                }
              }
            }
          }
        }
        for (let i = 0; i < filterData.length; i++) {
          if (filterData[i].type.name == 'Hazard / Near Miss') {
            filterData[i].type.color = '#800000';
          }
        }
        this.selectedIncidents = filterData;
        this.countIncidentsByDepartment(filterData);
        this.countIncidents(filterData);
        this.countIncidentsByManager(filterData);
        this.collectDescriptions(filterData);
        this.selectedTypeIncidents = this.selectedIncidents;

      }, e => {
        this.router.navigateByUrl('/login');
      }
    );
  }

  getAssigenIncidents(data) {
    this.selectedIncidents = [];
    this.companyService.getIncidents().subscribe(
      r => {
        // Added lint ignore due to compiling error in checking data.length. This is not an issue in this case as data will always be an array
        // @ts-ignore
        if (r.data.length <= 0) {
          this.incidentsLoaded = true;
          return;
        }
        const filterData = [];
        this.assigenIncident = [];
        this.assigenIncident = r.data;
        this.assigenIncident.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        for (let j = 0; j < this.incidentsType.length; j++) {
          for (const incident of this.assigenIncident) {
            if (incident.type.name == this.incidentsType[j]) {
              for (let j = 0; j < data.length; j++) {
                if (incident.assignments[0] && incident.assignments[0].user) {
                  const name = incident.assignments[0].user.firstName + ' ' + incident.assignments[0].user.lastName;
                  if (name == data[j]) {
                    if (this.currentIncidentType == 'All') {
                      filterData.push(incident);
                    } else if (this.currentIncidentType == incident.type.name) {
                      filterData.push(incident);
                    }
                  }
                }
              }
            }
          }
        }
        for (let i = 0; i < filterData.length; i++) {
          if (filterData[i].type.name == 'Hazard / Near Miss') {
            filterData[i].type.color = '#800000';
          }
        }
        this.selectedIncidents = filterData;
        this.countIncidentsByDepartment(filterData);
        this.countIncidents(filterData);
        this.countIncidentsByManager(filterData);
        this.collectDescriptions(filterData);
        this.selectedTypeIncidents = this.selectedIncidents;
      }, e => {
        this.router.navigateByUrl('/login');
      }
    );
  }

  getManagerIncidents(data) {
    this.selectedIncidents = [];
    this.companyService.getIncidents().subscribe(
      r => {
        // Added lint ignore due to compiling error in checking data.length. This is not an issue in this case as data will always be an array
        // @ts-ignore
        if (r.data.length <= 0) {
          this.incidentsLoaded = true;
          return;
        }
        const filterData = [];
        this.managersIncident = [];
        this.managersIncident = r.data;
        this.managersIncident.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        for (let j = 0; j < this.incidentsType.length; j++) {
          for (const incident of this.managersIncident) {
            if (incident.type.name == this.incidentsType[j]) {
              for (let j = 0; j < data.length; j++) {
                if (incident.user) {
                  const name = incident.user.firstName + ' ' + incident.user.lastName;
                  if (name == data[j]) {
                    if (this.currentIncidentType == 'All') {
                      filterData.push(incident);
                    } else if (this.currentIncidentType == incident.type.name) {
                      filterData.push(incident);
                    }
                  }
                }
              }
            }
          }
        }
        for (let i = 0; i < filterData.length; i++) {
          if (filterData[i].type.name == 'Hazard / Near Miss') {
            filterData[i].type.color = '#800000';
          }
        }
        this.selectedIncidents = filterData;
        this.countIncidentsByDepartment(filterData);
        this.countIncidents(filterData);
        this.countIncidentsByManager(filterData);
        this.collectDescriptions(filterData);
        this.selectedTypeIncidents = this.selectedIncidents;

      }, e => {
        this.router.navigateByUrl('/login');
      }
    );
  }

  async setupDateRangeSelector() {
    const today = new Date();
    this.firstIncidentDate = new Date();
    if (this.incidents[this.incidents.length - 1]) {
      this.firstIncidentDate = new Date(this.incidents[this.incidents.length - 1].createdAt);
    }
    this.fromDate = new Date(this.firstIncidentDate.getFullYear(), this.firstIncidentDate.getMonth(), this.firstIncidentDate.getDate(), 0, 0, 0);
    this.toDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const range = {fromDate: this.fromDate, toDate: this.toDate};
    const fromMinDate = new Date();
    const fromDates = new Date(fromMinDate.getFullYear() - 5, 0, fromMinDate.getDate(), 0, 0, 0);
    this.setupPresets();
    this.options = {
      presets: this.presets,
      format: 'mediumDate',
      range: range,
      applyLabel: 'Filter',
      calendarOverlayConfig: {
        shouldCloseOnBackdropClick: false,
      },
      fromMinMax: {fromDate: fromDates, toDate: this.toDate},
      toMinMax: {fromDate: fromDates, toDate: this.toDate}
    };
    // add current range for all incidents: latest and last incident's dates
    const fromDate = this.fromDate;
    const toDate = this.toDate;
    this.updateRange({fromDate, toDate});

  }

  incidentReport() {
    this.currentIncidentType = 'All';
    // this.selectedIncidents = this.incidents;
    // this.selectedTypeIncidents = this.incidents;
    // this.resetFilterForm();
    // this.fullFilter(true);
    if (this.currentUser.company.name === 'barratt') {
      this.resetFilterForm();
      this.collectFilters(true, 'All');
    }
  }

  getTopLevelGroupName() {
    this.companyService.getCompanyGroupTypes(this.customerService.getUser().company.id).subscribe(r => {
      if ('groupTypes' in r.data) {
        for (const groupType of r.data.groupTypes) {
          if (groupType.order === 0) {
            this.topLevelGroupName = groupType.name;
          }
        }
      }
    });
  }

  // handler function that receives the updated date range object
  updateRange(range: Range) {
    this.range = range;
    if (!this.initUpdateRange) {
      this.initUpdateRange = true;
    } else {
      this.options.range = this.range;
      this.fullFilter(true);
    }
  }

  searchByBlueprintNumber() {
    if (this.bluePrintNumberSearchForm.value.bluePrintNumberInput && this.bluePrintNumberSearchForm.value.bluePrintNumberInput.length > 0) {
      this.searchingBlueprintNumber = this.bluePrintNumberSearchForm.value.bluePrintNumberInput;
    } else {
      this.searchingBlueprintNumber = null;
    }
    this.fullFilter(true);
  }

  selectIncidents(incidentTypeName: string, type = 'All') {
    this.p = 1;
    this.creatorsField.reset('');
//     if (this.paramValue) {
//       this.companyService.getIncidents().subscribe(
//         r => {
// // Added lint ignore due to compiling error in checking data.length. This is not an issue in this case as data will always be an array
// // @ts-ignore
//           if (r.data.length <= 0) {
//             this.incidentsLoaded = true;
//             return;
//           }
//           this.incidents = [];
//           const filterData = [];
//           this.incidents = r.data;
//           for (let j = 0; j < this.incidentsType.length; j++) {
//             for (const incident of this.incidents) {
//               if (incident.type.name == this.incidentsType[j]) {
//                 filterData.push(incident);
//               }
//             }
//           }
//           this.incidents = filterData;
//           this.incidents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
//           this.currentIncidentType = incidentTypeName;
// // reset date range picker
//           this.selectedIncidents = [];
//           if (this.incidents) {
//             if (incidentTypeName === 'All') {
//               this.selectedIncidents = this.incidents;
//             } else {
//               for (const incident of this.incidents) {
//                 if (incident.type.name === incidentTypeName) {
//                   this.selectedIncidents.push(incident);
//                 }
//               }
//             }
//             for (let i = 0; i < this.selectedIncidents.length; i++) {
//               if (this.selectedIncidents[i].type.name == 'Hazard / Near Miss') {
//                 this.selectedIncidents[i].type.color = '#800000';
//               }
//             }
//           }
//           this.selectedTypeIncidents = this.selectedIncidents;
//           if (type == 'All') {
//             this.fullFilter(true);
//           }
//           this.collectQueryParams();
//           this.resetFilterForm();
//           this.fullFilter(true);
//         }, e => {
//           this.router.navigateByUrl('/login');
//         }
//       );
//     } else {
    this.currentIncidentType = incidentTypeName;
// reset date range picker
    this.selectedIncidents = [];
    if (this.incidents) {
      if (incidentTypeName === 'All') {
        this.selectedIncidents = this.incidents;
      } else {
        for (const incident of this.incidents) {
          if (incident.type.name === incidentTypeName) {
            this.selectedIncidents.push(incident);
          }
        }
      }
      for (let i = 0; i < this.selectedIncidents.length; i++) {
        if (this.selectedIncidents[i].type.name == 'Hazard / Near Miss') {
          this.selectedIncidents[i].type.color = '#800000';
        }
      }
    }
    this.selectedTypeIncidents = this.selectedIncidents;
    this.collectQueryParams();


    if (this.currentUser.company.name === 'barratt') {

      // Need to reset form and collect filters so incident type dependent items are on correct page
      // They also require the filter for division and site to remain
      // need to save what the division and site value is if they have one then set the filter value before full filter happens

      const division = this.filterForm.value.Division;
      const site = this.filterForm.value.Site;
      this.resetFilterForm();
      this.collectFilters(true, incidentTypeName);
      if (division && division != 'All' && this.filterForm.controls['Division']) {
        this.addFilter('Division', division);
        this.filterForm.patchValue({
          Division: division,
        });
      }
      if (site && site != 'All' && this.filterForm.controls['Site']) {
        this.addFilter('Site', site);
        this.filterForm.patchValue({
          Site: site
        });
      }
    }
    this.fullFilter(true);
    // }
  }

  fullFilter(dateChange?) {
    let incidentsList = this.getCurrentTypeIncidents(this.currentIncidentType);
    if (Object.keys(this.selectedFilters).length > 0) {
      incidentsList = this.filterIncidents(incidentsList);
    }
// Filter on blueprintNumber if one defined...
    if (this.hasBlueprintNumbers) {
      if (this.searchingBlueprintNumber) {
        incidentsList = this.filterIncidentsOnBlueprint(incidentsList, this.searchingBlueprintNumber);
      }
    }

// date range has changed. now filter selected incidents
    const filteredSelectedIncidents = [];
    if (dateChange) {
      if (this.selectedIncidents) {
        if (incidentsList == undefined) {
          incidentsList = this.selectedIncidents;
        }
        for (const incident of incidentsList) {
          const incidentDate = new Date(incident.createdAt);
          if (this.range.fromDate <= incidentDate && incidentDate <= this.range.toDate) {
            filteredSelectedIncidents.push(incident);
          }
        }
        this.selectedIncidents = filteredSelectedIncidents;
        for (let i = 0; i < this.selectedIncidents.length; i++) {
          if (this.selectedIncidents[i].type.name == 'Hazard / Near Miss') {
            this.selectedIncidents[i].type.color = '#800000';
          }
        }
      }
    }
    if (this.companyView) {
      if (this.IncidentCountChart) {
        const data = this.getIncidentCountChartData(this.selectedIncidents);
        this.IncidentCountChart.config.data = data;
        this.IncidentCountChart.update();
      }
      this.countIncidentsByDepartment(this.selectedIncidents);
      this.countIncidentsByManager(this.selectedIncidents);
      if (this.incidentCountBarChart) {
        this.incidentCountBarChart.destroy();
      }
      this.createIncidentCountBarChart();
      this.createIncidentByUserBarChart();
      if (this.incidentWhatBarChart) {
        this.incidentWhatBarChart.destroy();
      }
      this.createIncidentWhatBarChart(this.selectedIncidents);
      if (this.incidentWhyItBarChart) {
        this.incidentWhyItBarChart.destroy();
      }
      this.createIncidentWhyItBarChart(this.selectedIncidents);
    }
    this.countIncidents(this.selectedIncidents);
  }

  setRange(range: Range) {
    this.dateRangePicker.resetDates(range);
  }

  // helper function to create initial presets
  setupPresets() {
    const backDate = (numOfDays) => {
      const today_date = new Date();
      return new Date(today_date.setDate(today_date.getDate() - numOfDays));
    };
    const today = new Date();
    const firstIncident = new Date(this.firstIncidentDate.getFullYear(), this.firstIncidentDate.getMonth(), this.firstIncidentDate.getDate(), 0, 0, 0);
    const minus7 = backDate(7);
    const minus30 = backDate(30);
    let currMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    if (currMonthStart <= this.fromDate) {
      currMonthStart = this.fromDate;
    }
    let currMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    if (currMonthEnd >= this.toDate) {
      currMonthEnd = this.toDate;
    }
    let lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    if (lastMonthStart <= this.fromDate) {
      lastMonthStart = this.fromDate;
    }
    let lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    if (lastMonthEnd >= this.toDate) {
      lastMonthEnd = this.toDate;
    }
    this.presets = [
      {presetLabel: 'Last 7 Days', range: {fromDate: minus7, toDate: today}},
      {presetLabel: 'Last 30 Days', range: {fromDate: minus30, toDate: today}},
      {presetLabel: 'This Month', range: {fromDate: currMonthStart, toDate: currMonthEnd}},
      {presetLabel: 'Last Month', range: {fromDate: lastMonthStart, toDate: lastMonthEnd}},
      {presetLabel: 'Show All', range: {fromDate: firstIncident, toDate: today}},

    ];
  }


  getUserGroups() {
    this.companyService.getCompanyGroupTypesWithGroups(this.customerService.getUser().company.id).subscribe(resp => {
      this.groupTypes = resp.data.groupTypes;
      this.collectFilters();
    }, e => {
      this.router.navigateByUrl('/login');
    });
  }

  getIncidentTypes() {
    this.incidentService.getIncidentTypes().subscribe(response => {
      this.incidentTypesData = response.data;
      for (const incidentType of this.incidentTypesData) {
        if (incidentType.name != 'Guidance' && incidentType.name != 'Safe on Site' && incidentType.name != 'Audits' && incidentType.name != 'Managers Tour') {
          this.incidentsType.push(incidentType.name);
        }
      }
      this.getUserGroups();
    });
  }

  collectIncidentTypes() {
    this.incidentTypes = [];
    for (const incident of this.incidents) {
      let found = false;
      for (const incidentType of this.incidentTypes) {
        if (incident.type.name === incidentType.name) {
          found = true;
          break;
        }
      }
      if (!found) {
        this.incidentTypes.push(incident.type);
      }
    }
  }

  collectIncidentStatuses() {
    this.incidentStatuses = [];
    for (const incident of this.incidents) {
      if ('status' in incident && !this.incidentStatuses.includes(incident.status.name)) {
        this.incidentStatuses.push(incident.status.name);
      }
    }
  }

  getCurrentTypeIncidents(incidentTypeName: string) {
    let incidentsList = [];
    if (this.incidents) {
      if (incidentTypeName === 'All') {
        incidentsList = this.incidents;
      } else {
        for (const incident of this.incidents) {
          if (incident.type.name === incidentTypeName) {
            incidentsList.push(incident);
          }
        }
      }
    }
    return incidentsList;
  }

  getProjectId(incident) {
    if (incident.sosdata) {

    } else if (incident.data) {
      for (const section of incident.data.sections) {
        if (section.title === 'Select Project') {
          return section.fields[0].fieldValue;
        }
      }
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
    this.loaded = true;
    return incident.createdAt;
  }

  collectBlueprintNumbers() {
    for (const incident of this.incidents) {
      let blueprintNumber = null;
      if (incident.sosdata) {

      } else if (incident.data) {
        for (const section of incident.data.sections) {
          for (const field of section.fields) {
            if (field.fieldTitle === 'SAP Blueprint Project Number') {
              blueprintNumber = field.fieldValue;
            }
          }
        }
      }
      if (blueprintNumber) {
        this.hasBlueprintNumbers = true;
        incident['SAP Blueprint Project Number'] = blueprintNumber;
      }
    }

    if (this.hasBlueprintNumbers && !this.bluePrintNumberSearchForm) {
      this.bluePrintNumberSearchForm = this.fb.group({bluePrintNumberInput: ''});
    }
  }

  collectDescriptions(incidents) {
    for (const incident of incidents) {
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
  }

  countIncidentsByManager(incidents) {
    this.incidentsByManager = {};
    this.orderedIncidentsByUser = [];
    for (const incident of incidents) {
      if (incident.user) {
        if ('email' in incident.user) {
          if (!(incident.user.email in this.incidentsByManager)) {
            this.incidentsByManager[incident.user.email] = {
              count: 0,
              displayName: this.usersService.getUserDisplay(incident.user)
            };
          }
          this.incidentsByManager[incident.user.email].count += 1;
        }
      }
    }
    const objectArray = Object.entries(this.incidentsByManager);
    objectArray.forEach(([key, value]) => {
      this.orderedIncidentsByUser.push(value);
    });
    this.orderedIncidentsByUser.sort((a, b) => parseFloat(b.count) - parseFloat(a.count));
  }

  countIncidents(incidents) {
    this.incidentTypeCount = [];
    const incidentCount = {};
    const totalincidentCount = {};
    totalincidentCount['allIncidents'] = {
      count: 0,
      open: 0,
      close: 0,
      submitted: 0
    };

    for (const incident of incidents) {
      if (incident.status && incident.status.name) {
        totalincidentCount['allIncidents'].count += 1;
        if (incident.status.name == 'Open') {
          totalincidentCount['allIncidents'].open += 1;
        } else if (incident.status.name == 'Closed') {

          totalincidentCount['allIncidents'].close += 1;
        } else if (incident.status.name == 'Submitted for Response') {
          totalincidentCount['allIncidents'].submitted += 1;
        }
        if (incident.type.name in incidentCount) {
          incidentCount[incident.type.name].count += 1;

          if (incident.status.name == 'Open') {
            incidentCount[incident.type.name].open += 1;
          } else if (incident.status.name == 'Closed') {
            incidentCount[incident.type.name].close += 1;
          } else if (incident.status.name == 'Submitted for Response') {
            incidentCount[incident.type.name].submitted += 1;
          }
        } else {
          let openStatus = 0;
          let closeStatus = 0;
          let submittedStatus = 0;
          if (incident.status.name == 'Open') {
            openStatus = 1;
          } else if (incident.status.name == 'Closed') {
            closeStatus = 1;
          } else if (incident.status.name == 'Submitted for Response') {
            submittedStatus = 1;
          }
          incidentCount[incident.type.name] = {
            count: 1,
            open: openStatus,
            totalOpen: openStatus,
            close: closeStatus,
            totalClose: closeStatus,
            submitted: submittedStatus,
            totalSubmitted: submittedStatus,
            id: incident.type.id,
            color: incident.type.color
          };
        }
      }
    }
    totalincidentCount['allIncidents'].totalOpen = totalincidentCount['allIncidents'].open;
    totalincidentCount['allIncidents'].totalClose = totalincidentCount['allIncidents'].close;
    totalincidentCount['allIncidents'].totalSubmitted = totalincidentCount['allIncidents'].submitted;
    const totalOpenpercent = (totalincidentCount['allIncidents'].open) * 100 / totalincidentCount['allIncidents'].count;
    const totalClosepercent = (totalincidentCount['allIncidents'].close) * 100 / totalincidentCount['allIncidents'].count;
    const totalSubmittedpercent = (totalincidentCount['allIncidents'].submitted) * 100 / totalincidentCount['allIncidents'].count;
    totalincidentCount['allIncidents'].open = totalOpenpercent;
    totalincidentCount['allIncidents'].close = totalClosepercent;
    totalincidentCount['allIncidents'].submitted = totalSubmittedpercent;

    this.totalincidentCount = totalincidentCount;

    for (const incidentTypeName of Object.keys(incidentCount)) {
      const openPersent = (incidentCount[incidentTypeName].open) * 100 / incidentCount[incidentTypeName].count;
      const closePersent = (incidentCount[incidentTypeName].close) * 100 / incidentCount[incidentTypeName].count;
      const submittedpercent = (incidentCount[incidentTypeName].submitted) * 100 / incidentCount[incidentTypeName].count;
      this.incidentTypeCount.push({
        name: incidentTypeName,
        count: incidentCount[incidentTypeName].count,
        open: openPersent,
        totalOpen: incidentCount[incidentTypeName].open,
        close: closePersent,
        totalClose: incidentCount[incidentTypeName].close,
        submitted: submittedpercent,
        totalSubmitted: incidentCount[incidentTypeName].submitted,
        id: incidentCount[incidentTypeName].id,
        color: incidentCount[incidentTypeName].color
      });
    }

    for (let i = 0; i < this.incidentTypeCount.length; i++) {
      if (this.incidentTypeCount[i].name == 'Hazard / Near Miss') {
        this.incidentTypeCount[i].color = '#800000';
      }
    }
  }

  filterExists(filterTitle) {
    return this.filters.some(function (el) {
      return el.title === filterTitle;
    });
  }

  collectFilters(reset?: boolean, incidentTypeName?: string) {
    if (reset) {
      this.filters = [];
    }
    for (const incidentType of this.incidentTypesData) {
      if (!incidentTypeName || incidentType.name == incidentTypeName || incidentTypeName == 'All') {
        for (const section of incidentType.sections) {
          for (const field of section.fields) {
            if (field.type === 'dropdown') {
              // stops weird address field stuff
              // To stop duplicating fields check if filter with name exists if so merge the options
              if (this.filters.findIndex(x => x.title === field.title) >= 0) {
                // field already exists so add options to existing one
                const index = this.filters.findIndex(x => x.title === field.title);
                if (field.type === 'dropdown' || field.type === 'radio') {
                  for (const option of field.options) {
                    if (this.filters[index].options.findIndex(x => x === option.value) < 0) {
                      this.filters[index].options.push(option.value);
                    }
                  }
                }
              } else {
                const item = {
                  title: field.title,
                  id: field.id,
                  type: 'field',
                  options: ['All'],
                };
                if (field.type === 'dropdown' || field.type === 'radio') {
                  for (const option of field.options) {
                    item.options.push(option.value);
                  }
                } else {
                  item.options.push('Yes');
                  item.options.push('No');
                }
                this.filters.push(item);
              }
            }
          }

        }
      }
    }

    for (const groupType of this.groupTypes) {
      if (groupType.groups.length > 0) {
        const item = {
          title: groupType.name,
          id: groupType.name,
          type: 'userGroup',
          options: ['All'],
        };
        for (const groupItem of groupType.groups) {
          item.options.push(groupItem.name);
        }
        this.filters.push(item);
      }
    }
    // init filter form
    const controlsConfig = {status: 'All'};
    if (this.filters) {
      for (const filter of this.filters) {
        controlsConfig[filter.id] = filter.options[0];
      }
      this.filterForm = this.fb.group(controlsConfig);
    }

    this.filters = this.filters.filter((a, i) => this.filters.findIndex((s) => a.title === s.title) === i);
    this.filters.sort(function (x, y) {
      return x.title == 'Site' ? -1 : y.title == 'Site' ? 1 : 0;
    });
    this.filters.sort(function (x, y) {
      return x.title == 'Division' ? -1 : y.title == 'Division' ? 1 : 0;
    });
    if (this.paramsFilter && !this.paramsFilter.inputUpdated) {
      setTimeout(() => {
        const element = document.getElementById(this.paramsFilter.name.replace(/\s/g, '')) as HTMLElement;
        if (element) {
          // @ts-ignore
          element.value = this.paramsFilter.value;
          this.paramsFilter.inputUpdated = true;
        }
      }, 1000);
    }


  }


  // Status filter not in the backend hard coded as temporary fix
  filterStatus(val) {
    if (val !== 'All') {
      const filteredSelectedIncidents = [];
      this.selectedTypeIncidents.forEach(function (incident) {
        if (val === incident.status.name) {
          filteredSelectedIncidents.push(incident);
        }
      });
      this.selectedIncidents = filteredSelectedIncidents;
    } else {
      this.selectedIncidents = this.selectedTypeIncidents;
    }
    if (this.IncidentCountChart) {
      const data = this.getIncidentCountChartData(this.selectedIncidents);
      this.IncidentCountChart.config.data = data;
      this.IncidentCountChart.update();
    }
    this.countIncidentsByDepartment(this.selectedIncidents);
    this.countIncidents(this.selectedIncidents);
    this.countIncidentsByManager(this.selectedIncidents);
  }

  addFilter(name: string, value: string) {

    // Site is not filtering.
    this.p = 1;
    if (name in this.selectedFilters) {
      delete this.selectedFilters[name];
    }
    let status = value;
    if (value.substring(0, value.indexOf(':'))) {
      status = value.substring(0, value.indexOf(':'));
    }
    if (status !== 'All') {
      this.selectedFilters[name] = status;
    }
    this.fullFilter(true);

    // Barratt specific division and child site control.
    if (name == 'Division' && this.currentUser.company.name == 'barratt') {
      const site = this.filters[this.filters.findIndex(x => x.title === 'Site')];
      if (this.filters.findIndex(x => x.title === 'Site')) {
        site.options = ['All'];
        if (value != 'All') {
          // Narrow site option by parent division
          for (const groupType of this.groupTypes) {
            if (groupType.name == 'Division') {
              for (const groupItem of groupType.groups) {
                if (groupItem.name == value) {
                  for (const child of groupItem.children) {
                    site.options.push(child.name);
                  }
                }
              }
            }
          }
        } else {
          // Parent division isnt filtered so dont filter site
          for (const groupType of this.groupTypes) {
            if (groupType.name == 'Site') {
              for (const groupItem of groupType.groups) {
                site.options.push(groupItem.name);
              }
            }
          }
        }
      }
    }
  }


  resetFilterForm() {
    this.selectedFilters = {};
    this.selectedIncidents = this.selectedTypeIncidents;
    Object.keys(this.filterForm.controls).forEach(key => {
      this.filterForm.get(key).setValue('All');
    });
    this.countIncidents(this.incidents);
    this.user_name.setValue(this.dashUsers);
    // this.getManagerIncidents(this.dashUsers);
    this.assign_name.setValue(this.dashAssigned);
    this.creatorsField.reset('');
    this.selectedUsers = [];
    // this.getAssigenIncidents(this.dashAssigned);
    // this.originator_name.setValue(this.dashOrginitor);
  //  this.remove('')
  }

  resetDates() {
    const today = new Date();
    const toDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    const fromDate = new Date(this.firstIncidentDate.getFullYear(), this.firstIncidentDate.getMonth(), this.firstIncidentDate.getDate(), 0, 0, 0);
    this.range = {fromDate, toDate};
    this.setRange({fromDate, toDate});
  }

  filterIncidentsOnBlueprint(incidents = null, desiredBlueprintNumber = null) {
    const filteredIncidents = [];
    let returnIncidents = true;
    if (!incidents) {
      incidents = this.selectedTypeIncidents;
      returnIncidents = false;
    }
    for (const incident of incidents) {
      let blueprintNumber = null;
      for (const section of incident.data.sections) {
        for (const field of section.fields) {
          if (field.fieldTitle === 'SAP Blueprint Project Number') {
            blueprintNumber = field.fieldValue;
          }
        }
      }
      if (blueprintNumber) {
        if (blueprintNumber == desiredBlueprintNumber) {
          filteredIncidents.push(incident);
        }
      }
    }
    if (returnIncidents) {
      return filteredIncidents;
    } else {
      this.selectedIncidents = filteredIncidents;
    }
  }

  filterIncidents(incidents = null) {
    const filteredIncidents = [];
    let returnIncidents = true;
    if (!incidents) {
      incidents = this.selectedTypeIncidents;
      returnIncidents = false;
    }
    for (const incident of incidents) {
      let matchesAllFilters = true;
      for (const incidentFilter of Object.keys(this.selectedFilters)) {
        let matchesThisFilter = false;
        if (incidentFilter === 'Status') {
          if ('status' in incident && incident.status.name === this.selectedFilters[incidentFilter]) {
            matchesThisFilter = true;
          }
        }

        if (incidentFilter === 'incidentDocument') {
          if (this.selectedFilters[incidentFilter] === 'true') {
            if (incident.investigationDocuments.length > 0) {
              matchesThisFilter = true;
            }
          }
          if (this.selectedFilters[incidentFilter] === 'false') {
            if (incident.investigationDocuments.length <= 0) {
              matchesThisFilter = true;
            }
          }

        } else if (incidentFilter === 'clientName') {
          if (incident.user.profile.fields) {

            for (let i = 0; i < incident.user.profile.fields.length; ++i) {
              if (incident.user.profile.fields[i].fieldTitle == 'Client Name' && incident.user.profile.fields[i].fieldValue == this.selectedFilters[incidentFilter]) {
                matchesThisFilter = true;
              }
            }
          }
        } else {
          if (incident.userGroup) {
            if ('userGroup' in incident && ('parent' in incident.userGroup)) {
              if (incident.userGroup.parent.name === this.selectedFilters[incidentFilter]) {
                matchesThisFilter = true;
              }
            }
            if (this.currentUser.company.name == 'barratt' && 'userGroup' in incident) {
              // Barratt can filter by site too
              if (incident.userGroup.name === this.selectedFilters[incidentFilter]) {
                matchesThisFilter = true;
              }
            }
          }
          if (incident.user) {
            if ('user' in incident && 'userGroup' in incident.user) {
              if (incident.user.userGroup.name === this.selectedFilters[incidentFilter]) {
                matchesThisFilter = true;
              }
            }
          }
          if (incident.sosdata) {

          } else if (incident.data) {
            for (const section of incident.data.sections) {
              for (const field of section.fields) {
                if (field.fieldTitle === incidentFilter && field.fieldValue === this.selectedFilters[incidentFilter]) {
                  matchesThisFilter = true;
                }
              }
            }
          }
        }
        if (!matchesThisFilter) {
          matchesAllFilters = false;
        }
      }
      if (matchesAllFilters) {
        filteredIncidents.push(incident);
      }
    }
    if (returnIncidents) {
      return filteredIncidents;
    } else {
      this.selectedIncidents = filteredIncidents;
    }
  }

  collectQueryParams() {
    this.queryParams.ids = [];
    for (const incident of this.selectedIncidents) {
      this.queryParams.ids.push(incident.id);
    }
  }

  goToIncident(id) {
    const url = '/incidents/' + id;
    const win = window.open(url, '_blank');
    win.focus();
  }

  exportToPDF(id: string) {
    const downloadLink = `${environment.API_URL}generate/pdf/incident/` + id;
    const pwa = window.open(downloadLink);
    if (!pwa || pwa.closed || typeof pwa.closed == 'undefined') {
      alert('Please disable your Pop-up blocker and try again.');
    }
  }

  randomScalingFactor() {
    return Math.round(Math.random() * 70);
  }

  countIncidentsByDepartment(incidents) {
    const data = {};
    if (this.incidentTypes == undefined) {
      this.incidentTypes = [];
    }
    if (this.currentUser.company.name === 'Aon') {
      for (const incident of incidents) {
        if (incident.user && incident.user.profile) {
          for (const field of incident.user.profile.fields) {
            if (field.fieldTitle == 'Client Name') {
              if (!data[field.fieldValue]) {
                data[field.fieldValue] = {
                  name: field.fieldValue,
                  count: {}
                };
                for (const incidentType of this.incidentTypes) {
                  data[field.fieldValue]['count'][incidentType.name] = 0;
                }
              }
              data[field.fieldValue]['count'][incident.type.name] += 1;
            }
          }
        }
      }
    } else {
      for (const incident of incidents) {
        if (incident.userGroup) {
          let incidentUserGroup = incident.userGroup;
          if (incidentUserGroup) {
            if ('parent' in incident.userGroup) {
              incidentUserGroup = incident.userGroup.parent;
            }
            if (!(incidentUserGroup.id in data)) {
              data[incidentUserGroup.id] = {
                name: incidentUserGroup.name,
                count: {}
              };
              for (const incidentType of this.incidentTypes) {
                data[incidentUserGroup.id]['count'][incidentType.name] = 0;
              }
            }
            data[incidentUserGroup.id]['count'][incident.type.name] += 1;
          }
        } else if (incident.user) {
          let incidentUserGroup = incident.user.userGroup;
          if (incidentUserGroup) {
            if ('parent' in incident.user.userGroup) {
              incidentUserGroup = incident.user.userGroup.parent;
            }
            if (!(incidentUserGroup.id in data)) {
              data[incidentUserGroup.id] = {
                name: incidentUserGroup.name,
                count: {}
              };
              for (const incidentType of this.incidentTypes) {
                data[incidentUserGroup.id]['count'][incidentType.name] = 0;
              }
            }
            data[incidentUserGroup.id]['count'][incident.type.name] += 1;
          }
        }
      }
    }
    if (this.IncidentDetailSummaryChart) {
      const result = this.getIncidentDetailSummaryChartDatasets(data);
      const datasets = result.datasets;
      const labels = result.labels;
      this.IncidentDetailSummaryChart.config.data = {
        datasets: datasets,
        labels: labels
      };
      this.IncidentDetailSummaryChart.update();
    } else {
      if (this.companyView) {
        this.createIncidentDetailSummaryChart(data);
      }
    }
  }

  getIncidentDetailSummaryChartDatasets(userGroups) {
    // create empty datasets
    const datasets = [];
    if (this.incidentTypes == undefined) {
      this.incidentTypes = [];
    }
    for (let i = 0; i < this.incidentTypes.length; i++) {
      if (this.incidentTypes[i].name == 'Hazard / Near Miss') {
        this.incidentTypes[i].color = '#800000';
      }
    }
    for (const incidentType of this.incidentTypes) {
      datasets.push({
        label: incidentType.name,
        backgroundColor: incidentType.color,
        borderColor: incidentType.color,
        borderWidth: 1,
        fill: this.currentUser.company.name !== 'barratt',
        data: []
      });
    }
    const userGroupsArray = Object.keys(userGroups).map(key => ({type: key, value: userGroups[key]}));
    userGroupsArray.sort(function (a, b) {
      const nameA = a.value.name.toLowerCase();
      const nameB = b.value.name.toLowerCase();
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    });
    // collect labels
    const labels = [];
    for (let i = 0; i < userGroupsArray.length; i++) {
      labels.push(userGroupsArray[i].value.name);
      const incidentCount = Object.keys(userGroupsArray[i].value.count).map(key => ({
        type: key,
        value: userGroupsArray[i].value.count[key]
      }));
      // Collect Data
      for (let x = 0; x < incidentCount.length; x++) {
        for (let y = 0; y < datasets.length; y++) {
          if (incidentCount[x].type === datasets[y].label) {
            datasets[y].data.push(incidentCount[x].value);
          }
        }
      }
    }
    return {
      datasets: datasets,
      labels: labels
    };
  }

  createIncidentDetailSummaryChart(userGroups) {
    const htmlRef = this.elementRef.nativeElement.querySelector(`#incident_detail_summary_chart`);
    const result = this.getIncidentDetailSummaryChartDatasets(userGroups);
    const datasets = result.datasets;
    const labels = result.labels;
    const config = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        onClick: (event, i) => {
          if (i[0] !== undefined) {
            const value = labels[i[0]._index];
            this.redirectTo('/company-view?filter=Business Unit&value=' + value);
          }
        },
        legend: {
          position: 'bottom',
        },
        title: {
          display: false,
          text: 'Department Summary'
        },
        scales: {
          xAxes: [{
            categoryPercentage: 1.0,
            barPercentage: 0.4,
            barThickness: 40
          }],
          yAxes: [{
            ticks: {
              beginAtZero: true
            }
          }]
        }
      }
    };
    if (this.currentUser.company.name === 'barratt' || this.currentUser.company.name === 'barratttrial') {
      config.type = 'line';
    }
    if (htmlRef) {
      this.IncidentDetailSummaryChart = new Chart(htmlRef, config);
    }
  }

  enumerateDaysBetweenDates(startDate, endDate, amount) {
    const dates = [];
    while (moment(startDate) <= moment(endDate)) {
      dates.push(moment(startDate).format('YYYY-MM-DD'));
      startDate = moment(startDate).add(amount, 'days').format('YYYY-MM-DD');
    }
    return dates;
  }

  getIncidentCountChartData(incidents) {
    const last_dates = [];
    const from = moment(this.range.fromDate);
    const to = moment(this.range.toDate);
    let amount = 1;
    const diff = to.diff(from, 'days');
    if (diff > 14 && diff < 90) {
      amount = 7;
    } else if (diff > 90) {
      amount = 30;
    }
    const dates = this.enumerateDaysBetweenDates(this.range.fromDate, this.range.toDate, amount);
    for (let i = 0; i < dates.length; i++) {
      const d = new Date(dates[i]);
      const data = {
        date: d
      };
      for (const incident of incidents) {
        if (!(incident.type.name in data)) {
          data[`${incident.type.name}`] = 0;
        }
        if (amount > 1 && dates[i + 1]) {
          // if amount is greater than one need to check date is between this and next date
          if (new Date(incident.createdAt).getTime() >= new Date(d).getTime() && new Date(incident.createdAt).getTime() <= new Date(dates[i + 1]).getTime()) {
            data[`${incident.type.name}`] += 1;
          }
        } else {
          if (new Date(incident.createdAt).toDateString() === new Date(d).toDateString()) {
            data[`${incident.type.name}`] += 1;
          }
        }
      }
      last_dates.push(data);
    }
    const datasets = [];
    let index = 1;
    for (let i = 0; i < this.incidentTypes.length; i++) {
      if (this.incidentTypes[i].name == 'Hazard / Near Miss') {
        this.incidentTypes[i].color = '#800000';
      }
    }
    for (const incidentType of this.incidentTypes) {
      const datesData = [];
      for (let i = 0; i < last_dates.length; i++) {
        datesData.push(last_dates[i][`${incidentType.name}`]);
      }
      const dataset = {
        label: `${incidentType.name}`,
        backgroundColor: incidentType.color,
        borderColor: incidentType.color,
        data: datesData,
        fill: false,
      };
      datasets.push(dataset);
      index++;
    }
    const labels = [];
    for (let i = 0; i < last_dates.length; i++) {
      labels.push(moment(last_dates[i].date).format('DD/MM/YY'));
    }
    return {
      labels: labels,
      datasets: datasets
    };
  }

  createIncidentCountChart(incidents) {
    // show chart for incident counts during last 5 days
    const data = this.getIncidentCountChartData(incidents);
    const htmlRef = this.elementRef.nativeElement.querySelector(`#incidents_count_chart`);
    const config = {
      type: 'line',
      data: data,
      options: {
        responsive: true,
        title: {
          display: false,
        },
        tooltips: {
          mode: 'index',
          intersect: false,
        },
        hover: {
          mode: 'nearest',
          intersect: true
        },
        scales: {
          xAxes: [{
            display: true,
            scaleLabel: {
              display: true,
              labelString: 'Month'
            }
          }],
          yAxes: [{
            display: true,
            scaleLabel: {
              display: true,
              labelString: 'Value'
            },
            ticks: {
              beginAtZero: true
            }
          }]
        }
      }
    };
    if (htmlRef) {
      this.IncidentCountChart = new Chart(htmlRef, config);
    }
  }


  createIncidentCountBarChart() {
    const htmlRef = this.elementRef.nativeElement.querySelector(`#incident_count_bar_chart`);
    const data = this.collectIncidentCountBarChartData();
    const config = {
      type: 'bar',
      data: data,
      options: {
        responsive: true,
        legend: {
          display: false,
          position: 'right',
        },
        title: {
          display: false,
          text: 'Chart.js  Bar Chart'
        },
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true
            }
          }],
        }
      }
    };
    if (this.incidents && this.incidents.length > 0 && htmlRef) {
      this.incidentCountBarChart = new Chart(htmlRef, config);
    }
  }

  collectIncidentCountBarChartData() {
    const counts = [];
    const bg_color = [];
    const border_color = [];
    const labels = [];
    let index = 0;
    if (this.concerned) {
      for (const incidentType of Object.keys(this.incidentTypeCount)) {
        counts.push(this.incidentTypeCount[incidentType].count);
        bg_color.push(this.incidentTypeCount[incidentType].color);
        border_color.push(this.incidentTypeCount[incidentType].color);
        labels.push(this.incidentTypeCount[incidentType].name);
        index++;
        counts.push(this.incidentTypeCount[incidentType].totalOpen);
        bg_color.push(this.incidentTypeCount[incidentType].color);
        border_color.push(this.incidentTypeCount[incidentType].color);
        labels.push('Open');
        index++;
        counts.push(this.incidentTypeCount[incidentType].totalClose);
        bg_color.push(this.incidentTypeCount[incidentType].color);
        border_color.push(this.incidentTypeCount[incidentType].color);
        labels.push('Closed');
        index++;
        counts.push(this.incidentTypeCount[incidentType].totalSubmitted);
        bg_color.push(this.incidentTypeCount[incidentType].color);
        border_color.push(this.incidentTypeCount[incidentType].color);
        labels.push('Submitted for Response');
        index++;
      }
    } else {
      for (const incidentType of Object.keys(this.incidentTypeCount)) {
        counts.push(this.incidentTypeCount[incidentType].count);
        bg_color.push(this.incidentTypeCount[incidentType].color);
        border_color.push(this.incidentTypeCount[incidentType].color);
        labels.push(this.incidentTypeCount[incidentType].name);
        index++;
      }
    }
    return {
      'labels': labels,
      'datasets': [{
        'data': counts,
        'fill': false,
        'backgroundColor': bg_color,
        'borderColor': border_color,
        'borderWidth': 1
      }]
    };
  }


  createIncidentByUserBarChart() {
    const htmlRef = this.elementRef.nativeElement.querySelector(`#incident_by_user_bar_chart`);
    const data = this.collectIncidentByUserBarChartData();
    const config = {
      type: 'bar',
      data: data,
      options: {
        responsive: true,
        legend: {
          display: false,
          position: 'right',
        },
        title: {
          display: false,
          text: 'Chart.js Bar Chart'
        },
        scales: {
          xAxes: [{ticks: {beginAtZero: true}}]
        }
      }
    };
    if (this.incidents && this.incidents.length > 0 && htmlRef) {
      this.incidentByUserBarChart = new Chart(htmlRef, config);
    }
  }

  collectIncidentByUserBarChartData() {
    const counts = [];
    const bg_color = ['#72C02C', '#3498DB', '#717984', '#F1C40F'];
    const border_color = [];
    const labels = [];
    let index = 0;
    for (const incidentType of Object.keys(this.incidentsByManager)) {
      counts.push(this.incidentsByManager[incidentType].count);
      bg_color.push(this.getRandomColor());
      border_color.push(this.getRandomColor());
      labels.push(this.incidentsByManager[incidentType].displayName);
      index++;
    }
    return {
      'labels': labels,
      'datasets': [{
        'data': counts,
        'fill': false,
        'backgroundColor': bg_color,
        'borderColor': border_color,
        'borderWidth': 1
      }]
    };
  }

  getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }


  whatAndWhyHappendoptions() {
    if (this.incidentTypesData == undefined) {
      this.incidentTypesData = [];
    }

    for (const incidentType of this.incidentTypesData) {
      for (const section of incidentType.sections) {
        for (const field of section.fields) {
          // "yq9vaoQR"  , "K5dLL851"
          if (field.type === 'dropdown' && field.title == 'What Happened'&& field.id =="yq9vaoQR") {
            // stops weird address field stuff
            // TODO Add more filters remove from api or fix address filter
            const item = {
              title: field.title,
              id: field.id,
              type: 'field',
              options: [],
            };

            if (field.type === 'dropdown' || field.type === 'radio') {
              for (const option of field.options) {
                item.options.push(option.value);
              }
            } else {
              item.options.push('Yes');
              item.options.push('No');
            }
            this.whatHappendoption = item.options;
          } else if (field.type === 'dropdown' && field.title == 'Why it Happened') {
            // stops weird address field stuff
            // TODO Add more filters remove from api or fix address filter
            const item = {
              title: field.title,
              id: field.id,
              type: 'field',
              options: [],
            };

            if (field.type === 'dropdown' || field.type === 'radio') {
              for (const option of field.options) {
                item.options.push(option.value);
              }
            } else {
              item.options.push('Yes');
              item.options.push('No');
            }
            this.whyItHappendoption = item.options;
          }
        }
      }
    }
  }

  collectwhatIncidentBarChartData(incidents) {
    const field = [];
    for (const incident of incidents) {
      if (incident.sosdata) {
      } else if (incident.data) {
        for (const section of incident.data.sections) {
          if (section.title == 'About the Incident') {
            for (const fields of section.fields) {
              if (fields.fieldTitle == 'What Happened') {
                field.push(fields.fieldValue);
              } else if (fields.fieldTitle == 'What Nearly Happened') {
                field.push(fields.fieldValue);
              }
            }
          }
        }
      }
    }

    const incidentWhatCount = field.reduce((acc, val) => {
      acc[val] = acc[val] === undefined ? 1 : acc[val] += 1;
      return acc;
    }, {});
    const counts = [];
    const bg_color = ['#72C02C', '#3498DB', '#717984', '#F1C40F'];
    const border_color = [];
    const labels = [];
    let index = 0;
    if (this.whatHappendoption == undefined) {
      this.whatHappendoption = [];
    }

    for (const option of this.whatHappendoption) {
      counts.push(incidentWhatCount[option]);
      bg_color.push(this.getRandomColor());
      border_color.push(this.getRandomColor());
      labels.push(option);
      index++;
    }

    return {
      'labels': labels,
      'datasets': [{
        'data': counts,
        'fill': false,
        'backgroundColor': bg_color,
        'borderColor': border_color,
        'borderWidth': 1
      }]
    };

  }


  createIncidentWhatBarChart(incidents) {
    const htmlRef = this.elementRef.nativeElement.querySelector(`#incident_what_bar_chart`);
    const data = this.collectwhatIncidentBarChartData(incidents);
    const config = {
      type: 'bar',
      data: data,
      options: {
        responsive: true,
        legend: {
          display: false,
          position: 'right',
        },
        title: {
          display: false,
          text: 'Chart.js Bar Chart'
        },
        scales: {
          xAxes: [{ticks: {beginAtZero: true}}]
        },
        onClick: (event, i) => {
          if (i[0] !== undefined) {
            const value = data.labels[i[0]._index];
            this.redirectTo('/company-view?filter=What Happened&value=' + value);

          }
        },
      }
    };

    if (this.incidents && this.incidents.length > 0 && htmlRef) {
      this.incidentWhatBarChart = new Chart(htmlRef, config);
    }
  }

  redirectTo(uri: string) {
    this.router.navigateByUrl('/', {skipLocationChange: true}).then(() =>
      this.router.navigateByUrl(uri)
    );
  }

  collectWhyItIncidentBarChartData(incidents) {
    const field = [];
    for (const incident of incidents) {
      if (incident.sosdata) {
      } else if (incident.data) {
        for (const section of incident.data.sections) {
          if (section.title == 'About the Incident') {
            for (const fields of section.fields) {
              if (fields.fieldTitle == 'Why it Happened') {
                field.push(fields.fieldValue);
              } else if (fields.fieldTitle == 'Why it Nearly Happened') {
                field.push(fields.fieldValue);
              }
            }
          }
        }
      }
    }
    const insidentWhatCount = field.reduce((acc, val) => {
      acc[val] = acc[val] === undefined ? 1 : acc[val] += 1;
      return acc;
    }, {});

    const counts = [];
    const bg_color = ['#72C02C', '#3498DB', '#717984', '#F1C40F'];
    const border_color = [];
    const labels = [];
    let index = 0;

    if (this.whyItHappendoption == undefined) {
      this.whyItHappendoption = [];
    }

    for (const option of this.whyItHappendoption) {
      counts.push(insidentWhatCount[option]);
      bg_color.push(this.getRandomColor());
      border_color.push(this.getRandomColor());
      labels.push(option);
      index++;
    }

    return {
      'labels': labels,
      'datasets': [{
        'data': counts,
        'fill': false,
        'backgroundColor': bg_color,
        'borderColor': border_color,
        'borderWidth': 1
      }]
    };
  }

  createIncidentWhyItBarChart(incidents) {
    const htmlRef = this.elementRef.nativeElement.querySelector(`#incident_why_it_bar_chart`);
    const data = this.collectWhyItIncidentBarChartData(incidents);
    const config = {
      type: 'bar',
      data: data,
      options: {
        responsive: true,
        legend: {
          display: false,
          position: 'right',
        },
        title: {
          display: false,
          text: 'Chart.js Bar Chart'
        },
        scales: {
          xAxes: [{ticks: {beginAtZero: true}}]
        },
        onClick: (event, i) => {
          if (i[0] !== undefined) {
            const value = data.labels[i[0]._index];
            this.redirectTo('/company-view?filter=Why it Happened&value=' + value);
          }
        },
      }
    };
    if (this.incidents && this.incidents.length > 0 && htmlRef) {
      this.incidentWhyItBarChart = new Chart(htmlRef, config);
    }
  }

  collectClientNames(incidents) {
    for (let incidet = 0; incidet < incidents.length; incidet++) {
      if (this.currentUser.company.name === 'Aon' && this.companyView && incidents[incidet].user && incidents[incidet].user.profile && incidents[incidet].user.profile.fields) {

        for (let i = 0; i < incidents[incidet].user.profile.fields.length; ++i) {
          if (incidents[incidet].user.profile.fields[i].fieldTitle == 'Client Name') {
            if (this.clientNameIncident.indexOf(incidents[incidet].user.profile.fields[i].fieldValue) === -1) {
              this.clientNameIncident.push(incidents[incidet].user.profile.fields[i].fieldValue);
            }
          }
        }
      }
    }
  }


  // SOS (safe on site) detail summary chart view
  createSosDetailSummaryChart(allLength) {
    const htmlRef = this.elementRef.nativeElement.querySelector(`#sos_detail_summary_chart`);
    const datasets = [];
    if (htmlRef != null) {
      for (const dataLength of allLength) {
        datasets.push({
          backgroundColor: dataLength.color,
          data: dataLength.count,
          label: dataLength.series
        });
      }
      const labels = ['Body Position', 'Procedures', 'PPE', 'Tools & Equipment', 'Other', 'Site Specific'];

      const config = {
        type: 'bar',
        data: {
          labels: labels,
          datasets: datasets
        },
        options: {
          responsive: true,
          legend: {
            position: 'right',
            align: 'start',
            labels: {
              boxWidth: 12
            }
          },
          title: {
            display: true,
            text: 'Sos Volume Graph'
          },
          scales: {
            xAxes: [{ticks: {beginAtZero: true}}]
          }
        }
      };
      this.SosGraphCountChart = new Chart(htmlRef, config);
    }
  }

  getSOSGraphData() {
    this.incidentService.getIncidentTypes().subscribe(r => {
      if (r.data) {
        for (let i = 0; i <= r.data.length; i++) {
          if (r.data[i]) {
            if (r.data[i].name == 'Safe on Site') {
              const incidentId = r.data[i].id;
              this.incidentService.getSoSIncidentsById(incidentId).subscribe(res => {
                this.sosData = res.data;
                const section1Low = [];
                const section2Low = [];
                const section3Low = [];
                const section4Low = [];
                const section5Low = [];
                const section6Low = [];
                const section1Mid = [];
                const section2Mid = [];
                const section3Mid = [];
                const section4Mid = [];
                const section5Mid = [];
                const section6Mid = [];
                const section1High = [];
                const section2High = [];
                const section3High = [];
                const section4High = [];
                const section5High = [];
                const section6High = [];
                if (this.sosData) {
                  for (const sos of this.sosData) {
                    for (const section of sos.sosdata.sections) {
                      if (section.name === 'section1bodyposition') {
                        if (this.getTotalRating('section1bodyposition', sos.id) == 0) {
                          section1Low.push(section.subsection.reduce((acc, val) => acc += val.rating, 0));
                        }
                        if ((this.getTotalRating('section1bodyposition', sos.id) > 0) && (this.getTotalRating('section1bodyposition', sos.id) < 11)) {
                          section1Mid.push(section.subsection.reduce((acc, val) => acc += val.rating, 0));
                        }
                        if (this.getTotalRating('section1bodyposition', sos.id) >= 12) {
                          section1High.push(section.subsection.reduce((acc, val) => acc += val.rating, 0));
                        }
                      }
                      if (section.name === 'section2procedures') {
                        if (this.getTotalRating('section2procedures', sos.id) == 0) {
                          section2Low.push(section.subsection.reduce((acc, val) => acc += val.rating, 0));
                        }
                        if ((this.getTotalRating('section2procedures', sos.id) > 0) && (this.getTotalRating('section2procedures', sos.id) < 11)) {
                          section2Mid.push(section.subsection.reduce((acc, val) => acc += val.rating, 0));
                        }
                        if (this.getTotalRating('section2procedures', sos.id) >= 12) {
                          section2High.push(section.subsection.reduce((acc, val) => acc += val.rating, 0));
                        }
                      }
                      if (section.name === 'section3personalprotectiveequipment') {
                        if (this.getTotalRating('section3personalprotectiveequipment', sos.id) == 0) {
                          section3Low.push(section.subsection.reduce((acc, val) => acc += val.rating, 0));
                        }
                        if ((this.getTotalRating('section3personalprotectiveequipment', sos.id) > 0) && (this.getTotalRating('section3personalprotectiveequipment', sos.id) < 11)) {
                          section3Mid.push(section.subsection.reduce((acc, val) => acc += val.rating, 0));
                        }
                        if (this.getTotalRating('section3personalprotectiveequipment', sos.id) >= 12) {
                          section3High.push(section.subsection.reduce((acc, val) => acc += val.rating, 0));
                        }
                      }
                      if (section.name === 'section4toolsandequipement') {
                        if (this.getTotalRating('section4toolsandequipement', sos.id) == 0) {
                          section4Low.push(section.subsection.reduce((acc, val) => acc += val.rating, 0));
                        }
                        if ((this.getTotalRating('section4toolsandequipement', sos.id) > 0) && (this.getTotalRating('section4toolsandequipement', sos.id) < 11)) {
                          section4Mid.push(section.subsection.reduce((acc, val) => acc += val.rating, 0));
                        }
                        if (this.getTotalRating('section4toolsandequipement', sos.id) >= 12) {
                          section4High.push(section.subsection.reduce((acc, val) => acc += val.rating, 0));
                        }
                      }
                      if (section.name === 'section5other') {
                        if (this.getTotalRating('section5other', sos.id) == 0) {
                          section5Low.push(section.subsection.reduce((acc, val) => acc += val.rating, 0));
                        }
                        if ((this.getTotalRating('section5other', sos.id) > 0) && (this.getTotalRating('section5other', sos.id) < 11)) {
                          section5Mid.push(section.subsection.reduce((acc, val) => acc += val.rating, 0));
                        }
                        if (this.getTotalRating('section5other', sos.id) >= 12) {
                          section5High.push(section.subsection.reduce((acc, val) => acc += val.rating, 0));
                        }
                      }
                      if (section.name === 'section6sitespecific') {
                        if (this.getTotalRating('section6sitespecific', sos.id) == 0) {
                          section6Low.push(section.subsection.reduce((acc, val) => acc += val.rating, 0));
                        }
                        if ((this.getTotalRating('section6sitespecific', sos.id) > 0) && (this.getTotalRating('section6sitespecific', sos.id) < 11)) {
                          section6Mid.push(section.subsection.reduce((acc, val) => acc += val.rating, 0));
                        }
                        if (this.getTotalRating('section6sitespecific', sos.id) >= 12) {
                          section6High.push(section.subsection.reduce((acc, val) => acc += val.rating, 0));
                        }
                      }
                    }
                  }
                }
                this.allLength.push(
                  {
                    'series': 'Low',
                    'color': ['green', 'green', 'green', 'green', 'green', 'green'],
                    'count': [section1Low.length, section2Low.length, section3Low.length, section4Low.length, section5Low.length, section6Low.length]
                  },
                  {
                    'series': 'Medium',
                    'color': ['orange', 'orange', 'orange', 'orange', 'orange', 'orange'],
                    'count': [section1Mid.length, section2Mid.length, section3Mid.length, section4Mid.length, section5Mid.length, section6Mid.length]
                  },
                  {
                    'series': 'High',
                    'color': ['red', 'red', 'red', 'red', 'red', 'red'],
                    'count': [section1High.length, section2High.length, section3High.length, section4High.length, section5High.length, section6High.length]
                  });
                this.createSosDetailSummaryChart(this.allLength);
              });
            }
          }
        }
      }
    });
  }

  getTotalRating(value, reportId) {
    for (const sos of this.sosData) {
      if (sos.id == reportId) {
        for (const section of sos.sosdata.sections) {
          if (section.name === value) {
            return section.subsection.reduce((acc, val) => acc += val.rating, 0);
          }
        }
      }
    }
  }

  getOverallRatings(reportId) {
    return this.getTotalRating('section1bodyposition', reportId)
      + this.getTotalRating('section2procedures', reportId)
      + this.getTotalRating('section3personalprotectiveequipment', reportId)
      + this.getTotalRating('section4toolsandequipement', reportId)
      + this.getTotalRating('section5other', reportId)
      + this.getTotalRating('section6sitespecific', reportId);
  }
}
