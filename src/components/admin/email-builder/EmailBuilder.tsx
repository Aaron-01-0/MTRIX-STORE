import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, MoveUp, MoveDown, Plus, Image as ImageIcon, Type, MousePointerClick, Maximize } from 'lucide-react';

export type EmailBlockType = 'text' | 'image' | 'button' | 'spacer' | 'divider' | 'hero';

export interface EmailBlock {
    id: string;
    type: EmailBlockType;
    content: any;
}

interface EmailBuilderProps {
    onChange: (html: string) => void;
}

const EmailBuilder = ({ onChange }: EmailBuilderProps) => {
    const [blocks, setBlocks] = useState<EmailBlock[]>([
        { id: '1', type: 'hero', content: { imageUrl: 'https://placehold.co/600x300/1a1a1a/gold?text=Welcome', title: 'Welcome to the Collective' } },
        { id: '2', type: 'text', content: { text: 'Thank you for joining us. We are building the future of digital art.' } }
    ]);

    const updateBlocks = (newBlocks: EmailBlock[]) => {
        setBlocks(newBlocks);
        generateHtml(newBlocks);
    };

    const addBlock = (type: EmailBlockType) => {
        const newBlock: EmailBlock = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            content: getDefaultContent(type)
        };
        updateBlocks([...blocks, newBlock]);
    };

    const removeBlock = (id: string) => {
        updateBlocks(blocks.filter(b => b.id !== id));
    };

    const moveBlock = (index: number, direction: -1 | 1) => {
        const newBlocks = [...blocks];
        if (index + direction < 0 || index + direction >= newBlocks.length) return;
        const temp = newBlocks[index];
        newBlocks[index] = newBlocks[index + direction];
        newBlocks[index + direction] = temp;
        updateBlocks(newBlocks);
    };

    const updateBlockContent = (id: string, content: any) => {
        const newBlocks = blocks.map(b => b.id === id ? { ...b, content: { ...b.content, ...content } } : b);
        updateBlocks(newBlocks);
    };

    const getDefaultContent = (type: EmailBlockType) => {
        switch (type) {
            case 'text': return { text: 'Enter your text here...', align: 'left', fontSize: '16px' };
            case 'image': return { imageUrl: 'https://placehold.co/600x200', alt: 'Image', url: '' };
            case 'button': return { text: 'Click Me', url: '#', align: 'center', color: '#FFD700', textColor: '#000000' };
            case 'spacer': return { height: '20px' };
            case 'divider': return { color: '#333333' };
            case 'hero': return { imageUrl: 'https://placehold.co/600x300', title: 'Main Heading' };
            default: return {};
        }
    };

    const generateHtml = (currentBlocks: EmailBlock[]) => {
        // Simple HTML generator
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000000; color: #ffffff;">
                ${currentBlocks.map(block => blockToHtml(block)).join('')}
                
                <div style="text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #333; margin-top: 40px;">
                    <p>&copy; ${new Date().getFullYear()} MTRIX. All rights reserved.</p>
                    <p><a href="#" style="color: #666; text-decoration: underline;">Unsubscribe</a></p>
                </div>
            </div>
        `;
        onChange(html);
    };

    const blockToHtml = (block: EmailBlock) => {
        const c = block.content;
        switch (block.type) {
            case 'text':
                return `<div style="padding: 10px 20px; text-align: ${c.align}; font-size: ${c.fontSize}; line-height: 1.6;">${c.text.replace(/\n/g, '<br/>')}</div>`;
            case 'image':
                return `<div style="text-align: center;"><a href="${c.url || '#'}"><img src="${c.imageUrl}" alt="${c.alt}" style="max-width: 100%; height: auto; display: block;" /></a></div>`;
            case 'hero':
                return `
                    <div style="position: relative; text-align: center; color: white;">
                        <img src="${c.imageUrl}" style="width: 100%; height: auto; display: block;" />
                        ${c.title ? `<h1 style="background: rgba(0,0,0,0.5); padding: 10px; margin: 0; font-size: 24px;">${c.title}</h1>` : ''}
                    </div>`;
            case 'button':
                return `
                    <div style="padding: 20px; text-align: ${c.align};">
                        <a href="${c.url}" style="background-color: ${c.color}; color: ${c.textColor}; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
                            ${c.text}
                        </a>
                    </div>`;
            case 'spacer':
                return `<div style="height: ${c.height};"></div>`;
            case 'divider':
                return `<hr style="border: 0; border-top: 1px solid ${c.color}; margin: 20px 0;" />`;
            default: return '';
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
                {/* Toolbar */}
                <div className="flex flex-wrap gap-2 p-4 bg-mtrix-dark border border-mtrix-gray rounded-lg">
                    <Button variant="outline" size="sm" onClick={() => addBlock('hero')}><Maximize className="w-4 h-4 mr-2" /> Hero</Button>
                    <Button variant="outline" size="sm" onClick={() => addBlock('text')}><Type className="w-4 h-4 mr-2" /> Text</Button>
                    <Button variant="outline" size="sm" onClick={() => addBlock('image')}><ImageIcon className="w-4 h-4 mr-2" /> Image</Button>
                    <Button variant="outline" size="sm" onClick={() => addBlock('button')}><MousePointerClick className="w-4 h-4 mr-2" /> Button</Button>
                    <Button variant="outline" size="sm" onClick={() => addBlock('spacer')}><MoveUp className="w-4 h-4 mr-2 rotate-90" /> Spacer</Button>
                    <Button variant="outline" size="sm" onClick={() => addBlock('divider')}>— Divider</Button>
                </div>

                {/* Editor Area */}
                <div className="space-y-4 min-h-[400px]">
                    {blocks.map((block, index) => (
                        <Card key={block.id} className="bg-black/40 border-mtrix-gray/50 hover:border-gold/30 transition-all group">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-2">
                                    <span className="text-xs uppercase font-bold text-muted-foreground">{block.type} Block</span>
                                    <div className="flex gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === 0} onClick={() => moveBlock(index, -1)}><MoveUp className="w-3 h-3" /></Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === blocks.length - 1} onClick={() => moveBlock(index, 1)}><MoveDown className="w-3 h-3" /></Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-400" onClick={() => removeBlock(block.id)}><Trash2 className="w-3 h-3" /></Button>
                                    </div>
                                </div>

                                {/* Block Controls */}
                                <div className="space-y-3">
                                    {block.type === 'hero' && (
                                        <>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1"><Label>Image URL</Label><Input value={block.content.imageUrl} onChange={(e) => updateBlockContent(block.id, { imageUrl: e.target.value })} className="h-8 text-xs bg-black/20" /></div>
                                                <div className="space-y-1"><Label>Title</Label><Input value={block.content.title} onChange={(e) => updateBlockContent(block.id, { title: e.target.value })} className="h-8 text-xs bg-black/20" /></div>
                                            </div>
                                        </>
                                    )}
                                    {block.type === 'text' && (
                                        <>
                                            <Textarea value={block.content.text} onChange={(e) => updateBlockContent(block.id, { text: e.target.value })} className="min-h-[100px] bg-black/20" />
                                            <div className="flex gap-4">
                                                <Select value={block.content.align} onValueChange={(v) => updateBlockContent(block.id, { align: v })}>
                                                    <SelectTrigger className="h-8 w-[100px]"><SelectValue /></SelectTrigger>
                                                    <SelectContent><SelectItem value="left">Left</SelectItem><SelectItem value="center">Center</SelectItem><SelectItem value="right">Right</SelectItem></SelectContent>
                                                </Select>
                                            </div>
                                        </>
                                    )}
                                    {block.type === 'image' && (
                                        <div className="space-y-2">
                                            <Label>Image URL</Label>
                                            <Input value={block.content.imageUrl} onChange={(e) => updateBlockContent(block.id, { imageUrl: e.target.value })} className="bg-black/20" />
                                            <div className="flex items-center gap-4">
                                                {block.content.imageUrl && <img src={block.content.imageUrl} alt="preview" className="h-12 w-12 object-cover rounded border border-white/10" />}
                                                <Label className="text-xs text-muted-foreground flex-1">Preview</Label>
                                            </div>
                                        </div>
                                    )}
                                    {block.type === 'button' && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1"><Label>Label</Label><Input value={block.content.text} onChange={(e) => updateBlockContent(block.id, { text: e.target.value })} className="h-8 bg-black/20" /></div>
                                            <div className="space-y-1"><Label>URL</Label><Input value={block.content.url} onChange={(e) => updateBlockContent(block.id, { url: e.target.value })} className="h-8 bg-black/20" /></div>
                                            <div className="col-span-2 space-y-1">
                                                <Label>Alignment</Label>
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant={block.content.align === 'left' ? 'default' : 'outline'} onClick={() => updateBlockContent(block.id, { align: 'left' })}>Left</Button>
                                                    <Button size="sm" variant={block.content.align === 'center' ? 'default' : 'outline'} onClick={() => updateBlockContent(block.id, { align: 'center' })}>Center</Button>
                                                    <Button size="sm" variant={block.content.align === 'right' ? 'default' : 'outline'} onClick={() => updateBlockContent(block.id, { align: 'right' })}>Right</Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Preview Column (handled by parent or implicit here?) 
                Actually, the parent BroadcastManager has a "Live Preview" column. 
                This component just emits HTML.
                But let's show a "Mobile Preview" here too? 
                No, let's keep it simple. The parent handles preview.
            */}
            <div className="hidden md:block text-muted-foreground text-sm italic">
                <p>Use the "Live Preview" on the right (in parent container) to see changes.</p>
            </div>
        </div>
    );
};

export default EmailBuilder;
