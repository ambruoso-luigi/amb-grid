import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { AlertTriangle } from 'lucide-react';
import { Button } from './button';

type PartialSaveAlertProps = {
  invalidCount: number;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  validCount: number;
};

export function PartialSaveAlert({ invalidCount, onConfirm, onOpenChange, open, validCount }: PartialSaveAlertProps) {
  return (
    <AlertDialogPrimitive.Root onOpenChange={onOpenChange} open={open}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="react-alert__overlay" />
        <AlertDialogPrimitive.Content className="react-alert__content">
          <span className="react-alert__icon"><AlertTriangle aria-hidden="true" size={22} /></span>
          <AlertDialogPrimitive.Title>Alcune modifiche richiedono attenzione</AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description>
            {validCount === 1 ? '1 modifica valida può essere salvata ora.' : `${validCount} modifiche valide possono essere salvate ora.`} {invalidCount === 1 ? '1 riga contiene errori e resterà pending.' : `${invalidCount} righe contengono errori e resteranno pending.`}
          </AlertDialogPrimitive.Description>
          <div className="react-alert__actions">
            <AlertDialogPrimitive.Cancel asChild><Button variant="outline">Annulla</Button></AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action asChild><Button onClick={onConfirm}>Salva {validCount} {validCount === 1 ? 'modifica valida' : 'modifiche valide'}</Button></AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
