import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuienSoy } from './quien-soy';

describe('QuienSoy', () => {
  let component: QuienSoy;
  let fixture: ComponentFixture<QuienSoy>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuienSoy]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuienSoy);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
