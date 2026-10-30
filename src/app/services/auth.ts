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

  constructor(private supabaseService: Supabase, private router: Router) {
    /**
     * Constructor de AuthService.
     * Inicializa la escucha de cambios de sesión para mantener el estado
     * de autenticación en la aplicación.
     */
    this.checkChange();
  }

  async loadUserFromSession(): Promise<User | null> {
    /**
     * Carga la información del usuario asociado a la sesión actual.
     * - Consulta a Supabase para obtener el usuario de autenticación.
     * - Si existe, busca en la tabla `usuarios` los datos adicionales (nombre, id, edad).
     * - Si la consulta a la tabla `usuarios` falla o no tiene registros, genera un usuario
     *   de respaldo con los datos de auth para no bloquear funciones como el chat.
     */
    const { data: sessionData } = await this.supabaseService.supabase.auth.getUser();

    if (sessionData?.user) {
      const authUserId = sessionData.user.id;
      const { data: userInfo, error } = await this.supabaseService.supabase
        .from('usuarios')
        .select('*')
        .eq('user_id', authUserId)
        .single();

      if (error) {
        console.warn('No se encontraron datos en tabla usuarios o hubo un error:', error.message);
        const fallbackEmail = sessionData.user.email || '';
        const fallbackName = sessionData.user.user_metadata?.['nombre'] || fallbackEmail.split('@')[0] || 'Usuario';
        const fallbackUser = new User(0, authUserId, fallbackName, fallbackEmail, 0);
        this.currentUserSubject.next(fallbackUser);
        return fallbackUser;
      }

      if (userInfo) {
        const userDbId = userInfo.id ?? userInfo.id_usuario ?? 0;
        const userId = userInfo.user_id ?? userInfo.userId ?? authUserId;
        const userName = userInfo.nombre?.trim() || sessionData.user.user_metadata?.['nombre'] || userInfo.email?.split('@')[0] || 'Usuario';
        const userEmail = userInfo.email || sessionData.user.email || '';
        const userAge = userInfo.edad ?? 0;

        const user = new User(userDbId, userId, userName, userEmail, userAge);
        this.currentUserSubject.next(user);
        return user;
      }
    }

    return null;
  }

  getCurrentUser(): User | null {
    /**
     * Devuelve el usuario actual (sincrónico) si ya fue cargado.
     * @returns Instancia de `User` o `null` si no hay usuario.
     */
    return this.currentUserSubject.value;
  }

  private async checkChange(): Promise<void> {
    /**
     * Registra un listener para cambios en el estado de autenticación.
     * - Cuando hay sesión, marca `_isLoggedIn` como true y carga el usuario.
     * - Cuando no hay sesión, marca `_isLoggedIn` como false y limpia el usuario.
     */
    this.supabaseService.supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        this._isLoggedIn.next(true);
        this.loadUserFromSession();
      } else {
        this._isLoggedIn.next(false);
        this.currentUserSubject.next(null);
      }
    });
  }

  async login(email: string, password: string) {
    /**
     * Inicia sesión usando el wrapper `Supabase.login`.
     * - Si el login es exitoso, intenta cargar la información del usuario
     *   desde la sesión y actualiza `currentUserSubject`.
     */
    const data = await this.supabaseService.login(email, password);
    await this.loadUserFromSession();
    return data;
  }

  async signUp(email: string, password: string) {
    /**
     * Registra un usuario nuevo en Supabase (autenticación).
     * Esto únicamente crea la cuenta en el sistema de auth.
     */
    return await this.supabaseService.supabase.auth.signUp({ email, password });
  }

  async getUser() {
    /**
     * Obtiene el objeto `user` desde Supabase (envuelto en la respuesta `data`).
     */
    const { data } = await this.supabaseService.supabase.auth.getUser();
    return { data };
  }

  async signOut() {
    /**
     * Cierra la sesión del usuario en Supabase y limpia el estado local.
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
     */
    return this.supabaseService.supabase.auth.getSession();
  }
}
