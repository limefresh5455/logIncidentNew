import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators, EmailValidator} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {CompanyService} from '../_services/company.service';
import {AuthService} from '../_services/auth.service';

@Component({
  selector: 'app-password-reset',
  templateUrl: './password-reset.component.html',
  styleUrls: ['./password-reset.component.css']
})
export class PasswordResetComponent implements OnInit {

  form: FormGroup;
  submitted = false;
  error = null;

  logoUrl = null;

  colorAccent: string;
  colorPrimary: string;
  companyTitle;
  successMessagebool: boolean;
  successMessage = null;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private companyService: CompanyService,
    private authService: AuthService,
  ) {
  }

  ngOnInit() {
    // console.log('init');
    this.passwordResetOption();
    this.getPasswordResetLogo();
    this.successMessagebool = false;
  }

  getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  getPasswordResetLogo() {
    let appName = 'logincident'; // default name
    if (window.location.hostname.split('.').length >= 3) {
      appName = window.location.hostname.split('.')[0];
    } else {
      this.setRandomColours();
      return;
    }
    this.companyService.searchCompany(appName).subscribe(r => {
        // console.log(r);
        this.logoUrl = r.data.imageUrl;
        this.colorPrimary = r.data.primary;
        this.colorAccent = r.data.accent;
        this.companyTitle = r.data.name;
      },
      e => {
        this.setRandomColours();
      });
  }

  setRandomColours() {
    this.colorPrimary = this.getRandomColor();
    this.colorAccent = this.getRandomColor();
  }

  passwordResetOption() {
    this.form = new FormGroup({});
    this.form.addControl('email', new FormControl(null, [Validators.required]));
  }

  reset() {
    if (this.form.invalid) {
      this.error = 'Please fill in email fields';
      return;
    }

    const val = this.form.value;
    this.submitted = true;
    this.authService.forgetRequest(val).subscribe(
      r => {
        this.successMessagebool = true;
        this.successMessage = 'A password reset link has been sent to your email address.';
        setTimeout(() => {
          this.router.navigateByUrl('/login');
        }, 5000);
      },
      e => {
        this.error = 'Sorry an error occurred please try again';
      });
  }
}
