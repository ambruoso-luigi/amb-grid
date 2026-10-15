import { bootstrapApplication } from '@angular/platform-browser';
import { AMB } from 'amb-grid';
import { AppComponent } from './app/app.component';

if (typeof AMB !== 'object' || AMB === null) {
  throw new Error('AMB Grid is unavailable');
}

bootstrapApplication(AppComponent).catch((error: unknown) => {
  console.error(error);
});
