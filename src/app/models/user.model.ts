export interface DukanzUser {
  id: string;
  PartitionKey?: string;
  name: string;
  address: string;
  phoneNumber: string;
  enable: boolean;
  isDriver: boolean;
  email?: string;
}
