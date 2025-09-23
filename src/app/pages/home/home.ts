import { Component, OnInit  } from '@angular/core';
import { AuthService } from '../../services/auth';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { User } from '../../clases/user';
import { Chat } from '../../components/chat/chat';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, Chat],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  isLogged : boolean = false;
  currentUser: User | null = null;
  mostrarChat = false;

  constructor(private router: Router, private supabaseAuth: AuthService) {}
  
  ngOnInit(): void {
    this.supabaseAuth.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    this.supabaseAuth.isLoggedIn$.subscribe(logged =>{
      this.isLogged = logged;;
    });
  }

  toggleChat() {
    this.mostrarChat = !this.mostrarChat;
  }

  dirigirAJuegos(str: string) {
    this.router.navigate([str]);
  }

  dirigirARankings(str: string){
    this.router.navigate([str]);
  }

  dirigirALogin() {
    this.router.navigate(['/login']);
  }

}
