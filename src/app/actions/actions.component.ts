import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  QueryList,
  ViewChildren,
  Input
} from "@angular/core";
import { CustomerService } from "../_services/customer.service";
import { CompanyService } from "../_services/company.service";
import { ActivatedRoute, Router } from "@angular/router";
import { User } from "../_models/user";
import * as moment from "moment";
import { MmtService } from "../_services/mmt.service";
import { NgxDrpOptions, PresetItem, Range } from "ngx-mat-daterange-picker";
import { IncidentsService } from "../_services/incidents.service";
import {
  NgbdSortableHeader,
  SortEvent,
} from "../_directives/sortable.directive";
declare var $: any;

const compare = (v1: string | number, v2: string | number) =>
  v1 < v2 ? -1 : v1 > v2 ? 1 : 0;

@Component({
  selector: "app-actions",
  templateUrl: "./actions.component.html",
  styleUrls: ["./actions.component.css"],
})
export class ActionsComponent implements OnInit {
  currentUser: User;
  actionColor = null;
  accentColor = null;
  @Input() actionIncidents: any = [];

  p: number = 1;
  selectedIncidents;
  incidentId;
  incidents;
  mTourColor = null;
  branchList: any = [];
  mmtList: any = [];
  branchContainers: any = [];
  allDataList: any = [];
  mmtQuestionLists;
  questionList;
  closeResult: string;
  //filter select options
  branchSelected: string = "All";
  completesSelected: string = "All";
  responseSelected: string = "All";
  branchFilter: any = [];
  branchPkId;
  branchName;
  dueDate;
  classType;
  mmtCompletesList: any = [];
  mmtResponseList: any = [];
  loading: boolean = true;
  dataLoading: boolean = true;
  branchId;
  // date range
  fromDate;
  toDate;
  range: Range = { fromDate: new Date(), toDate: new Date() };

  @ViewChildren(NgbdSortableHeader) headers: QueryList<NgbdSortableHeader>;

  constructor(
    private companyService: CompanyService,
    private customerService: CustomerService,
    private mmtService: MmtService,
    private router: Router,
    private incidentService: IncidentsService
  ) {
    const currentUser = this.customerService.getUser();
    this.actionColor = currentUser.company.primary;
    this.accentColor = currentUser.company.accent;
  }

  async ngOnInit() {
    //for get all audit actions from api
    var r: any = [];

    //get branch list and branch filter list
    if(Object.keys(this.actionIncidents).length) {
       r = this.actionIncidents;
    } else {
      alert('here');
       const res = await this.companyService.getIncidents().toPromise();
       r = res.data
    }

    // this.companyService.getIncidents().subscribe((r) => {
      this.incidents = r;
      this.incidents.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const actionSortData = [];
      for (const incident of this.incidents) {
        if (incident.type.name === "Audit Action") {
          let description = "";
          let branch = "";
          let status = "";
          for (const section of incident.data.sections) {
            for (const field of section.fields) {
              if (field.fieldTitle === "Description") {
                if (field.fieldValue && description == "") {
                  description = field.fieldValue;
                }
              }
              if (field.fieldTitle === "Branch") {
                if (field.fieldValue && branch == "") {
                  branch = field.fieldValue;
                }
              }
            }
          }

          if (description) {
            description =
              description.length > 50
                ? description.slice(0, 50) + ".."
                : description;
            incident["shortDescription"] = description;
          }
          if (branch) {
            branch = branch.length > 20 ? branch.slice(0, 20) + ".." : branch;
            incident["shortBranch"] = branch;
          }
          if (incident.status) {
            status = incident.status.name;
          }
          actionSortData.push({
            id: incident.id,
            status: incident.status,
            statusName: status,
            createdDate: incident.createdAt,
            branchName: incident.shortBranch,
            description: incident.shortDescription,
          });
        }
      }
      this.selectedIncidents = actionSortData;
    // });
    this.customDateRange();
  }

