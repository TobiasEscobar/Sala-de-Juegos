import { Injectable } from '@angular/core';
import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { Supabase } from './supabase';

/**
 * Representa la estructura de un mensaje del chat, coincidiendo con la tabla 'mensajes' de PostgreSQL.
 * Columnas: id, usuario, mensaje, fecha.
 */
export interface ChatMessage {
    id: number;
    usuario: string;
    mensaje: string;
    fecha?: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
    private realtimeChannel: RealtimeChannel | null = null;

    constructor(private supabaseService: Supabase) {}

    /**
     * Obtiene la instancia compartida de SupabaseClient con la sesión actual del usuario.
     */
    private get supabase(): SupabaseClient {
        return this.supabaseService.supabase;
    }

    /**
     * Obtiene todos los mensajes ordenados cronológicamente por fecha ascendente.
     */
    async getMessages(): Promise<ChatMessage[]> {
        const { data, error } = await this.supabase
            .from('mensajes')
            .select('*')
            .order('fecha', { ascending: true })
            .order('id', { ascending: true });

        if (error) {
            console.error('Error al obtener mensajes de Supabase:', error);
            throw error;
        }

        return (data || []) as ChatMessage[];
    }

    /**
     * Obtiene los últimos N mensajes ordenados cronológicamente (los más antiguos primero en la lista).
     * @param limit Cantidad de mensajes a recuperar (por defecto 50).
     */
    async getLatestMessages(limit: number = 50): Promise<ChatMessage[]> {
        const { data, error } = await this.supabase
            .from('mensajes')
            .select('*')
            .order('fecha', { ascending: false })
            .order('id', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error al obtener los últimos mensajes:', error);
            throw error;
        }

        const list = (data || []) as ChatMessage[];
        return list.reverse();
    }

    /**
     * Inserta un nuevo mensaje en la tabla 'mensajes' de Supabase y retorna el registro creado.
     * @param username Nombre del remitente.
     * @param messageText Contenido del mensaje.
     */
    async sendMessage(username: string, messageText: string): Promise<ChatMessage> {
        const cleanUser = username?.trim();
        const cleanMessage = messageText?.trim();

        if (!cleanUser) {
            throw new Error('El nombre de usuario es obligatorio.');
        }

        if (!cleanMessage) {
            throw new Error('El mensaje no puede estar vacío.');
        }

        // Se inserta usuario y mensaje. La columna fecha toma automáticamente DEFAULT now() en PostgreSQL
        const { data, error } = await this.supabase
            .from('mensajes')
            .insert([
                {
                    usuario: cleanUser,
                    mensaje: cleanMessage,
                    fecha: new Date().toISOString()
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error al insertar mensaje en la base de datos:', error);
            throw error;
        }

        return data as ChatMessage;
    }

    /**
     * Se suscribe al canal en tiempo real de la tabla 'mensajes' en el esquema público de Supabase.
     * Remueve suscripciones anteriores para evitar duplicados o fugas de memoria.
     * @param callback Función invocada cuando se recibe un evento postgres_changes (INSERT, UPDATE, DELETE).
     */
    subscribeRealtime(callback: (payload: any) => void): RealtimeChannel | null {
        try {
            // Limpiar cualquier canal previo existente
            this.unsubscribe();

            const channelTopic = `public:mensajes:${Date.now()}`;
            console.log('🔌 Conectando al canal de chat en tiempo real:', channelTopic);

            this.realtimeChannel = this.supabase
                .channel(channelTopic)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'mensajes'
                    },
                    (payload) => {
                        callback(payload);
                    }
                )
                .subscribe((status) => {
                    console.log('📡 Estado de conexión Realtime:', status);
                    if (status === 'SUBSCRIBED') {
                        console.log('✅ Conexión establecida con éxito al canal de chat');
                    } else if (status === 'CLOSED') {
                        console.log('❌ Canal Realtime cerrado');
                    } else if (status === 'CHANNEL_ERROR') {
                        console.error('❌ Error de canal en Realtime');
                    }
                });

            return this.realtimeChannel;
        } catch (error) {
            console.error('❌ Error al configurar suscripción Realtime:', error);
            return null;
        }
    }

    /**
     * Desuscribe y remueve el canal de Realtime del cliente de Supabase de manera limpia.
     */
    unsubscribe(): void {
        if (this.realtimeChannel) {
            console.log('🔌 Removiendo canal de chat Realtime...');
            try {
                this.supabase.removeChannel(this.realtimeChannel);
            } catch (error) {
                console.error('Error al remover el canal Realtime:', error);
            }
            this.realtimeChannel = null;
        }
    }

    // Aliases para compatibilidad hacia atrás
    async getMensajes(): Promise<ChatMessage[]> {
        return this.getMessages();
    }

    async getUltimosMensajes(cantidad: number = 50): Promise<ChatMessage[]> {
        return this.getLatestMessages(cantidad);
    }

    async enviarMensaje(usuario: string, mensaje: string): Promise<ChatMessage> {
        return this.sendMessage(usuario, mensaje);
    }

    suscribirRealtime(callback: (payload: any) => void): RealtimeChannel | null {
        return this.subscribeRealtime(callback);
    }

    desuscribir(): void {
        this.unsubscribe();
    }
}
