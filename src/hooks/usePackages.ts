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
                console.error('Error fetching packages:', error);
                throw error;
            }
            return data as Package[];
        }
    });

    // Log packages for debugging
    if (packages.length > 0) {
        console.log('Packages loaded:', packages.length);
    } else if (!isLoading && packages.length === 0) {
        console.warn('No packages found in database');
    }

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

    return {
        packages,
        isLoading,
        getPackageItems,
        createPackage
    };
};