  //for table header row sorting
  onSort({ column, direction }: SortEvent) {
    // resetting other headers
    this.headers.forEach((header) => {
      if (header.sortable !== column) {
        header.direction = "";
      }
    });
    // sorting question list
    if (direction === "" || column === "") {
      this.selectedIncidents = this.selectedIncidents;
    } else {
      this.selectedIncidents = [...this.selectedIncidents].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === "asc" ? res : -res;
      });
    }
  }

  customDateRange() {
    this.companyService.getIncidents().subscribe((r) => {
      this.incidents = r.data;
      this.incidents.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const selectedDates = [];
      const actionSortData = [];
      for (const incident of this.incidents) {
        if (incident.type.name === "Audit Action") {
          selectedDates.push(moment(incident.createdAt).format("MM/DD/YYYY"));
          let description = "";
          let branch = "";
          let status = "";
          for (const section of incident.data.sections) {
            for (const field of section.fields) {
              if (field.fieldTitle === "Description") {
                if (field.fieldValue && description == "") {
                  description = field.fieldValue;
                }
              }
              if (field.fieldTitle === "Branch") {
                if (field.fieldValue && branch == "") {
                  branch = field.fieldValue;
                }
              }
            }
          }

          if (description) {
            description =
              description.length > 50
                ? description.slice(0, 50) + ".."
                : description;
            incident["shortDescription"] = description;
          }
          if (branch) {
            branch = branch.length > 20 ? branch.slice(0, 20) + ".." : branch;
            incident["shortBranch"] = branch;
          }
          if (incident.status) {
            status = incident.status.name;
          }
          actionSortData.push({
            id: incident.id,
            status: incident.status,
            statusName: status,
            createdDate: incident.createdAt,
            branchName: incident.shortBranch,
            description: incident.shortDescription,
          });
        }
      }
      this.selectedIncidents = actionSortData;
      const filterMonth = selectedDates
        .map((item) => item)
        .filter((value, index, self) => self.indexOf(value) === index);

      //const monthSort = filterMonth.sort();

      /**
       * Fixed SD
       */
      const monthSort = filterMonth
        .sort((a, b) => new Date(b).valueOf() - new Date(a).valueOf())
        .reverse();

      /* console.log(
        "monthSort audit actions ------------------------",
        monthSort
      ); */
      /**
       * Fixed SD
       */

      const firstDate = new Date(
        monthSort[monthSort.length - monthSort.length]
      );
      this.fromDate = new Date(
        firstDate.getFullYear(),
        firstDate.getMonth(),
        firstDate.getDate(),
        0,
        0,
        0
      );
      const secondDate = new Date(monthSort[monthSort.length - 1]);
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
        $("#auditactionrange span").html(
          start.format("MMMM D, YYYY") + " - " + end.format("MMMM D, YYYY")
        );
      }
      $("#auditactionrange").daterangepicker(
        {
          locale: {
            format: "DD/MM/YYYY",
          },
          startDate: start,
          endDate: end,
          maxDate: end,
        },
        cb
      );

      cb(start, end);
      // onclick apply in bootstrap daterange picker
      $("#auditactionrange").on("apply.daterangepicker", (e, picker) => {
        this.updateRange({
          fromDate: new Date(picker.startDate.format("MMMM D, YYYY")),
          toDate: new Date(picker.endDate.format("MMMM D, YYYY")),
        });
      });

      // onclick cancel in bootstrap daterange picker
      $("#auditactionrange").on("cancel.daterangepicker", (e, picker) => {
        this.customDateRange();
      });
    });
  }

  // handler function that receives the updated date range object
  updateRange(range: Range) {
    this.range = range;
    this.fullFilter(true);
  }

  // //for data filter by date range picker
  fullFilter(dateChange?) {
    this.companyService.getIncidents().subscribe((r) => {
      this.incidents = r.data;
      this.incidents.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      if (dateChange) {
        const actionSortData = [];
        const startDate = moment(this.range.fromDate).format("YYYY-MM-DD");
        const endDate = moment(this.range.toDate).format("YYYY-MM-DD");
        for (const incident of this.incidents) {
          if (incident.type.name === "Audit Action") {
            const mmtCreateDate = moment(incident.createdAt).format(
              "YYYY-MM-DD"
            );
            if (mmtCreateDate >= startDate && mmtCreateDate <= endDate) {
              let description = "";
              let branch = "";
              let status = "";
              for (const section of incident.data.sections) {
                for (const field of section.fields) {
                  if (field.fieldTitle === "Description") {
                    if (field.fieldValue && description == "") {
                      description = field.fieldValue;
                    }
                  }
                  if (field.fieldTitle === "Branch") {
                    if (field.fieldValue && branch == "") {
                      branch = field.fieldValue;
                    }
                  }
                }
              }

              if (description) {
                description =
                  description.length > 50
                    ? description.slice(0, 50) + ".."
                    : description;
                incident["shortDescription"] = description;
              }
              if (branch) {
                branch =
                  branch.length > 20 ? branch.slice(0, 20) + ".." : branch;
                incident["shortBranch"] = branch;
              }
              if (incident.status) {
                status = incident.status.name;
              }
              actionSortData.push({
                id: incident.id,
                status: incident.status,
                statusName: status,
                createdDate: incident.createdAt,
                branchName: incident.shortBranch,
                description: incident.shortDescription,
              });
            }
          }
          this.selectedIncidents = actionSortData;
        }
      }
    });
  }

  //for get created and other
  getWhenIncidentHappened(incident) {
    let date = null;
    let time = null;
    for (const section of incident.data.sections) {
      for (const field of section.fields) {
        if ("fieldType" in field && field.fieldType === "date") {
          date = new Date(field.fieldValue);
        } else if ("fieldType" in field && field.fieldType === "time") {
          time = new Date(field.fieldValue);
        }
      }
    }

    if (date && time && time != "Invalid Date") {
      date.setHours(time.getHours());
      date.setMinutes(time.getMinutes());

      return date;
    }
    return incident.createdAt;
  }

  //for actions view redirect
  goToActionsView(id) {
    var url = "/actions-view/" + id;
    var win = window.open(url, "_blank");
    win.focus();
  }
}
