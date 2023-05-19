import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {UsersService} from '../_services/users.service';
import {CustomerService} from '../_services/customer.service';
import {Router} from '@angular/router';
import {CompanyService} from '../_services/company.service';
import {group} from '@angular/animations';
import {WhiteSpaceValidator} from './../whitespace.validator';
import {Observable} from 'rxjs/Observable';
import {startWith} from 'rxjs/operators/startWith';
import {map} from 'rxjs/operators/map';
import swal from 'sweetalert2';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  form: FormGroup = null;
  submitted = false;
  userId;
  userData;
  isDemo = false;
  userGroupId = null;
  userTeamid = null;

  groupTypeParentId;
  showChildGroup = false;
  parentGroup = [];
  childrenGroup = [];
  groupTypes = null;
  companyColor: string;
  userInfo: any;
  fakeProfile: any;
  supervisorField: any;
  currentGroup;
  profileFields;
  customResponses;
  selectedChildren = [];
  parentId = null;

  filteredCreators: Observable<any[]>;
  toHighlight = '';
  creatorsList: any = [];
  mySupervisor: any;
  incidentsType: any = [];
  paramsFilter: any;
  supervisorId: any;
  company: any;
  hideShowRead: any;

  constructor(
    private userService: UsersService,
    private customerService: CustomerService,
    private router: Router,
    private companyService: CompanyService
  ) {
  }

  ngOnInit() {
    this.companyService.getUserCompany().subscribe(
      r => {
        this.company = r.data;
        if (this.company.profileSupervisorEmail == 'yes') {
          this.hideShowRead = 'show_supervisor';
        } else if (this.company.profileSupervisorEmail == 'no') {
          this.hideShowRead = 'hide_supervisor';
        } else if (this.company.profileSupervisorEmail == 'readonly') {
          this.hideShowRead = 'read_supervisor';
        }
      }, error => {
        console.log(error);
      });
    const user = this.customerService.getUser();
    this.companyColor = user.company.primary;
    this.userInfo = user;
    this.userService.getProfileData().subscribe(resp => {
        const fields = [];
        if (resp.data.company.profile) {
          resp.data.company.profile.fields.forEach(function (value, i) {
            const field = {
              id: value.id,
              placeholder: value.placeHolder,
              title: value.title,
              type: value.type,
              order: value.order,
              fieldValue: null,
              isDisabled: value.isDisabled
            };
            if (resp.data.profile && resp.data.profile.fields[i] && resp.data.profile.fields[i].fieldValue.length > 0) {
              field.fieldValue = resp.data.profile.fields[i].fieldValue;
            }
            fields.push(field);
          });
        }
        fields.sort((a, b) => (a.order > b.order) ? 1 : -1);
        this.profileFields = fields;
      },
      e => {
        console.log(e);
      });
    this.companyColor = user.company.primary;
    this.userInfo = user;

    this.userId = user.id;
    this.userService.getUser().subscribe(r => {
      const controls = {};
      this.userData = r.data;
      this.companyService.getCompanyGroupTypesWithGroups(this.customerService.getUser().company.id).subscribe(resp => {
        // collect user groups ids
        this.isDemo = resp.data.isDemo;
        this.fakeProfile = resp.data.isFakeProfile;
        this.supervisorField = resp.data.profileSupervisorEmail;
        if (!this.isDemo) {
          controls['firstName'] = new FormControl(this.userData.firstName, [Validators.required, Validators.pattern(/^[\w\s]+$/), WhiteSpaceValidator.noSpaceValidation]);
          controls['lastName'] = new FormControl(this.userData.lastName, [Validators.required, WhiteSpaceValidator.noSpaceValidation]);
          controls['email'] = new FormControl(this.userData.email, [Validators.required, Validators.email, Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')]);
          controls['phone'] = new FormControl((this.userData && this.userData.phone) ? this.userData.phone : '', [Validators.required, WhiteSpaceValidator.noSpaceValidation]);
          if (this.supervisorField == 'yes') {
            controls['supervisor'] = new FormControl((this.userData && this.userData.supervisor) ? this.userData.supervisor.firstName + ' ' + this.userData.supervisor.lastName : '', [Validators.required]);
          } else {
            controls['supervisor'] = new FormControl();
          }
        } else {
          controls['firstName'] = new FormControl('', [Validators.required, Validators.pattern(/^[\w\s]+$/), WhiteSpaceValidator.noSpaceValidation]);
          controls['lastName'] = new FormControl('', [Validators.required, WhiteSpaceValidator.noSpaceValidation]);
          controls['email'] = new FormControl('', [Validators.required, Validators.email, Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')]);
          controls['phone'] = new FormControl('', [Validators.required, WhiteSpaceValidator.noSpaceValidation]);
          if (this.supervisorField == 'yes') {
            controls['supervisor'] = new FormControl('', [Validators.required]);
          } else {
            controls['supervisor'] = new FormControl();
          }
        }

        if ('groupTypes' in resp.data) {
          this.groupTypes = resp.data.groupTypes;
          if (r.data.userGroup) {
            this.currentGroup = r.data.userGroup;
          }
          for (const groupType of resp.data.groupTypes) {
            if (groupType.groups.length > 0) {
              if (this.checkForGroupType(groupType.groups, 'children')) {
                groupType.groups.sort((a, b) => (a.name > b.name) ? 1 : -1);
                this.parentGroup.push(groupType);
                if (this.currentGroup && this.currentGroup.parent.id) {
                  controls[groupType.id] = new FormControl(this.currentGroup.parent.id, [Validators.required]);
                } else {
                  controls[groupType.id] = new FormControl('', [Validators.required]);
                }

              } else if (this.checkForGroupType(groupType.groups, 'parent')) {

                groupType.groups.sort((a, b) => (a.name > b.name) ? 1 : -1);
                this.childrenGroup.push(groupType);
                if (this.currentGroup && this.currentGroup.id) {
                  controls[groupType.id] = new FormControl(this.currentGroup.id, [Validators.required]);
                } else {
                  controls[groupType.id] = new FormControl('', [Validators.required]);
                }

              } else {

                this.userService.getUserGroups(this.customerService.getUser().company.id).subscribe(respo => {
                  groupType.groups = respo.data;
                  groupType.groups.sort((a, b) => (a.name > b.name) ? 1 : -1);
                  this.parentGroup.push(groupType);
                  if (this.currentGroup && this.currentGroup.id) {
                    this.parentId = this.currentGroup.id;
                    controls[groupType.id] = new FormControl(this.currentGroup.id, [Validators.required]);
                  } else {
                    controls[groupType.id] = new FormControl('', [Validators.required]);
                  }
                });


              }

            }
          }
          if (r.data.userGroup) {
            if (r.data.userGroup.parent) {
              this.setChild(r.data.userGroup.parent.id);
            }
            this.currentGroup = r.data.userGroup;
          }
        }

        if (this.profileFields) {
          this.profileFields.forEach(function (value) {
            if (value.title == 'Supervisor Email') {
              if (value.fieldValue != '') {
                controls[value.id] = new FormControl(value.fieldValue, [Validators.required, Validators.email, Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')]);
              } else {
                controls[value.id] = new FormControl('', [Validators.required, Validators.email, Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')]);
              }
            } else {
              if (value.fieldValue != '') {
                controls[value.id] = new FormControl(value.fieldValue, [Validators.required]);
              } else {
                controls[value.id] = new FormControl('', [Validators.required]);
              }
            }
          });
        }
        if (!this.form) {
          this.form = new FormGroup(controls);
        }
      });
    });
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
          const userData = {'name': user.firstName + ' ' + user.lastName, 'value': user.id};
          this.creatorsList.push(userData);
          this.filteredCreators = this.form.controls['supervisor'].valueChanges
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

  checkForGroupType(groups, type) {
    for (let i = 0; i < groups.length; i++) {
      if (type in groups[i]) {
        return true;
      }
    }
  }

  setChild(value) {
    for (let i = 0; i < this.childrenGroup.length; i++) {
      // Loop through children
      const child = {
        groups: [],
        name: null,
        id: null
      };
      for (let num = 0; num < this.childrenGroup[i].groups.length; num++) {
        // Look in children to find one matching selected parent.
        if (this.childrenGroup[i].groups[num].parent.id === value) {
          if (this.selectedChildren.findIndex(x => x.id === this.childrenGroup[i].id)) {
            // if the child is related to the parent and child hasnt been added to selectedChildren
            child.name = this.childrenGroup[i].name;
            child.id = this.childrenGroup[i].id;
            child.groups.push(this.childrenGroup[i].groups[num]);
            this.selectedChildren.push(child);
          } else {
            const childIndex = this.selectedChildren.findIndex(x => x.id === this.childrenGroup[i].id);
            // if the child has been added to selected Children then add the matching group to the child
            this.selectedChildren[childIndex].groups.push(this.childrenGroup[i].groups[num]);
            // then check for any groups not matching the parent and remove them
            for (let index = 0; index < this.selectedChildren[childIndex].groups.length; index++) {
              if (this.selectedChildren[childIndex].groups[index].parent.id !== value) {
                //  remove it
                this.selectedChildren[childIndex].groups.splice(index, 1);
              }
            }
          }
          if (this.form) {
            const control = this.form.get(this.selectedChildren[0].id);
            control.setValue(this.selectedChildren[0].groups[0].id);
          }
        }
      }
    }
  }

  // TODO SUPPORT GRANDCHILD OPTION

  logout() {
    this.customerService.logout();
    this.router.navigateByUrl('/login');
  }

  submitForm(e) {
    // e.preventDefault();
    this.submitted = true;
    if (this.isDemo || this.fakeProfile) {
      return;
    }

    if (this.form.invalid) {
      return;
    }
    if (this.form.value['supervisor'] && this.supervisorId) {
      this.form.value['supervisor'] = this.supervisorId;
    }
    let userGroupId = null;
    if (this.selectedChildren.length > 0) {
      for (let i = 0; i < this.selectedChildren.length; i++) {
        userGroupId = this.form.value[this.selectedChildren[i].id];
      }
    } else if (this.parentGroup.length > 0) {
      for (let i = 0; i < this.parentGroup.length; i++) {
        userGroupId = this.form.value[this.parentGroup[i].id];
      }
    }

    if (this.profileFields) {
      const customResponsesArray = [];
      this.profileFields.forEach(function (value) {
        if ((<HTMLInputElement>document.getElementById(value.id)).value.length) {
          const customResponse = {
            'fieldTitle': value.title,
            'fieldValue': (<HTMLInputElement>document.getElementById(value.id)).value
          };
          customResponsesArray.push(customResponse);
        }
      });
      this.customResponses = customResponsesArray;
    }
    // Demo cant submit
    this.userService.updateUser(this.userId, this.form.value.firstName, this.form.value.lastName, this.form.value.email, this.form.value.phone, userGroupId, this.form.value.supervisor
    ).subscribe(r => {
      if (this.customResponses && this.customResponses.length) {
        this.userService.updateCustomFields(this.customResponses).subscribe(resp => {
          swal.fire({
            title: 'Edit Profile Successfully',
            icon: 'success',
          });
          this.customerService.updateUser(this.form.value.firstName, this.form.value.lastName, this.form.value.email, this.form.value.phone);
          this.router.navigateByUrl('/dashboard');
        }, e => {
          alert(e.error.error);
        });
      } else {
        this.customerService.updateUser(this.form.value.firstName, this.form.value.lastName, this.form.value.email, this.form.value.phone);
        this.router.navigateByUrl('/dashboard');
      }
      // Check for custom profile fields.
    }, er => {
      alert(er.error.error);
    });
  }
}
