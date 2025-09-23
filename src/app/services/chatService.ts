import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class ChatService {
    private supabase = inject(SupabaseClient);

    // Traer mensajes iniciales
    async getMensajes() {
        const { data, error } = await this.supabase
        .from('mensajes')
        .select('*')
        .order('fecha', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    // Enviar un mensaje
    async enviarMensaje(usuario: string, mensaje: string) {
        const { error } = await this.supabase.from('mensajes').insert([
        {
            usuario,
            mensaje,
            fecha: new Date().toISOString()
        }
        ]);
        if (error) throw error;
    }

    // Suscripción a mensajes en tiempo real
    suscribir(callback: (nuevo: any) => void) {
        return this.supabase
        .channel('mensajes-ch')
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'mensajes' },
            (payload) => callback(payload.new)
        )
        .subscribe();
    }
}