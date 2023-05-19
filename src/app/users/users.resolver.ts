import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable, of } from 'rxjs';

import {UsersService} from '../_services/users.service';

@Injectable()
export class UsersResolver implements Resolve<Observable<any>> {
  constructor(private usersService: UsersService) {}

  resolve(): Observable<any> {
    return this.usersService.getUserList();
  }
}