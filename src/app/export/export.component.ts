import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {CompanyService} from '../_services/company.service';
import {FormArray, FormBuilder, FormControl, FormGroup} from '@angular/forms';
import {AngularCsv} from 'angular7-csv';
import {MapsService} from '../_services/maps.service';
import {ActivatedRoute, Router} from '@angular/router';
import {NgxDrpOptions, PresetItem, Range} from 'ngx-mat-daterange-picker';
import {User} from '../_models/user';
import {IncidentsService} from '../_services/incidents.service';
import {ExportService} from '../_services/export.service';
import {UsersService} from '../_services/users.service';
import {CustomerService} from '../_services/customer.service';

@Component({
  selector: 'app-export',
  templateUrl: './export.component.html',
  styleUrls: ['./export.component.css']
})
export class ExportComponent implements OnInit {
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
  incidents = [];
  selectedIncidents = [];
  selectedTypeIncidents = [];
  incidentTypeCount = [];
  currentIncidentType = 'All';
  incidentsByManager = {};
  hasBlueprintNumbers = false;
  staticFields = [
    'firstName',
    'lastName',
    'email',
    'phone'];
  currentUser;
  initIds = null;
  error = false;
  errorMessage = 'Sorry no incidents available to export as current user type: \'Manager\'';
  // filter
  filterForm: FormGroup;
  public filters = [];
  selectedFilters = {};
  company: any;

  // date range
  fromDate;
  toDate;
  initUpdateRange = false; // tells if initial updateRange was already called. Initializatio of date range picker calls updateRange()
  range: Range = {fromDate: new Date(), toDate: new Date()};
  options: NgxDrpOptions;
  presets: Array<PresetItem> = [];
  queryParams = {'ids': []};
  companyColor = null;
  accentColor = null;
  topLevelGroupName = 'Department';
  searchingBlueprintNumber;
  fields = [];
  form: FormGroup;

  constructor(private companyService: CompanyService,
              private mapsService: MapsService,
              private route: ActivatedRoute,
              private incidentService: IncidentsService,
              private elementRef: ElementRef,
              private fb: FormBuilder,
              private exportService: ExportService,
              private usersService: UsersService,
              private customerService: CustomerService,
              private router: Router) {
    const currentUser = this.customerService.getUser();
    this.companyColor = currentUser.company.primary;
    this.accentColor = currentUser.company.accent;
  }

  ngOnInit() {
    this.currentUser = this.customerService.getUser();
    this.getIncidents();
    this.getIncidentTypes();
    const controlsConfig = {};
    this.filterForm = this.fb.group(controlsConfig);
    this.companyService.getUserCompany().subscribe(
      r => {
        this.company = r.data;
      }, error => {
        console.log(error);
    });
  }

  //for hexa convert into rgb color code for close incidents
  hexToRGB(h) {
    var r:any = 0;
    var g:any = 0;
    var b:any = 0;
    var p:any = 60;

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
    return "rgb("+ +r + " " + +g + " " + +b + "/" + +p + "%)";
  }

  setupDateRangeSelector() {
    const today = new Date();
    const fromMin = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    const fromMax = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const toMin = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const toMax = new Date(today.getFullYear(), today.getMonth() + 2, 0);

    const firstIncidentDate = new Date(this.incidents[this.incidents.length - 1].createdAt);
    this.fromDate = new Date(firstIncidentDate.getFullYear(), firstIncidentDate.getMonth(), firstIncidentDate.getDate(), 0, 0, 0);
    this.toDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const fromMinDate = new Date();
    const fromDates = new Date(fromMinDate.getFullYear() - 5, 0, fromMinDate.getDate(), 0, 0, 0);
    this.setupPresets();
    this.options = {
      presets: this.presets,
      format: 'mediumDate',
      range: {fromDate: this.fromDate, toDate: this.toDate},
      applyLabel: 'Filter',
      calendarOverlayConfig: {
        shouldCloseOnBackdropClick: false,
      },
      fromMinMax: {fromDate: fromDates, toDate: this.toDate},
      toMinMax: {fromDate: fromDates, toDate: this.toDate}
    };
    this.initIds = this.route.snapshot.queryParamMap['params'].ids;
  }


