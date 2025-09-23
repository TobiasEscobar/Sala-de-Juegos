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

  mensajes = signal<any[]>([]);
  nuevoMensaje = '';
  usuarioActual: string | null = null;
  private userSub!: Subscription;
  private canal: any;

  constructor(
    private chatService: ChatService,
    private auth: AuthService
  ) {}

  async ngOnInit() {
    // usuario logueado
    this.userSub = this.auth.currentUser$.subscribe(user => {
      this.usuarioActual = user?.nombre || null;
    });

    // cargar historial
    const data = await this.chatService.getMensajes();
    this.mensajes.set(data);

    // suscripción en tiempo real
    this.canal = this.chatService.suscribir((nuevo) => {
      this.mensajes.update(msgs => [...msgs, nuevo]);
      this.scrollUltimo();
    });

    setTimeout(() => this.scrollUltimo(), 100);
  }

  ngOnDestroy() {
    this.userSub?.unsubscribe();
    if (this.canal) this.canal.unsubscribe();
  }

  async enviar() {
    if (!this.nuevoMensaje.trim() || !this.usuarioActual) return;

    await this.chatService.enviarMensaje(this.usuarioActual, this.nuevoMensaje);
    this.nuevoMensaje = '';
  }

  cerrarChat() {
    this.cerrar.emit();
  }

  private scrollUltimo() {
    const cont = document.querySelector('.chat-mensajes');
    if (cont) cont.scrollTop = cont.scrollHeight;
  }
}

