"use client";
import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Upload, CheckCircle, ExternalLink } from "lucide-react";
import { uploadsApi } from "@/lib/api/uploads";
import { useToast } from "@/context/ToastContext";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface FileUploaderProps {
  onUpload?: (fileId: string, url: string) => void;
  tipo?: string;
  ref_id?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUploader({ onUpload, tipo, ref_id }: FileUploaderProps) {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ fileId: string; url: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
    }
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const res = await uploadsApi.upload(selectedFile, { tipo, ref_id });
      setResult({ fileId: res.data.fileId, url: res.data.url });
      toast("Archivo subido correctamente", "success");
      onUpload?.(res.data.fileId, res.data.url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al subir archivo";
      toast(msg, "error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl py-10 px-6 cursor-pointer transition-all duration-200 select-none",
          isDragging
            ? "border-amber-400 bg-amber-50"
            : "border-gray-200 bg-gray-50 hover:border-amber-300 hover:bg-amber-50/40"
        )}
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100">
          <Upload size={22} className="text-amber-500" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">
            Arrastra un archivo o haz clic para seleccionar
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Imagenes, PDF, o cualquier formato
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Selected file info */}
      {selectedFile && !result && (
        <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-800 truncate max-w-xs">
              {selectedFile.name}
            </p>
            <p className="text-xs text-gray-400">{formatBytes(selectedFile.size)}</p>
          </div>
          {uploading ? (
            <Spinner size="sm" />
          ) : (
            <Button variant="primary" size="sm" onClick={handleUpload}>
              Subir
            </Button>
          )}
        </div>
      )}

      {/* Success */}
      {result && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle size={18} className="text-green-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-700">Archivo subido</p>
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-green-600 underline underline-offset-2 flex items-center gap-1 mt-0.5 hover:text-green-700"
            >
              Ver archivo <ExternalLink size={11} />
            </a>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSelectedFile(null); setResult(null); }}
          >
            Nuevo
          </Button>
        </div>
      )}
    </div>
  );
}
