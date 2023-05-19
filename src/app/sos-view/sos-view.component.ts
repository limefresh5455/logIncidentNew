import { Component, ElementRef, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CustomerService } from '../_services/customer.service';
import { User } from '../_models/user';
import { HttpClient } from "@angular/common/http";
import { ActivatedRoute, Router } from '@angular/router';
import { SosService } from '../_services/sos.service';
import { IncidentsService } from '../_services/incidents.service';
import { MapsService } from '../_services/maps.service';
import { MediaService } from '../_services/media.service';
import { DomSanitizer } from '@angular/platform-browser';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-sos-view',
  templateUrl: './sos-view.component.html',
  styleUrls: ['./sos-view.component.css']
})
export class SosViewComponent implements OnInit {

  sosView = true;
  currentUser: User;
  companyColor = null;
  logo = "./assets/Finning_Logo.jpg";

  sosData;
  sosUsers: any = [];
  sosReport: any = [];
  sosDetails: any = [];
  sosAddress: any = [];
  ratingCount: any = [];
  sosDataSection: any = [];
  totalCount;
  incidentId;
  sosTitle;
  sosValue: boolean = false;
  incidentLocation = null;
  whats3words = null;
  mediaSrc = {};
  sectionsMedia = {}; // this might be used for pdf generation.
  preViewImg = '';
  preViewType = '';
  closeResult: string;

  constructor(
    private customerService: CustomerService,
    private httpClient: HttpClient,
    private route: ActivatedRoute,
    private sosService: SosService,
    private router: Router,
    private incidentService: IncidentsService,
    private mapsService: MapsService,
    private changeDetectorRef: ChangeDetectorRef,
    private mediaService: MediaService,
    private sanitizerService: DomSanitizer,
    private modalService: NgbModal,
  ) {
    this.currentUser = this.customerService.getUser();
    this.companyColor = this.currentUser.company.primary;
  }

  ngOnInit() {
    this.incidentService.getIncidentTypes().subscribe(
      r => {
        if (r.data) {
          for (var i = 0; i <= r.data.length; i++) {
            if (r.data[i]) {
              if (r.data[i].name == "Safe on Site") {
                this.sosValue = true;
              }
            }
          }
        }
        if (this.sosValue) {
          this.loadSosView()
        } else {
          this.router.navigateByUrl('/404');
        }
      }
    )
  }

  //load sos-view data
  loadSosView() {
    //get sos param id for sos view
    const id = this.route.snapshot.paramMap.get('id');
    //get sos data by param sos id
    this.incidentService.getIncidentTypes().subscribe(
      r => {
        if (r.data) {
          for (var i = 0; i <= r.data.length; i++) {
            if (r.data[i]) {
              if (r.data[i].name == "Safe on Site") {
                this.incidentId = r.data[i].id;
                this.sosTitle = r.data[i].name;
                this.sosService.getSoSIncidentsById(this.incidentId).subscribe(
                  res => {
                    this.sosData = res.data;
                    for (const sos of this.sosData) {
                      if (sos.id == id) {
                        this.sosUsers = sos.user;
                        console.log(this.sosUsers)
                        this.sosReport = sos.sosdata.report;
                        this.sosAddress = sos.sosdata.location;
                        this.sosDataSection = sos.sosdata.sections;
                        for (const section of sos.sosdata.sections) {
                          for (const rate of section.subsection) {
                            this.ratingCount.push(rate);
                          }
                        }
                      }
                    }
                    this.totalCount = this.ratingCount.reduce((acc, val) => acc += val.rating, 0);
                  }, e => {
                    this.router.navigateByUrl('/login');
                  }
                );
              }
            }
          }
        }
      });
    this.getIncidentLocation();
    this.downloadHolderItemImages();
  }

