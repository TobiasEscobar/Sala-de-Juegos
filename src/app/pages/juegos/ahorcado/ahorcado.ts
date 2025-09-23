import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { AuthService } from '../../../services/auth';
import { JuegosService } from '../../../services/juegosService';
import { User } from '../../../clases/user';
import { interval, BehaviorSubject, Subscription } from 'rxjs';

import { JuegosDialog } from '../../../dialogs/juegos-dialog/juegos-dialog';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ahorcado',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ahorcado.html',
  styleUrl: './ahorcado.css'
})
export class Ahorcado implements OnInit, OnDestroy {
  //Letras y palabras
  letras: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'Ñ', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
  listaPalabras: string[] = ['computadora', 'musica', 'guitarra', 'descubrimiento', 'gato', 'desplazamiento', 'enfocado', 'agua', 
    'perro', 'montaña', 'codigo', 'llamada', 'menta'];
  palabraOculta: string[] = [];      // muestra "_" y letras acertadas
  letrasUsadas: string[] = [];       // guardo las letras usadas
  letrasUsadasContador: string[] = [];

  imagenesAhorcado: string[] = ['horca-ahorcado.jpg','cabeza-ahorcado.jpg','cuerpo-ahorcado.jpg','piernas-ahorcado.jpg'];
  
  //Logica juego
  intentosFallidos = 0;
  juegoActivo = true;
  palabraElegida: string = this.seleccionarPalabraRandom();
  puntos = 0;

  //Tiempo y suscripciones
  startTime!: number;
  tiempoRestante = 60;                                 // valor interno
  tiempoRestante$ = new BehaviorSubject<number>(60);   // observable para la vista
  private timerSub?: Subscription;                     // subscripción RxJS

  currentUser: User | null = null;
  empezarJuego = false;
  usuario: any;

  constructor(
    private authService: AuthService,
    private dialog: MatDialog,
    private router: Router,
    private juegoService: JuegosService) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.usuario = user;
      console.log("Usuario en ahorcado:", user?.nombre);
    });

    this.juegoService.empezarJuego$.subscribe(estado => {
      this.empezarJuego = estado;
    });
  }

  ngOnDestroy() {
    this.stopTimer();
    this.tiempoRestante$.complete();
  }

  //Logica juego
  empezar() {
    // Funcion que se activa al clickear en el boton de jugar. Activa la logica del juego
    this.empezarJuego = true;   
    this.iniciarJuego();       
  }

  iniciarJuego() {
    this.palabraElegida = this.seleccionarPalabraRandom();
    this.palabraOculta = Array(this.palabraElegida.length).fill('_');
    this.intentosFallidos = 0;
    this.letrasUsadas = [];
    this.letrasUsadasContador = [];
    this.startTime = Date.now();
    this.juegoActivo = true;

    this.startTimer();
  }

  reiniciarJuego() {
    this.stopTimer();
    this.startTimer();
    this.puntos = 0;
    this.iniciarJuego();
  }

  get imagenActual(): string {
    return this.imagenesAhorcado[this.intentosFallidos] ?? this.imagenesAhorcado[0];
  }

  private startTimer() {
    this.stopTimer(); // por las dudas
    this.tiempoRestante = 60;
    this.tiempoRestante$.next(this.tiempoRestante);

    // el interval de rxjs corre dentro de la zone y el async pipe actualiza la UI
    this.timerSub = interval(1000).subscribe(() => {
      this.tiempoRestante--;
      this.tiempoRestante$.next(this.tiempoRestante);

      if (this.tiempoRestante <= 0) {
        this.stopTimer();
        this.finalizarJuego("Se terminó el tiempo!");
      }
    });
  }

  private stopTimer() {
    if (this.timerSub) {
      this.timerSub.unsubscribe();
      this.timerSub = undefined;
    }
  }

  seleccionarPalabraRandom(){
    const id = Math.floor(Math.random() * this.listaPalabras.length);
    return this.listaPalabras[id];
  }

  seleccionarLetra(letra: string) {
    letra = letra.toLowerCase();
    // si ya se usó, no hace nada
    if (this.letrasUsadas.includes(letra)) return;

    this.letrasUsadas.push(letra);
    this.letrasUsadasContador.push(letra);

    if (this.palabraElegida.includes(letra)) {
      // actualizar palabra oculta
      for (let i = 0; i < this.palabraElegida.length; i++) {
        if (this.palabraElegida[i] === letra) {
          this.palabraOculta[i] = letra;
        }
      }
    } else {
      this.intentosFallidos++;
    }

    this.verificarEstado();
  }

  verificarEstado() {
    if (!this.palabraOculta.includes('_')) {
      this.puntos += 50;
      this.siguientePalabra();
    } else if (this.intentosFallidos >= 3) { 
      this.finalizarJuego("Perdio antes de tiempo!");
      this.juegoActivo = false;
      this.empezarJuego = false;
    }
  }

  siguientePalabra(){
    this.palabraElegida = this.seleccionarPalabraRandom();
    this.palabraOculta = Array(this.palabraElegida.length).fill('_');
    this.intentosFallidos = 0;
    this.letrasUsadas = [];
  }

  async finalizarJuego(resultado: string) {
    this.stopTimer();
    const tipo = 'puntuacion';
    const endTime = Date.now();
    const duracionSegundos = Math.floor((endTime - this.startTime) / 1000);

    const guardadoExitoso = await this.juegoService.guardarResultadoAhorcado(
      this.usuario?.nombre,
      this.puntos,
      duracionSegundos,
      this.letrasUsadasContador.length,
      tipo 
    );

    if (guardadoExitoso) {
      console.log("Resultado guardado correctamente");
    }

    this.dialog.open(JuegosDialog, {
      data: { resultado, puntos: this.puntos }
    }).afterClosed().subscribe(opcion => {
      if (opcion === 'home') {
        this.router.navigate(['/home']);
      } else if (opcion === 'reintentar') {
        this.iniciarJuego();
      }
    });
  }

  volverHome(){
    this.router.navigate(['/home']);
  }

}
