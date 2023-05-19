import { Component, ElementRef, OnInit, ViewChild, QueryList, ViewChildren } from '@angular/core';
import { CustomerService } from '../_services/customer.service';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from '../_models/user';
import * as moment from 'moment';
import { MmtService } from '../_services/mmt.service';
import swal from 'sweetalert2';
import { UsersService } from '../_services/users.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbdSortableHeader, SortEvent } from '../_directives/sortable.directive';
declare var $: any;

const compare = (v1: string | number, v2: string | number) => v1 < v2 ? -1 : v1 > v2 ? 1 : 0;

@Component({
  selector: 'app-audits-admin',
  templateUrl: './audits-admin.component.html',
  styleUrls: ['./audits-admin.component.css']
})
export class AuditsAdminComponent implements OnInit {

  mmtView = true;
  currentUser: User;
  mmtColor = null;
  accentColor = null;
  user: any;
  p: number = 1;
  mmtAdminList;
  userList;
  branchList: any = [];
  unitList: any = [];
  selectBranchList: any = [];
  selectMmtNameList;
  filterForm: FormGroup;

  @ViewChildren(NgbdSortableHeader) headers: QueryList<NgbdSortableHeader>;

  constructor(
    private customerService: CustomerService,
    private router: Router,
    private elementRef: ElementRef,
    private mmtService: MmtService,
    private formBuilder: FormBuilder,
    private usersService: UsersService,
  ) {
    const currentUser = this.customerService.getUser();
    this.mmtColor = currentUser.company.primary;
    this.accentColor = currentUser.company.accent;
  }

  ngOnInit() {

    //for create filter form fields
    this.filterForm = this.formBuilder.group({
      b_name: ['All'],
      b_unit: ['All'],
      branch: ['All'],
      users: ['All']
    });
    //get user data
    this.usersService.getUserData().subscribe(
      r => {
        this.user = r.data;
        if (this.user.isAuditor == true) {
          this.loadAuditAdmin()
        } else {
          this.router.navigateByUrl('/404');
        }
      }, error => {
        console.log(error);
      });
  }

  //Redirect data after condition
  loadAuditAdmin() {
    //get mmt admin user list and branch list
    this.mmtService.getMmtAdminUserList().subscribe(resp => {
      this.userList = resp.data.users;
      this.branchList = resp.data.groups;
      for (const test of this.branchList) {
        if (!test.parent) {
          this.unitList.push(test);
        }
      }
    });
    this.getAllAuditData();
  }
  //get mmt admin list
  getAllAuditData() {
    this.mmtService.getMmtAdminList().subscribe(resp => {
      this.mmtAdminList = resp.data;
      this.selectMmtNameList = resp.data;
      for (const mmt of this.mmtAdminList) {
        mmt['businessUnitId'] = mmt.branch.parent.id;
        mmt['businessUnit'] = mmt.branch.parent.name;
        mmt['branchId'] = mmt.branch.id;
        mmt['branch'] = mmt.branch.name;
        mmt['auditorId'] = mmt.branchauditor.id;
        mmt['auditor'] = mmt.branchauditor.firstName + ' ' + mmt.branchauditor.lastName;
        mmt['supervisorId'] = mmt.branchsupervisor.id;
        mmt['supervisor'] = mmt.branchsupervisor.firstName + ' ' + mmt.branchsupervisor.lastName;
      }
    });
  }

