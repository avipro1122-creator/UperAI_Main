import { Client, Databases, Permission, Role } from 'node-appwrite';

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://api.uperai.in/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '6a79eb7d0027a520fe58';
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '6a79f6b70038d98dca2c';
const apiKey = process.env.APPWRITE_API_KEY;

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);

async function main() {
  console.log('🔄 Re-creating editor profiles with valid schema and WhatsApp numbers...');

  const list = await databases.listDocuments(databaseId, 'editor_profiles');
  for (const doc of list.documents) {
    console.log(`Processing ${doc.$id} (${doc.full_name || doc.name})...`);
    
    // Save key values
    const userId = doc.user_id || doc.$id;
    const name = doc.full_name || doc.display_name || doc.name || 'Editor';
    const phone = doc.whatsapp_number || doc.whatsapp || '919016047119';

    const cleanPayload = {
      user_id: userId,
      full_name: name,
      display_name: name,
      name: name,
      headline: doc.headline || doc.specialty_tag || 'Video Editor',
      specialty_tag: doc.specialty_tag || doc.headline || 'Video Editor',
      base_rate: Number(doc.base_rate || 1500),
      rate_short: Number(doc.rate_short || doc.base_rate || 1500),
      rate_long: Number(doc.rate_long || 8000),
      min_rate: Number(doc.min_rate || doc.base_rate || 1500),
      max_rate: Number(doc.max_rate || 8000),
      currency: doc.currency || 'INR',
      turnaround_time: doc.turnaround_time || '2 Days',
      turnaround_days: Number(doc.turnaround_days || 2),
      whatsapp: phone,
      whatsapp_number: phone,
      instagram: doc.instagram || doc.instagram_handle || '',
      instagram_handle: doc.instagram_handle || doc.instagram || '',
      youtube_url: doc.youtube_url || '',
      youtube_url1: doc.youtube_url1 || doc.youtube_url || '',
      youtube_url2: doc.youtube_url2 || '',
      avatar_url: doc.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      preview_img: doc.preview_img || '',
      bio: doc.bio || '',
      open_to_work: true,
      is_hidden: false,
    };

    // Delete old invalid doc
    try {
      await databases.deleteDocument(databaseId, 'editor_profiles', doc.$id);
      console.log(`  Deleted old document ${doc.$id}`);
    } catch (e) {
      console.log(`  Delete error: ${e.message}`);
    }

    // Create fresh doc without stale invalid attributes
    const newDoc = await databases.createDocument(
      databaseId,
      'editor_profiles',
      doc.$id,
      cleanPayload,
      [
        Permission.read(Role.any()),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId)),
      ]
    );

    console.log(`  ✅ Successfully created clean document ${newDoc.$id} with whatsapp: ${newDoc.whatsapp_number}`);
  }
}

main().catch(console.error);
