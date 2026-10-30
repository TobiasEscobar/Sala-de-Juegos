import { Component, OnInit, OnDestroy, ChangeDetectorRef, ApplicationRef } from '@angular/core';
import { AuthService } from '../../../services/auth';
import { JuegosService } from '../../../services/juegosService';
import { User } from '../../../clases/user';
import { CommonModule } from '@angular/common';
import { JuegosDialog } from '../../../dialogs/juegos-dialog/juegos-dialog';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TriviaApi, Pregunta } from '../../../services/triviaApi';
import { FormsModule } from '@angular/forms';
import { FormatearTiempoPipe } from '../../../pipes/formatear-tiempo-pipe-pipe';
import Swal from 'sweetalert2';

export interface TriviaCategory {
  id: number;
  nombre: string;
  descripcion?: string;
}

@Component({
  selector: 'app-preguntados',
  standalone: true,
  imports: [CommonModule, FormsModule, FormatearTiempoPipe],
  templateUrl: './preguntados.html',
  styleUrl: './preguntados.css'
})
export class Preguntados implements OnInit, OnDestroy {
  
  // Estado general de la partida
  juegoActivo = false;
  juegoTerminado = false;
  preguntasFallidas = 0;
  aciertos = 0;
  maxPreguntas = 10;
  resultadoPartida = '';
  botonesBloqueados = false;

  // Preguntas y ronda actual
  preguntas: Pregunta[] = [];
  preguntaActual: Pregunta | null = null;
  indicePregunta = 0;
  respuestaSeleccionada: string | null = null;
  mostrarResultado = false;
  esCorrecta = false;

  // Temporizador de partida
  tiempoRestante = 180;
  intervaloTemporizador: any = null;
  startTime!: number;

  // Usuario y flujo de inicio
  currentUser: User | null = null;
  usuario: any = null;
  empezarJuego = false;
  cargandoPreguntas = false;

  // Categorías de trivia sin emojis
  categorias: TriviaCategory[] = [
    { id: 9, nombre: 'General', descripcion: 'Cultura, sociedad y conocimiento general' },
    { id: 17, nombre: 'Ciencia', descripcion: 'Física, química, biología y naturaleza' },
    { id: 23, nombre: 'Historia', descripcion: 'Eventos históricos, imperios y líderes' },
    { id: 21, nombre: 'Deportes', descripcion: 'Fútbol, tenis, olimpíadas y récords' }
  ];
  categoriaSeleccionada: TriviaCategory | null = null;

  constructor(
    private authService: AuthService,
    private dialog: MatDialog,
    private router: Router,
    private juegoService: JuegosService,
    private triviaApi: TriviaApi,
    private cdr: ChangeDetectorRef,
    private appRef: ApplicationRef
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
    this.resetearEstado();
  }

  // ========== SELECCIÓN DE CATEGORÍA ==========

