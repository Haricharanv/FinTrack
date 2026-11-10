import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Bucket, Overview, PageResult, Transaction } from './types';

export const http = axios.create({ baseURL: '/api/v1', withCredentials: true, timeout: 15000 });
export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  return (await http.get<{ data: T }>(url, { params })).data.data;
}
export async function send<T>(
  method: 'post' | 'patch' | 'put' | 'delete',
  url: string,
  body?: unknown,
): Promise<T> {
  return (await http.request<{ data: T }>({ method, url, data: body })).data.data;
}
export function message(error: unknown): string {
  return axios.isAxiosError(error)
    ? error.response?.data?.error?.message ||
        (error.code === 'ECONNABORTED'
          ? 'The request took too long. Please try again.'
          : 'We couldn’t connect. Check your connection and try again.')
    : error instanceof Error
      ? error.message
      : 'Something went wrong. Please try again.';
}
export const useOverview = (month: string) =>
  useQuery({
    queryKey: ['finance', 'overview', month],
    queryFn: () => get<Overview>('/dashboard/overview', { month }),
  });
export const useBuckets = (month: string) =>
  useQuery({
    queryKey: ['finance', 'buckets', month],
    queryFn: () => get<Bucket[]>('/buckets', { month, includeArchived: true }),
  });
export const useTransactions = (filters: Record<string, unknown>) =>
  useQuery({
    queryKey: ['finance', 'transactions', filters],
    queryFn: () => get<PageResult<Transaction>>('/transactions', filters),
  });
export function useFinanceMutation<T, V>(fn: (variables: V) => Promise<T>) {
  const query = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => query.invalidateQueries({ queryKey: ['finance'] }),
  });
}
