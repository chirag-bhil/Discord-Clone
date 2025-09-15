"use client";

import { UploadButton } from "@/lib/uploadthing";

export default function DebugUpload() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">Debug Upload Test</h1>
      
      <div className="space-y-4">
        <p>Testing direct UploadButton:</p>
        <UploadButton
          endpoint="serverImage"
          onClientUploadComplete={(res) => {
            console.log("✅ DEBUG Upload Success:", res);
            alert(`Success! URL: ${res[0]?.url}`);
          }}
          onUploadError={(error: Error) => {
            console.error("❌ DEBUG Upload Error:", error);
            alert(`Error: ${error.message}`);
          }}
          onUploadBegin={(name) => {
            console.log("🚀 DEBUG Upload Started:", name);
            alert(`Starting upload: ${name}`);
          }}
        />
      </div>
    </div>
  );
}