  seleccionarCategoria(cat: TriviaCategory): void {
    this.categoriaSeleccionada = cat;
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  empezar(): void {
    this.empezarJuego = true;
    this.iniciarJuego();
  }

  // ========== INICIO DEL JUEGO Y CARGA DE PREGUNTAS ==========

  async iniciarJuego(): Promise<void> {
    if (this.cargandoPreguntas) {
      console.log('[Preguntados] Ya hay una solicitud en curso, ignorando...');
      return;
    }

    if (!this.categoriaSeleccionada) {
      this.categoriaSeleccionada = this.categorias[0];
    }

    const categoriaId = this.categoriaSeleccionada.id;

    this.cargandoPreguntas = true;
    this.empezarJuego = true;
    this.botonesBloqueados = false;
    this.preguntasFallidas = 0;
    this.aciertos = 0;
    this.indicePregunta = 0;
    this.tiempoRestante = 180;
    this.startTime = Date.now();
    this.respuestaSeleccionada = null;
    this.mostrarResultado = false;

    // Forzar actualización inmediata del spinner para Zoneless Change Detection
    this.cdr.markForCheck();
    this.cdr.detectChanges();
    this.appRef.tick();

    console.log(`[Preguntados] Solicitando preguntas para: ${this.categoriaSeleccionada.nombre} (ID: ${categoriaId})`);

    this.triviaApi.getPreguntasPorCategoria(categoriaId).subscribe({
      next: (data: Pregunta[]) => {
        console.log('[Preguntados] Preguntas recibidas exitosamente:', data);

        let finalQuestions = data;
        if (!finalQuestions || finalQuestions.length === 0) {
          finalQuestions = this.triviaApi.getFallbackQuestions(categoriaId);
        }

        this.preguntas = finalQuestions;
        this.preguntaActual = this.preguntas[0] || null;
        this.juegoActivo = true;
        this.juegoTerminado = false;
        this.cargandoPreguntas = false;

        this.iniciarTemporizador();

        // Notificación y sincronización en tiempo real para Zoneless Change Detection
        this.cdr.markForCheck();
        this.cdr.detectChanges();
        this.appRef.tick();
      },
      error: (error) => {
        console.error('[Preguntados] Error cargando preguntas, aplicando contingencia:', error);
        
        this.preguntas = this.triviaApi.getFallbackQuestions(categoriaId);
        this.preguntaActual = this.preguntas[0] || null;
        this.juegoActivo = true;
        this.juegoTerminado = false;
        this.cargandoPreguntas = false;

        this.iniciarTemporizador();

        this.cdr.markForCheck();
        this.cdr.detectChanges();
        this.appRef.tick();
      }
    });
  }

  // ========== TEMPORIZADOR ==========

  iniciarTemporizador(): void {
    this.detenerTemporizador();
    this.intervaloTemporizador = setInterval(() => {
      if (!this.juegoActivo) return;
      
      this.tiempoRestante--;
      if (this.tiempoRestante <= 0) {
        this.finalizarJuego(false, 'Se acabó el tiempo');
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

  // ========== LÓGICA DE RESPUESTAS ==========

  seleccionarRespuesta(respuesta: string): void {
    if (this.mostrarResultado || !this.preguntaActual || this.botonesBloqueados) return;

    this.respuestaSeleccionada = respuesta;
    this.mostrarResultado = true;

    const respuestaDecodificada = this.decodeHtml(respuesta).trim().toLowerCase();
    const correctaDecodificada = this.decodeHtml(this.preguntaActual.correct_answer).trim().toLowerCase();
    
    this.esCorrecta = respuestaDecodificada === correctaDecodificada;

    if (this.esCorrecta) {
      this.aciertos++;
    } else {
      this.preguntasFallidas++;
      if (this.preguntasFallidas >= 3) {
        setTimeout(() => {
          this.finalizarJuego(false, 'Alcanzaste el límite de 3 fallos');
          this.cdr.markForCheck();
          this.appRef.tick();
        }, 1500);

        this.cdr.markForCheck();
        this.cdr.detectChanges();
        return;
      }
    }

    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  decodeHtml(html: string): string {
    if (!html) return '';
    if (typeof document !== 'undefined') {
      const txt = document.createElement('textarea');
      txt.innerHTML = html;
      return txt.value;
    }
    return html;
  }

  siguientePregunta(): void {
    if (this.botonesBloqueados) return;

    this.indicePregunta++;
    if (this.indicePregunta >= this.maxPreguntas) {
      this.finalizarJuego(true, 'Completaste todas las preguntas de la ronda.');
      return;
    }

    if (this.indicePregunta < this.preguntas.length) {
      this.preguntaActual = this.preguntas[this.indicePregunta];
      this.respuestaSeleccionada = null;
      this.mostrarResultado = false;

      this.cdr.markForCheck();
      this.cdr.detectChanges();
      this.appRef.tick();
    } else {
      this.finalizarJuego(true, 'Completaste todas las preguntas disponibles.');
    }
  }

  // ========== FIN DEL JUEGO ==========

  async finalizarJuego(completado: boolean, mensaje: string = ''): Promise<void> {
    this.detenerTemporizador();
    this.juegoActivo = false;
    this.juegoTerminado = true;
    this.botonesBloqueados = true;
    const cantidadPreguntas = this.indicePregunta;

    const endTime = Date.now();
    const duracionSegundos = Math.floor((endTime - this.startTime) / 1000);

    const porcentajeAciertos = (this.aciertos / this.maxPreguntas) * 100;
    this.resultadoPartida = (completado && porcentajeAciertos >= 60) 
      ? 'Victoria - ' + mensaje 
      : 'Partida Terminada - ' + mensaje;

    // Guardar en la base de datos de Supabase
    try {
      await this.juegoService.guardarResultadoPreguntados(
        this.usuario?.nombre || 'Gamer Anónimo',
        this.aciertos,
        duracionSegundos,
        this.preguntasFallidas,
        cantidadPreguntas
      );
    } catch (err) {
      console.warn('[Preguntados] No se pudo guardar el ranking:', err);
    }

    this.cdr.markForCheck();
    this.cdr.detectChanges();

    const dialogRef = this.dialog.open(JuegosDialog, {
      data: { 
        resultado: this.resultadoPartida, 
        aciertos: this.aciertos,
        puntos: this.aciertos * 100
      }
    });

    dialogRef.afterClosed().subscribe((opcion: string) => {
      if (opcion === 'home') {
        this.resetearEstado();
        this.router.navigate(['/home']);
      } else if (opcion === 'reintentar') {
        this.resetearJuego();
      }
    });
  }

  // ========== NAVEGACIÓN Y REINICIO ==========

  volverHome(): void {
    if (this.juegoActivo && !this.juegoTerminado) {
      Swal.fire({
        title: '¿Salir del juego?',
        text: 'Se perderá el progreso de tu partida actual',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Continuar jugando'
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

  reiniciarJuego(): void {
    Swal.fire({
      title: '¿Reiniciar juego?',
      text: 'Se reiniciará el puntaje y las preguntas de la partida',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#8b5cf6',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, reiniciar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.resetearJuego();
      }
    });
  }

  resetearJuego(): void {
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

    this.cdr.markForCheck();
    this.cdr.detectChanges();
    this.appRef.tick();
  }

  private resetearEstado(): void {
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

  // ========== ESTILOS DE RESPUESTA ==========

  getClaseBoton(respuesta: string): string {
    if (!this.mostrarResultado) {
      return 'btn-primary';
    }

    const respuestaDecodificada = this.decodeHtml(respuesta).trim().toLowerCase();
    const correctaDecodificada = this.decodeHtml(this.preguntaActual?.correct_answer || '').trim().toLowerCase();

    if (respuestaDecodificada === correctaDecodificada) {
      return 'btn-success';
    }

    if (respuestaDecodificada === this.decodeHtml(this.respuestaSeleccionada || '').trim().toLowerCase()) {
      return 'btn-danger';
    }

    return 'btn-secondary';
  }
}
