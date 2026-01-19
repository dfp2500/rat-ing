// src/app/(app)/settings/page.tsx

'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/hooks/useUser';
import { userService } from '@/lib/services/userService';
import { signOut } from '@/lib/firebase/auth';
import { getUserDisplayName, getUserInitials } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  ArrowLeftIcon, 
  UserIcon, 
  CameraIcon,
  LogOutIcon,
  Loader2Icon,
  ImageIcon 
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { data: currentUser, refetch } = useCurrentUser();
  const [customName, setCustomName] = useState(currentUser?.customDisplayName || '');
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateName = async () => {
    if (!currentUser || !customName.trim()) {
      toast.error('Por favor, introduce un nombre válido');
      return;
    }

    setIsUpdatingName(true);
    
    try {
      await userService.updateUser(currentUser.id, {
        customDisplayName: customName.trim(),
      });
      
      toast.success('Nombre actualizado correctamente');
      await refetch();
    } catch (error) {
      console.error('Error updating name:', error);
      toast.error('Error al actualizar el nombre');
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    // Validar tamaño (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 2MB');
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error('El archivo debe ser una imagen');
      return;
    }

    setIsUpdatingPhoto(true);

    try {
      // Convertir a base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        await userService.updateUser(currentUser.id, {
          photoURL: base64String,
        });
        
        toast.success('Foto de perfil actualizada');
        await refetch();
        setIsUpdatingPhoto(false);
      };
      
      reader.onerror = () => {
        toast.error('Error al leer la imagen');
        setIsUpdatingPhoto(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error updating photo:', error);
      toast.error('Error al actualizar la foto');
      setIsUpdatingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!currentUser) return;
    
    if (!confirm('¿Seguro que quieres eliminar tu foto de perfil?')) return;

    setIsUpdatingPhoto(true);
    try {
      await userService.updateUser(currentUser.id, {
        photoURL: undefined,
      });
      
      toast.success('Foto de perfil eliminada');
      await refetch();
    } catch (error) {
      console.error('Error removing photo:', error);
      toast.error('Error al eliminar la foto');
    } finally {
      setIsUpdatingPhoto(false);
    }
  };

  const handleSignOut = async () => {
    if (confirm('¿Seguro que quieres cerrar sesión?')) {
      await signOut();
      router.push('/login');
    }
  };

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayName = getUserDisplayName(currentUser);
  const initials = getUserInitials(currentUser);
  const hasCustomName = currentUser.customDisplayName !== undefined;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Configuración</h1>
              <p className="text-sm text-muted-foreground">
                Personaliza tu perfil
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 space-y-6">
        {/* Foto de perfil */}
        <Card>
          <CardHeader>
            <CardTitle>Foto de perfil</CardTitle>
            <CardDescription>
              Cambia tu foto de perfil. Tamaño máximo 2MB.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              {/* Avatar */}
              <div className="relative mx-auto sm:mx-0">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={currentUser.photoURL} alt={displayName} />
                  <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                </Avatar>
                {isUpdatingPhoto && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <Loader2Icon className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
              </div>

              {/* Botones - Stack vertical en móvil */}
              <div className="flex-1 space-y-3 w-full sm:w-auto">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                  disabled={isUpdatingPhoto}
                />
                
                {/* Botones apilados verticalmente en móvil, horizontal en desktop */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={handlePhotoClick}
                    disabled={isUpdatingPhoto}
                    className="w-full sm:w-auto"
                  >
                    <CameraIcon className="h-4 w-4 mr-2" />
                    Cambiar foto
                  </Button>
                  {currentUser.photoURL && (
                    <Button
                      variant="outline"
                      onClick={handleRemovePhoto}
                      disabled={isUpdatingPhoto}
                      className="w-full sm:w-auto"
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground text-center sm:text-left">
                  JPG, PNG o GIF. Máximo 2MB.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nombre personalizado */}
        <Card>
          <CardHeader>
            <CardTitle>Nombre personalizado</CardTitle>
            <CardDescription>
              Este nombre aparecerá en tus valoraciones y estadísticas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customName">Tu nombre</Label>
              <div className="flex gap-2">
                <Input
                  id="customName"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Ej: David"
                  maxLength={50}
                  disabled={isUpdatingName}
                />
                <Button
                  onClick={handleUpdateName}
                  disabled={
                    isUpdatingName || 
                    !customName.trim() ||
                    customName.trim() === currentUser.customDisplayName
                  }
                >
                  {isUpdatingName ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    'Guardar'
                  )}
                </Button>
              </div>
              {!hasCustomName && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  ⚠️ Aún no has configurado tu nombre personalizado
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info de cuenta */}
        <Card>
          <CardHeader>
            <CardTitle>Información de cuenta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm font-medium">{currentUser.email}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Rol</span>
              <span className="text-sm font-medium">
                {currentUser.role === 'user_1' ? 'Usuario 1' : 'Usuario 2'}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Miembro desde</span>
              <span className="text-sm font-medium">
                {currentUser.createdAt.toDate().toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Cerrar sesión */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Cerrar sesión</CardTitle>
            <CardDescription>
              Salir de tu cuenta en este dispositivo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleSignOut}
              className="w-full sm:w-auto"
            >
              <LogOutIcon className="h-4 w-4 mr-2" />
              Cerrar sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}