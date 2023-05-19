import { Component, OnInit, OnDestroy } from "@angular/core";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { User } from "../_models/user";
import { AuthService } from "../_services/auth.service";
import { CustomerService } from "../_services/customer.service";
import { CompanyService } from "../_services/company.service";
import { Company } from "../_models/company";
import { v4 as uuidv4 } from "uuid";
import { HttpClient } from "@angular/common/http";
import * as QRCodeGenerator from "qrcode-generator";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.css"],
})
export class LoginComponent implements OnInit {
  // barcodeValue: string;
  public qrCode: string;
  private timer: any;

  form: FormGroup;
  submitted = false;
  error = null;

  logoUrl = null;

  selectedOption;
  loginOptions = ["Email", "Code", "Phone"];
  colorAccent: string;
  colorPrimary: string;
  companyTitle;
  hasNetworkConnection: boolean;
  hasInternetAccess: boolean;
  status: string;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private customerService: CustomerService,
    private companyService: CompanyService,
    private activatedRoute: ActivatedRoute,
    private http: HttpClient
  ) {
    if (this.customerService.isLogged()) {
      this.router.navigate(["/"]);
    }

    const qrData = this.qrCodeGenrator();
    this.globalQrData = qrData;
    let qrAPiData = {
      qr: qrData,
      source: "dashboard",
    };

    if (!localStorage.getItem("TOKEN")) {
      this.authService.setQRCode(qrAPiData).subscribe(
        (res) => {},
        (err) => {
          // console.log(err)
        }
      );
    }

    const intervalId = setInterval(() => {
      this.qrCodeGenrator();
    }, 30000);
    const checkResponseIntervalId = setInterval(() => {
      this.checkApiResponse(intervalId, checkResponseIntervalId);
    }, 2000);
  }

  globalQrData: any;

  qrCodeGenrator() {
    const qr = QRCodeGenerator(0, "L");
    const dynamicValue = Math.random().toString(36).substring(2, 55);
    qr.addData(dynamicValue);
    qr.make();
    this.qrCode = qr.createDataURL();
    this.globalQrData = dynamicValue;
    let qrAPiData = {
      qr: dynamicValue,
      source: "dashboard",
    };
    if (!localStorage.getItem("TOKEN")) {
      this.authService.setQRCode(qrAPiData).subscribe(
        (res) => {},
        (error) => {}
      );
    }
    return dynamicValue;
  }

  checkApiResponse(intervalId: any, checkResponseIntervalId: any) {
    let qrAPiData = {
      qr: this.globalQrData,
      source: "dashboard",
    };
    if (!localStorage.getItem("TOKEN")) {
      this.authService.qrGetToken(qrAPiData).subscribe(
        (res) => {
          const currentUser = new User();
          this.customerService.setToken(res.data.token);
          this.authService.getUser(res.data.token).subscribe((user: any) => {
            currentUser.admin = user.data.admin;
            currentUser.isManager = user.data.isManager;
            currentUser.isRestrictedAdmin = user.data.isRestrictedAdmin;
            currentUser.isProjectManager = user.data.isProjectManager;
            currentUser.code = user.data.code;
            currentUser.id = user.data.id;
            currentUser.isDashboardViewOnly = user.data.isDashboardViewOnly;
            if ("email" in user.data) {
              currentUser.email = user.data.email;
            } else {
              currentUser.email = null;
            }

            if ("firstName" in user.data) {
              currentUser.firstName = user.data.firstName;
            } else {
              currentUser.firstName = null;
            }

            if ("lastName" in user.data) {
              currentUser.lastName = user.data.lastName;
            } else {
              currentUser.lastName = null;
            }

            this.companyService.getUserCompany().subscribe((userCompany) => {
              const company = new Company();
              company.accent = userCompany.data.accent;
              company.id = userCompany.data.id;
              company.name = userCompany.data.name;
              company.primary = userCompany.data.primary;
              company.primaryTwo = userCompany.data.primaryTwo;
              company.imageUrl = userCompany.data.imageUrl;
              currentUser.company = company;
              this.customerService.setUser(currentUser);
              if (!currentUser.email) {
                this.router.navigateByUrl("/profile");
              } else {
                this.router.navigateByUrl("/");
              }
            });
          });

          clearInterval(intervalId);
          clearInterval(checkResponseIntervalId);
        },
        (err) => {
          //  console.log("Error from API:", err);
        }
      );
    }
  }

  ngOnInit() {
    this.getLoginLogo();
    this.customerService.logout();
    this.selectLoginOption("Email");
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }

  getRandomColor() {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  getLoginLogo() {
    let appName = "logincident"; // default name
    if (window.location.hostname.split(".").length >= 3) {
      appName = window.location.hostname.split(".")[0];
    } else {
      this.setRandomColours();
      return;
    }

    if (appName !== "dev" && appName !== "app") {
      this.companyService.searchCompany(appName).subscribe(
        (r) => {
          if (r.data.accentImageUrl) {
            this.logoUrl = r.data.accentImageUrl;
          } else {
            this.logoUrl = r.data.imageUrl;
          }
          this.colorPrimary = r.data.primary;
          this.colorAccent = r.data.accent;
          this.companyTitle = r.data.name;
        },
        (e) => {
          this.setRandomColours();
        }
      );
    } else {
      this.setRandomColours();
    }
  }

  setRandomColours() {
    this.colorPrimary = this.getRandomColor();
    this.colorAccent = this.getRandomColor();
  }

  selectLoginOption(option: string) {
    this.selectedOption = option;
    this.form = new FormGroup({});

    if (option === "Code") {
      this.form.addControl(
        "code",
        new FormControl(null, [Validators.required])
      );
    }

    if (option === "Email") {
      this.form.addControl(
        "email",
        new FormControl(null, [Validators.required])
      );
    }

    if (option === "Phone") {
      this.form.addControl(
        "phone",
        new FormControl(null, [Validators.required])
      );
    }

    this.form.addControl(
      "password",
      new FormControl(null, [Validators.required])
    );
    this.form.addControl("source", new FormControl("dashboard"));
  }

  login() {
    this.error ='';
    if (this.form.invalid) {
      this.error = "Please fill in all the fields";
      return;
    }

    const val = this.form.value;
    this.submitted = true;
    this.authService.login(val).subscribe(
      (r) => {
        if (r.data.token) {
          // set token
          this.customerService.setToken(r.data.token);

          const currentUser = new User();

          // get user data
          this.authService.getUser(r.data.token).subscribe((user) => {
            currentUser.admin = user.data.admin;
            currentUser.isManager = user.data.isManager;
            currentUser.isRestrictedAdmin = user.data.isRestrictedAdmin;
            currentUser.isProjectManager = user.data.isProjectManager;

            currentUser.code = user.data.code;
            currentUser.id = user.data.id;

            currentUser.isDashboardViewOnly = user.data.isDashboardViewOnly;

            if ("email" in user.data) {
              currentUser.email = user.data.email;
            } else {
              currentUser.email = null;
            }

            if ("firstName" in user.data) {
              currentUser.firstName = user.data.firstName;
            } else {
              currentUser.firstName = null;
            }

            if ("lastName" in user.data) {
              currentUser.lastName = user.data.lastName;
            } else {
              currentUser.lastName = null;
            }

            this.companyService.getUserCompany().subscribe((userCompany) => {
              const company = new Company();
              company.accent = userCompany.data.accent;
              company.id = userCompany.data.id;
              company.name = userCompany.data.name;
              company.primary = userCompany.data.primary;
              company.primaryTwo = userCompany.data.primaryTwo;
              company.imageUrl = userCompany.data.imageUrl;
              currentUser.company = company;
              this.customerService.setUser(currentUser);
              if (!currentUser.email) {
                this.router.navigateByUrl("/profile");
              } else {
                this.router.navigateByUrl("/");
              }
            });
          });
        }
      },
      (r) => {
        let error = "";
        // console.log(r);
        if (r.status === 0) {
          if (r.error && r.error.error && r.error.error == "Forbidden") {
            error = "Incorrect Credentials";
          } else {
            error = "Check Your Internet Connection ";
          }
          this.error = error;
        } else if (r.status === 403) {
          this.error = "Incorrect Credentials";
        } else {
          this.error = r.message;
        }
      }
    );
  }

  myFunction(){
    this.error='';
  }
}
