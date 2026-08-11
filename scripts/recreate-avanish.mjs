import { Client, Databases, Query, ID } from 'node-appwrite';

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://api.uperai.in/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '6a79eb7d0027a520fe58';
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '6a79f6b70038d98dca2c';
const apiKey = process.env.APPWRITE_API_KEY;

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);

async function main() {
  const targetUrl = 'https://www.youtube.com/watch?v=xcLZwgQ8Uog&t=8s';
  const videoId = 'xcLZwgQ8Uog';
  const thumbnailUrl = 'https://img.youtube.com/vi/xcLZwgQ8Uog/hqdefault.jpg';

  const docId = '6a7af1de00242d2edd3a';
  const userId = docId;

  console.log(`✨ Creating fresh profile document for Avanish Rai with YouTube URL...`);
  await databases.createDocument(databaseId, 'editor_profiles', docId, {
    user_id: userId,
    full_name: 'Avanish Rai',
    display_name: 'Avanish Rai',
    name: 'Avanish Rai',
    headline: 'I Edit Gaming Videos',
    specialty_tag: 'I Edit Gaming Videos',
    base_rate: 1500,
    rate_short: 1500,
    rate_long: 8000,
    min_rate: 1500,
    max_rate: 8000,
    currency: 'INR',
    turnaround_time: '2 Days',
    turnaround_days: 2,
    whatsapp: '919876543210',
    whatsapp_number: '919876543210',
    instagram: 'avanishrai',
    instagram_handle: 'avanishrai',
    youtube_url: targetUrl,
    avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Avanish%20Rai',
    preview_img: thumbnailUrl,
    bio: 'I create high-converting video edits that scale channels.',
    open_to_work: true,
    is_hidden: false,
  });
  console.log('✅ Created fresh editor_profiles document for Avanish Rai!');

  // Clean up & create portfolio item
  try {
    const existing = await databases.listDocuments(databaseId, 'portfolio_items', [
      Query.equal('editor_id', userId),
    ]);
    for (const doc of existing.documents) {
      await databases.deleteDocument(databaseId, 'portfolio_items', doc.$id);
    }
  } catch {}

  await databases.createDocument(databaseId, 'portfolio_items', ID.unique(), {
    editor_id: userId,
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
  console.log('✅ Created portfolio item with YouTube video for Avanish Rai!');
}

main().catch(console.error);
