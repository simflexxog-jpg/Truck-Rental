import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiChatbox } from './ai-chatbox';

describe('AiChatbox', () => {
  let component: AiChatbox;
  let fixture: ComponentFixture<AiChatbox>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiChatbox],
    }).compileComponents();

    fixture = TestBed.createComponent(AiChatbox);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
