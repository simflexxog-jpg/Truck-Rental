import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { RegisterComponent } from './register';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authService = jasmine.createSpyObj('AuthService', ['register']);
    authService.register.and.returnValue(of({
      id: 'user_1',
      email: 'test@example.com',
      entityName: 'Test User',
      role: 'customer',
      createdAt: new Date()
    }));

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show success and redirect to login after a successful registration', () => {
    component.registerData = {
      entityName: 'Test User',
      email: 'test@example.com',
      password: '123456',
      confirmPassword: '123456'
    };
    component.selectedRole = 'customer';

    component.onRegister();

    expect(component.successMessage).toContain('Account created successfully');
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { role: 'customer', registered: 'true' }
    });
  });
});
