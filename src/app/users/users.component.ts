import { Component, ElementRef, OnInit, ViewChild, QueryList, ViewChildren } from '@angular/core';
import { CustomerService } from '../_services/customer.service';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from '../_models/user';
import * as moment from 'moment';
import swal from 'sweetalert2';
import { NgbdSortableHeader, SortEvent } from '../_directives/sortable.directive';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UsersService } from '../_services/users.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CompanyService } from '../_services/company.service';
import { Observable } from 'rxjs/Observable';
import { startWith } from 'rxjs/operators/startWith';
import { map } from 'rxjs/operators/map';
import { FormControl } from '@angular/forms';

declare var $: any;

const compare = (v1: string | number, v2: string | number) => v1 < v2 ? -1 : v1 > v2 ? 1 : 0;

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {

  currentUser: User;
  mmtColor = null;
  accentColor = null;

  p: number = 1;
  itemsPerPage = 10;
  total: number;
  termName: any;
  userList;
  userDetails;
  selectFilterList;
  filterForm: FormGroup;
  closeResult: string;
  loading: boolean = true;
  loadingData: boolean = false;
  company: any;
  logAdmin: any;
  filteredCreators: Observable<any[]>;
  toHighlight = '';
  creatorsList: any = [];
  creatorsField = new FormControl();
  incidentsType: any = [];
  paramsFilter: any;

  @ViewChildren(NgbdSortableHeader) headers: QueryList<NgbdSortableHeader>;

  constructor(
    private customerService: CustomerService,
    private router: Router,
    private elementRef: ElementRef,
    private usersService: UsersService,
    private formBuilder: FormBuilder,
    private modalService: NgbModal,
    private companyService: CompanyService,
  ) {
    const currentUser = this.customerService.getUser();
    this.mmtColor = currentUser.company.primary;
    this.accentColor = currentUser.company.accent;
  }

  ngOnInit() {
    this.usersService.getUserData().subscribe(
      r => {
        this.logAdmin = r.data;
        if (this.logAdmin.isLogincidentAdmin == true) {
          this.loadUser()
        } else {
          this.router.navigateByUrl('/404');
        }
      }, error => {
        console.log(error);
      });

    //for create filter form fields
    this.filterForm = this.formBuilder.group({
      f_name: ['All'],
      l_name: ['All'],
      u_email: ['All']
    });
    this.getAllUsers(1, '');
  }

  //get Vaild data
  loadUser() {
    this.companyService.getUserCompany().subscribe(
      r => {
        this.company = r.data;
      }, error => {
        console.log(error);
      });
  }

  getAllUsers(page: number, term: any) {
    //get manager user list
    this.usersService.getUserPaginateList(page, this.itemsPerPage, term).subscribe(resp => {
      this.userList = resp.data;
      this.selectFilterList = resp.data;
      this.total = resp.count;
      this.p = page;
      for (const user of this.userList) {
        user['groupName'] = (user.group) ? user.group.name : '';
      }
      this.termName = term;
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
      this.userList = this.userList;
    } else {
      this.userList = [...this.userList].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }

  //for open user detail modal on click view button
  openUserDetailModal(content, id) {
    this.loading = true;
    setTimeout(() => {
      this.usersService.getUserGroupDetail(id).subscribe(resp => {
        this.loading = false;
        this.userDetails = resp.data[0];
      });
    }, 1000);
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.closeResult = `Dismissed`;
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
          const userData = { 'name': user.firstName + ' ' + user.lastName, 'firstName': user.firstName, 'value': user.id };
          this.creatorsList.push(userData);
          this.filteredCreators = this.creatorsField.valueChanges
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
    this.getAllUsers(1, event.firstName);
  }

  //for filter function by first name onchange
  filterFirstName(event) {
    const filterData = [];
    this.usersService.getUserList().subscribe(resp => {
      this.userList = resp.data.users;
      for (const user of this.userList) {
        if (user.firstName == event.target.value) {
          filterData.push(user);
        } else if (user.firstName == event.target.value || this.filterForm.value.l_name == user.lastName || this.filterForm.value.u_email == user.email) {
          filterData.push(user);
        } else if (user.firstName == event.target.value && this.filterForm.value.l_name == user.lastName && this.filterForm.value.u_email == user.email) {
          filterData.push(user);
        } else if (event.target.value == "All" && this.filterForm.value.l_name == user.lastName) {
          filterData.push(user);
        } else if (event.target.value == "All" && this.filterForm.value.l_name == "All" && user.email == this.filterForm.value.u_email) {
          filterData.push(user);
        } else if (event.target.value == "All" && this.filterForm.value.l_name == "All" && this.filterForm.value.u_email == "All") {
          filterData.push(user);
        }
        user['groupName'] = (user.group) ? user.group.name : '';
      }
      this.userList = filterData;
      this.p = 1;
    });
  }

  //for filter function by last name onchange
  filterLastName(event) {
    const filterData = [];
    this.usersService.getUserList().subscribe(resp => {
      this.userList = resp.data.users;
      for (const user of this.userList) {
        if (user.lastName == event.target.value) {
          filterData.push(user);
        } else if (user.lastName == event.target.value || this.filterForm.value.f_name == user.firstName || this.filterForm.value.u_email == user.email) {
          filterData.push(user);
        } else if (user.lastName == event.target.value && this.filterForm.value.f_name == user.firstName && this.filterForm.value.u_email == user.email) {
          filterData.push(user);
        } else if (event.target.value == "All" && this.filterForm.value.f_name == user.firstName) {
          filterData.push(user);
        } else if (event.target.value == "All" && this.filterForm.value.f_name == "All" && user.email == this.filterForm.value.u_email) {
          filterData.push(user);
        } else if (event.target.value == "All" && this.filterForm.value.f_name == "All" && this.filterForm.value.u_email == "All") {
          filterData.push(user);
        }
        user['groupName'] = (user.group) ? user.group.name : '';
      }
      this.userList = filterData;
      this.p = 1;
    });
  }

  //for filter function by email onchange
  filterEmail(event) {
    const filterData = [];
    this.usersService.getUserList().subscribe(resp => {
      this.userList = resp.data.users;
      for (const user of this.userList) {
        if (user.email == event.target.value) {
          filterData.push(user);
        } else if (user.email == event.target.value || this.filterForm.value.f_name == user.firstName || this.filterForm.value.l_name == user.lastName) {
          filterData.push(user);
        } else if (user.email == event.target.value && this.filterForm.value.f_name == user.firstName && this.filterForm.value.l_name == user.lastName) {
          filterData.push(user);
        } else if (event.target.value == "All" && this.filterForm.value.f_name == user.firstName) {
          filterData.push(user);
        } else if (event.target.value == "All" && this.filterForm.value.f_name == "All" && user.lastName == this.filterForm.value.l_name) {
          filterData.push(user);
        } else if (event.target.value == "All" && this.filterForm.value.f_name == "All" && this.filterForm.value.l_name == "All") {
          filterData.push(user);
        }
        user['groupName'] = (user.group) ? user.group.name : '';
      }
      this.userList = filterData;
      this.p = 1;
    });
  }

  //for edit mmt admin redirect
  goToEditUsers(id) {

    var url = '/edit-users/' + id;
    var win = window.open(url, '_blank');
    win.focus();
  }

  //for reset filter form
  resetFilterForm() {
    this.creatorsField.reset('');
    this.filterForm.setValue({
      f_name: 'All',
      l_name: 'All',
      u_email: 'All'
    });
    this.getAllUsers(1, '');
  }
}
