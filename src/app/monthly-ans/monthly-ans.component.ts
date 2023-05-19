import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {CustomerService} from '../_services/customer.service';
import {User} from '../_models/user';
import { HttpClient } from "@angular/common/http";
import {ActivatedRoute, Router} from '@angular/router';
import {MmtService} from '../_services/mmt.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {MediaService} from '../_services/media.service';
import {DomSanitizer} from '@angular/platform-browser';
import {IncidentsService} from '../_services/incidents.service';

@Component({
  selector: 'app-monthly-ans',
  templateUrl: './monthly-ans.component.html',
  styleUrls: ['./monthly-ans.component.css']
})
export class MonthlyAnsComponent implements OnInit {

  monthlyAnsView = true;
  currentUser: User;
  mTourColor = null;
  mmtQuestionLists;
  completedBy: string;
  overdueDate: string;
  completedDate: string;
  issuedDate: string;
  branchName;
  branchList: any = [];
  closeResult: string;
  mediaLists;
  mediaShowHide:boolean = null;
  mediaName:string = "";
  loading: boolean = true;
  mediaSrc = {};
  incidentId;
  typeName;
  auditTypes = "Managers Tour";
  notesForNo;
  mediaColumn: boolean = false;

  constructor(
    private customerService: CustomerService,
    private httpClient: HttpClient,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private mmtService: MmtService,
    private mediaService: MediaService,
    private sanitizerService: DomSanitizer,
    private incidentService: IncidentsService,
  ) {
    const currentUser = this.customerService.getUser();
    this.mTourColor = currentUser.company.primary;
  }

  ngOnInit() {
    //get param branch id and incident id
    const typeId = this.route.snapshot.paramMap.get('tid');
    const branchId = this.route.snapshot.paramMap.get('bid');
    const id = this.route.snapshot.paramMap.get('id');

    //for show different incident type in answer page
    if(typeId === "monthly-tour"){
      this.typeName = "Monthly Tour";
      this.auditTypes = "Managers Tour";
    }else if(typeId === "audits"){
      this.typeName = "Audits";
      this.auditTypes = "Audits";
    }

    //get all monthly tour answer data from api
    this.mmtService.getNewMmtquestion(id).subscribe(resp => {
      this.overdueDate = resp.data.data.sections[0].overdueDate;
      this.completedDate = resp.data.createdAt;
      this.issuedDate = resp.data.data.sections[0].reportDate;
      this.branchName = resp.data.data.sections[0].branch_name;
      this.mmtQuestionLists = resp.data.data.sections[0].questions_answer;
      const imagesMovies = [];
      for (const ans of this.mmtQuestionLists) {
        if(ans.media){
          for (const media of ans.media) {
            if(media != undefined){
              if(media.type == "image"){
                imagesMovies.push(media);
              }else if(media.type == "video"){
                imagesMovies.push(media);
              }
            }
          }
          if(imagesMovies.length > 0){
            this.mediaColumn = true;
          }else{
            this.mediaColumn = false;
          }
        }else if(ans.answer == "no"){
          this.mediaColumn = true;
        }
      }
    });

    //get completes user name by id from api
    this.incidentService.getIncidentTypes().subscribe(r => {
      if(r.data){
        for(var i = 0; i <= r.data.length; i++){
          if(r.data[i]){
            if(r.data[i].name == this.auditTypes){
              this.incidentId = r.data[i].id;
              this.mmtService.getMonthlyTours(this.incidentId).subscribe(resp => {
                this.branchList = resp.data;
                for (const mmtqs of this.branchList) {
                  if(branchId == mmtqs.id){
                    this.completedBy = mmtqs.branchauditor.firstName+' '+mmtqs.branchauditor.lastName;
                  }
                }
              });
            }
          }
        }
      }
    });

  }

  //for get media image by question pk id
  getMediaImageByQues(quesPk){
    const images = [];
    for (const ans of this.mmtQuestionLists) {
      if(quesPk == ans.id){
        if(ans.media){
          for (const media of ans.media) {
            if(media != undefined){
              if(media.type == "image"){
                images.push(media);
              }
            }
          }
          if(images.length > 0){
            return true;
          }else{
            return false;
          }
        }
      }
    }
  }

  // //for get media movie by question pk id
  getMediaMovieByQues(quesPk){
    const movies = [];
    for (const ans of this.mmtQuestionLists) {
      if(quesPk == ans.id){
        if(ans.media){
          for (const media of ans.media) {
            if(media != undefined){
              if(media.type == "video"){
                movies.push(media);
              }
            }
          }
          if(movies.length > 0){
            return true;
          }else{
            return false;
          }
        }
      }
    }
  }

  //for get list of media images and movies onclick icons open modal popup
  openAnswerMediaModal(content, quesPk, mediaTypes) {
    const imagesMovie = [];
    for (const ans of this.mmtQuestionLists) {
      if(quesPk == ans.id){
        if(ans.media){
          for (const media of ans.media) {
            if(mediaTypes == "images"){
              if(media != undefined){
                if(media.type == "image"){
                  imagesMovie.push(media);
                  this.mediaService.getMedia(media.uuid).subscribe(r => {
                    const url = window.URL.createObjectURL(r);
                    this.mediaSrc[media.uuid] = this.sanitizerService.bypassSecurityTrustUrl(url);
                  });
                  this.mediaShowHide = true;
                  this.mediaName = "Images";
                }else if(media.type == "note"){
                  imagesMovie.push(media);
                }
              }
            }else if(mediaTypes == "movies"){
              if(media != undefined){
                imagesMovie.push(media);
                this.mediaService.getMedia(media.uuid).subscribe(r => {
                  const url = window.URL.createObjectURL(r);
                  this.mediaSrc[media.uuid] = this.sanitizerService.bypassSecurityTrustUrl(url);
                });
                this.mediaShowHide = false;
                this.mediaName = "Movies";
              }
            }
          }
        }
      }
    }
    this.loading = true;
    setTimeout(()=>{
      this.loading = false;
      this.mediaLists = imagesMovie;
    },1000);
    this.modalService.open(content, {size: 'lg', ariaLabelledBy: 'modal-basic-title'}).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.closeResult = `Dismissed`;
    });
  }

  //for get notes of no answers onclick icons open modal popup
  openAnswerNotesModal(notesContent, quesPk) {
    for (const ans of this.mmtQuestionLists) {
      if(quesPk == ans.id){
          this.notesForNo = ans.note;
      }
    }
    this.loading = true;
    setTimeout(()=>{
      this.loading = false;
      this.notesForNo = this.notesForNo;
    },1000);
    this.modalService.open(notesContent, {size: 'sm', ariaLabelledBy: 'modal-basic-title'}).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.closeResult = `Dismissed`;
    });
  }

  //check media uuid by mediaSrc
  hasMediaSrc(uuid) {
    return uuid in this.mediaSrc;
  }

}




