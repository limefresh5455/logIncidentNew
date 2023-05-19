import {Component, ElementRef, OnInit, ViewChild, Input} from '@angular/core';
import {CustomerService} from '../_services/customer.service';
import {CompanyService} from '../_services/company.service';
import {ActivatedRoute, Router} from '@angular/router';
import {User} from '../_models/user';
import * as moment from 'moment';
import {MmtService} from '../_services/mmt.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import {IncidentsService} from '../_services/incidents.service';
import swal from 'sweetalert2';
import {NgxDrpOptions, PresetItem, Range} from 'ngx-mat-daterange-picker';
declare var $:any;

@Component({
  selector: 'app-future-mmt',
  templateUrl: './future-mmt.component.html',
  styleUrls: ['./future-mmt.component.css']
})
export class FutureMmtComponent implements OnInit {
  @Input() incidentTypes: any = [];
  currentUser: User;
  actionColor = null;
  accentColor = null;
  showSection = true;

  p: number = 1;
  futureMmt: any = [];
  currentYearData: any = [];
  questionList;
  yearsList: any = [];
  currentYear;
  nextYear;
  closeResult: string;
  questionPool: any = [];
  questionPoolList;
  changeDate;
  incidentId;
  monthTabs: any = [];
  ownersData;

  createForm: FormGroup;
  generateForm: FormGroup;
  auditGroupForm: FormGroup;
  triggerForm: FormGroup;
  questionPk;
  public errorShow:boolean = false;
  dataLoading: boolean = true;
  loading: boolean = true;
  poolQuestionId;

  // date range
  fromDate;
  toDate;
  range: Range = {fromDate: new Date(), toDate: new Date()};
  mmtStartDate;
  mmtEndDate;
  minGenerateDate;
  generateDate;
  deleteDate;
  triggerDate;
  mmtAdminList: any = [];
  selectMmtNameList: any = [];
  selectedObjectsFromArray: any;
  tabDate;
  firstTabDate;
  futureMmtLength: any = [];

  constructor(
    private companyService: CompanyService,
    private customerService: CustomerService,
    private mmtService: MmtService,
    private router: Router,
    private modalService: NgbModal,
    private formBuilder: FormBuilder,
    private incidentService: IncidentsService
  ) {
    const currentUser = this.customerService.getUser();
    this.actionColor = currentUser.company.primary;
    this.accentColor = currentUser.company.accent;
  }

  async ngOnInit() {

    //for create mmt form validation
    this.createForm = this.formBuilder.group({
        question: ""
    });
    //for generate mmt question form
    this.generateForm = this.formBuilder.group({
        quantity: 10
    });
    //for trigger audit now mmt question form
    this.triggerForm = this.formBuilder.group({
        days: 10
    });

    //for update owners question form
    this.auditGroupForm = this.formBuilder.group({
      audit_group: ['All']
    });
  
    const dateObj = new Date();
    this.currentYear = dateObj.getFullYear();
    this.nextYear = dateObj.getFullYear() + 1;
    this.generateDate = moment().format('MM/DD/YYYY');
    this.mmtStartDate = moment(new Date(this.currentYear, 0, 1)).format('YYYY-MM-DD');
    this.mmtEndDate = moment(new Date(this.nextYear, 11, 31)).format('YYYY-MM-DD');
    
    await this.onYearSelected(true);

    // await this.getLengthOfData();

    //for single datepicker show for create questions 
    $('input[name="generateDate"]').daterangepicker({
      "locale": {
        "format": "DD/MM/YYYY",
      },
      singleDatePicker: true,
      showDropdowns: true,
      "startDate": moment(),
      minYear: 1901,
      maxYear: parseInt(moment().format('YYYY'),10)
    }, function(start, end, label) {
      $('#getGenerateDate').val(start._d);
    });

    //get mmt admin list
    this.mmtService.getMmtAdminList().subscribe(resp => {
      this.mmtAdminList = resp.data;
      for (const mmt of this.mmtAdminList) {
        this.selectMmtNameList.push(mmt.name);
      }
      this.selectMmtNameList = this.selectMmtNameList.filter((v, i, a) => a.indexOf(v) === i);
      this.auditGroupForm.get('audit_group').setValue(this.selectMmtNameList);
    });

  }

  //get form audit_group field
  get audit_group(): FormControl {
    return this.auditGroupForm.get('audit_group') as FormControl;
  }

