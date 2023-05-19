import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from "@angular/core";
import { CompanyService } from "../_services/company.service";
import { Chart } from "chart.js";
import { LabelType, Options } from "ng5-slider";
import { MapsService } from "../_services/maps.service";
import { UsersService } from "../_services/users.service";
import { CustomerService } from "../_services/customer.service";
import { IncidentsService } from "../_services/incidents.service";
import { Router } from "@angular/router";
import { User } from "../_models/user";
import { NgxDrpOptions, PresetItem, Range } from "ngx-mat-daterange-picker";
import * as moment from "moment";
import { MouseEvent } from "@agm/core";

declare var $: any;
import swal from "sweetalert2";
import { R } from "@angular/cdk/keycodes";
// import { type } from "os";
interface marker {
  lat: number;
  lng: number;
  label?: string;
  draggable: boolean;
  content: string;
}
@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.css"],
})
export class DashboardComponent implements OnInit {
  @ViewChild("chartCanvas") chartCanvas: ElementRef;
  @ViewChild("countCanvas") countCanvas: ElementRef;
  @ViewChild("incidentChartCanvas")
  incidentChartCanvasRef: ElementRef<HTMLCanvasElement>;
  private incidentChart: Chart;

  private chart: any;

  @ViewChild("dateRangePicker") dateRangePicker;
  incidentsLoaded = false;
  incidents;
  assignedIncidents;
  assignedIncidents1;
  recentActivityIncidents;
  recentActivityIncidents1;
  incident_type_count = {};
  incident_type_pie_count = {};
  incidentCountBarChart;
  incidentCountLineChart;
  projectCountBarChart;
  incidentsHidden = false;
  activitiesHidden = false;
  incidentsByMonths:any = [];
  loadingincidentsByMonths= false;
  // slide variables
  dateRange = [];
  minValue;
  maxValue;
  options: Options;
  assignedLoaded = false;
  companyColor;
  noIncidents = false;
  currentUser;
  company: any;
  topLevelGroupName = "Department";
  incidentTypes;
  IncidentDetailSummaryChart;
  incidentsCount: any = [];
  incidentTypesData;
  incidentsType: any = [];
  fetchedIncidentsType: any = [];
  incidentsTypeNew: any = [];
  incidentsMonthType: any;
  stackIncidentData: any;
  incidentTypeMonthStack;
  incidentLatlong: any = [];
  mapInstance: google.maps.Map;

  // date range
  fromDate;
  toDate;
  range: Range = { fromDate: new Date(), toDate: new Date() };

  private map: google.maps.Map = null;
  private heatmap: google.maps.visualization.HeatmapLayer = null;
  lat: number = 55.3781;
  lng: number = 3.436;
  zoom = 8;
  startDate1;
  endDate1;

  constructor(
    private companyService: CompanyService,
    private elementRef: ElementRef,
    private mapsService: MapsService,
    private usersService: UsersService,
    private customerService: CustomerService,
    private router: Router,
    private incidentService: IncidentsService
  ) {

    this.currentUser = this.customerService.getUser();
    if (this.currentUser.isProjectManager) {
      this.router.navigateByUrl("/assigned");
    }
    this.companyColor = this.currentUser.company.primary;
    document.body.style.setProperty(
      "--company-primary",
      this.currentUser.company.primary
    );
    document.body.style.setProperty(
      "--company-accent",
      this.currentUser.company.accent
    );
    document.body.style.setProperty(
      "--company-primaryTwo",
      this.currentUser.company.primaryTwo
    );
    if (!this.currentUser.email) {
      this.router.navigateByUrl("/profile");
    }
    this.usersService.getProfileData().subscribe(
      (res) => {
         this.company = res.data.company;
        if (res.data.rbac && res.data.rbac.concerns) {
          if (
            confirm(
              "Would you like to be redirected to the Logconcern Dashboard?"
            ) == true
          ) {
            window.location.href = "https://logconcern.logincident.com/";
          }
        }
      },
      (e) => {
        console.error(e);
      }
    );
  }

  async ngOnInit() {

    const startDate = new Date(
      new Date().setFullYear(new Date().getFullYear() - 1)
    );
    this.startDate1 = moment(startDate).format("YYYY-MM-DD");
    const endDate = new Date();
    this.endDate1 = moment(endDate).format("YYYY-MM-DD");

    await this.getIncidentByMonthCount(this.startDate1, this.endDate1);
    await this.getIncidentTypes(true);
    
    if(['Finninguk', 'AonFleet'].includes(this.currentUser.company.name)) {
      await this.last24HoursData();
      await this.graphIncidentsbymonth(this.startDate1, this.endDate1, true);
      await this.incidentCount(this.startDate1, this.endDate1, true);
      await this.userCount(this.startDate1, this.endDate1, true);
      this.getIncidents2();
    } else {
        this.organiseIncidents();
    }
    await this.getAssignedIncidents();
  }

  incident24H: any[];

  ngAfterViewInit() {
  }

  async last24HoursData() {
    const r = this.incidentsByMonths;

    if(typeof (r.data.last24) != 'undefined' && Object.keys(r.data.last24).length) {
      this.incident24H = r.data.last24;
      const data = {
        labels: [],
        datasets: [
          {
            label: "Incident Count",
            data: [],
            backgroundColor: "rgba(255, 99, 132, 0.2)",
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 1,
            fill: "origin",
          },
        ],
      };

      this.incident24H.forEach((item) => {
        const date = new Date(item.time);
        const label = `${date.getHours()}:${date.getMinutes()}`;
        data.labels.push(label);
        data.datasets[0].data.push(item.count);
      });

      const incidentChartCanvas = this.incidentChartCanvasRef.nativeElement;
      this.incidentChart = new Chart(incidentChartCanvas, {
        type: "line",
        data,
        options: {
          plugins: {
            title: {
              display: true,
              text: "Incident Count for Last 24 Hours",
            },
          },
          scales: {
            x: {
              ticks: {
                callback: (value: string) => {
                  const [hour, minute] = value.split(":");
                  return `${hour.padStart(2, "0")}:${minute.padStart(
                    2,
                    "0"
                  )}`;
                },
              },
            },
            y: {
              title: {
                display: true,
                text: "Number of Incidents",
              },
              beginAtZero: true,
            },
          },
        },
      });
    }
    return true;
  }

