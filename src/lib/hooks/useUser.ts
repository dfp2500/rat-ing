import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/providers/AuthProvider';
import { userService } from '../services/userService';
import { User } from '@/types/user';

/**
 * Hook para obtener el usuario actual desde Firestore
 */
export function useCurrentUser() {
  const { user: firebaseUser } = useAuth();

  return useQuery({
    queryKey: ['user', firebaseUser?.uid],
    queryFn: async () => {
      if (!firebaseUser) return null;
      return userService.getOrCreateUser(firebaseUser);
    },
    enabled: !!firebaseUser,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener un usuario por ID
 */
export function useUserById(userId: string | null) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => userService.getUserById(userId!),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para actualizar preferencias del usuario
 */
export function useUpdateUserPreferences() {
  const queryClient = useQueryClient();
  const { user: firebaseUser } = useAuth();

  return useMutation({
    mutationFn: (preferences: User['preferences']) =>
      userService.updatePreferences(firebaseUser!.uid, preferences),
    onSuccess: () => {
      // Invalidar query del usuario actual
      queryClient.invalidateQueries({ queryKey: ['user', firebaseUser?.uid] });
    },
  });
}