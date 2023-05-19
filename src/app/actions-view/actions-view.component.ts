import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {CustomerService} from '../_services/customer.service';
import {ActivatedRoute, Router} from '@angular/router';
import {User} from '../_models/user';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {CompanyService} from '../_services/company.service';
import {IncidentsService} from '../_services/incidents.service';

@Component({
  selector: 'app-actions-view',
  templateUrl: './actions-view.component.html',
  styleUrls: ['./actions-view.component.css']
})
export class ActionsViewComponent implements OnInit {

  mmtView = true;
  currentUser: User;
  mmtColor = null;
  accentColor = null;
  closeResult: string;
  addNoteForm: FormGroup;
  noteTypes;
  incidents:any = [];
  description;
  branch;

  constructor(
    private customerService: CustomerService,
    private router: Router,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private companyService: CompanyService,
    private incidentService: IncidentsService,
  ) {
    const currentUser = this.customerService.getUser();
    this.mmtColor = currentUser.company.primary;
    this.accentColor = currentUser.company.accent;
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.incidentService.getIncident(id).subscribe(response => {
      this.incidents = response.data;
      for (const section of this.incidents.data.sections) {
        for (const field of section.fields) {
          if (field.fieldTitle === 'Description') {
            if (field.fieldValue) {
              this.description = field.fieldValue;
            }
          }
          if (field.fieldTitle === 'Branch') {
            if (field.fieldValue) {
              this.branch = field.fieldValue;
            }
          }
        }
      }
    });
  }

  //for open add note modal
  openAddNotesModal(content) {
    this.companyService.getCompany(this.customerService.getUser().company.id).subscribe(r => {
      if ('noteTypes' in r.data && r.data.noteTypes.length > 0) {
        this.noteTypes = r.data.noteTypes;

        this.addNoteForm = new FormGroup({});
        this.addNoteForm.addControl('noteType', new FormControl(null, [Validators.required]));
        this.addNoteForm.addControl('note', new FormControl(null, [Validators.required]));

        // set default note type value
        this.addNoteForm.controls['noteType'].setValue(this.noteTypes[0].id);

        this.modalService.open(content, {ariaLabelledBy: 'modal-basic-title'}).result.then((result) => {
          this.closeResult = `Closed with: ${result}`;
        }, (reason) => {
          this.closeResult = `Dismissed`;
        });
      } else {
        alert('No note types available');
      }
    });
  }

  //for add note form submit data
  onSubmit() {
    // stop here if form is invalid
    if (this.addNoteForm.invalid) {
        return;
    }

    alert('SUCCESS!! :-)\n\n' + JSON.stringify(this.addNoteForm.value));
  }

}




