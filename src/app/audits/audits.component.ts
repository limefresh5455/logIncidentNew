import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  QueryList,
  ViewChildren,
  Input,
} from "@angular/core";
import { CustomerService } from "../_services/customer.service";
import { CompanyService } from "../_services/company.service";
import { ActivatedRoute, Router } from "@angular/router";
import { User } from "../_models/user";
import { Chart } from "chart.js";
import { HttpClient } from "@angular/common/http";
import { NgxDrpOptions, PresetItem, Range } from "ngx-mat-daterange-picker";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
} from "@angular/forms";
import * as moment from "moment";
import { AngularCsv } from "angular7-csv";
import { MmtService } from "../_services/mmt.service";
import { IncidentsService } from "../_services/incidents.service";
import {
  NgbdSortableHeader,
  SortEvent,
} from "../_directives/sortable.directive";
declare var $: any;

const compare = (v1: string | number, v2: string | number) =>
  v1 < v2 ? -1 : v1 > v2 ? 1 : 0;

@Component({
  selector: "app-audits",
  templateUrl: "./audits.component.html",
  styleUrls: ["./audits.component.css"],
})
export class AuditsComponent implements OnInit {
  @Input() orderByReport: boolean = false;
  @Input() incidentTypes: any = [];
  @Input() mAudits: any = [];
  currentUser: User;
  mTourColor = null;

  branchList: any = [];
  mmtList: any = [];
  branchContainers: any = [];
  allDataList: any = [];
  mmtQuestionLists;
  questionList;

  closeResult: string;
  filterForm: FormGroup;

