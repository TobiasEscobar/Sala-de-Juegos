import {
  Component,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
  signal,
  ViewChild,
  ElementRef,
  inject,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatService, ChatMessage } from '../../services/chatService';
import { AuthService } from '../../services/auth';
import { User } from '../../clases/user';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './chat.html',
  styleUrls: ['./chat.css']
})
export class Chat implements OnInit, OnDestroy {
  @Output() closeChat = new EventEmitter<void>();
  @Output() cerrar = new EventEmitter<void>();

  @ViewChild('messagesContainer') private messagesContainer?: ElementRef<HTMLDivElement>;

  // Signals y propiedades de estado en inglés
  messages = signal<ChatMessage[]>([]);
  newMessage = '';
  currentUsername: string | null = null;
  currentUser: User | null = null;
  isSending = false;

  private userSubscription?: Subscription;
  private pollingIntervalId: any = null;
  private cdr = inject(ChangeDetectorRef);

  constructor(
    private chatService: ChatService,
    private authService: AuthService
  ) {}

  // Aliases de compatibilidad hacia atrás
  get mensajes() {
    return this.messages;
  }

  get nuevoMensaje(): string {
    return this.newMessage;
  }

  set nuevoMensaje(value: string) {
    this.newMessage = value;
  }

  get usuarioActual(): string | null {
    return this.currentUsername;
  }

  set usuarioActual(value: string | null) {
    this.currentUsername = value;
  }

  get enviandoMensaje(): boolean {
    return this.isSending;
  }

  set enviandoMensaje(value: boolean) {
    this.isSending = value;
  }

  async ngOnInit(): Promise<void> {
    // 1. Obtener usuario inicial sincrónico si ya existe
    const cachedUser = this.authService.getCurrentUser();
    if (cachedUser) {
      this.updateUserContext(cachedUser);
    }

    // 2. Suscribirse a cambios en el usuario autenticado
    this.userSubscription = this.authService.currentUser$.subscribe((user) => {
      this.updateUserContext(user);
    });

    // 3. Si no hay usuario cargado aún, intentar cargarlo desde la sesión de Supabase
    if (!this.currentUsername) {
      try {
        const loadedUser = await this.authService.loadUserFromSession();
        if (loadedUser) {
          this.updateUserContext(loadedUser);
        }
      } catch (error) {
        console.warn('No se pudo cargar usuario desde sesión en chat:', error);
      }
    }

    // 4. Cargar el historial inicial de mensajes
    await this.loadInitialMessages();

    // 5. Configurar conexión en tiempo real
    this.setupRealtime();

    // 6. Activar sondeo (polling) de respaldo periódico cada 4 segundos
    this.startPolling();

    // 7. Desplazar hacia abajo al cargar
    setTimeout(() => this.scrollToBottom(), 100);
  }

  ngOnDestroy(): void {
    // Limpieza de suscripciones y recursos al cerrar el componente
    this.userSubscription?.unsubscribe();
    this.chatService.unsubscribe();
    this.stopPolling();
  }

  /**
   * Actualiza las referencias locales del usuario y asigna un nombre para mostrar.
   */
  private updateUserContext(user: User | null): void {
    this.currentUser = user;
    if (user) {
      const candidateName = user.nombre?.trim() || user.name?.trim();
      const candidateEmail = user.email?.trim();
      this.currentUsername = candidateName || (candidateEmail ? candidateEmail.split('@')[0] : 'Usuario');
    } else {
      this.currentUsername = null;
    }
    this.cdr.markForCheck();
  }

  /**
   * Carga los mensajes más recientes desde la base de datos de Supabase.
   */
  async loadInitialMessages(): Promise<void> {
    try {
      console.log('📥 Cargando mensajes del chat...');
      const loadedMessages = await this.chatService.getLatestMessages(50);
      this.messages.set(loadedMessages);
      console.log(`✅ ${loadedMessages.length} mensajes cargados`);
      setTimeout(() => this.scrollToBottom(), 50);
    } catch (error) {
      console.error('❌ Error al cargar mensajes iniciales:', error);
    }
  }

  /**
   * Configura la escucha de eventos en tiempo real (INSERT, UPDATE, DELETE).
   */
  private setupRealtime(): void {
    try {
      this.chatService.subscribeRealtime((payload: any) => {
        const eventType = payload.eventType;

        if (eventType === 'INSERT' && payload.new) {
          const incomingMessage: ChatMessage = payload.new;
          this.messages.update((existingList) => {
            const alreadyExists = existingList.some((m) => m.id === incomingMessage.id);
            if (!alreadyExists) {
              const updatedList = [...existingList, incomingMessage];
              setTimeout(() => this.scrollToBottom(), 50);
              return updatedList;
            }
            return existingList;
          });
          this.cdr.markForCheck();
        } else if (eventType === 'UPDATE' && payload.new) {
          const updatedMessage: ChatMessage = payload.new;
          this.messages.update((existingList) =>
            existingList.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
          );
          this.cdr.markForCheck();
        } else if (eventType === 'DELETE' && payload.old) {
          const deletedId = payload.old.id;
          this.messages.update((existingList) =>
            existingList.filter((m) => m.id !== deletedId)
          );
          this.cdr.markForCheck();
        }
      });
    } catch (error) {
      console.error('❌ Error configurando realtime en el componente chat:', error);
    }
  }

