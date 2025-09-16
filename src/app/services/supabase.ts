import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, AuthError, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Supabase {
  public supabase: SupabaseClient;
  

  constructor() {
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
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw new Error(this.mapAuthError(error));
    } catch (err) {
      console.error('Error en logout:', err);
      throw new Error('No se pudo cerrar sesión.');
    }
  }

  async getCurrentUser() {
    const { data } = await this.supabase.auth.getUser();
    return data.user;
  }

  // Registro de nuevo usuario (solo email y password)
  async registrarUsuario(email: string, password: string) {
    return await this.supabase.auth.signUp({ email, password });
  }

  // Insertar nuevo usuario
  async insertarUsuario(usuario: any) {
    return await this.supabase.from('usuarios').insert([usuario]);
  }

  
  // Traducir errores de Supabase a mensajes más claros
  private mapAuthError(error: AuthError): string {
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

