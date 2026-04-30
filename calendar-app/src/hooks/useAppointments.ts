import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-native-sonner';
import apiClient from '../api/client';
import { Person } from './usePeople';
import { scheduleAppointmentNotification, cancelAllNotificationsForAppointment } from '../utils/notifications';

export interface Appointment {
  id: number;
  title: string;
  date: string;
  time: string;
  endTime?: string;
  description?: string;
  location?: string;
  reminder: number;
  attendees: Person[];
}

export const useAppointments = (date?: string) => {
  const queryClient = useQueryClient();

  const appointmentsQuery = useQuery({
    queryKey: ['appointments', date],
    queryFn: async () => {
      const url = date ? `/appointments?date=${date}` : '/appointments';
      const response = await apiClient.get<Appointment[]>(url);
      return response.data;
    },
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (newAppointment: Partial<Appointment> & { attendeeIds?: number[] }) => {
      const response = await apiClient.post<Appointment>('/appointments', newAppointment);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Đã thêm lịch hẹn thành công');
      
      // Always schedule notifications (reminder + on-time)
      scheduleAppointmentNotification(data.id, data.title, data.date, data.time, data.reminder ?? 720);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Không thể thêm lịch hẹn';
      toast.error(message);
    }
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Appointment> & { id: number; attendeeIds?: number[] }) => {
      const response = await apiClient.put<Appointment>(`/appointments/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Đã cập nhật lịch hẹn');

      // Re-schedule both notifications
      scheduleAppointmentNotification(data.id, data.title, data.date, data.time, data.reminder ?? 720);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Không thể cập nhật lịch hẹn';
      toast.error(message);
    }
  });

  const deleteAppointmentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/appointments/${id}`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Đã xóa lịch hẹn');
      cancelAllNotificationsForAppointment(id);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Không thể xóa lịch hẹn';
      toast.error(message);
    }
  });

  return {
    appointments: appointmentsQuery.data || [],
    isLoading: appointmentsQuery.isLoading,
    isError: appointmentsQuery.isError,
    createAppointment: createAppointmentMutation.mutateAsync,
    updateAppointment: updateAppointmentMutation.mutateAsync,
    deleteAppointment: deleteAppointmentMutation.mutateAsync,
  };
};

export const useMonthlyCounts = (month: string) => {
  return useQuery({
    queryKey: ['appointments', 'counts', month],
    queryFn: async () => {
      const response = await apiClient.get<Record<string, number>>(`/appointments/counts?month=${month}`);
      return response.data;
    },
  });
};
