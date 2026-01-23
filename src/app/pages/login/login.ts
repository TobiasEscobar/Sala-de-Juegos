import { Component } from '@angular/core';
import { Supabase } from '../../services/supabase';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialog } from '../../dialogs/error-dialog/error-dialog';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  loginForm: FormGroup;
  passwordVisible = false;

  constructor(
    private authService: Supabase,
    private router: Router,
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {
    // Definición del formulario
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  private validationMessages: { [key: string]: string } = {
    password: 'Contraseña incorrecta: recuerde que el mínimo es de 6 caracteres.',
    email: 'Email inválido o incorrecto.'
  };

  // funcion auxiliar para verificacion del formulario
  private mostrarErroresFormulario() {
    for (const campo in this.loginForm.controls) {
      const control = this.loginForm.get(campo);
      if (control && control.invalid) {
        this.mostrarError(this.validationMessages[campo]);
        break; // solo muestra el primer error
      }
    }
  }

  async onLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched(); // fuerza validación en todos los campos

      // Si hay campos vacíos
      if (Object.values(this.loginForm.value).some(val => !val)) {
        this.mostrarError('Aún faltan campos por completar.');
      } else {
        this.mostrarErroresFormulario();
      }
      return;
    }

    const { email, password } = this.loginForm.value;

    try {
      await this.authService.login(email, password);

      console.log('Usuario loguedo con éxito:', email);
      this.router.navigate(['/home']);

    } catch (err: any) {
      this.mostrarError(err.message || 'Ocurrió un error inesperado.');
    }
  }

  // Mostrar dialogo de error
  mostrarError(mensaje: string) {
    this.dialog.open(ErrorDialog, {
      data: { message: mensaje },
    });
  }

  // Acceso rapido a cuentas de prueba
  quickAccess(opcionElegida: string) {
    switch (opcionElegida) {
      case "emailYo":
        this.loginForm.setValue({ email: 'tobiasescobar@gmail.com', password: 'admin123'});
        break;
      case "emailSofi":
        this.loginForm.setValue({ email: 'sofiaschettino@gmail.com', password: 'usuario123' });
        break;
      case "emailSimba":
        this.loginForm.setValue({ email: 'tercerusuario@gmail.com', password: 'contraseñaSegura2'});
        break;
      default:
        console.log("Hubo un error");
        this.mostrarError("Ocurrió un error inesperado.");
    }
  }
}
