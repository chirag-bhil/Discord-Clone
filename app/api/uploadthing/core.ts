// app/api/uploadthing/core.ts
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@clerk/nextjs/server";

const f = createUploadthing();

const handleAuth = async () => {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      console.log("No user found in UploadThing middleware");
      // Instead of throwing, return anonymous user
      return { userId: "anonymous" };
    }
    
    return { userId };
  } catch (error) {
    console.error("Auth error in UploadThing:", error);
    // Fallback to anonymous if auth fails
    return { userId: "anonymous" };
  }
}

export const ourFileRouter: FileRouter = {
  serverImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(() => handleAuth())
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);
      
      return { uploadedBy: metadata.userId };
    }),
  messageFile: f(["image", "pdf"])
    .middleware(() => handleAuth())
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);
      
      return { uploadedBy: metadata.userId };
    })
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
