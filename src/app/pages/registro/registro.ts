import { Component } from '@angular/core';
import { Supabase } from '../../services/supabase';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

//Manejo de errores
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialog } from '../../dialogs/error-dialog/error-dialog';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class Registro {
  usuarioForm: FormGroup;

  constructor(private supabaseService: Supabase, private fb: FormBuilder, private router: Router, private dialog: MatDialog) {
    this.usuarioForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(4)]],
      apellido: ['', [Validators.required, Validators.minLength(4)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }


  // mensajes auxiliares de validacion
  private validationMessages: { [key: string]: string } = {
    nombre: 'El nombre es obligatorio y debe tener mínimo 4 caracteres.',
    apellido: 'El apellido es obligatorio y debe tener mínimo 4 caracteres.',
    clave: 'Contraseña inválida: mínimo 6 caracteres.',
    email: 'Email inválido.'
  };

  // funcion auxiliar para verificacion del formulario
  private mostrarErroresFormulario() {
    for (const campo in this.usuarioForm.controls) {
      const control = this.usuarioForm.get(campo);
      if (control && control.invalid) {
        this.mostrarError(this.validationMessages[campo]);
        break; // solo muestra el primer error
      }
    }
  }

  // Mostrar dialogo de error
  mostrarError(mensaje: string) {
    this.dialog.open(ErrorDialog, {
      data: { message: mensaje },
    });
  }

  async crearUsuario() {
    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched(); // fuerza validación en todos los campos

      // 1️⃣ Si hay campos vacíos
      if (Object.values(this.usuarioForm.value).some(val => !val)) {
        this.mostrarError('Aún faltan campos por completar.');
      } else {
        // 2️⃣ Si están completos pero con errores (email invalido, contraseña corta, etc)
        this.mostrarErroresFormulario();
      }
      return;
    }

    const { email, password, nombre, apellido } = this.usuarioForm.value;

    try {
      const { data: user, error: authError } = await this.supabaseService.registrarUsuario(email, password);

      if (authError) {
        this.mostrarError(this.supabaseService['mapAuthError'](authError));
        return
      } 

      // 2. Si se creó bien, guardar datos adicionales en la tabla `usuarios`
      const nuevoUsuario = {
        nombre,
        apellido,
        email,
        user_id: user.user?.id // UID de Supabase
      };

      const { error: insertError } = await this.supabaseService.insertarUsuario(nuevoUsuario);

      if (insertError) {
        this.mostrarError('Error al guardar los datos del usuario en la base.');
        return;
      }
      // 3. Si todo fue bien, dirige al home
      console.log('Usuario registrado con éxito:', nuevoUsuario);
      this.router.navigate(['/home']);
    } catch (e: any) {
      this.mostrarError(e.message || 'Ocurrió un error inesperado.');
    }
  }
}