  //get sos media by sos id
  downloadHolderItemImages() {
    const id = this.route.snapshot.paramMap.get('id');
    this.incidentService.getIncidentTypes().subscribe(r => {
      if (r.data) {
        for (var i = 0; i <= r.data.length; i++) {
          if (r.data[i]) {
            if (r.data[i].name == "Safe on Site") {
              this.incidentId = r.data[i].id;
              this.sosService.getSoSIncidentsById(this.incidentId).subscribe(
                res => {
                  this.sosData = res.data;
                  for (const sos of this.sosData) {
                    if (sos.id == id) {
                      for (const section of sos.sosdata.sections) {
                        for (const section1 of section.subsection) {
                          if (section1.media) {
                            this.analyzeSectionMedia(section1);
                          }
                        }
                      }
                    }
                  }
                }
              );
            }
          }
        }
      }
    });
  }

  //get sos media blob url
  analyzeSectionMedia(item) {
    if (item.media && item.media.length > 0) {
      const overlayIds = [];

      for (const mediaItem of item.media) {
        if (mediaItem.overlayId) {
          overlayIds.push(mediaItem.overlayId);
        }
      }
      for (const mediaItem of item.media) {
        if (!(overlayIds.includes(mediaItem.uuid))) {
          this.mediaService.getMedia(mediaItem.uuid).subscribe(r => {
            if (mediaItem.type === 'overlay') {
              if (!(item.title in this.sectionsMedia)) {
                this.sectionsMedia[item.title] = [];
              }
              this.sectionsMedia[item.title].push(r);
            }
            const url = window.URL.createObjectURL(r);
            this.mediaSrc[mediaItem.uuid] = this.sanitizerService.bypassSecurityTrustUrl(url);
          });
        }
      }
    }
  }

  //check media uuid by mediaSrc
  hasMediaSrc(uuid) {
    return uuid in this.mediaSrc;
  }

  //get incident location by location lat and lng
  getIncidentLocation() {
    const id = this.route.snapshot.paramMap.get('id');
    this.incidentService.getIncidentTypes().subscribe(r => {
      if (r.data) {
        for (var i = 0; i <= r.data.length; i++) {
          if (r.data[i]) {
            if (r.data[i].name == "Safe on Site") {
              this.incidentId = r.data[i].id;
              this.sosService.getSoSIncidentsById(this.incidentId).subscribe(res => {
                this.sosData = res.data;
                for (const section of this.sosData) {
                  if (section.id == id) {
                    this.sosAddress = section.sosdata.location;
                    if (this.sosAddress.fieldType === 'gps') {
                      this.mapsService.getGeoLocation(this.sosAddress.lat, this.sosAddress.lng).subscribe(r => {
                        this.incidentLocation = r[0].formatted_address;
                        this.changeDetectorRef.detectChanges();
                      }, e => {
                        // console.log(e);
                      });
                      this.mapsService.getWhats3words(this.sosAddress.lat, this.sosAddress.lng).subscribe(response => {
                        if (response && response.words) {
                          this.whats3words = response.words;
                          this.changeDetectorRef.detectChanges();
                        }
                      });
                    }
                  }
                }
              });
            }
          }
        }
      }
    });

  }

  //download media onclick any image video and audio
  getMedia(attachment, previewImage) {
    const uuid = attachment.uuid;
    this.preViewType = attachment.type;
    this.preViewImg = this.mediaSrc[uuid];
    this.mediaService.getMedia(uuid).subscribe(r => {
      this.modalService.open(previewImage, { ariaLabelledBy: 'modal-basic-title' }).result.then((result) => {
        this.closeResult = `Closed with: ${result}`;
      }, (reason) => {
        this.closeResult = `Dismissed`;
      });
      const url = window.URL.createObjectURL(r);
      const a = document.createElement('a');
      document.body.appendChild(a);
      a.setAttribute('style', 'display: none');
      a.href = url;
      a.download = attachment.label;
      // a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    });
  }

  //for get total count of ratings by section name
  getTotalRating(value) {
    const id = this.route.snapshot.paramMap.get('id');
    for (const sos of this.sosData) {
      if (sos.id == id) {
        for (const section of sos.sosdata.sections) {
          if (section.name === value) {
            return section.subsection.reduce((acc, val) => acc += val.rating, 0);
          }
        }
      }
    }
  }

}




