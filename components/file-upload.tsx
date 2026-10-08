"use client";

import { FileIcon, X } from "lucide-react";
import Image from "next/image";
import { UploadDropzone } from "@/lib/uploadthing";

interface FileUploadProps {
  onChange: (url?: string) => void;
  value: string;
  endpoint: "messageFile" | "serverImage";
}

export const FileUpload = ({
  onChange,
  value,
  endpoint
}: FileUploadProps) => {

  const fileType = value?.split('.').pop()?.toLowerCase();

  if (value && fileType !== 'pdf'){
    return(
      <div className="relative h-20 w-20">
        <Image 
          fill
          alt="Upload"
          src={value}
          unoptimized
          className="rounded-full"
        />
        <button
          onClick={() => onChange(undefined)}
          className="bg-rose-500 text-white p-1 rounded-full absolute top-0 right-0 shadow-sm"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }
  // Enhanced error handler function
  const handleUploadError = (error: Error, componentName: string) => {
    console.error(`❌ ${componentName} Error:`, error);
    console.error("Error details:", {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    // Check for specific error types and provide helpful messages
    if (error.message.includes("Unauthorized") || 
        error.message.includes("Failed to run middleware") ||
        error.message.includes("401")) {
      alert("Authentication required. Please sign in and try again.");
    } else if (error.message.includes("File too large") ||
               error.message.includes("maxFileSize")) {
      alert("File is too large. Please select a smaller file (max 4MB).");
    } else if (error.message.includes("Invalid file type") ||
               error.message.includes("not allowed")) {
      alert("Invalid file type. Please select an image file.");
    } else if (error.message.includes("Network") ||
               error.message.includes("fetch")) {
      alert("Network error. Please check your connection and try again.");
    } else {
      alert(`Upload Error: ${error.message}`);
    }
  };

  // Enhanced upload begin handler
  const handleUploadBegin = (name: string, componentName: string) => {
    console.log(`🚀 ${componentName} Started:`, name);
    console.log("Upload details:", {
      fileName: name,
      endpoint: endpoint,
      timestamp: new Date().toISOString()
    });
    
    // Optional: Show a less intrusive notification
    // You can replace this with a toast notification or loading state
    console.log(`Starting upload: ${name}`);
  };

  if (value && fileType === 'pdf'){
    return(
      <div className="relative flex items-center p-2 mt-2 rounded-md bg-background/10">
        
        <FileIcon 
          className="h-10 w-10 fill-indigo-200 stroke-indigo-400 "
        />
        <a 
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 text-sm text-indigo-500 dark:text-indigo-400 hover:underline"
        >
          {value}

        </a>
        <button
          onClick={() => onChange(undefined)}
          className="bg-rose-500 text-white p-1 rounded-full absolute -top-2 -right-2 shadow-sm"
        >
          <X className="h-4 w-4" />
        </button>

      </div>
    )
  }
  

  return (
    <div className="w-full">
      <div className="flex justify-center">
        <UploadDropzone
          endpoint={endpoint}
          onClientUploadComplete={(res) => {
            onChange(res[0]?.ufsUrl);
          }}
          onUploadError={(error: Error) => {
            handleUploadError(error, "FileUpload Dropzone");
          }}
          onUploadBegin={(name) => {
            handleUploadBegin(name, "FileUpload Dropzone");
          }}
          appearance={{
            container: {
              width: "200px",
              height: "200px",
              border: "2px dashed var(--border)",
              borderRadius: "8px",
              background: "var(--muted)",
              color: "var(--foreground)",
            },
            uploadIcon: {
              color: "var(--muted-foreground)",
              width: "40px",
              height: "40px",
            },
            label: {
              color: "transparent",
              fontSize: "0px",
              height: "0px",
              margin: "0px",
            },
            allowedContent: {
              color: "transparent",
              fontSize: "0px",
              height: "0px",
              margin: "0px",
            },
            button: {
              background: "var(--primary)",
              color: "var(--primary-foreground)",
              fontSize: "14px",
              borderRadius: "6px",
              padding: "8px 16px",
              marginTop: "8px",
            },
          }}
        />
      </div>
    </div>
  )
};
