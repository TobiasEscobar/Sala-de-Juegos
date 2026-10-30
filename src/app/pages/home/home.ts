import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { User } from '../../clases/user';
import { Chat } from '../../components/chat/chat';

/**
 * Interfaz que define los datos para las tarjetas de juego.
 */
export interface GameCard {
  id: string;
  title: string;
  category: string;
  badge: string;
  description: string;
  image: string;
  route: string;
  features: string[];
  accentColor: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, Chat],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  isLogged: boolean = false;
  currentUser: User | null = null;
  mostrarChat: boolean = false;

  // Lista de juegos clásicos sin emojis
  classicGames: GameCard[] = [
    {
      id: 'ahorcado',
      title: 'Ahorcado',
      category: 'Palabras & Ingenio',
      badge: 'Clásico',
      description: 'Descubre la palabra oculta letra por letra antes de que se agoten tus vidas o el temporizador.',
      image: 'juego1.png',
      route: '/ahorcado',
      features: ['60 Segundos', '3 Intentos', '+50 pts por palabra'],
      accentColor: '#ff007f'
    },
    {
      id: 'mayor-o-menor',
      title: 'Mayor o Menor',
      category: 'Cartas & Probabilidad',
      badge: 'Popular',
      description: 'Anticípate y adivina si la siguiente carta de la baraja española será mayor o menor a la actual.',
      image: 'juego2.png',
      route: '/mayor-o-menor',
      features: ['Baraja Española', 'Racha de Aciertos', 'Ranking Competitivo'],
      accentColor: '#00f2fe'
    },
    {
      id: 'preguntados',
      title: 'Preguntados',
      category: 'Trivia & Cultura General',
      badge: 'Desafío',
      description: 'Demuestra cuánto sabes en una ronda de preguntas de múltiple opción contrarreloj.',
      image: 'juego3.png',
      route: '/preguntados',
      features: ['Cultura General', 'Contrarreloj', 'Tabla de Líderes'],
      accentColor: '#ffb703'
    }
  ];

  // Juego especial destacado sin emojis
  featuredGame: GameCard = {
    id: '1024',
    title: '1024 Puzzle',
    category: 'Estrategia & Lógica Matemática',
    badge: 'Juego Destacado',
    description: 'Desplaza y combina números iguales para duplicar su valor. ¿Podrás alcanzar la mítica ficha 1024 antes de quedarte sin movimientos?',
    image: 'juego-propio.png',
    route: '/1024',
    features: ['Puzzle Estratégico', 'Alta Dificultad', 'Récord de Puntuación'],
    accentColor: '#a100ff'
  };

  constructor(
    private router: Router,
    private supabaseAuth: AuthService
  ) {}

  ngOnInit(): void {
    // Suscripción al usuario actual
    this.supabaseAuth.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });

    // Suscripción al estado de autenticación
    this.supabaseAuth.isLoggedIn$.subscribe((logged) => {
      this.isLogged = logged;
    });
  }

  // Control explícito del estado del chat
  openChat(): void {
    this.mostrarChat = true;
  }

  closeChat(): void {
    this.mostrarChat = false;
  }

  toggleChat(): void {
    this.mostrarChat = !this.mostrarChat;
  }

  // Navegación
  navigateToGame(route: string): void {
    this.router.navigate([route]);
  }

  navigateToRankings(): void {
    this.router.navigate(['/rankings']);
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  navigateToRegister(): void {
    this.router.navigate(['/registro']);
  }
}
