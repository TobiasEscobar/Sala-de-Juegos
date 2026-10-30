/**
 * Representa la entidad de Usuario en la aplicación.
 * Todos los nombres de variables, métodos y tipos están en inglés.
 */
export class User {
    constructor(
        private _id: number,
        private _userId: string | number,
        private _name: string,
        private _email: string,
        private _age: number
    ) {}

    // Getters y Setters en inglés
    get id(): number {
        return this._id;
    }

    set id(value: number) {
        this._id = value;
    }

    get userId(): string | number {
        return this._userId;
    }

    set userId(value: string | number) {
        this._userId = value;
    }

    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
    }

    get email(): string {
        return this._email;
    }

    set email(value: string) {
        this._email = value;
    }

    get age(): number {
        return this._age;
    }

    set age(value: number) {
        this._age = value;
    }

    // Aliases de compatibilidad hacia atrás con el código existente en español
    get id_usuario(): number {
        return this._id;
    }

    set id_usuario(value: number) {
        this._id = value;
    }

    get user_id(): string | number {
        return this._userId;
    }

    set user_id(value: string | number) {
        this._userId = value;
    }

    get nombre(): string {
        return this._name;
    }

    set nombre(value: string) {
        this._name = value;
    }

    get edad(): number {
        return this._age;
    }

    set edad(value: number) {
        this._age = value;
    }
}
