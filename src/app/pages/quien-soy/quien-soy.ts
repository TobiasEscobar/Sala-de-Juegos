import { Component, OnInit } from '@angular/core';
import { GithubService, GithubUser } from '../../services/github';
import { CommonModule } from '@angular/common';

import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-quien-soy',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quien-soy.html',
  styleUrl: './quien-soy.css'
})
export class QuienSoy implements OnInit {
  user?: any;
  loading = true;

  constructor(private github: GithubService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    console.log('ngOnInit ejecutado');
    this.loadUser();
  }


  private loadUser() {
    this.github.getUser('TobiasEscobar').subscribe({
      next: data => {
        this.user = data;
        this.loading = false;
        this.cdr.detectChanges(); // fuerza actualizacion del template
      },
      error: err => {
        console.error(err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
