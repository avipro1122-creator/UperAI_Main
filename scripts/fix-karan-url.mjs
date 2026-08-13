import { Client, Databases, Permission, Role } from 'node-appwrite';

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://api.uperai.in/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '6a79eb7d0027a520fe58';
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '6a79f6b70038d98dca2c';
const apiKey = process.env.APPWRITE_API_KEY || 'standard_cb7a45f0e589918899234a298eee3bdf983a82bacbab72c74cea3b832eb4a6fcc0326d9cec5785297564b2c415fb5fa7220202611367cb6344c5d6d705e50dc25c8d10a0a376c2d32f6af2c438ec19a5cc3cd09a2ed5125873de3a1c8271322bec4aa62f1c9d8ba03e4846f5832540dc0779ab937c080d65c81d4f5f33a709c7';

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);

async function main() {
  const docId = '6a7cae26003915c9d66d';
  console.log(`Re-creating Karan profile ${docId}...`);

  try {
    await databases.deleteDocument(databaseId, 'editor_profiles', docId);
    console.log('Deleted old document');
  } catch (err) {
    console.log('Delete status:', err.message);
  }

  const cleanReelUrl = 'https://youtube.com/shorts/nGvHEryEhW0';

  const payload = {
    user_id: '6a7b5e985183c5aef31b',
    full_name: 'Kumar Karan',
    specialty_tag: 'Short Form Video Editor',
    base_rate: 1100,
    turnaround_time: '2 Days',
    currency: 'INR',
    youtube_url: cleanReelUrl,
    youtube_url1: cleanReelUrl,
    youtube_url2: cleanReelUrl,
    youtube_url3: cleanReelUrl,
    whatsapp_number: '919016047119',
    whatsapp: '919016047119',
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

  console.log('✅ Re-created Karan profile with clean Reel URL:', newDoc.$id);
}

main().catch(console.error);
