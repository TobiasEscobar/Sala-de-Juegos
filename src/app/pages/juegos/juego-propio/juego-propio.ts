import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { AuthService } from '../../../services/auth';
import { JuegosService } from '../../../services/juegosService';
import { User } from '../../../clases/user';
import { interval, BehaviorSubject, Subscription } from 'rxjs';
import { JuegosDialog } from '../../../dialogs/juegos-dialog/juegos-dialog';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormatearTiempoPipe } from '../../../pipes/formatear-tiempo-pipe-pipe';

import Swal from 'sweetalert2';

// Interfaz para representar una celda con su posición y valor
interface Celda {
  fila: number;
  columna: number;
  valor: number;
  esNueva: boolean; // Para animación de aparición
  seFusiono: boolean; // Para animación de fusión
  id: string; // Identificador único para trackear animaciones
}

@Component({
  selector: 'app-game-1024',
  standalone: true,
  imports: [CommonModule, FormatearTiempoPipe],
  templateUrl: './juego-propio.html',
  styleUrl: './juego-propio.css'
})
export class JuegoPropio implements OnInit, OnDestroy {
  // Configuración del tablero
  tamano = 4; // tablero 4x4
  tablero: Celda[][] = [];
  puntuacion = 0;
  llegoMaximo = 'NO'; 
  
  // Control del juego
  juegoActivo = false;
  juegoTerminado = false;
  empezarJuego = false;
  resultadoGuardado = false; // NUEVA: Bandera para evitar guardado duplicado
  
  // Tiempo y suscripciones
  startTime!: number;
  tiempoRestante = 300; // 5 minutos = 300 segundos
  tiempoRestante$ = new BehaviorSubject<number>(300);
  private timerSub?: Subscription;
  
  // Usuario
  currentUser: User | null = null;
  usuario: any;
  
  constructor(
    private authService: AuthService,
    private dialog: MatDialog,
    private router: Router,
    private juegoService: JuegosService
  ) {}

  ngOnInit() {
    // Suscribirse al usuario actual
    this.authService.currentUser$.subscribe(user => {
      this.usuario = user;
      console.log("Usuario en 1024:", user?.nombre);
    });

    // Suscribirse al estado de inicio del juego
    this.juegoService.empezarJuego$.subscribe(estado => {
      this.empezarJuego = estado;
    });
  }

  ngOnDestroy() {
    // Limpiar el temporizador y completar el observable
    this.detenerTemporizador();
    this.tiempoRestante$.complete();
  }

  // Escuchar eventos del teclado para mover las celdas
  @HostListener('window:keydown', ['$event'])
  manejarTecla(evento: KeyboardEvent) {
    if (!this.juegoActivo || this.juegoTerminado) return;
    
    switch(evento.key) {
      case 'ArrowUp':
        evento.preventDefault();
        this.mover('arriba');
        break;
      case 'ArrowDown':
        evento.preventDefault();
        this.mover('abajo');
        break;
      case 'ArrowLeft':
        evento.preventDefault();
        this.mover('izquierda');
        break;
      case 'ArrowRight':
        evento.preventDefault();
        this.mover('derecha');
        break;
    }
  }

  
  // ========== CONTROL DEL JUEGO ==========

  // Función que se activa al clickear en el botón de jugar
  empezar() {
    this.empezarJuego = true;   
    this.iniciarJuego();       
  }

  // Inicializar el juego con valores por defecto
  iniciarJuego() {
    // Crear tablero vacío con objetos Celda
    this.tablero = Array.from({ length: this.tamano }, (_, fila) =>
      Array.from({ length: this.tamano }, (_, columna) => ({
        fila,
        columna,
        valor: 0,
        esNueva: false,
        seFusiono: false,
        id: `${fila}-${columna}-${Date.now()}`
      }))
    );
    
    this.puntuacion = 0;
    this.juegoTerminado = false;
    this.juegoActivo = true;
    this.resultadoGuardado = false; // RESETEAR la bandera al iniciar
    this.llegoMaximo = 'NO'; // RESETEAR también esto
    this.startTime = Date.now();
    
    // Iniciar temporizador
    this.iniciarTemporizador();
    
    // Agregar dos celdas iniciales
    this.agregarCeldaAleatoria();
    this.agregarCeldaAleatoria();
  }

  // ========== TEMPORIZADOR ==========

