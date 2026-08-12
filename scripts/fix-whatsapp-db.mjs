import { Client, Databases } from 'node-appwrite';

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://api.uperai.in/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '6a79eb7d0027a520fe58';
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '6a79f6b70038d98dca2c';
const apiKey = process.env.APPWRITE_API_KEY;

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);

async function main() {
  console.log('🔍 Listing all editor profiles in Appwrite database...');
  const res = await databases.listDocuments(databaseId, 'editor_profiles');
  
  for (const doc of res.documents) {
    console.log(`Document ID: ${doc.$id}`);
    console.log(`  Name: ${doc.full_name || doc.name}`);
    console.log(`  whatsapp: ${doc.whatsapp}`);
    console.log(`  whatsapp_number: ${doc.whatsapp_number}`);

    const phoneVal = doc.whatsapp_number || doc.whatsapp || '919016047119';
    const payload = {};
    if (!doc.whatsapp) payload.whatsapp = phoneVal;
    if (!doc.whatsapp_number) payload.whatsapp_number = phoneVal;

    if (Object.keys(payload).length > 0) {
      console.log(`  Updating ${doc.$id} with:`, payload);
      try {
        await databases.updateDocument(databaseId, 'editor_profiles', doc.$id, payload);
        console.log(`  ✅ Updated ${doc.$id}`);
      } catch (err) {
        console.error(`  ❌ Error updating ${doc.$id}:`, err.message);
      }
    }
  }
}

main().catch(console.error);
