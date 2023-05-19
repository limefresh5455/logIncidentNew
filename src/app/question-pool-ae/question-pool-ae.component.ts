import {Component, ElementRef, OnInit, ViewChild, Directive, EventEmitter, Input, Output, QueryList, ViewChildren} from '@angular/core';
import {CustomerService} from '../_services/customer.service';
import {CompanyService} from '../_services/company.service';
import {ActivatedRoute, Router, NavigationEnd} from '@angular/router';
import {User} from '../_models/user';
import * as moment from 'moment';
import {MmtService} from '../_services/mmt.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {IncidentsService} from '../_services/incidents.service';
import swal from 'sweetalert2';
import {NgbdSortableHeader,SortEvent} from '../_directives/sortable.directive';
import { MatDialog } from '@angular/material';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { WhiteSpaceValidator } from './../whitespace.validator';
declare var $:any;

const compare = (v1: string | number, v2: string | number) => v1 < v2 ? -1 : v1 > v2 ? 1 : 0;

@Component({
  selector: 'app-question-pool-ae',
  templateUrl: './question-pool-ae.component.html',
  styleUrls: ['./question-pool-ae.component.css']
})
export class QuestionPoolAeComponent implements OnInit {

  @Input() tabUrl = '';
  @Input() incidentTypes: any = [];
  currentUser: User;
  actionColor = null;
  accentColor = null;

  p: number = 1;
  questionPoolAe;
  mmtQuestionLists;
  questionId;
  incidentId;
  modalTitle;

  createForm: FormGroup;
  submitted = false;
  closeResult: string;

  @ViewChildren(NgbdSortableHeader) headers: QueryList<NgbdSortableHeader>;

  constructor(
    private companyService: CompanyService,
    private customerService: CustomerService,
    private mmtService: MmtService,
    private router: Router,
    private modalService: NgbModal,
    private formBuilder: FormBuilder,
    private incidentService: IncidentsService,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {
    const currentUser = this.customerService.getUser();
    this.actionColor = currentUser.company.primary;
    this.accentColor = currentUser.company.accent;
  }

  async ngOnInit() {
    //for create mmt form validation (Validators.pattern(/^(\s+\S+\s*)*(?!\s).*$/))
    this.createForm = this.formBuilder.group({
      question: ['', [Validators.required, WhiteSpaceValidator.noSpaceValidation]],
      auditType: [''],
      enabled: ['', [Validators.required]]
    });

    //for get question pool list from api by incident id

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
              if(r.data[i].name == "Audits"){
                this.incidentId = r.data[i].id;
                this.mmtService.getMmtQuestionPool(this.incidentId).subscribe(resp => {
                  this.questionPoolAe = resp.data;
                });
              }
            }
          }
        }
      // }, e => {
      //   this.router.navigateByUrl('/login');
      // }
    // );
  }

  //for table header row sorting
  onSort({column, direction}: SortEvent) {
    // resetting other headers
    this.headers.forEach(header => {
      if (header.sortable !== column) {
        header.direction = '';
      }
    });
    // sorting question list
    if (direction === '' || column === '') {
      this.questionPoolAe = this.questionPoolAe;
    } else {
      this.questionPoolAe = [...this.questionPoolAe].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }

  //for change status on change status toggle
  changed(event, questionId, audittype){
    const dialogRef = this.dialog.open(ConfirmDialogComponent);
    dialogRef.afterClosed().subscribe(response => {
      if (response) {
        const data = {
          "auditType": audittype,
          "enabled": event.checked
        }
        this.mmtService.editQuestionPool(questionId, data).subscribe(res => {
          swal.fire({
            title: 'Question Pool Audits Updated Status',
            icon: 'success'
          });
          this.mmtService.getMmtQuestionPool(this.incidentId).subscribe(resp => {
            this.questionPoolAe = resp.data;
          });
        }, e => {
          this.router.navigateByUrl('/login');
        });
      } else {
        event.source.checked = !event.checked;
      }
    });
  }

  //for open add question modal on click add and edit question button
  openAddQuestionModal(content, id, audittype) {
    if(id == null){
      this.createForm.setValue({
        question: "",
        auditType: audittype,
        enabled: ""
      });
      this.questionId = "";
      this.modalTitle = "Add";
    }else{
      this.mmtQuestionLists = this.questionPoolAe.filter((o2) => id === o2.id);
      this.createForm.setValue({
        question: this.mmtQuestionLists[0].question,
        auditType: audittype,
        enabled: (this.mmtQuestionLists[0].enabled) ? "true" : "false"
      });
      this.questionId = id;
      this.modalTitle = "Edit";
    }
    this.modalService.open(content, {backdrop: false, size: "lg", windowClass: 'filterClass', ariaLabelledBy: 'modal-basic-title'}).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.closeResult = `Dismissed`;
    });
  }

  //for return create mmt question form validation
  get f() { return this.createForm.controls; }

  //for create mmt question form submit data
  onSubmit() {
    this.submitted = true;
    // stop here if form is invalid
    if (this.createForm.invalid) {
      return;
    }

    if(this.questionId != ""){
      this.mmtService.editQuestionPool(this.questionId, this.createForm.value).subscribe(res => {
        swal.fire({
          title: 'Question Pool Audits Updated',
          icon: 'success'
        });
        this.modalService.dismissAll();
        this.router.navigateByUrl('/mmt/question-pool-ae');
        this.mmtService.getMmtQuestionPool(this.incidentId).subscribe(resp => {
          this.questionPoolAe = resp.data;
        });
      }, e => {
        this.router.navigateByUrl('/login');
      });
    }else{
      this.mmtService.createQuestionPool(this.incidentId, this.createForm.value).subscribe(resp => {
        swal.fire({
          title: 'Question Pool Audits Created',
          icon: 'success',
          text: 'Thanks for submission',
        });
        this.modalService.dismissAll();
        this.router.navigateByUrl('/mmt/question-pool-ae');
        this.mmtService.getMmtQuestionPool(this.incidentId).subscribe(resp => {
          this.questionPoolAe = resp.data;
        });
      }, e => {
        this.router.navigateByUrl('/login');
      });
    }
  }

}
