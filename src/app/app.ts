import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Nav } from './components/nav/nav';
import { Footer } from './components/footer/footer';

import { AuthService } from './services/auth';
import { User } from './clases/user';
import { Subscription } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Nav, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  isLogged: boolean = false;
  currentUser: User | null = null;

  private authSub!: Subscription;
  private userSub!: Subscription;

  constructor(private authService: AuthService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.authSub = this.authService.isLoggedIn$.subscribe(logged => {
      this.isLogged = logged;
      this.cdr.detectChanges();
    });

    this.userSub = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
    this.userSub?.unsubscribe();
  }
}