  async getIncidentByMonthCount(startDate, endDate) {
    if(!this.loadingincidentsByMonths) {
      this.loadingincidentsByMonths = true;
      const response = await this.incidentService
        .getIncidentByMonth(startDate, endDate)
        .toPromise();
      this.loadingincidentsByMonths = false;
      this.incidentsLoaded = true;
      this.incidentsByMonths = response;
      return response;
    } else {
      return this.incidentsByMonths
    }
  }

  getCurrentAndYesterdayDate() {
    // Get current date
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = (currentDate.getMonth() + 1)
      .toString()
      .padStart(2, "0");
    const currentDay = currentDate.getDate().toString().padStart(2, "0");
    const currentDateString = `${currentYear}-${currentMonth}-${currentDay}`;

    // Get yesterday's date
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayYear = yesterdayDate.getFullYear();
    const yesterdayMonth = (yesterdayDate.getMonth() + 1)
      .toString()
      .padStart(2, "0");
    const yesterdayDay = yesterdayDate.getDate().toString().padStart(2, "0");
    const yesterdayDateString = `${yesterdayYear}-${yesterdayMonth}-${yesterdayDay}`;

    // Return dates as object
    return {
      current: currentDateString,
      yesterday: yesterdayDateString,
    };
  }

  async onMapLoad(mapInstance: google.maps.Map, startDate, endDate) {
    const heatLocation = [];
    const heatLocation1 = [];
    var r = this.incidentsByMonths

    if (Object.keys(r.data.gps).length) {
      const gpskeyId = Object.values(r.data.gps);
      for (let i = 0; i < gpskeyId.length; i++) {
        for (let j = 0; j < Object.values(gpskeyId[i]).length; j++) {
          heatLocation.push(gpskeyId[i][j]);
        }
      }
      for (let i = 0; i < heatLocation.length; i++) {
        heatLocation1.push(
          new google.maps.LatLng(heatLocation[i].lat, heatLocation[i].lng)
        );
      }
      this.map = mapInstance;
      this.map.setOptions({
        center: new google.maps.LatLng(50.736129, -1.988229),
        zoom: 6,
      });
      this.heatmap = new google.maps.visualization.HeatmapLayer({
        map: this.map,
        data: heatLocation1,
        radius: 50,
      });
    }
  }

  async getIncidentTypes(init=false) {

    if(init) {
      const fetchedIncidentsType = await this.incidentService.getIncidentTypes().toPromise();
      this.incidentTypesData = fetchedIncidentsType.data;
    }

    if(this.incidentTypesData) {
      const {statusCounts} = this.incidentsByMonths.data
      var obj = {};
      for (const incidentType of this.incidentTypesData) {
        if (
          incidentType.name != "Safe on Site" &&
          incidentType.name != "Audits" &&
          incidentType.name != "Managers Tour" &&
          incidentType.name != "Equipment Solutions" &&
          incidentType.name != "Electric Power"
        ) {
          var statusCount:any = [];
          
          Object.keys(statusCounts).forEach(function(key, index) {
            if(statusCounts[key].typeId == incidentType.id) {
              statusCount = statusCounts[key];
            }
          });
          
          if(statusCount.status) {
           
            this.incidentsType.push(incidentType);
            const status = statusCount.status;
            const closed = status.Closed;
            const open   = status.Open;
            const countByStatus = { Closed: (typeof closed != 'undefined') ? closed : 0 , Open: (typeof open != 'undefined') ? open : 0 }
            const count = statusCount.total;
            const id    = statusCount.typeId;
            const icon  = 'warning';
            var color =  incidentType.color;
            
            if(incidentType.name == 'Hazard / Near Miss') {
               color =  '#800000';
            }
            const incidenetData = { count: count, color: color,icon: icon, name: incidentType, id: id, countByStatus: countByStatus }
  
            obj[incidentType.name] = incidenetData;
          }
        }
      }
      this.incidentsTypeNew = obj;
    }
  }

