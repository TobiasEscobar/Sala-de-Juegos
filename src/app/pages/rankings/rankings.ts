import { Component, OnInit, signal } from '@angular/core';
import { JuegosService } from '../../services/juegosService';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-rankings',
  imports: [FormsModule],
  standalone: true,
  templateUrl: './rankings.html',
  styleUrl: './rankings.css'
})
export class Rankings {
  tipoPuntuacion: boolean;
  rankingActual : string;
  indice = 0;
  ranking = signal<any>([]);

  constructor(private juegoService : JuegosService, private router: Router)
  {
    this.rankingActual = "ahorcado";
    this.tipoPuntuacion = true;
  }

    ngOnInit(): void {
    this.traerRanking("puntuacion","ahorcado")
  }

  async traerRanking(tipo:string,tabla:string) {
    this.rankingActual = tabla;
    this.indice = 0;
    let data;
    if (tipo === "puntuacion")
    {
      this.tipoPuntuacion = true;
      data = await this.juegoService.traerPuntuacion(tabla)
    }
    else{
        data = await this.juegoService.traerAciertos(tabla)
        this.tipoPuntuacion = false;
    }
    this.ranking.set(data)
  }

  volverHome(){
    this.router.navigate(['/home']);
  }
}
