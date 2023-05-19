import { Component, OnInit } from '@angular/core';
import { CompanyService } from '../_services/company.service';
import { AuthService } from '../_services/auth.service';
import { UsersService } from '../_services/users.service';
import {ActivatedRoute, Router} from '@angular/router';
import {CustomerService} from '../_services/customer.service';
import {User} from '../_models/user';
import {Company} from '../_models/company';

@Component({
  selector: 'app-qr',
  templateUrl: './qr.component.html',
  styleUrls: ['./qr.component.css']
})
export class QrComponent implements OnInit {

  logoUrl = null;
  random_string = '';
  colorAccent: string;
  colorPrimary: string;
  companyTitle;
  qrcode;
  public qrdata: string = null;
  public elementType: "img" | "url" | "canvas" | "svg" = null;
  public level: "L" | "M" | "Q" | "H";
  public scale: number;
  public width: number;
  body: any;

  // interval;
  timeJump: number = 10;
  timeLength: number = 5;
  timerLeft: number = this.timeLength;

  constructor(
    private companyService: CompanyService,
    private customerService: CustomerService,
    private authService: AuthService,
    private usersService: UsersService,
    private router: Router,
  ) {
    if (this.customerService.isLogged()) {
      this.router.navigate(['/']);
    }
  }

  ngOnInit() {
    this.elementType = "img";
    this.level = "M";
    this.qrdata = ''
    this.scale = 1;
    this.width = 150;
    // this.getLoginLogo();
    // this.getQrCode();
    // this.random();
    // this.progress(30, 30, $('#progressBar'));
    // setTimeout(() => {
    //   setInterval(() => {
    //     // this.getQrCode();
    //     // this.progress(30, 30, $('#progressBar'));
    //   }, 6000);
    // }, 1000);
    this.customerService.logout();
  }

  getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  getQrCode() {
    this.random()
    var body = {
      qr: this.qrdata,
      source: "dashboard"
    }
    this.authService.postQrSet(body).subscribe(response => {
      console.log('res', response)
      // setInterval(() => {
        this.getQrLog()
      // }, 6000);
      // this.router.navigate(['/qr/VQALn7qB']);
    }, e => {
    });
  }

  getQrLog() {
    var val = {
      qrcode: this.qrdata,
    }
    this.authService.postQrLogin(val).subscribe(r => {
      // setInterval(() => {
     this.getQrToken()
      // }, 6000);
    });
  }

  getQrToken() {
    var val = {
      qr: this.qrdata,
      source: "dashboard"
    }
    this.authService.postQrToken(val).subscribe(r => {
       console.log("token", r);
       localStorage.setItem('qrToken',r.data.token)
    });
  }

  getLoginLogo() {
    let appName = 'logincident'; // default name
    if (window.location.hostname.split('.').length >= 3) {
      appName = window.location.hostname.split('.')[0];
    } else {
      this.setRandomColours();
      return;
    }

    if (appName !== 'dev' && appName !== 'app') {
      this.companyService.searchCompany(appName).subscribe(r => {
        if (r.data.accentImageUrl) {
          this.logoUrl = r.data.accentImageUrl;
        } else {
          this.logoUrl = r.data.imageUrl;
        }
        this.colorPrimary = r.data.primary;
        this.colorAccent = r.data.accent;
        this.companyTitle = r.data.name;
      },
        e => {
          this.setRandomColours();
        });
    } else {
      this.setRandomColours();
    }
  }

  setRandomColours() {
    this.colorPrimary = this.getRandomColor();
    this.colorAccent = this.getRandomColor();
  }

  changeElementType(newValue: "img" | "url" | "canvas" | "svg"): void {
    this.elementType = newValue;
  }

  changeLevel(newValue: "L" | "M" | "Q" | "H"): void {
    this.level = newValue;
  }

  changeQrdata(newValue: string): void {
    this.qrdata = newValue;
  }

  changeScale(newValue: number): void {
    this.scale = newValue;
  }

  changeWidth(newValue: number): void {
    this.width = newValue;
  }

  random() {
    this.qrdata = '';
    // var wordWait = 30000;
    var characters = 'ABCDEFGHIJKLMNOPQVWXYZ012345abcdefiqurstuvwxyz';
    for (var i = 0; i < characters.length; i++) {
      this.qrdata += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    // setTimeout(() => this.random(), wordWait);
  }

  // progress(timeleft, timetotal, $element) {
  //   var progressBarWidth = timeleft * $element.width() / timetotal;
  //   $element.find('div').animate({ width: progressBarWidth }, 500).html();
  //   // $element.find('div').animate({ width: progressBarWidth }, 500).html(Math.floor(timeleft / 60) + ":" + timeleft % 60);
  //   if (timeleft > 0) {
  //     setTimeout(() => {
  //       this.progress(timeleft - 1, timetotal, $element);
  //     }, 1000);
  //   }
  // }
}



