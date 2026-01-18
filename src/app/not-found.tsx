import { Button } from '@/components/ui/button';
import { FileQuestionIcon, HomeIcon } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
          <FileQuestionIcon className="h-10 w-10 text-muted-foreground" />
        </div>
        
        <div>
          <h1 className="text-6xl font-bold mb-2">404</h1>
          <h2 className="text-2xl font-semibold mb-2">Página no encontrada</h2>
          <p className="text-sm text-muted-foreground">
            Lo sentimos, no pudimos encontrar la página que buscas.
          </p>
        </div>

        <Link href="/dashboard">
          <Button>
            <HomeIcon className="h-4 w-4 mr-2" />
            Volver al inicio
          </Button>
        </Link>
      </div>
    </div>
  );
}