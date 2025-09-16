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
    this.checkChange();
    }

    async loadUserFromSession() {
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
          const user = new User(userInfo.id_usuario, userInfo.userId, userInfo.nombre, userInfo.email);
          this.currentUserSubject.next(user);
        }
      }
    }
  
      getCurrentUser(): User | null {
      return this.currentUserSubject.value;
    }
  

  private async checkChange(){
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
    const data = await this.supabaseService.login(email, password); // <-- usa tu wrapper
    await this.loadUserFromSession(); // actualizar currentUserSubject
    return data;
  }

  async signUp(email: string, password: string) {
    return await this.supabaseService.supabase.auth.signUp({ email, password });
  }

  async getUser()
  {
    const { data} = await this.supabaseService.supabase.auth.getUser();
    return {data}
  }

  async signOut() {
    const { error } = await this.supabaseService.supabase.auth.signOut();

    if (!error) {
      this._isLoggedIn.next(false);
      this.currentUserSubject.next(null);
    }

    return { error };
  }

  async getSession() {
    return this.supabaseService.supabase.auth.getSession();
  }
}
