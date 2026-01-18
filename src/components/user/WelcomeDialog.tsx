'use client';

import { useState } from 'react';
import { useCurrentUser } from '@/lib/hooks/useUser';
import { userService } from '@/lib/services/userService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { SparklesIcon } from 'lucide-react';

export function WelcomeDialog() {
  const { data: currentUser, refetch } = useCurrentUser();
  const [customName, setCustomName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mostrar solo si es primera vez (no tiene customDisplayName)
  const showDialog = currentUser && !currentUser.customDisplayName;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !customName.trim()) {
      toast.error('Por favor, introduce tu nombre');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await userService.updateUser(currentUser.id, {
        customDisplayName: customName.trim(),
      });
      
      toast.success('¡Bienvenido/a! Tu perfil ha sido configurado');
      await refetch();
    } catch (error) {
      console.error('Error updating name:', error);
      toast.error('Error al guardar tu nombre');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showDialog) return null;

  return (
    <Dialog open={showDialog} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <SparklesIcon className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            ¡Bienvenido/a a Rat-Ing! 🎬
          </DialogTitle>
          <DialogDescription className="text-center">
            Para empezar, cuéntanos cómo te llamas
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="customName">Tu nombre</Label>
            <Input
              id="customName"
              placeholder="¿Cómo quieres que te llamemos?"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              disabled={isSubmitting}
              autoFocus
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              Este nombre aparecerá en tus valoraciones y estadísticas
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !customName.trim()}
          >
            {isSubmitting ? 'Guardando...' : 'Continuar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}