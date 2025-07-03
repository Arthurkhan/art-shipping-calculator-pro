import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Collection {
  id: string;
  name: string;
}

/**
 * Custom hook for managing collections and sizes data
 * Extracted from Index.tsx for Phase 2 refactoring
 */
export const useCollectionData = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSizes, setIsLoadingSizes] = useState(false);
  const { toast } = useToast();

  // Load collections from database
  const loadCollections = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCollections(data || []);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load art collections. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Load sizes for selected collection
  const loadSizes = useCallback(async (collectionId: string) => {
    if (!collectionId) {
      setSizes([]);
      return;
    }

    setIsLoadingSizes(true);
    try {
      const { data, error } = await supabase
        .from('sizes') // Changed from 'collection_sizes' to 'sizes'
        .select('size')
        .eq('collection_id', collectionId)
        .order('size');

      if (error) throw error;
      setSizes(data?.map(item => item.size) || []);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load sizes for selected collection.",
        variant: "destructive",
      });
      setSizes([]);
    } finally {
      setIsLoadingSizes(false);
    }
  }, [toast]);

  // Handle collection selection
  const handleCollectionChange = (collectionId: string) => {
    setSelectedCollection(collectionId);
    setSelectedSize(''); // Reset size selection when collection changes
  };

  // Handle size selection
  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
  };

  // Reset all selections
  const resetSelections = () => {
    setSelectedCollection('');
    setSelectedSize('');
    setSizes([]);
  };

  // Get selected collection details
  const getSelectedCollectionDetails = () => {
    if (!selectedCollection) return null;
    return collections.find(c => c.id === selectedCollection) || null;
  };

  // Check if selections are complete
  const isSelectionComplete = () => {
    return !!(selectedCollection && selectedSize);
  };

  // Load collections on mount
  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  // Load sizes when collection changes
  useEffect(() => {
    if (selectedCollection) {
      loadSizes(selectedCollection);
    } else {
      setSizes([]);
      setSelectedSize('');
    }
  }, [selectedCollection, loadSizes]);

  return {
    // State
    collections,
    sizes,
    selectedCollection,
    selectedSize,
    isLoading,
    isLoadingSizes,
    
    // Actions
    handleCollectionChange,
    handleSizeChange,
    resetSelections,
    loadCollections,
    loadSizes,
    
    // Utilities
    getSelectedCollectionDetails,
    
    // Status
    isSelectionComplete: isSelectionComplete(),
    hasCollections: collections.length > 0,
    hasSizes: sizes.length > 0,
    isCollectionSelected: !!selectedCollection,
    isSizeSelected: !!selectedSize,
  };
};
