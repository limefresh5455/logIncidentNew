import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable, of } from 'rxjs';
import {ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';

import {UsersService} from '../_services/users.service';

@Injectable()
export class UsersDetailResolver implements Resolve<Observable<any>> {
  constructor(private usersService: UsersService) {}

   	resolve(
    	route: ActivatedRouteSnapshot,
    	state: RouterStateSnapshot
  	): Observable<any> {
    	return this.usersService.getUserGroupDetail(route.paramMap.get('id'));
  	}
}