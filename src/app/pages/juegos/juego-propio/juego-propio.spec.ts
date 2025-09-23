import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JuegoPropio } from './juego-propio';

describe('JuegoPropio', () => {
  let component: JuegoPropio;
  let fixture: ComponentFixture<JuegoPropio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JuegoPropio]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JuegoPropio);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
