import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

type SheetProps = {
  children: ReactNode;
  description: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
};

export function Sheet({ children, description, onOpenChange, open, title }: SheetProps) {
  return (
    <Dialog.Root onOpenChange={onOpenChange} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="react-sheet__overlay" />
        <Dialog.Content className="react-sheet__content">
          <div className="react-sheet__header">
            <div><Dialog.Title>{title}</Dialog.Title><Dialog.Description>{description}</Dialog.Description></div>
            <Dialog.Close aria-label="Chiudi payload" className="react-sheet__close"><X aria-hidden="true" size={18} /></Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
