import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CustomerService } from '../_services/customer.service';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from '../_models/user';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ConfirmedValidator } from './confirmed.validator';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MmtService } from '../_services/mmt.service';
import swal from 'sweetalert2';
import { WhiteSpaceValidator } from './../whitespace.validator';
import { Observable } from 'rxjs/Observable';
import { startWith } from 'rxjs/operators/startWith';
import { map } from 'rxjs/operators/map';
import { CompanyService } from '../_services/company.service';
import { UsersService } from '../_services/users.service';

@Component({
  selector: 'app-update-audits',
  templateUrl: './update-audits.component.html',
  styleUrls: ['./update-audits.component.css']
})
export class UpdateAuditsComponent implements OnInit {
  hideShowRead: any;
  mmtView = true;
  currentUser: User;
  mmtColor = null;
  accentColor = null;

  editForm: FormGroup;
  submitted = false;

  resetPassForm: FormGroup;
  submitted1 = false;

  closeResult: string;

  mmtAdminList: any = [];
  userList: any = [];
  branchList: any = [];
  selectBranchList: any = [];
  unitList: any = [];
  uniqueListUnit : any =[];
  user:any;

  creatorsList: any = [];
  toHighlight = '';
  filteredCreators: Observable<any[]>;
  filteredCreators1: Observable<any[]>;
  auditorId: any;
  myAuditordata: any;
  values: any;
  values1: any;
  supervisorId: any;
  mySupervisor1: any;

  constructor(
    private customerService: CustomerService,
    private router: Router,
    private elementRef: ElementRef,
    private formBuilder: FormBuilder,
    private modalService: NgbModal,
    private mmtService: MmtService,
    private route: ActivatedRoute,
    private companyService: CompanyService,
    private usersService: UsersService,
  ) {
    const currentUser = this.customerService.getUser();
    this.mmtColor = currentUser.company.primary;
    this.accentColor = currentUser.company.accent;
  }

  ngOnInit() {
  //  //get user data
  //  this.usersService.getUserData().subscribe(
  //   r => {
  //     this.user = r.data;
  //     if (this.user.isAuditor == false) {
  //       this.loadUpdateAudit();
  //     } else {
  //       this.router.navigateByUrl('/404');
  //     }
  //   }, error => {
  //     console.log(error);
  //   });
   //get param mmt id
   const id = this.route.snapshot.paramMap.get('id');
   //for edit mmt form validation
   this.editForm = this.formBuilder.group({
     id: [''],
     name: ['', [Validators.required, WhiteSpaceValidator.noSpaceValidation]],
     businessUnitId: ['', Validators.required],
     branchId: ['', Validators.required],
     branchsupervisorId: ['', Validators.required],
     branchauditorId: ['', Validators.required]
   });

   //for reset password form validation
   this.resetPassForm = this.formBuilder.group({
     password: ['', Validators.required],
     conf_password: ['', Validators.required],
   }, {
     validator: ConfirmedValidator('password', 'conf_password') // password and conf password validation function
   });

   //get user list and branch list
  //  this.mmtService.getMmtAdminUserList().subscribe(resp => {
  //    this.userList = resp.data.users;
  //    this.branchList = resp.data.groups;
  //    console.log(this.branchList)
  //    for (const test of this.branchList) {
  //      if (!test.parent) {
  //        this.unitList.push(test);
  //      }
  //    }
  //  });

   // new api for get parent and child in drop down
   this.companyService.getGroupBranch(this.customerService.getUser().company.id).subscribe((resp)=>{
    this.branchList = resp.data
    setTimeout(() => {
    for (const item of  this.branchList){
      if(!item.parent)   {
          this.unitList.push(item)
        }
      }
    }, 1000);
    function removeDuplicates(array: any[]): any[] {
      return array.filter((value, index, self) => {
        return self.indexOf(value) === index;
      });
    }
    const originalArray: number[] = this.unitList
    this.uniqueListUnit= removeDuplicates(originalArray);
  })

   //get mmt admin list and also selected edit mmt form fields
   this.mmtService.getMmtAdminList().subscribe(resp => {
     this.mmtAdminList = resp.data;
     for (const mmt of this.mmtAdminList) {
       if (mmt.id == id) {
         this.values1 = (mmt && mmt.branchsupervisor) ? {name: mmt.branchsupervisor.firstName + ' ' + mmt.branchsupervisor.lastName, value: mmt.branchsupervisor.id } : '' 
         this.displayFn(this.values1)
         this.values = (mmt && mmt.branchauditor) ? {name:mmt.branchauditor.firstName + ' ' + mmt.branchauditor.lastName, value:mmt.branchauditor.id} : ''
         this.displayFn1(this.values)
         this.editForm.setValue({
           id: id,
           name: mmt.name,
           businessUnitId: mmt.branch.parent.id,
           branchId: mmt.branch.id,
           branchsupervisorId: (mmt && mmt.branchsupervisor) ? {name:mmt.branchsupervisor.firstName + ' ' + mmt.branchsupervisor.lastName, value:mmt.branchsupervisor.id} : '',
           branchauditorId: (mmt && mmt.branchauditor) ? {name:mmt.branchauditor.firstName + ' ' + mmt.branchauditor.lastName, value:mmt.branchauditor.id} : ''
         });
         this.supervisorId = this.values1.value
         this.auditorId = this.values.value
         this.selectUnit(mmt.branch.parent.id, false);
       }
     }
   });


  }

