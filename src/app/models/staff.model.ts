export interface StaffAccount {
  id: string;
  name: string;
  email: string;
  areaId?: string | null;
  role: string;
  enabled: boolean;
}

export interface CreateStaffRequest {
  name: string;
  email: string;
  password: string;
  areaId?: string | null;
  role: string;
}
