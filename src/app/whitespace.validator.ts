import { AbstractControl, ValidationErrors } from '@angular/forms';

export class WhiteSpaceValidator {
    static noSpaceValidation(control: AbstractControl): ValidationErrors {
        if (control.value && control.value.startsWith(" ")) {
          return {
            trimError: { value: "white space not allowed" }
          };
        }
        if (control.value && control.value.endsWith(" ")) {
          return {
            trimError: { value: "white space not allowed" }
          };
        }
        return null;
    }
}
