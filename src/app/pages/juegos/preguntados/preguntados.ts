import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../../services/auth';
import { JuegosService } from '../../../services/juegosService';
import { User } from '../../../clases/user';
import { ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JuegosDialog } from '../../../dialogs/juegos-dialog/juegos-dialog';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TriviaApi, Pregunta } from '../../../services/triviaApi';
import { FormsModule } from '@angular/forms';
import { FormatearTiempoPipe } from '../../../pipes/formatear-tiempo-pipe-pipe';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-preguntados',
  imports: [CommonModule, FormsModule, FormatearTiempoPipe],
  templateUrl: './preguntados.html',
  styleUrl: './preguntados.css'
})
export class Preguntados implements OnInit, OnDestroy {
  
  // Estado del juego
  juegoActivo = false;
  juegoTerminado = false;
  preguntasFallidas = 0;
  aciertos = 0;
  maxPreguntas = 10;
  resultadoPartida = '';
  botonesBloqueados = false;

  // Preguntas
  preguntas: Pregunta[] = [];
  preguntaActual: Pregunta | null = null;
  indicePregunta = 0;
  respuestaSeleccionada: string | null = null;
  mostrarResultado = false;
  esCorrecta = false;

  // Temporizador
  tiempoRestante = 180;
  intervaloTemporizador: any;
  startTime!: number;

  // Usuario
  currentUser: User | null = null;
  usuario: any;
  empezarJuego = false;
  cargandoPreguntas = false;

  // Categorías
  categorias = [
    { id: 9, nombre: 'General', icono: '📚' },
    { id: 17, nombre: 'Ciencia', icono: '🔬' },
    { id: 23, nombre: 'Historia', icono: '📜' },
    { id: 21, nombre: 'Deportes', icono: '⚽' }
  ];
  categoriaSeleccionada: any = null;

