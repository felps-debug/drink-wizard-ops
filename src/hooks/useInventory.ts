import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Insumo } from "@/lib/mock-data";
import { toast } from "sonner";

export const useInventory = () => {
  const queryClient = useQueryClient();

  // Fetch ingredients
  const { data: insumos, isLoading, error } = useQuery({
    queryKey: ['ingredients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        unit: item.unit,
        currentPrice: 0, // Price might not be in ingredients table yet, mocking for now or 0
        minStock: item.min_stock
      })) as Insumo[];
    }
  });

  // Delete ingredient
  const deleteInsumo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ingredients')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      toast.success("Insumo removido com sucesso");
    },
    onError: (err: any) => {
      toast.error("Erro ao remover insumo: " + err.message);
    }
  });


  // Add ingredient
  const addInsumo = useMutation({
    mutationFn: async (newInsumo: Omit<Insumo, 'id'>) => {
      // For now, we are saving price in the 'current_price' or handling it; 
      // Schema says 'ingredients' table has: id, name, unit, category, min_stock.
      // If we want to store price, we need to verify if the column exists or if it's in a separate table.
      // Based on previous plan, 'ingredients' table has: name, unit, category, min_stock.
      // We'll proceed assuming 'currentPrice' is not yet persisted or needs a column.
      // Let's assume for now we just save the basic info.

      const { data, error } = await supabase
        .from('ingredients')
        .insert([{
          name: newInsumo.name,
          category: newInsumo.category,
          unit: newInsumo.unit,
          min_stock: newInsumo.minStock
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      toast.success("Insumo adicionado com sucesso");
    },
    onError: (err: any) => {
      toast.error("Erro ao adicionar insumo: " + err.message);
    }
  });

  // Update ingredient
  const updateInsumo = useMutation({
    mutationFn: async (insumo: Insumo) => {
      const { error } = await supabase
        .from('ingredients')
        .update({
          name: insumo.name,
          category: insumo.category,
          unit: insumo.unit,
          min_stock: insumo.minStock
        })
        .eq('id', insumo.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      toast.success("Insumo atualizado com sucesso");
    },
    onError: (err: any) => {
      toast.error("Erro ao atualizar insumo: " + err.message);
    }
  });

  return {
    insumos: insumos || [],
    isLoading,
    error,
    addInsumo,
    updateInsumo,
    deleteInsumo
  };
};
