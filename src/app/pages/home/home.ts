import { Component, OnInit, ChangeDetectorRef  } from '@angular/core';
import { AuthService } from '../../services/auth';
import { User } from '../../clases/user';
import { Subscription } from 'rxjs';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  isLogged : boolean = false;
  currentUser: User | null = null;
  private authSub!: Subscription;
  
  constructor(private supabaseAuth: AuthService, private cdr: ChangeDetectorRef){
    this.authSub = this.supabaseAuth.isLoggedIn$.subscribe(logged =>{
      this.isLogged = logged;;
    })
  }

  ngOnInit(): void {
    this.supabaseAuth.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  
  }
  
}
