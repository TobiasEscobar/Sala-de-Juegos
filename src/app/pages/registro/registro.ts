import { Component, ChangeDetectorRef, signal } from '@angular/core';
import { Supabase } from '../../services/supabase';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialog } from '../../dialogs/error-dialog/error-dialog';

// Validador a nivel de formulario para comprobar coincidencia de contraseñas
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
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class Registro {
  usuarioForm: FormGroup;
  isSubmitting = signal<boolean>(false);

  constructor(
    private supabaseService: Supabase,
    private fb: FormBuilder,
    private router: Router,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {
    this.usuarioForm = this.fb.group(
      {
        nombre: ['', [Validators.required, Validators.pattern(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/), Validators.minLength(4)]],
        apellido: ['', [Validators.required, Validators.pattern(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/), Validators.minLength(4)]],
        email: ['', [Validators.required, Validators.email]],
        edad: ['', [Validators.required, Validators.pattern(/^[0-9]{1,2}$/), Validators.min(8), Validators.max(99)]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        passwordConfirm: ['', [Validators.required, Validators.minLength(6)]]
      },
      { validators: passwordMatchValidator }
    );
  }

  // Mensajes auxiliares de validación sin emojis
  private validationMessages: { [key: string]: string } = {
    nombre: 'El nombre es obligatorio y debe tener mínimo 4 letras.',
    apellido: 'El apellido es obligatorio y debe tener mínimo 4 letras.',
    password: 'Contraseña inválida: mínimo 6 caracteres.',
    passwordConfirm: 'Las contraseñas no coinciden o tienen menos de 6 caracteres.',
    edad: 'La edad debe ser numérica, mayor a 8 y menor a 100.',
    email: 'Formato de correo electrónico inválido.'
  };

  // Función auxiliar para verificación de errores
  private showFormErrors(): void {
    for (const fieldName in this.usuarioForm.controls) {
      const control = this.usuarioForm.get(fieldName);
      if (control && control.invalid) {
        this.showErrorDialog(this.validationMessages[fieldName] || 'Por favor revise los campos.');
        break;
      }
    }
    if (this.usuarioForm.errors?.['passwordMismatch']) {
      this.showErrorDialog('Las contraseñas no coinciden.');
    }
  }

  // Mostrar diálogo de error
  showErrorDialog(message: string): void {
    this.dialog.open(ErrorDialog, {
      data: { message }
    });
  }

  async crearUsuario(): Promise<void> {
    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();

      if (Object.values(this.usuarioForm.value).some((val) => !val)) {
        this.showErrorDialog('Aún faltan campos obligatorios por completar.');
      } else {
        this.showFormErrors();
      }
      return;
    }

    const { email, password, nombre, apellido, edad } = this.usuarioForm.value;
    this.isSubmitting.set(true);
    this.cdr.markForCheck();

    try {
      // 1. Registrar usuario en Supabase Auth
      const { data: user, error: authError } = await this.supabaseService.registrarUsuario(email, password);

      if (authError) {
        this.isSubmitting.set(false);
        this.cdr.markForCheck();
        this.showErrorDialog(this.supabaseService.mapAuthError(authError));
        return;
      }

      // 2. Insertar perfil adicional en la tabla 'usuarios'
      const newUserData = {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: email.trim(),
        edad: Number(edad),
        user_id: user.user?.id
      };

      const { error: insertError } = await this.supabaseService.insertarUsuario(newUserData);

      if (insertError) {
        console.error('Error insertando usuario en tabla:', insertError);
        this.isSubmitting.set(false);
        this.cdr.markForCheck();
        this.showErrorDialog('Usuario creado en autenticación, pero ocurrió un error al guardar los datos de perfil.');
        return;
      }

      console.log('Usuario registrado con éxito:', newUserData);
      this.isSubmitting.set(false);
      this.router.navigate(['/home']);
    } catch (e: any) {
      this.isSubmitting.set(false);
      this.cdr.markForCheck();
      this.showErrorDialog(e.message || 'Ocurrió un error inesperado al registrar el usuario.');
    }
  }
}
