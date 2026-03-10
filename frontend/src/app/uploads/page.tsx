"use client";
import { useState, useEffect, useCallback } from "react";
import { Upload, Trash2, ExternalLink, FileText, Image } from "lucide-react";
import { uploadsApi } from "@/lib/api/uploads";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { FileUploader } from "@/components/uploads/FileUploader";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { formatDate } from "@/lib/utils";
import type { UploadedFile } from "@/types";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadsPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<UploadedFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await uploadsApi.list({ limit: "100" });
      setFiles(res.data);
    } catch {
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await uploadsApi.delete(deleteTarget.fileId);
      toast("Archivo eliminado", "success");
      setDeleteTarget(null);
      fetchFiles();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al eliminar";
      toast(msg, "error");
    } finally {
      setIsDeleting(false);
    }
  }

  if (!isAdmin) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-500">Acceso restringido a administradores.</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100">
            <Upload size={20} className="text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Archivos</h1>
            <p className="text-sm text-gray-400">Gestiona los archivos del sistema</p>
          </div>
        </div>

        {/* Uploader */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">Subir nuevo archivo</h2>
          <FileUploader onUpload={() => fetchFiles()} />
        </div>

        {/* Gallery */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Archivos subidos ({files.length})</h2>
            <Button variant="secondary" size="sm" onClick={fetchFiles}>
              Actualizar
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : files.length === 0 ? (
            <EmptyState title="Sin archivos" description="No hay archivos subidos aun." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {files.map((file) => {
                const isImage = file.mimetype?.startsWith("image/");
                return (
                  <div key={file.fileId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    {/* Preview */}
                    <div className="h-36 bg-gray-100 flex items-center justify-center overflow-hidden">
                      {isImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={uploadsApi.url(file.fileId)}
                          alt={file.filename}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <FileText size={36} className="text-gray-300" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <p className="text-sm font-medium text-gray-800 truncate" title={file.filename}>
                        {file.filename}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatBytes(file.size)}</p>
                      {file.tipo && (
                        <p className="text-xs text-gray-400">Tipo: {file.tipo}</p>
                      )}
                      <p className="text-xs text-gray-300 mt-1">{formatDate(file.fecha_subida)}</p>
                    </div>

                    {/* Actions */}
                    <div className="px-4 pb-4 flex gap-2">
                      <a
                        href={uploadsApi.url(file.fileId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <Button variant="secondary" size="sm" className="w-full">
                          <ExternalLink size={12} />
                          Ver
                        </Button>
                      </a>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteTarget(file)}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirm modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar archivo"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Seguro que deseas eliminar <span className="font-semibold">{deleteTarget?.filename}</span>? Esta accion no se puede deshacer.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button variant="danger" size="sm" isLoading={isDeleting} onClick={handleDelete}>
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </PageWrapper>
  );
}
