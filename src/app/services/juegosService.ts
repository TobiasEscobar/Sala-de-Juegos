import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Supabase } from './supabase';

@Injectable({
    providedIn: 'root'
})
export class JuegosService {
    private empezarJuegoYa = new BehaviorSubject<boolean>(false);
    private tiempoDeJuego = new BehaviorSubject<number>(60);

    empezarJuego$ = this.empezarJuegoYa.asObservable();
    tiempoJuego$ = this.tiempoDeJuego.asObservable();

    constructor(private supabaseService: Supabase){}

    async guardarResultadoAhorcado(
        nombre: string,
        puntos: number,
        tiempo_jugado: number,
        cantidad_de_letras: number,
        tipo: 'puntuacion'
    ) {
        const { data, error } = await this.supabaseService.supabase
        .from('ahorcado')
        .insert([{
        nombre,
        puntos,
        tiempo_jugado,
        cantidad_de_letras,
        fecha: new Date().toISOString(),
        tipo
        }]);

        if (error) {
        console.error("Error al guardar resultado:", error);
        return false;
        }
        return true;
    }

    async guardarResultadoMayorMenor(
        nombre: string,
        aciertos: number,
        tipo: 'acierto'
    ) {
        const { data, error } = await this.supabaseService.supabase
        .from('mayor_o_menor')
        .insert([{
        nombre,
        aciertos,
        fecha: new Date().toISOString(),
        tipo
        }]);

        if (error) {
        console.error("Error al guardar resultado:", error);
        return false;
        }
        return true;
    }


    async cargarCartas(){
        const data = await this.supabaseService.supabase.from('cartas').select('*');

        return data;
    }

    async traerPuntuacion(table:string){
        const {data} = await this.supabaseService.supabase
        .from(table)
        .select("*")
        .order("puntos",{ascending:false})

        return data
    }

    async traerAciertos(table:string) {
        const {data} = await this.supabaseService.supabase
        .from(table)
        .select("*")
        .order("aciertos",{ascending:false})

        return data
    }

    async traerRanking(table: string) {
        const { data, error } = await this.supabaseService.supabase
            .from(table)
            .select('*');
            // .order('puntos', { ascending: false });

        if (error) {
            console.error(error);
            return [];
        }
        return data;
    }

}