  //get mmt future months data by year
  async onYearSelected(init=false){
    var r: any = [];

    //get branch list and branch filter list
    if(Object.keys(this.incidentTypes).length) {
       r = this.incidentTypes;
    } else {
       r = await this.incidentService.getIncidentTypes().toPromise();
    }
    console.log(['r.data',r.data])
    // this.incidentService.getIncidentTypes().subscribe(
    //   r => {
        if(r.data){
          for(var i = 0; i <= r.data.length; i++){
            if(r.data[i]){
              if(r.data[i].name == "Managers Tour"){
                this.incidentId = r.data[i].id;
                this.mmtService.getFutureMmt(this.incidentId, this.mmtStartDate, this.mmtEndDate).subscribe(resp => {
                  this.futureMmt = resp.data;
                  if(init){
                    this.futureMmtLength = resp.data;
                  }
                  const monthData = [];
                  for (const mmt of this.futureMmt) {
                    const mmtCreateDate = new Date(mmt.reportDate);
                    const years = mmtCreateDate.getFullYear();
                    monthData.push({'originDate': mmt.reportDate, 'changeDate': moment(mmt.reportDate).format('MMMM Do YYYY')});
                  }
                  this.dataLoading = true;
                  setTimeout(()=>{
                    this.dataLoading = false;
                    const filterMonth = monthData.map(item => item.originDate).filter((value, index, self) => self.indexOf(value) === index);
                    const monthSort = filterMonth.sort();
                    this.monthTabs = monthSort.map(item => moment(item).format('MMMM Do YYYY')).filter((value, index, self) => self.indexOf(value) === index);
                    for(var i = 0; i <= this.monthTabs.length; i++){
                      if(i == 0){
                        this.tabSection(this.monthTabs[i]);
                      }
                    }
                    this.currentYearData = this.monthTabs;
                    this.customDateRange(monthSort);
                  },1000);
                });
              }
            }
          }
        }
    //   }, e => {
    //     this.router.navigateByUrl('/login');
    //   }
    // );
  }

  async getLengthOfData(){
    const startDate = moment(new Date(this.currentYear, 0, 1)).format('YYYY-MM-DD');
    const endDate = moment(new Date(this.nextYear, 11, 31)).format('YYYY-MM-DD');

    var r: any = [];

    //get branch list and branch filter list
    if(Object.keys(this.incidentTypes).length) {
       r = this.incidentTypes;
    } else {
       r = await this.incidentService.getIncidentTypes().toPromise();
    }
    // this.incidentService.getIncidentTypes().subscribe(
    //   r => {
        if(r.data){
          for(var i = 0; i <= r.data.length; i++){
            if(r.data[i]){
              if(r.data[i].name == "Managers Tour"){
                this.incidentId = r.data[i].id;
                this.mmtService.getFutureMmt(this.incidentId, startDate, endDate).subscribe(resp => {
                  this.futureMmtLength = resp.data;
                });
              }
            }
          }
        }
    //   }, e => {
    //     this.router.navigateByUrl('/login');
    //   }
    // );
  }

   //for tab section on click
  tabSection(originDate) {
    this.p = 1;
    this.mmtService.getFutureMmt(this.incidentId, this.mmtStartDate, this.mmtEndDate).subscribe(resp => {
      this.futureMmt = resp.data;
      const monthQuestionData = [];
      const ownersData1 = [];
      for (const mmt of this.futureMmt) {
        const reportDate = moment(mmt.reportDate).format('MMMM Do YYYY');
        if (originDate == reportDate) {
          this.dataLoading = true;
          setTimeout(()=>{
            this.dataLoading = false;
            monthQuestionData.push(mmt);
            this.questionList = monthQuestionData;
            this.changeDate = originDate;
            this.firstTabDate = originDate;
            this.deleteDate = moment(new Date(mmt.reportDate)).format('YYYY-MM-DD');
            this.triggerDate = moment(new Date(mmt.reportDate)).format('YYYY-MM-DD');
          },1000);
          ownersData1.push(mmt.owners);
        }
      }
      this.ownersData = (ownersData1[0] != null) ? ownersData1[0][0] : "";
    });
  }

  //for update owners by api
  changeOwners(changeDates){
    const owners = [];
    const ownersList =  this.auditGroupForm.value.audit_group;
    owners.push(ownersList);
    const data = {
      "owners" : owners,
      "date" : changeDates,
      "audittype" : 0
    }
    this.mmtService.updateOwnersInQuestion(data).subscribe(res => {
      swal.fire({
        title: 'Update Owners Successfully',
        icon: 'success'
      });
      const tabDate = moment(changeDates).format('MMMM Do YYYY');
      if(this.changeDate == tabDate){
        this.tabSection(tabDate);
      }else{
        this.onYearSelected();
      }
    }, e => {
      this.router.navigateByUrl('/login');
    });
  }

