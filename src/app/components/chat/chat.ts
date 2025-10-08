import { Component, OnInit, OnDestroy, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chatService';
import { AuthService } from '../../services/auth';
import { Subscription } from 'rxjs';
import { User } from '../../clases/user';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './chat.html',
  styleUrls: ['./chat.css']
})
export class Chat implements OnInit, OnDestroy {
  @Output() cerrar = new EventEmitter<void>();

  // Signals para manejo reactivo del estado
  mensajes = signal<any[]>([]);
  nuevoMensaje = '';
  usuarioActual: string | null = null;
  enviandoMensaje = false;
  
  private userSub!: Subscription;
  private realtimeChannel: any = null;

  constructor(
    private chatService: ChatService,
    private auth: AuthService
  ) {}

  async ngOnInit() {
    // Obtener usuario logueado
    this.userSub = this.auth.currentUser$.subscribe(user => {
      this.usuarioActual = user?.nombre || null;
    });

    // Cargar historial de mensajes
    await this.cargarMensajesIniciales();
    
    // Configurar realtime DESPUÉS de cargar mensajes iniciales
    this.setupRealtime();

    // Scroll al último mensaje después de un pequeño delay
    setTimeout(() => this.scrollUltimo(), 100);
  }

  ngOnDestroy() {
    // Limpiar suscripciones
    this.userSub?.unsubscribe();
    
    // Desuscribirse del canal de realtime
    if (this.realtimeChannel) {
      console.log('🔌 Desconectando del canal de chat...');
      this.realtimeChannel.unsubscribe();
    }
  }

  private async cargarMensajesIniciales() {
    try {
      console.log('📥 Cargando mensajes iniciales...');
      const data = await this.chatService.getUltimosMensajes();
      this.mensajes.set(data);
      console.log(`✅ ${data.length} mensajes cargados`);
    } catch (error) {
      console.error('❌ Error cargando mensajes:', error);
    }
  }

  private setupRealtime() {
    try {
      console.log('🔄 Configurando realtime para mensajes...');
      
      this.realtimeChannel = this.chatService.suscribirRealtime((payload: any) => {
        console.log('📡 Evento realtime recibido:', payload);
        const eventType = payload.eventType;

        // Manejo de INSERT - nuevo mensaje
        if (eventType === 'INSERT') {
          const nuevoMensaje = payload.new;
          console.log('➕ Nuevo mensaje:', nuevoMensaje);
          
          if (nuevoMensaje) {
            // Actualizar signal agregando el nuevo mensaje
            this.mensajes.update((msgs) => {
              // Verificar que no esté duplicado
              const existe = msgs.find(m => m.id === nuevoMensaje.id);
              if (!existe) {
                const nuevaLista = [...msgs, nuevoMensaje];
                // Scroll después de actualizar
                setTimeout(() => this.scrollUltimo(), 50);
                return nuevaLista;
              }
              return msgs;
            });
          }
        }

        // Manejo de UPDATE - mensaje editado (si implementas edición)
        if (eventType === 'UPDATE') {
          const mensajeActualizado = payload.new;
          console.log('✏️ Mensaje actualizado:', mensajeActualizado);
          
          if (mensajeActualizado) {
            this.mensajes.update((msgs) =>
              msgs.map((m) => m.id === mensajeActualizado.id ? mensajeActualizado : m)
            );
          }
        }

        // Manejo de DELETE - mensaje eliminado (si implementas eliminación)
        if (eventType === 'DELETE') {
          const mensajeEliminado = payload.old;
          console.log('🗑️ Mensaje eliminado:', mensajeEliminado);
          
          if (mensajeEliminado) {
            this.mensajes.update((msgs) => 
              msgs.filter((m) => m.id !== mensajeEliminado.id)
            );
          }
        }
      });
    } catch (error) {
      console.error('❌ Error configurando realtime:', error);
    }
  }

  async enviar() {
    if (!this.nuevoMensaje.trim() || !this.usuarioActual || this.enviandoMensaje) {
      return;
    }

    // 🔒 Validar largo máximo
    if (this.nuevoMensaje.length > 80) {
      alert('El mensaje no puede superar los 80 caracteres.');
      return;
    }

    this.enviandoMensaje = true;
    const mensajeTemp = this.nuevoMensaje;
    this.nuevoMensaje = ''; // Limpiar input inmediatamente para mejor UX

    try {
      console.log('📤 Enviando mensaje...');
      await this.chatService.enviarMensaje(this.usuarioActual, mensajeTemp);
      console.log('✅ Mensaje enviado');
      // El mensaje aparecerá automáticamente vía realtime
    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      this.nuevoMensaje = mensajeTemp; // Restaurar mensaje si hay error
      alert('Error al enviar el mensaje. Intenta de nuevo.');
    } finally {
      this.enviandoMensaje = false;
    }
  }

  cerrarChat() {
    this.cerrar.emit();
  }

  private scrollUltimo() {
    const container = document.querySelector('.chat-mensajes');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }
}