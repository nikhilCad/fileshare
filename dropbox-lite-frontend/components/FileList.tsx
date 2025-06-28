"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileText, ImageIcon, FileJson, FileQuestion } from "lucide-react";
import { toast } from "sonner";

// Backend API base URL
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

// File metadata type
interface FileMeta {
  id: number;
  filename: string;
  original_filename: string;
  mimetype: string;
  size: number;
  upload_date: string;
}

function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();
  const iconClass = "w-5 h-5 dark:text-white text-black";
  switch (ext) {
    case "txt":
      return <FileText className={iconClass} />;
    case "png":
    case "jpg":
      return <ImageIcon className={iconClass} />;
    case "json":
      return <FileJson className={iconClass} />;
    default:
      return <FileQuestion className={iconClass} />;
  }
}

export default function FileList() {
  const [files, setFiles] = useState<FileMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Fetch file list from backend
  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/files`);
      if (!res.ok) throw new Error("Failed to fetch files");
      const data = await res.json();
      setFiles(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // Handle file upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_BASE}/files`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      await fetchFiles();
      toast.success("Upload successful", { description: file.name });
    } catch (err: any) {
      setError(err.message || "Unknown error");
      toast.error("Upload failed", { description: err.message });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // Handle file delete
  const handleDelete = async (id: number, filename: string) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/files/${id}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) throw new Error("Delete failed");
      await fetchFiles();
      toast.success("File deleted", { description: filename });
    } catch (err: any) {
      setError(err.message || "Unknown error");
      toast.error("Delete failed", { description: err.message });
    } finally {
      setDeletingId(null);
    }
  };

  // Ensure files is always an array
  const safeFiles = Array.isArray(files) ? files : [];

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold dark:text-white text-black">
          My Files
        </h2>
        <Button asChild disabled={uploading}>
          <label className="cursor-pointer">
            {uploading ? "Uploading..." : "Upload File"}
            {/* Only allow .txt, .png, .jpg, .jpeg, .json files */}
            <input
              type="file"
              className="hidden"
              accept=".txt,.png,.jpg, .jpeg, .json"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </Button>
      </div>
      {error && (
        <Alert variant="destructive" className="mb-2">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="overflow-x-auto rounded border max-w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-white dark:text-white text-black">
                Type
              </TableHead>
              <TableHead className="text-white dark:text-white text-black">
                File Name
              </TableHead>
              <TableHead className="text-white dark:text-white text-black">
                Type
              </TableHead>
              <TableHead className="text-white dark:text-white text-black">
                Size (bytes)
              </TableHead>
              <TableHead className="text-white dark:text-white text-black">
                Upload Date
              </TableHead>
              <TableHead className="text-white dark:text-white text-black">
                Download
              </TableHead>
              <TableHead className="text-white dark:text-white text-black">
                Delete
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-4 text-white dark:text-white text-black"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : safeFiles.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-white dark:text-white text-black"
                >
                  {/* Nice empty state with icon and message */}
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      width="48"
                      height="48"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      className="text-muted-foreground mb-2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v12m-9 4h10a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1zm2-4V8a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v8"
                      />
                    </svg>
                    <span className="text-white dark:text-white text-black">
                      No files found. Upload your first file!
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              safeFiles.map((file) => (
                <TableRow key={file.id} className="border-t">
                  <TableCell className="text-white dark:text-white text-black">
                    {getFileIcon(file.original_filename)}
                  </TableCell>
                  <TableCell
                    className="text-white dark:text-white text-black max-w-[80px] truncate whitespace-nowrap overflow-hidden"
                    title={file.original_filename}
                  >
                    {file.original_filename}
                  </TableCell>
                  <TableCell className="text-white dark:text-white text-black">
                    {file.mimetype}
                  </TableCell>
                  <TableCell className="text-white dark:text-white text-black">
                    {file.size}
                  </TableCell>
                  <TableCell className="text-white dark:text-white text-black">
                    {new Date(file.upload_date).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      asChild
                      variant="default"
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                    >
                      <a
                        href={`${API_BASE}/files/${file.id}`}
                        download
                        onClick={() =>
                          toast.info("Download started", {
                            description: file.original_filename,
                          })
                        }
                      >
                        Download
                      </a>
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="default"
                      size="sm"
                      className="cursor-pointer bg-red-600 hover:bg-red-700 text-white"
                      onClick={() =>
                        handleDelete(file.id, file.original_filename)
                      }
                      disabled={deletingId === file.id}
                    >
                      {deletingId === file.id ? "Deleting..." : "Delete"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
