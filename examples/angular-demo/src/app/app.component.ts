import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="bootstrap-screen">
      <h1>{{ title() }}</h1>
      <p>{{ stack() }}</p>
      <p>{{ library() }}</p>
    </main>
  `,
})
export class AppComponent {
  readonly title = signal('Live Multi-Asset Portfolio');
  readonly stack = signal('Angular + TypeScript');
  readonly library = signal('AMB Grid');
}
