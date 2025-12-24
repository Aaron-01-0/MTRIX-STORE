import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { supabase } from '@/integrations/supabase/client';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CsvImportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    productId?: string; // If provided, we only import variants for this product
}

interface ParsedRow {
    SKU: string;
    Price: string;
    Stock: string;
    [key: string]: string; // Dynamic attributes and other fields
}

export const CsvImportDialog: React.FC<CsvImportDialogProps> = ({
    isOpen,
    onClose,
    onSuccess,
    productId
}) => {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
    const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [step, setStep] = useState<'upload' | 'preview'>('upload');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
                toast({ title: "Invalid File", description: "Please upload a CSV file.", variant: "destructive" });
                return;
            }
            setFile(selectedFile);
        }
    };

    const parseCsv = () => {
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0) {
                    console.error(results.errors);
                    toast({ title: "Parse Error", description: "Check console for details.", variant: "destructive" });
                    return;
                }

                const data = results.data as ParsedRow[];
                if (data.length === 0) {
                    toast({ title: "Empty File", description: "No data found.", variant: "destructive" });
                    return;
                }

                const headers = Object.keys(data[0]);
                // Validate required headers
                const required = ['SKU', 'Price', 'Stock'];
                const missing = required.filter(h => !headers.includes(h));

                if (missing.length > 0) {
                    toast({ title: "Validation Error", description: `Missing columns: ${missing.join(', ')}`, variant: "destructive" });
                    return;
                }

                setPreviewHeaders(headers);
                setParsedData(data);
                setStep('preview');
            },
            error: (error) => {
                toast({ title: "Error", description: error.message, variant: "destructive" });
            }
        });
    };

    const processImport = async () => {
        setIsProcessing(true);
        let successCount = 0;
        let failCount = 0;

        try {
            if (!productId) {
                // Global Import Logic (Not implemented in this scope yet, we assume variant import for now)
                // Or we could try to look up product by Name/ID in CSV?
                // For now, let's enforce productId prop or simple mode
                toast({ title: "Not Supported", description: "Bulk product creation not yet enabled. Open a product to import variants.", variant: "destructive" });
                setIsProcessing(false);
                return;
            }

            // Process variants for the current product
            const variantsToInsert = parsedData.map(row => {
                // Extract dynamic attributes
                const attribute_json: Record<string, string> = {};

                Object.keys(row).forEach(key => {
                    if (key.startsWith('Attribute:')) {
                        const attrName = key.replace('Attribute:', '').trim();
                        if (row[key]) {
                            attribute_json[attrName] = row[key];
                        }
                    }
                    // Handle legacy columns mapped from CSV if they exist without prefix? 
                    // Or just treat 'Size' and 'Color' as attributes if found
                    if (key === 'Size') attribute_json['Size'] = row[key];
                    if (key === 'Color') attribute_json['Color'] = row[key];
                });

                // Determine Variant Type
                const hasColor = !!attribute_json['Color'];
                const hasSize = !!attribute_json['Size'];
                const variant_type = hasColor && hasSize ? 'color-size' : (hasSize ? 'size' : (Object.keys(attribute_json).length > 0 ? 'multi' : 'single'));
                const variant_name = Object.values(attribute_json).join(' / ') || 'Standard';

                return {
                    product_id: productId,
                    sku: row.SKU,
                    absolute_price: parseFloat(row.Price),
                    price: parseFloat(row.Price), // Mapped for DB
                    stock_quantity: parseInt(row.Stock) || 0,
                    is_active: true,
                    variant_type,
                    variant_name,
                    attribute_json,
                    // content for legacy columns
                    size: attribute_json['Size'] || row.Size || 'Standard',
                    color: attribute_json['Color'] || row.Color || null,
                    image_url: row.ImageURL || null
                };
            });

            const { error } = await supabase.from('product_variants').upsert(variantsToInsert, { onConflict: 'sku' });

            if (error) throw error;

            successCount = variantsToInsert.length;
            toast({ title: "Import Successful", description: `Imported ${successCount} variants.` });
            onSuccess();
            onClose();

        } catch (error: any) {
            console.error('Import Error:', error);
            toast({ title: "Import Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };

    const reset = () => {
        setFile(null);
        setParsedData([]);
        setStep('upload');
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl bg-mtrix-black border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle className="text-gradient-gold">Bulk Import Variants (CSV)</DialogTitle>
                </DialogHeader>

                {step === 'upload' ? (
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/10 rounded-lg space-y-4">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                            <FileText className="w-8 h-8 text-muted-foreground" />
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-4">
                                Upload a CSV with headers: <br />
                                <code className="bg-black/30 px-1 py-0.5 rounded text-xs text-primary">SKU, Price, Stock, Attribute:Color, Attribute:Size</code>
                            </p>
                            <Input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <Button
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                className="border-primary/50 text-primary hover:bg-primary/10"
                            >
                                {file ? file.name : "Select CSV File"}
                            </Button>
                        </div>

                        {file && (
                            <Button onClick={parseCsv} className="w-full max-w-xs mt-4">
                                Preview Data
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-muted-foreground">Previewing {parsedData.length} rows</p>
                            <Button variant="ghost" size="sm" onClick={reset}>Change File</Button>
                        </div>

                        <ScrollArea className="h-[400px] border border-white/10 rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-white/10 hover:bg-white/5">
                                        {previewHeaders.map(h => (
                                            <TableHead key={h} className="text-primary">{h}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {parsedData.slice(0, 100).map((row, i) => (
                                        <TableRow key={i} className="border-white/10 hover:bg-white/5 text-xs">
                                            {previewHeaders.map(h => (
                                                <TableCell key={`${i}-${h}`}>{row[h]}</TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>

                        <DialogFooter className="mt-4">
                            <Button variant="outline" onClick={reset} disabled={isProcessing}>Cancel</Button>
                            <Button onClick={processImport} disabled={isProcessing} className="bg-primary text-black">
                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                                Confirm Import
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
