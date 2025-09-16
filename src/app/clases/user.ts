export class User {
    constructor(
        private _id: number,
        private _userId: number,
        private _nombre: string,
        private _email: string
        ) {}
    
    get id_usuario(): number {
        return this._id;
    }

    set id_usuario(value: number) {
        this._id = value;
    }

    get userId(): number {
        return this._userId;
    }

    set userId(value: number) {
        this._userId = value;
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
}
