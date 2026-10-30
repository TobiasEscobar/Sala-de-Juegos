import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, AuthError, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Supabase {
  public supabase: SupabaseClient;

  constructor() {
    /**
     * Inicializa el cliente de Supabase con la URL y la clave anónima
     * configuradas en `environment`. También configura el almacenamiento
     * de sesión para que use `sessionStorage` cuando haya `window`.
     * - persistSession: true -> mantiene la sesión durante la vida de la pestaña
     * - storage: sessionStorage -> no queda guardado entre sesiones del navegador
     */
    const storage = typeof window !== 'undefined' ? window.sessionStorage : undefined;

    this.supabase = createClient(
      environment.SUPABASE_URL,
      environment.SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          storage
        }
      }
    );
  }

  async login(email: string, password: string) {
    /**
     * Intenta iniciar sesión con email y contraseña usando Supabase.
     */
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(this.mapAuthError(error));
      }

      return data;
    } catch (err: any) {
      console.error('Error en login:', err);
      throw new Error(this.mapAuthError(err));
    }
  }

  async logout() {
    /**
     * Cierra la sesión del usuario en Supabase.
     */
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw new Error(this.mapAuthError(error));
    } catch (err) {
      console.error('Error en logout:', err);
      throw new Error('No se pudo cerrar sesión.');
    }
  }

  async getCurrentUser(): Promise<User | null> {
    /**
     * Obtiene el usuario actualmente autenticado desde Supabase.
     */
    const { data } = await this.supabase.auth.getUser();
    return data.user;
  }

  // Registro de nuevo usuario (solo email y password)
  async registrarUsuario(email: string, password: string) {
    /**
     * Registra un nuevo usuario en Supabase (solo email + password).
     */
    return await this.supabase.auth.signUp({ email, password });
  }

  // Insertar nuevo usuario en la tabla 'usuarios'
  async insertarUsuario(usuario: any) {
    return await this.supabase.from('usuarios').insert([usuario]);
  }

  insertarPuntos(usuario: string) {
    return console.log(usuario);
  }

  /**
   * Traduce errores de autenticación de Supabase a mensajes amigables en español.
   * Maneja errores de rate limit (429), usuario ya existente (400), contraseñas cortas, etc.
   */
  public mapAuthError(error: any): string {
    if (!error) return 'Ocurrió un error inesperado de autenticación.';

    const message = (error.message || '').toString();
    const status = error.status || error.statusCode || 0;

    // Error 429: Rate limit de Supabase Auth
    if (
      status === 429 ||
      message.toLowerCase().includes('rate limit') ||
      message.toLowerCase().includes('too many requests') ||
      message.includes('once every') ||
      message.includes('over_email_send_rate_limit')
    ) {
      return 'Demasiados intentos seguidos. Por seguridad de la plataforma, por favor espera 60 segundos antes de volver a intentar registrarte.';
    }

    // Error 400: Usuario ya registrado
    if (
      message.toLowerCase().includes('user already registered') ||
      message.toLowerCase().includes('already registered') ||
      message.toLowerCase().includes('already exists')
    ) {
      return 'Este correo electrónico ya está registrado. Por favor inicia sesión o utiliza otro correo.';
    }

    // Error 400: Contraseña no cumple políticas
    if (message.toLowerCase().includes('password should be') || message.toLowerCase().includes('weak password')) {
      return 'La contraseña es demasiado débil o no cumple los requisitos (mínimo 6 caracteres).';
    }

    // Error 400: Registro no permitido
    if (message.toLowerCase().includes('signups not allowed')) {
      return 'El registro de nuevos usuarios está deshabilitado temporalmente en este servidor.';
    }

    switch (message) {
      case 'Invalid login credentials':
        return 'El correo y/o la contraseña son incorrectos.';
      case 'Email not confirmed':
        return 'Debes confirmar tu correo electrónico antes de iniciar sesión.';
      case 'missing email or phone':
        return 'Por favor completa todos los campos obligatorios antes de continuar.';
      case 'duplicate key value violates unique constraint "users_email_key"':
        return 'El correo ya está registrado en la base de datos. Intenta con otro.';
      default:
        return 'Aviso de autenticación: ' + message;
    }
  }
}
