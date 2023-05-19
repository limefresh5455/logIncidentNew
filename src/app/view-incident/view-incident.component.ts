import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  QueryList,
  Renderer2,
  ViewChildren,
  ChangeDetectorRef,
  ViewChild,
} from "@angular/core";
import { Location } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { IncidentsService } from "../_services/incidents.service";
import { CompanyService } from "../_services/company.service";
import { MediaService } from "../_services/media.service";
import { NgbDate, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { CustomerService } from "../_services/customer.service";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { NotesService } from "../_services/notes.service";
import { MapsService } from "../_services/maps.service";
import { ExportService } from "../_services/export.service";
import { UsersService } from "../_services/users.service";
import { DomSanitizer } from "@angular/platform-browser";
import { MatSnackBar } from "@angular/material/snack-bar";
import { COMMA, ENTER } from "@angular/cdk/keycodes";
import { Observable } from "rxjs";
import {
  MatAutocompleteSelectedEvent,
  MatAutocomplete,
} from "@angular/material/autocomplete";
import { MatChipInputEvent } from "@angular/material/chips";
import { environment } from "../../environments/environment";
import * as moment from "moment";
import {
  DropzoneDirective,
  DropzoneConfigInterface,
  DropzoneComponent,
} from "ngx-dropzone-wrapper";
import swal from "sweetalert2";
import { ConnectionServiceModule } from "ngx-connection-service";

declare var Raphael: any;

@Component({
  selector: "app-view-incident",
  templateUrl: "./view-incident.component.html",
  styleUrls: ["./view-incident.component.css"],
})
export class ViewIncidentComponent implements OnInit, AfterViewInit {
  incident;
  incidentNotfound;
  incidents;
  investigationfile = [];
  incidentPayload = <any>{};
  incidentTypesData = [];
  attachments = [];
  injuries = [];
  @ViewChildren(DropzoneDirective) directiveRef: QueryList<DropzoneDirective>;
  dropzone;
  vehicles = [];
  blueprintNumber = null;
  incidentLocation = null;
  whats3words = null;
  isDemo = false;
  rejectionStatus = false;
  closeResult: string;
  updateStatusForm: FormGroup;
  statuses;
  availableTags = [] as any;
  selectedTags = [] as any;
  addNoteForm: FormGroup;
  noteTypes;
  corrective: null;
  rootCause: null;
  preventative: null;
  immediateCorrective: null;
  validatedName: null;
  validatedJob: null;
  validatedDate;
  dateImplemented;
  datePlanned;
  immediateDatePlanned;
  immediateDateImplemented;
  maxDate;
  contact;
  resAccepted = false;
  resRejectionNote = "";
  selectedAddress = null;
  requiresIncidentDocuments = false;
  preViewImg = "";
  suppliers;
  concernDetailsForm: FormGroup;
  type = new FormControl("", [Validators.required]);

  concernResponse = new FormControl("", [Validators.required]);
  phoneNumber = new FormControl("", [Validators.required]);
  primaryContact = new FormControl("", [Validators.required]);
  secondaryContact = new FormControl("", [Validators.required]);
  secondaryNumber = new FormControl("", [Validators.required]);
  finningType = new FormControl("Finning Prep", [Validators.required]);

  supplierRef = new FormControl("", [Validators.required]);
  supplierName = new FormControl("");
  closedName = new FormControl("", [Validators.required]);
  closedJob = new FormControl("", [Validators.required]);
  closedDate = new FormControl(new Date(), [Validators.required]);

  responseRejected = new FormControl("");
  responseAccepted = new FormControl("");
  responseEmail = new FormControl("", [Validators.required, Validators.email]);
  responseEmail2 = new FormControl("", [Validators.required, Validators.email]);

  response;
  requiresTags;
  currentUser;
  escalateForm: FormGroup;
  companyUsers;
  company;
  mediaSrc = {};
  sectionsMedia = {}; // this might be used for pdf generation.
  @ViewChildren("canvas") canvasList: QueryList<ElementRef>;

  companyColor = null;
  accentColor = null;
  followedUp = false;
  closedAnalysis: boolean = false;
  showNoteBox: boolean = false;
  rootCauseOnClose;
  commentOnClose;
  rootCauseOnCloseName;
  commentOnCloseName;
  submitted = false;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private incidentService: IncidentsService,
    private companyService: CompanyService,
    private elementRef: ElementRef,
    private mediaService: MediaService,
    private modalService: NgbModal,
    private customerService: CustomerService,
    private noteService: NotesService,
    private mapsService: MapsService,
    private exportService: ExportService,
    private usersService: UsersService,
    private sanitizerService: DomSanitizer,
    public renderer: Renderer2,
    private router: Router,
    private _snackBar: MatSnackBar,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    const config: DropzoneConfigInterface = {
      url: `${environment.API_URL}` + "media",
      paramName: "media",
      headers: {
        Authorization: "Bearer " + this.customerService.getToken(),
        "Cache-Control": "",
        "X-Requested-With": "",
      },
    };
    this.dropzone = {
      config: config,
      data: [],
    };

    this.maxDate = {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getDate(),
    };
    this.currentUser = this.customerService.getUser();
    this.usersService.getUser().subscribe(
      (r) => {
        this.currentUser.isSuperDeleteUser = r.data.isSuperDeleteUser;
      },
      (e) => {
        console.error(e);
      }
    );
    this.companyColor = this.currentUser.company.primary;
    this.accentColor = this.currentUser.company.accent;
    if (!this.currentUser.email) {
      this.router.navigateByUrl("/profile");
    }

    this.concernDetailsForm = new FormGroup({
      type: this.type,
      finningType: this.finningType,
      concernResponse: this.concernResponse,
      phoneNumber: this.phoneNumber,
      primaryContact: this.primaryContact,
      secondaryNumber: this.secondaryNumber,
      secondaryContact: this.secondaryContact,
      supplierRef: this.supplierRef,
      supplierName: this.supplierName,
      closedName: this.closedName,
      closedJob: this.closedJob,
      closedDate: this.closedDate,
      responseRejected: this.responseRejected,
      responseAccepted: this.responseAccepted,
      responseEmail: this.responseEmail,
      responseEmail2: this.responseEmail2,
    });
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 4000,
    });
  }

  ngOnInit() {
    this.usersService.getUser().subscribe(
      (res) => {
        if (res.data.rbac && res.data.rbac.concerns) {
          this.currentUser.canViewConcern = res.data.rbac.concerns;
          this.suppliers = this.incidentService.getConcernSuppliers();
        }
      },
      (e) => {
        this.openSnackBar(e, "Close");
      }
    );
    const id = this.route.snapshot.paramMap.get("id");
    this.incidentService.getIncidentTags(id).subscribe(
      (res) => {
        if (res.data) {
          this.selectedTags = res.data;
        }
      },
      (e) => {
        this.openSnackBar(e, "Close");
      }
    );
    if (this.route.snapshot.paramMap.get("success")) {
      this.openSnackBar("Edit Successful", "Close");
      this.router.navigateByUrl("/incidents/" + id);
    }
    this.getIncident(id);
    this.companyService
      .getCompany(this.customerService.getUser().company.id)
      .subscribe((r) => {
        this.isDemo = r.data.isDemo;
        this.requiresTags = r.data.requiresTags;
        this.requiresIncidentDocuments = r.data.requiresIncidentDocuments;
        this.company = r.data;
      });
  }

  // for hexa convert into rgb color code for close incidents
  hexToRGB(h) {
    var r: any = 0;
    var g: any = 0;
    var b: any = 0;
    var p: any = 60;

    // 3 digits
    if (h.length == 4) {
      r = "0x" + h[1] + h[1];
      g = "0x" + h[2] + h[2];
      b = "0x" + h[3] + h[3];

      // 6 digits
    } else if (h.length == 7) {
      r = "0x" + h[1] + h[2];
      g = "0x" + h[3] + h[4];
      b = "0x" + h[5] + h[6];
    }
    return "rgb(" + +r + " " + +g + " " + +b + "/" + +p + "%)";
  }

  handleInvestigationInput(event) {
    if (this.investigationfile.length < 0) {
      this.investigationfile.push(...event);
    } else {
      this.investigationfile = [];
      this.investigationfile.push(...event);
    }
  }

  onRemove(event) {
    this.investigationfile.splice(this.investigationfile.indexOf(event), 1);
  }

  sendInvestigation() {
    this.incidentService.postDocument(this.investigationfile[0]).subscribe(
      (res) => {
        const body = {
          companyId: this.currentUser.company.id,
          incidentId: this.incident.id,
          userId: this.currentUser.id,
          attachmentId: res.data.uuid,
          attachmentUrl: res.data.path,
        };
        this.incidentService.postInvestigationDocuments(body).subscribe(
          (r) => {
            this.investigationfile = [];
            this.openSnackBar("Investigation Document Uploaded", "Close");
            window.location.reload();
          },
          (e) => {
            this.openSnackBar("Investigation Document Upload Error", "Close");
          }
        );
      },
      (er) => {
        this.openSnackBar("Investigation Document Upload Error", "Close");
      }
    );
  }

  getExtension(filename) {
    return filename.split(".").pop();
  }

  contactChange($event) {
    if ($event == "Caterpillar Larne") {
      this.concernDetailsForm.patchValue({
        primaryContact: "Joh Fitzgerald",
        responseEmail: "Solutions_QA_Helpdesk@cat.com",
      });
    } else if ($event == "Caterpillar Mannheim") {
      this.concernDetailsForm.patchValue({
        primaryContact: "Philip Stöhr",
        responseEmail: "Stoehr_Philip@cat.com",
      });
    }
  }

  supplierChange($event) {
    for (const index in this.suppliers) {
      if (this.suppliers[index].name == $event) {
        this.concernDetailsForm.controls["responseEmail"].setValue(
          this.suppliers[index].email
        );
        this.concernDetailsForm.controls["responseEmail2"].setValue(
          this.suppliers[index].email2
        );
        this.concernDetailsForm.controls["primaryContact"].setValue(
          this.suppliers[index].primaryContact
        );
        this.concernDetailsForm.controls["secondaryContact"].setValue(
          this.suppliers[index].secondaryContact
        );
        this.concernDetailsForm.controls["phoneNumber"].setValue(
          this.suppliers[index].primaryPhone
        );
        this.concernDetailsForm.controls["secondaryNumber"].setValue(
          this.suppliers[index].secondaryPhone
        );
      }
    }
  }

  ngAfterViewInit() {
    setTimeout((_) => this.canvasLoaded());
  }

  findInvalidControls() {
    const invalid = [];
    const controls = this.concernDetailsForm.controls;
    for (const name in controls) {
      if (controls[name].invalid) {
        invalid.push(name);
      }
    }
  }

  canvasLoaded() {
    const mergedCanvas = [];
    this.canvasList.changes.subscribe(() => {
      this.canvasList.toArray().forEach((canvas) => {
        const overlayId = canvas.nativeElement.getAttribute("overlayId");
        const uuid = canvas.nativeElement.getAttribute("id");

        if (!mergedCanvas.includes(uuid)) {
          this.mergeImages(canvas.nativeElement, uuid, overlayId, false);
          mergedCanvas.push(uuid);
        }
      });
    });
  }

  getIncident(id: string) {
    this.incidentNotfound = "";
    this.incidentService.getIncident(id).subscribe(
      (response) => {
        response.data.logs.forEach(function (item, index) {
          let fields: any[];
          if (item.textNote) {
            fields = JSON.parse(item.textNote);
            response.data.logs[index]["textNote"] = fields;

            if (item.textNote["added"] && item.textNote["added"].sections) {
              Object.entries(item.textNote["added"].sections).forEach(
                ([key, value]) => {
                  if (value["fields"]) {
                    item.textNote["added"] = value["fields"];
                  }
                }
              );
            }
            if (item.textNote["deleted"] && item.textNote["deleted"].sections) {
              Object.entries(item.textNote["deleted"].sections).forEach(
                ([key, value]) => {
                  if (value["fields"]) {
                    item.textNote["deleted"] = value["fields"];
                  }
                }
              );
            }
            if (item.textNote["updated"] && item.textNote["updated"].sections) {
              Object.entries(item.textNote["updated"].sections).forEach(
                ([key, value]) => {
                  if (value["fields"]) {
                    item.textNote["updated"] = value["fields"];
                  }
                }
              );
            }
          }
        });

        for (const typeSection of response.data.type.sections) {
          for (const section of response.data.data.sections) {
            if (typeSection.title == section.title) {
              if ("displayOrder" in typeSection) {
                section.displayOrder = typeSection.displayOrder;
              } else {
                section.displayOrder = 0;
              }
            }
          }
        }

        // sort sections by display order
        response.data.data.sections.sort(
          (a, b) => a.displayOrder - b.displayOrder
        );

        // remove displayOrder from section (sections are already sorted, can't edit sections with displayOrder)
        for (const section of response.data.data.sections) {
          delete section.displayOrder;
        }

        this.incident = response.data;
        if (this.incident.type.name == "Hazard / Near Miss") {
          this.incident.type.color = "#800000";
        }

        this.incident.incidentaudittrails = response.data.incidentAuditTrail;
        this.countHolderSectionItems();
        this.collectAttachments();
        this.collectInjuries();
        this.collectVehicles();
        this.getIncidentLocation();

        this.prepareLogs();
        this.sortAssignments();
        this.downloadHolderItemImages();
        this.usersService.getUser().subscribe(
          (res) => {
            if (res.data.rbac && res.data.rbac.concerns) {
              this.setConcernDetails();
            }
          },
          (e) => {
            this.openSnackBar(e, "Close");
          }
        );
      },
      (err) => {
        this.incidentNotfound = err.error.error;
        if (this.incidentNotfound != "") {
          this.router.navigateByUrl("/dashboard");
        }
      }
    );
  }

  setConcernDetails() {
    const concernDetails = this.incident.concernDetails[0];

    if (concernDetails) {
      this.corrective = concernDetails.correctiveActionDetails;
      this.rootCause = concernDetails.rootCause;
      this.preventative = concernDetails.preventativeActionDetails;
      this.immediateCorrective = concernDetails.immediate;
      this.validatedName = concernDetails.validatedByName;
      this.validatedJob = concernDetails.validatedByJobTitle;
      this.validatedDate = concernDetails.validatedByDate;
      this.dateImplemented = concernDetails.dateImplemented;
      this.datePlanned = concernDetails.datePlanned;
      this.immediateDatePlanned = concernDetails.immediateDatePlanned;
      this.immediateDateImplemented = concernDetails.immediateDateImplemented;

      this.followedUp = concernDetails.followedUp;
      this.resAccepted = concernDetails.responseAccepted;
      this.resRejectionNote = concernDetails.responseRejectionNote;
      let closedDownDate = new Date();
      if (concernDetails.closedDownByDate) {
        closedDownDate = new Date(concernDetails.closedDownByDate);
      }

      this.concernDetailsForm.patchValue({
        type: concernDetails.concernDetailsType,
        supplierName: concernDetails.supplierName,
        supplierRef: concernDetails.supplierRef,
        primaryContact: concernDetails.primaryContact,
        secondaryContact: concernDetails.secondaryContact,
        secondaryNumber: concernDetails.secondaryNumber,
        phoneNumber: concernDetails.phoneNumber,
        concernResponse: concernDetails.responseRequired,
        closedName: concernDetails.closedDownByName,
        closedJob: concernDetails.closedDownByJobTitle,
        closedDate: new NgbDate(
          closedDownDate.getFullYear(),
          closedDownDate.getMonth(),
          closedDownDate.getDate()
        ),
        responseRejected: concernDetails.responseRejectionNote,
        responseAccepted: null,
        responseEmail: concernDetails.responseEmail,
        responseEmail2: concernDetails.responseEmail2,
      });
      if (concernDetails.concernDetailsType) {
        this.concernDetailsForm.patchValue({
          finningType: concernDetails.supplierName,
        });
      }
      if (concernDetails.dispositionSet) {
        this.concernDetailsForm.patchValue({
          responseAccepted: concernDetails.responseAccepted,
        });
      }
    }
  }

  sectionIsLeft(forloopCounter, numberOfSections) {
    return forloopCounter + 1 <= Math.ceil(numberOfSections / 2);
  }

  downloadHolderItemImages() {
    for (const section of this.incident.data.sections) {
      if (section.media) {
        this.analyzeSectionMedia(section);
      }

      if (section.damages) {
        this.analyzeHolderItems(section.damages);
      }

      if (section.injuries) {
        this.analyzeHolderItems(section.injuries);
      }

      if (section.vehicles) {
        this.analyzeHolderItems(section.vehicles);
      }

      if (section.witnesses) {
        this.analyzeHolderItems(section.witnesses);
      }
    }
  }

  analyzeHolderItems(items) {
    for (const item of items) {
      this.analyzeSectionMedia(item);
    }
  }

  analyzeSectionMedia(item) {
    if (item.media && item.media.length > 0) {
      const overlayIds = [];

      for (const mediaItem of item.media) {
        if (mediaItem.overlayId) {
          overlayIds.push(mediaItem.overlayId);
        }
      }

      for (const mediaItem of item.media) {
        if (!overlayIds.includes(mediaItem.uuid)) {
          this.mediaService.getMedia(mediaItem.uuid).subscribe((r) => {
            if (mediaItem.type === "image") {
              if (!(item.title in this.sectionsMedia)) {
                this.sectionsMedia[item.title] = [];
              }

              this.sectionsMedia[item.title].push(r);
            }
            const url = window.URL.createObjectURL(r);
            this.mediaSrc[mediaItem.uuid] =
              this.sanitizerService.bypassSecurityTrustUrl(url);
            if (
              item.title == "Add Media" ||
              item.title == "Add Photos & Videos"
            ) {
              if (mediaItem.annotation != undefined) {
                setTimeout(() => {
                  const sketchpad = Raphael.sketchpad(mediaItem.uuid, {
                    width: 260,
                    height: 260,
                    editing: false,
                  });
                  sketchpad.json(mediaItem.annotation);
                }, 2000);
              }
            }
          });
        }
      }
    }
  }

  hasMediaSrc(uuid) {
    return uuid in this.mediaSrc;
  }

  countHolderSectionItems() {
    for (const section of this.incident.data.sections) {
      if (section.damages) {
        section.damages.forEach((item, index) => {
          if (!item.title.includes("#")) {
            item.title = item.title + " #" + (index + 1);
          }
        });
      }

      if (section.injuries) {
        section.injuries.forEach((item, index) => {
          if (!item.title.includes("#")) {
            item.title = item.title + " #" + (index + 1);
          }
        });
      }

      if (section.vehicles) {
        section.vehicles.forEach((item, index) => {
          if (!item.title.includes("#")) {
            item.title = item.title + " #" + (index + 1);
          }
        });
      }

      if (section.witnesses) {
        section.witnesses.forEach((item, index) => {
          if (!item.title.includes("#")) {
            item.title = item.title + " #" + (index + 1);
          }
        });
      }
    }
  }

  getUserDisplay(user) {
    if (user) {
      const result = this.usersService.getUserDisplay(user);
      return this.usersService.getUserDisplay(user);
    }
  }

  prepareLogs() {
    this.sortLogs(); // sort logs by datetime
    for (const log of this.incident.logs) {
      if (log.user) {
        log.userDisplay = this.getUserDisplay(log.user);
      }
    }
  }

  sortLogs() {
    this.incident.logs.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  sortAssignments() {
    this.incident.assignments.sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
    );
  }

  getIncidentLocation() {
    for (const section of this.incident.data.sections) {
      for (const field of section.fields) {
        if (
          section.title == "Select Location" &&
          field.fieldType == "store-address"
        ) {
          this.selectedAddress = field.fieldValue;
        }
        if (
          section.title == "Select Location" &&
          field.fieldType == "dropdown-address"
        ) {
          this.selectedAddress = field.fieldValue;
        }
        // additionalFieldValue contains hardcoded address which should be preferred over a geocoded one.
        if (field.fieldType === "gps" && !field.additionalFieldValue) {
          this.mapsService.getGeoLocation(field.lat, field.lng).subscribe(
            (r) => {
              this.incidentLocation = r[0].formatted_address;
              this.changeDetectorRef.detectChanges();
            },
            (e) => {}
          );

          this.mapsService
            .getWhats3words(field.lat, field.lng)
            .subscribe((response) => {
              if (response && response.words) {
                this.whats3words = response.words;
                this.changeDetectorRef.detectChanges();
              }
            });
        }
      }
    }
  }

  deleteIncident(id) {
    swal
      .fire({
        title: "Are you sure?",
        text: "You want to delete incident: " + id + "?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!",
      })
      .then((result) => {
        if (result.value) {
          this.incidentService.deleteIncident(id).subscribe(
            (r) => {
              this.openSnackBar("Delete Successful", "Close");
              this.router.navigateByUrl("/");
            },
            (e) => {
              this.openSnackBar(e, "Close");
            }
          );
        }
      });
  }

  collectAttachments() {
    const attachments = [];
    const overlayIds = [];

    for (const section of this.incident.data.sections) {
      // collect from 'media'
      if (section.media) {
        for (const mediaItem of section.media) {
          attachments.push(mediaItem);

          if (mediaItem.overlayId) {
            overlayIds.push(mediaItem.overlayId);
          }
        }
      }
    }

    for (const attachment of attachments) {
      if (!overlayIds.includes(attachment.uuid)) {
        this.attachments.push(attachment);
      }
    }
  }

  collectInjuries() {
    for (const section of this.incident.data.sections) {
      if (section.injuries) {
        for (const injury of section.injuries) {
          this.injuries.push(injury);
        }
      }
    }
  }

  collectVehicles() {
    for (const section of this.incident.data.sections) {
      if (section.vehicles) {
        for (const vehicle of section.vehicles) {
          this.vehicles.push(vehicle);
        }
      }
    }
  }

  openUpdateStatusModal(content) {
    this.companyService
      .getCompany(this.customerService.getUser().company.id)
      .subscribe((r) => {
        if ("statuses" in r.data && r.data.statuses.length > 0) {
          this.statuses = r.data.statuses;
          this.onChange(this.incident.status.id);
        } else {
          alert("No statuses available.");
        }

        if ("noteTypes" in r.data && r.data.noteTypes.length > 0) {
          this.noteTypes = r.data.noteTypes;
          for (const note of this.noteTypes) {
            if (note.name == "Closure Note") {
              this.commentOnClose = note.id;
              this.commentOnCloseName = note.name;
            }
            if (note.name == "Root Cause Note") {
              this.rootCauseOnClose = note.id;
              this.rootCauseOnCloseName = note.name;
            }
          }
        } else {
          alert("No note types available");
        }

        this.modalService
          .open(content, { ariaLabelledBy: "modal-basic-title" })
          .result.then(
            (result) => {
              this.closeResult = `Closed with: ${result}`;
            },
            (reason) => {
              this.closeResult = `Dismissed`;
            }
          );
      });
  }

  // for get value onchange update status
  onChange(value) {
    this.updateStatusForm = new FormGroup({});
    this.submitted = false;
    this.updateStatusForm.addControl("status", new FormControl(null));
    this.updateStatusForm.controls["status"].setValue(value);
    for (const status of this.statuses) {
      if (value === status.id && status.name === "Closed") {
        if (this.incident.type.commentOnClose) {
          this.closedAnalysis = true;
          this.updateStatusForm.addControl(
            "notes",
            new FormControl(null, [Validators.required])
          );
        }
        if (this.incident.type.rootCauseOnClose) {
          this.closedAnalysis = true;
          this.updateStatusForm.addControl("notes1", new FormControl(null));
        }
      } else if (value === status.id && status.name !== "Closed") {
        this.closedAnalysis = false;
        this.updateStatusForm.addControl("notes", new FormControl(null));
        this.updateStatusForm.controls["notes"].setErrors(null);
      }
    }
  }

  //for update status with add notes by api
  submitUpdateStatusForm() {
    this.submitted = true;
    if (this.updateStatusForm.invalid) {
      return;
    }
    const body = {
      typeId: this.incident.type.id,
      companyId: this.customerService.getUser().company.id,
      sections: this.incident.data.sections,
      statusId: this.updateStatusForm.value.status,
    };
    const notesData = [];
    if (this.closedAnalysis == true) {
      if (
        this.updateStatusForm.value.notes != null &&
        this.commentOnClose != undefined
      ) {
        notesData.push({
          notes: this.updateStatusForm.value.notes,
          noteTypes: this.commentOnClose,
        });
      }
      if (
        this.updateStatusForm.value.notes1 != null &&
        this.rootCauseOnClose != undefined
      ) {
        notesData.push({
          notes: this.updateStatusForm.value.notes1,
          noteTypes: this.rootCauseOnClose,
        });
      }
    }
    this.incidentService.editIncident(this.incident.id, body).subscribe((r) => {
      if (notesData.length > 0) {
        for (const note of notesData) {
          this.noteService
            .createNote(
              this.customerService.getUser().company.id,
              this.incident.id,
              note.noteTypes,
              note.notes
            )
            .subscribe((r) => {
              // update newly added notes. replaces only notes part.
              this.incidentService
                .getIncident(this.incident.id)
                .subscribe((incidentResponse) => {
                  this.incident.status = incidentResponse.data.status;
                  this.incident.notes = incidentResponse.data.notes;
                  this.incident.logs = incidentResponse.data.logs;
                  this.prepareLogs();
                });
            });
        }
        this.openSnackBar("Status Update Successful", "Close");
      } else {
        this.incidentService
          .getIncident(this.incident.id)
          .subscribe((incidentResponse) => {
            this.incident.status = incidentResponse.data.status;
            this.incident.logs = incidentResponse.data.logs;
            this.prepareLogs();
            this.openSnackBar("Status Update Successful", "Close");
          });
      }
      this.modalService.dismissAll();
    });
  }

  openTagModal(content) {
    this.modalService
      .open(content, { ariaLabelledBy: "modal-basic-title" })
      .result.then(
        (result) => {
          this.closeResult = `Closed with: ${result}`;
        },
        (reason) => {
          this.closeResult = `Dismissed`;
        }
      );
    if (this.availableTags.length <= 0) {
      this.companyService.getCompanyTags().subscribe(
        (r) => {
          this.availableTags = r.data.data;
        },
        (e) => {
          this.openSnackBar(e, "Close");
        }
      );
    }
  }

  addTag(tagId) {
    this.incidentService.addIncidentTag(this.incident.id, tagId).subscribe(
      (r) => {
        for (const tag of this.availableTags) {
          if (tag.id === tagId) {
            this.selectedTags.push(tag);
          }
        }
      },
      (e) => {
        this.openSnackBar(e, "Close");
      }
    );
  }

  removeTag(tagId) {
    this.incidentService.deleteIncidentTag(this.incident.id, tagId).subscribe(
      (r) => {
        for (let i = 0; i <= this.selectedTags.length; i++) {
          if (this.selectedTags[i].id === tagId) {
            this.selectedTags.splice(i, 1);
          }
        }
      },
      (e) => {
        this.openSnackBar(e, "Close");
      }
    );
  }

  hideSelectedTags(selectedTag) {
    return this.selectedTags.some((el) => el.id === selectedTag.id);
  }

  openAddNotesModal(content) {
    if (this.isDemo) {
      return;
    } else {
      this.companyService
        .getCompany(this.customerService.getUser().company.id)
        .subscribe((r) => {
          if ("noteTypes" in r.data && r.data.noteTypes.length > 0) {
            this.noteTypes = r.data.noteTypes;

            this.addNoteForm = new FormGroup({});
            this.addNoteForm.addControl(
              "noteType",
              new FormControl(null, [Validators.required])
            );
            this.addNoteForm.addControl(
              "note",
              new FormControl(null, [Validators.required])
            );

            // set default note type value
            this.addNoteForm.controls["noteType"].setValue(
              this.noteTypes[0].id
            );

            this.modalService
              .open(content, { ariaLabelledBy: "modal-basic-title" })
              .result.then(
                (result) => {
                  this.closeResult = `Closed with: ${result}`;
                },
                (reason) => {
                  this.closeResult = `Dismissed`;
                }
              );
          } else {
            alert("No note types available");
          }
        });
    }
  }

  investigationDocumentModal(content) {
    this.modalService
      .open(content, { ariaLabelledBy: "modal-basic-title" })
      .result.then(
        (result) => {
          this.closeResult = `Closed with: ${result}`;
        },
        (reason) => {
          this.closeResult = `Dismissed`;
        }
      );
  }

  submitAddNoteForm() {
    this.noteService
      .createNote(
        this.customerService.getUser().company.id,
        this.incident.id,
        this.addNoteForm.value.noteType,
        this.addNoteForm.value.note
      )
      .subscribe((r) => {
        // update newly added notes. replaces only notes part.
        this.incidentService
          .getIncident(this.incident.id)
          .subscribe((incidentResponse) => {
            this.incident.notes = incidentResponse.data.notes;
            this.incident.logs = incidentResponse.data.logs;
            this.prepareLogs();
            this.openSnackBar("Note Successful Added", "Close");
          });
      });
  }

  openEscalateModal(content) {
    this.companyService.getCompanyUsers().subscribe((r) => {
      this.companyUsers = r.data.users;

      this.companyUsers.sort(function (a, b) {
        let textA = a.email;
        let textB = b.email;

        if ("lastName" in a) {
          textA = a.lastName.toUpperCase();
        }

        if ("lastName" in b) {
          textB = b.lastName.toUpperCase();
        }

        return textA < textB ? -1 : textA > textB ? 1 : 0;
      });
      const elementPos = this.companyUsers
        .map(function (x) {
          return x.id;
        })
        .indexOf(this.currentUser.id);

      if (elementPos > -1) {
        this.companyUsers.splice(elementPos, 1);
      }
      this.escalateForm = new FormGroup({});
      this.escalateForm.addControl(
        "user",
        new FormControl(null, [Validators.required])
      );

      if (this.incident.assignments && this.incident.assignments.length > 0) {
        this.escalateForm.controls["user"].setValue(
          this.incident.assignments[0].user.id
        );
      } else {
        this.escalateForm.controls["user"].setValue(this.companyUsers[0].id);
      }

      this.modalService
        .open(content, { ariaLabelledBy: "modal-basic-title" })
        .result.then(
          (result) => {
            this.closeResult = `Closed with: ${result}`;
          },
          (reason) => {
            this.closeResult = `Dismissed`;
          }
        );
    });
  }

  submitEscalateForm() {
    const body = {
      typeId: this.incident.type.id,
      companyId: this.customerService.getUser().company.id,
      sections: this.incident.data.sections,
      assignedUserId: this.escalateForm.value.user,
      assignmentType: "escalate",
    };

    this.incidentService.editIncident(this.incident.id, body).subscribe((r) => {
      // update incident status after successful editing of incident. replaces only status part.
      this.incidentService
        .getIncident(this.incident.id)
        .subscribe((incidentResponse) => {
          this.incident.assignments = incidentResponse.data.assignments;
          this.sortAssignments();
          this.incident.logs = incidentResponse.data.logs;
          this.prepareLogs();
          this.openSnackBar("Escalation Successful", "Close");
        });
    });
  }

  /**
   * Method is use to download file.
   * @param data - Array Buffer data
   * @param type - type of the document.
   */
  downLoadFile(data: any, type: string) {
    const blob = new Blob([data], { type: type });
    const url = window.URL.createObjectURL(blob);
    const pwa = window.open(url);
    if (!pwa || pwa.closed || typeof pwa.closed == "undefined") {
      alert("Please disable your Pop-up blocker and try again.");
    }
  }

  exportToPDF(id: string) {
    const downloadLink = `${environment.API_URL}generate/pdf/incident/` + id;
    const pwa = window.open(downloadLink);
    if (!pwa || pwa.closed || typeof pwa.closed == "undefined") {
      alert("Please disable your Pop-up blocker and try again.");
    }
  }

  exportToFleetPDF(id: string) {
    const downloadLink =
      `${environment.API_URL}generate/pdf/incident/` + id + `/fleet`;
    const pwa = window.open(downloadLink);
    if (!pwa || pwa.closed || typeof pwa.closed == "undefined") {
      alert("Please disable your Pop-up blocker and try again.");
    }
  }

  mergeImages(canvas, uuid, overlayId, downloadImage) {
    const context = canvas.getContext("2d");

    const img1 = new Image();
    const img2 = new Image();

    this.mediaService.getMedia(uuid).subscribe((r) => {
      const img1Url = window.URL.createObjectURL(r);
      img1.src = img1Url;
    });

    this.mediaService.getMedia(overlayId).subscribe((r) => {
      const img2Url = window.URL.createObjectURL(r);
      img2.src = img2Url;
    });

    const imageCollector = function (expectedCount, completeFn) {
      let receivedCount = 0;
      return function () {
        if (++receivedCount === expectedCount) {
          completeFn();
        }
      };
    };

    const renderer = this.renderer;
    // const downloadCanvas = this.downloadCanvasImage;

    const ic = imageCollector(2, function () {
      canvas.width = img2.width;
      canvas.height = img2.height;
      context.drawImage(
        img1,
        0,
        0,
        img1.width,
        img1.height,
        0,
        0,
        canvas.width,
        canvas.height
      );

      context.drawImage(img2, 0, 0);

      if (downloadImage) {
        canvas.toBlob((blob) => {
          const blobURL = URL.createObjectURL(blob);
          const a = document.createElement("a");
          document.body.appendChild(a);
          a.setAttribute("style", "display: none");
          // a.href = blobURL;
          // a.download = uuid;
          // a.click();
          // window.URL.revokeObjectURL(blobURL);
          // a.remove();
        });
      }
    });

    img1.onload = ic;
    img2.onload = ic;
  }

  downloadCanvasImage(canvas, uuid, previewImage) {
    const downloadBlobFromUrl = this.downloadFromBlobUrl;

    canvas.toBlob((blob) => {
      const blobURL = URL.createObjectURL(blob);
      downloadBlobFromUrl(blobURL, uuid);
      this.preViewImg = this.mediaSrc[uuid];
      this.modalService
        .open(previewImage, { ariaLabelledBy: "modal-basic-title" })
        .result.then(
          (result) => {
            this.closeResult = `Closed with: ${result}`;
          },
          (reason) => {
            this.closeResult = `Dismissed`;
          }
        );
    });
  }

  downloadFromBlobUrl(blobURL, uuid) {
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.setAttribute("style", "display: none");
    // a.href = blobURL;
    // a.download = uuid;
    // a.click();
    // window.URL.revokeObjectURL(blobURL);
    // a.remove();
  }

  getMedia(attachment, previewImage, title) {
    const uuid = attachment.uuid;

    if (attachment.overlayId) {
      const canvas = document.createElement("canvas");
      document.body.appendChild(canvas);
      canvas.setAttribute("style", "display: none");
      this.mergeImages(canvas, uuid, attachment.overlayId, true);
    } else {
      this.preViewImg = this.mediaSrc[uuid];
      this.mediaService.getMedia(uuid).subscribe((r) => {
        this.modalService
          .open(previewImage, { ariaLabelledBy: "modal-basic-title" })
          .result.then(
            (result) => {
              this.closeResult = `Closed with: ${result}`;
            },
            (reason) => {
              this.closeResult = `Dismissed`;
            }
          );
        if (title == "Add Media" || title == "Add Photos & Videos") {
          if (attachment.annotation != undefined) {
            setTimeout(() => {
              const sketchpad = Raphael.sketchpad("viewer", {
                width: 260,
                height: 260,
                editing: false,
              });
              sketchpad.json(attachment.annotation);
            }, 2000);
          }
        }
        const url = window.URL.createObjectURL(r);
        const a = document.createElement("a");
        document.body.appendChild(a);
        a.setAttribute("style", "display: none");
        // a.href = url;
        // a.download = attachment.label;
        // a.click();
        // window.URL.revokeObjectURL(url);
        // a.remove();
      });
    }
  }

  distance(lat1, lon1, lat2, lon2) {
    const p = 0.017453292519943295; // Math.PI / 180
    const c = Math.cos;
    const a =
      0.5 -
      c((lat2 - lat1) * p) / 2 +
      (c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p))) / 2;

    return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
  }

  findIncidentLocation(incident) {
    // loop through incident's fields and find field with lat;lng
    let lat = null;
    let lng = null;
    if (incident) {
      for (const section of incident.data.sections) {
        for (const field of section.fields) {
          if (field.lat) {
            lat = field.lat;
            lng = field.lng;
          }
        }
      }
    }

    return {
      lat: lat,
      lng: lng,
    };
  }

  createIncidentCountChart() {
    // colors for charts
    const colors = ["#e22228", "#0100e2", "#07e21c", "#e274a2", "#dae20b"].sort(
      function () {
        return 0.5 - Math.random();
      }
    );

    // parent incident location
    const incidentCoordinates = this.findIncidentLocation(this.incident);

    // find incidents in this area
    const areaIncidents = [];

    for (const incident of this.incidents) {
      const location = this.findIncidentLocation(incident);

      if (this.incident && location.lat && this.incident.id !== incident.id) {
        const distance = this.distance(
          +incidentCoordinates.lat,
          +incidentCoordinates.lng,
          +location.lat,
          +location.lng
        );
        if (distance <= 16) {
          areaIncidents.push(incident);
        }
      }
    }

    // show chart for incident counts during last 5 days
    const last_dates = [];
    const today = new Date();

    for (let i = 0; i <= 4; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);

      const data = {
        date: d,
      };

      for (const incidentType of this.incidentTypesData) {
        data[`${incidentType.name}`] = 0;
      }

      for (const incident of areaIncidents) {
        const incidentDate = new Date(incident.createdAt);
        if (incidentDate < d) {
          data[`${incident.type.name}`] += 1;
        }
      }

      last_dates.push(data);
    }

    const datasets = [];

    let index = 1;
    for (const incidentType of this.incidentTypesData) {
      const dataset = {
        label: `${incidentType.name}`,
        backgroundColor: incidentType.color,
        borderColor: incidentType.color,
        data: [
          last_dates[4][`${incidentType.name}`],
          last_dates[3][`${incidentType.name}`],
          last_dates[2][`${incidentType.name}`],
          last_dates[1][`${incidentType.name}`],
          last_dates[0][`${incidentType.name}`],
        ],
        fill: false,
      };

      datasets.push(dataset);
      index++;
    }

    const htmlRef = this.elementRef.nativeElement.querySelector(
      `#incidents_count_chart`
    );
    const config = {
      type: "line",
      data: {
        labels: [
          last_dates[4].date.toLocaleDateString(),
          last_dates[3].date.toLocaleDateString(),
          last_dates[2].date.toLocaleDateString(),
          last_dates[1].date.toLocaleDateString(),
          last_dates[0].date.toLocaleDateString(),
        ],
        datasets: datasets,
      },
      options: {
        responsive: true,
        title: {
          display: false,
          text: "Chart.js Line Chart",
        },
        tooltips: {
          mode: "index",
          intersect: false,
        },
        hover: {
          mode: "nearest",
          intersect: true,
        },
        scales: {
          xAxes: [
            {
              display: true,
              scaleLabel: {
                display: true,
                labelString: "Month",
              },
            },
          ],
          yAxes: [
            {
              display: true,
              scaleLabel: {
                display: true,
                labelString: "Value",
              },
            },
          ],
        },
      },
    };
  }

  createDetail() {
    const cDate = this.concernDetailsForm.value.closedDate;

    const concernClosedDate = new Date();
    concernClosedDate.setUTCDate(cDate.day);
    concernClosedDate.setUTCMonth(cDate.month - 1);
    concernClosedDate.setUTCFullYear(cDate.year);

    const body = {
      companyId: this.currentUser.company.id,
      incidentId: this.incident.id,
      concernDetailsType: this.concernDetailsForm.value.type,
      // 2020-09-20
      supplierName: this.concernDetailsForm.value.supplierName,
      supplierRef: this.concernDetailsForm.value.supplierRef,
      primaryContact: this.concernDetailsForm.value.primaryContact,
      phoneNumber: this.concernDetailsForm.value.phoneNumber,
      secondaryContact: this.concernDetailsForm.value.secondaryContact,
      secondaryNumber: this.concernDetailsForm.value.secondaryNumber,
      responseRequired: this.concernDetailsForm.value.concernResponse,
      closedDownByName: this.concernDetailsForm.value.closedName,
      closedDownByJobTitle: this.concernDetailsForm.value.closedJob,
      closedDownByDate: concernClosedDate,
      responseRejectionNote: this.concernDetailsForm.value.responseRejected,
      responseAccepted: this.concernDetailsForm.value.responseAccepted,
      responseEmail: this.concernDetailsForm.value.responseEmail,
      responseEmail2: this.concernDetailsForm.value.responseEmail2,
      responseDescription: this.concernDetailsForm.value.responseDescription,
    };
    if (this.concernDetailsForm.value.type == "Finning") {
      body.supplierName = this.concernDetailsForm.value.finningType;
    }
    this.incidentService.postDetails(body).subscribe(
      (r) => {
        this.openSnackBar("Submission Success", "Close");
        window.location.reload();
      },
      (e) => {
        this.openSnackBar("Submission Error", "Close");
      }
    );
  }

  getPdfPayload() {
    const incident = this.incident;
    let counter = 0;

    this.incidentPayload.logo_url =
      "https://logincident.com/assets/img/logo.png";
    this.incidentPayload.incident_id = incident.id;
    this.incidentPayload.incident_type = incident.type.name;
    this.incidentPayload.bg_img =
      "https://logincident.com/assets/img/hero/hero-bg.jpg";
    this.incidentPayload.left_col = <any>{};
    this.incidentPayload.right_col = <any>{};
    this.incidentPayload.footer_image = "";
    this.incidentPayload.footer_link = "";

    this.incidentPayload.left_col.tables = [];
    this.incidentPayload.right_col.tables = [];

    const reportedBy = this.pdfGenerateReportedBy(incident.user);
    if (reportedBy.rows.length > 0) {
      counter += 1;
      this.incidentPayload.left_col.tables.push(reportedBy);
    }

    for (const section of incident.data.sections) {
      const sections = this.pdfGenerateSection(section);
      if (sections.rows.length > 0) {
        counter += 1;
        if (this.isOdd(counter)) {
          this.incidentPayload.right_col.tables.push(sections);
        } else {
          this.incidentPayload.left_col.tables.push(sections);
        }
      }
      // left col

      if (section.media) {
        const mediaImages = this.pdfGenerateMediaSection(section);
        counter += 1;
        if (this.isOdd(counter)) {
          this.incidentPayload.right_col.tables.push(mediaImages);
        } else {
          this.incidentPayload.left_col.tables.push(mediaImages);
        }
      }

      if (section.damages) {
        for (const damage of section.damages) {
          const damages = this.pdfGenerateSection(damage);
          if (damages.rows.length > 0) {
            counter += 1;
            if (this.isOdd(counter)) {
              this.incidentPayload.right_col.tables.push(damages);
            } else {
              this.incidentPayload.left_col.tables.push(damages);
            }
          }
        }
      }

      if (section.injuries) {
        for (const injury of section.injuries) {
          const injuries = this.pdfGenerateSection(injury);
          if (injuries.rows.length > 0) {
            counter += 1;
            if (this.isOdd(counter)) {
              this.incidentPayload.right_col.tables.push(injuries);
            } else {
              this.incidentPayload.left_col.tables.push(injuries);
            }
          }
        }
      }

      if (section.vehicles) {
        for (const vehicle of section.vehicles) {
          const vehicles = this.pdfGenerateSection(vehicle);
          if (vehicles.rows.length > 0) {
            counter += 1;
            if (this.isOdd(counter)) {
              this.incidentPayload.right_col.tables.push(vehicles);
            } else {
              this.incidentPayload.left_col.tables.push(vehicles);
            }
          }
        }
      }

      if (section.witnesses) {
        for (const witness of section.witnesses) {
          const witnesses = this.pdfGenerateSection(witness);
          if (witnesses.rows.length > 0) {
            counter += 1;
            if (this.isOdd(counter)) {
              this.incidentPayload.right_col.tables.push(witnesses);
            } else {
              this.incidentPayload.left_col.tables.push(witnesses);
            }
          }
        }
      }
    }
  }

  pdfGenerateReportedBy(user: any) {
    const reportedBy = <any>{};
    const name = <any>{};
    const email = <any>{};
    const phone = <any>{};
    reportedBy.title = "Reported By";
    reportedBy.rows = [];

    name.label = "Name";
    name.value = `${user.firstName} ${user.lastName}`;
    name.type = "string";
    reportedBy.rows.push(name);

    email.label = "Email";
    email.value = user.email;
    email.type = "string";
    reportedBy.rows.push(email);

    phone.label = "Phone";
    phone.value = user.phone;
    phone.type = "string";
    reportedBy.rows.push(phone);
    return reportedBy;
  }

  pdfGenerateMediaSection(section: any) {
    const sectionData = <any>{};
    sectionData.rows = [];
    sectionData.title = section.title;

    for (const field of section.media) {
      this.mediaService.getMedia(field.uuid).subscribe((r) => {
        const img1Url = window.URL.createObjectURL(r);
        const fields = <any>{};
        fields.label = field.label;
        fields.type = "image";
        fields.value = img1Url;
        sectionData.rows.push(fields);
      });
    }
    return sectionData;
  }

  pdfGenerateSection(section: any) {
    const sectionData = <any>{};
    sectionData.rows = [];
    sectionData.title = section.title;

    for (const field of section.fields) {
      const fields = <any>{};
      fields.label = field.fieldTitle;

      let fieldValue = field.fieldValue;
      if (field.fieldType === "time") {
        const d = new Date(fieldValue);
        fieldValue = d.toLocaleTimeString();
        fields.type = "string";
        fields.value = fieldValue;
      } else if (field.fieldType === "datetime") {
        const d = new Date(fieldValue);
        fieldValue = d.toLocaleString();
        fields.type = "string";
        fields.value = fieldValue;
      } else if (field.fieldType === "date") {
        const d = new Date(fieldValue);
        fieldValue = d.toLocaleDateString();
        fields.type = "string";
        fields.value = fieldValue;
      } else if (section.title.toLowerCase().indexOf("location") >= 0) {
        sectionData.title = "Location";
        fields.type = "maps";
        if (field.fieldType == "gps") {
          fields.value = `${field.lat},${field.lng}`;
        } else {
          fields.value = field.fieldValue;
        }
      } else {
        fields.type = "string";
        fields.value = field.fieldValue;
      }

      sectionData.rows.push(fields);
    }

    return sectionData;
  }

  isOdd(num) {
    return num % 2;
  }

  concernDisposition(value) {
    this.rejectionStatus = false;
    this.resRejectionNote = "";
    if (value == "false") {
      this.rejectionStatus = true;
    }
  }
}