  //filter select options
  branchSelected: string = "All";
  completesSelected: string = "All";
  responseSelected: string = "All";
  branchFilter: any = [];
  branchGrouped: any = [];
  branchPkId;
  branchName;
  dueDate: string = "";
  reportDate: string = "";
  completedDate: string = "";
  classType;
  mmtCompletesList: any = [];
  mmtResponseList: any = [];
  loading: boolean = true;
  incidentId;
  branchId;
  auditsSortList;
  groupCompletes: any = [];
  usersList;
  reportIdList: any = [];

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
    private elementRef: ElementRef,
    private httpClient: HttpClient,
    private modalService: NgbModal,
    private formBuilder: FormBuilder,
    private incidentService: IncidentsService
  ) {
    const currentUser = this.customerService.getUser();
    this.mTourColor = currentUser.company.primary;
  }

  async ngOnInit() {
    //for create filter form
    this.filterForm = this.formBuilder.group({
      branch: ["All"],
      completes: ["All"],
      responsible: ["All"],
    });

    var r: any = [];

    //get branch list and branch filter list
    if(Object.keys(this.incidentTypes).length) {
       r = this.incidentTypes;
    } else {
       r = await this.incidentService.getIncidentTypes().toPromise();
    }

    //get audit branch list and branch filter list from api
    // this.incidentService.getIncidentTypes().subscribe((r) => {
      if (r.data) {
        for (var i = 0; i <= r.data.length; i++) {
          if (r.data[i]) {
            if (r.data[i].name == "Audits") {
              this.incidentId = r.data[i].id;
              var resp = this.mAudits;

                if(!Object.keys(this.mAudits).length) {
                    const monthRes = await this.mmtService
                      .getMonthlyTours(this.incidentId).toPromise();
                      resp = monthRes.data
                }
                  this.branchList = resp;
                  const auditsSortData = [];
                  for (const mmtq of this.branchList) {
                    this.mmtCompletesList.push(mmtq.branchauditor);
                    this.mmtResponseList.push(mmtq.branchsupervisor);
                    this.branchFilter.push(mmtq.branch);
                    var m = this.branchGrouped.findIndex(
                      (x) => x.branch.id == mmtq.branch.id
                    );
                    if (m <= -1) {
                      this.branchGrouped.push(mmtq);
                    }
                  }
                  for (const mmtq1 of this.branchGrouped) {
                    auditsSortData.push({
                      id: mmtq1.id,
                      branchId: mmtq1.branch.id,
                      branchName: mmtq1.branch.name,
                      reportDate: mmtq1.reportDate,
                      completesId: mmtq1.branchauditor.id,
                      completesUser: this.getGroupedObjectNames(
                        mmtq1.branch.id,
                        "completes"
                      ),
                      completesName: this.getGroupedNames(
                        mmtq1.branch.id,
                        "completes"
                      ),
                      responsibleId: mmtq1.branchsupervisor.id,
                      responsibleUser: this.getGroupedObjectNames(
                        mmtq1.branch.id,
                        "responsible"
                      ),
                      responsibleName: this.getGroupedNames(
                        mmtq1.branch.id,
                        "responsible"
                      ),
                      reportId: this.getGroupedId(mmtq1.branch.id),
                    });
                  }
                  if(this.orderByReport) {
                    const sorted = auditsSortData.sort( (a, b) => {
                      var keyA = new Date(a.reportDate);
                      var keyB = new Date(b.reportDate);
                      if (keyA < keyB) return -1;
                      if (keyA > keyB) return 1;
                      return 0;
                    });
                    this.auditsSortList = sorted;
                  } else {
                    this.auditsSortList = auditsSortData;
                  }
                // });
            }
          }
        }
      }
    // });
    this.customDateRange();
  }

  //for get all completes and responsible user object by id and type
  getGroupedObjectNames(branchId, types) {
    const completes = [];
    this.groupCompletes = this.branchList.filter(
      (o2) => branchId === o2.branch.id
    );
    for (const mmt of this.groupCompletes) {
      if (types == "completes") {
        var m = completes.findIndex((x) => x.id == mmt.branchauditor.id);
        if (m <= -1) {
          completes.push({
            id: mmt.branchauditor.id,
            name:
              mmt.branchauditor.firstName + " " + mmt.branchauditor.lastName,
            email: mmt.branchauditor.email,
          });
        }
      } else if (types == "responsible") {
        var m = completes.findIndex((x) => x.id == mmt.branchsupervisor.id);
        if (m <= -1) {
          completes.push({
            id: mmt.branchsupervisor.id,
            name:
              mmt.branchsupervisor.firstName +
              " " +
              mmt.branchsupervisor.lastName,
            email: mmt.branchsupervisor.email,
          });
        }
      }
    }
    this.usersList = completes;
    return this.usersList;
  }

  //for get all completes and responsible names by id and type
  getGroupedNames(branchId, types) {
    const completes = [];
    this.groupCompletes = this.branchList.filter(
      (o2) => branchId === o2.branch.id
    );
    for (const mmt of this.groupCompletes) {
      if (types == "completes") {
        completes.push(
          mmt.branchauditor.firstName + " " + mmt.branchauditor.lastName
        );
      } else if (types == "responsible") {
        completes.push(
          mmt.branchsupervisor.firstName + " " + mmt.branchsupervisor.lastName
        );
      }
    }
    this.usersList = completes;
    this.usersList = this.usersList.filter((v, i, a) => a.indexOf(v) === i);
    return this.usersList.join(", ");
  }

  //for get all status colors by id
  getGroupedId(branchId) {
    const reportIds = [];
    this.groupCompletes = this.branchList.filter(
      (o2) => branchId === o2.branch.id
    );
    for (const mmt of this.groupCompletes) {
      reportIds.push({ id: mmt.id });
    }
    this.reportIdList = reportIds;
    return this.reportIdList;
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
      this.auditsSortList = this.auditsSortList;
    } else {
      this.auditsSortList = [...this.auditsSortList].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === "asc" ? res : -res;
      });
    }
  }

  //get branch form field for filter
  get branch(): FormControl {
    return this.filterForm.get("branch") as FormControl;
  }

  //get completes user form field for filter
  get completes(): FormControl {
    return this.filterForm.get("completes") as FormControl;
  }

  //get responsoble user form field for filter
  get responsible(): FormControl {
    return this.filterForm.get("responsible") as FormControl;
  }

  //  TEST---BKP---230328

  //get colors status by branch id
  // getStatusColors(branchId, contents) {
  //   this.branchContainers = this.branchList.filter((o2) => branchId === o2.id);
  //   for (const mmtq of this.branchContainers) {
  //     if (contents == "colored") {
  //       if (mmtq.completedDate != null) {
  //         return "greenClass";
  //       } else if (mmtq.deliveredDate == null) {
  //         return "amberClass";
  //       } else if (mmtq.reportDate < mmtq.overdueDate) {
  //         return "redClass";
  //       } else {
  //         return "";
  //       }
  //     } else if (contents == "faIcon") {
  //       if (mmtq.completedDate != null) {
  //         return true;
  //       } else if (mmtq.deliveredDate == null) {
  //         return true;
  //       } else if (mmtq.reportDate < mmtq.overdueDate) {
  //         return true;
  //       } else {
  //         return null;
  //       }
  //     }
  //   }
  // }


  //get colors status by branch id
  getStatusColors(branchId:string, contents:string) {
    this.branchContainers = this.branchList.filter((o2) => branchId === o2.id);
    const now = new Date();
    for (const mmtq of this.branchContainers) {
      if (contents == "colored") {
        if(mmtq.overdueDate > now.toISOString()) {
          return "greyClass"
        }
        if (mmtq.completedDate != null) {
          if (mmtq.completedDate> mmtq.overdueDate) {
            return "amberClass"
          }
          return "greenClass";
        } else if (mmtq.deliveredDate == null) {
          return "purpleClass";
        } else if (now.toISOString() > mmtq.overdueDate) {
          return "redClass";
        } else {
          return "";
        }
      } else if (contents == "faIcon") {
        if (mmtq.completedDate != null) {
          return true;
        } else if (mmtq.deliveredDate == null) {
          return true;
        } else if (now.toISOString() > mmtq.overdueDate) {
          return true;
        } else {
          return null;
        }
      }
    }
  }

  

   cb(start, end) {
  
    $("#auditrange span").html(
      start.format("MMMM D, YYYY") +
        " - " +
        end.format("MMMM D, YYYY")
    );
  }
  //for custom bootstrap date range picker
  async customDateRange() {

    var r: any = [];

    //get branch list and branch filter list
    if(Object.keys(this.incidentTypes).length) {
       r = this.incidentTypes;
    } else {
       r = await this.incidentService.getIncidentTypes().toPromise();
    }

    // this.incidentService.getIncidentTypes().subscribe((r) => {
      if (r.data) {
        for (var i = 0; i <= r.data.length; i++) {
          if (r.data[i]) {
            if (r.data[i].name == "Audits") {
              this.incidentId = r.data[i].id;
              var resp = this.mAudits;

                if(!Object.keys(this.mAudits).length) {
                    const monthRes = await this.mmtService
                      .getMonthlyTours(this.incidentId).toPromise();
                      resp = monthRes.data
                }
                  this.branchList = resp;
                  const selectedDates = [];
                  const auditsSortData = [];
                  for (const mmt of this.branchList) {
                    var m = this.branchGrouped.findIndex(
                      (x) => x.branch.id == mmt.branch.id
                    );
                    if (m <= -1) {
                      this.branchGrouped.push(mmt);
                    }
                    selectedDates.push(
                      moment(mmt.reportDate).format("MM/DD/YYYY")
                    );
                  }
                  for (const mmtq1 of this.branchGrouped) {
                    auditsSortData.push({
                      id: mmtq1.id,
                      branchId: mmtq1.branch.id,
                      branchName: mmtq1.branch.name,
                      reportDate: mmtq1.reportDate,
                      completesId: mmtq1.branchauditor.id,
                      completesUser: this.getGroupedObjectNames(
                        mmtq1.branch.id,
                        "completes"
                      ),
                      completesName: this.getGroupedNames(
                        mmtq1.branch.id,
                        "completes"
                      ),
                      responsibleId: mmtq1.branchsupervisor.id,
                      responsibleUser: this.getGroupedObjectNames(
                        mmtq1.branch.id,
                        "responsible"
                      ),
                      responsibleName: this.getGroupedNames(
                        mmtq1.branch.id,
                        "responsible"
                      ),
                      reportId: this.getGroupedId(mmtq1.branch.id),
                    });
                  }
                  if(this.orderByReport) {
                    const sorted = auditsSortData.sort( (a, b) => {
                      var keyA = new Date(a.reportDate);
                      var keyB = new Date(b.reportDate);
                      if (keyA < keyB) return -1;
                      if (keyA > keyB) return 1;
                      return 0;
                    });
                    this.auditsSortList = sorted;
                  } else {
                    this.auditsSortList = auditsSortData;
                  }
                  const filterMonth = selectedDates
                    .map((item) => item)
                    .filter(
                      (value, index, self) => self.indexOf(value) === index
                    );

                  //const monthSort = filterMonth.sort();

                  /**
                   * Fixed SD
                   */
                  const monthSort = filterMonth
                    .sort(
                      (a, b) => new Date(b).valueOf() - new Date(a).valueOf()
                    )
                    .reverse();

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

                  // function cb(start, end) {
                  //   $("#auditrange span").html(
                  //     start.format("MMMM D, YYYY") +
                  //       " - " +
                  //       end.format("MMMM D, YYYY")
                  //   );
                  // }
                  $("#auditrange").daterangepicker(
                    {
                      locale: {
                        format: "DD/MM/YYYY",
                      },
                      startDate: start,
                      endDate: end,
                      maxDate: end,
                    },
                    this.cb(start, end)
                  );

                  this.cb(start, end);
                  // onclick apply in bootstrap daterange picker
                  $("#auditrange").on("apply.daterangepicker", (e, picker) => {
                    this.updateRange({
                      fromDate: new Date(
                        picker.startDate.format("MMMM D, YYYY")
                      ),
                      toDate: new Date(picker.endDate.format("MMMM D, YYYY")),
                    });
                  });

                  // onclick cancel in bootstrap daterange picker
                  $("#auditrange").on("cancel.daterangepicker", (e, picker) => {
                    this.customDateRange();
                  });
                // });
            }
          }
        }
      }
    // });
  }

  // handler function that receives the updated date range object
  updateRange(range: Range) {
    this.range = range;
    this.fullFilter(true);
  }

  // //for data filter by date range picker
  fullFilter(dateChange?) {
    this.mmtService.getMonthlyTours(this.incidentId).subscribe((res) => {
      this.mmtList = res.data;
      const monthData = [];
      const auditsSortData = [];
      if (dateChange) {
        const startDate = moment(this.range.fromDate).format("YYYY-MM-DD");
        const endDate = moment(this.range.toDate).format("YYYY-MM-DD");
        for (const mmtq of this.mmtList) {
          var m = this.branchGrouped.findIndex(
            (x) => x.branch.id == mmtq.branch.id
          );
          if (m <= -1) {
            this.branchGrouped.push(mmtq);
          }
        }
        for (const mmtq1 of this.branchGrouped) {
          auditsSortData.push({
            id: mmtq1.id,
            branchId: mmtq1.branch.id,
            branchName: mmtq1.branch.name,
            reportDate: mmtq1.reportDate,
            completesId: mmtq1.branchauditor.id,
            completesUser: this.getGroupedObjectNames(
              mmtq1.branch.id,
              "completes"
            ),
            completesName: this.getGroupedNames(mmtq1.branch.id, "completes"),
            responsibleId: mmtq1.branchsupervisor.id,
            responsibleUser: this.getGroupedObjectNames(
              mmtq1.branch.id,
              "responsible"
            ),
            responsibleName: this.getGroupedNames(
              mmtq1.branch.id,
              "responsible"
            ),
            reportId: this.getGroupedId(mmtq1.branch.id),
          });
        }
        for (const mmt of auditsSortData) {
          const mmtCreateDate = moment(mmt.reportDate).format("YYYY-MM-DD");
          if (mmtCreateDate >= startDate && mmtCreateDate <= endDate) {
            monthData.push(mmt);
          }
        }
        if(this.orderByReport) {
          const sorted = monthData.sort( (a, b) => {
            var keyA = new Date(a.reportDate);
            var keyB = new Date(b.reportDate);
            if (keyA < keyB) return -1;
            if (keyA > keyB) return 1;
            return 0;
          });
          this.auditsSortList = sorted;
        } else {
          this.auditsSortList = monthData;
        }
      }
    });
  }

  //for open mmt question modal
  openMmtQuestionModal(content, branchId) {

    for (const mmtq of this.branchList) {
      if (mmtq.id == branchId) {
        this.questionList = mmtq.questions;
        this.branchName = mmtq.branch.name;
        this.dueDate = mmtq.overdueDate;
        this.reportDate = mmtq.reportDate;
        this.completedDate = mmtq.completedDate;
        if (mmtq.completedDate != null) {
          this.branchPkId = mmtq.incidentId;
        } else {
          this.branchPkId = "";
        }
      }
    }
    this.modalService
      .open(content, { size: "lg", ariaLabelledBy: "modal-basic-title" })
      .result.then(
        (result) => {
          this.closeResult = `Closed with: ${result}`;
        },
        (reason) => {
          this.closeResult = `Dismissed`;
        }
      );

    this.loading = true;
    setTimeout(() => {
      this.loading = false;
      this.mmtQuestionLists = this.questionList;
    }, 1000);

    this.branchId = branchId;
    this.classType = this.getStatusColors(branchId, "colored");
  }

  //for open filter modal
  openFilterModal(filterModal) {
    this.modalService
      .open(filterModal, {
        backdrop: false,
        size: "lg",
        windowClass: "monthFilterClass",
        ariaLabelledBy: "modal-basic-title",
      })
      .result.then(
        (result) => {
          this.closeResult = `Closed with: ${result}`;
        },
        (reason) => {
          this.closeResult = `Dismissed`;
        }
      );
  }

  //for close filter question modal
  closeModal() {
    this.branch.setValue("All");
    this.completes.setValue("All");
    this.responsible.setValue("All");
    this.mmtService.getMonthlyTours(this.incidentId).subscribe((resp) => {
      this.branchList = resp.data;
      const auditsSortData = [];
      for (const mmt of this.branchList) {
        var m = this.branchGrouped.findIndex(
          (x) => x.branch.id == mmt.branch.id
        );
        if (m <= -1) {
          this.branchGrouped.push(mmt);
        }
      }
      for (const mmtq1 of this.branchGrouped) {
        auditsSortData.push({
          id: mmtq1.id,
          branchId: mmtq1.branch.id,
          branchName: mmtq1.branch.name,
          reportDate: mmtq1.reportDate,
          completesId: mmtq1.branchauditor.id,
          completesUser: this.getGroupedObjectNames(
            mmtq1.branch.id,
            "completes"
          ),
          completesName: this.getGroupedNames(mmtq1.branch.id, "completes"),
          responsibleId: mmtq1.branchsupervisor.id,
          responsibleUser: this.getGroupedObjectNames(
            mmtq1.branch.id,
            "responsible"
          ),
          responsibleName: this.getGroupedNames(mmtq1.branch.id, "responsible"),
          reportId: this.getGroupedId(mmtq1.branch.id),
        });
      }
      this.auditsSortList = auditsSortData;
    });
    this.modalService.dismissAll();
  }

  //for filter data on click apply on filterd modal
  applyFilter() {
    this.branchSelected = this.filterForm.controls["branch"].value;
    this.completesSelected = this.filterForm.controls["completes"].value;
    this.responseSelected = this.filterForm.controls["responsible"].value;
    this.mmtService.getMonthlyTours(this.incidentId).subscribe((resp) => {
      this.branchList = resp.data;
      const filteredSelectedBranch = [];
      const auditsSortData = [];
      if (this.branchList) {
        for (const mmt of this.branchList) {
          var m = this.branchGrouped.findIndex(
            (x) => x.branch.id == mmt.branch.id
          );
          if (m <= -1) {
            this.branchGrouped.push(mmt);
          }
        }
        for (const mmtq1 of this.branchGrouped) {
          auditsSortData.push({
            id: mmtq1.id,
            branchId: mmtq1.branch.id,
            branchName: mmtq1.branch.name,
            reportDate: mmtq1.reportDate,
            completesId: mmtq1.branchauditor.id,
            completesUser: this.getGroupedObjectNames(
              mmtq1.branch.id,
              "completes"
            ),
            completesName: this.getGroupedNames(mmtq1.branch.id, "completes"),
            responsibleId: mmtq1.branchsupervisor.id,
            responsibleUser: this.getGroupedObjectNames(
              mmtq1.branch.id,
              "responsible"
            ),
            responsibleName: this.getGroupedNames(
              mmtq1.branch.id,
              "responsible"
            ),
            reportId: this.getGroupedId(mmtq1.branch.id),
          });
        }
        for (const mmtq of auditsSortData) {
          if (this.branchSelected == mmtq.branchName) {
            filteredSelectedBranch.push(mmtq);
          } else if (this.completesSelected == mmtq.completesName) {
            filteredSelectedBranch.push(mmtq);
          } else if (this.responseSelected == mmtq.responsibleName) {
            filteredSelectedBranch.push(mmtq);
          } else if (
            this.branchSelected == "All" &&
            this.completesSelected == "All" &&
            this.responseSelected == "All"
          ) {
            filteredSelectedBranch.push(mmtq);
          }
        }
      }
      if(this.orderByReport) {
        const sorted = filteredSelectedBranch.sort( (a, b) => {
          var keyA = new Date(a.reportDate);
          var keyB = new Date(b.reportDate);
          if (keyA < keyB) return -1;
          if (keyA > keyB) return 1;
          return 0;
        });
        this.auditsSortList = sorted;
      } else {
        this.auditsSortList = filteredSelectedBranch;
      }
      this.modalService.dismissAll();
    });
  }

  //for generate csv file onclick export on filtered modal
  exportCsv() {
    this.branchSelected = this.filterForm.controls["branch"].value;
    this.completesSelected = this.filterForm.controls["completes"].value;
    this.responseSelected = this.filterForm.controls["responsible"].value;
    this.mmtService.getMonthlyTours(this.incidentId).subscribe((resp) => {
      this.branchList = resp.data;
      const filteredSelectedBranch = [];
      const auditsSortData = [];
      const exportData = [];
      if (this.branchList) {
        for (const mmt of this.branchList) {
          var m = this.branchGrouped.findIndex(
            (x) => x.branch.id == mmt.branch.id
          );
          if (m <= -1) {
            this.branchGrouped.push(mmt);
          }
        }
        for (const mmtq1 of this.branchGrouped) {
          auditsSortData.push({
            id: mmtq1.id,
            branchId: mmtq1.branch.id,
            branchName: mmtq1.branch.name,
            reportDate: mmtq1.reportDate,
            completesId: mmtq1.branchauditor.id,
            completesUser: this.getGroupedObjectNames(
              mmtq1.branch.id,
              "completes"
            ),
            completesName: this.getGroupedNames(mmtq1.branch.id, "completes"),
            responsibleId: mmtq1.branchsupervisor.id,
            responsibleUser: this.getGroupedObjectNames(
              mmtq1.branch.id,
              "responsible"
            ),
            responsibleName: this.getGroupedNames(
              mmtq1.branch.id,
              "responsible"
            ),
            reportId: this.getGroupedId(mmtq1.branch.id),
          });
        }
        for (const mmtq of auditsSortData) {
          if (this.branchSelected == mmtq.branchName) {
            filteredSelectedBranch.push(mmtq);
          } else if (this.completesSelected == mmtq.completesName) {
            filteredSelectedBranch.push(mmtq);
          } else if (this.responseSelected == mmtq.responsibleName) {
            filteredSelectedBranch.push(mmtq);
          } else if (
            this.branchSelected == "All" &&
            this.completesSelected == "All" &&
            this.responseSelected == "All"
          ) {
            filteredSelectedBranch.push(mmtq);
          }
        }
      }
      for (var i = 0; i < filteredSelectedBranch.length; i++) {
        exportData.push({
          id: filteredSelectedBranch[i].id,
          branch_name: filteredSelectedBranch[i].branchName,
          completes: filteredSelectedBranch[i].completesName,
          responsible: filteredSelectedBranch[i].responsibleName,
        });
      }

      exportData.forEach((key) => {
        if (this.getStatusColors(key.id, "colored") == "amberClass") {
          key["Status"] = "";
        } else if (this.getStatusColors(key.id, "colored") == "redClass") {
          key["Status"] = "Incompletes";
        } else if (this.getStatusColors(key.id, "colored") == "greenClass") {
          key["Status"] = "Completes";
        }
      });

      const currentDate = new Date();
      const title = `Audits Report ${currentDate.toLocaleString()}`;
      var options = {
        showTitle: true,
        title: title.split(",").join(" "),
        headers: ["ID", "Branch Name", "Completes", "Responsible", "Status"],
      };

      if (exportData.length > 0) {
        new AngularCsv(exportData, "Audits Report", options);
        this.modalService.dismissAll();
      }
    });
  }

  filterMonthData(date, month){
    return ((new Date(date).getMonth()+1)==month)
  }

   getMonthBranchList(id) {
    return this.branchList.filter(data => data.id === id).map(data => data.reportDate);
  }
}
