import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { CustomerService } from "../_services/customer.service";
import { ActivatedRoute, Router } from "@angular/router";
import { User } from "../_models/user";
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
} from "@angular/forms";
import { MmtService } from "../_services/mmt.service";
import swal from "sweetalert2";
import { WhiteSpaceValidator } from "./../whitespace.validator";
import { Observable } from "rxjs/Observable";
import { startWith } from "rxjs/operators/startWith";
import { map } from "rxjs/operators/map";
import { UsersService } from "../_services/users.service";
import { CompanyService } from "../_services/company.service";
import { group } from '@angular/animations';

@Component({
  selector: "app-create-audits",
  templateUrl: "./create-audits.component.html",
  styleUrls: ["./create-audits.component.css"],
})
export class CreateAuditsComponent implements OnInit {
  mmtView = true;
  currentUser: User;
  mmtColor = null;
  accentColor = null;

  createForm: FormGroup;
  submitted = false;

  userList: any = [];
  branchList: any = [];
  selectBranchList: any = [];
  unitList: any = [];
  uniqueListUnit : any =[];
  user: any;

  creatorsList: any = [];
  toHighlight = "";
  filteredCreators: Observable<any[]>;
  filteredCreators1: Observable<any[]>;
  auditorId: any;
  supervisorId: any;

  constructor(
    private customerService: CustomerService,
    private router: Router,
    private elementRef: ElementRef,
    private formBuilder: FormBuilder,
    private mmtService: MmtService,
    private companyService: CompanyService,
    private usersService: UsersService
  ) {
    const currentUser = this.customerService.getUser();
    this.mmtColor = currentUser.company.primary;
    this.accentColor = currentUser.company.accent;
  }

  ngOnInit() {
    
    this.loadCreateAudit();
    //For data get through url
    this.usersService.getUserData().subscribe(
      (r) => {
        this.user = r.data;
        if (this.user.isAuditor == true) {
          this.loadCreateAudit();
        } else {
          this.router.navigateByUrl("/404");
        }
      },
      (error) => {
        console.log(error);
      }
    );
  }

  //get form branchId field
  get branchId(): FormControl {
    return this.createForm.get("branchId") as FormControl;
  }
  
  //get create dat audit admin
  loadCreateAudit() {
    //for create mmt form validation
    //Validators.pattern("^[a-z0-9_-]{7,20}$")]
    this.createForm = this.formBuilder.group({
      name: ["", [Validators.required, WhiteSpaceValidator.noSpaceValidation]],
      businessUnitId: ["", Validators.required],
      branchId: ["", Validators.required],
      branchsupervisorId: ["", Validators.required],
      branchauditorId: ["", Validators.required],
    });

    // get mm admin user list and branch list
    // this.mmtService.getMmtAdminUserList().subscribe((resp) => {
    //   this.userList = resp.data.users;
    //   this.branchList = resp.data.groups;
    //   for (const test of this.branchList) {
    //     if (!test.parent) {
    //       this.unitList.push(test);
    //     }   
    // });

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
  }
  // filter by on change business unit get branch list
  selectUnit(event) {
    this.branchId.setValue("");
    const selectedBranch = [];
    for (const mmt of this.branchList) {
      if (mmt.parent) {
        if (mmt.parent.id == event.target.value) {
          selectedBranch.push(mmt);
        }
      }
    }
    this.selectBranchList = selectedBranch;
  }

  // for display user name on select mat-autocomplete
  displayFn(user): string {
    return user && user.name ? user.name : "";
  }
  // for get autocomplete users list
  filterCreators(name: string) {
    this.toHighlight = name;
    return this.creatorsList.filter(
      (state) => state.name.toLowerCase().indexOf(name.toLowerCase()) >= 0
    );
  }
  // for get users list by type user name from api
  searchCompanyUsers(term, types) {
    if (term) {
      this.companyService.searchCompanyUsersByTerm(term).subscribe(
        (response) => {
          this.creatorsList = [];
          const users = response.data;
          users.forEach((user, index) => {
            const userData = {
              name: user.firstName + " " + user.lastName,
              value: user.id,
            };
            this.creatorsList.push(userData);
            if (types == "supervisor") {
              this.filteredCreators = this.createForm.controls[
                "branchsupervisorId"
              ].valueChanges.pipe(
                startWith(""),
                map((value) =>
                  typeof value === "string" ? value : value.name
                ),
                map((name) =>
                  name ? this.filterCreators(name) : this.creatorsList.slice()
                )
              );
            } else {
              this.filteredCreators1 = this.createForm.controls[
                "branchauditorId"
              ].valueChanges.pipe(
                startWith(""),
                map((value) =>
                  typeof value === "string" ? value : value.name
                ),
                map((name) =>
                  name ? this.filterCreators(name) : this.creatorsList.slice()
                )
              );
            }
          });
        },
        (e) => { }
      );
    }
  }

  // for get incidents list by users onselect and onchange from api
  onSelectionChanged(event, types) {
    if (types == "supervisor") {
      this.supervisorId = event.value;
    } else {
      this.auditorId = event.value;
    }
  }

  //for return create mmt form validation
  get f() {
    return this.createForm.controls;
  }

  //for create mmt form submit data
  onSubmit() {
    this.submitted = true;
    // stop here if form is invalid
    if (this.createForm.invalid) {
      return;
    }
    this.createForm.value["branchauditorId"] = this.auditorId;
    this.createForm.value["branchsupervisorId"] = this.supervisorId;
    delete this.createForm.value.businessUnitId;

    this.mmtService.createMmtAdminAccount(this.createForm.value).subscribe(
      (resp) => {
        swal.fire({
          title: "Audits Admin Account Created",
          icon: "success",
          text: "Thanks for submission",
        });
        this.router.navigateByUrl("/audits-admin");
      },
      (e) => {
        this.router.navigateByUrl("/login");
      }
    );
  }
}