  private iniciarTemporizador() {
    this.detenerTemporizador(); // Detener timer previo si existe
    this.tiempoRestante = 300; // 5 minutos
    this.tiempoRestante$.next(this.tiempoRestante);

    // Crear intervalo que disminuye cada segundo
    this.timerSub = interval(1000).subscribe(() => {
      this.tiempoRestante--;
      this.tiempoRestante$.next(this.tiempoRestante);

      // Si se acabó el tiempo, terminar juego
      if (this.tiempoRestante <= 0) {
        this.detenerTemporizador();
        this.finalizarJuego("Se terminó el tiempo!");
      }
    });
  }

  private detenerTemporizador() {
    if (this.timerSub) {
      this.timerSub.unsubscribe();
      this.timerSub = undefined;
    }
  }


  // ========== LÓGICA DEL JUEGO ==========

  // Agregar una celda nueva con valor 2 o 4 en una posición vacía
  agregarCeldaAleatoria() {
    const celdasVacias: { fila: number; columna: number }[] = [];
    
    // Buscar todas las celdas vacías
    this.tablero.forEach((fila, i) =>
      fila.forEach((celda, j) => {
        if (celda.valor === 0) {
          celdasVacias.push({ fila: i, columna: j });
        }
      })
    );

    // Si hay celdas vacías, agregar una nueva
    if (celdasVacias.length) {
      const { fila, columna } = celdasVacias[Math.floor(Math.random() * celdasVacias.length)];
      this.tablero[fila][columna].valor = Math.random() < 0.9 ? 2 : 4;
      this.tablero[fila][columna].esNueva = true;
      this.tablero[fila][columna].id = `${fila}-${columna}-${Date.now()}`;
      
      // Quitar la animación de nueva después de 300ms
      setTimeout(() => {
        this.tablero[fila][columna].esNueva = false;
      }, 300);
    }
  }

  // Mover las celdas en la dirección especificada
  mover(direccion: 'arriba' | 'abajo' | 'izquierda' | 'derecha'): void {
    if (!this.juegoActivo || this.juegoTerminado) return;
    
    // Guardar estado anterior para comparar
    const tableroAnterior = JSON.stringify(this.tablero.map(f => f.map(c => c.valor)));
    let seMovio = false;

    // Resetear estados de animación de fusión
    this.tablero.forEach(fila => fila.forEach(celda => celda.seFusiono = false));

    // Procesar cada línea del tablero según la dirección
    for (let i = 0; i < this.tamano; i++) {
      let linea: Celda[];
      
      if (direccion === 'izquierda' || direccion === 'derecha') {
        // Movimiento horizontal: procesar fila
        linea = [...this.tablero[i]];
        if (direccion === 'derecha') linea.reverse();
        linea = this.comprimirYFusionar(linea);
        if (direccion === 'derecha') linea.reverse();
        this.tablero[i] = linea;
      } else {
        // Movimiento vertical: procesar columna
        linea = this.tablero.map(fila => fila[i]);
        if (direccion === 'abajo') linea.reverse();
        linea = this.comprimirYFusionar(linea);
        if (direccion === 'abajo') linea.reverse();
        for (let j = 0; j < this.tamano; j++) {
          this.tablero[j][i] = linea[j];
        }
      }
    }

    // Comparar si hubo cambios en el tablero
    const tableroNuevo = JSON.stringify(this.tablero.map(f => f.map(c => c.valor)));
    
    if (tableroAnterior !== tableroNuevo) {
      seMovio = true;
    }

    // Si hubo movimiento, agregar nueva celda y verificar estado
    if (seMovio) {
      setTimeout(() => {
        this.agregarCeldaAleatoria();
        this.verificarEstadoJuego();
      }, 200);
    }
  }

  // Comprimir (eliminar ceros) y fusionar celdas adyacentes iguales
  comprimirYFusionar(linea: Celda[]): Celda[] {
    // Paso 1: Filtrar celdas vacías (valor 0)
    let lineaComprimida = linea.filter(celda => celda.valor !== 0);
    
    // Paso 2: Fusionar celdas adyacentes iguales
    for (let i = 0; i < lineaComprimida.length - 1; i++) {
      if (lineaComprimida[i].valor === lineaComprimida[i + 1].valor) {
        lineaComprimida[i].valor *= 2; // Duplicar el valor
        lineaComprimida[i].seFusiono = true; // Marcar para animación
        this.puntuacion += lineaComprimida[i].valor; // Sumar puntos
        lineaComprimida[i + 1].valor = 0; // Marcar la segunda celda como vacía
        
        // Quitar animación de fusión después de 300ms
        setTimeout(() => {
          lineaComprimida[i].seFusiono = false;
        }, 300);
      }
    }
    
    // Paso 3: Filtrar nuevamente las celdas vacías después de fusionar
    lineaComprimida = lineaComprimida.filter(celda => celda.valor !== 0);
    
    // Paso 4: Rellenar con celdas vacías hasta completar el tamaño
    while (lineaComprimida.length < this.tamano) {
      lineaComprimida.push({
        fila: 0,
        columna: 0,
        valor: 0,
        esNueva: false,
        seFusiono: false,
        id: `empty-${Date.now()}-${Math.random()}`
      });
    }
    
    return lineaComprimida;
  }

