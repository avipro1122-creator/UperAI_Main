import { Client, Databases, Permission, Role } from 'node-appwrite';

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://api.uperai.in/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '6a79eb7d0027a520fe58';
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '6a79f6b70038d98dca2c';
const apiKey = process.env.APPWRITE_API_KEY;

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);

async function main() {
  const docId = '6a7b63e50013a72ba999';
  console.log(`Re-creating profile ${docId}...`);

  try {
    await databases.deleteDocument(databaseId, 'editor_profiles', docId);
    console.log('Deleted old document');
  } catch (err) {
    console.log('Delete status:', err.message);
  }

  const payload = {
    user_id: '6a7b5e985183c5aef31b',
    full_name: 'Kumar Karan',
    specialty_tag: 'Short Form Video Editor',
    base_rate: 900,
    turnaround_time: '3 Days',
    currency: 'INR',
    youtube_url: 'https://youtube.com/shorts/nGvHEryEhW0?si=Rnja1MbHYzjjgGc7',
    youtube_url1: 'https://youtube.com/shorts/nGvHEryEhW0?si=Rnja1MbHYzjjgGc7',
    youtube_url2: 'https://youtube.com/shorts/nGvHEryEhW0?si=Rnja1MbHYzjjgGc7',
    open_to_work: true,
    is_hidden: false,
  };

  const newDoc = await databases.createDocument(
    databaseId,
    'editor_profiles',
    docId,
    payload,
    [
      Permission.read(Role.any()),
      Permission.update(Role.user('6a7b5e985183c5aef31b')),
      Permission.delete(Role.user('6a7b5e985183c5aef31b')),
    ]
  );

  console.log('✅ Re-created clean profile document:', newDoc.$id, 'Turnaround:', newDoc.turnaround_time);
}

main().catch(console.error);
