import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCallback } from "react";

export const usePrefetch = () => {
  const queryClient = useQueryClient();

  // Prefetch collection sizes when hovering over collection selector
  const prefetchCollectionSizes = useCallback((collectionId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['collectionSizes', collectionId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('sizes')
          .select('*')
          .eq('collection_id', collectionId)
          .order('size');

        if (error) throw error;
        return data;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  }, [queryClient]);

  // Prefetch all collections on mount (lightweight query)
  const prefetchCollections = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['collections'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('collections')
          .select('*')
          .order('name');

        if (error) throw error;
        return data;
      },
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  }, [queryClient]);

  // Prefetch FedEx config status
  const prefetchFedexStatus = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['fedexConfigStatus'],
      queryFn: async () => {
        const sessionId = localStorage.getItem('fedex-session-id');
        if (!sessionId) {
          return { status: 'missing' };
        }

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fedex-config`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            action: 'get',
            sessionId: sessionId,
          }),
        });

        if (!response.ok) {
          return { status: 'missing' };
        }

        const data = await response.json();
        return { status: data.hasConfig ? 'valid' : 'missing' };
      },
      staleTime: 30 * 1000, // 30 seconds for config status
    });
  }, [queryClient]);

  return {
    prefetchCollectionSizes,
    prefetchCollections,
    prefetchFedexStatus,
  };
};