  getAssignedIncidents() {
        const r = this.incidentsByMonths
        
        if(typeof r.data != 'undefined' && typeof(r.data.last5User) != 'undefined') {
          this.incidents = [];
          const filterData = [];
          this.assignedIncidents = r.data.last5User;
          this.assignedIncidents1 = r.data.last5User;
          this.assignedIncidents.sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          this.assignedIncidents = this.assignedIncidents.slice(0, 5);
          for (let i = 0; i < this.assignedIncidents.length; i++) {
            if (this.assignedIncidents[i].typename == "Hazard / Near Miss") {
              this.assignedIncidents[i].color = "#800000";
            } else {
              var incidentType: any = [];
              this.incidentTypesData.filter((inci) => {
                if(this.assignedIncidents[i].typename == inci.name) {
                  incidentType = inci
                }
              })
              if(incidentType.color) {
                this.assignedIncidents[i].color = incidentType.color;
              } else {
                this.assignedIncidents[i].color = "#800000";
              }

            }
          }
          for (const incident of this.assignedIncidents) {
            if (
              incident.typename != "Safe on Site" &&
              incident.typename != "Audits" &&
              incident.typename != "Managers Tour"
            ) {
              filterData.push(incident);
            }
          }
          this.assignedIncidents = filterData;
      }
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

  getIncidents2() {
    if (this.currentUser.admin) {
      this.companyService.getIncidentsForExport().subscribe(
        (r) => {
          setTimeout(() => {
            this.incidents = r.data;
            this.incidentsCount = r.data;
            this.organiseIncidents();
          }, 1000);
        },
        (e) => {
          this.incidentsLoaded = true;
          swal.fire({
            title: "Oops...",
            icon: "error",
            text: e.status + ": " + e.message,
          });
        }
      );
    } else if (this.currentUser.isManager) {
      this.usersService.getUserAssignedIncidents().subscribe(
        (r) => {
          setTimeout(() => {
            this.incidents = r.data.assignedIncidents;
            this.incidentsCount = r.data.assignedIncidents;
            this.organiseIncidents();
          }, 2000);
        },
        (e) => {
          this.incidentsLoaded = true;
          swal.fire({
            title: "Oops...",
            icon: "error",
            text: e.status + ": " + e.message,
          });
        }
      );
    } else {
      this.companyService.getUserCreatedExport().subscribe(
        (r) => {
          setTimeout(() => {
            this.incidents = r.data.incidents;
            this.incidentsCount = r.data.incidents;
            this.organiseIncidents();
          }, 2000);
        },
        (e) => {
          this.incidentsLoaded = true;
          console.log(e);
          swal.fire({
            title: "Oops...",
            icon: "error",
            text: e.status + ": " + e.message,
          });
        }
      );
    }
  }

 async organiseIncidents() {
    if ((this.incidents && this.incidents.length > 0 && this.currentUser.company.name == "Finninguk") || typeof(this.incidentsByMonths.data) != 'undefined' ) {
      const filterData = [];
      if(this.incidents) {
        this.incidents.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }

      if(typeof(this.incidentsByMonths.data.last5Activity) != 'undefined') {
        this.recentActivityIncidents = this.incidentsByMonths.data.last5Activity.slice(0, 5);
        this.recentActivityIncidents1 = this.incidentsByMonths.data.last5Activity.slice(0, 5);
        for (const incident of this.recentActivityIncidents) {
          if (
            incident.typename != "Safe on Site" &&
            incident.typename != "Audits" &&
            incident.typename != "Managers Tour"
          ) {
            var incidentType: any = [];
            this.incidentTypesData.filter((inci) => {
              if(incident.typename == inci.name) {
                incidentType = inci
              }
            })
            if(incident.typename == 'Hazard / Near Miss') {
              incident.color = "#800000";
            } else {
              if(incidentType.color) {
                incident.color = incidentType.color;
              }else {
                incident.color = "#ffc63a";
              }
            }
            filterData.push(incident);
          }
        }
      }
      
      this.recentActivityIncidents = filterData;
      this.getIncidentLocationNames();
      this.collectDateRange();
      this.countIncidents();
      this.customDateRange();
      if (this.currentUser.company.name == "logconcern") {
        this.createProjectCountBarChart();
      } else if (this.currentUser.company.name == "AonFleet") {
        this.createIncidentCountLineChart();
      } else {
        this.createIncidentCountBarChart();
      }
      if (this.currentUser.company.name == "Finninguk") {
        this.collectIncidentTypes();
        this.getTopLevelGroupName();
        this.countIncidentsByDepartment(this.incidents);
        this.createIncidentCountLineChart();
      }
      this.incidentsLoaded = true;
    } else {
      this.incidentsLoaded = true;
    }
    return this.incidentsLoaded;
  }

  getTopLevelGroupName() {
    this.companyService
      .getCompanyGroupTypes(this.customerService.getUser().company.id)
      .subscribe((r) => {
        if ("groupTypes" in r.data) {
          for (const groupType of r.data.groupTypes) {
            if (groupType.order === 0) {
              this.topLevelGroupName = groupType.name;
            }
          }
        }
      });
  }

  getIncidentLocationNames() {
    // loops through firs three incidents and tries to get their location based on GPS coordinates(if they exist)
    // TODO: refactor like here: https://stackoverflow.com/questions/42394697/angular2-cannot-find-namespace-google
    for (const incident of this.recentActivityIncidents) {
      let lat = null;
      let lng = null;
      if (
        incident.data &&
        incident.data.sections &&
        incident.data.sections != undefined
      ) {
        for (const section of incident.data.sections) {
          for (const field of section.fields) {
            if (field.lat) {
              lat = field.lat;
              lng = field.lng;
            }
          }
        }
      }

      if (lat && lng) {
        this.mapsService.getGeoLocation(lat, lng).subscribe((response) => {
          incident.location = response[1].formatted_address;
          let locality = null;
          let country = null;
          for (const item of response[1].address_components) {
            if (item.types[0] === "locality") {
              locality = item.long_name;
            } else if (item.types[0] === "country") {
              country = item.long_name;
            }
          }
          if (locality && country) {
            incident.location = locality + ", " + country;
          }
        });
      }
    }
  }

  hideActivities() {
    this.activitiesHidden = !this.activitiesHidden;
  }

  hideIncidents() {
    this.incidentsHidden = !this.incidentsHidden;
  }

  async countIncidents() {
    this.incident_type_count =  this.incidentsTypeNew;

    for (let j = 0; j < this.incidentsType.length; j++) {
      if(Object.keys(this.incident_type_count).length) {
        for (var key in this.incident_type_count) {
          if (this.incidentsType[j] == this.incident_type_count[key].name) {
            var size = Object.keys(
              this.incident_type_count[key].countByStatus
            ).length;
            if (size > 0) {
              this.incident_type_pie_count[key] = this.incident_type_count[key];
            }
          }
        }
      } else {
        const entries = Object.entries(this.incident_type_pie_count);
        entries.forEach(async(enter, index) => {
          if(enter[0] == this.incidentsType[j].name && index < 1) {
            delete this.incident_type_pie_count[enter[0]]
          }
        })
      }
    }
    return this.incident_type_count
  }

  collectDateRange() {
    if ((this.incidents && this.incidents.length > 0 ) || typeof(this.incidentsByMonths.data) != 'undefined') {

      var startDate  = new Date(
        this.startDate1
      )
       var endDate =  new Date(
        this.endDate1
      );
      if(this.incidents && this.incidents.length > 0) {
         startDate = new Date(
          this.incidents[this.incidents.length - 1].createdAt
        );
         endDate = new Date();
      }
      // diff of days between startDate and endDate
      const daysDiff = Math.round(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      // this.dateRange.push(startDate);
      const index = new Date(startDate);
      const step = Math.ceil(daysDiff / 10);
      if (daysDiff > 0) {
        while (index < endDate) {
          this.dateRange.push(new Date(index));
          index.setDate(index.getDate() + step);
        }
      } else {
        this.dateRange.push(index);
      }
      // push last day to daterange
      this.dateRange.push(endDate);
      // set min/max value
      this.minValue = this.dateRange[0];
      this.maxValue = this.dateRange[this.dateRange.length - 1];
      this.initSlider();
    }
  }

  initSlider() {
    // this.value = this.dateRange[0].getTime();
    this.options = {
      floor: 0,
      ceil: moment(this.minValue).diff(moment(this.maxValue), "days") + 1,
      step: 1,
      stepsArray: this.dateRange.map((date: Date) => {
        return { value: date.getTime() };
      }),
      translate: (value: number, label: LabelType): string => {
        return moment(value).format("D/M/Y");
      },
    };
  }

  async sliderValueChange(e) {
    this.countIncidents();
    if (this.currentUser.company.name == "logconcern") {
      this.createProjectCountBarChart();
      const newBarChartData = this.collectProjectCountBarChartData();
      this.projectCountBarChart.config.data = newBarChartData;
      this.projectCountBarChart.update();
    } else if (this.currentUser.company.name == "AonFleet") {
      this.createIncidentCountLineChart();
      const newLineChartData = this.collectIncidentCountLineChartData();
      this.incidentCountLineChart.config.data = newLineChartData;
      this.incidentCountLineChart.update();
    } else {
      const startDate1 = moment(e.value).format("YYYY-MM-DD")
      const endDate1 = moment(e.highValue).format("YYYY-MM-DD")
      this.startDate1 = startDate1; 
      this.endDate1 = endDate1; 
      await this.updateRange({
        fromDate: new Date(startDate1),
        toDate: new Date(endDate1),
      });
    }
  }

  countIncidentsByDepartment(incidents) {
    const data = {};
    if (this.currentUser.company.name === "Aon") {
      for (const incident of incidents) {
        if (incident.user && incident.user.profile) {
          for (const field of incident.user.profile.fields) {
            if (field.fieldTitle == "Client Name") {
              if (!data[field.fieldValue]) {
                data[field.fieldValue] = {
                  name: field.fieldValue,
                  count: {},
                };
                for (const incidentType of this.incidentTypes) {
                  data[field.fieldValue]["count"][incidentType.name] = 0;
                }
              }
              data[field.fieldValue]["count"][incident.type.name] += 1;
            }
          }
        }
      }
    } else {
      for (const incident of incidents) {
        if (incident.type.rbac !== "concerns") {
          if (incident.userGroup) {
            let incidentUserGroup = incident.userGroup;
            if (incidentUserGroup) {
              if ("parent" in incident.userGroup) {
                incidentUserGroup = incident.userGroup.parent;
              }
              if (!(incidentUserGroup.id in data)) {
                data[incidentUserGroup.id] = {
                  name: incidentUserGroup.name,
                  count: {},
                };
                for (const incidentType of this.incidentTypes) {
                  data[incidentUserGroup.id]["count"][incidentType.name] = 0;
                }
              }
              data[incidentUserGroup.id]["count"][incident.type.name] += 1;
            }
          } else if (incident.user) {
            let incidentUserGroup = incident.user.userGroup;
            if (incidentUserGroup) {
              if ("parent" in incident.user.userGroup) {
                incidentUserGroup = incident.user.userGroup.parent;
              }
              if (!(incidentUserGroup.id in data)) {
                data[incidentUserGroup.id] = {
                  name: incidentUserGroup.name,
                  count: {},
                };
                for (const incidentType of this.incidentTypes) {
                  data[incidentUserGroup.id]["count"][incidentType.name] = 0;
                }
              }
              data[incidentUserGroup.id]["count"][incident.type.name] += 1;
            }
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
        labels: labels,
      };
      this.IncidentDetailSummaryChart.update();
    } else {
      this.createIncidentDetailSummaryChart(data);
    }
  }

  getIncidentDetailSummaryChartDatasets(userGroups) {
    // create empty datasets
    const datasets = [];
    if (this.incidentTypes == undefined) {
      this.incidentTypes = [];
    }

    const incidentValue = this.incidentTypes
      .map((e) => e.name)
      .indexOf(
        "Electric Power" ||
          "Equipment Solution" ||
          "Equipment Solution" ||
          "Vehicle Inspectio"
      );
    if (incidentValue > -1) {
      this.incidentTypes.splice(incidentValue, 1);
    }

    for (const incidentType of this.incidentTypes) {
      datasets.push({
        label: incidentType.name,
        backgroundColor: incidentType.color,
        borderColor: incidentType.color,
        borderWidth: 1,
        fill: this.currentUser.company.name !== "barratt",
        data: [],
      });
    }

    const userGroupsArray = Object.keys(userGroups).map((key) => ({
      type: key,
      value: userGroups[key],
    }));
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
      const incidentCount = Object.keys(userGroupsArray[i].value.count).map(
        (key) => ({
          type: key,
          value: userGroupsArray[i].value.count[key],
        })
      );
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
      labels: labels,
    };
  }

  createIncidentDetailSummaryChart(userGroups) {
    const htmlRef = this.elementRef.nativeElement.querySelector(
      `#incident_detail_summary_chart`
    );
    const result = this.getIncidentDetailSummaryChartDatasets(userGroups);
    const datasets = result.datasets;
    const labels = result.labels;
    const config = {
      type: "bar",
      data: {
        labels: labels,
        datasets: datasets,
      },
      options: {
        responsive: true,
        legend: {
          position: "bottom",
        },
        title: {
          display: false,
          text: "Department Summary",
        },
        scales: {
          xAxes: [
            {
              categoryPercentage: 1.0,
              barPercentage: 0.4,
              barThickness: 40,
            },
          ],
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
              },
            },
          ],
        },
      },
    };
    if (
      this.currentUser.company.name === "barratt" ||
      this.currentUser.company.name === "barratttrial"
    ) {
      config.type = "line";
    }
    if (htmlRef) {
      this.IncidentDetailSummaryChart = new Chart(htmlRef, config);
    }
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

  async createIncidentCountBarChart() {
    const htmlRef = this.elementRef.nativeElement.querySelector(
      `#incident_count_bar_chart`
    );
    const data = this.collectIncidentCountBarChartData();
    const config = {
      type: "horizontalBar",
      data: data,
      options: {
        responsive: true,
        hover: {
          onHover: function (e) {
            e.target.style.cursor = "pointer";
          },
        },
        onClick: (event, i) => {
          if (i[0] !== undefined) {
            let param = data.labels[i[0]._index];
            if (this.currentUser.admin === true) {
              this.router.navigateByUrl("/company-view?type=" + param);
            } else {
              this.router.navigateByUrl("/my-view?type=" + param);
            }
          }
        },
        legend: {
          display: false,
          position: "right",
        },
        title: {
          display: false,
          text: "Chart.js Horizontal Bar Chart",
        },
        scales: {
          xAxes: [{ ticks: { beginAtZero: true } }],
        },
        tooltips: {
          callbacks: {
            title: function (item, context) {},
            label: function (item, everything) {
              let label1 = "";
              let label2 = "";
              let label3 = "";
              if (everything.datasets[0].datasetLabel[item.index].Closed) {
                label1 =
                  "Closed:" +
                  everything.datasets[0].datasetLabel[item.index].Closed +
                  ",";
              }
              if (everything.datasets[0].datasetLabel[item.index].Open) {
                label2 =
                  "Open:" +
                  everything.datasets[0].datasetLabel[item.index].Open +
                  ",";
              }
              if (item.xLabel) {
                label3 = "Total:" + item.xLabel + " ";
              }
              let label4 = label1 + label2 + label3;
              return label4;
            },
          },
        },
      },
    };
    if (typeof(this.incidentsByMonths.data) != 'undefined' && htmlRef) {
      this.incidentCountBarChart = new Chart(htmlRef, config);
    }
    return this.incidentCountBarChart;
  }

  goToMyView() {
    var url = "/my-view/";
    var win = window.open(url, "_blank");
    win.focus();
  }

  collectIncidentCountBarChartData() {
    const counts = [];
    const bg_color = [];
    const border_color = [];
    const labels = [];
    let datasetLabel = [];
    let index = 0;

    for (const incidentType of Object.keys(this.incident_type_count)) {
      if (incidentType != "Guidance") {
        counts.push(this.incident_type_count[incidentType].count);
        bg_color.push(this.incident_type_count[incidentType].color);
        border_color.push(this.incident_type_count[incidentType].color);
        datasetLabel.push(this.incident_type_count[incidentType].countByStatus);
        labels.push(incidentType);
        index++;
      }
    }
    for (let i = 0; i < bg_color.length; i++) {
      if (labels[i] == "Hazard / Near Miss") {
        bg_color[i] = "#800000";
        border_color[i] = "#800000";
      }
    }

    return {
      labels: labels,
      datasets: [
        {
          data: counts,
          fill: false,
          backgroundColor: bg_color,
          borderColor: border_color,
          borderWidth: 1,
          datasetLabel: datasetLabel,
        },
      ],
    };
  }

  createProjectCountBarChart() {
    const htmlRef = this.elementRef.nativeElement.querySelector(
      `#project_count_bar_chart`
    );
    const data = this.collectProjectCountBarChartData();
    const config = {
      type: "horizontalBar",
      data: data,
      options: {
        responsive: true,
        hover: {
          onHover: function (e) {
            e.target.style.cursor = "pointer";
          },
        },
        onClick: (e, i) => {
          if (i[0] !== undefined) {
            let number = data.labels[i[0]._index];
            if (this.currentUser.admin === true) {
              this.router.navigateByUrl(
                "/company-view?type=All&number=" + number
              );
            }
          }
        },
        legend: {
          display: false,
        },
        title: {
          display: false,
        },
        scales: {
          xAxes: [{ ticks: { beginAtZero: true } }],
        },
      },
    };
    if (this.incidents.length > 0) {
      this.projectCountBarChart = new Chart(htmlRef, config);
    }
  }

  collectProjectCountBarChartData() {
    const data = [];
    const labels = [];
    const backgroundColors = [];
    for (const incidentType of this.incidents) {
      const date = moment(incidentType.createdAt);
      // loop through all the incidents only if the incident falls between this.minValue and this.maxValue
      if (moment(this.minValue) <= date && date <= moment(this.maxValue)) {
        if (incidentType.data) {
          for (let i = 0; i < incidentType.data.sections.length; i++) {
            // loop through push to labels for each project number.
            const field = incidentType.data.sections[i];
            if (field.title === "Project Information") {
              for (let int = 0; int < field.fields.length; int++) {
                if (
                  field.fields[int].fieldTitle ===
                  "SAP Blueprint Project Number"
                ) {
                  const projectNumber = field.fields[int].fieldValue;
                  if (labels.indexOf(projectNumber) > -1) {
                  } else {
                    // push field value to labels if not already in
                    labels.push(projectNumber);
                  }
                  // increase the counts with the same index of the project number by one
                  if (data[labels.indexOf(projectNumber)]) {
                    data[labels.indexOf(projectNumber)]++;
                  } else {
                    data[labels.indexOf(projectNumber)] = 1;
                  }
                }
              }
            }
          }
        }
      }
    }

    for (let i = 0; i < labels.length; i++) {
      backgroundColors[i] = this.getRandomColor();
    }

    return {
      labels: labels,
      datasets: [
        {
          data: data,
          fill: false,
          borderWidth: 1,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors,
        },
      ],
    };
  }

  getRandomColor() {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  createIncidentCountLineChart() {
    const htmlRef = this.elementRef.nativeElement.querySelector(
      `#incident_count_line_chart`
    );
    const data = this.collectIncidentCountLineChartData();
    const config = {
      type: "line",
      data: data,
    };
    if (this.incidents.length > 0) {
      this.incidentCountLineChart = new Chart(htmlRef, config);
    }
  }

  collectIncidentCountLineChartData() {
    const incidentTypes = [];
    const weeks = this.weeks();
    // make an array of weeks between this.minValue and this.maxValue
    for (const incidentType of this.incidents) {
      if (incidentType.type.rbac !== "concerns") {
        const date = moment(incidentType.createdAt);
        // loop through all the incidents only if the incident falls between this.minValue and this.maxValue
        if (moment(this.minValue) <= date && date <= moment(this.maxValue)) {
          for (let i = 0; i < weeks.length; i++) {
            // loop through the week labels and if it it is within the week increment the corrosponding value for the incitenttype
            if (
              moment(weeks[i].startDate) <= date &&
              date <= moment(weeks[i].endDate)
            ) {
              let found = false;
              for (let it = 0; it < incidentTypes.length; it++) {
                // Look to see if this incident type is in the array
                if (incidentTypes[it].label === incidentType.type.name) {
                  // if it is in the array increment the value correspsonding to the current date
                  incidentTypes[it].data[i]++;
                  found = true;
                  break;
                }
              }
              if (!found) {
                // if it is not in the array create the incident type to array
                // Generate the data array
                const data = [];
                for (let ite = 0; ite < weeks.length; ite++) {
                  data.push(0);
                }
                // increment the value correspsonding to the current date
                data[i]++;
                incidentTypes.push({
                  label: incidentType.type.name,
                  data: data,
                  fill: false,
                  borderColor: incidentType.type.color, // Add custom color border (Line)
                  backgroundColor: incidentType.type.color, // Add custom color background (Points and Fill)
                });
              }
            }
          }
        }
      }
    }
    const labels = [];
    for (let i = 0; i < weeks.length; i++) {
      labels.push(weeks[i].label);
    }

    return {
      labels: labels,
      datasets: incidentTypes,
    };
  }

  weeks() {
    const startDate = moment(this.minValue);
    const endDate = moment(this.maxValue);
    const weekData = [];
    while (startDate.isSameOrBefore(endDate)) {
      if (weekData.length > 0) {
        // Update end date
        const lastObj = weekData[weekData.length - 1];
        lastObj["endDate"] = moment(startDate).format("MM/DD/Y");
        lastObj["label"] =
          moment(lastObj.startDate).format("D/M") +
          "-" +
          moment(lastObj.endDate).format("D/M");
        startDate.add(1, "days");
      }
      weekData.push({ startDate: moment(startDate).format("MM/DD/Y") });
      startDate.add(6, "days");
    }
    if (startDate.isAfter(endDate)) {
      // Update last object
      const lastObj = weekData[weekData.length - 1];
      lastObj["endDate"] = moment(endDate).format("MM/DD/Y");
      lastObj["label"] =
        moment(lastObj.startDate).format("D/M") +
        "-" +
        moment(lastObj.endDate).format("D/M");
    }
    return weekData;
  }

  //for custom bootstrap date range picker
  customDateRange() {
     var firstDate  = new Date(
      this.startDate1
    )
     var secondDate =  new Date(
      this.endDate1
    );
    
     if(this.incidents && this.incidents.length) {
       firstDate = new Date(
        this.incidentsCount[this.incidentsCount.length - 1].createdAt
      );
       secondDate = new Date(this.incidentsCount[0].createdAt);
    }

    this.fromDate = new Date(
      firstDate.getFullYear(),
      firstDate.getMonth(),
      firstDate.getDate(),
      0,
      0,
      0
    );
    
    this.toDate = new Date(
      secondDate.getFullYear(),
      secondDate.getMonth(),
      secondDate.getDate(),
      0,
      0,
      0
    );
    var start = moment(this.fromDate);
    var end = moment(this.toDate);

    function cb(start, end) {
      $("#dashboardrange span").html(
        start.format("MMMM D, YYYY") + " - " + end.format("MMMM D, YYYY")
      );
    }

    $("#dashboardrange").daterangepicker(
      {
        opens: "left",
        startDate: start,
        endDate: end,
        maxDate: moment(),
        locale: {
          format: "DD/MM/YYYY",
        },
        ranges: {
          Today: [moment(), moment()],
          Yesterday: [
            moment().subtract(1, "days"),
            moment().subtract(1, "days"),
          ],
          "Last 7 Days": [moment().subtract(6, "days"), moment()],
          "Last 30 Days": [moment().subtract(29, "days"), moment()],
          "This Month": [moment().startOf("month"), moment().endOf("month")],
          "Last Month": [
            moment().subtract(1, "month").startOf("month"),
            moment().subtract(1, "month").endOf("month"),
          ],
        },
      },
      cb
    );
    $(".drp-calendar.right").hide();
    $(".drp-calendar.left").addClass("single");
    $(".calendar-table").on("DOMSubtreeModified", function () {
      var el = $(".prev.available").parent().children().last();
      if (el.hasClass("next available")) {
        return;
      }
      el.addClass("next available");
      el.append("<span></span>");
    });
    cb(start, end);
    // onclick apply in bootstrap daterange picker
    $("#dashboardrange").on("apply.daterangepicker", (e, picker) => {
      this.startDate1 = new Date(picker.startDate.format("MMMM D, YYYY"))
      this.endDate1 = new Date(picker.endDate.format("MMMM D, YYYY"))
      this.updateRange({
        fromDate: this.startDate1,
        toDate: this.endDate1,
      });
      
    });
    // onclick cancel in bootstrap daterange picker
    $("#dashboardrange").on("cancel.daterangepicker", (e, picker) => {
      this.customDateRange();
      this.fullFilter(false);
    });
  }

  // handler function that receives the updated date range object
  async updateRange(range: Range) {
    this.range = range;
    await this.fullFilter(true);
  }

  // //for data filter by date range picker
  async fullFilter(dateChange?) {
    if (dateChange) {
      const startDate = moment(this.range.fromDate).format("YYYY-MM-DD");
      const endDate = moment(this.range.toDate).format("YYYY-MM-DD");

      await this.getIncidentByMonthCount(startDate,endDate)
      await this.getIncidentTypes();
      await this.customDateRange();

      if(this.currentUser.company.name == 'Finninguk') {
        this.onMapLoad(this.mapInstance, startDate, endDate);
      }
      const filteredSelectedIncidents = [];
      const filteredSelectedIncidents1 = [];

      if (this.incidentsCount) {
        if (this.incidentsCount == undefined) {
          this.incidentsCount = this.incidentsCount;
        }
        for (const incident of this.incidentsCount) {
          const incidentDate = moment(incident.createdAt).format("YYYY-MM-DD");
          if (incidentDate >= startDate && incidentDate <= endDate) {
            filteredSelectedIncidents.push(incident);
          }
        }
      }

      this.incidents = filteredSelectedIncidents;
      this.countIncidents();

      const newChartData = this.collectIncidentCountBarChartData();
      this.incidentCountBarChart.config.data = newChartData;
      this.incidentCountBarChart.update();

      if(this.currentUser.company.name == 'Finninguk') {
        const newStackChart = await this.collectIncidentsbymonthData();
        this.incidentTypeMonthStack.config.data = newStackChart;
        this.incidentTypeMonthStack.update();
        
        this.incidents.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      
      const filterData = [];     
      
      if(typeof(this.incidentsByMonths.data.last5Activity) != 'undefined') {
        this.recentActivityIncidents = this.incidentsByMonths.data.last5Activity.slice(0, 3);
        for (const incident of this.recentActivityIncidents) {
          if (
            incident.typename != "Safe on Site" &&
            incident.typename != "Audits" &&
            incident.typename != "Managers Tour"
          ) {
            var incidentType: any = [];
            this.incidentTypesData.filter((inci) => {
              if(incident.typename == inci.name) {
                incidentType = inci
              }
            })
            if(incident.typename == 'Hazard / Near Miss') {
              incident.color = "#800000";
            } else {
              if(incidentType.color) {
                incident.color = incidentType.color;
              }else {
                incident.color = "#ffc63a";
              }
            }
            filterData.push(incident);
          }
        }
      }
      
      this.recentActivityIncidents = filterData;

      if (this.assignedIncidents1) {
        for (const incident of this.assignedIncidents1) {
          const incidentDate = moment(incident.timestamp).format("YYYY-MM-DD");
          if (incidentDate >= startDate && incidentDate <= endDate) {
            filteredSelectedIncidents1.push(incident);
          }
        }
      }
      this.assignedIncidents = filteredSelectedIncidents1;
      const filterData1 = [];
      this.assignedIncidents.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      this.assignedIncidents = this.assignedIncidents.slice(0, 5);
      for (let i = 0; i < this.assignedIncidents.length; i++) {
        if (this.assignedIncidents[i].typename == "Hazard / Near Miss") {
          this.assignedIncidents[i].color = "#800000";
        } else {
          var incidentType: any = [];
          this.incidentTypesData.filter((inci) => {
            if(this.assignedIncidents[i].typename == inci.name) {
              incidentType = inci
            }
          })
          if(incidentType.color) {
            this.assignedIncidents[i].color = incidentType.color;
          }else {
            this.assignedIncidents[i].color = "#ffc63a";
          }
        }
      }
      for (const incident1 of this.assignedIncidents) {
        if (
          incident1.typename != "Safe on Site" &&
          incident1.typename != "Audits" &&
          incident1.typename != "Managers Tour"
        ) {
          filterData1.push(incident1);
        }
      }
      this.assignedIncidents = filterData1;
    } else {
      this.incidents = this.incidentsCount;
      this.countIncidents();
      const newChartData = this.collectIncidentCountBarChartData();
      this.incidentCountBarChart.config.data = newChartData;
      this.incidentCountBarChart.update();
      this.getAssignedIncidents();
      const filterData = [];
      for (const incident1 of this.recentActivityIncidents1) {
        if (
          incident1.typename != "Safe on Site" &&
          incident1.typename != "Audits" &&
          incident1.typename != "Managers Tour"
        ) {
          filterData.push(incident1);
        }
      }
      this.recentActivityIncidents = filterData;
    }
    return true
  }

  incidentCounts: any = [];
  userCounts: any = [];

  async incidentCount(startDate, endDate, onInit=false) {

       var r = this.incidentsByMonths

      if(!onInit) {
         r = await this.incidentService
          .getIncidentByMonth(startDate, endDate)
          .toPromise();
      }

      if(typeof r.data.incidentCounts == 'undefined') {
        return true;
      }
      // .getIncidentByMonth(startDate, endDate)
      // .subscribe((r) => {
        const sortedData = r.data.incidentCounts.sort(
          (a, b) => b.count - a.count
        );
        const incidentLabels = sortedData.map(
          (incident) => incident.incident_type
        );
        const incidentData = sortedData.map((incident) => incident.count);

        const userLabels = this.userCounts.map((user) => user.user);
        const userData = this.userCounts.map((user) => user.count);
        this.chart = new Chart(this.chartCanvas.nativeElement, {
          type: "horizontalBar",
          data: {
            labels: incidentLabels,
            datasets: [
              {
                label: "Incident Counts",
                data: incidentData,
                backgroundColor: "#0000FF",
                borderColor: "rgba(54, 162, 235, 1)",
                borderWidth: 1,
              },
            ],
          },
          options: {
            scales: {
              xAxes: [
                {
                  ticks: {
                    beginAtZero: true,
                  },
                },
              ],
            },
          },
        });
      // });
  }

  async userCount(startDate, endDate, onInit=false) {
    var r = this.incidentsByMonths

      if(!onInit) {
         r = await this.incidentService
          .getIncidentByMonth(startDate, endDate)
          .toPromise();
      }

      if(typeof r.data.userCounts == 'undefined') {
        return true;
      }
    // this.incidentService
    //   .getIncidentByMonth(startDate, endDate)
    //   .subscribe((r) => {
        const sortedData = r.data.userCounts.sort((a, b) => b.count - a.count);
        const incidentLabels = sortedData.map((incident) => incident.user);
        const data = sortedData.map((incident) => incident.count);

        const userLabels = this.userCounts.map((user) => user.user);
        const userData = this.userCounts.map((user) => user.count);

        this.chart = new Chart(this.countCanvas.nativeElement, {
          type: "horizontalBar",
          data: {
            labels: incidentLabels,
            datasets: [
              {
                label: "User Counts",
                data: data,
                backgroundColor: "#28a745",
                borderColor: "rgba(54, 162, 235, 1)",
                borderWidth: 1,
              },
            ],
          },
          options: {
            scales: {
              xAxes: [
                {
                  ticks: {
                    beginAtZero: true,
                  },
                },
              ],
            },
          },
        });
        return r
      // });
  }

  async collectIncidentsbymonthData() {

    let r = this.incidentsByMonths;

    if (typeof r.data.monthlyCounts != 'undefined') {
      const monthPositive = [];
      const positiveCount = [];
      const accidentCount = [];
      const nearMissCount = [];
      const auditActionCount = [];
      const safeOnSiteCount = [];
      const testSetFieldCount = [];
      const hazardNearMissCount = [];
      const managersTourCount = [];
      for (var i = 0; i < r.data.monthlyCounts.length; i++) {
        this.incidentsMonthType = r.data.monthlyCounts[i].incident_type;
        if (this.incidentsMonthType == "Positive Observation") {
          monthPositive.push(r.data.monthlyCounts[i].month);
          positiveCount.push(r.data.monthlyCounts[i].count);
        }
        if (this.incidentsMonthType == "Accident") {
          accidentCount.push(r.data.monthlyCounts[i].count);
        }
        if (this.incidentsMonthType == "Near Miss") {
          nearMissCount.push(r.data.monthlyCounts[i].count);
        }
        if (this.incidentsMonthType == "Audit Action") {
          auditActionCount.push(r.data.monthlyCounts[i].count);
        }
        if (this.incidentsMonthType == "Safe on Site") {
          safeOnSiteCount.push(r.data.monthlyCounts[i].count);
        }
        if (this.incidentsMonthType == "TestSetField") {
          testSetFieldCount.push(r.data.monthlyCounts[i].count);
        }
        if (this.incidentsMonthType == "Hazard / Near Miss") {
          hazardNearMissCount.push(r.data.monthlyCounts[i].count);
        }
        if (this.incidentsMonthType == "Managers Tour") {
          managersTourCount.push(r.data.monthlyCounts[i].count);
        }
      }

      var stackIncident = {
        labels: monthPositive,
        datasets: [
          {
            label: "Postive Observation",
            backgroundColor: "#0000FF",
            data: positiveCount,
          },
          {
            label: "Near Miss",
            backgroundColor: "#FFFF00",
            data: nearMissCount,
          },
          {
            label: "Audit Action",
            backgroundColor: "#7434EB",
            data: auditActionCount,
          },
          {
            label: "Accident",
            backgroundColor: "#FF0000",
            data: accidentCount,
          },
          {
            label: "Safe on Site",
            backgroundColor: "#009B33",
            data: safeOnSiteCount,
          },
          {
            label: "TestSetField",
            backgroundColor: "#800080",
            data: testSetFieldCount,
          },
          {
            label: "Hazard / Near Miss",
            backgroundColor: "#A52A2A",
            data: hazardNearMissCount,
          },
          {
            label: "Managers Tour",
            backgroundColor: "#00FFFF",
            data: managersTourCount,
          },
        ],
      };
      return stackIncident;
    }

  }

  async graphIncidentsbymonth(startDate, endDate, onInit=false) {

      let r = this.incidentsByMonths

      if(!onInit) {
         r = await this.incidentService
          .getIncidentByMonth(startDate, endDate)
          .toPromise();
      }
        this.incidentCounts = r.data.incidentCounts;
        this.userCounts = r.data.userCounts;

        if (typeof r.data.monthlyCounts != 'undefined') {
          const stackIncident =  await this.collectIncidentsbymonthData();
          setTimeout(() => {
            this.createIncidentMonthChart(stackIncident);
          }, 5000);
          return stackIncident;
        }
  }

  //Month Inicdent chart
  createIncidentMonthChart(stackIncidentData) {
    var htmlRef = this.elementRef.nativeElement.querySelector(`#monthBarChart`);
    const data = stackIncidentData;
    const config = {
      type: "bar",
      data: data,
      options: {
        responsive: true,
        interaction: {
          intersect: false,
        },
        scales: {
          xAxes: [
            {
              stacked: true,
              barThickness: 50,
              barPercentage: 0.8,
              categoryPercentage: 0.2,
              ticks: {
                beginAtZero: true,
              },
            },
          ],
          yAxes: [
            {
              stacked: true,
              ticks: {
                beginAtZero: true,
              },
            },
          ],
        },
      },
    };
    if (htmlRef && stackIncidentData) {
      this.incidentTypeMonthStack = new Chart(htmlRef, config);
    }
  }
}
