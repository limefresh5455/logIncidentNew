import {Component} from '@angular/core';
import {CustomerService} from './_services/customer.service';
import {MapsAPILoader} from '@agm/core';
import {ViewChild, ElementRef, NgZone} from '@angular/core';
import { Router} from '@angular/router';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'angular-incidents';

  @ViewChild('search') public searchElement: ElementRef;

  constructor(private router: Router, public customerService: CustomerService) {
  
    this.router.errorHandler = (error: any) => {
      // console.log(error, 'testing');
      this.router.navigate(['404']); // or redirect to default route
    }
  }

}
