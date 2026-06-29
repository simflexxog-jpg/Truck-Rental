import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddOnJobBoard } from './add-on-job-board';

describe('AddOnJobBoard', () => {
  let component: AddOnJobBoard;
  let fixture: ComponentFixture<AddOnJobBoard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddOnJobBoard],
    }).compileComponents();

    fixture = TestBed.createComponent(AddOnJobBoard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
