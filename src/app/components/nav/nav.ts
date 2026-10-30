import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { User } from '../../clases/user';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './nav.html',
  styleUrl: './nav.css'
})
export class Nav implements OnInit {
  isLoggedIn: boolean = false;
  currentUser: User | null = null;
  isMenuOpen: boolean = false;

  constructor(private authService: AuthService) {}

  // Aliases de compatibilidad hacia atrás
  get isLogged(): boolean {
    return this.isLoggedIn;
  }

  set isLogged(value: boolean) {
    this.isLoggedIn = value;
  }

  get menuAbierto(): boolean {
    return this.isMenuOpen;
  }

  set menuAbierto(value: boolean) {
    this.isMenuOpen = value;
  }

  ngOnInit(): void {
    // Suscripción al estado de autenticación
    this.authService.isLoggedIn$.subscribe((status) => {
      this.isLoggedIn = status;
    });

    // Suscripción al usuario actualmente autenticado
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  cerrarMenu(): void {
    this.closeMenu();
  }

  async logout(): Promise<void> {
    this.closeMenu();
    await this.authService.signOut();
  }
}
