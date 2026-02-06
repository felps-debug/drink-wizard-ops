import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Insumo } from "@/lib/mock-data";
import { toast } from "sonner";

export const useInventory = () => {
  const queryClient = useQueryClient();

  // Fetch ingredients with latest price
  const { data: insumos, isLoading, error } = useQuery({
    queryKey: ['ingredients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ingredients')
        .select(`
          *,
          prices:price_history(price, date)
        `)
        .order('name', { ascending: true });

      if (error) throw error;

      return data.map((item: any) => {
        // Get latest price
        const prices = item.prices || [];
        const latestPrice = prices.sort((a: any, b: any) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0]?.price || 0;

        return {
          id: item.id,
          name: item.name,
          category: item.category,
          unit: item.unit,
          currentPrice: Number(latestPrice),
          minStock: item.min_stock,
          currentStock: item.current_stock
        };
      }) as Insumo[];
    }
  });

  // ... deleteInsumo ...

  // Add ingredient
  const addInsumo = useMutation({
    mutationFn: async (newInsumo: Omit<Insumo, 'id'>) => {
      // 1. Insert Insumo
      const { data: insumo, error: insumoError } = await supabase
        .from('ingredients')
        .insert([{
          name: newInsumo.name,
          category: newInsumo.category,
          unit: newInsumo.unit,
          min_stock: newInsumo.minStock ?? 0,
          current_stock: newInsumo.currentStock ?? 0
        }])
        .select()
        .single();

      if (insumoError) throw insumoError;

      // 2. Insert Initial Price if > 0
      if (newInsumo.currentPrice > 0) {
        const { error: priceError } = await supabase
          .from('price_history')
          .insert({
            ingredient_id: insumo.id,
            price: newInsumo.currentPrice
          });

        if (priceError) console.error("Error saving initial price:", priceError);
      }

      return insumo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      toast.success("Insumo adicionado com sucesso");
    },
    onError: (err: any) => {
      toast.error("Erro ao adicionar insumo: " + err.message);
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

  // Update ingredient
  const updateInsumo = useMutation({
    mutationFn: async (insumo: Insumo) => {
      // 1. Update Insumo Details
      const { error: insumoError } = await supabase
        .from('ingredients')
        .update({
          name: insumo.name,
          category: insumo.category,
          unit: insumo.unit,
          min_stock: (insumo as any).minStock ?? 0,
          current_stock: (insumo as any).currentStock ?? 0
        })
        .eq('id', insumo.id);

      if (insumoError) throw insumoError;

      // 2. Check if price changed (we could fetch latest, but passing new price is explicit)
      // Always insert a new record if currentPrice is provided. 
      // Optimization: In a real app we might check if it actually changed, 
      // but for "Update Weekly", an explicit save is an explicit history entry.
      if (insumo.currentPrice !== undefined) {
        const { error: priceError } = await supabase
          .from('price_history')
          .insert({
            ingredient_id: insumo.id,
            price: insumo.currentPrice
          });
        if (priceError) console.error("Error updating price history:", priceError);
      }
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
