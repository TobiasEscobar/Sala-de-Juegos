import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { AuthService } from '../../../services/auth';
import { JuegosService } from '../../../services/juegosService';
import { User } from '../../../clases/user';
import { ChangeDetectorRef } from '@angular/core';

import { JuegosDialog } from '../../../dialogs/juegos-dialog/juegos-dialog';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

interface Carta {
  id: number;
  nombre: string;
  palo: string;
  valor: number;
  imagen_url: string;
}

@Component({
  selector: 'app-mayor-o-menor',
  imports: [],
  templateUrl: './mayor-o-menor.html',
  styleUrl: './mayor-o-menor.css'
})
export class MayorOMenor implements OnInit, OnDestroy {
  
  //Logica juego
  juegoActivo = true;
  intentosFallidos = 0;
  aciertos = 0;
  vidas = 3;
  maxAciertos = 10;
  resultadoPartida = '';

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

    // cargar cartas
    const { data, error }: any = await this.juegoService.cargarCartas();
    if (error) {
      console.error("Error cargando cartas", error);
      return;
    }

    this.mazo = this.mezclarCartas(data);
    this.cartaActual = this.mazo.shift() || null;

    this.cdr.detectChanges(); 
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
    const tipo = 'acierto';

    if (resultado)  {
      this.resultadoPartida = "Ganó";
    } else {
      this.resultadoPartida = "Perdió"
    }
    const datos = {
      usuario: this.usuario?.nombre,
      aciertos: this.aciertos,
      resultado: this.resultadoPartida,
      intentos: this.intentosFallidos,
      fecha: new Date().toISOString()
    };

    const guardadoExitoso = await this.juegoService.guardarResultadoMayorMenor(
      this.usuario?.nombre,
      this.aciertos,
      tipo 
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

  volverHome() {
    this.router.navigate(['/home']);
  }

}
