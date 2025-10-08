import { Directive, ElementRef, Input, OnChanges, SimpleChanges, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appResaltarPosicion]',
  standalone: true
})
export class ResaltarPosicionDirective implements OnChanges {
  @Input() appResaltarPosicion!: number; // Posición del jugador (0-based index)
  
  private clasesAplicadas: string[] = [];
  
  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['appResaltarPosicion']) {
      this.actualizarEstilos();
    }
  }

  private actualizarEstilos() {
    // Remover todas las clases previas
    this.clasesAplicadas.forEach(clase => {
      this.renderer.removeClass(this.el.nativeElement, clase);
    });
    this.clasesAplicadas = [];
    
    const posicion = this.appResaltarPosicion;
    
    // Aplicar nuevas clases según la posición
    if (posicion === 0) {
      // Oro - Primer lugar
      this.agregarClase('posicion-oro');
      this.agregarClase('podium-position');
    } else if (posicion === 1) {
      // Plata - Segundo lugar
      this.agregarClase('posicion-plata');
      this.agregarClase('podium-position');
    } else if (posicion === 2) {
      // Bronce - Tercer lugar
      this.agregarClase('posicion-bronce');
      this.agregarClase('podium-position');
    }
  }
  
  private agregarClase(clase: string) {
    this.renderer.addClass(this.el.nativeElement, clase);
    this.clasesAplicadas.push(clase);
  }
}