  //for table header row sorting
  onSort({ column, direction }: SortEvent) {
    // resetting other headers
    this.headers.forEach(header => {
      if (header.sortable !== column) {
        header.direction = '';
      }
    });
    // sorting question list
    if (direction === '' || column === '') {
      this.mmtAdminList = this.mmtAdminList;
    } else {
      this.mmtAdminList = [...this.mmtAdminList].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }

  //for filter function by name onchange
  filterName(event) {
    const filterData = [];
    this.mmtService.getMmtAdminList().subscribe(resp => {
      this.mmtAdminList = resp.data;
      for (const mmt of this.mmtAdminList) {
        mmt['businessUnitId'] = mmt.branch.parent.id;
        mmt['businessUnit'] = mmt.branch.parent.name;
        mmt['branchId'] = mmt.branch.id;
        mmt['branch'] = mmt.branch.name;
        mmt['auditorId'] = mmt.branchauditor.id;
        mmt['auditor'] = mmt.branchauditor.firstName + ' ' + mmt.branchauditor.lastName;
        mmt['supervisorId'] = mmt.branchsupervisor.id;
        mmt['supervisor'] = mmt.branchsupervisor.firstName + ' ' + mmt.branchsupervisor.lastName;
      }
      for (const mmt1 of this.mmtAdminList) {
        if (mmt1.name == event.target.value) {
          filterData.push(mmt1);
        } else if (mmt1.name == event.target.value || this.filterForm.value.b_unit == mmt1.businessUnitId) {
          filterData.push(mmt1);
        } else if (mmt1.name == event.target.value && this.filterForm.value.b_unit == mmt1.businessUnitId) {
          filterData.push(mmt1);
        } else if (mmt1.auditor == this.filterForm.value.users || mmt1.supervisor == this.filterForm.value.users) {
          filterData.push(mmt1);
        } else if (event.target.value == "All" && this.filterForm.value.b_unit == mmt1.businessUnitId) {
          filterData.push(mmt1);
        } else if (event.target.value == "All" && this.filterForm.value.b_unit == "All" && mmt1.auditor == this.filterForm.value.users || mmt1.supervisor == this.filterForm.value.users) {
          filterData.push(mmt1);
        } else if (event.target.value == "All" && this.filterForm.value.b_unit == "All" && this.filterForm.value.users == "All") {
          filterData.push(mmt1);
        }
      }
      this.mmtAdminList = filterData;
      this.p = 1;
    });
  }

  //for filter function by unit
  selectUnit(event) {
    const selectedBranch = [];
    for (const mmt of this.branchList) {
      if (mmt.parent) {
        if (mmt.parent.id == event.target.value) {
          selectedBranch.push(mmt);
        }
      }
    }
    this.selectBranchList = selectedBranch;
    const filterData = [];
    this.mmtService.getMmtAdminList().subscribe(resp => {
      this.mmtAdminList = resp.data;
      for (const mmt of this.mmtAdminList) {
        mmt['businessUnitId'] = mmt.branch.parent.id;
        mmt['businessUnit'] = mmt.branch.parent.name;
        mmt['branchId'] = mmt.branch.id;
        mmt['branch'] = mmt.branch.name;
        mmt['auditorId'] = mmt.branchauditor.id;
        mmt['auditor'] = mmt.branchauditor.firstName + ' ' + mmt.branchauditor.lastName;
        mmt['supervisorId'] = mmt.branchsupervisor.id;
        mmt['supervisor'] = mmt.branchsupervisor.firstName + ' ' + mmt.branchsupervisor.lastName;
      }
      for (const mmt1 of this.mmtAdminList) {
        if (mmt1.businessUnitId == event.target.value) {
          filterData.push(mmt1);
        } else if (mmt1.businessUnitId == event.target.value || this.filterForm.value.b_name == mmt1.name) {
          filterData.push(mmt1);
        } else if (mmt1.businessUnitId == event.target.value && this.filterForm.value.b_name == mmt1.name) {
          filterData.push(mmt1);
        } else if (mmt1.auditor == this.filterForm.value.users || mmt1.supervisor == this.filterForm.value.users) {
          filterData.push(mmt1);
        } else if (event.target.value == "All" && this.filterForm.value.b_name == mmt1.name) {
          filterData.push(mmt1);
        } else if (event.target.value == "All" && this.filterForm.value.b_name == "All" && mmt1.auditor == this.filterForm.value.users || mmt1.supervisor == this.filterForm.value.users) {
          filterData.push(mmt1);
        } else if (event.target.value == "All" && this.filterForm.value.b_name == "All" && this.filterForm.value.users == "All") {
          filterData.push(mmt1);
        }
      }
      this.mmtAdminList = filterData;
      this.p = 1;
    });
  }

  //for filter function by branch
  filterBranchList(event) {
    const filterData = [];
    this.mmtService.getMmtAdminList().subscribe(resp => {
      this.mmtAdminList = resp.data;
      for (const mmt of this.mmtAdminList) {
        mmt['businessUnitId'] = mmt.branch.parent.id;
        mmt['businessUnit'] = mmt.branch.parent.name;
        mmt['branchId'] = mmt.branch.id;
        mmt['branch'] = mmt.branch.name;
        mmt['auditorId'] = mmt.branchauditor.id;
        mmt['auditor'] = mmt.branchauditor.firstName + ' ' + mmt.branchauditor.lastName;
        mmt['supervisorId'] = mmt.branchsupervisor.id;
        mmt['supervisor'] = mmt.branchsupervisor.firstName + ' ' + mmt.branchsupervisor.lastName;
      }
      for (const mmt1 of this.mmtAdminList) {
        if (mmt1.branchId == event.target.value) {
          filterData.push(mmt1);
        } else if (event.target.value == mmt1.branchId && this.filterForm.value.b_name == mmt1.name) {
          filterData.push(mmt1);
        } else if (event.target.value == mmt1.branchId || this.filterForm.value.b_name == mmt1.name) {
          filterData.push(mmt1);
        } else if (event.target.value == "All") {
          if (mmt1.businessUnitId == this.filterForm.value.b_unit) {
            filterData.push(mmt1);
          } else if (this.filterForm.value.b_name == mmt1.name) {
            filterData.push(mmt1);
          }
        }
      }
      this.mmtAdminList = filterData;
      this.p = 1;
    });
  }

  //for filter function by users
  filterUserList(event) {
    const filterData = [];
    this.mmtService.getMmtAdminList().subscribe(resp => {
      this.mmtAdminList = resp.data;
      for (const mmt of this.mmtAdminList) {
        mmt['businessUnitId'] = mmt.branch.parent.id;
        mmt['businessUnit'] = mmt.branch.parent.name;
        mmt['branchId'] = mmt.branch.id;
        mmt['branch'] = mmt.branch.name;
        mmt['auditorId'] = mmt.branchauditor.id;
        mmt['auditor'] = mmt.branchauditor.firstName + ' ' + mmt.branchauditor.lastName;
        mmt['supervisorId'] = mmt.branchsupervisor.id;
        mmt['supervisor'] = mmt.branchsupervisor.firstName + ' ' + mmt.branchsupervisor.lastName;
      }
      for (const mmt1 of this.mmtAdminList) {
        if (mmt1.auditor == event.target.value || mmt1.supervisor == event.target.value) {
          filterData.push(mmt1);
        } else if (mmt1.auditor == event.target.value || mmt1.supervisor == event.target.value && mmt1.businessUnitId == this.filterForm.value.b_unit || mmt1.branchId == this.filterForm.value.branch) {
          filterData.push(mmt1);
        } else if (mmt1.businessUnitId == this.filterForm.value.b_unit && mmt1.branchId == this.filterForm.value.branch) {
          filterData.push(mmt1);
        } else if (this.filterForm.value.b_name == mmt1.name) {
          filterData.push(mmt1);
        } else if (mmt1.businessUnitId == this.filterForm.value.b_unit && mmt1.branchId == this.filterForm.value.branch) {
          filterData.push(mmt1);
        } else if (event.target.value == "All" && this.filterForm.value.b_unit == "All" && this.filterForm.value.branch == "All") {
          filterData.push(mmt1);
        } else if (event.target.value == "All" && mmt1.businessUnitId == this.filterForm.value.b_unit || mmt1.branchId == this.filterForm.value.branch) {
          filterData.push(mmt1);
        }
      }
      this.mmtAdminList = filterData;
      this.p = 1;
    });
  }

  //for reset filter form
  resetFilterForm() {
    this.filterForm.setValue({
      b_name: 'All',
      b_unit: 'All',
      branch: 'All',
      users: 'All'
    });
    this.getAllAuditData();
    this.selectBranchList = [];
  }

  //for edit mmt admin redirect
  goToEditMmtAdmin(id) {
    var url = '/edit-audits/' + id;
    var win = window.open(url, '_blank');
    win.focus();
  }

  //for delete mmt admin account
  deleteMmtAdmin(id) {
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
        this.mmtService.deleteMmtAdminAccount(id).subscribe(resp => {
          swal.fire(
            'Deleted!',
            'Your file has been deleted.',
            'success'
          )
          this.getAllAuditData();
        }, e => {
          this.router.navigateByUrl('/login');
        });
      }
    });
  }

}




