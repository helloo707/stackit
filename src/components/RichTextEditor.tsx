'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Strike from '@tiptap/extension-strike';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Undo,
  Redo,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image as ImageIcon,
  Strikethrough,
  Smile,
  X,
  Upload as UploadIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import CodeBlock from '@tiptap/extension-code-block';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(true);

  if (!editor) {
    return null;
  }

  const addLink = () => {
    if (linkUrl) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setShowLinkInput(false);
    }
  };

  const removeLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    setLinkUrl(previousUrl);
    setShowLinkInput(true);
  };

  const addImageByUrl = () => {
    if (imageUrl) {
      editor?.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setShowImageMenu(false);
    }
  };

  const insertEmoji = (emoji: string) => {
    editor.chain().focus().insertContent(emoji).run();
    setShowEmojiPicker(false);
  };

  const commonEmojis = ['😊', '👍', '👎', '❤️', '🔥', '💡', '🚀', '🎉', '✅', '❌', '⚠️', '💻', '📚', '🎯', '⚡'];

  const addTable = () => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const deleteTable = () => {
    editor?.chain().focus().deleteTable().run();
  };

  const addColumnBefore = () => {
    editor?.chain().focus().addColumnBefore().run();
  };

  const addColumnAfter = () => {
    editor?.chain().focus().addColumnAfter().run();
  };

  const deleteColumn = () => {
    editor?.chain().focus().deleteColumn().run();
  };

  const addRowBefore = () => {
    editor?.chain().focus().addRowBefore().run();
  };

  const addRowAfter = () => {
    editor?.chain().focus().addRowAfter().run();
  };

  const deleteRow = () => {
    editor?.chain().focus().deleteRow().run();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      editor?.chain().focus().setImage({ src }).run();
      setShowImageMenu(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="border-b border-gray-200 p-2 relative">
      {/* Text Formatting */}
      <div className="flex flex-wrap gap-1 mb-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('bold') && "bg-blue-100 text-blue-700"
          )}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('italic') && "bg-blue-100 text-blue-700"
          )}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('strike') && "bg-blue-100 text-blue-700"
          )}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>

        <div className="w-px h-8 bg-gray-200 mx-1" />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('heading', { level: 1 }) && "bg-blue-100 text-blue-700"
          )}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('heading', { level: 2 }) && "bg-blue-100 text-blue-700"
          )}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('heading', { level: 3 }) && "bg-blue-100 text-blue-700"
          )}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </Button>
      </div>

      {/* Lists and Formatting */}
      <div className="flex flex-wrap gap-1 mb-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('bulletList') && "bg-blue-100 text-blue-700"
          )}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('orderedList') && "bg-blue-100 text-blue-700"
          )}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('blockquote') && "bg-blue-100 text-blue-700"
          )}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('codeBlock') && "bg-blue-100 text-blue-700"
          )}
          title="Code Block"
        >
          <Code className="h-4 w-4" />
        </Button>

        <div className="w-px h-8 bg-gray-200 mx-1" />

        {/* Text Alignment */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive({ textAlign: 'left' }) && "bg-blue-100 text-blue-700"
          )}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive({ textAlign: 'center' }) && "bg-blue-100 text-blue-700"
          )}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive({ textAlign: 'right' }) && "bg-blue-100 text-blue-700"
          )}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <div className="w-px h-8 bg-gray-200 mx-1" />

        {/* Media and Emojis */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowImageMenu((v) => !v)}
          className="h-8 w-8 p-0"
          title="Insert Image"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={cn(
            "h-8 w-8 p-0",
            showEmojiPicker && "bg-blue-100 text-blue-700"
          )}
          title="Insert Emoji"
        >
          <Smile className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={setLink}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('link') && "bg-blue-100 text-blue-700"
          )}
          title="Add Link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>

        {editor.isActive('link') && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={removeLink}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
            title="Remove Link"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
        )}

        {/* Table Buttons */}
        <div className="flex flex-wrap gap-1 mb-2">
          <Button type="button" variant="ghost" size="sm" onClick={addTable} title="Insert Table">Table</Button>
          <Button type="button" variant="ghost" size="sm" onClick={deleteTable} title="Delete Table">Del Table</Button>
          <Button type="button" variant="ghost" size="sm" onClick={addColumnBefore} title="Add Col Before">+Col Left</Button>
          <Button type="button" variant="ghost" size="sm" onClick={addColumnAfter} title="Add Col After">+Col Right</Button>
          <Button type="button" variant="ghost" size="sm" onClick={deleteColumn} title="Delete Col">Del Col</Button>
          <Button type="button" variant="ghost" size="sm" onClick={addRowBefore} title="Add Row Before">+Row Up</Button>
          <Button type="button" variant="ghost" size="sm" onClick={addRowAfter} title="Add Row After">+Row Down</Button>
          <Button type="button" variant="ghost" size="sm" onClick={deleteRow} title="Delete Row">Del Row</Button>
        </div>

        {showImageMenu && (
          <div className="absolute z-50 right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl p-4 flex flex-col gap-3 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${showUrlInput ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                  onClick={() => setShowUrlInput(true)}
                >
                  <LinkIcon className="h-4 w-4" /> By URL
                </button>
                <button
                  type="button"
                  className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${!showUrlInput ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                  onClick={() => setShowUrlInput(false)}
                >
                  <UploadIcon className="h-4 w-4" /> Upload
                </button>
              </div>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
                onClick={() => setShowImageMenu(false)}
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {showUrlInput ? (
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-500 font-medium">Image URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/image.png"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-200"
                    onKeyPress={(e) => e.key === 'Enter' && addImageByUrl()}
                    autoFocus
                  />
                  <Button size="sm" onClick={addImageByUrl} className="text-xs">Add</Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-500 font-medium">Upload Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  autoFocus
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* History */}
      <div className="flex gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="h-8 w-8 p-0"
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="h-8 w-8 p-0"
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Link Input */}
      {showLinkInput && (
        <div className="mt-2 p-2 bg-gray-50 rounded border">
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="Enter URL..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              onKeyPress={(e) => e.key === 'Enter' && addLink()}
            />
            <Button size="sm" onClick={addLink} className="text-xs">
              Add
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setShowLinkInput(false)}
              className="text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="mt-2 p-2 bg-gray-50 rounded border">
          <div className="grid grid-cols-8 gap-1">
            {commonEmojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => insertEmoji(emoji)}
                className="w-8 h-8 text-lg hover:bg-gray-200 rounded flex items-center justify-center"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = "Start writing...",
  className,
  minHeight = "200px"
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Strike,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline',
        },
      }),
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'bg-gray-100 p-4 rounded font-mono text-sm',
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none',
      },
    },
  });

  return (
    <div className={cn("border border-gray-200 rounded-md bg-white", className)}>
      <MenuBar editor={editor} />
      <EditorContent 
        editor={editor} 
        className="p-4 focus:outline-none"
        style={{ minHeight }}
      />
      <style jsx global>{`
        .ProseMirror {
          outline: none;
          min-height: ${minHeight};
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #adb5bd;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .ProseMirror h1 {
          font-size: 1.5rem;
          font-weight: bold;
          margin: 1rem 0 0.5rem 0;
        }
        .ProseMirror h2 {
          font-size: 1.25rem;
          font-weight: bold;
          margin: 0.75rem 0 0.5rem 0;
        }
        .ProseMirror h3 {
          font-size: 1.125rem;
          font-weight: bold;
          margin: 0.5rem 0 0.25rem 0;
        }
        .ProseMirror blockquote {
          border-left: 3px solid #e5e7eb;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #6b7280;
        }
        .ProseMirror code {
          background-color: #f3f4f6;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.875rem;
        }
        .ProseMirror pre {
          background-color: #f3f4f6;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1rem 0;
        }
        .ProseMirror pre code {
          background-color: transparent;
          padding: 0;
        }
        .ProseMirror ul, .ProseMirror ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .ProseMirror li {
          margin: 0.25rem 0;
        }
        .ProseMirror a {
          color: #2563eb;
          text-decoration: underline;
        }
        .ProseMirror a:hover {
          color: #1d4ed8;
        }
        .ProseMirror s {
          text-decoration: line-through;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.375rem;
          margin: 1rem 0;
        }
        .ProseMirror .text-left {
          text-align: left;
        }
        .ProseMirror .text-center {
          text-align: center;
        }
        .ProseMirror .text-right {
          text-align: right;
        }
        .animate-fade-in { animation: fadeIn 0.15s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
} 