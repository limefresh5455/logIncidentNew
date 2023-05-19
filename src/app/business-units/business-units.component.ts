import {Component, ElementRef, OnInit, ViewChild, QueryList, ViewChildren} from '@angular/core';
import {CustomerService} from '../_services/customer.service';
import {ActivatedRoute, Router} from '@angular/router';
import {User} from '../_models/user';
import * as moment from 'moment';
import swal from 'sweetalert2';
import {NgbdSortableHeader,SortEvent} from '../_directives/sortable.directive';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {UsersService} from '../_services/users.service';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { WhiteSpaceValidator } from './../whitespace.validator';
import {CompanyService} from '../_services/company.service';
declare var $:any;

const compare = (v1: string | number, v2: string | number) => v1 < v2 ? -1 : v1 > v2 ? 1 : 0;

@Component({
  selector: 'app-business-units',
  templateUrl: './business-units.component.html',
  styleUrls: ['./business-units.component.css']
})
export class BusinessUnitsComponent implements OnInit {

  currentUser: User;
  mmtColor = null;
  accentColor = null;

  p: number = 1;
  groupList;
  unitList;
  branchList;
  unitBranchForm: FormGroup;
  submitted = false;
  closeResult: string;
  loading: boolean = true;
  unitField: boolean = false;
  body: any;
  company: any;

  @ViewChildren(NgbdSortableHeader) headers: QueryList<NgbdSortableHeader>;

  constructor(
    private customerService: CustomerService,
    private router: Router,
    private elementRef: ElementRef,
    private usersService: UsersService,
    private formBuilder: FormBuilder,
    private modalService: NgbModal,
    private companyService: CompanyService
  ) {
    const currentUser = this.customerService.getUser();
    this.mmtColor = currentUser.company.primary;
    this.accentColor = currentUser.company.accent;
  }

  ngOnInit() {
    this.companyService.getUserCompany().subscribe(
      r => {
        this.company = r.data;
      }, error => {
        console.log(error);
    });
    this.getAllBUnits();
  }

  getAllBUnits(){
    //get manager group list
    this.usersService.getUserGroupsID(this.customerService.getUser().company.id).subscribe(resp => {
      this.groupList = resp.data;
      const businessUnits = [];
      for (const test of this.groupList) {
        if(!test.parent){
          businessUnits.push(test);
        }
      }
      this.unitList = businessUnits;
    });
  }

  //for get all branch counts by unit id
  getAllBranchCountById(id){
    const branches = [];
    for (const test of this.groupList) {
      if(test.parent){
        if(test.parent.id == id){
          branches.push(test);
        }
      }
    }
    return branches.length;
  }

  //for table header row sorting
  onSort({column, direction}: SortEvent) {
    // resetting other headers
    this.headers.forEach(header => {
      if (header.sortable !== column) {
        header.direction = '';
      }
    });
    // sorting unit list
    if (direction === '' || column === '') {
      this.unitList = this.unitList;
    } else {
      this.unitList = [...this.unitList].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }

  //for open add unit and branch modal on click add business units and branch button
  openAddUnitBranchModal(content, types) {
    this.unitBranchForm = new FormGroup({});
    this.submitted = false;
    this.unitBranchForm.addControl('name', new FormControl('', [Validators.required, WhiteSpaceValidator.noSpaceValidation]));
    this.unitBranchForm.controls['name'].setErrors(null);
    if(types == 'branch'){
      this.unitField = true;
      this.unitBranchForm.addControl('parentId', new FormControl('', [Validators.required]));
      this.unitBranchForm.controls['parentId'].setErrors(null);
    }else if(types == 'units'){
      this.unitField = false;
      this.unitBranchForm.addControl('parentId', new FormControl(''));
      this.unitBranchForm.controls['parentId'].setErrors(null);
    }
    this.modalService.open(content, {backdrop: false, windowClass: 'filterClass', ariaLabelledBy: 'modal-basic-title'}).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.closeResult = `Dismissed`;
    });
  }

  //for open get all branch on click view button
  openUnitBranchModal(details, id) {
    this.loading = true;
    setTimeout(()=>{
      this.usersService.getUserGroupsID(this.customerService.getUser().company.id).subscribe(resp =>{
        this.loading = false;
        this.groupList = resp.data;
        const branches = [];
        for (const test of this.groupList) {
          if(test.parent){
            if(test.parent.id == id){
              branches.push(test);
            }
          }
        }
        this.branchList = branches;
      });
    },1000);
    this.modalService.open(details, {backdrop: false, windowClass: 'viewClass', ariaLabelledBy: 'modal-basic-title'}).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.closeResult = `Dismissed`;
    });
  }

  //for return create units and branch form validation
  get f() { return this.unitBranchForm.controls; }

  //for create business unit and branch form submit data
  onSubmit() {
    this.submitted = true;
    // stop here if form is invalid
    if (this.unitBranchForm.invalid) {
      return;
    }
    if(this.unitField == false){
      this.body = {
        "name": this.unitBranchForm.value.name,
        "companyId": this.customerService.getUser().company.id
      }
    }else{
      this.body = {
        "name": this.unitBranchForm.value.name,
        "parentId": this.unitBranchForm.value.parentId,
        "companyId": this.customerService.getUser().company.id
      }
    }
    this.usersService.addBusinessUnitsBranch(this.body).subscribe(resp => {
      swal.fire({
        title: (this.unitField == false) ? 'Business Units Created.' : 'Branch Created.',
        icon: 'success',
        text: 'Thanks for submission',
      });
      this.modalService.dismissAll();
      this.getAllBUnits();
    }, e => {
      this.router.navigateByUrl('/login');
    });
  }

}




