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
      environment.SUPABASE_URL, environment.SUPABASE_ANON_KEY
      ,{
      auth: {
        persistSession: true,
        storage // no queda guardado entre sesiones
        } 
      }
    );
  }

  
  async login(email: string, password: string) {
    /**
     * Intenta iniciar sesión con email y contraseña usando Supabase.
     * Si Supabase devuelve un error se transforma a un mensaje más claro
     * mediante `mapAuthError` y se lanza como excepción.
     * @param email Correo del usuario
     * @param password Contraseña del usuario
     * @returns Los datos de la respuesta de Supabase (incluye session/user)
     * @throws Error con mensaje amigable si ocurre un problema de autenticación
     */
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Lanzamos un error con mensaje más claro
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
     * Si ocurre un error lo transforma a un mensaje legible y lanza excepción.
     * @throws Error si no se pudo cerrar la sesión
     */
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw new Error(this.mapAuthError(error));
    } catch (err) {
      console.error('Error en logout:', err);
      throw new Error('No se pudo cerrar sesión.');
    }
  }

  async getCurrentUser() {
    /**
     * Obtiene el usuario actualmente autenticado desde Supabase.
     * @returns El objeto `user` si hay sesión activa, o `null` si no la hay.
     */
    const { data } = await this.supabase.auth.getUser();
    return data.user;
  }

  // Registro de nuevo usuario (solo email y password)
  async registrarUsuario(email: string, password: string) {
    /**
     * Registra un nuevo usuario en Supabase (solo email + password).
     * Nota: esto crea la cuenta en el sistema de autenticación de Supabase,
     * no inserta datos adicionales en la tabla `usuarios`.
     * @param email Correo a registrar
     * @param password Contraseña para la cuenta
     * @returns La respuesta de signUp de Supabase
     */
    return await this.supabase.auth.signUp({ email, password });
  }

  // Insertar nuevo usuario
  async insertarUsuario(usuario: any) {
    /**
     * Inserta un objeto `usuario` en la tabla `usuarios` de la base de datos.
     * Usar este método para guardar información adicional (nombre, id_usuario,
     * etc.) asociada al user de autenticación.
     * @param usuario Objeto con los campos a insertar en la tabla `usuarios`
     * @returns La respuesta del insert de Supabase
     */
    return await this.supabase.from('usuarios').insert([usuario]);
  }

  insertarPuntos(usuario: string){
    return console.log(usuario);
  }

  // Traducir errores de Supabase a mensajes más claros
  private mapAuthError(error: AuthError): string {
    /**
     * Traduce errores de autenticación de Supabase a mensajes en español
     * más amigables para mostrar en la UI.
     * - Recibe el objeto `AuthError` y devuelve una cadena legible.
     * @param error Error de Supabase
     * @returns Mensaje legible en español
     */
    switch (error.message) {
      case 'Invalid login credentials':
        return 'El correo y/o la contraseña son incorrectos.';
      case 'Email not confirmed':
        return 'Debes confirmar tu correo antes de iniciar sesión.';
      case 'missing email or phone':
        return 'Complete todos los campos antes de ingresar'
      case 'User already registered':
      case 'duplicate key value violates unique constraint "users_email_key"':
        return 'El correo ya está registrado. Intente con otro.';
      default:
        return 'Error de autenticación: ' + error.message;
    }
  }
}

