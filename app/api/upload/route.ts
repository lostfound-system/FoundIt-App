import { NextResponse } from "next/server";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { storage, auth } from "@/lib/firebase";

export async function POST(request: Request) {
    try {
        // await signInAnonymously(auth); // Removed: Admin Restricted Operation

        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Convert File to ArrayBuffer for upload
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create a unique filename
        const filename = `images/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
        const storageRef = ref(storage, filename);

        // Upload (Server-side, bypasses CORS)
        const snapshot = await uploadBytes(storageRef, buffer, {
            contentType: file.type,
        });

        const url = await getDownloadURL(snapshot.ref);

        return NextResponse.json({ url });
    } catch (error: any) {
        console.error("Upload handler error:", error);
        return NextResponse.json(
            { error: error.message || "Upload failed" },
            { status: 500 }
        );
    }
}
