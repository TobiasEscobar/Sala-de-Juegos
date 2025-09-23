import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-juegos-dialog',
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: './juegos-dialog.html',
  styleUrl: './juegos-dialog.css'
})
export class JuegosDialog {
  constructor(
    public dialogRef: MatDialogRef<JuegosDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  cerrar(opcion: string) {
    this.dialogRef.close(opcion);
  }
}
