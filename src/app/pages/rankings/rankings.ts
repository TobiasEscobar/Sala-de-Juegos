import { Component, OnInit, signal } from '@angular/core';
import { JuegosService } from '../../services/juegosService';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormatearTiempoPipe } from '../../pipes/formatear-tiempo-pipe-pipe';
import { ResaltarPosicionDirective } from '../../directives/resaltar-posicion-directive';

type TipoOrden = 'puntos_desc' | 'tiempo_asc' | 'fecha_desc';

@Component({
  selector: 'app-rankings',
  imports: [FormsModule, CommonModule, FormatearTiempoPipe, ResaltarPosicionDirective],
  standalone: true,
  templateUrl: './rankings.html',
  styleUrl: './rankings.css'
})
export class Rankings implements OnInit {
  juegoActual = signal<string>('ahorcado');
  esAciertos = signal<boolean>(false);
  ranking = signal<any>([]);
  ordenActual = signal<TipoOrden>('puntos_desc');

  constructor(private juegoService: JuegosService, private router: Router) {}

  ngOnInit(): void {
    this.traerRanking('ahorcado');
  }

  async traerRanking(juego: string) {
    this.juegoActual.set(juego);
    
    // Determinar si el juego usa aciertos o puntos
    this.esAciertos.set(juego === 'mayor_o_menor' || juego === 'preguntados');
    
    // Resetear orden al cambiar de juego
    this.ordenActual.set('puntos_desc');
    
    const data = await this.juegoService.traerRankingPorJuego(juego);
    this.ranking.set(data || []);
    this.aplicarOrden();
  }

  cambiarOrden(tipoOrden: TipoOrden) {
    this.ordenActual.set(tipoOrden);
    this.aplicarOrden();
  }

  aplicarOrden() {
    const data = [...this.ranking()];
    
    switch(this.ordenActual()) {
      case 'puntos_desc':
        // Ordenar por puntos descendente
        data.sort((a, b) => b.puntos - a.puntos);
        break;
        
      case 'tiempo_asc':
        // Ordenar por puntos descendente, pero si tienen mismos puntos, por menor tiempo
        data.sort((a, b) => {
          if (b.puntos === a.puntos) {
            // Si los tiempos son 0, van al final
            if (a.tiempo_jugado === 0) return 1;
            if (b.tiempo_jugado === 0) return -1;
            return a.tiempo_jugado - b.tiempo_jugado;
          }
          return b.puntos - a.puntos;
        });
        break;
        
      case 'fecha_desc':
        // Ordenar por fecha más reciente primero
        data.sort((a, b) => {
          const fechaA = new Date(a.fecha).getTime();
          const fechaB = new Date(b.fecha).getTime();
          return fechaB - fechaA;
        });
        break;
    }
    
    this.ranking.set(data);
  }

  getNombreJuego(juego: string): string {
    const nombres: { [key: string]: string } = {
      'ahorcado': 'AHORCADO',
      'mayor_o_menor': 'MAYOR O MENOR',
      'preguntados': 'PREGUNTADOS',
      'juego_propio': '1024'
    };
    return nombres[juego] || juego.toUpperCase();
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  volverHome() {
    this.router.navigate(['/home']);
  }
}