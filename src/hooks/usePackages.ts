import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface Package {
    id: string;
    name: string;
    description: string;
    created_at?: string;
}

export interface PackageItem {
    id: string;
    package_id: string;
    ingredient_id: string;
    quantity: number;
    ingredient?: {
        name: string;
        unit: string;
    };
}

export const usePackages = () => {
    const queryClient = useQueryClient();

    const { data: packages = [], isLoading, error } = useQuery({
        queryKey: ['magodosdrinks_packages'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('magodosdrinks_packages')
                .select('*')
                .order('name');

            if (error) {
                // Silent fail - don't throw to prevent infinite loop
                return [];
            }

            return data as Package[];
        },
        retry: false,
        staleTime: Infinity, // Never refetch automatically
        gcTime: Infinity, // Keep in cache forever
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        enabled: true, // Always enabled but won't refetch
    });

    const getPackageItems = async (packageId: string) => {
        const { data, error } = await supabase
            .from('magodosdrinks_package_items')
            .select('*, ingredient:ingredients(name, unit)')
            .eq('package_id', packageId);
        if (error) throw error;
        return data as PackageItem[];
    };

    const createPackage = useMutation({
        mutationFn: async ({ name, description, items }: { name: string, description: string, items: { ingredient_id: string, quantity: number }[] }) => {
            // 1. Create Package
            const { data: pkg, error: pkgError } = await supabase
                .from('magodosdrinks_packages')
                .insert({ name, description })
                .select()
                .single();

            if (pkgError) throw pkgError;

            // 2. Create items
            if (items.length > 0) {
                const packageItems = items.map(item => ({
                    package_id: pkg.id,
                    ingredient_id: item.ingredient_id,
                    quantity: item.quantity
                }));

                const { error: itemsError } = await supabase
                    .from('magodosdrinks_package_items')
                    .insert(packageItems);

                if (itemsError) throw itemsError;
            }

            return pkg;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['magodosdrinks_packages'] });
            toast.success("PACOTE CRIADO COM SUCESSO!");
        },
        onError: (error: any) => {
            toast.error("ERRO AO CRIAR PACOTE: " + error.message);
        }
    });

    const updatePackage = useMutation({
        mutationFn: async ({ id, name, description, items }: { id: string, name: string, description: string, items: { ingredient_id: string, quantity: number }[] }) => {
            // 1. Update Package details
            const { error: pkgError } = await supabase
                .from('magodosdrinks_packages')
                .update({ name, description })
                .eq('id', id);

            if (pkgError) throw pkgError;

            // 2. Update Items (Delete all and re-create)
            // First, delete existing items
            const { error: deleteError } = await supabase
                .from('magodosdrinks_package_items')
                .delete()
                .eq('package_id', id);

            if (deleteError) throw deleteError;

            // Then insert new ones
            if (items.length > 0) {
                const packageItems = items.map(item => ({
                    package_id: id,
                    ingredient_id: item.ingredient_id,
                    quantity: item.quantity
                }));

                const { error: itemsError } = await supabase
                    .from('magodosdrinks_package_items')
                    .insert(packageItems);

                if (itemsError) throw itemsError;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['magodosdrinks_packages'] });
            toast.success("PACOTE ATUALIZADO!");
        },
        onError: (error: any) => {
            toast.error("ERRO AO ATUALIZAR: " + error.message);
        }
    });

    const deletePackage = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('magodosdrinks_packages')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['magodosdrinks_packages'] });
            toast.success("PACOTE REMOVIDO!");
        },
        onError: (error: any) => {
            toast.error("ERRO AO REMOVER: " + error.message);
        }
    });

    return {
        packages,
        isLoading,
        getPackageItems,
        createPackage,
        updatePackage,
        deletePackage
    };
};
