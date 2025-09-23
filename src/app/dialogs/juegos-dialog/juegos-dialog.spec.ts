import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JuegosDialog } from './juegos-dialog';

describe('JuegosDialog', () => {
  let component: JuegosDialog;
  let fixture: ComponentFixture<JuegosDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JuegosDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JuegosDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
