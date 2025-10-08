import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { AuthService } from '../../../services/auth';
import { JuegosService } from '../../../services/juegosService';
import { User } from '../../../clases/user';
import { ChangeDetectorRef } from '@angular/core';

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
  imports: [FormatearTiempoPipe],
  templateUrl: './mayor-o-menor.html',
  styleUrl: './mayor-o-menor.css'
})
export class MayorOMenor implements OnInit, OnDestroy {
  
  //Logica juego
  juegoActivo = false;
  juegoTerminado = false;
  intentosFallidos = 0;
  aciertos = 0;
  vidas = 3;
  maxAciertos = 10;
  resultadoPartida = '';

  intervaloTemporizador: any;
  startTime!: number;
  tiempoRestante = 10;

  //Cartas
  mazo: Carta[] = [];
  cartaActual: Carta | null = null;
  cartaSiguiente: Carta | null = null;

  //suscripciones
  currentUser: User | null = null;
  usuario: any;
  empezarJuego = false;


  constructor(
    private authService: AuthService,
    private dialog: MatDialog,
    private router: Router,
    private juegoService: JuegosService,
    private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.usuario = user;
      console.log("Usuario en mayor-o-menor:", user?.nombre);
    });

    this.juegoService.empezarJuego$.subscribe(async estado => {
      this.empezarJuego = estado;
    });
  }

  ngOnDestroy() {
    console.log("salio");
  }

  //Logica juego
  empezar() {
    // Funcion que se activa al clickear en el boton de jugar. Activa la logica del juego
    this.empezarJuego = true;
    this.iniciarJuego();       
  }

  async iniciarJuego() {
    this.intentosFallidos = 0;
    this.aciertos = 0;
    this.vidas = 3;
    this.juegoActivo = true;
    this.juegoTerminado = false;
    this.tiempoRestante = 10;
    this.startTime = Date.now();

    // cargar cartas
    const { data, error }: any = await this.juegoService.cargarCartas();
    if (error) {
      console.error("Error cargando cartas", error);
      return;
    }

    this.mazo = this.mezclarCartas(data);
    this.cartaActual = this.mazo.shift() || null;
    this.iniciarTemporizador();
    this.cdr.detectChanges(); 
  }

  iniciarTemporizador() {
    this.detenerTemporizador();
    this.intervaloTemporizador = setInterval(() => {
      if (!this.juegoActivo) return;
      this.tiempoRestante--;
      if (this.tiempoRestante <= 0) {
        this.finalizarJuego(false);
      }
      this.cdr.detectChanges();
    }, 1000);
  }

  detenerTemporizador() {
    if (this.intervaloTemporizador) {
      clearInterval(this.intervaloTemporizador);
      this.intervaloTemporizador = null;
    }
  }

  mezclarCartas(cartas: Carta[]): Carta[] {
    return cartas.sort(() => Math.random() - 0.5);
  }

  elegir(opcion: 'mayor' | 'menor') {
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

    // pasar a la siguiente
    this.cartaActual = this.cartaSiguiente;
    this.cartaSiguiente = null;
  }

  async finalizarJuego(resultado: boolean) {
    this.juegoTerminado = true;
    this.juegoActivo = false;

    const endTime = Date.now();
    const duracionSegundos = Math.floor((endTime - this.startTime) / 1000);

    if (resultado)  {
      this.resultadoPartida = "Ganó";
    } else {
      this.resultadoPartida = "Perdió"
    }

    const guardadoExitoso = await this.juegoService.guardarResultadoMayorMenor(
      this.usuario?.nombre,
      this.aciertos,
      duracionSegundos,
      this.resultadoPartida,
      this.intentosFallidos,
    );

    if (guardadoExitoso) {
      console.log("Resultado guardado correctamente");
    }

    this.dialog.open(JuegosDialog, {
      data: { resultado: this.resultadoPartida, aciertos: this.aciertos }
    }).afterClosed().subscribe(opcion => {
      if (opcion === 'home') {
        this.router.navigate(['/home']);
      } else if (opcion === 'reintentar') {
        this.iniciarJuego();
      }
    });
  }

  reiniciarJuego() {
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

  volverHome() {
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
