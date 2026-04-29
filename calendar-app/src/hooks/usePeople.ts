import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';

export interface Person {
  id: number;
  name: string;
  phone?: string;
}

export const usePeople = () => {
  const queryClient = useQueryClient();

  const peopleQuery = useQuery({
    queryKey: ['people'],
    queryFn: async () => {
      const response = await apiClient.get<Person[]>('/people');
      return response.data;
    },
  });

  const createPersonMutation = useMutation({
    mutationFn: async (newPerson: { name: string; phone?: string }) => {
      const response = await apiClient.post<Person>('/people', newPerson);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
    },
  });

  return {
    people: peopleQuery.data || [],
    isLoading: peopleQuery.isLoading,
    isError: peopleQuery.isError,
    createPerson: createPersonMutation.mutateAsync,
  };
};