  //fetch update data
  loadUpdateAudit (){

  }


  //get form branchId field
  get branchId(): FormControl {
    return this.editForm.get('branchId') as FormControl;
  }

  // filter by on change business unit get branch list
  selectUnit(event, types) {
    this.mmtService.getMmtAdminUserList().subscribe(resp => {
      this.branchList = resp.data.groups;
      const selectedBranch = [];
      for (const mmt of this.branchList) {
        if (mmt.parent) {
          if (mmt.parent.id == event) {
            selectedBranch.push(mmt);
          }
        }
      }
      const gId = this.editForm.controls['branchId'].value;
      if (types == true) {
        if (selectedBranch.length > 0) {
          this.branchId.setValue(selectedBranch[0].id);
        }
      }
      this.selectBranchList = selectedBranch;
    });
  }

  //for return edit mmt form validation
  get f() { return this.editForm.controls; }

  //for return reset password form validation
  get rPass() { return this.resetPassForm.controls; }

  // for display user name on select mat-autocomplete
  displayFn(user): string {
    return user && user.name ? user.name : '';
  }
  displayFn1(user): string {
    return user && user.name ? user.name : '';
  }
  // for get autocomplete users list
  filterCreators(name: string) {
    this.toHighlight = name;
    return this.creatorsList.filter(state =>
      state.name.toLowerCase().indexOf(name.toLowerCase()) >= 0);
  }
  // for get users list by type user name from api
  searchCompanyUsers(term, types) {
    if (term) {
      this.companyService.searchCompanyUsersByTerm(term).subscribe(response => {
        this.creatorsList = [];
        const users = response.data;
        users.forEach((user, index) => {
          const userData = { 'name': user.firstName + ' ' + user.lastName, 'value': user.id };
          this.creatorsList.push(userData);
          if(types == 'supervisor') {
            this.filteredCreators = this.editForm.controls['branchsupervisorId'].valueChanges
              .pipe(
                startWith(''),
                map(value => typeof value === 'string' ? value : value.name),
                map(name => name ? this.filterCreators(name) : this.creatorsList.slice())
              );
          } else {
            this.filteredCreators1 = this.editForm.controls['branchauditorId'].valueChanges
              .pipe(
                startWith(''),
                map(value => typeof value === 'string' ? value : value.name),
                map(name => name ? this.filterCreators(name) : this.creatorsList.slice())
              );
          }
        });
      }, e => {
      });
    }
  }

  // for get incidents list by users onselect and onchange from api
  onSelectionChanged(event, types) {
    if(types == 'supervisor') {
      this.supervisorId = event.value;
    } else {
      this.auditorId = event.value;
    }
  }

  //for open reset password modal
  openResetPassModal(resetPass) {
    this.modalService.open(resetPass, { ariaLabelledBy: 'modal-basic-title' }).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.closeResult = `Dismissed`;
    });
  }

  //for edit mmt form submit data
  onSubmit() {
    this.submitted = true;
    // stop here if form is invalid
    if (this.editForm.invalid) {
      return;
    }
    this.editForm.value['branchauditorId'] = this.auditorId;
    this.editForm.value['branchsupervisorId'] = this.supervisorId;
    delete this.editForm.value.businessUnitId;
    this.mmtService.updateMmtAdminAccount(this.editForm.value).subscribe(resp => {
      swal.fire({
        title: 'Audits Admin Account Updated',
        icon: 'success',
      });
      this.router.navigateByUrl('/audits-admin');
    }, e => {
      this.router.navigateByUrl('/login');
    });
  }

  //for reset password form submit data
  onSubmitResetPass() {
    this.submitted1 = true;

    if (this.resetPassForm.invalid) {
      return;
    }
    this.modalService.dismissAll();

    alert('SUCCESS!! :-)\n\n' + JSON.stringify(this.resetPassForm.value))
  }

}