  constructor(
    private authService: AuthService,
    private dialog: MatDialog,
    private router: Router,
    private juegoService: JuegosService,
    private triviaApi: TriviaApi,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.usuario = user;
      console.log("Usuario en Preguntados:", user?.nombre);
    });
    
    this.juegoService.empezarJuego$.subscribe(estado => {
      this.empezarJuego = estado;
    });
  }

  ngOnDestroy() {
    this.detenerTemporizador();
    this.resetearEstado();
  }

  // ========== SELECCIÓN DE CATEGORÍA ==========

  seleccionarCategoria(cat: any) {
    this.categoriaSeleccionada = cat;
  }

  empezar() {
    this.empezarJuego = true;
    this.iniciarJuego();
  }

  // ========== INICIO DEL JUEGO ==========

  async iniciarJuego() {
    // Evitar peticiones duplicadas
    if (this.cargandoPreguntas) {
      console.log('Ya hay una petición en curso, ignorando...');
      return;
    }

    this.cargandoPreguntas = true;
    this.botonesBloqueados = false;
    this.preguntasFallidas = 0;
    this.aciertos = 0;
    this.indicePregunta = 0;
    this.tiempoRestante = 180;
    this.startTime = Date.now();

    console.log(`Cargando preguntas de categoría: ${this.categoriaSeleccionada.nombre}`);

    this.triviaApi.getPreguntasPorCategoria(this.categoriaSeleccionada.id).subscribe({
      next: (data) => {
        console.log('Preguntas recibidas:', data);
        this.preguntas = data;
        this.preguntaActual = this.preguntas[0];
        this.juegoActivo = true;
        this.juegoTerminado = false;
        this.cargandoPreguntas = false;
        this.iniciarTemporizador();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error cargando preguntas:', error);
        this.cargandoPreguntas = false;
        
        // Manejar error 429 específicamente
        if (error.status === 429) {
          Swal.fire({
            title: 'Demasiadas peticiones',
            text: 'Por favor espera unos segundos antes de volver a intentar',
            icon: 'warning',
            confirmButtonColor: '#ffc107',
            confirmButtonText: 'Entendido'
          }).then(() => {
            this.resetearJuego();
          });
        } else {
          Swal.fire({
            title: 'Error al cargar',
            text: 'No se pudieron cargar las preguntas. Verifica tu conexión.',
            icon: 'error',
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Intentar de nuevo'
          }).then(() => {
            this.resetearJuego();
          });
        }
      }
    });
  }

  // ========== TEMPORIZADOR ==========

  iniciarTemporizador() {
    this.detenerTemporizador();
    this.intervaloTemporizador = setInterval(() => {
      if (!this.juegoActivo) return;
      this.tiempoRestante--;
      if (this.tiempoRestante <= 0) {
        this.finalizarJuego(false, '⏰ Se acabó el tiempo');
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

  // ========== LÓGICA DE RESPUESTAS ==========

  seleccionarRespuesta(respuesta: string) {
    if (this.mostrarResultado || !this.preguntaActual || this.botonesBloqueados) return;

    this.respuestaSeleccionada = respuesta;
    this.mostrarResultado = true;

    const respuestaDecodificada = this.decodeHtml(respuesta);
    const correctaDecodificada = this.decodeHtml(this.preguntaActual.correct_answer);
    
    this.esCorrecta = respuestaDecodificada === correctaDecodificada;

    if (this.esCorrecta) {
      this.aciertos++;
    } else {
      this.preguntasFallidas++;
      if (this.preguntasFallidas >= 3) {
        // Pequeño delay antes de finalizar para que se vea el resultado
        setTimeout(() => {
          this.finalizarJuego(false, 'Alcanzaste el límite de errores (3)');
        }, 1500);
        return;
      }
    }
  }

  decodeHtml(html: string): string {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  }

  siguientePregunta() {
    if (this.botonesBloqueados) return;

    this.indicePregunta++;
    if (this.indicePregunta >= this.maxPreguntas) {
      this.finalizarJuego(true, 'Completaste todas las preguntas');
      return;
    }

    if (this.indicePregunta < this.preguntas.length) {
      this.preguntaActual = this.preguntas[this.indicePregunta];
      this.respuestaSeleccionada = null;
      this.mostrarResultado = false;
      this.cdr.detectChanges();
    } else {
      this.finalizarJuego(true, 'Completaste todas las preguntas disponibles');
    }
  }

  // ========== FIN DEL JUEGO ==========

  async finalizarJuego(completado: boolean, mensaje: string = '') {
    this.detenerTemporizador();
    this.juegoActivo = false;
    this.juegoTerminado = true;
    this.botonesBloqueados = true;
    const cantidadPreguntas = this.indicePregunta;

    const endTime = Date.now();
    const duracionSegundos = Math.floor((endTime - this.startTime) / 1000);

    const porcentajeAciertos = (this.aciertos / this.maxPreguntas) * 100;
    this.resultadoPartida = (completado && porcentajeAciertos >= 60) ? 'Ganó ' + mensaje : 'Perdió ' + mensaje;

    // TODO: Guardar en base de datos
    const guardadoExitoso = await this.juegoService.guardarResultadoPreguntados(
      this.usuario?.nombre,
      this.aciertos,
      duracionSegundos,
      this.preguntasFallidas,
      cantidadPreguntas
    );

    if (guardadoExitoso) {
      console.log("Resultado guardado correctamente");
    }

    this.dialog.open(JuegosDialog, {
      data: { 
        resultado: this.resultadoPartida, 
        aciertos: this.aciertos,
      }
    }).afterClosed().subscribe(opcion => {
      if (opcion === 'home') {
        this.resetearEstado();
        this.router.navigate(['/home']);
      } else if (opcion === 'reintentar') {
        this.resetearJuego();
      }
    });
  }

  // ========== NAVEGACIÓN ==========

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
          this.resetearEstado();
          this.router.navigate(['/home']);
        }
      });
    } else {
      this.resetearEstado();
      this.router.navigate(['/home']);
    }
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
        this.resetearJuego();
      }
    });
  }

  // ========== RESETEO ==========

  resetearJuego() {
    this.detenerTemporizador();
    this.juegoActivo = false;
    this.juegoTerminado = false;
    this.botonesBloqueados = false;
    this.preguntas = [];
    this.preguntaActual = null;
    this.indicePregunta = 0;
    this.respuestaSeleccionada = null;
    this.mostrarResultado = false;
    this.esCorrecta = false;
    this.tiempoRestante = 180;
    this.aciertos = 0;
    this.preguntasFallidas = 0;
    this.resultadoPartida = '';
    this.empezarJuego = false;
    this.categoriaSeleccionada = null;
    this.cargandoPreguntas = false;
    this.cdr.detectChanges();
  }

  // Resetear estado completo (para ngOnDestroy y salir del juego)
  private resetearEstado() {
    this.detenerTemporizador();
    this.juegoActivo = false;
    this.juegoTerminado = false;
    this.botonesBloqueados = false;
    this.preguntas = [];
    this.preguntaActual = null;
    this.indicePregunta = 0;
    this.respuestaSeleccionada = null;
    this.mostrarResultado = false;
    this.esCorrecta = false;
    this.tiempoRestante = 180;
    this.aciertos = 0;
    this.preguntasFallidas = 0;
    this.resultadoPartida = '';
    this.empezarJuego = false;
    this.categoriaSeleccionada = null;
    this.cargandoPreguntas = false;
  }

  // ========== ESTILOS ==========

  getClaseBoton(respuesta: string): string {
    if (!this.mostrarResultado) {
      return 'btn-primary';
    }

    const respuestaDecodificada = this.decodeHtml(respuesta);
    const correctaDecodificada = this.decodeHtml(this.preguntaActual?.correct_answer || '');

    if (respuestaDecodificada === correctaDecodificada) {
      return 'btn-success';
    }

    if (respuestaDecodificada === this.decodeHtml(this.respuestaSeleccionada || '')) {
      return 'btn-danger';
    }

    return 'btn-secondary';
  }
}