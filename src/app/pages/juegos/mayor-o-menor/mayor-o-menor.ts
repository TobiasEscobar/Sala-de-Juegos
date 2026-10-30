import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../../services/auth';
import { JuegosService } from '../../../services/juegosService';
import { User } from '../../../clases/user';
import { CommonModule } from '@angular/common';

import { JuegosDialog } from '../../../dialogs/juegos-dialog/juegos-dialog';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

import Swal from 'sweetalert2';
import { FormatearTiempoPipe } from '../../../pipes/formatear-tiempo-pipe-pipe';

interface Carta {
  id: number;
  nombre: string;
  palo: string;
  valor: number;
  imagen_url: string;
}

@Component({
  selector: 'app-mayor-o-menor',
  standalone: true,
  imports: [CommonModule, FormatearTiempoPipe],
  templateUrl: './mayor-o-menor.html',
  styleUrl: './mayor-o-menor.css'
})
export class MayorOMenor implements OnInit, OnDestroy {
  
  // Lógica del juego
  juegoActivo = false;
  juegoTerminado = false;
  intentosFallidos = 0;
  aciertos = 0;
  vidas = 3;
  maxAciertos = 10;
  resultadoPartida = '';

  intervaloTemporizador: any;
  startTime!: number;
  tiempoRestante = 60;

  // Cartas de la baraja
  mazo: Carta[] = [];
  cartaActual: Carta | null = null;
  cartaSiguiente: Carta | null = null;

  // Usuario y estado
  currentUser: User | null = null;
  usuario: any = null;
  empezarJuego = false;

  constructor(
    private authService: AuthService,
    private dialog: MatDialog,
    private router: Router,
    private juegoService: JuegosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.usuario = user;
      this.currentUser = user;
      this.cdr.markForCheck();
    });

    this.juegoService.empezarJuego$.subscribe(estado => {
      this.empezarJuego = estado;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.detenerTemporizador();
  }

  // Lógica de juego
  empezar(): void {
    this.empezarJuego = true;
    this.iniciarJuego();       
  }

  async iniciarJuego(): Promise<void> {
    this.intentosFallidos = 0;
    this.aciertos = 0;
    this.vidas = 3;
    this.juegoActivo = true;
    this.juegoTerminado = false;
    this.tiempoRestante = 60;
    this.startTime = Date.now();

    // Cargar cartas desde Supabase
    const { data, error }: any = await this.juegoService.cargarCartas();
    if (error || !data) {
      console.error('Error cargando cartas', error);
      return;
    }

    this.mazo = this.mezclarCartas(data);
    this.cartaActual = this.mazo.shift() || null;
    this.iniciarTemporizador();

    this.cdr.markForCheck();
    this.cdr.detectChanges(); 
  }

  iniciarTemporizador(): void {
    this.detenerTemporizador();
    this.intervaloTemporizador = setInterval(() => {
      if (!this.juegoActivo) return;
      
      this.tiempoRestante--;
      if (this.tiempoRestante <= 0) {
        this.finalizarJuego(false);
      }
      
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    }, 1000);
  }

  detenerTemporizador(): void {
    if (this.intervaloTemporizador) {
      clearInterval(this.intervaloTemporizador);
      this.intervaloTemporizador = null;
    }
  }

  mezclarCartas(cartas: Carta[]): Carta[] {
    return [...cartas].sort(() => Math.random() - 0.5);
  }

  elegir(opcion: 'mayor' | 'menor'): void {
    if (!this.cartaActual || this.mazo.length === 0) return;

    this.cartaSiguiente = this.mazo.pop() || null;
    if (!this.cartaSiguiente) return;

    const acierto = 
      (opcion === 'mayor' && this.cartaSiguiente.valor >= this.cartaActual.valor) ||
      (opcion === 'menor' && this.cartaSiguiente.valor <= this.cartaActual.valor);

    if (acierto) {
      this.aciertos++;
      if (this.aciertos >= this.maxAciertos) {
        this.finalizarJuego(true);
        return;
      }
    } else {
      this.intentosFallidos++;
      this.vidas--;
      if (this.vidas <= 0) {
        this.finalizarJuego(false);
        return;
      }
    }

    // Pasar a la siguiente carta
    this.cartaActual = this.cartaSiguiente;
    this.cartaSiguiente = null;

    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  async finalizarJuego(resultado: boolean): Promise<void> {
    this.detenerTemporizador();
    this.juegoTerminado = true;
    this.juegoActivo = false;

    const endTime = Date.now();
    const duracionSegundos = Math.floor((endTime - this.startTime) / 1000);

    this.resultadoPartida = resultado ? 'Ganó' : 'Perdió';

    try {
      await this.juegoService.guardarResultadoMayorMenor(
        this.usuario?.nombre || 'Gamer Anónimo',
        this.aciertos,
        duracionSegundos,
        this.resultadoPartida,
        this.intentosFallidos
      );
    } catch (err) {
      console.warn('Error al guardar ranking mayor o menor:', err);
    }

    this.cdr.markForCheck();
    this.cdr.detectChanges();

    this.dialog.open(JuegosDialog, {
      data: { resultado: this.resultadoPartida, aciertos: this.aciertos }
    }).afterClosed().subscribe((opcion: string) => {
      if (opcion === 'home') {
        this.router.navigate(['/home']);
      } else if (opcion === 'reintentar') {
        this.iniciarJuego();
      }
    });
  }

  reiniciarJuego(): void {
    Swal.fire({
      title: '¿Reiniciar juego?',
      text: 'Se perderá tu progreso actual',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ffc107',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, reiniciar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.detenerTemporizador();
        this.aciertos = 0;
        this.vidas = 3;
        this.iniciarJuego();
      }
    });
  }

  volverHome(): void {
    if (this.juegoActivo && !this.juegoTerminado) {
      Swal.fire({
        title: '¿Salir del juego?',
        text: 'Se perderá tu progreso actual',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.detenerTemporizador();
          this.router.navigate(['/home']);
        }
      });
    } else {
      this.router.navigate(['/home']);
    }
  }
}
