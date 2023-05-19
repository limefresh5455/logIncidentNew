import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'noSpaces'
})
export class NoSpacesPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    return value.replace(/\s/g, '');
  }

}
