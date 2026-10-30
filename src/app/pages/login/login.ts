import { Component, ChangeDetectorRef, signal } from '@angular/core';
import { Supabase } from '../../services/supabase';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialog } from '../../dialogs/error-dialog/error-dialog';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  loginForm: FormGroup;
  passwordVisible = false;
  isSubmitting = signal<boolean>(false);

  constructor(
    private authService: Supabase,
    private router: Router,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {
    // Definición reactiva del formulario
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  private validationMessages: { [key: string]: string } = {
    password: 'Contraseña incorrecta: recuerde que el mínimo es de 6 caracteres.',
    email: 'Email inválido o incorrecto.'
  };

  // Función auxiliar para verificación del formulario
  private showFormErrors(): void {
    for (const fieldName in this.loginForm.controls) {
      const control = this.loginForm.get(fieldName);
      if (control && control.invalid) {
        this.showErrorDialog(this.validationMessages[fieldName] || 'Por favor revise los campos.');
        break;
      }
    }
  }

  async onLogin(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();

      if (Object.values(this.loginForm.value).some((val) => !val)) {
        this.showErrorDialog('Aún faltan campos obligatorios por completar.');
      } else {
        this.showFormErrors();
      }
      return;
    }

    const { email, password } = this.loginForm.value;
    this.isSubmitting.set(true);
    this.cdr.markForCheck();

    try {
      await this.authService.login(email, password);
      console.log('Usuario autenticado con éxito:', email);
      this.isSubmitting.set(false);
      this.router.navigate(['/home']);
    } catch (err: any) {
      this.isSubmitting.set(false);
      this.cdr.markForCheck();
      this.showErrorDialog(err.message || 'Ocurrió un error inesperado al iniciar sesión.');
    }
  }

  // Muestra el diálogo modal de error
  showErrorDialog(message: string): void {
    this.dialog.open(ErrorDialog, {
      data: { message }
    });
  }

  // Acceso rápido para pruebas de cuentas preexistentes
  quickAccess(chosenOption: string): void {
    switch (chosenOption) {
      case 'emailYo':
        this.loginForm.setValue({ email: 'tobiasescobar@gmail.com', password: 'admin123' });
        break;
      case 'emailSofi':
        this.loginForm.setValue({ email: 'sofia@gmail.com', password: 'usuario123' });
        break;
      case 'emailSimba':
        this.loginForm.setValue({ email: 'tercerusuario@gmail.com', password: 'contraseñaSegura2' });
        break;
      default:
        console.warn('Opción de acceso rápido desconocida:', chosenOption);
        this.showErrorDialog('Ocurrió un error inesperado.');
    }
  }
}
