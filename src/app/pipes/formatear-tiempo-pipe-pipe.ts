import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatearTiempo',
  standalone: true
})
export class FormatearTiempoPipe implements PipeTransform {
  transform(segundos: number): string {
    if (segundos === 0 || segundos === null || segundos === undefined) {
      return '-';
    }
    
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
