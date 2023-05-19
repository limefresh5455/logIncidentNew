import { Component, ElementRef, OnInit, ViewChild, Directive, EventEmitter, Input, Output, QueryList, ViewChildren } from '@angular/core';
import { CustomerService } from '../_services/customer.service';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from '../_models/user';
import { Chart } from 'chart.js';
import { HttpClient } from "@angular/common/http";
import { NgxDrpOptions, PresetItem, Range } from 'ngx-mat-daterange-picker';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import * as moment from 'moment';
import { AngularCsv } from 'angular7-csv';
import { SosService } from '../_services/sos.service';
import { IncidentsService } from '../_services/incidents.service';
import { NgbdSortableHeader, SortEvent } from '../_directives/sortable.directive';
import { componentNeedsResolution } from '@angular/core/src/metadata/resource_loading';
declare var $: any;

const compare = (v1: string | number, v2: string | number) => v1 < v2 ? -1 : v1 > v2 ? 1 : 0;

@Component({
  selector: 'app-sos',
  templateUrl: './sos.component.html',
  styleUrls: ['./sos.component.css']
})
export class SosComponent implements OnInit {

  sosView = true;
  currentUser: User;
  sosColor = null;
  accentColor = null;

  public show: boolean = true;
  public buttonName: any = 'Graph';
  public loading: boolean;
  closeResult: string;
  filterForm: FormGroup;

  p: number = 1;
  sosData: any = [];
  sosDataList;
  sosReported: any = [];
  sosUsers: any = [];
  public errorShow: boolean = false;
  allLength: any = [];
  SosGraphCountChart;
  sosValue: boolean = false;
  // date range
  fromDate;
  toDate;
  initUpdateRange = false; // tells if initial updateRange was already called. Initializatio of date range picker calls updateRange()
  range: any = { fromDate: '', toDate: '' };
  options: NgxDrpOptions;
  presets: Array<PresetItem> = [];

  //filter select options
  ratingSelected: string = 'All';
  reportedSelected: string = 'All';
  usersSelected: string = 'All';

  incidentId;
  sosTitle;

  @ViewChildren(NgbdSortableHeader) headers: QueryList<NgbdSortableHeader>;

  constructor(
    private customerService: CustomerService,
    private sosService: SosService,
    private router: Router,
    private elementRef: ElementRef,
    private httpClient: HttpClient,
    private modalService: NgbModal,
    private formBuilder: FormBuilder,
    private incidentService: IncidentsService,
  ) {
    const currentUser = this.customerService.getUser();
    this.sosColor = currentUser.company.primary;
    this.accentColor = currentUser.company.accent;
  }

  ngOnInit() {
    this.incidentService.getIncidentTypes().subscribe(
      r => {
        if (r.data) {
          for (var i = 0; i <= r.data.length; i++) {
            if (r.data[i]) {
              if (r.data[i].name == "Safe on Site") {
                this.sosValue = true;
              }
            }
          }
        }
        if (this.sosValue) {
          this.loadSosData();
        } else {
          this.router.navigateByUrl('/404');
        }
      }
    )
  }

  //For load Sos value data 
  loadSosData() {
    this.filterForm = this.formBuilder.group({
      ratings: ['All'],
      reported_by: ['All'],
      user_name: ['All']
    });
    this.customDateRange();
    this.getAllSosData();
    this.getGraphData();
  }

