import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PortfolioGridComponent } from './portfolio/portfolio-grid.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PortfolioGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {}
