import { Client, Databases } from 'node-appwrite';

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://api.uperai.in/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '6a79eb7d0027a520fe58';
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '6a79f6b70038d98dca2c';
const apiKey = process.env.APPWRITE_API_KEY || 'standard_cb7a45f0e589918899234a298eee3bdf983a82bacbab72c74cea3b832eb4a6fcc0326d9cec5785297564b2c415fb5fa7220202611367cb6344c5d6d705e50dc25c8d10a0a376c2d32f6af2c438ec19a5cc3cd09a2ed5125873de3a1c8271322bec4aa62f1c9d8ba03e4846f5832540dc0779ab937c080d65c81d4f5f33a709c7';

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);

async function main() {
  console.log('Fetching editor_profiles...');
  const res = await databases.listDocuments(databaseId, 'editor_profiles');
  console.log(`Found ${res.documents.length} profiles:`);
  for (const doc of res.documents) {
    console.log(`\nID: ${doc.$id} | Name: ${doc.full_name}`);
    console.log(`yt_url: ${doc.youtube_url}`);
    console.log(`yt_url1: ${doc.youtube_url1}`);
    console.log(`yt_url2: ${doc.youtube_url2}`);
    console.log(`yt_url3: ${doc.youtube_url3}`);
  }
}

main().catch(console.error);