  //for open generate question modal
  openGenerateModal(content) {
    this.modalService.open(content, {size: 'sm', ariaLabelledBy: 'modal-basic-title'}).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.closeResult = `Dismissed`;
    });
  }

  //for generate question by api
  generateQuestion(){
    this.minGenerateDate = $('#getGenerateDate').val();
    const qDate = moment(new Date(this.minGenerateDate)).format('YYYY-MM-DD');
    const data = {
      "date" : qDate,
      "quantity" : this.generateForm.value.quantity,
      "auditType" : 0
    }
    this.mmtService.generateQuestion(this.incidentId, data).subscribe(res => {
      swal.fire({
        title: 'Generate Question',
        icon: 'success'
      });
      this.tabDate = moment(qDate).format('MMMM Do YYYY');
      this.mmtService.getFutureMmt(this.incidentId, this.mmtStartDate, this.mmtEndDate).subscribe(resp => {
        this.futureMmt = resp.data;
        const monthData = [];
        for (const mmt of this.futureMmt) {
          const mmtCreateDate = new Date(mmt.reportDate);
          const years = mmtCreateDate.getFullYear();
          monthData.push({'originDate': mmt.reportDate, 'changeDate': moment(mmt.reportDate).format('MMMM Do YYYY')});
        }
        this.dataLoading = true;
        setTimeout(()=>{
          this.dataLoading = false;
          const filterMonth = monthData.map(item => item.originDate).filter((value, index, self) => self.indexOf(value) === index);
          const monthSort = filterMonth.sort();
          this.monthTabs = monthSort.map(item => moment(item).format('MMMM Do YYYY')).filter((value, index, self) => self.indexOf(value) === index);
          this.tabSection(this.tabDate);
          this.firstTabDate = "null";
          this.currentYearData = this.monthTabs;
          this.customDateRange(monthSort);
        },1000);
      });
    }, e => {
      this.router.navigateByUrl('/login');
    });
    this.generateForm.reset();
    this.generateForm.setValue({
      quantity: 10
    });
    $('input[name="generateDate"]').data('daterangepicker').setStartDate(moment());
    this.modalService.dismissAll();
  }

  //for open audit now modal
  openAuditNow(content) {
    this.modalService.open(content, {size: 'sm', ariaLabelledBy: 'modal-basic-title'}).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.closeResult = `Dismissed`;
    });
  }

  //for trigger audit now question by api
  triggerQuestion(){
    const days = this.triggerForm.value.days;
    this.mmtService.triggerAuditNow(this.incidentId, this.triggerDate, this.ownersData, days).subscribe(res => {
      swal.fire({
        title: res.data,
        icon: 'success'
      });
    });
    this.triggerForm.reset();
    this.triggerForm.setValue({
      days: 10
    });
    this.modalService.dismissAll();
  }

  //for delete future mmt schedule by date
  deleteSchedule(deleteGDate){
    swal.fire({
      title: 'Are you sure?',
      text: "You want to delete this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.value) {
        this.mmtService.deleteGenerateQuestion(this.incidentId, deleteGDate).subscribe(res => {
          swal.fire(
            'Deleted!',
            res.delete,
            'success'
          )
        }, e => {
          this.router.navigateByUrl('/login');
        });
        this.onYearSelected();
      }
    });
  }

  //for open replace mmt question modal
  openMmtQuestionModal(content, quesPk, changeDate) {
    this.mmtService.getMmtQuestionPool(this.incidentId).subscribe(resp => {
      this.questionPool = resp.data;
      const qList = [];
      for (const pool of this.questionPool) {
        if (pool.question != "") {
          if (pool.enabled == true) {
            qList.push(pool);
          }
        }
      }
      this.loading = true;
      setTimeout(()=>{
        this.loading = false;
        this.questionPoolList = qList;
      },1000);
    });
    this.questionPk = quesPk;
    this.changeDate = changeDate;
    this.modalService.open(content, {size: 'lg', ariaLabelledBy: 'modal-basic-title'}).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.closeResult = `Dismissed`;
    });
  }

  //for on change question pool list
  changed(questionId){
    this.poolQuestionId = questionId;
  }

  //for replace mmt question pool form submit data
  onSubmit(data) {
    if (!this.questionList.some((question) => question.question == data.question)) {
      if(data.question != null && data.question != ""){
        this.mmtService.replaceFutureMmt(this.questionPk, this.poolQuestionId).subscribe(resp => {
          swal.fire({
            title: 'Question Replaced',
            icon: 'success'
          });
          const targetIdx = this.questionList.map(question => question.id).indexOf(this.questionPk);
          this.questionList[targetIdx].question = resp.data.question;
        });
      }
      this.errorShow = false;
      this.createForm.reset();
      this.modalService.dismissAll();
    }else{
      this.errorShow = true;
    }
  }

  //for custom bootstrap date range picker
  customDateRange(currentYearData){
    const firstDate = new Date(currentYearData[currentYearData.length - currentYearData.length]);
    this.fromDate = new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate(), 0, 0, 0);
    const secondDate = new Date(currentYearData[currentYearData.length - 1]);
    this.toDate = new Date(secondDate.getFullYear(), secondDate.getMonth(), secondDate.getDate(), 0, 0, 0);
    var start = moment(this.fromDate);
    var end = moment(this.toDate);
    
    function cb(start, end) {
      $('#futuremmtrange span').html(start.format('MMMM YYYY') + ' - ' + end.format('MMMM YYYY'));
    }

    $('#futuremmtrange').daterangepicker({
      locale: {
        format: 'DD/MM/YYYY'
      },
      startDate: start,
      endDate: end,
      maxDate: end
    }, cb);

    cb(start, end);
    // onclick apply in bootstrap daterange picker
    $('#futuremmtrange').on('apply.daterangepicker', (e, picker) => {
      this.updateRange({fromDate: new Date(picker.startDate.format('MMMM D, YYYY')), toDate: new Date(picker.endDate.format('MMMM D, YYYY'))});
    });

    // onclick cancel in bootstrap daterange picker
    $('#futuremmtrange').on('cancel.daterangepicker', (e, picker) => {
      const date1 = moment(this.fromDate).format('YYYY-MM-DD');
      const date2 = moment(this.toDate).format('YYYY-MM-DD');
      this.refreshCancelData(date1, date2);
    });
  }

  // for onclick cancel in daterangepicker refresh data
  refreshCancelData(startDate, endDate) {
    this.mmtService.getFutureMmt(this.incidentId, startDate, endDate).subscribe(resp => {
      this.futureMmt = resp.data;
      const monthData = [];
      if (this.currentYearData) {
        for (const mmt of this.futureMmt) {
          const mmtCreateDate = new Date(mmt.reportDate);
          const years = mmtCreateDate.getFullYear();
          if (this.currentYear == years) {
            monthData.push({'originDate': mmt.reportDate, 'changeDate': moment(mmt.reportDate).format('MMMM Do YYYY')});
          }
        }
        this.dataLoading = true;
        setTimeout(()=>{
          this.dataLoading = false;
          const filterMonth = monthData.map(item => item.originDate).filter((value, index, self) => self.indexOf(value) === index);
          const monthSort = filterMonth.sort();
          this.monthTabs = monthSort.map(item => moment(item).format('MMMM Do YYYY')).filter((value, index, self) => self.indexOf(value) === index);
          for(var i = 0; i <= this.monthTabs.length; i++){
            if(i == 0){
              this.tabSection(this.monthTabs[i]);
            }
          }
          this.currentYearData = this.monthTabs;
          this.customDateRange(monthSort);
        },1000);
      }
    });
  }

  // handler function that receives the updated date range object
  updateRange(range: Range) {
    this.range = range;
    this.fullFilter(true);
  }

  // for filter future mmt question list by range dates
  fullFilter(dateChange?) {
    this.mmtStartDate = moment(this.range.fromDate).format('YYYY-MM-DD');
    this.mmtEndDate = moment(this.range.toDate).format('YYYY-MM-DD');
    this.mmtService.getFutureMmt(this.incidentId, this.mmtStartDate, this.mmtEndDate).subscribe(resp => {
      this.futureMmt = resp.data;
      const monthData = [];
      if (dateChange) {
        if (this.currentYearData) {
          for (const mmt of this.futureMmt) {
            const mmtCreateDate = new Date(mmt.reportDate);
            const years = mmtCreateDate.getFullYear();
            if (this.currentYear == years) {
              monthData.push({'originDate': mmt.reportDate, 'changeDate': moment(mmt.reportDate).format('MMMM Do YYYY')});
            }
          }
          this.dataLoading = true;
          setTimeout(()=>{
            this.dataLoading = false;
            const filterMonth = monthData.map(item => item.originDate).filter((value, index, self) => self.indexOf(value) === index);
            const monthSort = filterMonth.sort();
            this.monthTabs = monthSort.map(item => moment(item).format('MMMM Do YYYY')).filter((value, index, self) => self.indexOf(value) === index);
            for(var i = 0; i <= this.monthTabs.length; i++){
              if(i == 0){
                this.tabSection(this.monthTabs[i]);
              }
            }
            this.currentYearData = this.monthTabs;
          },1000);
        }
      }
    });
  }

}