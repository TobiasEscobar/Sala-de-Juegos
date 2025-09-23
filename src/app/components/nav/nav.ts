import { Component, OnInit  } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { User } from '../../clases/user';

@Component({
  selector: 'app-nav',
  imports: [RouterLink],
  templateUrl: './nav.html',
  styleUrl: './nav.css'
})
export class Nav implements OnInit {
  isLogged : boolean = false;
  currentUser: User | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Suscribirse al estado de login
    this.authService.isLoggedIn$.subscribe(status => this.isLogged = status);

    // Suscribirse al usuario actual
    this.authService.currentUser$.subscribe(user => this.currentUser = user);
  }

  logout() {
    this.authService.signOut();
  }
}
