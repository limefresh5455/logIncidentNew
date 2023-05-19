import {ErrorHandler, Injectable} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';

@Injectable()
export class ErrorsHandler implements ErrorHandler {
  handleError(error: HttpErrorResponse) {
    if (error.status === 401) {
      console.log('401: ', error);
      console.log('handling');
    }

    console.error('It happens: ', error);
  }
}
