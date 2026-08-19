import { useMutation } from '@tanstack/react-query';
import type { LoginRequest } from '@aurelia/contracts';
import { login } from '../services/auth.service';

export function useLoginMutation() {
  return useMutation({
    mutationFn: (payload: LoginRequest) => login(payload),
  });
}