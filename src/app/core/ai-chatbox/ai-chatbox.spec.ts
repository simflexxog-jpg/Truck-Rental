import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiChatboxComponent } from './ai-chatbox';

describe('AiChatbox', () => {
  let component: AiChatboxComponent;
  let fixture: ComponentFixture<AiChatboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiChatboxComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AiChatboxComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
