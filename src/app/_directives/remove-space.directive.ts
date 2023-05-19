import {Directive, ElementRef, Input, OnInit} from '@angular/core';

@Directive( {
    selector : '[remove-space]',
    host : {
        '(keydown)' : 'onKeyUp($event)'
    }
} )
export class RemoveSpaceDirective {
    @Input( 'remove-space' ) preventKeys;
    onKeyUp ( $event ) {
      if ($event.target.selectionStart === 0 && $event.code === 'Space'){
        $event.preventDefault();
      }
      // if ( this.preventKeys && this.preventKeys.includes( $event. keyCode ) ) {
      //     $event.preventDefault();
      // }
    }
}
