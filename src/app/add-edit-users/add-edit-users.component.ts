import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CustomerService } from '../_services/customer.service';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from '../_models/user';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { UsersService } from '../_services/users.service';
import swal from 'sweetalert2';
import { WhiteSpaceValidator } from './../whitespace.validator';
import { Observable } from 'rxjs/Observable';
import { startWith } from 'rxjs/operators/startWith';
import { map } from 'rxjs/operators/map';
import { CompanyService } from '../_services/company.service';

@Component({
  selector: 'app-add-edit-users',
  templateUrl: './add-edit-users.component.html',
  styleUrls: ['./add-edit-users.component.css']
})
export class AddEditUsersComponent implements OnInit {

  currentUser: User;
  userColor = null;
  accentColor = null;

  addEditForm: FormGroup;
  submitted = false;

  userId;
  userList: any = [];
  users: any = [];
  groupList: any = [];
  mailList: any = [];
  userMail: any = [];
  isEmail = false;
  unitList: any = [];
  selectBranchList: any = [];
  profileF;
  profileFields;
  editUser: any;
  userEmail: any;

  filteredCreators: Observable<any[]>;
  toHighlight = '';
  creatorsList: any = [];
  mySupervisor: any;
  incidentsType: any = [];
  paramsFilter: any;
  supervisorId: any;

  constructor(
    private customerService: CustomerService,
    private router: Router,
    private elementRef: ElementRef,
    private formBuilder: FormBuilder,
    private usersService: UsersService,
    private route: ActivatedRoute,
    private companyService: CompanyService
  ) {
    this.currentUser = this.customerService.getUser();
    this.userColor = this.currentUser.company.primary;
    this.accentColor = this.currentUser.company.accent;
  }

  ngOnInit() {
    //for add edit user form validation
    const phoneNumberPattern = /^\+?\d+$/;

    this.addEditForm = this.formBuilder.group({
      firstName: ['', [Validators.required, WhiteSpaceValidator.noSpaceValidation]],
      lastName: ['', [Validators.required, WhiteSpaceValidator.noSpaceValidation]],
      phone: ['', [Validators.required,  Validators.pattern(phoneNumberPattern)]],
      email: ['', [Validators.required, Validators.pattern('[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{1,63}$')]],
      admin: [false],
      isDashboardViewOnly: [false],
      isManager: [false],
      isRestrictedAdmin: [false],
      isProjectManager: [false],
      b_unit: ['', Validators.required],
      groupId: ['', Validators.required],
      supervisor: ['', Validators.required],
      isAppOnly: [false],
      isActive: [false],
      resetPasswordNextLogin: [false],
    });
    //get param user id
    this.userId = this.route.snapshot.paramMap.get('id');
    if (!this.userId) {
      // this field use for add user only
      this.addEditForm.addControl('password', new FormControl(null, [Validators.required]));
      this.addEditForm.controls['password'].setErrors(null);
    }

    //get mail list
    this.usersService.getUserList().subscribe(resp => {
      this.userMail = resp.data.users;
      for (const val of this.userMail) {
        this.mailList.push(val.email);
      }
    });

    //get user list
    this.usersService.getUserGroupsID(this.customerService.getUser().company.id).subscribe(resp => {
      this.groupList = resp.data;
      for (const test of this.groupList) {
        if (!test.parent) {
          this.unitList.push(test);
        }
      }
    });

    //get user list and also selected edit user form fields
    if (this.userId) {
      this.userList = this.route.snapshot.data.usersDetail.data;
      for (const user of this.userList) {
        if (user.id == this.userId) {
          this.userEmail = user.email;
          this.addEditForm.setValue({
            firstName: user.firstName,
            lastName: user.lastName,
            phone: (user.phone) ? user.phone : '',
            email: user.email,
            admin: user.admin,
            isDashboardViewOnly: user.isDashboardViewOnly,
            isManager: user.isManager,
            isRestrictedAdmin: user.isRestrictedAdmin,
            isProjectManager: user.isProjectManager,
            b_unit: (user.userGroup) ? user.userGroup.parent.id : '',
            groupId: (user.userGroup) ? user.userGroup.id : '',
            supervisor: (user && user.supervisor) ? user.supervisor.firstName + ' ' + user.supervisor.lastName : '',
            isAppOnly: user.isAppOnly,
            isActive: user.isActive,
            resetPasswordNextLogin: user.resetPasswordNextLogin
          });
          this.selectUnit((user.userGroup) ? user.userGroup.parent.id : '', false);
        }
      }
    }

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
          const userData = { 'name': user.firstName + ' ' + user.lastName, 'value': user.id };
          this.creatorsList.push(userData);
          this.filteredCreators = this.addEditForm.controls['supervisor'].valueChanges
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

  // for get incidents list by users onselect and onchange from api
  onSelectionChanged(event) {
    this.supervisorId = event.value;
  }

  //get form groupId field
  get groupId(): FormControl {
    return this.addEditForm.get('groupId') as FormControl;
  }

  //for get branch name by select business unit
  selectUnit(event, types) {
    if (!this.userId) {
      this.groupId.setValue('');
    }
    this.usersService.getUserGroupsID(this.customerService.getUser().company.id).subscribe(resp => {
      this.groupList = resp.data;
      const selectedBranch = [];
      for (const group of this.groupList) {
        if (group.parent) {
          if (group.parent.id == event) {
            selectedBranch.push(group);
          }
        }
      }
      const gId = this.addEditForm.controls['groupId'].value;
      if (this.userId) {
        if (types == true) {
          if (selectedBranch.length > 0) {
            this.groupId.setValue(selectedBranch[0].id);
          }
        }
      }
      this.selectBranchList = selectedBranch;
    });
  }

  //for return add edit user form validation
  get f() { return this.addEditForm.controls; }

  //for add edit user form submit data
  onSubmit() {
    this.submitted = true;
    // stop here if form is invalid
    if (this.addEditForm.invalid) {
      return;
    }
    if (this.mailList.indexOf(this.addEditForm.value['email']) !== -1 && !this.userId) {
      this.isEmail = true;
    } else if (this.mailList.indexOf(this.addEditForm.value['email']) !== -1 && this.userId) {
      if (this.userEmail != this.addEditForm.value['email']) {
        this.isEmail = true;
      } else {
        this.isEmail = false;
      }
    } else {
      this.isEmail = false;
    }
    if (!this.isEmail) {
      this.addEditForm.value['supervisor'] = this.supervisorId;
      delete this.addEditForm.value.b_unit;
      if (this.userId) {
        this.usersService.updateManagerUser(this.addEditForm.value, this.userId).subscribe(resp => {
          swal.fire({
            title: 'Edit User Successfully',
            icon: 'success',
          });
          this.router.navigateByUrl('/users');
        }, e => {
          this.router.navigateByUrl('/login');
        });
      } else {
        this.usersService.addUser(this.addEditForm.value).subscribe(resp => {
          swal.fire({
            title: 'Add User Successfully',
            icon: 'success',
            text: 'Thanks for submission',
          });
          this.router.navigateByUrl('/users');
        }, e => {
          this.router.navigateByUrl('/login');
        });
      }
    }
  }

}
