import { Client, Databases } from 'node-appwrite';

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://api.uperai.in/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '6a79eb7d0027a520fe58';
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '6a79f6b70038d98dca2c';
const apiKey = process.env.APPWRITE_API_KEY || 'standard_cb7a45f0e589918899234a298eee3bdf983a82bacbab72c74cea3b832eb4a6fcc0326d9cec5785297564b2c415fb5fa7220202611367cb6344c5d6d705e50dc25c8d10a0a376c2d32f6af2c438ec19a5cc3cd09a2ed5125873de3a1c8271322bec4aa62f1c9d8ba03e4846f5832540dc0779ab937c080d65c81d4f5f33a709c7';

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);

async function main() {
  console.log('Populating handles on editor_profiles...');
  const res = await databases.listDocuments(databaseId, 'editor_profiles');
  for (const doc of res.documents) {
    const name = doc.full_name || doc.name || doc.display_name || 'editor';
    const generatedHandle = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    console.log(`Updating doc ${doc.$id} (${name}) -> handle: "${generatedHandle}"`);
    try {
      const updated = await databases.updateDocument(databaseId, 'editor_profiles', doc.$id, {
        handle: generatedHandle,
      });
      console.log(`✅ Success for ${doc.$id}: handle="${updated.handle}"`);
    } catch (err) {
      console.log(`❌ Error for ${doc.$id}:`, err.message);
    }
  }
}

main().catch(console.error);
