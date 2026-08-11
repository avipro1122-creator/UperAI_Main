import { Client, Databases, Query, ID } from 'node-appwrite';

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://api.uperai.in/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '6a79eb7d0027a520fe58';
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '6a79f6b70038d98dca2c';
const apiKey = process.env.APPWRITE_API_KEY;

if (!apiKey) {
  console.error('APPWRITE_API_KEY missing');
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);

async function main() {
  const targetUrl = 'https://www.youtube.com/watch?v=xcLZwgQ8Uog&t=8s';
  const videoId = 'xcLZwgQ8Uog';
  const thumbnailUrl = 'https://img.youtube.com/vi/xcLZwgQ8Uog/hqdefault.jpg';

  console.log('🔍 Finding Avanish Rai in editor_profiles...');
  const profiles = await databases.listDocuments(databaseId, 'editor_profiles');
  const avanish = profiles.documents.find(
    (p) => p.full_name?.toLowerCase().includes('avanish') || p.name?.toLowerCase().includes('avanish')
  );

  if (!avanish) {
    console.error('❌ Avanish Rai profile not found in editor_profiles collection');
    process.exit(1);
  }

  console.log(`✅ Found Avanish Rai profile ID: ${avanish.$id}`);

  const editorId = avanish.user_id || avanish.$id;

  // 1. Update editor_profiles with handle included
  await databases.updateDocument(databaseId, 'editor_profiles', avanish.$id, {
    youtube_url: targetUrl,
    full_name: avanish.full_name || 'Avanish Rai',
    user_id: editorId,
    handle: avanish.handle || 'avanishrai',
    instagram: avanish.instagram || avanish.instagram_handle || 'avanishrai',
    instagram_handle: avanish.instagram_handle || avanish.instagram || 'avanishrai',
  });
  console.log(`✅ Updated youtube_url on editor_profiles for ${avanish.full_name}`);

  // 2. Clean up old portfolio_items for Avanish
  try {
    const existing = await databases.listDocuments(databaseId, 'portfolio_items', [
      Query.equal('editor_id', editorId),
    ]);
    for (const doc of existing.documents) {
      await databases.deleteDocument(databaseId, 'portfolio_items', doc.$id);
    }
  } catch {
    // Ignore cleanup
  }

  // 3. Create portfolio item
  await databases.createDocument(databaseId, 'portfolio_items', ID.unique(), {
    editor_id: editorId,
    title: 'I Edit Gaming Videos',
    video_url: targetUrl,
    youtube_url: targetUrl,
    video_id: videoId,
    role_description: 'I Record & Edit this under 2 days',
    position: 0,
    thumbnail_url: thumbnailUrl,
    is_short: false,
    is_available: true,
  });
  console.log('✅ Created portfolio item with YouTube video for Avanish Rai');
}

main().catch(console.error);
