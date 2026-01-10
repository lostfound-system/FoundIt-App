"use server";

import { db } from "@/lib/firebase";
import { model } from "@/lib/gemini";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { redirect } from "next/navigation";

export async function createItem(prevState: any, formData: FormData) {
    const type = formData.get("type") as string;
    const description = formData.get("description") as string;
    const location = formData.get("location") as string;
    const contact = formData.get("contact") as string;

    // Image handling removed

    const university = formData.get("university") as string;
    const category = formData.get("category") as string;

    let newItemId = "";

    // Validations
    if (!university || !category) {
        return { message: "Please select a university and category." };
    }

    try {
        // 1. Analyze with Gemini (Text Only)
        interface AiAnalysis {
            tags: string[];
            shortDescription: string;
        }
        let analysis: AiAnalysis = { tags: [], shortDescription: "" };

        try {
            const prompt = `Analyze this item for a lost and found database. 
            Context: Item reported at ${university}, Category: ${category}.
            Description: "${description}"
            
            Return a JSON object with:
            - "tags": array of 5 strings describing features (color, object type, specific details).
            - "shortDescription": a clean 1-sentence summary.
            Do not use markdown code blocks. Just the Raw JSON string.`;

            const parts: any[] = [prompt];

            const result = await model.generateContent(parts);
            const responseText = result.response.text();
            const cleanJson = responseText.replace(/```json|```/g, "").trim();
            analysis = JSON.parse(cleanJson);
        } catch (aiError) {
            console.error("Gemini Analysis Failed:", aiError);
            // Fallback: Use manual strategy or empty tags
            analysis = {
                tags: category === 'electronic' ? ['electronic', 'gadget'] : ['item'],
                shortDescription: description
            };
        }

        // 2. Save to Firestore
        const docRef = await addDoc(collection(db, "items"), {
            type,
            university,
            category,
            description,
            imageUrl: "https://placehold.co/600x400?text=No+Image", // Default Placeholder
            location,
            contact,
            tags: analysis.tags || [],
            aiDescription: analysis.shortDescription || "",
            createdAt: serverTimestamp(),
            status: "open",
        });

        newItemId = docRef.id;

        console.log("Document written with ID: ", docRef.id);

        // 3. Trigger Matching Engine
        try {
            // Hard Filter: University + Category + Opposite Type
            const matchType = type === "lost" ? "found" : "lost";
            const matchesQuery = query(
                collection(db, "items"),
                where("type", "==", matchType),
                where("university", "==", university),
                where("category", "==", category),
                where("status", "==", "open")
            );

            const candidateDocs = await getDocs(matchesQuery);

            if (!candidateDocs.empty) {
                console.log(`Found ${candidateDocs.size} potential candidates by Hard Filter.`);

                // Prepare for AI Analysis
                const candidates = candidateDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // We'll process in batches or one-by-one. For MVP, finding the BEST match.
                const matchPrompt = `
                        I have a NEW item and a list of CANDIDATE items.
                        Goal: Identify if any candidate semantically matches the description of the new item with > 65% confidence.
                        
                        NEW ITEM:
                        Description: "${description}"
                        Location: "${location}"
                        Tags: ${JSON.stringify(analysis.tags)}

                        CANDIDATES:
                        ${JSON.stringify(candidates.map((c: any) => ({
                    id: c.id,
                    description: c.description,
                    location: c.location,
                    tags: c.tags
                })))}

                        Task:
                        Compare the NEW ITEM to each CANDIDATE.
                        Return a JSON object:
                        {
                            "bestMatchId": "id_of_best_match" or null,
                            "confidence": number (0-100),
                            "reason": "explanation of why it matches"
                        }
                        If confidence < 65, set bestMatchId to null.
                        Do not use markdown. Raw JSON only.
                    `;

                const matchResult = await model.generateContent(matchPrompt);
                const matchText = matchResult.response.text().replace(/```json|```/g, "").trim();
                const matchAnalysis = JSON.parse(matchText);

                if (matchAnalysis.bestMatchId && matchAnalysis.confidence >= 65) {
                    console.log("MATCH FOUND!", matchAnalysis);

                    // Update both items status to "matched" (or "potential_match")
                    // For this MVP, we will just log the notification
                    await sendNotification(contact, "Match Found!");

                    // We could also store the match in a "matches" collection
                    await addDoc(collection(db, "matches"), {
                        item1Id: docRef.id,
                        item2Id: matchAnalysis.bestMatchId,
                        confidence: matchAnalysis.confidence,
                        reason: matchAnalysis.reason,
                        createdAt: serverTimestamp()
                    });
                } else {
                    console.log("No semantic match found above threshold.");
                }
            } else {
                console.log("No candidates found with Hard Filter.");
            }
        } catch (matchError) {
            console.error("Matching Logic Failed (Non-fatal):", matchError);
        }

    } catch (e) {
        console.error("Error processing item: ", e);
        return { message: "Failed to submit item. Please try again." };
    }

    redirect(`/matches/${newItemId}`);
}

async function sendNotification(contact: string, message: string) {
    // Mock Email/SMS Service
    console.log(`[NOTIFICATION] Sending to ${contact}: ${message}`);
    // roughly simulate API call (feature disabled/reverted per user request)
    await new Promise(r => setTimeout(r, 500));
}

import { deleteDoc, doc, getDoc } from "firebase/firestore";

