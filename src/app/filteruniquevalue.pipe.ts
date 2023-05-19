import { PipeTransform, Pipe } from '@angular/core';

@Pipe({name: 'unique'}) 
export class FilteruniquevaluePipe implements PipeTransform {
	transform(value: any[], args?: any): any {
		if(value != undefined){
			// Remove the duplicate elements (this will remove duplicates)
	    	return value.map(c => (args == 'firstName') ? c.firstName : (args == 'lastName') ? c.lastName : (args == 'email') ? c.email : (args == 'name') ? c.name : (args == 'u_name') ? c.firstName+" "+c.lastName : '').filter((code, currentIndex, allCodes) => allCodes.indexOf(code) === currentIndex);
	    }
	}
}