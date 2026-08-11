import { Client, Databases } from 'node-appwrite';

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://api.uperai.in/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '6a79eb7d0027a520fe58';
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '6a79f6b70038d98dca2c';
const apiKey = process.env.APPWRITE_API_KEY;

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);

async function main() {
  const attrs = await databases.listAttributes(databaseId, 'editor_profiles');
  console.log('Current attributes in editor_profiles:');
  for (const a of attrs.attributes) {
    console.log(`- ${a.key} (${a.type}) status: ${a.status}`);
  }
}

main().catch(console.error);
