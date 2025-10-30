import { useCallback, useRef, useState } from 'react';

export function FileDropzone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    const map = new Map(arr.map(f => [`${f.name}:${f.size}`, f]));
    onFiles([...map.values()]);
  }, [onFiles]);

  return (
    <div
      onDragOver={(e)=>{e.preventDefault(); setOver(true);}}
      onDragLeave={()=>setOver(false)}
      onDrop={(e)=>{e.preventDefault(); setOver(false); handleFiles(e.dataTransfer.files);}}
      style={{ border: '2px dashed #e5e7eb', borderRadius: 8, padding: 32, textAlign: 'center', cursor: 'pointer', background: over ? '#f9fafb' : undefined }}
      onClick={()=>inputRef.current?.click()}
    >
      <input type="file" multiple hidden ref={inputRef} onChange={(e)=>handleFiles(e.target.files)} />
      <p style={{ fontSize: 14, color: '#6b7280' }}>Drag and drop files here, or click to select</p>
    </div>
  );
}


