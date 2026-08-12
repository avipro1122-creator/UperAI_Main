import { Client, Databases, Permission, Role } from 'node-appwrite';

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://api.uperai.in/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '6a79eb7d0027a520fe58';
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '6a79f6b70038d98dca2c';
const apiKey = process.env.APPWRITE_API_KEY;

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);

async function main() {
  console.log('✨ Creating site_analytics collection in Appwrite...');
  
  // Ensure daily counter document exists
  try {
    const todayDoc = await databases.getDocument(databaseId, 'site_analytics', 'daily_visitors');
    console.log('daily_visitors doc exists:', todayDoc);
  } catch {
    await databases.createDocument(databaseId, 'site_analytics', 'daily_visitors', {
      page: 'home',
      timestamp: new Date().toISOString(),
      user_agent: 'system_init',
    }, [
      Permission.read(Role.any()),
      Permission.update(Role.any()),
      Permission.delete(Role.any()),
    ]);
    console.log('✅ Created initial daily_visitors document in site_analytics!');
  }
}

main().catch(console.error);
