export class UserAccount {
    id: string;
    name: string;
    address: string;
    phoneNumber: string;
    enable: boolean;
    isDriver: boolean;

    constructor(
        id: string,
        name: string,
        address: string,
        phoneNumber: string,
        enable: boolean,
        isDriver: boolean
    ) {
        this.id = id;
        this.name = name;
        this.address = address;
        this.phoneNumber = phoneNumber;
        this.enable = enable;
        this.isDriver = isDriver;
    }
}
