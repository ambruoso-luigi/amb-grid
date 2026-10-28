import { ChangeDetectionStrategy, Component } from '@angular/core';
import { copy, stepCode } from './angular-getting-started.content';

function highlight(code: string) {
  return code.split(/(\/\/[^\n]*|'[^'\n]*'|"[^"\n]*"|`[^`]*`|\b(?:const|let|if|return|private|void|as|typeof|new|false|null)\b|\bAMB\b|\b\d+\b|\b[A-Za-z_$][\w$]*(?=\())/g).map((text, index) => ({
    text,
    kind: text.startsWith('//') ? 'comment' : /^['"`]/.test(text) ? 'string'
      : text === 'AMB' ? 'api' : /^\d+$/.test(text) ? 'number'
        : /^(const|let|if|return|private|void|as|typeof|new|false|null)$/.test(text) ? 'keyword'
          : index % 2 === 1 ? 'function' : 'plain',
  }));
}

@Component({
  selector: 'app-angular-getting-started',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './angular-getting-started.component.css',
  template: `
    <section id="angular-getting-started" class="angular-start-guide" aria-labelledby="angular-start-title">
      <header>
        <p class="kicker">ANGULAR · TYPESCRIPT</p>
        <h2 id="angular-start-title"><span class="copy-it" lang="it">{{ copy.it.title }}</span><span class="copy-en" lang="en">{{ copy.en.title }}</span></h2>
        <p><span class="copy-it" lang="it">{{ copy.it.intro }}</span><span class="copy-en" lang="en">{{ copy.en.intro }}</span></p>
        <p class="install"><span class="copy-it" lang="it">{{ copy.it.installPrompt }}</span><span class="copy-en" lang="en">{{ copy.en.installPrompt }}</span>
          <a href="/install/"><span class="copy-it" lang="it">{{ copy.it.installLink }}</span><span class="copy-en" lang="en">{{ copy.en.installLink }}</span></a>
        </p>
      </header>
      <ol>
        @for (step of steps; track $index; let index = $index) {
          <li>
            <span class="number" aria-hidden="true">{{ index + 1 }}</span>
            <div class="step-body">
              <h3 [id]="'angular-start-step-' + index"><span class="copy-it" lang="it">{{ step.it.title }}</span><span class="copy-en" lang="en">{{ step.en.title }}</span></h3>
              <p><span class="copy-it" lang="it">{{ step.it.description }}</span><span class="copy-en" lang="en">{{ step.en.description }}</span></p>
              <p class="note"><span class="copy-it" lang="it">{{ step.it.note }}</span><span class="copy-en" lang="en">{{ step.en.note }}</span></p>
              @for (block of step.blocks; track $index) {
                <pre tabindex="0" [attr.aria-labelledby]="'angular-start-step-' + index"><code>@for (token of block; track $index) {<span [class]="'token-' + token.kind">{{ token.text }}</span>}</code></pre>
              }
            </div>
          </li>
        }
      </ol>
    </section>
  `,
})
export class AngularGettingStartedComponent {
  readonly copy = copy;
  readonly steps = copy.it.steps.map((it, index) => ({
    it, en: copy.en.steps[index]!, blocks: stepCode[index]!.map(highlight),
  }));
}
