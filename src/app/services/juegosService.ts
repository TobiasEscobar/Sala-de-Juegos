import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Supabase } from './supabase';

@Injectable({
    providedIn: 'root'
})
export class JuegosService {
    private empezarJuegoYa = new BehaviorSubject<boolean>(false);
    private tiempoDeJuego = new BehaviorSubject<number>(90);

    empezarJuego$ = this.empezarJuegoYa.asObservable();
    tiempoJuego$ = this.tiempoDeJuego.asObservable();

    constructor(private supabaseService: Supabase){}

    async guardarResultadoAhorcado(
        nombre: string,
        puntos: number,
        tiempo_jugado: number,
        cantidad_de_letras: number
        ) {
        const { data, error } = await this.supabaseService.supabase
        .from('rankings')
        .insert([{
            nombre,
            puntos,
            tiempo_jugado,
            fecha: new Date().toISOString(),
            datos_extras: { cantidad_de_letras },
            juego: 'ahorcado',
            tipo: 'puntuacion'
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
        tiempo_jugado: number,
        resultado_partida: string,
        intentos_fallidos: number
        ) {
        const { data, error } = await this.supabaseService.supabase
        .from('rankings')
        .insert([{
            nombre,
            puntos: aciertos, // Se guarda en puntos pero se muestra como aciertos, es solamente visual
            tiempo_jugado,
            fecha: new Date().toISOString(),
            datos_extras: {resultado_partida, intentos_fallidos},
            juego: 'mayor_o_menor',
            tipo: 'acierto'
        }]);

        if (error) {
            console.error("Error al guardar resultado:", error);
            return false;
        }
        return true;
    }

    async guardarResultadoJuegoPropio(
        nombre: string,
        puntos: number,
        tiempo_jugado: number,
        llego_maximo: string
        ) {
        const { data, error } = await this.supabaseService.supabase
        .from('rankings')
        .insert([{
            nombre,
            puntos,
            tiempo_jugado,
            fecha: new Date().toISOString(),
            datos_extras: { llego_maximo },
            juego: 'juego_propio',
            tipo: 'puntuacion'
        }]);

        if (error) {
            console.error("Error al guardar resultado:", error);
            return false;
        }
        return true;
    }

    async guardarResultadoPreguntados(
        nombre: string,
        aciertos: number,
        tiempo_jugado: number,
        ) {
        const { data, error } = await this.supabaseService.supabase
        .from('rankings')
        .insert([{
            nombre,
            puntos: aciertos, // Se guarda en puntos pero se muestra como aciertos, es solamente visual
            tiempo_jugado,
            fecha: new Date().toISOString(),
            datos_extras: null,
            juego: 'preguntados',
            tipo: 'acierto'
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

    async traerRankingPorJuego(juego: string) {
        const { data, error } = await this.supabaseService.supabase
            .from('rankings')
            .select('*')
            .eq('juego', juego)
            .order('puntos', { ascending: false })
            .order('tiempo_jugado', { ascending: true });

        if (error) {
            console.error(error);
            return [];
        }
        return data;
    }
}