  /**
   * Inicia un sondeo periódico cada 4 segundos como respaldo en caso de que
   * la publicación de Realtime en PostgreSQL esté deshabilitada o desconectada.
   */
  private startPolling(): void {
    this.stopPolling();
    this.pollingIntervalId = setInterval(async () => {
      try {
        const latest = await this.chatService.getLatestMessages(50);
        if (latest && latest.length > 0) {
          this.messages.update((current) => {
            const currentIds = new Set(current.map((m) => m.id));
            const newEntries = latest.filter((m) => !currentIds.has(m.id));

            if (newEntries.length > 0) {
              const merged = [...current, ...newEntries].sort((a, b) => {
                const dateA = a.fecha ? new Date(a.fecha).getTime() : 0;
                const dateB = b.fecha ? new Date(b.fecha).getTime() : 0;
                return dateA - dateB || a.id - b.id;
              });
              setTimeout(() => this.scrollToBottom(), 50);
              return merged;
            }
            return current;
          });
          this.cdr.markForCheck();
        }
      } catch {
        // Manejo silencioso en sondeo para no saturar consola
      }
    }, 4000);
  }

  /**
   * Detiene el intervalo de sondeo.
   */
  private stopPolling(): void {
    if (this.pollingIntervalId) {
      clearInterval(this.pollingIntervalId);
      this.pollingIntervalId = null;
    }
  }

  /**
   * Envía un mensaje a la base de datos de Supabase.
   */
  async sendMessage(): Promise<void> {
    const trimmedMessage = this.newMessage.trim();

    if (!trimmedMessage || !this.currentUsername || this.isSending) {
      return;
    }

    if (trimmedMessage.length > 80) {
      alert('El mensaje no puede superar los 80 caracteres.');
      return;
    }

    this.isSending = true;
    const pendingText = trimmedMessage;
    this.newMessage = ''; // Limpiar el input inmediatamente para una interfaz más ágil

    try {
      console.log('📤 Enviando mensaje al servidor...');
      const savedMessage = await this.chatService.sendMessage(this.currentUsername, pendingText);

      // Inserción directa e inmediata en la vista sin depender exclusivamente de Realtime
      if (savedMessage) {
        this.messages.update((currentList) => {
          if (!currentList.some((m) => m.id === savedMessage.id)) {
            const updated = [...currentList, savedMessage];
            setTimeout(() => this.scrollToBottom(), 50);
            return updated;
          }
          return currentList;
        });
        this.cdr.markForCheck();
      }
      console.log('✅ Mensaje guardado y renderizado con éxito');
    } catch (error) {
      console.error('❌ Error al enviar el mensaje:', error);
      this.newMessage = pendingText; // Restaurar texto si falló
      alert('Error al enviar el mensaje. Intenta nuevamente.');
    } finally {
      this.isSending = false;
      this.cdr.markForCheck();
    }
  }

  /**
   * Determina si un mensaje pertenece al usuario actual para aplicar los estilos de burbuja correspondiente.
   */
  isMyMessage(message: ChatMessage): boolean {
    if (!message || !this.currentUsername) {
      return false;
    }

    const sender = (message.usuario || '').trim().toLowerCase();
    const currentName = (this.currentUsername || '').trim().toLowerCase();
    const currentEmail = (this.currentUser?.email || '').trim().toLowerCase();

    return sender === currentName || (currentEmail !== '' && sender === currentEmail);
  }

  /**
   * Desplaza el contenedor del chat hasta el último mensaje.
   */
  scrollToBottom(): void {
    try {
      if (this.messagesContainer?.nativeElement) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      } else if (typeof document !== 'undefined') {
        const element = document.querySelector('.chat-mensajes') as HTMLElement;
        if (element) {
          element.scrollTop = element.scrollHeight;
        }
      }
    } catch (error) {
      console.warn('Error al hacer scroll:', error);
    }
  }

  /**
   * Cierra la ventana del chat emitiendo el evento correspondiente.
   */
  close(): void {
    this.closeChat.emit();
    this.cerrar.emit();
  }

  // Aliases en español para llamadas directas
  enviar(): Promise<void> {
    return this.sendMessage();
  }

  cerrarChat(): void {
    this.close();
  }

  scrollUltimo(): void {
    this.scrollToBottom();
  }
}
