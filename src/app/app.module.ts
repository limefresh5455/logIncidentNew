import {BrowserModule} from '@angular/platform-browser';
import {NgModule, LOCALE_ID} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {ErrorHandler} from '@angular/core';
import 'hammerjs';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {ConnectionServiceModule} from 'ngx-connection-service';

import {MatCardModule} from '@angular/material/card';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {LoginComponent} from './login/login.component';
import {PasswordResetComponent} from './password-reset/password-reset.component';
import {DashboardComponent} from './dashboard/dashboard.component';
import {ActionSeverityComponent} from './action-severity/action-severity.component';
import {NeedAuthGuard} from './need-auth-guard';
import {MainComponent} from './main/main.component';
import {ErrorsHandler} from './error-handlers';
import {ServerErrorsInterceptor} from './server-errors.interceptor';
import {CreateIncidentComponent} from './create-incident/create-incident.component';
import {
  MatDatepickerModule,
  MatNativeDateModule,
  MatFormFieldModule,
  MatInputModule,
  MatChipsModule,
  MatIconModule,
  MatDialogModule,
  MatButtonModule
} from '@angular/material';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {DlDateTimePickerDateModule} from 'angular-bootstrap-datetimepicker';
import {OwlDateTimeModule, OwlNativeDateTimeModule} from 'ng-pick-datetime';
import {GooglePlaceModule} from 'ngx-google-places-autocomplete';
import {ViewIncidentComponent} from './view-incident/view-incident.component';
import {CompanyViewComponent} from './company-view/company-view.component';
import {AgmCoreModule} from '@agm/core';
import {DropzoneModule} from 'ngx-dropzone-wrapper';
import {CreateChartDirective} from './_directives/create-chart.directive';
import {NgbdSortableHeader} from './_directives/sortable.directive';
import {Ng5SliderModule} from 'ng5-slider';
import {ExportComponent} from './export/export.component';
import {MediaComponent} from './media/media.component';
import {NgxMatDrpModule} from 'ngx-mat-daterange-picker';
import {ProfileComponent} from './profile/profile.component';
import {SosComponent} from './sos/sos.component';
import {SosViewComponent} from './sos-view/sos-view.component';
import {MmtComponent} from './mmt/mmt.component';
import {AuditsAdminComponent} from './audits-admin/audits-admin.component';
import {UsersComponent} from './users/users.component';
import {AddEditUsersComponent} from './add-edit-users/add-edit-users.component';
import {BusinessUnitsComponent} from './business-units/business-units.component';
import {CreateAuditsComponent} from './create-audits/create-audits.component';
import {UpdateAuditsComponent} from './update-audits/update-audits.component';
import {ActionsComponent} from './actions/actions.component';
import {ActionsViewComponent} from './actions-view/actions-view.component';
import {MonthlyTourComponent} from './monthly-tour/monthly-tour.component';
import {AuditsComponent} from './audits/audits.component';
import {MonthlyAnsComponent} from './monthly-ans/monthly-ans.component';
import {QuestionPoolComponent} from './question-pool/question-pool.component';
import {QuestionPoolAeComponent} from './question-pool-ae/question-pool-ae.component';
import {FutureMmtComponent} from './future-mmt/future-mmt.component';
import {FutureAesComponent} from './future-aes/future-aes.component';
import {NotFoundComponent} from './not-found/not-found.component';
import {NgxAudioPlayerModule} from 'ngx-audio-player';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {ImageDrawingModule} from 'ngx-image-drawing';
import {NgCircleProgressModule} from 'ng-circle-progress';
import {SearchComponent} from './search/search.component';
import {SearchTagsComponent} from './searchTags/searchTags.component';
import {NgxDropzoneModule} from 'ngx-dropzone';
import {MatSelectModule} from '@angular/material/select';
import {HighlightPipe} from './highlight.pipe';
import {FilteruniquevaluePipe} from './filteruniquevalue.pipe';
import {ConfirmDialogComponent} from './confirm-dialog/confirm-dialog.component';
import {RemoveSpaceDirective} from './_directives/remove-space.directive';
import {UsersDetailResolver} from './add-edit-users/users-detail.resolver';
import {NgApexchartsModule} from 'ng-apexcharts';
import {NoSpacesPipe} from './pipes/no-spaces.pipe';
import {NgxPaginationModule} from 'ngx-pagination';
import { Sif } from './SIF/sif.component';
// import { QRCodeModule } from 'angularx-qrcode';
import {QrComponent} from './qr/qr.component';
import { CIFComponent } from './CIF Reports/cif/cif.component';
// import { NgxQRCodeModule } from 'ngx-qrcode2';
// import { CIFComponent } from './CIF/CIF.component';
@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    PasswordResetComponent,
    DashboardComponent,
    ActionSeverityComponent,
    MainComponent,
    CreateIncidentComponent,
    ViewIncidentComponent,
    CompanyViewComponent,
    CreateChartDirective,
    ExportComponent,
    MediaComponent,
    ProfileComponent,
    SosComponent,
    NgbdSortableHeader,
    SosViewComponent,
    MmtComponent,
    AuditsAdminComponent,
    CreateAuditsComponent,
    UpdateAuditsComponent,
    ActionsComponent,
    ActionsViewComponent,
    MonthlyTourComponent,
    AuditsComponent,
    MonthlyAnsComponent,
    QuestionPoolComponent,
    QuestionPoolAeComponent,
    FutureMmtComponent,
    FutureAesComponent,
    NotFoundComponent,
    SearchComponent,
    SearchTagsComponent,
    HighlightPipe,
    FilteruniquevaluePipe,
    ConfirmDialogComponent,
    UsersComponent,
    AddEditUsersComponent,
    BusinessUnitsComponent,
    RemoveSpaceDirective,
    NoSpacesPipe,
    QrComponent,
    Sif,
    CIFComponent,
    // CIFComponent
   ],
  imports: [
    // NgxQRCodeModule,
    NgApexchartsModule,
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    BrowserAnimationsModule,
    NgbModule,
    DlDateTimePickerDateModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    GooglePlaceModule,
    MatSnackBarModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyCRXGWOgA2YojI9JQXSpt-MMol4bimzEuk',
    }),
    DropzoneModule,
    Ng5SliderModule,
    NgxMatDrpModule,
    MatTooltipModule,
    MatCardModule,
    NgxAudioPlayerModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule,
    ImageDrawingModule,
    ConnectionServiceModule,
    NgCircleProgressModule.forRoot({
      // set defaults here
      radius: 100,
      outerStrokeWidth: 16,
      innerStrokeWidth: 8,
      outerStrokeColor: '#ffffff',
      innerStrokeColor: '#ffffff',
      animationDuration: 100,
    }),
    MatChipsModule,
    MatIconModule,
    NgxDropzoneModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatDialogModule,
    MatButtonModule,
    NgxPaginationModule,
    // QRCodeModule
  ],
  entryComponents: [
    ConfirmDialogComponent
  ],
  providers: [
    NeedAuthGuard,
    MatDatepickerModule,
    MatFormFieldModule,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ServerErrorsInterceptor,
      multi: true,
    }, {provide: LOCALE_ID, useValue: 'en-GB'},
    UsersDetailResolver
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
