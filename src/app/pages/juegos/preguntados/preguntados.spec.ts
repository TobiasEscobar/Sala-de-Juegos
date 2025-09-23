import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Preguntados } from './preguntados';

describe('Preguntados', () => {
  let component: Preguntados;
  let fixture: ComponentFixture<Preguntados>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Preguntados]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Preguntados);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