  //for table header row sorting
  onSort({ column, direction }: SortEvent) {
    // resetting other headers
    this.headers.forEach(header => {
      if (header.sortable !== column) {
        header.direction = '';
      }
    });
    // sorting sos list
    if (direction === '' || column === '') {
      this.sosDataList = this.sosDataList;
    } else {
      this.sosDataList = [...this.sosDataList].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }

  //get all sos data by incident id
  getAllSosData() {
    this.incidentService.getIncidentTypes().subscribe(
      r => {
        if (r.data) {
          for (var i = 0; i <= r.data.length; i++) {
            if (r.data[i]) {
              if (r.data[i].name == "Safe on Site") {
                this.incidentId = r.data[i].id;
                this.sosTitle = r.data[i].name;
                this.sosService.getSoSIncidentsById(this.incidentId).subscribe(
                  res => {
                    this.sosData = res.data;
                    this.sosData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    const sosSortData = [];
                    for (const sos of this.sosData) {
                      sosSortData.push({
                        'id': sos.id,
                        'name': sos.user.firstName + ' ' + sos.user.lastName,
                        'attendee': sos.sosdata.report.attendee,
                        'createdAt': sos.createdAt,
                        'overall': this.getOverallRatings(sos.id),
                        'bodyposition': this.getTotalRating('section1bodyposition', sos.id),
                        'procedures': this.getTotalRating('section2procedures', sos.id),
                        'ppe': this.getTotalRating('section3personalprotectiveequipment', sos.id),
                        'toolsequipment': this.getTotalRating('section4toolsandequipement', sos.id),
                        'other': this.getTotalRating('section5other', sos.id),
                        'sitespecific': this.getTotalRating('section6sitespecific', sos.id),
                      });
                      this.sosReported.push(sos.sosdata.report.attendee);
                      const username = sos.user.firstName + ' ' + sos.user.lastName;
                      this.sosUsers.push(username);
                    }
                    this.sosDataList = sosSortData;
                    this.sosReported = this.sosReported.filter((v, i, a) => a.indexOf(v) === i);
                    this.sosReported.unshift('All');
                    this.filterForm.get('reported_by').setValue(this.sosReported);
                    this.sosUsers = this.sosUsers.filter((v, i, a) => a.indexOf(v) === i);
                    this.sosUsers.unshift('All');
                    this.filterForm.get('user_name').setValue(this.sosUsers);
                  }, e => {
                    this.router.navigateByUrl('/login');
                  }
                );
              }
            }
          }
        }
      });
  }

  //get total count of ratings by section name
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

  //get over all count of ratings
  getOverallRatings(reportId) {
    return this.getTotalRating('section1bodyposition', reportId) + this.getTotalRating('section2procedures', reportId) + this.getTotalRating('section3personalprotectiveequipment', reportId) + this.getTotalRating('section4toolsandequipement', reportId) + this.getTotalRating('section5other', reportId) + this.getTotalRating('section6sitespecific', reportId);
  }

  //get form ratings field
  get ratings(): FormControl {
    return this.filterForm.get('ratings') as FormControl;
  }

  //get form reported_by field
  get reported_by(): FormControl {
    return this.filterForm.get('reported_by') as FormControl;
  }

  //get form user_name field
  get user_name(): FormControl {
    return this.filterForm.get('user_name') as FormControl;
  }

  selectAllReported(ev1) {
    if (ev1.value == 'All') {
      if (ev1._selected) {
        this.reported_by.setValue(this.sosReported);
        ev1._selected = true;
      }
      if (ev1._selected == false) {
        this.reported_by.setValue([]);
        this.filterForm.controls.reported_by.patchValue([]);
      }
    } else {
      if (ev1._selected == false) {
        let reported = this.reported_by.value;
        const index = reported.indexOf('All');
        if (index == 0 || index > 0) {
          reported.splice(index, 1);
        }
        this.reported_by.setValue(reported);
      } else if (this.sosReported.length - 1 == this.reported_by.value.length) {
        this.reported_by.setValue(this.sosReported);
      }
    }
  }

  selectAllUsers(ev1) {
    if (ev1.value == 'All') {
      if (ev1._selected) {
        this.user_name.setValue(this.sosUsers);
        ev1._selected = true;
      }
      if (ev1._selected == false) {
        this.user_name.setValue([]);
        this.filterForm.controls.user_name.patchValue([]);
      }
    } else {
      if (ev1._selected == false) {
        let reported = this.user_name.value;
        const index = reported.indexOf('All');
        if (index == 0 || index > 0) {
          reported.splice(index, 1);
        }
        this.user_name.setValue(reported);
      } else if (this.sosUsers.length - 1 == this.user_name.value.length) {
        this.user_name.setValue(this.sosUsers);
      }
    }
  }

  //for sos view redirect
  goToSosView(id) {
    var url = '/sos/view/' + id;
    var win = window.open(url, '_blank');
    win.focus();
  }

  //for toggle graph and table in sos
  toggle() {
    this.show = !this.show;
    if (this.show) {
      this.buttonName = "Graph";
    } else {
      this.buttonName = "Table";
      this.loading = true;
      setTimeout(() => {
        this.loading = false;
        this.createSosDetailSummaryChart(this.ratingSelected);
        if (this.SosGraphCountChart) {
          this.filterGraph();
        }
      }, 1000);
    }
  }

  //for custom bootstrap date range picker
  customDateRange() {
    this.incidentService.getIncidentTypes().subscribe(r => {
      if (r.data) {
        for (var i = 0; i <= r.data.length; i++) {
          if (r.data[i]) {
            if (r.data[i].name == "Safe on Site") {
              this.incidentId = r.data[i].id;
              this.sosService.getSoSIncidentsById(this.incidentId).subscribe(res => {
                this.sosData = res.data;
                this.sosData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                const sosSortData = [];
                const selectedDates = [];
                for (const sos of this.sosData) {
                  sosSortData.push({
                    'id': sos.id,
                    'name': sos.user.firstName + ' ' + sos.user.lastName,
                    'attendee': sos.sosdata.report.attendee,
                    'createdAt': sos.createdAt,
                    'overall': this.getOverallRatings(sos.id),
                    'bodyposition': this.getTotalRating('section1bodyposition', sos.id),
                    'procedures': this.getTotalRating('section2procedures', sos.id),
                    'ppe': this.getTotalRating('section3personalprotectiveequipment', sos.id),
                    'toolsequipment': this.getTotalRating('section4toolsandequipement', sos.id),
                    'other': this.getTotalRating('section5other', sos.id),
                    'sitespecific': this.getTotalRating('section6sitespecific', sos.id),
                  });
                  selectedDates.push(moment(sos.createdAt).format('MM/DD/YYYY'));
                }
                this.sosDataList = sosSortData;
                const filterMonth = selectedDates.map(item => item).filter((value, index, self) => self.indexOf(value) === index);
                const monthSort = filterMonth.sort((b, a) => new Date(b).getTime() - new Date(a).getTime());
                const firstDate = new Date(monthSort[monthSort.length - monthSort.length]);
                this.fromDate = new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate(), 0, 0, 0);
                const secondDate = new Date(monthSort[monthSort.length - 1]);
                this.toDate = new Date(secondDate.getFullYear(), secondDate.getMonth(), secondDate.getDate(), 0, 0, 0);
                var start = moment(this.fromDate);
                var end = moment(this.toDate);

                function cb(start, end) {
                  $('#sosrange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
                }
                $('#sosrange').daterangepicker({
                  locale: {
                    format: 'DD/MM/YYYY'
                  },
                  startDate: start,
                  endDate: end,
                  maxDate: moment(),
                  ranges: {
                    'Today': [moment(), moment()],
                    'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                    'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                    'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                    'This Month': [moment().startOf('month'), moment().endOf('month')],
                    'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
                  }
                }, cb);

                cb(start, end);
                // onclick apply in bootstrap daterange picker
                $('#sosrange').on('apply.daterangepicker', (e, picker) => {
                  this.updateRange({ fromDate: new Date(picker.startDate.format('MMMM D, YYYY')), toDate: new Date(picker.endDate.format('MMMM D, YYYY')) });
                });

                // onclick cancel in bootstrap daterange picker
                $('#sosrange').on('cancel.daterangepicker', (e, picker) => {
                  this.closeModal();
                });
              });
            }
          }
        }
      }
    });
  }

  // handler function that receives the updated date range object
  updateRange(range: any) {
    this.range = range;
    this.fullFilter(true);
    if (this.SosGraphCountChart) {
      this.fullFilterGraph(true);
    }
  }

  //for custom bootstrap date range picker
  customDateRange1(dates) {
    this.incidentService.getIncidentTypes().subscribe(r => {
      if (r.data) {
        for (var i = 0; i <= r.data.length; i++) {
          if (r.data[i]) {
            if (r.data[i].name == "Safe on Site") {
              this.incidentId = r.data[i].id;
              this.sosService.getSoSIncidentsById(this.incidentId).subscribe(res => {
                this.sosData = res.data;
                this.sosData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                const sosSortData = [];
                const selectedDates = [];
                for (const sos of this.sosData) {
                  selectedDates.push(moment(sos.createdAt).format('MM/DD/YYYY'));
                }
                const filterMonth = selectedDates.map(item => item).filter((value, index, self) => self.indexOf(value) === index);
                const monthSort = filterMonth.sort((b, a) => new Date(b).getTime() - new Date(a).getTime());
                const firstDate = new Date(monthSort[monthSort.length - monthSort.length]);
                this.fromDate = new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate(), 0, 0, 0);
                const secondDate = new Date(monthSort[monthSort.length - 1]);
                this.toDate = new Date(secondDate.getFullYear(), secondDate.getMonth(), secondDate.getDate(), 0, 0, 0);
                var start = moment(this.fromDate);
                var end = moment(this.toDate);
                this.updateRange1({ fromDate: new Date(start.format('MMMM D, YYYY')), toDate: new Date(end.format('MMMM D, YYYY')) });
                function cb(start, end) {
                  $('#sosrange1 span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
                }
                $('#sosrange1').daterangepicker({
                  parentEl: $('.filterClass'),
                  locale: {
                    format: 'DD/MM/YYYY'
                  },
                  opens: 'left',
                  startDate: start,
                  endDate: end,
                  maxDate: moment(),
                  ranges: {
                    'Today': [moment(), moment()],
                    'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                    'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                    'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                    'This Month': [moment().startOf('month'), moment().endOf('month')],
                    'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
                  }
                }, cb);
                $('.drp-calendar.right').hide();
                $('.drp-calendar.left').addClass('single');
                $('.calendar-table').on('DOMSubtreeModified', function () {
                  var el = $(".prev.available").parent().children().last();
                  if (el.hasClass('next available')) {
                    return;
                  }
                  el.addClass('next available');
                  el.append('<span></span>');
                });

                if (dates.fromDate == '') {
                  cb(start, end);
                } else {
                  cb(moment(dates.fromDate), moment(dates.toDate));
                }
                // onclick apply in bootstrap daterange picker
                $('#sosrange1').on('apply.daterangepicker', (e, picker) => {
                  this.updateRange1({ fromDate: new Date(picker.startDate.format('MMMM D, YYYY')), toDate: new Date(picker.endDate.format('MMMM D, YYYY')) });
                });

                // onclick cancel in bootstrap daterange picker
                $('#sosrange1').on('cancel.daterangepicker', (e, picker) => {
                  this.closeModal();
                });
              });
            }
          }
        }
      }
    });
  }

  // handler function that receives the updated date range object
  updateRange1(range: any) {
    this.range = range;
  }

  //get sos data by date range filter
  fullFilter(dateChange?) {
    this.sosService.getSoSIncidentsById(this.incidentId).subscribe(res => {
      this.sosData = res.data;
      this.sosData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const sosSortData = [];
      const filteredSelectedSos = [];
      if (dateChange) {
        if (this.sosData) {
          if (this.sosData == undefined) {
            this.sosData = this.sosData;
          }
          const startDate = moment(this.range.fromDate).format('YYYY-MM-DD');
          const endDate = moment(this.range.toDate).format('YYYY-MM-DD');
          for (const sos of this.sosData) {
            sosSortData.push({
              'id': sos.id,
              'name': sos.user.firstName + ' ' + sos.user.lastName,
              'attendee': sos.sosdata.report.attendee,
              'createdAt': sos.createdAt,
              'overall': this.getOverallRatings(sos.id),
              'bodyposition': this.getTotalRating('section1bodyposition', sos.id),
              'procedures': this.getTotalRating('section2procedures', sos.id),
              'ppe': this.getTotalRating('section3personalprotectiveequipment', sos.id),
              'toolsequipment': this.getTotalRating('section4toolsandequipement', sos.id),
              'other': this.getTotalRating('section5other', sos.id),
              'sitespecific': this.getTotalRating('section6sitespecific', sos.id),
            });
          }
          for (const sos of sosSortData) {
            const sosDate = moment(sos.createdAt).format('YYYY-MM-DD');
            if (sosDate >= startDate && sosDate <= endDate) {
              filteredSelectedSos.push(sos);
            }
          }
        }
        this.sosDataList = filteredSelectedSos;
        this.p = 1;
      }
    })
  }

  //open filter modal on click filter button
  openFilterModal(filterModal) {
    this.customDateRange1(this.range);
    this.modalService.open(filterModal, { backdrop: false, size: "lg", windowClass: 'filterClass', ariaLabelledBy: 'modal-basic-title' }).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.closeResult = `Dismissed`;
    });
  }

  //close filter modal on click close button
  closeModal() {
    this.ratings.setValue('All');
    this.reported_by.setValue(this.sosReported);
    this.user_name.setValue(this.sosUsers);
    this.sosService.getSoSIncidentsById(this.incidentId).subscribe(res => {
      this.sosData = res.data;
      this.sosData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const sosSortData = [];
      for (const sos of this.sosData) {
        sosSortData.push({
          'id': sos.id,
          'name': sos.user.firstName + ' ' + sos.user.lastName,
          'attendee': sos.sosdata.report.attendee,
          'createdAt': sos.createdAt,
          'overall': this.getOverallRatings(sos.id),
          'bodyposition': this.getTotalRating('section1bodyposition', sos.id),
          'procedures': this.getTotalRating('section2procedures', sos.id),
          'ppe': this.getTotalRating('section3personalprotectiveequipment', sos.id),
          'toolsequipment': this.getTotalRating('section4toolsandequipement', sos.id),
          'other': this.getTotalRating('section5other', sos.id),
          'sitespecific': this.getTotalRating('section6sitespecific', sos.id),
        });
      }
      this.sosDataList = sosSortData;
      this.customDateRange();
    }, e => {
      this.router.navigateByUrl('/login');
    });
    if (this.SosGraphCountChart) {
      this.filterGraph();
    }
    this.modalService.dismissAll();
  }

  //for filter data on click apply on filterd modal
  applyFilter() {
    this.ratingSelected = this.filterForm.controls['ratings'].value;
    this.reportedSelected = this.filterForm.controls['reported_by'].value;
    this.usersSelected = this.filterForm.controls['user_name'].value;
    this.sosService.getSoSIncidentsById(this.incidentId).subscribe(res => {
      this.sosData = res.data;
      this.sosData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const sosSortData = [];
      const filteredSelectedSos = [];
      if (this.sosData) {
        for (const sos of this.sosData) {
          sosSortData.push({
            'id': sos.id,
            'name': sos.user.firstName + ' ' + sos.user.lastName,
            'attendee': sos.sosdata.report.attendee,
            'createdAt': sos.createdAt,
            'overall': this.getOverallRatings(sos.id),
            'bodyposition': this.getTotalRating('section1bodyposition', sos.id),
            'procedures': this.getTotalRating('section2procedures', sos.id),
            'ppe': this.getTotalRating('section3personalprotectiveequipment', sos.id),
            'toolsequipment': this.getTotalRating('section4toolsandequipement', sos.id),
            'other': this.getTotalRating('section5other', sos.id),
            'sitespecific': this.getTotalRating('section6sitespecific', sos.id),
          });
        }
      }
      const startDate = moment(this.range.fromDate).format('YYYY-MM-DD');
      const endDate = moment(this.range.toDate).format('YYYY-MM-DD');
      for (const sos of sosSortData) {
        const sosDate = moment(sos.createdAt).format('YYYY-MM-DD');
        if (sosDate >= startDate && sosDate <= endDate) {
          for (var i = 0; i < this.reportedSelected.length; i++) {
            for (var j = 0; j < this.usersSelected.length; j++) {
              if ((this.reportedSelected[i] == sos.attendee) && (this.usersSelected[j] == sos.name) && (this.ratingSelected == "All")) {
                filteredSelectedSos.push(sos);
              } else if ((this.reportedSelected[i] == sos.attendee) && (this.usersSelected[j] == sos.name) && (this.ratingSelected == "Low")) {
                if (sos.overall == 0) {
                  filteredSelectedSos.push(sos);
                }
              } else if ((this.reportedSelected[i] == sos.attendee) && (this.usersSelected[j] == sos.name) && (this.ratingSelected == "Medium")) {
                if ((sos.overall > 0) && (sos.overall < 11)) {
                  filteredSelectedSos.push(sos);
                }
              } else if ((this.reportedSelected[i] == sos.attendee) && (this.usersSelected[j] == sos.name) && (this.ratingSelected == "High")) {
                if (sos.overall >= 12) {
                  filteredSelectedSos.push(sos);
                }
              }
            }
          }

          if ((this.reportedSelected == "") && (this.usersSelected == "") && (this.ratingSelected == "All")) {
            filteredSelectedSos.push(sos);
          } else if ((this.reportedSelected == "") && (this.usersSelected == "") && (this.ratingSelected == "Low")) {
            if (sos.overall == 0) {
              filteredSelectedSos.push(sos);
            }
          } else if ((this.reportedSelected == "") && (this.usersSelected == "") && (this.ratingSelected == "Medium")) {
            if ((sos.overall > 0) && (sos.overall < 11)) {
              filteredSelectedSos.push(sos);
            }
          } else if ((this.reportedSelected == "") && (this.usersSelected == "") && (this.ratingSelected == "High")) {
            if (sos.overall >= 12) {
              filteredSelectedSos.push(sos);
            }
          }
        }
      }
      this.sosDataList = filteredSelectedSos;
      this.p = 1;
      this.modalService.dismissAll();
    })
  }

  //for generate csv file onclick export on filtered modal
  exportCsv() {
    this.ratingSelected = this.filterForm.controls['ratings'].value;
    this.reportedSelected = this.filterForm.controls['reported_by'].value;
    this.usersSelected = this.filterForm.controls['user_name'].value;
    this.sosService.getSoSIncidentsById(this.incidentId).subscribe(res => {
      this.sosData = res.data;
      this.sosData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const filteredSelectedSos = [];
      const exportData = [];
      const sosSortData = [];
      if (this.sosData) {
        for (const sos of this.sosData) {
          sosSortData.push({
            'id': sos.id,
            'name': sos.user.firstName + ' ' + sos.user.lastName,
            'attendee': sos.sosdata.report.attendee,
            'createdAt': sos.createdAt,
            'overall': this.getOverallRatings(sos.id),
            'bodyposition': this.getTotalRating('section1bodyposition', sos.id),
            'procedures': this.getTotalRating('section2procedures', sos.id),
            'ppe': this.getTotalRating('section3personalprotectiveequipment', sos.id),
            'toolsequipment': this.getTotalRating('section4toolsandequipement', sos.id),
            'other': this.getTotalRating('section5other', sos.id),
            'sitespecific': this.getTotalRating('section6sitespecific', sos.id),
          });
        }
      }

      const startDate = moment(this.range.fromDate).format('YYYY-MM-DD');
      const endDate = moment(this.range.toDate).format('YYYY-MM-DD');
      for (const sos of sosSortData) {
        const sosDate = moment(sos.createdAt).format('YYYY-MM-DD');
        if (sosDate >= startDate && sosDate <= endDate) {
          for (var i = 0; i < this.reportedSelected.length; i++) {
            for (var j = 0; j < this.usersSelected.length; j++) {
              if ((this.reportedSelected[i] == sos.attendee) && (this.usersSelected[j] == sos.name) && (this.ratingSelected == "All")) {
                filteredSelectedSos.push(sos);
              } else if ((this.reportedSelected[i] == sos.attendee) && (this.usersSelected[j] == sos.name) && (this.ratingSelected == "Low")) {
                if (sos.overall == 0) {
                  filteredSelectedSos.push(sos);
                }
              } else if ((this.reportedSelected[i] == sos.attendee) && (this.usersSelected[j] == sos.name) && (this.ratingSelected == "Medium")) {
                if ((sos.overall > 0) && (sos.overall < 11)) {
                  filteredSelectedSos.push(sos);
                }
              } else if ((this.reportedSelected[i] == sos.attendee) && (this.usersSelected[j] == sos.name) && (this.ratingSelected == "High")) {
                if (sos.overall >= 12) {
                  filteredSelectedSos.push(sos);
                }
              }
            }
          }

          if ((this.reportedSelected == "") && (this.usersSelected == "") && (this.ratingSelected == "All")) {
            filteredSelectedSos.push(sos);
          } else if ((this.reportedSelected == "") && (this.usersSelected == "") && (this.ratingSelected == "Low")) {
            if (sos.overall == 0) {
              filteredSelectedSos.push(sos);
            }
          } else if ((this.reportedSelected == "") && (this.usersSelected == "") && (this.ratingSelected == "Medium")) {
            if ((sos.overall > 0) && (sos.overall < 11)) {
              filteredSelectedSos.push(sos);
            }
          } else if ((this.reportedSelected == "") && (this.usersSelected == "") && (this.ratingSelected == "High")) {
            if (sos.overall >= 12) {
              filteredSelectedSos.push(sos);
            }
          }
        }
      }

      for (var i = 0; i < filteredSelectedSos.length; i++) {
        exportData.push({ 'id': filteredSelectedSos[i].id, 'name': filteredSelectedSos[i].name, 'attendee': filteredSelectedSos[i].attendee, 'createdate': moment(filteredSelectedSos[i].createdAt).format('DD/MM/YYYY'), 'overall': filteredSelectedSos[i].overall, 'bodyposition': filteredSelectedSos[i].bodyposition, 'procedures': filteredSelectedSos[i].procedures, 'ppe': filteredSelectedSos[i].ppe, 'tools&equipment': filteredSelectedSos[i].toolsequipment, 'other': filteredSelectedSos[i].other, 'sitespecific': filteredSelectedSos[i].sitespecific });
      }

      const currentDate = new Date();
      const title = `Safe On Site Report ${currentDate.toLocaleString()}`;
      var options = {
        showTitle: true,
        title: title.split(',').join(' '),
        headers: ["ID", "Name", "Attendees", "Created", "Overall", "Body Position", "Procedures", "PPE", "Tools & Equipment", "Other", "Site Specific"],
      };

      if (exportData.length > 0) {
        this.errorShow = false;
        new AngularCsv(exportData, 'Sos Report', options);
        this.modalService.dismissAll();
        this.sosDataList = sosSortData;
      } else {
        this.errorShow = true;
      }
    })
  }

  //for graph(chart) view
  createSosDetailSummaryChart(ratings) {
    const htmlRef = this.elementRef.nativeElement.querySelector(`#sos_detail_summary_chart`);
    const datasets = [];
    if (htmlRef != null) {
      for (const dataLength of this.allLength) {
        if (ratings == "All") {
          datasets.push({
            backgroundColor: dataLength.color,
            data: dataLength.count,
            label: dataLength.series
          });
        }
        if (ratings == dataLength.series) {
          datasets.push({
            backgroundColor: dataLength.color,
            data: dataLength.count,
            label: dataLength.series
          });
        }
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
            xAxes: [{ ticks: { beginAtZero: true } }]
          }
        }
      };
      this.SosGraphCountChart = new Chart(htmlRef, config);
      this.modalService.dismissAll();
    }
  }

  //for graph data filter
  filterGraph() {
    this.ratingSelected = this.filterForm.controls['ratings'].value;
    this.reportedSelected = this.filterForm.controls['reported_by'].value;
    this.usersSelected = this.filterForm.controls['user_name'].value;
    const startDate = moment(this.range.fromDate).format('YYYY-MM-DD');
    const endDate = moment(this.range.toDate).format('YYYY-MM-DD');
    this.sosService.getSoSIncidentsById(this.incidentId).subscribe(res => {
      this.sosData = res.data;
      const datasets = [];
      const datasets2 = [];
      const filterData = [];

      const section1Low = [];
      const section1Mid = [];
      const section1High = [];
      const section2Low = [];
      const section2Mid = [];
      const section2High = [];
      const section3Low = [];
      const section3Mid = [];
      const section3High = [];
      const section4Low = [];
      const section4Mid = [];
      const section4High = [];
      const section5Low = [];
      const section5Mid = [];
      const section5High = [];
      const section6Low = [];
      const section6Mid = [];
      const section6High = [];

      const users1Low = [];
      const users1Mid = [];
      const users1High = [];
      const users2Low = [];
      const users2Mid = [];
      const users2High = [];
      const users3Low = [];
      const users3Mid = [];
      const users3High = [];
      const users4Low = [];
      const users4Mid = [];
      const users4High = [];
      const users5Low = [];
      const users5Mid = [];
      const users5High = [];
      const users6Low = [];
      const users6Mid = [];
      const users6High = [];
      const labels = ['Body Position', 'Procedures', 'PPE', 'Tools & Equipment', 'Other', 'Site Specific'];
      if (this.sosData) {
        for (const sos of this.sosData) {
          const sosDate = moment(sos.createdAt).format('YYYY-MM-DD');
          if (sosDate >= startDate && sosDate <= endDate) {
            for (var i = 0; i < this.reportedSelected.length; i++) {
              for (var j = 0; j < this.usersSelected.length; j++) {
                const username = sos.user.firstName + ' ' + sos.user.lastName;
                if ((this.reportedSelected[i] == sos.sosdata.report.attendee) && (this.usersSelected[j] == username) && (this.ratingSelected == "All")) {
                  datasets2.push(sos);
                } else if ((this.reportedSelected[i] == sos.sosdata.report.attendee) && (this.usersSelected[j] == username) && (this.ratingSelected == "Low")) {
                  if (this.getOverallRatings(sos.id) == 0) {
                    datasets2.push(sos);
                  }
                } else if ((this.reportedSelected[i] == sos.sosdata.report.attendee) && (this.usersSelected[j] == username) && (this.ratingSelected == "Medium")) {
                  if ((this.getOverallRatings(sos.id) > 0) && (this.getOverallRatings(sos.id) < 11)) {
                    datasets2.push(sos);
                  }
                } else if ((this.reportedSelected[i] == sos.sosdata.report.attendee) && (this.usersSelected[j] == username) && (this.ratingSelected == "High")) {
                  if (this.getOverallRatings(sos.id) >= 12) {
                    datasets2.push(sos);
                  }
                }
              }
            }

            if ((this.reportedSelected == "") && (this.usersSelected == "") && (this.ratingSelected == "All")) {
              datasets2.push(sos);
            } else if ((this.reportedSelected == "") && (this.usersSelected == "") && (this.ratingSelected == "Low")) {
              if (this.getOverallRatings(sos.id) == 0) {
                datasets2.push(sos);
              }
            } else if ((this.reportedSelected == "") && (this.usersSelected == "") && (this.ratingSelected == "Medium")) {
              if ((this.getOverallRatings(sos.id) > 0) && (this.getOverallRatings(sos.id) < 11)) {
                datasets2.push(sos);
              }
            } else if ((this.reportedSelected == "") && (this.usersSelected == "") && (this.ratingSelected == "High")) {
              if (this.getOverallRatings(sos.id) >= 12) {
                datasets2.push(sos);
              }
            }
          }
        }
      }

      if (datasets2.length > 0) {
        for (const sos1 of datasets2) {
          for (const section of sos1.sosdata.sections) {
            if (section.name === 'section1bodyposition') {
              if (this.getTotalRating('section1bodyposition', sos1.id) == 0) {
                section1Low.push(section.subsection.reduce((acc, val) => acc += val.rating, 0));
                users1Low.push(sos1.sosdata.report.attendee);
              }
              if ((this.getTotalRating('section1bodyposition', sos1.id) > 0) && (this.getTotalRating('section1bodyposition', sos1.id) < 11)) {
                section1Mid.push(section.subsection.reduce((acc, val) => acc += val.rating, 0));
                users1Mid.push(sos1.sosdata.report.attendee);
              }
              if (this.getTotalRating('section1bodyposition', sos1.id) >= 12) {
                section1High.push(section.subsection.reduce((acc, val) => acc += val.rating, 0));
                users1High.push(sos1.sosdata.report.attendee);
              }
            }
            if (section.name === 'section2procedures') {
              if (this.getTotalRating('section2procedures', sos1.id) == 0) {
                section2Low.push(section.subsection.reduce((acc, val) => acc += val.rating, 0));
                users2Low.push(sos1.sosdata.report.attendee);
              }
              if ((this.getTotalRating('section2procedures', sos1.id) > 0) && (this.getTotalRating('section2procedures', sos1.id) < 11)) {
                section2Mid.push(section.subsection.reduce((acc, val) => acc += val.rating, 0));
                users2Mid.push(sos1.sosdata.report.attendee);
              }
              if (this.getTotalRating('section2procedures', sos1.id) >= 12) {
                section2High.push(section.subsection.reduce((acc, val) => acc += val.rating, 0));
                users2High.push(sos1.sosdata.report.attendee);
              }
            }
            if (section.name === 'section3personalprotectiveequipment') {
              if (this.getTotalRating('section3personalprotectiveequipment', sos1.id) == 0) {
                section3Low.push(section.subsection.reduce((acc, val) => acc += val.rating, 0));
                users3Low.push(sos1.sosdata.report.attendee);
              }
              if ((this.getTotalRating('section3personalprotectiveequipment', sos1.id) > 0) && (this.getTotalRating('section3personalprotectiveequipment', sos1.id) < 11)) {
                section3Mid.push(section.subsection.reduce((acc, val) => acc += val.rating, 0));
                users3Mid.push(sos1.sosdata.report.attendee);
              }
              if (this.getTotalRating('section3personalprotectiveequipment', sos1.id) >= 12) {
                section3High.push(section.subsection.reduce((acc, val) => acc += val.rating, 0));
                users3High.push(sos1.sosdata.report.attendee);
              }
            }
            if (section.name === 'section4toolsandequipement') {
              if (this.getTotalRating('section4toolsandequipement', sos1.id) == 0) {
                section4Low.push(section.subsection.reduce((acc, val) => acc += val.rating, 0));
                users4Low.push(sos1.sosdata.report.attendee);
              }
              if ((this.getTotalRating('section4toolsandequipement', sos1.id) > 0) && (this.getTotalRating('section4toolsandequipement', sos1.id) < 11)) {
                section4Mid.push(section.subsection.reduce((acc, val) => acc += val.rating, 0));
                users4Mid.push(sos1.sosdata.report.attendee);
              }
              if (this.getTotalRating('section4toolsandequipement', sos1.id) >= 12) {
                section4High.push(section.subsection.reduce((acc, val) => acc += val.rating, 0));
                users4High.push(sos1.sosdata.report.attendee);
              }
            }
            if (section.name === 'section5other') {
              if (this.getTotalRating('section5other', sos1.id) == 0) {
                section5Low.push(section.subsection.reduce((acc, val) => acc += val.rating, 0));
                users5Low.push(sos1.sosdata.report.attendee);
              }
              if ((this.getTotalRating('section5other', sos1.id) > 0) && (this.getTotalRating('section5other', sos1.id) < 11)) {
                section5Mid.push(section.subsection.reduce((acc, val) => acc += val.rating, 0));
                users5Mid.push(sos1.sosdata.report.attendee);
              }
              if (this.getTotalRating('section5other', sos1.id) >= 12) {
                section5High.push(section.subsection.reduce((acc, val) => acc += val.rating, 0));
                users5High.push(sos1.sosdata.report.attendee);
              }
            }
            if (section.name === 'section6sitespecific') {
              if (this.getTotalRating('section6sitespecific', sos1.id) == 0) {
                section6Low.push(section.subsection.reduce((acc, val) => acc += val.rating, 0));
                users6Low.push(sos1.sosdata.report.attendee);
              }
              if ((this.getTotalRating('section6sitespecific', sos1.id) > 0) && (this.getTotalRating('section6sitespecific', sos1.id) < 11)) {
                section6Mid.push(section.subsection.reduce((acc, val) => acc += val.rating, 0));
                users6Mid.push(sos1.sosdata.report.attendee);
              }
              if (this.getTotalRating('section6sitespecific', sos1.id) >= 12) {
                section6High.push(section.subsection.reduce((acc, val) => acc += val.rating, 0));
                users6High.push(sos1.sosdata.report.attendee);
              }
            }
          }
        }
      }

      const low1Count = section1Low.reduce((acc, val) => acc += val, 0);
      const low2Count = section2Low.reduce((acc, val) => acc += val, 0);
      const low3Count = section3Low.reduce((acc, val) => acc += val, 0);
      const low4Count = section4Low.reduce((acc, val) => acc += val, 0);
      const low5Count = section5Low.reduce((acc, val) => acc += val, 0);
      const low6Count = section6Low.reduce((acc, val) => acc += val, 0);

      const mid1Count = section1Mid.reduce((acc, val) => acc += val, 0);
      const mid2Count = section2Mid.reduce((acc, val) => acc += val, 0);
      const mid3Count = section3Mid.reduce((acc, val) => acc += val, 0);
      const mid4Count = section4Mid.reduce((acc, val) => acc += val, 0);
      const mid5Count = section5Mid.reduce((acc, val) => acc += val, 0);
      const mid6Count = section6Mid.reduce((acc, val) => acc += val, 0);

      const high1Count = section1High.reduce((acc, val) => acc += val, 0);
      const high2Count = section2High.reduce((acc, val) => acc += val, 0);
      const high3Count = section3High.reduce((acc, val) => acc += val, 0);
      const high4Count = section4High.reduce((acc, val) => acc += val, 0);
      const high5Count = section5High.reduce((acc, val) => acc += val, 0);
      const high6Count = section6High.reduce((acc, val) => acc += val, 0);

      filterData.push({
        'colors': ['green', 'green', 'green', 'green', 'green', 'green'],
        'counts': [low1Count, low2Count, low3Count, low4Count, low5Count, low6Count],
        'labels': [section1Low, section2Low, section3Low, section4Low, section5Low, section6Low],
        'labels1': [users1Low, users2Low, users3Low, users4Low, users5Low, users6Low]
      },
        {
          'colors': ['orange', 'orange', 'orange', 'orange', 'orange', 'orange'],
          'counts': [mid1Count, mid2Count, mid3Count, mid4Count, mid5Count, mid6Count],
          'labels': [section1Mid, section2Mid, section3Mid, section4Mid, section5Mid, section6Mid],
          'labels1': [users1Mid, users2Mid, users3Mid, users4Mid, users5Mid, users6Mid]
        },
        {
          'colors': ['red', 'red', 'red', 'red', 'red', 'red'],
          'counts': [high1Count, high2Count, high3Count, high4Count, high5Count, high6Count],
          'labels': [section1High, section2High, section3High, section4High, section5High, section6High],
          'labels1': [users1High, users2High, users3High, users4High, users5High, users6High]
        });

      if (datasets2.length > 0 && datasets2.length < this.sosData.length) {
        for (const data1 of filterData) {
          datasets.push({
            backgroundColor: data1.colors,
            data: data1.counts,
            label: data1.labels,
            label1: data1.labels1
          });
        }
      } else {
        for (const dataLength of this.allLength) {
          if (this.ratingSelected == "All") {
            datasets.push({
              backgroundColor: dataLength.color,
              data: dataLength.count,
              label: dataLength.series
            });
          }
          if (this.ratingSelected == dataLength.series) {
            datasets.push({
              backgroundColor: dataLength.color,
              data: dataLength.count,
              label: dataLength.series
            });
          }
        }
      }

      if (datasets2.length > 0 && datasets2.length < this.sosData.length) {
        this.SosGraphCountChart.config.data = {
          datasets: datasets,
          labels: labels
        };
        this.SosGraphCountChart.config.options.legend = {
          display: false,
        };
        this.SosGraphCountChart.config.options.tooltips = {
          callbacks: {
            label: function (tooltipItem, data) {
              var label = data.datasets[tooltipItem.datasetIndex].label || '';
              var label1 = data.datasets[tooltipItem.datasetIndex].label1 || '';
              const abc = [];
              for (var k = 0; k < label1.length; k++) {
                if (label[tooltipItem.index][k] > 0) {
                  abc.push(label1[tooltipItem.index][k] + ': ' + label[tooltipItem.index][k]);
                }
              }
              abc.push('Total: ' + tooltipItem.yLabel);
              return abc;
            }
          }
        };
        this.SosGraphCountChart.update();
      } else {
        this.SosGraphCountChart.config.data = {
          datasets: datasets,
          labels: labels
        };
        this.SosGraphCountChart.config.options.legend = {
          display: true,
          position: 'right',
          align: 'start',
          labels: {
            boxWidth: 12
          }
        };
        this.SosGraphCountChart.config.options.tooltips = {
          callbacks: {
            label: function (tooltipItem, data) {
              var label = data.datasets[tooltipItem.datasetIndex].label || '';
              return label + ': ' + tooltipItem.yLabel;
            }
          }
        };
        this.SosGraphCountChart.update();
      }
      this.applyFilter();
      this.modalService.dismissAll();
    });
  }

  //for get graph data counts
  getGraphData() {
    this.incidentService.getIncidentTypes().subscribe(r => {
      if (r.data) {
        for (var i = 0; i <= r.data.length; i++) {
          if (r.data[i]) {
            if (r.data[i].name == "Safe on Site") {
              this.incidentId = r.data[i].id;
              this.sosService.getSoSIncidentsById(this.incidentId).subscribe(res => {
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
                    'color': ["green", "green", "green", "green", "green", "green"],
                    'count': [section1Low.length, section2Low.length, section3Low.length, section4Low.length, section5Low.length, section6Low.length]
                  },
                  {
                    'series': 'Medium',
                    'color': ["orange", "orange", "orange", "orange", "orange", "orange"],
                    'count': [section1Mid.length, section2Mid.length, section3Mid.length, section4Mid.length, section5Mid.length, section6Mid.length]
                  },
                  {
                    'series': 'High',
                    'color': ["red", "red", "red", "red", "red", "red"],
                    'count': [section1High.length, section2High.length, section3High.length, section4High.length, section5High.length, section6High.length]
                  });
                return this.allLength;
              });
            }
          }
        }
      }
    });
  }

  //for get graph data counts
  fullFilterGraph(dateChange?) {
    this.incidentService.getIncidentTypes().subscribe(r => {
      if (r.data) {
        for (var i = 0; i <= r.data.length; i++) {
          if (r.data[i]) {
            if (r.data[i].name == "Safe on Site") {
              this.incidentId = r.data[i].id;
              this.sosService.getSoSIncidentsById(this.incidentId).subscribe(res => {
                this.sosData = res.data;
                const filteredSelectedSos = [];
                const filteredSelectedSos1 = [];
                if (dateChange) {
                  if (this.sosData) {
                    if (this.sosData == undefined) {
                      this.sosData = this.sosData;
                    }
                    const startDate = moment(this.range.fromDate).format('YYYY-MM-DD');
                    const endDate = moment(this.range.toDate).format('YYYY-MM-DD');
                    for (const sos of this.sosData) {
                      const sosDate = moment(sos.createdAt).format('YYYY-MM-DD');
                      if (sosDate >= startDate && sosDate <= endDate) {
                        filteredSelectedSos.push(sos);
                      }
                    }
                  }
                }
                const datasets = [];
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
                const labels = ['Body Position', 'Procedures', 'PPE', 'Tools & Equipment', 'Other', 'Site Specific'];
                if (filteredSelectedSos) {
                  for (const sos of filteredSelectedSos) {
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
                filteredSelectedSos1.push(
                  {
                    'series': 'Low',
                    'color': ["green", "green", "green", "green", "green", "green"],
                    'count': [section1Low.length, section2Low.length, section3Low.length, section4Low.length, section5Low.length, section6Low.length]
                  },
                  {
                    'series': 'Medium',
                    'color': ["orange", "orange", "orange", "orange", "orange", "orange"],
                    'count': [section1Mid.length, section2Mid.length, section3Mid.length, section4Mid.length, section5Mid.length, section6Mid.length]
                  },
                  {
                    'series': 'High',
                    'color': ["red", "red", "red", "red", "red", "red"],
                    'count': [section1High.length, section2High.length, section3High.length, section4High.length, section5High.length, section6High.length]
                  }
                );

                for (const dataLength of filteredSelectedSos1) {
                  datasets.push({
                    backgroundColor: dataLength.color,
                    data: dataLength.count,
                    label: dataLength.series
                  });
                }

                this.SosGraphCountChart.config.data = {
                  datasets: datasets,
                  labels: labels
                };
                this.SosGraphCountChart.config.options.legend = {
                  display: true,
                  position: 'right',
                  align: 'start',
                  labels: {
                    boxWidth: 12
                  }
                };
                this.SosGraphCountChart.config.options.tooltips = {
                  callbacks: {
                    label: function (tooltipItem, data) {
                      var label = data.datasets[tooltipItem.datasetIndex].label || '';
                      return label + ': ' + tooltipItem.yLabel;
                    }
                  }
                };
                this.SosGraphCountChart.update();
              });
            }
          }
        }
      }
    });
  }

}