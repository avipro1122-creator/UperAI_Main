import { Client, Databases, Query } from 'node-appwrite';

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
  console.log('🔄 Checking existing editor profiles for missing instagram / youtube_url...');
  const profiles = await databases.listDocuments(databaseId, 'editor_profiles');
  
  for (const doc of profiles.documents) {
    console.log(`Checking profile ${doc.$id} (${doc.full_name})...`);
    
    // Fetch portfolio items for this editor
    const itemsRes = await databases.listDocuments(databaseId, 'portfolio_items', [
      Query.equal('editor_id', doc.user_id || doc.$id),
    ]);
    const firstItem = itemsRes.documents[0];
    const youtubeUrl = doc.youtube_url || firstItem?.youtube_url || firstItem?.video_url || '';
    const instagramVal = doc.instagram || doc.instagram_handle || '';

    const updates = {};
    if (!doc.youtube_url && youtubeUrl) {
      updates.youtube_url = youtubeUrl;
    }
    if (!doc.instagram && instagramVal) {
      updates.instagram = instagramVal;
    }
    if (!doc.instagram_handle && instagramVal) {
      updates.instagram_handle = instagramVal;
    }

    if (Object.keys(updates).length > 0) {
      console.log(`Updating profile ${doc.$id} with:`, updates);
      await databases.updateDocument(databaseId, 'editor_profiles', doc.$id, updates);
      console.log(`✅ Profile ${doc.$id} updated.`);
    } else {
      console.log(`✓ Profile ${doc.$id} OK.`);
    }
  }

  console.log('🎉 Fix complete!');
}

main().catch(console.error);
