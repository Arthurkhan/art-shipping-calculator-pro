import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CollectionSize {
  weight_kg: number;
  height_cm: number;
  length_cm: number;
  width_cm: number;
}

interface UseParameterPreviewProps {
  collection: string;
  size: string;
  isVisible: boolean;
}

export const useParameterPreview = ({
  collection,
  size,
  isVisible
}: UseParameterPreviewProps) => {
  const [sizeData, setSizeData] = useState<CollectionSize | null>(null);
  const [collectionName, setCollectionName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Load size data when parameters change
  useEffect(() => {
    if (collection && size && isVisible) {
      loadSizeData();
      loadCollectionName();
    }
  }, [collection, size, isVisible]);

  const loadCollectionName = async () => {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('name')
        .eq('id', collection)
        .single();

      if (error) throw error;
      setCollectionName(data?.name || 'Unknown Collection');
    } catch (err) {
      console.error('Error loading collection name:', err);
      setCollectionName('Unknown Collection');
    }
  };

  const loadSizeData = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase
        .from('collection_sizes')
        .select('weight_kg, height_cm, length_cm, width_cm')
        .eq('collection_id', collection)
        .eq('size', size)
        .single();

      if (error) throw error;
      
      if (!data) {
        setError(`No size data found for ${size}`);
        setSizeData(null);
        return;
      }

      setSizeData(data);
    } catch (err) {
      console.error('Error loading size data:', err);
      setError('Failed to load size data');
      setSizeData(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    sizeData,
    collectionName,
    loading,
    error,
  };
};