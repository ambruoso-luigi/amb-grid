import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { readDemoLanguage } from '../../../../src/demo/demo-language-switch.js';
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
export class AppComponent {
  readonly language = signal<'it' | 'en'>(readDemoLanguage());

  constructor() {
    const updateLanguage = (event: Event) => {
      const language = (event as CustomEvent<{ language?: string }>).detail?.language;
      if (language === 'it' || language === 'en') this.language.set(language);
    };
    window.addEventListener('amb-demo-language-change', updateLanguage);
    inject(DestroyRef).onDestroy(() => window.removeEventListener('amb-demo-language-change', updateLanguage));
  }
}
