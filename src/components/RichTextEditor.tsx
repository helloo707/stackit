'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import CodeBlock from '@tiptap/extension-code-block';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Undo,
  Redo
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="border-b border-gray-200 p-2 flex flex-wrap gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn(
          "h-8 w-8 p-0",
          editor.isActive('bold') && "bg-gray-200"
        )}
      >
        <Bold className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn(
          "h-8 w-8 p-0",
          editor.isActive('italic') && "bg-gray-200"
        )}
      >
        <Italic className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn(
          "h-8 w-8 p-0",
          editor.isActive('bulletList') && "bg-gray-200"
        )}
      >
        <List className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn(
          "h-8 w-8 p-0",
          editor.isActive('orderedList') && "bg-gray-200"
        )}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={cn(
          "h-8 w-8 p-0",
          editor.isActive('blockquote') && "bg-gray-200"
        )}
      >
        <Quote className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={cn(
          "h-8 w-8 p-0",
          editor.isActive('codeBlock') && "bg-gray-200"
        )}
      >
        <Code className="h-4 w-4" />
      </Button>
      
      <div className="w-px h-8 bg-gray-200 mx-1" />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="h-8 w-8 p-0"
      >
        <Undo className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="h-8 w-8 p-0"
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = "Start writing...",
  className 
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      CodeBlock,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className={cn("border border-gray-200 rounded-md", className)}>
      <MenuBar editor={editor} />
      <EditorContent 
        editor={editor} 
        className="prose prose-sm max-w-none p-4 min-h-[200px] focus:outline-none"
      />
    </div>
  );
} 