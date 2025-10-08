import { Injectable, inject } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ChatService {
    private supabase: SupabaseClient;
    private realtimeChannel: any = null;

    constructor() {
        // Crear cliente con configuración específica para realtime
        this.supabase = createClient(
            environment.SUPABASE_URL, 
            environment.SUPABASE_ANON_KEY,
            {
                auth: {
                    persistSession: true,    // Mantener sesión para usuarios logueados
                    autoRefreshToken: true,  // Renovar token automáticamente
                },
                realtime: {
                    params: {
                        eventsPerSecond: 10,  // Permitir hasta 10 eventos por segundo para chat
                    },
                },
            }
        );
    }

    // Obtener todos los mensajes ordenados por fecha
    async getMensajes() {
        const { data, error } = await this.supabase
            .from('mensajes')
            .select('*')
            .order('fecha', { ascending: true });

        if (error) {
            console.error('Error obteniendo mensajes:', error);
            throw error;
        }
        
        return data || [];
    }

    // Enviar un nuevo mensaje
    async enviarMensaje(usuario: string, mensaje: string) {
        const { data, error } = await this.supabase
            .from('mensajes')
            .insert([
                {
                    usuario,
                    mensaje,
                    fecha: new Date().toISOString()
                }
            ])
            .select()
            .single();
        
        if (error) {
            console.error('Error enviando mensaje:', error);
            throw error;
        }
        
        return data;
    }

    // Suscribirse a cambios en tiempo real de la tabla mensajes
    suscribirRealtime(callback: (payload: any) => void) {
        try {
            // Si ya hay un canal, desuscribirse primero
            if (this.realtimeChannel) {
                this.realtimeChannel.unsubscribe();
            }

            console.log('🔌 Conectando al canal de mensajes...');
            
            // Crear canal con nombre único
            this.realtimeChannel = this.supabase
                .channel('public:mensajes') // Nombre del canal
                .on(
                    'postgres_changes',
                    { 
                        event: '*',           // Escuchar todos los eventos (INSERT, UPDATE, DELETE)
                        schema: 'public', 
                        table: 'mensajes' 
                    },
                    (payload) => {
                        // Llamar al callback cuando llegue un evento
                        callback(payload);
                    }
                )
                .subscribe((status) => {
                    console.log('📡 Estado de conexión realtime:', status);
                    
                    if (status === 'SUBSCRIBED') {
                        console.log('✅ Conectado al canal de mensajes en tiempo real');
                    } else if (status === 'CLOSED') {
                        console.log('❌ Canal cerrado');
                    } else if (status === 'CHANNEL_ERROR') {
                        console.error('❌ Error en el canal');
                    }
                });

            return this.realtimeChannel;
        } catch (error) {
            console.error('❌ Error configurando realtime:', error);
            throw error;
        }
    }

    // Desuscribirse del canal de realtime
    desuscribir() {
        if (this.realtimeChannel) {
            console.log('🔌 Desconectando del canal...');
            this.realtimeChannel.unsubscribe();
            this.realtimeChannel = null;
        }
    }

    // Método auxiliar para obtener los últimos N mensajes (útil para optimización)
    async getUltimosMensajes(cantidad: number = 10) {
        const { data, error } = await this.supabase
            .from('mensajes')
            .select('*')
            .order('fecha', { ascending: false })
            .limit(cantidad);

        if (error) {
            console.error('Error obteniendo últimos mensajes:', error);
            throw error;
        }
        
        // Revertir el orden para mostrar los más antiguos primero
        return (data || []).reverse();
    }
}