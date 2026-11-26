import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { AlertTriangle } from 'lucide-react';
import { Button } from './button';

type PartialSaveAlertProps = {
  language: 'it' | 'en';
  invalidCount: number;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  validCount: number;
};

export function PartialSaveAlert({ language, invalidCount, onConfirm, onOpenChange, open, validCount }: PartialSaveAlertProps) {
  const it = language === 'it';
  return (
    <AlertDialogPrimitive.Root onOpenChange={onOpenChange} open={open}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="react-alert__overlay" />
        <AlertDialogPrimitive.Content className="react-alert__content">
          <span className="react-alert__icon"><AlertTriangle aria-hidden="true" size={22} /></span>
          <AlertDialogPrimitive.Title>{it ? 'Alcune modifiche richiedono attenzione' : 'Some changes need attention'}</AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description>
            {it ? (validCount === 1 ? '1 modifica valida può essere salvata ora.' : `${validCount} modifiche valide possono essere salvate ora.`) : `${validCount} valid ${validCount === 1 ? 'change can' : 'changes can'} be saved now.`} {it ? (invalidCount === 1 ? '1 riga contiene errori e resterà da correggere.' : `${invalidCount} righe contengono errori e resteranno da correggere.`) : `${invalidCount} ${invalidCount === 1 ? 'row contains' : 'rows contain'} errors and will remain to be corrected.`}
          </AlertDialogPrimitive.Description>
          <div className="react-alert__actions">
            <AlertDialogPrimitive.Cancel asChild><Button variant="outline">{it ? 'Annulla' : 'Cancel'}</Button></AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action asChild><Button onClick={onConfirm}>{it ? `Salva ${validCount} ${validCount === 1 ? 'modifica valida' : 'modifiche valide'}` : `Save ${validCount} valid ${validCount === 1 ? 'change' : 'changes'}`}</Button></AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
