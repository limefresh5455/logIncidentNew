import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {LoginComponent} from './login/login.component';
import {PasswordResetComponent} from './password-reset/password-reset.component';
import {DashboardComponent} from './dashboard/dashboard.component';
import {ActionSeverityComponent} from './action-severity/action-severity.component';
import {NeedAuthGuard} from './need-auth-guard';
import {MainComponent} from './main/main.component';
import {CreateIncidentComponent} from './create-incident/create-incident.component';
import {ViewIncidentComponent} from './view-incident/view-incident.component';
import {CompanyViewComponent} from './company-view/company-view.component';
import {ExportComponent} from './export/export.component';
import {MediaComponent} from './media/media.component';
import {ProfileComponent} from './profile/profile.component';
import {SosComponent} from './sos/sos.component';
import {SosViewComponent} from './sos-view/sos-view.component';
import {AuditsAdminComponent} from './audits-admin/audits-admin.component';
import {UsersComponent} from './users/users.component';
import {AddEditUsersComponent} from './add-edit-users/add-edit-users.component';
import {BusinessUnitsComponent} from './business-units/business-units.component';
import {CreateAuditsComponent} from './create-audits/create-audits.component';
import {UpdateAuditsComponent} from './update-audits/update-audits.component';
import {ActionsViewComponent} from './actions-view/actions-view.component';
import {NotFoundComponent} from './not-found/not-found.component';
import {SearchComponent} from './search/search.component';
import {SearchTagsComponent} from './searchTags/searchTags.component';
import {MonthlyAnsComponent} from './monthly-ans/monthly-ans.component';
import {FutureMmtComponent} from './future-mmt/future-mmt.component';
import {FutureAesComponent} from './future-aes/future-aes.component';
import {MmtComponent} from './mmt/mmt.component';
import { UsersDetailResolver } from "./add-edit-users/users-detail.resolver";
import {QrComponent} from './qr/qr.component';
import { Sif } from './SIF/sif.component';
import { CIFComponent } from './CIF Reports/cif/cif.component';
// import {CIFComponent} from './SIF/IF.component'
const routes: Routes = [
  {path: '', redirectTo: 'dashboard', pathMatch: 'full'},
  {path: 'qr', component: QrComponent},
  {
    path: '', component: MainComponent, canActivate: [NeedAuthGuard], children: [
      {path: 'dashboard', component: DashboardComponent},
      {path: 'action-age-severity', component: ActionSeverityComponent},
      {path: 'create-incident', component: CreateIncidentComponent},
      {path: 'incidents/:id/edit/:success', component: ViewIncidentComponent},
      {path: 'incidents/:id/edit', component: CreateIncidentComponent},
      {path: 'incidents/:id', component: ViewIncidentComponent},
      {path: 'my-view', component: CompanyViewComponent},
      {path: 'search', component: SearchComponent},
      {path: 'searchTags', component: SearchTagsComponent},
      {path: 'assigned', component: CompanyViewComponent},
      {path: 'company-view', component: CompanyViewComponent},
      {path: 'company-view/:id', component: CompanyViewComponent},
      {path: 'export', component: ExportComponent},
      {path: 'media/:uuid', component: MediaComponent},
      {path: 'profile', component: ProfileComponent},
      {path: 'sos', component: SosComponent},
      {path: 'sos/view/:id', component: SosViewComponent},
      {path: 'mmt/:id', component: MmtComponent},
      {path: 'answers/:tid/:bid/:id', component: MonthlyAnsComponent},
      {path: 'audits-admin', component: AuditsAdminComponent},
      {path: 'create-audits', component: CreateAuditsComponent},
      {path: 'edit-audits/:id', component: UpdateAuditsComponent},
      {path: 'actions-view/:id', component: ActionsViewComponent},
      {path: 'future-mmt', component: FutureMmtComponent},
      {path: 'future-aes', component: FutureAesComponent},
      {path: 'users', component: UsersComponent},
      {path: 'add-users', component: AddEditUsersComponent},
      {path: 'edit-users/:id', component: AddEditUsersComponent, resolve: { usersDetail: UsersDetailResolver }},
      {path: 'business-units', component: BusinessUnitsComponent},
      {path: 'Sif', component: Sif},
      {path: 'CIFComponent', component:  CIFComponent},

      // {path:'cif',component:CIFComponent},
      {path: '404', component: NotFoundComponent},
    ]
  },

  {path: 'login', component: LoginComponent},
  {path: 'password-reset', component: PasswordResetComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}

