import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TenderCreate } from './tender-create';

describe('TenderCreate', () => {
  let component: TenderCreate;
  let fixture: ComponentFixture<TenderCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenderCreate],
    }).compileComponents();

    fixture = TestBed.createComponent(TenderCreate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
