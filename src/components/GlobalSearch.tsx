import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import { Search, Package, Hash, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export function GlobalSearch() {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const { data: products } = useQuery({
        queryKey: ["search-products"],
        queryFn: async () => {
            const { data } = await supabase
                .from("products")
                .select("id, name, category_id")
                .eq("is_active", true)
                .limit(20);
            return data || [];
        },
    });

    const { data: categories } = useQuery({
        queryKey: ["search-categories"],
        queryFn: async () => {
            const { data } = await supabase
                .from("categories")
                .select("id, name, slug")
                .limit(10);
            return data || [];
        },
    });

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-md font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground hover:shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] hover:border-primary/50 h-9 px-4 py-2 relative w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64 group"
            >
                <Search className="h-4 w-4 mr-2 group-hover:text-primary transition-colors" />
                <span className="hidden lg:inline-flex group-hover:text-primary transition-colors">Search...</span>
                <span className="inline-flex lg:hidden group-hover:text-primary transition-colors">Search...</span>
                <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex group-hover:border-primary/50 group-hover:text-primary transition-colors">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </button>

            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Type a command or search..." />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup heading="Pages">
                        <CommandItem
                            onSelect={() => runCommand(() => navigate("/"))}
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            Home
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => navigate("/catalog"))}
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            Catalogue
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => navigate("/community"))}
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            Community
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => navigate("/arena"))}
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            Arena
                        </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="Products">
                        {products?.map((product) => (
                            <CommandItem
                                key={product.id}
                                onSelect={() => runCommand(() => navigate(`/product/${product.id}`))}
                            >
                                <Package className="mr-2 h-4 w-4" />
                                {product.name}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="Categories">
                        {categories?.map((category) => (
                            <CommandItem
                                key={category.id}
                                onSelect={() => runCommand(() => navigate(`/category/${category.slug}`))}
                            >
                                <Hash className="mr-2 h-4 w-4" />
                                {category.name}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    );
}
