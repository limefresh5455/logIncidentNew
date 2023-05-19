import {
  AfterViewInit,
  Component,
  ContentChild,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from "@angular/core";
import { IncidentsService } from "../_services/incidents.service";
import { CompanyService } from "../_services/company.service";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { GooglePlaceDirective } from "ngx-google-places-autocomplete";
import { Address } from "ngx-google-places-autocomplete/objects/address";
import {
  DropzoneDirective,
  DropzoneConfigInterface,
  DropzoneComponent,
} from "ngx-dropzone-wrapper";
import { CustomerService } from "../_services/customer.service";
import { HttpHeaders } from "@angular/common/http";
import { MapsService } from "../_services/maps.service";
import { MediaService } from "../_services/media.service";
import { NgbDate, NgbDateStruct, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { User } from "../_models/user";
import swal from "sweetalert2";
import { Observable } from "rxjs";
import { map, startWith } from "rxjs/operators";
import { UsersService } from "../_services/users.service";
import { environment } from "../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { WhiteSpaceValidator } from "./../whitespace.validator";
import { DomSanitizer } from "@angular/platform-browser";
import { group } from "@angular/animations";

export interface SearchUser {
  name: string;
  email: string;
  value: string;
}

@Component({
  selector: "app-create-incident",
  templateUrl: "./create-incident.component.html",
  styleUrls: ["./create-incident.component.css"],
})
// text, boolean, radio, dropdown, date, datetime, time, gps
export class CreateIncidentComponent implements OnInit, AfterViewInit {
  mysearchControl = new FormControl();
  private endpoint = `${environment.API_URL}`;
  lat;
  lng;
  formData;
  currentIncidentType;
  form: FormGroup;
  submitted = false;
  submitted1 = false;
  anonymous = false;
  coordinates = {};
  maxDate;
  dropzones = {};
  addedFilesFromServer = false;

  showAddInjuryButton = false;
  showHideSIFSection = false;
  showHideSIFButton = false;
  injuryCount = 0;
  injurySection;
  imgSrc: string;

  showAddVehicleButton = false;
  vehicleCount = 0;
  vehicleSection;
  currentUser: User;
  max;
  // edit incident
  incidentId;
  incident;
  locationField;
  whatthreewords;
  selectAddress;
  allowSelfAssign = false;
  assignedTo;
  currentDaydatepicker = true;
  timeFieldId;
  options: SearchUser[] = [];
  filteredOptions: Observable<SearchUser[]>;
  @ViewChild("places") places: GooglePlaceDirective;
  @ViewChildren(DropzoneDirective) directiveRef: QueryList<DropzoneDirective>;

  companyColor = null;
  accentColor = null;
  contactNumber = null;

  userGroupId = null;
  userTeamid = null;
  groupTypeParentId;
  showChildGroup = false;
  parentGroup = [];
  childrenGroup = [];
  groupTypes = null;
  currentGroup;
  profileFields;
  selectedChildren = [];
  parentId = null;
  drawImageUrl = "";
  drawImagepopup = false;
  dropSectionId;
  drawimageWidth = 500;
  drawimageHeight = 500;
  allDrawImage = [];
  fileuuids = [];
  filesizes = [];
  company: any;
  VehicleSchematicsImg =
    "https://logincident-media.s3.eu-west-1.amazonaws.com/274fc795-d920-40ba-82a5-762f66f53e85.png";
  InjurySchematicsImg =
    "https://logincident-media.s3.eu-west-1.amazonaws.com/905e675b-2894-4ea0-a632-781c91dcb959.png";

  userList: any = [];
  emails: any = [];
  profileF;
  userEmail;
  declareType: any = "";
  declareType1: any = "";
  checkIncidentType: any;
  groupName: any;

  severityValue: string = "Low";
  isSeverityReadonly: boolean = false;
  mediaSrc = {};

  constructor(
    private incidentService: IncidentsService,
    private modalService: NgbModal,
    private companyService: CompanyService,
    private router: Router,
    private customerService: CustomerService,
    private route: ActivatedRoute,
    private mapsService: MapsService,
    private mediaService: MediaService,
    private userService: UsersService,
    private http: HttpClient,
    private sanitizerService: DomSanitizer
  ) {
    this.maxDate = {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getDate(),
    };
    this.max = new Date();
    this.currentUser = this.customerService.getUser();
    this.companyColor = this.currentUser.company.primary;
    this.accentColor = this.currentUser.company.accent;
    document.body.style.setProperty(
      "--company-primary",
      this.currentUser.company.primary
    );
    document.body.style.setProperty(
      "--company-accent",
      this.currentUser.company.accent
    );
    document.body.style.setProperty(
      "--company-primaryTwo",
      this.currentUser.company.primaryTwo
    );
    if (!this.currentUser.email) {
      this.router.navigateByUrl("/profile");
    }
  }

  ngOnInit() {
    this.incidentId = this.route.snapshot.paramMap.get("id");
    this.getIncidentTypes();
    this.companyService.getUserCompany().subscribe(
      (response) => {
        this.company = response.data;
        this.contactNumber = response.data.contactNumber;
        this.allowSelfAssign = response.data.allowSelfAssign;
      },
      (e) => {}
    );
  }

  displayFn(user: SearchUser): string {
    return user && user.name ? user.name : "";
  }

  private _filter(name: string): SearchUser[] {
    const filterValue = name.toLowerCase();

    return this.options.filter(
      (option) => option.name.toLowerCase().indexOf(filterValue) === 0
    );
  }

  ngAfterViewInit() {
    this.directiveRef.changes.subscribe(
      () => {
        if (this.incident && !this.addedFilesFromServer) {
          for (const dropzone of this.directiveRef.toArray()) {
            // get section id from dropzone directive
            const dropzoneObject = dropzone.dropzone();
            const sectionTitle = dropzoneObject.element.id.split("-")[0];
            const sectionId = dropzoneObject.element.id.split("-")[1];
            const itemId = dropzoneObject.element.id.split("-")[2];
            let section_media_files = [];

            // Find dropzone's section by title
            for (const section of this.incident.data.sections) {
              // if (section.title === sectionTitle) {
              // in case section is of type "media" media files are on the highest level

              if (section.hasOwnProperty("media")) {
                if (section.media.length > 0) {
                  section_media_files = section.media;
                }
              }

              //TEST BKP 20230412

              // if (section.media.length > 0) {
              //   section_media_files = section.media;
              // }

              // }
            }
            this.addFilesToDropzone(
              sectionId,
              dropzoneObject,
              section_media_files
            );
          }
        }
      },
      (e) => {
        this.router.navigateByUrl("/login");
      }
    );
  }

  addFilesToDropzone(sectionId, dropzoneObject, section_media_files) {
    for (const fileItem of section_media_files) {
      if (!this.fileuuids.includes(fileItem.uuid)) {
        this.fileuuids.push(fileItem.uuid);
        // this.preViewImg = fileItem.uuid;
        this.mediaService.getMedia(fileItem.uuid).subscribe(
          (r) => {
            if (!this.filesizes.includes(r.size)) {
              const url = window.URL.createObjectURL(r);
              const fileName = fileItem.uuid + "." + r.type.split("/")[1];
              const mockFile = { name: fileName, size: r.size, dataURL: url };
              this.filesizes.push(r.size);
              dropzoneObject.emit("addedfile", mockFile);
              if (fileItem.type === "image") {
                dropzoneObject.createThumbnailFromUrl(
                  mockFile,
                  dropzoneObject.options.thumbnailWidth,
                  dropzoneObject.options.thumbnailHeight,
                  dropzoneObject.options.thumbnailMethod,
                  true,
                  function (thumbnail) {
                    dropzoneObject.emit("thumbnail", mockFile, thumbnail);
                  }
                );
              }
              dropzoneObject.emit("complete", mockFile);
              const dropzoneDataItem = {
                uuid: fileItem.uuid,
                type: fileItem.type,
              };
              this.mediaSrc[fileItem.uuid] =
                this.sanitizerService.bypassSecurityTrustUrl(url);
              if ("overlayId" in fileItem) {
                dropzoneDataItem["overlayId"] = fileItem.overlayId;
              }
              this.dropzones[sectionId].data.push(dropzoneDataItem);
            }
          },
          (e) => {
            alert("Error Uploading Media: " + e.status + " " + e.statusText);
          }
        );
      }
    }
  }

  //for disabled keyboard typing in date box
  owlDate(event: any) {
    event.preventDefault();
    return false;
  }

  public onLocationChange(fieldId: any, address: Address) {
    this.coordinates[fieldId] = {
      lat: address.geometry.location.lat(),
      lng: address.geometry.location.lng(),
    };

    this.lat = address.geometry.location.lat();
    this.lng = address.geometry.location.lng();
    if (this.whatthreewords) {
      this.mapsService
        .getWhats3words(
          address.geometry.location.lat(),
          address.geometry.location.lng()
        )
        .subscribe((response) => {
          if (response.words) {
            this.form.controls[this.whatthreewords].setValue(response.words);
          }
        });
    }

    if (this.selectAddress) {
      this.form.controls[this.selectAddress].setValue("");
    }
  }

  onWhat3WordsChange(fieldId = null) {
    const words = this.form.value[fieldId];
    if (words) {
      this.mapsService.getlocWhats3words(words).subscribe((response) => {
        if (response.coordinates.lat && response.coordinates.lng) {
          this.coordinates[this.locationField] = {
            lat: response.coordinates.lat,
            lng: response.coordinates.lng,
          };
          (this.lat = response.coordinates.lat),
            (this.lng = response.coordinates.lng);
          if (this.lat != "0.0" && this.lng != "0.0") {
            this.mapsService
              .getGeoLocation(
                response.coordinates.lat,
                response.coordinates.lng
              )
              .subscribe((r) => {
                this.form.controls[this.locationField].setValue(
                  r[1].formatted_address
                );
                if (this.selectAddress) {
                  this.form.controls[this.selectAddress].setValue("");
                }
              });
          }
        }
      });
    }
  }

  locationMarker(event) {
    if (event.coords.lat && event.coords.lng) {
      this.coordinates[this.locationField] = {
        lat: event.coords.lat,
        lng: event.coords.lng,
      };

      this.lat = event.coords.lat;
      this.lng = event.coords.lng;
      if (this.lat != "0.0" && this.lng != "0.0") {
        this.mapsService
          .getGeoLocation(event.coords.lat, event.coords.lng)
          .subscribe((r) => {
            this.form.controls[this.locationField].setValue(
              r[1].formatted_address
            );
          });
      }
      if (this.whatthreewords) {
        this.mapsService
          .getWhats3words(event.coords.lat, event.coords.lng)
          .subscribe((response) => {
            if (response.words) {
              this.form.controls[this.whatthreewords].setValue(response.words);
            }
          });
      }
    }

    if (this.selectAddress) {
      this.form.controls[this.selectAddress].setValue("");
    }
  }

  setMonth: NgbDateStruct;

  incidentCreatedDate(date1) {
    const date = new Date(date1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const ngbDate = { year: year, month: month, day: day };
    return ngbDate;
  }

  // setMonth;
  getIncidentTypes() {
    this.incidentService.getIncidentTypes().subscribe(
      (response) => {
        this.formData = response.data;
        if (this.formData.length > 0) {
          if (this.incidentId) {
            // this is edit incident form
            this.incidentService.getIncident(this.incidentId).subscribe(
              (r) => {
                // this.incidentCreatedMonthEdit = r.data.createdAt;
                let date = this.incidentCreatedDate(r.data.createdAt);
                this.setMonth = date;
                this.incident = r.data;
                this.userGroupId = this.incident.userGroup
                  ? this.incident.userGroup.id
                  : "";
                // Setup site and division
                this.companyService
                  .getCompanyGroupTypesWithGroups(
                    this.customerService.getUser().company.id
                  )
                  .subscribe((resp) => {
                    this.groupName = resp.data.name;
                    if ("groupTypes" in resp.data) {
                      this.groupTypes = resp.data.groupTypes;
                      if (this.incident.userGroup) {
                        this.currentGroup = this.incident.userGroup;
                      }
                      for (const groupType of resp.data.groupTypes) {
                        if (
                          this.checkForGroupType(groupType.groups, "children")
                        ) {
                          groupType.groups.sort((a, b) =>
                            a.name > b.name ? 1 : -1
                          );
                          this.parentGroup.push(groupType);
                        } else if (
                          this.checkForGroupType(groupType.groups, "parent")
                        ) {
                          groupType.groups.sort((a, b) =>
                            a.name > b.name ? 1 : -1
                          );
                          this.childrenGroup.push(groupType);
                        }
                      }
                      if (this.incident.userGroup) {
                        if (this.incident.userGroup.parent) {
                          this.setChild(this.incident.userGroup.parent.id);
                        }
                        this.currentGroup = this.incident.userGroup;
                      }
                    }
                  });
                // set incident type of incident
                this.incidentTypeChange(this.incident.type.id);
              },
              (e) => {
                this.router.navigateByUrl("/login");
              }
            );
            this.userService.getProfileData().subscribe(
              (resp) => {
                const fields = [];
                resp.data.company.profile.fields.forEach(function (value, i) {
                  const field = {
                    id: value.id,
                    placeholder: value.placeHolder,
                    title: value.title,
                    type: value.type,
                    order: value.order,
                    fieldValue: null,
                    isDisabled: value.isDisabled,
                  };
                  if (
                    resp.data.profile &&
                    resp.data.profile.fields[i] &&
                    resp.data.profile.fields[i].fieldValue.length > 0
                  ) {
                    field.fieldValue = resp.data.profile.fields[i].fieldValue;
                  }
                  fields.push(field);
                });
                fields.sort((a, b) => (a.order > b.order ? 1 : -1));
                this.profileFields = fields;
              },
              (e) => {
                console.log(e);
              }
            );
          } else {
            this.incidentTypeChange(this.formData[0].id);
            if (
              this.currentUser.company.name === "Finninguk" ||
              this.currentUser.company.name == "Finning"
            ) {
              this.userService.getProfileData().subscribe(
                (resp) => {
                  const fields = [];
                  this.userEmail = resp.data.email;
                  resp.data.company.profile.fields.forEach(function (value, i) {
                    const field = {
                      id: value.id,
                      placeholder: value.placeHolder,
                      title: value.title,
                      type: value.type,
                      order: value.order,
                      fieldValue: null,
                      isDisabled: value.isDisabled,
                    };
                    if (
                      resp.data.profile &&
                      resp.data.profile.fields[i] &&
                      resp.data.profile.fields[i].fieldValue.length > 0
                    ) {
                      field.fieldValue = resp.data.profile.fields[i].fieldValue;
                    }
                    fields.push(field);
                  });
                  fields.sort((a, b) => (a.order > b.order ? 1 : -1));
                  this.profileFields = fields;
                  for (const pFields of this.profileFields) {
                    this.profileF = pFields.fieldValue;
                  }

                  if (
                    this.checkIncidentType !== "Electric Power" &&
                    this.checkIncidentType !== "Equipment Solutions"
                  ) {
                    this.form.controls["supervisor"].setValue(this.profileF);
                    this.form.controls["useremail"].setValue(this.userEmail);
                  }
                },
                (e) => {}
              );
            }
          }
        } else {
          alert("Please add incident types");
        }
      },
      (e) => {
        this.router.navigateByUrl("/login");
      }
    );
  }

  checkForGroupType(groups, type) {
    for (let i = 0; i < groups.length; i++) {
      if (type in groups[i]) {
        return true;
      }
    }
  }

  childChange(value) {
    this.userGroupId = value;
  }

  setChild(value) {
    for (let i = 0; i < this.childrenGroup.length; i++) {
      // Loop through children
      const child = {
        groups: [],
        name: null,
        id: null,
      };
      for (let num = 0; num < this.childrenGroup[i].groups.length; num++) {
        // Look in children to find one matching selected parent.
        if (this.childrenGroup[i].groups[num].parent.id === value) {
          if (
            this.selectedChildren.findIndex(
              (x) => x.id === this.childrenGroup[i].id
            )
          ) {
            // if the child is related to the parent and child hasnt been added to selectedChildren
            child.name = this.childrenGroup[i].name;
            child.id = this.childrenGroup[i].id;
            child.groups.push(this.childrenGroup[i].groups[num]);
            this.selectedChildren.push(child);
          } else {
            const childIndex = this.selectedChildren.findIndex(
              (x) => x.id === this.childrenGroup[i].id
            );
            // if the child has been added to selected Children then add the matching group to the child
            this.selectedChildren[childIndex].groups.push(
              this.childrenGroup[i].groups[num]
            );
            // then check for any groups not matching the parent and remove them
            for (
              let index = 0;
              index < this.selectedChildren[childIndex].groups.length;
              index++
            ) {
              if (
                this.selectedChildren[childIndex].groups[index].parent.id !==
                value
              ) {
                //  remove it
                this.selectedChildren[childIndex].groups.splice(index, 1);
              }
            }
          }
        }
      }
    }
    this.userGroupId = this.selectedChildren[0].value;
  }

  generateFormGroup() {
    for (const section of this.currentIncidentType.sections) {
      this.generateFormGroupSection(section, null);
    }
  }

  getFieldValue(field, incidentField) {
    let fieldValue = incidentField.fieldValue;
    if (field.type === "time") {
      const d = new Date(fieldValue);
      fieldValue = {
        hour: d.getHours(),
        minute: d.getMinutes(),
      };
    } else if (field.type === "date") {
      const d = new Date(fieldValue);
      fieldValue = {
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        day: d.getDate(),
      };
    } else if (field.type === "gps") {
      if (incidentField.lat != "0.0" && incidentField.lng != "0.0") {
        this.mapsService
          .getGeoLocation(incidentField.lat, incidentField.lng)
          .subscribe(
            (r) => {
              this.form.controls[this.locationField].setValue(
                r[1].formatted_address
              );
              this.coordinates[this.locationField] = {
                lat: incidentField.lat,
                lng: incidentField.lng,
              };

              this.lat = parseFloat(incidentField.lat);
              this.lng = parseFloat(incidentField.lng);
            },
            (e) => {
              this.router.navigateByUrl("/login");
            }
          );
      }
      if (this.whatthreewords) {
        this.mapsService
          .getWhats3words(incidentField.lat, incidentField.lng)
          .subscribe((response) => {
            if (response.words) {
              this.form.controls[this.whatthreewords].setValue(response.words);
            }
          });
      }
    }
    return fieldValue;
  }

  generateFormGroupSection(section: any, actualItem: any) {
    section.itemId = 0;
    if (actualItem) {
      section.itemId = actualItem.id;
    }
    this.lat = "";
    this.lng = "";
    if (
      this.currentUser.company.name === "Finninguk" ||
      this.currentUser.company.name == "Finning"
    ) {
      if (
        !this.incidentId &&
        this.checkIncidentType !== "Electric Power" &&
        this.checkIncidentType !== "Equipment Solutions"
      ) {
        this.form.addControl(
          "supervisor",
          new FormControl(null, [
            Validators.required,
            Validators.email,
            Validators.pattern(
              "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+.[A-Za-z]{1,63}$"
            ),
          ])
        );
        this.form.controls["supervisor"].setErrors(null);
        this.form.controls["supervisor"].setValue(this.profileF);
        this.form.addControl(
          "useremail",
          new FormControl(null, [
            Validators.required,
            Validators.email,
            Validators.pattern(
              "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+.[A-Za-z]{1,63}$"
            ),
          ])
        );
        this.form.controls["useremail"].setErrors(null);
        this.form.controls["useremail"].setValue(this.userEmail);
      }
    }

    for (const field of section.fields) {
      if (field.type === "gps") {
        if (field.title == "Location") {
          this.locationField = field.id;
        }
        if (field.title == "What3Words") {
          this.whatthreewords = field.id;
        }
      }

      if (field.type !== "media") {
        let validators = [Validators.required];
        if (
          field.type === "dropdown-address" ||
          field.type === "gps" ||
          field.type === "store-address"
        ) {
          validators = [];
        } else if (field.type === "info") {
          validators = [];
        }
        if (field.type !== "menu-option") {
          if (field.title == "Witness Email") {
            this.form.addControl(
              field.id,
              new FormControl(null, [
                Validators.required,
                Validators.email,
                Validators.pattern(
                  "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+.[A-Za-z]{1,63}$"
                ),
              ])
            );
          } else if (field.title == "Witness Name") {
            this.form.addControl(
              field.id,
              new FormControl(null, [
                Validators.required,
                Validators.pattern("^[^0-9]*$"),
              ])
            );
          } else if (field.title == "Witness Contact Number") {
            this.form.addControl(
              field.id,
              new FormControl(null, [
                Validators.required,
                Validators.pattern("^((\\+91-?)|0)?[0-9]{10}$"),
              ])
            );
          } else if (field.title == "Witness Age - if under 18") {
            this.form.addControl(
              field.id,
              new FormControl(null, [
                Validators.maxLength(2),
                Validators.pattern("^(?:[0-9]|1[0-8])$"),
              ])
            );
          } else if (field.title == "First Name") {
            this.form.addControl(
              field.id,
              new FormControl(null, [
                Validators.required,
                // Validators.pattern("^[a-zA-Z ]*$"),
              ])
            );
          } else if (field.title == "Surname") {
            this.form.addControl(
              field.id,
              new FormControl(null, [
                Validators.required,
                // Validators.pattern("^[a-zA-Z ]*$"),
              ])
            );
          } else if (field.title == "Who took the Action?") {
            this.form.addControl(
              field.id,
              new FormControl(null, [
                Validators.required,
                // Validators.pattern("^[a-zA-Z -']+"),
                // WhiteSpaceValidator.noSpaceValidation,
              ])
            );
          } else if (field.title == "Name of Injured Person") {
            this.form.addControl(
              field.id,
              new FormControl(null, [
                Validators.required,
                Validators.pattern("^^[a-zA-Z ]*$"),
                WhiteSpaceValidator.noSpaceValidation,
              ])
            );
          } else if (field.title == "Who took the action?") {
            this.form.addControl(
              field.id,
              new FormControl(null, [
                Validators.required,
                // Validators.pattern("^^[a-zA-Z ]*$"),
                // WhiteSpaceValidator.noSpaceValidation,
              ])
            );
          } else {
            if (field.isDisabled == true) {
              this.form.addControl(field.id, new FormControl(null));
            } else {
              this.form.addControl(field.id, new FormControl(null, validators));
            }
          }
        } else {
          this.form.addControl(field.id, new FormControl(null));
        }

        this.form.controls[field.id].setErrors(null);

        if (field.type === "dropdown") {
          this.form.controls[field.id].setValue(field.options[0].value, {
            onlySelf: true,
          });
          if (field.childField && !field.isChildField) {
            // Display Child Fields
            this.dropdownChange(section, field, field.options[0].value);
            if (this.form.controls[field.childField.id]) {
              this.form.controls[field.childField.id].setValue(
                field.childField.filteredOptions[field.options[0].id][0].value,
                { onlySelf: true }
              );
            }
            if (field.childField.childField) {
              // Display nested Child Field
              this.dropdownChange(
                section,
                field.childField,
                field.childField.filteredOptions[field.options[0].id][0].value
              );
            }
          }
        }

        if (field.type === "time") {
          const date = new Date();
          this.timeFieldId = field.id;
          this.form.controls[field.id].setValue(
            { hour: date.getHours(), minute: date.getMinutes() },
            { onlySelf: true }
          );
        }

        if (field.hiddenUntilTrue === true) {
          this.form.controls[field.id].clearValidators();
        }
        if (field.type === "date") {
          const date = new Date();
          const fieldValue = {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
          };
          this.form.controls[field.id].setValue(fieldValue);
        }

        if (field.type === "datetime") {
          const d = new Date();
          const fieldValue = d.toISOString();
          const datess = new Date(fieldValue)
          datess.setMinutes(datess.getMinutes() - 1);
          this.form.controls[field.id].setValue(datess);
        }

        if (this.incident) {
          if (actualItem) {
            for (const actualItemField of actualItem.fields) {
              if (actualItemField.fieldTitle === field.title) {
                const fieldValue = this.getFieldValue(field, actualItemField);
                this.form.controls[field.id].setValue(fieldValue);
              }
            }
          } else {
            // first collect all sections and add injuries/vehicles to the same level.
            let sections = [];

            for (const incidentSection of this.incident.data.sections) {
              sections.push(incidentSection);

              if (incidentSection.injuries) {
                sections = sections.concat(incidentSection.injuries);
              }

              if (incidentSection.vehicles) {
                sections = sections.concat(incidentSection.vehicles);
              }
            }

            // loop through incident data to find edit values.
            // section title and field title must match to use value
            for (const incidentSection of sections) {
              for (const incidentField of incidentSection.fields) {
                if (incidentField.fieldTitle === field.title) {
                  const fieldValue = this.getFieldValue(field, incidentField);
                  if (field.type == "boolean_yesno") {
                    this.declareType = fieldValue;
                  }
                  if (field.type == "finish_incident_boolean_yesno") {
                    this.declareType1 = fieldValue;
                  }
                  if (field.childField && !field.isChildField) {
                    if (this.form.controls[field.childField.id]) {
                      this.dropdownChange(
                        section,
                        field,
                        incidentField.fieldValue
                      );
                      this.form.controls[field.childField.id].setValue(
                        incidentField.fieldValue,
                        { onlySelf: true }
                      );
                    }
                    if (field.childField.childField) {
                      // Display nested Child Field
                      this.dropdownChange(
                        section,
                        field.childField,
                        incidentField.fieldValue
                      );
                    }
                  }
                  this.form.controls[field.id].setValue(fieldValue);
                }
              }
            }
          }
        }
      }
    }
  }

  sortOrder(fields) {
    fields.sort((a, b) => a.order - b.order);
    return fields;
  }

  anonToggle() {
    this.anonymous = !this.anonymous;
  }

  showHideSif(val) {
    this.showHideSIFSection = !val;
  }

  incidentTypeChange(id: string, change?) {
    this.severityValue = "Low";
    this.isSeverityReadonly = false;

    this.declareType = "No";
    this.form = new FormGroup({});
    this.submitted = false;
    this.dropzones = {};
    if (change) {
      this.fileuuids = [];
      this.filesizes = [];
    }

    for (const incidentType of this.formData) {
      if (incidentType.id === id) {
        this.checkIncidentType = incidentType.name;
        this.currentIncidentType = JSON.parse(JSON.stringify(incidentType)); // copy nested object without reference
      }
    }


    if(!change && this.currentUser.company.name == 'Finninguk' && this.incident) {
      if(this.incident.type.name == 'Hazard / Near Miss') {
        const hazardSections = this.incident.data.sections;

        const sifSection = hazardSections.filter((section) => {
          return section.title == 'SIF Information'
        });

        if(typeof sifSection != 'undefined' && sifSection.length) {
          const fields = sifSection[0].fields;
          const emptyFields = fields.filter((field) => {
            return field.fieldValue == '' || field.fieldValue == 'Please Select Category'
          });
           if(typeof emptyFields != 'undefined' && emptyFields.length ) {
              this.showHideSIFSection = true;
              this.showHideSIFButton = true;
           }
        }
      }
    }


    this.currentIncidentType.sections.sort((a, b) => a.order - b.order);
    // Check if injuries section is present. If so - show add injury button
    this.showAddInjuryButton = false;
    this.showAddVehicleButton = false;
    const sections = []; // filter out injury and vehicle sections so they're not present.

    for (const section of this.currentIncidentType.sections) {

      if (section.type === "holder") {
        this.analyzeHolderSection(section);

        if (this.incident) {
          for (const incidentSection of this.incident.data.sections) {
            if (incidentSection.damages) {
              for (const damage of incidentSection.damages) {
                this.addSectionDamage(section, section.damageSection, damage);
              }
            }

            if (incidentSection.injuries) {
              for (const injury of incidentSection.injuries) {
                this.addSectionDamage(section, section.injurySection, injury);
              }
            }

            if (incidentSection.vehicles) {
              for (const vehicle of incidentSection.vehicles) {
                this.addSectionDamage(section, section.vehicleSection, vehicle);
              }
            }

            if (incidentSection.witnesses) {
              for (const witness of incidentSection.witnesses) {
                this.addSectionDamage(section, section.witnessSection, witness);
              }
            }
          }
        }
      }

      if (section.type === "injury") {
        this.showAddInjuryButton = true;
        this.injurySection = section;
      } else if (section.type === "vehicle") {
        this.showAddVehicleButton = true;
        this.vehicleSection = section;
      } else {
        sections.push(section);
      }
    }

    this.currentIncidentType.sections = sections;
    this.generateFormGroup();
    this.initDropzones();
  }

  deleteItem(id) {
    for (const section of this.currentIncidentType.sections) {
      if (section.items) {
        for (let i = 0; i < section.items.length; i++) {
          if (section.items[i].id == id) {
            for (const field of section.items[i].fields) {
              if (field.type !== "media") {
                this.form.removeControl(field.id);
              }
            }
            section.items.splice(i, 1);
          }
        }
      }
    }
  }

  analyzeHolderSection(section: object) {
    if (
      "damageSection" in section ||
      "injurySection" in section ||
      "vehicleSection" in section ||
      "witnessSection" in section
    ) {
      section["showAddButton"] = true;
    }
  }

  addInjuryandVehicleDamage(section: any, type) {
    if (type == "injury") {
      this.drawimageWidth = 316;
      this.drawimageHeight = 500;
      this.drawImageUrl = this.InjurySchematicsImg;
      this.drawImagepopup = true;
      this.dropSectionId = section.id;
    } else if (type == "vehicle") {
      this.drawimageWidth = 307;
      this.drawimageHeight = 500;
      this.drawImageUrl = this.VehicleSchematicsImg;
      this.drawImagepopup = true;
      this.dropSectionId = section.id;
    }
  }

  addSectionDamage(section: any, item: any, actualItem: any) {
    // check if incident.section is on the incident type
    if (item) {
      if (!("items" in section)) {
        section["items"] = [];
      }

      const index = section.items.length + 1;
      const newSection = JSON.parse(JSON.stringify(item));
      newSection.id = section.id + "_" + index;
      for (const field of newSection.fields) {
        field.id = field.id + "_" + index;
      }

      this.generateFormGroupSection(newSection, actualItem);
      this.initDropzonesForSection(newSection);
      if (this.incident) {
        this.initFilesForHolderItemDropzone(newSection, actualItem);
      }
      section.items.push(newSection);
    }
  }

  initFilesForHolderItemDropzone(section, actualItem) {
    this.directiveRef.changes.subscribe(
      () => {
        for (const dropzone of this.directiveRef.toArray()) {
          const dropzoneObject = dropzone.dropzone();
          // TODO this is causing image display errors
          const sectionId = dropzoneObject.element.id.split("-")[1];
          if (section.id === sectionId) {
            let sectionMediaFiles = [];
            if (actualItem.media && actualItem.media.length > 0) {
              sectionMediaFiles = actualItem.media;
            }
            this.addFilesToDropzone(
              sectionId,
              dropzoneObject,
              sectionMediaFiles
            );
          }
        }
      },
      (e) => {
        this.router.navigateByUrl("/login");
      }
    );
  }

  addInjury() {
    if (this.injurySection) {
      this.injuryCount += 1;
      const injurySection = JSON.parse(JSON.stringify(this.injurySection)); // copy nested object without reference
      // change field ids so form controls do not duplicate
      for (const field of injurySection.fields) {
        field.id = field.id + `_${this.injuryCount}`;
      }
      // change field title and id to indicate which injury it is
      injurySection.id = injurySection.id + ` #${this.injuryCount}`;
      injurySection.title = injurySection.title + ` #${this.injuryCount}`;
      this.currentIncidentType.sections.push(injurySection);
      this.generateFormGroupSection(injurySection, null);
      this.initDropzonesForSection(injurySection);
    }
  }

  addVehicle() {
    if (this.vehicleSection) {
      this.vehicleCount += 1;
      const vehicleSection = JSON.parse(JSON.stringify(this.vehicleSection)); // copy nested object without reference
      // change field ids so form controls do not duplicate
      for (const field of vehicleSection.fields) {
        field.id = field.id + `_${this.vehicleCount}`;
      }
      // change field title and id to indicate which injury it is
      vehicleSection.id = vehicleSection.id + ` #${this.vehicleCount}`;
      vehicleSection.title = vehicleSection.title + ` #${this.vehicleCount}`;

      this.currentIncidentType.sections.push(vehicleSection);
      this.generateFormGroupSection(vehicleSection, null);
      this.initDropzonesForSection(vehicleSection);
    }
  }

  addressDropdownChange(section: any, field: any, optionValue: any) {
    // find addressId from option value
    this.selectAddress = field.id;
    this.lat = "";
    this.lng = "";
    if (this.locationField) {
      this.form.controls[this.locationField].setValue("");
    }

    if (this.whatthreewords) {
      this.form.controls[this.whatthreewords].setValue("");
    }

    let addressId;
    for (const address of field.addresses) {
      if (address.address === optionValue) {
        addressId = address.id;
      }
    }
  }

  dropdownChange(section: any, field: any, optionValue: any) {
    // find optionId from option value
    let optionId;
    let selectedOption = null;

    for (const option of field.options) {
      if (option.value === optionValue) {
        optionId = option.id;

        selectedOption = option;
      }
    }

    //optionValue = undefined;

    if (
      typeof optionValue == "undefined" ||
      optionValue == null ||
      typeof optionId == "undefined" ||
      optionId == null
    ) {
      optionId = null;
      selectedOption = null;
      optionValue = null;
    }

    console.log("field optionValue 222222222222", optionValue, optionId);

    if (
      selectedOption &&
      typeof selectedOption.setFutureField != "undefined" &&
      selectedOption.setFutureField
    ) {
      this.severityValue = selectedOption.setFutureField.value;
      this.isSeverityReadonly = selectedOption.setFutureField.readonly;
    }

    if (field.childField) {
      // remove childField
      const index = section.fields.indexOf(field.childField, 0);
      if (index > -1) {
        section.fields.splice(index, 1);
      }

      if (field.childField && field.childField.childField) {
        // remove childField childfield if it exists
        const nestedIndex = section.fields.indexOf(
          field.childField.childField,
          0
        );

        if (nestedIndex > -1) {
          section.fields.splice(nestedIndex, 1);
        }
      }

      // if selected option from dropdown has childfield - add child field to section fields
      if (optionId in field.childField.filteredOptions) {
        // filter childfiled options by parent selected option
        field.childField.options = field.childField.filteredOptions[optionId];
        field.childField.isChildField = true;
        section.fields.push(field.childField);
        // add form control
        this.form.addControl(field.childField.id, new FormControl(null, []));
        if (
          field.childField.type === "dropdown" ||
          field.childField.type === "selection"
        ) {
          this.form.controls[field.childField.id].setValue(
            field.childField.options[0].value,
            { onlySelf: true }
          );
          // Trigger dropdown change again if field has nested childfield so it will display
          if (field.childField.childField) {
            this.dropdownChange(
              section,
              field.childField,
              field.childField.options[0].value
            );
          }
        }
      }
    }
  }

  declarationChange(section: any, field: any, optionValue: any) {
    this.declareType = optionValue;
    for (const option of section.fields) {
      if (option.type == "finish_incident_boolean_yesno") {
        if (optionValue == "No") {
          this.form.controls[option.id].setValue("");
        }
      }
    }
  }

  declarationChange2(
    section: any,
    field: any,
    optionValue: any,
    el: HTMLElement
  ) {
    this.declareType1 = optionValue;
    if (
      this.checkIncidentType == "Observation" &&
      this.declareType == "Yes" &&
      this.declareType1 == "Yes"
    ) {
      el.scrollIntoView();
    }
  }

  analyzeSection(section_fields: any, section: any) {
    for (const field of section.fields) {
      let field_value = this.form.value[field.id];
      const fieldId = field.id;

      if (field.type === "time") {
        const d = new Date();
        d.setHours(field_value.hour);
        d.setMinutes(field_value.minute);
        field_value = d.toISOString();
      }

      if (field.type === "date") {
        const d = new Date();
        d.setUTCDate(field_value.day);
        d.setUTCMonth(field_value.month - 1);
        d.setUTCFullYear(field_value.year);
        field_value = d.toISOString();
      }

      if (field.type === "datetime") {
        const d = new Date(field_value);
        field_value = d.toISOString();
      }

      if (field.type === "gps") {
        if (this.coordinates[field.id]) {
          section_fields.push({
            fieldTitle: field.title,
            fieldId: fieldId,
            lat: this.coordinates[field.id].lat.toString(),
            lng: this.coordinates[field.id].lng.toString(),
            fieldType: field.type,
          });
        }
      } else {
        if (field.type !== "media") {
          section_fields.push({
            fieldTitle: field.title,
            fieldId: fieldId,
            fieldValue: field_value,
            fieldType: field.type,
          });
        }
      }
    }
  }

  submitForm() {
    const witnessAge = this.form.value.yqm8ny5d_1;

    if (this.form.value.hasOwnProperty("yqm8ny5d_1")) {
      if (witnessAge == "" || witnessAge == null) {
        alert("Please enter Witness age");
        return;
      } else {
        this.submitted = true;
        if (this.form.invalid) {
          Object.keys(this.form.controls).forEach((key) => {
            const controlErrors: ValidationErrors = this.form.get(key).errors;
            if (controlErrors != null) {
              Object.keys(controlErrors).forEach((keyError) => {});
            }
          });
          return;
        }
        const incident = {
          sections: [],
          anonymous: this.anonymous,
          incidentDate: new Date(),
        };

        if (this.assignedTo) {
          const assignmentType = "escalate";

          incident["assignedUserId"] = this.assignedTo;
          incident["assignmentType"] = assignmentType;
        }

        if (
          this.checkIncidentType !== "Electric Power" &&
          this.checkIncidentType !== "Equipment Solutions"
        ) {
          this.emails[0] = this.form.value["supervisor"];
          this.emails[1] = this.form.value["useremail"];
        }
        if (this.emails.length > 0) {
          incident["emails"] = this.emails;
        }

        for (const section of this.currentIncidentType.sections) {
          const section_fields = [];
          this.analyzeSection(section_fields, section);
          const damages = [];
          const injuries = [];
          const vehicles = [];
          const witnesses = [];
          if (section.type === "holder" && section.items) {
            for (const item of section.items) {
              const itemMedia = [];
              if (this.dropzones[item.id]) {
                for (const dropzoneItem of this.dropzones[item.id].data) {
                  const itemMediaItem = {
                    type: dropzoneItem.type,
                    label: "label",
                    uuid: dropzoneItem.uuid,
                  };

                  if ("overlayId" in dropzoneItem) {
                    itemMediaItem["overlayId"] = dropzoneItem["overlayId"];
                  }
                  itemMedia.push(itemMediaItem);
                }
              }

              if (item.title === section.damageTitle) {
                const damageFields = [];
                this.analyzeSection(damageFields, item);
                damages.push({
                  id: section.damageSection.id,
                  title: section.damageTitle,
                  fields: damageFields,
                  media: itemMedia,
                });
              }

              if (item.title === section.injuryTitle) {
                const injuryFields = [];
                this.analyzeSection(injuryFields, item);
                injuries.push({
                  id: section.injurySection.id,
                  title: section.injuryTitle,
                  fields: injuryFields,
                  media: itemMedia,
                });
              }

              if (item.title === section.vehicleTitle) {
                const vehicleFields = [];
                this.analyzeSection(vehicleFields, item);
                vehicles.push({
                  id: section.vehicleSection.id,
                  title: section.vehicleTitle,
                  fields: vehicleFields,
                  media: itemMedia,
                });
              }

              if (item.title === section.witnessTitle) {
                const witnessFields = [];
                this.analyzeSection(witnessFields, item);
                witnesses.push({
                  id: section.witnessSection.id,
                  title: section.witnessTitle,
                  fields: witnessFields,
                  media: itemMedia,
                });
              }
            }
          }

          const media = [];
          if (
            section.type === "media" ||
            section.type === "injury" ||
            section.type === "vehicle"
          ) {
            if (this.dropzones[section.id]) {
              for (const item of this.dropzones[section.id].data) {
                let label = "label";
                if ("path" in item) {
                  label = item.path.split("/").pop();
                }
                const mediaItem = {
                  type: item.type,
                  label: label,
                  uuid: item.uuid,
                };

                if ("overlayId" in item) {
                  mediaItem["overlayId"] = item["overlayId"];
                }
                media.push(mediaItem);
              }
            }
          }

          if (section.type === "injury") {
            if (!incident.sections[0]["injuries"]) {
              incident.sections[0]["injuries"] = [];
            }

            incident.sections[0]["injuries"].push({
              title: section.title,
              fields: section_fields,
              media: media,
            });
          } else if (section.type === "vehicle") {
            if (!incident.sections[0]["vehicles"]) {
              incident.sections[0]["vehicles"] = [];
            }

            incident.sections[0]["vehicles"].push({
              title: section.title,
              fields: section_fields,
              media: media,
            });
          } else {
            incident.sections.push({
              title: section.title,
              fields: section_fields,
              media: media,
              damages: damages,
              injuries: injuries,
              vehicles: vehicles,
              witnesses: witnesses,
            });
          }
        }
        let incidentDate = new Date();
        for (let value of this.form.value) {
          if (value.month) {
            incidentDate = new Date(value.year, value.month, value.day);
          }
        }
        this.submitted1 = true;
        // Ensure the user's company is not a demo company...
        this.companyService
          .getCompany(this.customerService.getUser().company.id)
          .subscribe(
            (r) => {
              if (r.data.isDemo) {
                if (!this.incident) {
                  this.router.navigateByUrl("/");
                } else {
                  this.router.navigateByUrl("/incidents/" + this.incident.id);
                }
              } else {
                // removing empty fields
                for (let i = 0; i < incident.sections.length; i++) {
                  // looping through incident sections
                  const fieldsArray = [];
                  for (let e = 0; e < incident.sections[i].fields.length; e++) {
                    // looping through incident section fields
                    if (
                      incident.sections[i].fields[e].fieldValue != null &&
                      incident.sections[i].fields[e].fieldValue !== "" &&
                      incident.sections[i].fields.length > 0
                    ) {
                      fieldsArray.push(incident.sections[i].fields[e]);
                    }

                    // if field is gps and has value also add that.
                    // if statement above does not cover this.

                    if (
                      incident.sections[i].fields[e].fieldType === "gps" &&
                      incident.sections[i].fields[e].lat !== "" &&
                      incident.sections[i].fields[e].lng !== ""
                    ) {
                      fieldsArray.push(incident.sections[i].fields[e]);
                    }
                    // if field is gps
                    // rebuild incident section fields without null ones
                  }
                  incident.sections[i].fields = fieldsArray;
                  // rebuild incident section without null fields
                }

                if (!this.incident) {
                  // create new incident
                  incident.incidentDate = incidentDate;

                  this.incidentService
                    .createIncident(this.currentIncidentType.id, incident)
                    .subscribe(
                      (resp) => {
                        if (this.currentIncidentType.submissionSuccessText) {
                          // @ts-ignore
                          swal.fire({
                            title: "Created",
                            icon: "success",
                            text:
                              this.currentIncidentType.submissionSuccessText !=
                              ""
                                ? "Submission Success"
                                : null,
                          });
                          this.router.navigateByUrl("/");
                        } else {
                          this.router.navigateByUrl("/");
                        }
                      },
                      (e) => {
                        this.router.navigateByUrl("/login");
                      }
                    );
                } else {
                  // edit incident
                  if (this.groupName === "Aon") {
                    const body = {
                      typeId: this.currentIncidentType.id,
                      companyId: this.customerService.getUser().company.id,
                      sections: incident.sections,
                      // userGroupId: this.groupName ==='Aon' ? '' :this.userGroupId,
                      incidentDate: incidentDate,
                    };
                    if (this.assignedTo) {
                      const assignmentType = "assign";
                      body["assignedUserId"] = this.assignedTo;
                      body["assignmentType"] = assignmentType;
                    }

                    this.incidentService
                      .editIncident(this.incident.id, body)
                      .subscribe(
                        (res) => {
                          this.router.navigateByUrl(
                            "/incidents/" + this.incident.id + "/edit/success"
                          );
                        },
                        (e) => {
                          this.router.navigateByUrl("/login");
                        }
                      );
                  } else {
                    const body = {
                      typeId: this.currentIncidentType.id,
                      companyId: this.customerService.getUser().company.id,
                      sections: incident.sections,
                      userGroupId: this.userGroupId,
                      incidentDate: incidentDate,
                    };
                    if (this.assignedTo) {
                      const assignmentType = "assign";
                      body["assignedUserId"] = this.assignedTo;
                      body["assignmentType"] = assignmentType;
                    }

                    this.incidentService
                      .editIncident(this.incident.id, body)
                      .subscribe(
                        (res) => {
                          this.router.navigateByUrl(
                            "/incidents/" + this.incident.id + "/edit/success"
                          );
                        },
                        (e) => {
                          this.router.navigateByUrl("/login");
                        }
                      );
                  }
                }
              }
            },
            (e) => {
              this.router.navigateByUrl("/login");
            }
          );
      }
    } else {
      this.submitted = true;
      if (this.form.invalid) {
        Object.keys(this.form.controls).forEach((key) => {
          const controlErrors: ValidationErrors = this.form.get(key).errors;
          if (controlErrors != null) {
            Object.keys(controlErrors).forEach((keyError) => {});
          }
        });
        return;
      }
      const incident = {
        sections: [],
        anonymous: this.anonymous,
        incidentDate: new Date(),
      };

      if (this.assignedTo) {
        const assignmentType = "escalate";

        incident["assignedUserId"] = this.assignedTo;
        incident["assignmentType"] = assignmentType;
      }

      if (
        this.checkIncidentType !== "Electric Power" &&
        this.checkIncidentType !== "Equipment Solutions"
      ) {
        this.emails[0] = this.form.value["supervisor"];
        this.emails[1] = this.form.value["useremail"];
      }
      if (this.emails.length > 0) {
        incident["emails"] = this.emails;
      }

      for (const section of this.currentIncidentType.sections) {
        const section_fields = [];
        this.analyzeSection(section_fields, section);
        const damages = [];
        const injuries = [];
        const vehicles = [];
        const witnesses = [];
        if (section.type === "holder" && section.items) {
          for (const item of section.items) {
            const itemMedia = [];
            if (this.dropzones[item.id]) {
              for (const dropzoneItem of this.dropzones[item.id].data) {
                const itemMediaItem = {
                  type: dropzoneItem.type,
                  label: "label",
                  uuid: dropzoneItem.uuid,
                };

                if ("overlayId" in dropzoneItem) {
                  itemMediaItem["overlayId"] = dropzoneItem["overlayId"];
                }
                itemMedia.push(itemMediaItem);
              }
            }

            if (item.title === section.damageTitle) {
              const damageFields = [];
              this.analyzeSection(damageFields, item);
              damages.push({
                id: section.damageSection.id,
                title: section.damageTitle,
                fields: damageFields,
                media: itemMedia,
              });
            }

            if (item.title === section.injuryTitle) {
              const injuryFields = [];
              this.analyzeSection(injuryFields, item);
              injuries.push({
                id: section.injurySection.id,
                title: section.injuryTitle,
                fields: injuryFields,
                media: itemMedia,
              });
            }

            if (item.title === section.vehicleTitle) {
              const vehicleFields = [];
              this.analyzeSection(vehicleFields, item);
              vehicles.push({
                id: section.vehicleSection.id,
                title: section.vehicleTitle,
                fields: vehicleFields,
                media: itemMedia,
              });
            }

            if (item.title === section.witnessTitle) {
              const witnessFields = [];
              this.analyzeSection(witnessFields, item);
              witnesses.push({
                id: section.witnessSection.id,
                title: section.witnessTitle,
                fields: witnessFields,
                media: itemMedia,
              });
            }
          }
        }

        const media = [];
        if (
          section.type === "media" ||
          section.type === "injury" ||
          section.type === "vehicle"
        ) {
          if (this.dropzones[section.id]) {
            for (const item of this.dropzones[section.id].data) {
              let label = "label";
              if ("path" in item) {
                label = item.path.split("/").pop();
              }
              const mediaItem = {
                type: item.type,
                label: label,
                uuid: item.uuid,
              };

              if ("overlayId" in item) {
                mediaItem["overlayId"] = item["overlayId"];
              }
              media.push(mediaItem);
            }
          }
        }

        if (section.type === "injury") {
          if (!incident.sections[0]["injuries"]) {
            incident.sections[0]["injuries"] = [];
          }

          incident.sections[0]["injuries"].push({
            title: section.title,
            fields: section_fields,
            media: media,
          });
        } else if (section.type === "vehicle") {
          if (!incident.sections[0]["vehicles"]) {
            incident.sections[0]["vehicles"] = [];
          }

          incident.sections[0]["vehicles"].push({
            title: section.title,
            fields: section_fields,
            media: media,
          });
        } else {
          incident.sections.push({
            title: section.title,
            fields: section_fields,
            media: media,
            damages: damages,
            injuries: injuries,
            vehicles: vehicles,
            witnesses: witnesses,
          });
        }
      }
      let incidentDate = new Date();
      for (let value of this.form.value) {
        if (value.month) {
          incidentDate = new Date(value.year, value.month, value.day);
        }
      }
      this.submitted1 = true;
      // Ensure the user's company is not a demo company...
      this.companyService
        .getCompany(this.customerService.getUser().company.id)
        .subscribe(
          (r) => {
            if (r.data.isDemo) {
              if (!this.incident) {
                this.router.navigateByUrl("/");
              } else {
                this.router.navigateByUrl("/incidents/" + this.incident.id);
              }
            } else {
              // removing empty fields
              for (let i = 0; i < incident.sections.length; i++) {
                // looping through incident sections
                const fieldsArray = [];
                for (let e = 0; e < incident.sections[i].fields.length; e++) {
                  // looping through incident section fields
                  if (
                    incident.sections[i].fields[e].fieldValue != null &&
                    incident.sections[i].fields[e].fieldValue !== "" &&
                    incident.sections[i].fields.length > 0
                  ) {
                    fieldsArray.push(incident.sections[i].fields[e]);
                  }

                  // if field is gps and has value also add that.
                  // if statement above does not cover this.

                  if (
                    incident.sections[i].fields[e].fieldType === "gps" &&
                    incident.sections[i].fields[e].lat !== "" &&
                    incident.sections[i].fields[e].lng !== ""
                  ) {
                    fieldsArray.push(incident.sections[i].fields[e]);
                  }
                  // if field is gps
                  // rebuild incident section fields without null ones
                }
                incident.sections[i].fields = fieldsArray;
                // rebuild incident section without null fields
              }

              if (!this.incident) {
                // create new incident
                incident.incidentDate = incidentDate;

                this.incidentService
                  .createIncident(this.currentIncidentType.id, incident)
                  .subscribe(
                    (resp) => {
                      if (this.currentIncidentType.submissionSuccessText) {
                        // @ts-ignore
                        swal.fire({
                          title: "Created",
                          icon: "success",
                          text:
                            this.currentIncidentType.submissionSuccessText != ""
                              ? "Submission Success"
                              : null,
                        });
                        this.router.navigateByUrl("/");
                      } else {
                        this.router.navigateByUrl("/");
                      }
                    },
                    (e) => {
                      this.router.navigateByUrl("/login");
                    }
                  );
              } else {
                // edit incident
                if (this.groupName === "Aon") {
                  const body = {
                    typeId: this.currentIncidentType.id,
                    companyId: this.customerService.getUser().company.id,
                    sections: incident.sections,
                    // userGroupId: this.groupName ==='Aon' ? '' :this.userGroupId,
                    incidentDate: incidentDate,
                  };
                  if (this.assignedTo) {
                    const assignmentType = "assign";
                    body["assignedUserId"] = this.assignedTo;
                    body["assignmentType"] = assignmentType;
                  }

                  this.incidentService
                    .editIncident(this.incident.id, body)
                    .subscribe(
                      (res) => {
                        this.router.navigateByUrl(
                          "/incidents/" + this.incident.id + "/edit/success"
                        );
                      },
                      (e) => {
                        this.router.navigateByUrl("/login");
                      }
                    );
                } else {
                  const body = {
                    typeId: this.currentIncidentType.id,
                    companyId: this.customerService.getUser().company.id,
                    sections: incident.sections,
                    userGroupId: this.userGroupId,
                    incidentDate: incidentDate,
                  };
                  if (this.assignedTo) {
                    const assignmentType = "assign";
                    body["assignedUserId"] = this.assignedTo;
                    body["assignmentType"] = assignmentType;
                  }

                  this.incidentService
                    .editIncident(this.incident.id, body)
                    .subscribe(
                      (res) => {
                        this.router.navigateByUrl(
                          "/incidents/" + this.incident.id + "/edit/success"
                        );
                      },
                      (e) => {
                        this.router.navigateByUrl("/login");
                      }
                    );
                }
              }
            }
          },
          (e) => {
            this.router.navigateByUrl("/login");
          }
        );
    }
  }

  // TEST BKP 20230411

  // submitForm() {

  //   this.submitted = true;
  //   if (this.form.invalid) {
  //     Object.keys(this.form.controls).forEach((key) => {
  //       const controlErrors: ValidationErrors = this.form.get(key).errors;
  //       if (controlErrors != null) {
  //         Object.keys(controlErrors).forEach((keyError) => {});
  //       }
  //     });
  //     return;
  //   }
  //   const incident = {
  //     sections: [],
  //     anonymous: this.anonymous,
  //     incidentDate: new Date(),
  //   };

  //   if (this.assignedTo) {
  //     const assignmentType = "escalate";

  //     incident["assignedUserId"] = this.assignedTo;
  //     incident["assignmentType"] = assignmentType;
  //   }

  //   if (
  //     this.checkIncidentType !== "Electric Power" &&
  //     this.checkIncidentType !== "Equipment Solutions"
  //   ) {
  //     this.emails[0] = this.form.value["supervisor"];
  //     this.emails[1] = this.form.value["useremail"];
  //   }
  //   if (this.emails.length > 0) {
  //     incident["emails"] = this.emails;
  //   }

  //   for (const section of this.currentIncidentType.sections) {
  //     const section_fields = [];
  //     this.analyzeSection(section_fields, section);
  //     const damages = [];
  //     const injuries = [];
  //     const vehicles = [];
  //     const witnesses = [];
  //     if (section.type === "holder" && section.items) {
  //       for (const item of section.items) {
  //         const itemMedia = [];
  //         if (this.dropzones[item.id]) {
  //           for (const dropzoneItem of this.dropzones[item.id].data) {
  //             const itemMediaItem = {
  //               type: dropzoneItem.type,
  //               label: "label",
  //               uuid: dropzoneItem.uuid,
  //             };

  //             if ("overlayId" in dropzoneItem) {
  //               itemMediaItem["overlayId"] = dropzoneItem["overlayId"];
  //             }
  //             itemMedia.push(itemMediaItem);
  //           }
  //         }

  //         if (item.title === section.damageTitle) {
  //           const damageFields = [];
  //           this.analyzeSection(damageFields, item);
  //           damages.push({
  //             id: section.damageSection.id,
  //             title: section.damageTitle,
  //             fields: damageFields,
  //             media: itemMedia,
  //           });
  //         }

  //         if (item.title === section.injuryTitle) {
  //           const injuryFields = [];
  //           this.analyzeSection(injuryFields, item);
  //           injuries.push({
  //             id: section.injurySection.id,
  //             title: section.injuryTitle,
  //             fields: injuryFields,
  //             media: itemMedia,
  //           });
  //         }

  //         if (item.title === section.vehicleTitle) {
  //           const vehicleFields = [];
  //           this.analyzeSection(vehicleFields, item);
  //           vehicles.push({
  //             id: section.vehicleSection.id,
  //             title: section.vehicleTitle,
  //             fields: vehicleFields,
  //             media: itemMedia,
  //           });
  //         }

  //         if (item.title === section.witnessTitle) {
  //           const witnessFields = [];
  //           this.analyzeSection(witnessFields, item);
  //           witnesses.push({
  //             id: section.witnessSection.id,
  //             title: section.witnessTitle,
  //             fields: witnessFields,
  //             media: itemMedia,
  //           });
  //         }
  //       }
  //     }

  //     const media = [];
  //     if (
  //       section.type === "media" ||
  //       section.type === "injury" ||
  //       section.type === "vehicle"
  //     ) {
  //       if (this.dropzones[section.id]) {
  //         for (const item of this.dropzones[section.id].data) {
  //           let label = "label";
  //           if ("path" in item) {
  //             label = item.path.split("/").pop();
  //           }
  //           const mediaItem = {
  //             type: item.type,
  //             label: label,
  //             uuid: item.uuid,
  //           };

  //           if ("overlayId" in item) {
  //             mediaItem["overlayId"] = item["overlayId"];
  //           }
  //           media.push(mediaItem);
  //         }
  //       }
  //     }

  //     if (section.type === "injury") {
  //       if (!incident.sections[0]["injuries"]) {
  //         incident.sections[0]["injuries"] = [];
  //       }

  //       incident.sections[0]["injuries"].push({
  //         title: section.title,
  //         fields: section_fields,
  //         media: media,
  //       });
  //     } else if (section.type === "vehicle") {
  //       if (!incident.sections[0]["vehicles"]) {
  //         incident.sections[0]["vehicles"] = [];
  //       }

  //       incident.sections[0]["vehicles"].push({
  //         title: section.title,
  //         fields: section_fields,
  //         media: media,
  //       });
  //     } else {
  //       incident.sections.push({
  //         title: section.title,
  //         fields: section_fields,
  //         media: media,
  //         damages: damages,
  //         injuries: injuries,
  //         vehicles: vehicles,
  //         witnesses: witnesses,
  //       });
  //     }
  //   }
  //   let incidentDate = new Date();
  //   for (let value of this.form.value) {
  //     if (value.month) {
  //       incidentDate = new Date(value.year, value.month, value.day);
  //     }
  //   }
  //   this.submitted1 = true;
  //   // Ensure the user's company is not a demo company...
  //   this.companyService
  //     .getCompany(this.customerService.getUser().company.id)
  //     .subscribe(
  //       (r) => {
  //         if (r.data.isDemo) {
  //           if (!this.incident) {
  //             this.router.navigateByUrl("/");
  //           } else {
  //             this.router.navigateByUrl("/incidents/" + this.incident.id);
  //           }
  //         } else {
  //           // removing empty fields
  //           for (let i = 0; i < incident.sections.length; i++) {
  //             // looping through incident sections
  //             const fieldsArray = [];
  //             for (let e = 0; e < incident.sections[i].fields.length; e++) {
  //               // looping through incident section fields
  //               if (
  //                 incident.sections[i].fields[e].fieldValue != null &&
  //                 incident.sections[i].fields[e].fieldValue !== "" &&
  //                 incident.sections[i].fields.length > 0
  //               ) {
  //                 fieldsArray.push(incident.sections[i].fields[e]);
  //               }

  //               // if field is gps and has value also add that.
  //               // if statement above does not cover this.

  //               if (
  //                 incident.sections[i].fields[e].fieldType === "gps" &&
  //                 incident.sections[i].fields[e].lat !== "" &&
  //                 incident.sections[i].fields[e].lng !== ""
  //               ) {
  //                 fieldsArray.push(incident.sections[i].fields[e]);
  //               }
  //               // if field is gps
  //               // rebuild incident section fields without null ones
  //             }
  //             incident.sections[i].fields = fieldsArray;
  //             // rebuild incident section without null fields
  //           }

  //           if (!this.incident) {
  //             // create new incident
  //             incident.incidentDate = incidentDate;

  //             this.incidentService
  //               .createIncident(this.currentIncidentType.id, incident)
  //               .subscribe(
  //                 (resp) => {
  //                   if (this.currentIncidentType.submissionSuccessText) {
  //                     // @ts-ignore
  //                     swal.fire({
  //                       title: "Created",
  //                       icon: "success",
  //                       text:
  //                         this.currentIncidentType.submissionSuccessText != ""
  //                           ? "Submission Success"
  //                           : null,
  //                     });
  //                     this.router.navigateByUrl("/");
  //                   } else {
  //                     this.router.navigateByUrl("/");
  //                   }
  //                 },
  //                 (e) => {
  //                   this.router.navigateByUrl("/login");
  //                 }
  //               );
  //           } else {
  //             // edit incident
  //             if (this.groupName === "Aon") {
  //               const body = {
  //                 typeId: this.currentIncidentType.id,
  //                 companyId: this.customerService.getUser().company.id,
  //                 sections: incident.sections,
  //                 // userGroupId: this.groupName ==='Aon' ? '' :this.userGroupId,
  //                 incidentDate: incidentDate,
  //               };
  //               if (this.assignedTo) {
  //                 const assignmentType = "assign";
  //                 body["assignedUserId"] = this.assignedTo;
  //                 body["assignmentType"] = assignmentType;
  //               }

  //               this.incidentService
  //                 .editIncident(this.incident.id, body)
  //                 .subscribe(
  //                   (res) => {
  //                     this.router.navigateByUrl(
  //                       "/incidents/" + this.incident.id + "/edit/success"
  //                     );
  //                   },
  //                   (e) => {
  //                     this.router.navigateByUrl("/login");
  //                   }
  //                 );
  //             } else {
  //               const body = {
  //                 typeId: this.currentIncidentType.id,
  //                 companyId: this.customerService.getUser().company.id,
  //                 sections: incident.sections,
  //                 userGroupId: this.userGroupId,
  //                 incidentDate: incidentDate,
  //               };
  //               if (this.assignedTo) {
  //                 const assignmentType = "assign";
  //                 body["assignedUserId"] = this.assignedTo;
  //                 body["assignmentType"] = assignmentType;
  //               }

  //               this.incidentService
  //                 .editIncident(this.incident.id, body)
  //                 .subscribe(
  //                   (res) => {
  //                     this.router.navigateByUrl(
  //                       "/incidents/" + this.incident.id + "/edit/success"
  //                     );
  //                   },
  //                   (e) => {
  //                     this.router.navigateByUrl("/login");
  //                   }
  //                 );
  //             }
  //           }
  //         }
  //       },
  //       (e) => {
  //         this.router.navigateByUrl("/login");
  //       }
  //     );
  // }

  // DROPZONES
  initDropzones() {
    for (const section of this.currentIncidentType.sections) {
      this.initDropzonesForSection(section);
    }
  }

  initDropzonesForSection(section: any) {
    if (section.type === "media") {
      const config: DropzoneConfigInterface = {
        url: this.endpoint + "media",
        paramName: "media",
        uploadMultiple: null,
        maxFiles: 1,
        headers: {
          Authorization: "Bearer " + this.customerService.getToken(),
          "Cache-Control": "",
          "X-Requested-With": "",
        },
      };
      this.dropzones[section.id] = {
        config: config,
        data: [],
      };
      this.dropSectionId = section.id;
    } else if (
      section.type === "injury" ||
      section.type === "vehicle" ||
      section.type == "damage"
    ) {
      const config: DropzoneConfigInterface = {
        url: this.endpoint + "media",
        paramName: "media",
        headers: {
          Authorization: "Bearer " + this.customerService.getToken(),
          "Cache-Control": "",
          "X-Requested-With": "",
        },
      };
      this.dropzones[section.id] = {
        config: config,
        data: [],
      };
    }
  }

  onUploadSuccess(args: any, sectionId: string) {
    const data = args[1].data;
    if (data.type == "image") {
      this.drawImageUrl = data.path;
      this.drawImagepopup = true;
      this.dropSectionId = sectionId;

      if (args[0].height > args[0].width) {
        const ratio = args[0].height / 500;
        this.drawimageHeight = args[0].height / ratio;
        this.drawimageWidth = args[0].width / ratio;
      } else {
        const ratio = args[0].width / 500;
        this.drawimageHeight = args[0].height / ratio;
        this.drawimageWidth = args[0].width / ratio;
      }

      for (const dropzone of this.directiveRef.toArray()) {
        const dropzoneObject = dropzone.dropzone();
        const dropzoneSectionId = dropzoneObject.element.id.split("-")[1];
        dropzoneObject.removeFile(args[0]);
      }
    } else {
      this.dropzones[sectionId].data.push(data);
    }
  }

  onUploadError(args: any, sectionId: string) {
    if (args[1] && args[1].error) {
      swal.fire({
        title: "Oops...",
        icon: "error",
        text: args[1].error,
      });
    }

    for (const dropzone of this.directiveRef.toArray()) {
      const dropzoneObject = dropzone.dropzone();
      const dropzoneSectionId = dropzoneObject.element.id.split("-")[1];
      if (sectionId == dropzoneSectionId) {
        dropzoneObject.removeFile(args[0]);
      }
    }
  }

  checkParentfield(fieldId = null) {
    return this.form.controls[fieldId].value == "Yes";
  }

  searchCompanyUsers(term) {
    this.assignedTo = "";
    if (term) {
      this.companyService.searchCompanyUsers(term).subscribe(
        (response) => {
          this.options = [];
          const users = response.data;
          users.forEach((user, index) => {
            const userData = {
              name: user.firstName + " " + user.lastName,
              email: user.email,
              value: user.id,
            };
            this.options.push(userData);
            this.filteredOptions = this.mysearchControl.valueChanges.pipe(
              startWith(""),
              map((value) => (typeof value === "string" ? value : value.name)),
              map((name) => (name ? this._filter(name) : this.options.slice()))
            );
          });
        },
        (e) => {}
      );
    }
  }

  selectedAsignedoption(option) {
    this.assignedTo = option.value;
  }

  timechange(fieldId) {
    const value = this.form.controls[fieldId].value;
    const selectedTimeInsec = this.getTimeintoseconds(
      value["hour"],
      value["minute"],
      value["second"]
    );
    const date = new Date();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const currentTimeInsec = this.getTimeintoseconds(hours, minutes, seconds);
    if (this.currentDaydatepicker) {
      if (selectedTimeInsec > currentTimeInsec) {
        value["hour"] = hours;
        value["minute"] = minutes;
        this.form.controls[fieldId].setValue(value);
      }
    }
  }

  datechange(fieldId) {
    const selectedDate = this.form.controls[fieldId].value;
    this.currentDaydatepicker = false;
    const selectedDay = parseInt(selectedDate.day);
    const selectedMonth = parseInt(selectedDate.month);
    const selectedYear = parseInt(selectedDate.year);
    const today = new Date();
    const currentDay = parseInt(String(today.getDate()).padStart(2, "0"));
    const currentMonth = parseInt(
      String(today.getMonth() + 1).padStart(2, "0")
    );
    const currentYear = today.getFullYear();

    if (
      selectedDay == currentDay &&
      selectedMonth == currentMonth &&
      selectedYear == currentYear
    ) {
      this.currentDaydatepicker = true;
      if (this.timeFieldId) {
        const value = {
          hour: today.getHours(),
          minute: today.getMinutes(),
        };
        this.form.controls[this.timeFieldId].setValue(value);
      }
    }
  }

  getTimeintoseconds(hours, minutes, seconds) {
    const hoursIntoSec = hours * 60 * 60;
    const minutesTosec = minutes * 60;
    return hoursIntoSec + minutesTosec + seconds;
  }

  saveImage(event) {
    this.drawImagepopup = false;
    const apiUrl = this.endpoint + "media";
    const headers = {
      Authorization: "Bearer " + this.customerService.getToken(),
      "Cache-Control": "",
      "X-Requested-With": "",
    };
    const url = this.endpoint + "media";
    const formdata = new FormData();
    const file = new File([event], "my_image.jpg");
    formdata.append("media", file);
    this.http
      .post(`${apiUrl}`, formdata, { headers: headers })
      .subscribe((res) => {
        this.mediaSrc[res["data"].uuid] =
          this.sanitizerService.bypassSecurityTrustUrl(res["data"].path);
        this.dropzones[this.dropSectionId].data.push(res["data"]);
        this.drawImageUrl = "";
      });
  }

  cancelImage() {
    this.drawImageUrl = "";
    this.drawImagepopup = false;
  }

  previewImage(event) {
    const imgElem = event.target;
    var target = event.target || event.srcElement || event.currentTarget;
    var srcAttr = target.attributes.src;
    this.imgSrc = srcAttr.nodeValue;
  }
  delete(uuid: any) {
    this.dropzones[this.dropSectionId].data = this.dropzones[
      this.dropSectionId
    ].data.filter(function (obj) {
      return obj.uuid !== uuid;
    });
  }
}
