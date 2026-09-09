import { AMB } from 'amb-grid';
import 'amb-grid/style.css';

export const isAmbGridPackageReady = typeof AMB.table === 'function';
export { AMB };
