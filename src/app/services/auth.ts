import { Injectable } from '@angular/core';

import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { Supabase } from './supabase';
import { User } from '../clases/user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private _isLoggedIn = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  isLoggedIn$ = this._isLoggedIn.asObservable();
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private supabaseService:Supabase, private router:Router) { 
    /**
     * AuthService constructor
     * @param supabaseService Wrapper para las llamadas a Supabase
     * @param router Router de Angular para navegar según el estado de auth
     * Inicializa la escucha de cambios de sesión para mantener el estado
     * de autenticación en la aplicación.
     */
    this.checkChange();
    }

    async loadUserFromSession() {
      /**
       * Carga la información del usuario asociado a la sesión actual.
       * - Consulta a Supabase para obtener el user desde auth.
       * - Si existe, busca en la tabla `usuarios` los datos adicionales
       *   (por ejemplo nombre, id_usuario) y actualiza `currentUserSubject`.
       * Manejo de errores: registra en consola y retorna si falla la consulta.
       */
      const { data: sessionData } = await this.supabaseService.supabase.auth.getUser();

      if (sessionData?.user) {
        const id = sessionData.user.id;
        const { data: userInfo, error } = await this.supabaseService.supabase
          .from('usuarios')
          .select('*')
          .eq('user_id', id)
          .single();
        
        if (error) {
          console.error('Error al cargar usuario:', error);
          return;
        }

        if (userInfo) {
          const user = new User(userInfo.id_usuario, userInfo.userId, userInfo.nombre, userInfo.email, userInfo.edad);
          this.currentUserSubject.next(user);
        }
      }
    }
  
      getCurrentUser(): User | null {
      /**
       * Devuelve el usuario actual (sincrónico) si ya fue cargado.
       * @returns Instancia de `User` o `null` si no hay usuario.
       */
      return this.currentUserSubject.value;
    }
  

  private async checkChange(){
    /**
     * Registra un listener para cambios en el estado de autenticación.
     * - Cuando hay sesión, marca `_isLoggedIn` como true y carga el usuario.
     * - Cuando no hay sesión, marca `_isLoggedIn` como false.
     */
    this.supabaseService.supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        this._isLoggedIn.next(true);
        this.loadUserFromSession();
      } else {
        this._isLoggedIn.next(false);
      }
    });
  }

  async login(email: string, password: string) {
    /**
     * Inicia sesión usando el wrapper `Supabase.login`.
     * - Si el login es exitoso, intenta cargar la información del usuario
     *   desde la sesión y actualiza `currentUserSubject`.
     * @param email Correo del usuario
     * @param password Contraseña
     * @returns La respuesta del wrapper de Supabase (session/user)
     */
    const data = await this.supabaseService.login(email, password); // <-- usa tu wrapper
    await this.loadUserFromSession(); // actualizar currentUserSubject
    return data;
  }

  async signUp(email: string, password: string) {
    /**
     * Registra un usuario nuevo en Supabase (autenticación).
     * Esto únicamente crea la cuenta en el sistema de auth. 
     * @param email Correo a registrar
     * @param password Contraseña
     * @returns La respuesta del signUp de Supabase
     */
    return await this.supabaseService.supabase.auth.signUp({ email, password });
  }

  async getUser() {
    /**
     * Obtiene el objeto `user` desde Supabase (envuelto en la respuesta `data`).
     * Usado por código que necesita la estructura completa retornada por Supabase.
     * @returns Objeto con la propiedad `data` que contiene `user`.
     */
    const { data } = await this.supabaseService.supabase.auth.getUser();
    return { data };
  }

  async signOut() {
    /**
     * Cierra la sesión del usuario en Supabase y limpia el estado local.
     * - Actualiza `_isLoggedIn` y `currentUserSubject` cuando la salida es
     *   exitosa.
     * @returns Objeto con `error` si ocurrió algún problema.
     */
    const { error } = await this.supabaseService.supabase.auth.signOut();

    if (!error) {
      this._isLoggedIn.next(false);
      this.currentUserSubject.next(null);
    }

    return { error };
  }

  async getSession() {
    /**
     * Devuelve la promesa con la sesión actual desde Supabase.
     * @returns Promesa con la información de la sesión (access token, user, etc.)
     */
    return this.supabaseService.supabase.auth.getSession();
  }
}