export async function deleteItem(itemId: string) {
    try {
        await deleteDoc(doc(db, "items", itemId));
        console.log("Deleted item:", itemId);
        return { success: true };
    } catch (error) {
        console.error("Error deleting item:", error);
        throw new Error("Failed to delete item");
    }
}

// NEW: Hybrid Matching Action
export async function findMatches(itemId: string) {
    try {
        // 1. Get the source item
        const itemSnap = await getDoc(doc(db, "items", itemId));
        if (!itemSnap.exists()) return [];
        const item = itemSnap.data();

        // 2. Define Candidate Scope (Broader than before)
        const matchType = item.type === "lost" ? "found" : "lost";

        const q = query(
            collection(db, "items"),
            where("type", "==", matchType),
            where("status", "==", "open")
        );

        const candidatesSnap = await getDocs(q);
        const allCandidates = candidatesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        console.log(`Searching against ${allCandidates.length} potential candidates...`);

        // 3. Keyword / Fuzzy Filter (Client-side logic)
        const keywords = item.description.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);

        const keywordMatches = allCandidates.filter((candidate: any) => {
            const candDesc = candidate.description.toLowerCase();
            const hasKeywordMatch = keywords.some((kw: string) => candDesc.includes(kw));
            const sameUni = candidate.university === item.university;
            return hasKeywordMatch && sameUni;
        });

        let finalCandidates = keywordMatches;

        if (finalCandidates.length === 0) {
            // Fallback: Try AI on all items from same University
            finalCandidates = allCandidates.filter((c: any) => c.university === item.university);
        }

        // 4. Resolve Contact Details (Phone -> Email)
        const enhancedCandidates = await Promise.all(finalCandidates.map(async (c: any) => {
            let email = c.contact;
            let contactType = c.contact.includes('@') ? 'email' : 'phone';

            // If contact is a phone number, try to find the user's email
            if (contactType === 'phone') {
                try {
                    // Try to find user where phoneNumber matches
                    const usersQ = query(collection(db, "users"), where("phoneNumber", "==", c.contact));
                    const usersSnap = await getDocs(usersQ);

                    if (!usersSnap.empty) {
                        email = usersSnap.docs[0].data().email; // Found the email!
                    } else {
                        // Fallback: Check if the contact string itself is a User ID (which might be email)
                        // This handles cases where old data might have mixed formats
                        const directUserSnap = await getDoc(doc(db, "users", c.contact));
                        if (directUserSnap.exists()) {
                            email = directUserSnap.data().email || directUserSnap.id;
                        }
                    }
                } catch (e) {
                    console.error("Error resolving email for contact:", c.contact, e);
                }
            }

            return {
                id: c.id,
                description: c.description,
                imageUrl: c.imageUrl,
                location: c.location,
                contact: c.contact, // Display Value (might be phone)
                email: email,       // Action Value (always try to be email)
                contactType: contactType,
                university: c.university,
                matchType: keywordMatches.includes(c) ? 'Keyword Match' : 'Potential Match'
            };
        }));

        return enhancedCandidates;

    } catch (error) {
        console.error("Find Matches Failed:", error);
        return [];
    }
}
export async function updateItem(prevState: any, formData: FormData) {
    const id = formData.get("id") as string;
    const university = formData.get("university") as string;
    const category = formData.get("category") as string;
    const description = formData.get("description") as string;
    const location = formData.get("location") as string;
    const contact = formData.get("contact") as string;

    if (!id || !university || !category || !description) {
        return { message: "Missing required fields." };
    }

    try {
        const { doc, updateDoc } = await import("firebase/firestore");
        const itemRef = doc(db, "items", id);

        await updateDoc(itemRef, {
            university,
            category,
            description,
            location,
            contact,
            updatedAt: serverTimestamp()
        });
    } catch (e) {
        console.error("Error updating item:", e);
        return { message: "Failed to update item." };
    }

    // Re-redirect to matches or dashboard
    redirect(`/matches/${id}`);
}
// NEW: Cascading Delete User
export async function deleteUserAndData(email: string) {
    try {
        console.log(`[DELETE USER] Initiating delete for: ${email}`);

        // 1. Get User Data (to get Phone Number for finding items)
        const userRef = doc(db, "users", email);
        const userSnap = await getDoc(userRef);
        let phone = "";

        if (userSnap.exists()) {
            phone = userSnap.data().phoneNumber || "";
        }

        // 2. Find and Delete ALL items created by this user (by Email contact)
        const itemsQueryEmail = query(collection(db, "items"), where("contact", "==", email));
        const itemsSnapEmail = await getDocs(itemsQueryEmail);

        const deletePromises = itemsSnapEmail.docs.map(d => deleteDoc(d.ref));

        // 3. Find and Delete ALL items created by this user (by Phone contact, if exists)
        if (phone) {
            const itemsQueryPhone = query(collection(db, "items"), where("contact", "==", phone));
            const itemsSnapPhone = await getDocs(itemsQueryPhone);
            itemsSnapPhone.docs.forEach(d => deletePromises.push(deleteDoc(d.ref)));
        }

        await Promise.all(deletePromises);
        console.log(`[DELETE USER] Deleted ${deletePromises.length} items related to user.`);

        // 4. Delete User Profile Doc
        await deleteDoc(userRef);
        console.log(`[DELETE USER] User profile deleted.`);

        return { success: true };

    } catch (error) {
        console.error("Error deleting user/data:", error);
        return { success: false, message: "Failed to delete user data." };
    }
}
