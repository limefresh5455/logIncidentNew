import {Injectable} from '@angular/core';
import {AuthService} from './auth.service';
import {User} from '../_models/user';

const TOKEN = 'TOKEN';
const USER = 'user';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {

  constructor(private authService: AuthService) {
  }

  setToken(token: string) {
    localStorage.setItem(TOKEN, token);
  }

  getToken() {
    return localStorage.getItem(TOKEN);
  }

  logout() {
    localStorage.removeItem(TOKEN);
    localStorage.removeItem(USER);
  }

  setUser(user: User) {
    // console.log('setUser:' + JSON.stringify(user));
    localStorage.setItem(USER, JSON.stringify(user));
  }

  getUser() {
    // console.log('getUser:' + JSON.stringify(localStorage.getItem(USER)));

    return JSON.parse(localStorage.getItem(USER));
  }

  updateUser(firstName: string, lastName: string, email: string, phone: string) {
    const user = JSON.parse(localStorage.getItem('user'));
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;
    user.phone = phone;
    this.setUser(user);
  }

  isLogged() {
    return localStorage.getItem(TOKEN) != null;
  }
}