  // ========== VERIFICACIÓN DE ESTADO ==========

  // Verificar si el juego terminó (ganó o perdió)
  verificarEstadoJuego() {
    // Si ya se guardó el resultado, no verificar más
    if (this.resultadoGuardado) return;
    
    // Verificar si ganó (alcanzó 1024)
    for (let fila of this.tablero) {
      for (let celda of fila) {
        if (celda.valor >= 1024) {
          this.puntuacion += 2048;
          this.llegoMaximo = 'SI';
          this.finalizarJuego('¡Felicidades, llegaste a 1024! 2048 puntos de bonus otorgado');
          return;
        }
      }
    }

    // Verificar si perdió (no hay movimientos posibles)
    if (!this.hayMovimientosPosibles()) {
      this.finalizarJuego("No hay más movimientos posibles!");
    }
  }

  // Verificar si hay movimientos posibles en el tablero
  hayMovimientosPosibles(): boolean {
    // Verificar si hay celdas vacías
    for (let fila of this.tablero) {
      for (let celda of fila) {
        if (celda.valor === 0) return true;
      }
    }

    // Verificar si hay celdas adyacentes iguales (horizontal)
    for (let i = 0; i < this.tamano; i++) {
      for (let j = 0; j < this.tamano - 1; j++) {
        if (this.tablero[i][j].valor === this.tablero[i][j + 1].valor) {
          return true;
        }
      }
    }

    // Verificar si hay celdas adyacentes iguales (vertical)
    for (let i = 0; i < this.tamano - 1; i++) {
      for (let j = 0; j < this.tamano; j++) {
        if (this.tablero[i][j].valor === this.tablero[i + 1][j].valor) {
          return true;
        }
      }
    }

    return false;
  }


  // ========== FIN DEL JUEGO ==========

  // Manejar victoria
  async finalizarJuego(resultado: string) {
    // IMPORTANTE: Verificar si ya se guardó para evitar duplicados
    if (this.resultadoGuardado) {
      return;
    }
    
    this.juegoTerminado = true;
    this.juegoActivo = false;
    this.detenerTemporizador();
    this.resultadoGuardado = true; // Marcar como guardado ANTES de guardar
    
    const endTime = Date.now();
    const duracionSegundos = Math.floor((endTime - this.startTime) / 1000);

    // Guardar en base de datos
    const guardadoExitoso = await this.juegoService.guardarResultadoJuegoPropio(
      this.usuario?.nombre,
      this.puntuacion,
      duracionSegundos,
      this.llegoMaximo
    );
    
    if (guardadoExitoso) {
      console.log("Resultado guardado correctamente");
    } else {
      console.error("Error al guardar resultado");
    }

    // Mostrar diálogo de victoria
    this.dialog.open(JuegosDialog, {
      data: { 
        resultado, 
        puntos: this.puntuacion 
      }
    }).afterClosed().subscribe(opcion => {
      if (opcion === 'home') {
        this.router.navigate(['/home']);
      } else if (opcion === 'reintentar') {
        this.reiniciarJuego();
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
        this.puntuacion = 0;
        this.detenerTemporizador();
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


  // ========== ESTILOS VISUALES ==========

  // Obtener el color de fondo según el valor de la celda
  obtenerColorCelda(valor: number): string {
    const colores: { [key: number]: string } = {
      0: '#cdc1b4',
      2: '#eee4da',
      4: '#ede0c8',
      8: '#f2b179',
      16: '#f59563',
      32: '#f67c5f',
      64: '#f65e3b',
      128: '#edcf72',
      256: '#edcc61',
      512: '#edc850',
      1024: '#edc53f',
      2048: '#edc22e'
    };
    
    return colores[valor] || '#3c3a32';
  }

  // Obtener el color del texto según el valor de la celda
  obtenerColorTexto(valor: number): string {
    return valor <= 4 ? '#776e65' : '#f9f6f2';
  }
}