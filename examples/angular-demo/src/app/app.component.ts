import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PortfolioGridComponent } from './portfolio/portfolio-grid.component';
import { AngularGettingStartedComponent } from './angular-getting-started/angular-getting-started.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PortfolioGridComponent, AngularGettingStartedComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {}
