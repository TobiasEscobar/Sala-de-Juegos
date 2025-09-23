export class User {
    constructor(
        private _id: number,
        private _user_id: number,
        private _nombre: string,
        private _email: string,
        private _edad: number
        ) {}
    
    get id_usuario(): number {
        return this._id;
    }

    set id_usuario(value: number) {
        this._id = value;
    }

    get userId(): number {
        return this._user_id;
    }

    set userId(value: number) {
        this._user_id = value;
    }

    get nombre(): string {
        return this._nombre;
    }

    set nombre(value: string) {
        this._nombre = value;
    }

    get email(): string {
        return this._email;
    }

    set email(value: string) {
        this._email = value;
    }

    get edad(): number {
        return this._edad;
    }

    set edad(value: number) {
        this._edad = value;
    }

}
