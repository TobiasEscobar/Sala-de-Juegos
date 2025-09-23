import { Component } from '@angular/core';
import { Supabase } from '../../services/supabase';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router } from '@angular/router';

//Manejo de errores
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialog } from '../../dialogs/error-dialog/error-dialog';

// Validator a nivel de FormGroup
export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const passwordConfirm = control.get('passwordConfirm')?.value;

  if (password && passwordConfirm && password !== passwordConfirm) {
    return { passwordMismatch: true };
  }
  return null;
};

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
      nombre: ['', [Validators.required, Validators.pattern(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/), Validators.minLength(4)]],
      apellido: ['', [Validators.required, Validators.pattern(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/), Validators.minLength(4)]],
      email: ['', [Validators.required, Validators.email]],
      edad: ['', [Validators.required, Validators.pattern(/^[0-9]$/), Validators.maxLength(2), Validators.min(8), Validators.max(99)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      passwordConfirm: ['', [Validators.required, Validators.minLength(6)]]
    }, { validators: passwordMatchValidator });
  }

  // mensajes auxiliares de validacion
  private validationMessages: { [key: string]: string } = {
    nombre: 'El nombre es obligatorio y debe tener mínimo 4 caracteres.',
    apellido: 'El apellido es obligatorio y debe tener mínimo 4 caracteres.',
    password: 'Contraseña inválida: mínimo 6 caracteres o no hay coincidencia',
    passwordConfirm: 'Contraseña inválida: minimo 6 caracteres o no coincidencia',
    edad: 'Ingrese su edad en numeros y debe ser mayor a 8 y menor a 100.',
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
      if (this.usuarioForm.errors?.['passwordMismatch']) {
        this.mostrarError('Las contraseñas no coinciden.');
        return;
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

    const { email, password, passwordConfirm, nombre, apellido, edad } = this.usuarioForm.value;

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
        edad,
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