import { GetQueryInterface } from '../get-query.interface';

export interface UserInterface {
  id: string;
  email: string;
  profileImage: string;
  firstName: string;
  lastName: string;
  roq_user_id: string;
  tenant_id: string;
}

export interface UserGetQueryInterface extends GetQueryInterface {
  roq_user_id?: string;
  tenant_id?: string;
  email?:string
}
