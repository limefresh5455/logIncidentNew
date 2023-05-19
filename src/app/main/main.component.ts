import {Component, OnInit, ElementRef, ViewChild} from '@angular/core';
import {CustomerService} from '../_services/customer.service';
import {User} from '../_models/user';
import {ActivatedRoute, Router, NavigationEnd} from '@angular/router';
import {AuthService} from '../_services/auth.service';
import {UsersService} from '../_services/users.service';
import {CompanyService} from '../_services/company.service';
import {IncidentsService} from '../_services/incidents.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfirmedValidator } from './confirmed.validator';
import swal from 'sweetalert2';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css'],
})
export class MainComponent implements OnInit {
  requiresTags;
  currentUser: User;
  public url: any;
  company: any;
  user: any;
  year: number = new Date().getFullYear();

  public activeClass = false;
  mmtValue: boolean = false;
  sosValue: boolean = false;
  auditValue: boolean = false;
  auditActionValue: boolean = false;

  closeResult: string;
  companyColor: any;
  appName;

  userColor = null;
  accentColor = null;
  resetForm: FormGroup;
  submitted = false;
  userId;
  nextLogin:any;
  @ViewChild('resetPass') resetPass:ElementRef;

  constructor(
    private customerService: CustomerService,
    private router: Router,
    private authService: AuthService,
    private usersService: UsersService,
    private companyService: CompanyService,
    private incidentService: IncidentsService,
    private modalService: NgbModal,
    private formBuilder: FormBuilder,
    private route: ActivatedRoute
  ) {
    this.currentUser = this.customerService.getUser();
    this.userColor = this.currentUser.company.primary;
    this.accentColor = this.currentUser.company.accent;
  }

  ngOnInit() {
    this.getUserData()
    this.companyService.getUserCompany().subscribe(
      r => {
        this.company = r.data;
      }, error => {
        console.log(error);
      });
    //for reset password form validation
    this.resetForm = this.formBuilder.group({
      previousPassword: ['', [Validators.required]],
      desiredPassword: ['', [Validators.required, Validators.pattern('(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])[A-Za-z\d$@$!%*?&].{6,}')]],
      cPassword: ['', [Validators.required, Validators.pattern('(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])[A-Za-z\d$@$!%*?&].{6,}')]],
    }, {
      validator: ConfirmedValidator('desiredPassword', 'cPassword') // password and conf password validation function
    });
    this.currentUser = this.customerService.getUser();
    this.usersService.getUser().subscribe(res => {
      if (res.data.rbac && res.data.rbac.concerns) {
        this.currentUser.canViewConcern = res.data.rbac.concerns;
      }
    }, e => {
      console.error(e);
    });
    this.companyColor = this.currentUser.company.primary;
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.url = event.url;
        if (this.url == '/mmt/audits') {
          this.activeClass = true;
        } else if (this.url == '/mmt/monthly-tours') {
          this.activeClass = true;
        } else if (this.url == '/mmt/actions') {
          this.activeClass = true;
        } else if (this.url == '/mmt/question-pool-mmt') {
          this.activeClass = true;
        } else if (this.url == '/mmt/question-pool-ae') {
          this.activeClass = true;
        } else if (this.url == '/future-mmt') {
          this.activeClass = true;
        } else if (this.url == '/future-aes') {
          this.activeClass = true;
        } else {
          this.activeClass = false;
        }
      }
    });
    const mmtUrls = this.router.url;
    this.url = this.router.url;
    if (mmtUrls == '/mmt/audits') {
      this.activeClass = true;
    } else if (mmtUrls == '/mmt/monthly-tours') {
      this.activeClass = true;
    } else if (mmtUrls == '/mmt/actions') {
      this.activeClass = true;
    } else if (mmtUrls == '/mmt/question-pool-mmt') {
      this.activeClass = true;
    } else if (mmtUrls == '/mmt/question-pool-ae') {
      this.activeClass = true;
    } else if (mmtUrls == '/future-mmt') {
      this.activeClass = true;
    } else if (mmtUrls == '/future-aes') {
      this.activeClass = true;
    } else {
      this.activeClass = false;
    }

    this.incidentService.getIncidentTypes().subscribe(r => {
      if (r.data) {
        for (var i = 0; i <= r.data.length; i++) {
          if (r.data[i]) {
            if (r.data[i].name == 'Managers Tour') {
              this.mmtValue = true;
            } else if (r.data[i].name == 'Safe on Site') {
              this.sosValue = true;
            } else if (r.data[i].name == 'Audits') {
              this.auditValue = true;
            } else if (r.data[i].name == 'Audit Action') {
              this.auditActionValue = true;
            }
          }
        }
      }
    });
    this.companyService.getCompany(this.customerService.getUser().company.id).subscribe(r => {
      this.requiresTags = r.data.requiresTags;
    });
  }

  getUserData(){
    this.usersService.getUserData().subscribe(
      r => {
        this.user = r.data;
        this.nextLogin = this.user.resetPasswordNextLogin;
        if(this.nextLogin){
          this.modalService.open(this.resetPass, {ariaLabelledBy: 'modal-basic-title'}).result.then((result) => {
            this.closeResult = `Closed with: ${result}`;
          }, (reason) => {
            this.closeResult = `Dismissed`;
          });
        }
      }, error => {
        console.log(error);
      });
  }

  getUserDisplay(user) {
    return this.usersService.getUserDisplay(user);
  }

  logout() {
    this.customerService.logout();
    this.router.navigateByUrl('/login');
  }

  menuShowHide() {
    this.activeClass = !this.activeClass;
  }

  dashbordNextLog(){
    var body= {
      "resetPasswordNextLogin" : false
    }
    this.usersService.resetPasswordDashboard(body , this.currentUser.id).subscribe(response => {
      this.user = response.data
      this.nextLogin = this.user.resetPasswordNextLogin;
    }, e => {
      console.log(e);
    });
  }

  //for return add edit user form validation
  get f() { return this.resetForm.controls; }

  onSubmit() {
    this.submitted = true;
    // stop here if form is invalid
    if (this.resetForm.invalid) {
      return;
    }
    delete this.resetForm.value.cPassword;
    this.usersService.resetUserPassword(this.resetForm.value , this.currentUser.id).subscribe(response => {
      swal.fire({
        title: 'Password reset successfully',
        icon: 'success',
      });
      this.dashbordNextLog();
      this.modalService.dismissAll();
    }, e => {
      console.log(e)
    });
  }

}