  // handler function that receives the updated date range object
  updateRange(range: Range) {
    this.range = range;
    if (!this.initUpdateRange) {
      this.initUpdateRange = true;
    } else {
      this.fullFilter();
    }
  }

  fullFilter() {
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
    if (this.selectedIncidents) {
      if (incidentsList == undefined) {
        incidentsList = [];
      }
      for (const incident of incidentsList) {
        const incidentDate = new Date(incident.createdAt);
        const newIncidentDate = new Date(incidentDate.getFullYear(), incidentDate.getMonth(), incidentDate.getDate());
        const newFromDate = new Date(this.range.fromDate.getFullYear(), this.range.fromDate.getMonth(), this.range.fromDate.getDate());
        const newToDate = new Date(this.range.toDate.getFullYear(), this.range.toDate.getMonth(), this.range.toDate.getDate());
        if (newIncidentDate >= newFromDate && newIncidentDate <= newToDate) {
          filteredSelectedIncidents.push(incident);
        }
      }
    }
    this.selectedIncidents = filteredSelectedIncidents;
    this.collectQueryParams();
    this.countIncidentsByDepartment(this.selectedIncidents);
    this.countIncidents(this.selectedIncidents);
    this.countIncidentsByManager(this.selectedIncidents);
    // Check the incidents if they conform to the filters
    let i = 0;
    for (const incidentControl of this.form.get('selectedIncidents')['controls']) {
      let formState = false;
      if (this.selectedIncidents.some(selected => selected.id === this.incidents[i].id)) {
        formState = true;
      }
      incidentControl.setValue(formState);
      i++;
    }
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
    const yesterday = backDate(1);
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
      {presetLabel: 'Yesterday', range: {fromDate: yesterday, toDate: today}},
      {presetLabel: 'Last 7 Days', range: {fromDate: minus7, toDate: today}},
      {presetLabel: 'Last 30 Days', range: {fromDate: minus30, toDate: today}},
      {presetLabel: 'This Month', range: {fromDate: currMonthStart, toDate: currMonthEnd}},
      {presetLabel: 'Last Month', range: {fromDate: lastMonthStart, toDate: lastMonthEnd}}
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

  getIncidents() {
    this.error = false;
    if (this.currentUser.admin) {
      this.companyService.getIncidentsForExport().subscribe(
        r => {
          this.collectIncidents(r.data);
        }, e => {
          this.loaded = true;
          this.error = true;
          this.errorMessage = 'Sorry no incidents available to export as current user type: Admin';
          console.log(e);
          alert(e.status + ': ' + e.error.error);
        });
    } else if (this.currentUser.isManager) {
      this.companyService.getUserAssignedExport().subscribe(r => {
        this.collectIncidents(r.data.assignedIncidents);
      }, e => {
        this.loaded = true;
        this.error = true;
        this.errorMessage = 'Sorry no incidents available to export as current user type: Manager';
        console.log(e);
      });
    } else if (this.currentUser.isProjectManager) {
      this.usersService.getManagerAssignedIncidentsExport(this.currentUser.company.id).subscribe(r => {
        this.collectIncidents(r.data);
      }, e => {
        this.loaded = true;
        this.error = true;
        this.errorMessage = 'Sorry no incidents available to export as current user type: Project Manager';
        console.log(e);
      });
    } else {
      this.companyService.getUserCreatedExport().subscribe(r => {
        this.collectIncidents(r.data.incidents);
      }, e => {
        this.loaded = true;
        this.error = true;
        this.errorMessage = 'Sorry no incidents available to export as current user type: User';
        console.log(e);
      });
    }
  }

  collectIncidents(data) {
    this.incidentService.getIncidentTypes().subscribe(response => {
      this.incidentTypesData = response.data;
      const incidentsType = [];
      for (const incidentType of this.incidentTypesData) {
        if(incidentType.name != 'Guidance' && incidentType.name != 'Safe on Site' && incidentType.name != 'Audits' && incidentType.name != 'Managers Tour'){
          incidentsType.push(incidentType.name);
        }
      }
      if (data && data.length > 0) {
        this.incidents = data;
        this.incidents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        for (let i = 0; i < this.incidents.length; i++) {
          if(this.incidents[i].type.name == "Hazard / Near Miss"){
            this.incidents[i].type.color = "#800000";
          }
        }
        const filterData = [];
        for (const incident of this.incidents) {
          for (let j = 0; j < incidentsType.length; j++) {
            if(incident.type.name == incidentsType[j]){
              filterData.push(incident);
            }
          }
        }
        this.incidents = filterData;
        this.countIncidents(this.incidents);
        this.collectIncidentTypes();
        this.collectIncidentStatuses();
        this.countIncidentsByDepartment(this.incidents);
        this.setupDateRangeSelector();
        this.countIncidentsByManager(this.incidents);
        this.collectFields();
        this.initForm();
      } else {
        this.loaded = true;
        this.error = true;
        this.errorMessage = 'Sorry no incidents available to export as current user type';
      }
    });
  }

  countIncidentsByManager(incidents) {
    this.incidentsByManager = {};
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
  }

  countIncidents(incidents) {
    this.incidentTypeCount = [];
    const incidentCount = {};
    for (const incident of incidents) {
      if (incident.type.name in incidentCount) {
        incidentCount[incident.type.name].count += 1;
      } else {
        incidentCount[incident.type.name] = {
          count: 1,
          id: incident.type.id,
          color: incident.type.color
        };
      }
    }

    for (const incidentTypeName of Object.keys(incidentCount)) {
      this.incidentTypeCount.push({
        name: incidentTypeName,
        count: incidentCount[incidentTypeName].count,
        id: incidentCount[incidentTypeName].id,
        color: incidentCount[incidentTypeName].color
      });
    }
  }

  async collectFilters() {
    const incidentTypeFilter = {
      title: 'Incident Type',
      id: 'incidentType',
      type: 'incidentType',
      options: ['All'],
    };
    for (const incidentType of this.incidentTypesData) {
      if(incidentType.name != 'Guidance' && incidentType.name != 'Safe on Site' && incidentType.name != 'Audits' && incidentType.name != 'Managers Tour'){
        incidentTypeFilter.options.push(incidentType.name);
        for (const section of incidentType.sections) {
          for (const field of section.fields) {
            if (field.type === 'dropdown') {
              // stops weird address field stuff
              // TODO Add more filters remove from api or fix address filter
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

              // Check if filter already exists
              let contains = false;
              for (let i = 0; i < this.filters.length; i++) {
                if (this.filters[i].title === item.title) {
                  contains = true;
                }
              }

              if (!contains) {
                this.filters.push(item);
              }
            }
          }
        }
      }
    }
    this.filters.push(incidentTypeFilter);

    if (this.incidentStatuses == undefined) {
      this.incidentStatuses = [];
    }
    if (this.incidentStatuses.length > 0) {
      const options = ['All'];
      for (const incidentStatus of this.incidentStatuses) {
        options.push(incidentStatus);
      }

      const item = {
        title: 'Status',
        id: 'status_id',
        type: 'status',
        options: options,
      };

      this.filters.push(item);
    }
    for (const groupType of this.groupTypes) {
      if (groupType.groups.length > 0) {
        const item = {
          title: groupType.name,
          id: groupType.id,
          type: 'userGroup',
          options: ['All'],
        };

        for (const groupItem of groupType.groups) {
          item.options.push(groupItem.name);
        }
        this.filters.push(item);
      }
    }

    this.filters = this.filters.filter((a, i) => this.filters.findIndex((s) => a.title === s.title) === i)
    // init filter form
    const controlsConfig = {};
    if (this.filters) {
      for (const filter of this.filters) {
        controlsConfig[filter.id] = filter.options[0];
      }
      this.filterForm = this.fb.group(controlsConfig);
    }
  }

  addFilter(name: string, value: string) {
    if (name in this.selectedFilters) {
      delete this.selectedFilters[name];
    }
    if (value !== 'All') {
      this.selectedFilters[name] = value;
    }
    this.fullFilter();
  }

  resetFilterForm() {
    this.selectedIncidents = this.selectedTypeIncidents;
    this.collectQueryParams();
    Object.keys(this.filterForm.controls).forEach(key => {
      this.filterForm.get(key).setValue('All');
    });
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
          if (field.fieldTitle === 'Blueprint Project Number') {
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
      this.collectQueryParams();
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
        } else if (incidentFilter === 'Incident Type') {
          if (incident.type.name === this.selectedFilters[incidentFilter]) {
            matchesThisFilter = true;
          }
        } else if (incidentFilter === 'Division' && incident.userGroup && incident.userGroup.parent) {
          if (incident.userGroup.parent.name === this.selectedFilters[incidentFilter]) {
            matchesThisFilter = true;
          }
        } else if (incidentFilter === 'Site' && incident.userGroup) {
          if (incident.userGroup.name === this.selectedFilters[incidentFilter]) {
            matchesThisFilter = true;
          }
        } else {
          if (incident.user) {
            if ('user' in incident && 'userGroup' in incident.user) {
              if (incident.user.userGroup.name === this.selectedFilters[incidentFilter]) {
                matchesThisFilter = true;
              }
            }
          }
          if(incident.sosdata){

          }else if(incident.data){
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
      this.collectQueryParams();
    }
  }

  collectQueryParams() {
    this.queryParams.ids = [];
    for (const incident of this.selectedIncidents) {
      this.queryParams.ids.push(incident.id);
    }
  }

  randomScalingFactor() {
    return Math.round(Math.random() * 70);
  }

  countIncidentsByDepartment(incidents) {
    const userGroups = {};
    for (const incident of incidents) {
      if (incident.user) {
        let incidentUserGroup = incident.user.userGroup;
        if (incidentUserGroup) {
          if ('parent' in incident.user.userGroup) {
            incidentUserGroup = incident.user.userGroup.parent;
          }

          if (!(incidentUserGroup.id in userGroups)) {
            userGroups[incidentUserGroup.id] = {
              name: incidentUserGroup.name,
              count: {}
            };

            for (const incidentType of this.incidentTypes) {
              userGroups[incidentUserGroup.id]['count'][incidentType.name] = 0;
            }
          }
          userGroups[incidentUserGroup.id]['count'][incident.type.name] += 1;
        }
      }
    }
  }

  showAll() {
    window.location.href = window.location.pathname;
  }

  initForm() {
    const controls = [];
    for (const incident of this.incidents) {
      if(this.initIds != undefined){
        if (this.initIds == "All") {
          controls.push(new FormControl(true));
        } else {
          if (this.initIds.indexOf(incident.id) > -1) {
            controls.push(new FormControl(true));
          } else {
            controls.push(new FormControl(false));
          }
        }
      }else{
        controls.push(new FormControl(false));
      }
    }

    const fieldControls = [];
    for (const field of this.fields) {
      fieldControls.push(new FormControl(false));
    }
    this.form = new FormGroup({
      selectedIncidents: new FormArray(controls),
      selectedFields: new FormArray(fieldControls)
    });
    this.loaded = true;
  }

  collectFields() {
    this.fields = this.fields.concat(this.staticFields);
    if (this.incidents[0].userGroup) {
      this.fields = this.fields.concat(['Site']);
      if (this.incidents[0].userGroup.parent) {
        this.fields = this.fields.concat(['Division']);
      }
    }
    this.fields.push('id');
    for (const incident of this.incidents) {
      if(incident.sosdata){

      }else if(incident.data){
        for (const section of incident.data.sections) {
          for (const field of section.fields) {
            if (!this.fields.includes(field.fieldTitle)) {
              this.fields.push(field.fieldTitle.replace('\r', ''));
            }
          }
        }
      }
    }
  }

  getFieldsControls() {
    return (this.form.get('selectedFields') as FormArray).controls;
  }

  getControls() {
    return (this.form.get('selectedIncidents') as FormArray).controls;
  }

  checkAllIncidents(event) {
    const value = event.currentTarget.checked;
    for (const incidentControl of this.form.get('selectedIncidents')['controls']) {
      incidentControl.setValue(value);
    }
  }

  checkAllFields(event) {
    const value = event.currentTarget.checked;
    for (const fieldControl of this.form.get('selectedFields')['controls']) {
      fieldControl.setValue(value);
    }
  }

  async submitForm() {
    const selectedIncidents = [];
    this.form.value.selectedIncidents.forEach((item, index) => {
      if (item) {
        selectedIncidents.push(this.incidents[index]);
      }
    });
    const selectedFields = [];
    this.form.value.selectedFields.forEach((item, index) => {
      selectedFields.push(this.fields[index]);
    });

    const expansiveFields = ['Injuries', 'Damages', 'Vehicles', 'Witnesses'];
    const data = [];
    const headerTitles = [];
    for (let i = 0; i < selectedIncidents.length; i++) {
      let dataItem;
      if (selectedIncidents[i].status) {
        dataItem = [selectedIncidents[i].type.name, selectedIncidents[i].status.name];
      } else {
        dataItem = [selectedIncidents[i].type.name];
      }

      for (const selectedField of selectedFields) {
        let value = '';
        if (selectedIncidents[i].userGroup) {
          if (selectedField === 'Site') {
            value = selectedIncidents[i].userGroup.name;
          } else if (selectedField === 'Division' && selectedIncidents[i].userGroup.parent) {
            value = selectedIncidents[i].userGroup.parent.name;
          }
        }
        if(selectedIncidents[i].sosdata){

        }else if(selectedIncidents[i].data){
          for (const section of selectedIncidents[i].data.sections) {
            for (const field of section.fields) {
              if (field.fieldTitle === selectedField) {
                value = field.fieldValue;
                if (field.fieldType === 'time') {
                  const d = new Date(field.fieldValue);
                  value = d.toLocaleTimeString();
                } else if (field.fieldType === 'date') {
                  const d = new Date(field.fieldValue);
                  value = d.toLocaleDateString('en-GB');
                } else if (field.fieldType === 'datetime') {
                  const d = new Date(field.fieldValue);
                  value = d.toLocaleString();
                }
              }
            }
          }
        }
        // Now loop through user info using static fields
        if (selectedField === 'id') {
          value = selectedIncidents[i][selectedField];
        }
        if (this.staticFields.indexOf(selectedField) > -1) {
          if (selectedIncidents[i].user && selectedIncidents[i].user[selectedField]) {
            value = selectedIncidents[i].user[selectedField];
          }
        }
        if (!expansiveFields.includes(selectedField)) {
        }
      }
      for (const selectedField of selectedFields) {
        let value = '';
        if(selectedIncidents[i].sosdata){

        }else if(selectedIncidents[i].data){
          for (const section of selectedIncidents[i].data.sections) {
            if (section.title === 'Injuries, Damage & Witnesses' && section[selectedField.toLowerCase()]) {
              for (const iteration of section[selectedField.toLowerCase()]) {
                if (iteration.fields) {
                  for (const field of iteration.fields) {
                    if (field.fieldType !== 'media') {
                      if (!headerTitles.includes(field.fieldTitle)) {
                        headerTitles.push(field.fieldTitle);
                      }
                      value = field.fieldValue;
                      if (field.fieldType === 'time') {
                        const d = new Date(field.fieldValue);
                        value = d.toLocaleTimeString();
                      } else if (field.fieldType === 'date') {
                        const d = new Date(field.fieldValue);
                        value = d.toLocaleDateString('en-GB');
                      } else if (field.fieldType === 'datetime') {
                        const d = new Date(field.fieldValue);
                        value = d.toLocaleString();
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    for (const field of expansiveFields) {
      const index = selectedFields.indexOf(field);
      if (index > -1) {
        selectedFields.splice(index, 1);
        for (const item of data) {
          item.splice((index + 2), 1);
        }
      }
    }

    for (let i = 0; i < selectedIncidents.length; i++) {
      let dataItem;
      if (selectedIncidents[i].status) {
        dataItem = [selectedIncidents[i].type.name, selectedIncidents[i].status.name];
      } else {
        dataItem = [selectedIncidents[i].type.name];
      }
      let note = '';
      for (let ind = 0; ind < selectedIncidents[i].notes.length; ind++) {
        note = note + selectedIncidents[i].notes[ind].type.name + ': "' + selectedIncidents[i].notes[ind].note + '", ';
      }
      dataItem.push(note);
      for (const selectedField of selectedFields) {
        let value = '';
        if (selectedIncidents[i].userGroup) {
          if (selectedField === 'Site') {
            value = selectedIncidents[i].userGroup.name;
          } else if (selectedField === 'Division' && selectedIncidents[i].userGroup.parent) {
            value = selectedIncidents[i].userGroup.parent.name;
          }
        }
        if(selectedIncidents[i].sosdata){

        }else if(selectedIncidents[i].data){
          for (const section of selectedIncidents[i].data.sections) {
            for (const field of section.fields) {
              if (field.fieldTitle === selectedField) {
                value = field.fieldValue;
                if (field.fieldType === 'time') {
                  const d = new Date(field.fieldValue);
                  value = d.toLocaleTimeString();
                } else if (field.fieldType === 'date') {
                  const d = new Date(field.fieldValue);
                  value = d.toLocaleDateString('en-GB');
                } else if (field.fieldType === 'datetime') {
                  const d = new Date(field.fieldValue);
                  value = d.toLocaleString();
                }
              }
            }
          }
        }
        // Now loop through user info using static fields
        if (selectedField === 'id') {
          // value = selectedIncidents[i][selectedField];
          if (this.currentUser.company.name == 'emico') {
            value = this.getProjectId(selectedIncidents[i]);
          } else {
            value = selectedIncidents[i][selectedField];
          }

        }
        if (this.staticFields.indexOf(selectedField) > -1) {
          if (selectedIncidents[i].user && selectedIncidents[i].user[selectedField]) {
            value = selectedIncidents[i].user[selectedField];
          }
        }
        if (!expansiveFields.includes(selectedField)) {
          dataItem.push(value);
        }
      }
      for (const selectedField of selectedFields.concat(headerTitles)) {
        let value = '';
        if(selectedIncidents[i].sosdata){

        }else if(selectedIncidents[i].data){
          for (const section of selectedIncidents[i].data.sections) {
            if (section.title === 'Injuries, Damage & Witnesses' && section[selectedField.toLowerCase()]) {
              for (const iteration of section[selectedField.toLowerCase()]) {
                if (iteration.fields) {
                  for (const field of iteration.fields) {
                    if (field.fieldType !== 'media') {
                      if (!headerTitles.includes(field.fieldTitle)) {
                        headerTitles.push(field.fieldTitle);
                      }
                      value = field.fieldValue;
                      if (field.fieldType === 'time') {
                        const d = new Date(field.fieldValue);
                        value = d.toLocaleTimeString();
                      } else if (field.fieldType === 'date') {
                        const d = new Date(field.fieldValue);
                        value = d.toLocaleDateString('en-GB');
                      } else if (field.fieldType === 'datetime') {
                        const d = new Date(field.fieldValue);
                        value = d.toLocaleString();
                      }
                      dataItem.push(value);
                    }
                  }
                }
              }
            }
          }
        }
      }

      data.push(dataItem);
    }

    let headers = ['IncidentType', 'Status', 'Notes'];
    headers = headers.concat(selectedFields, headerTitles);

    const headersToRemove = [];
    headers.forEach((header, i) => {

      if (headers[i] === 'id' && this.currentUser.company.name == 'emico') {
        headers[i] = 'Project ID';
      }
      let headerValue = false;
      data.forEach((array) => {
        if (array[i] && array[i].length > 0) {
          // If all of the arrays in data dont have a value for this header
          return headerValue = true;
        }
      });

      // This needs to only execute after looping through each array in data or when a value has been found
      if (!headerValue) {
        headersToRemove.push(i);
      }

    });

    // Sort into descending order so they remain in correct place
    headersToRemove.sort(function (a, b) {
      return a - b;
    }).reverse();

    headersToRemove.sort((a, b) => b - a);
    // Remove empty columns
    headersToRemove.forEach((item) => {
      headers.splice(item, 1);
      data.forEach((array) => {
        array.splice(item, 1);
      });
    });
    const currentDate = new Date();
    const title = `Exported Incidents ${currentDate.toLocaleString()}`;
    const fileName = title.split(' ').join('_');
    const options = {
      headers: headers,
      showTitle: true,
      title: title.split(',').join(' '), // angular5-csv splits this by ',' therefore I replace it with ' '
    };

    return new AngularCsv(data, fileName, options);
  }

  getProjectId(incident) {
    for (const section of incident.data.sections) {
      if (section.title === 'Select Project') {
        return section.fields[0].fieldValue;
      }
    }
  }

}
