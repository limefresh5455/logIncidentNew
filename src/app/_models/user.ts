import {Company} from './company';

export class User {
  code: string;
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  admin: boolean;
  company: Company;
  isDashboardViewOnly: boolean;
  isManager: boolean;
  isRestrictedAdmin: boolean;
  isProjectManager: boolean;
  canViewConcern: any;
}
