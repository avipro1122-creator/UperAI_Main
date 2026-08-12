import { Client, Databases } from 'node-appwrite';

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://api.uperai.in/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '6a79eb7d0027a520fe58';
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '6a79f6b70038d98dca2c';
const apiKey = process.env.APPWRITE_API_KEY;

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);

async function main() {
  console.log('🔍 Checking site_analytics / pageviews collection in Appwrite...');
  try {
    const collections = await databases.listCollections(databaseId);
    console.log('Existing collections:', collections.collections.map(c => c.$id));
  } catch (err) {
    console.error('Error listing collections:', err.message);
  }
}

main();
