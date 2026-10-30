import { Component, OnInit } from '@angular/core';
import { GithubService, GithubUser } from '../../services/github';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-quien-soy',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './quien-soy.html',
  styleUrl: './quien-soy.css'
})
export class QuienSoy implements OnInit {
  user?: any;
  loading = true;

  constructor(
    private githubService: GithubService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDeveloperProfile();
  }

  private loadDeveloperProfile(): void {
    this.githubService.getUser('TobiasEscobar').subscribe({
      next: (data) => {
        this.user = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al obtener perfil de GitHub:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
