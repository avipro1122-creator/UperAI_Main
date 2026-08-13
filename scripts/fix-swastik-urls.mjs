import { Client, Databases } from 'node-appwrite';

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://api.uperai.in/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '6a79eb7d0027a520fe58';
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '6a79f6b70038d98dca2c';
const apiKey = process.env.APPWRITE_API_KEY || 'standard_cb7a45f0e589918899234a298eee3bdf983a82bacbab72c74cea3b832eb4a6fcc0326d9cec5785297564b2c415fb5fa7220202611367cb6344c5d6d705e50dc25c8d10a0a376c2d32f6af2c438ec19a5cc3cd09a2ed5125873de3a1c8271322bec4aa62f1c9d8ba03e4846f5832540dc0779ab937c080d65c81d4f5f33a709c7';

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);

async function main() {
  const docId = '6a7c550f001e035c1899';
  console.log(`Re-creating Swastik Yadav profile ${docId}...`);

  try {
    await databases.deleteDocument(databaseId, 'editor_profiles', docId);
    console.log('Deleted old document');
  } catch (err) {
    console.log('Delete status:', err.message);
  }

  const vimeoUrl = 'https://vimeo.com/1174509374?fl=ip&fe=ec';
  const netlifyUrl = 'https://beinfinite-portfolio.netlify.app/';

  const payload = {
    user_id: '6a7c54cc2127c2c33179',
    full_name: 'Swastik yadav',
    specialty_tag: 'Short Form Video Editor',
    base_rate: 500,
    turnaround_time: '1 Day',
    currency: 'INR',
    youtube_url: vimeoUrl,
    youtube_url1: vimeoUrl,
    youtube_url2: netlifyUrl,
    youtube_url3: '',
    whatsapp_number: '919046855338',
    whatsapp: '919046855338',
    open_to_work: true,
    is_hidden: false,
  };

  const newDoc = await databases.createDocument(
    databaseId,
    'editor_profiles',
    docId,
    payload
  );

  console.log('✅ Re-created Swastik Yadav profile with Vimeo and Netlify showreels:', newDoc.$id);
}

main().catch(console.error);
