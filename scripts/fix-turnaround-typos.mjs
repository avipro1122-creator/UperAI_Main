import { Client, Databases } from 'node-appwrite';

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

const formatTurnaround = (val) => {
  if (!val) return '2 Days';
  const str = String(val).trim();
  const numMatch = str.match(/\d+/);
  if (numMatch) {
    const num = numMatch[0];
    return `${num} ${Number(num) === 1 ? 'Day' : 'Days'}`;
  }
  if (/hour/i.test(str)) return str;
  return str.replace(/ays?/i, 'Days').replace(/days?/i, 'Days');
};

async function main() {
  console.log('🔄 Checking all editor profiles for corrupted turnaround_time values...');
  const profiles = await databases.listDocuments(databaseId, 'editor_profiles');

  for (const doc of profiles.documents) {
    const rawTT = doc.turnaround_time;
    const cleanTT = formatTurnaround(rawTT);

    if (rawTT !== cleanTT) {
      console.log(`Fixing profile ${doc.$id} (${doc.full_name}): "${rawTT}" -> "${cleanTT}"`);
      try {
        await databases.updateDocument(databaseId, 'editor_profiles', doc.$id, {
          turnaround_time: cleanTT,
        });
        console.log(`✅ Profile ${doc.$id} updated.`);
      } catch (err) {
        console.error(`Failed to update ${doc.$id}:`, err.message);
      }
    } else {
      console.log(`✓ Profile ${doc.$id} (${doc.full_name}) turnaround_time OK: "${rawTT}"`);
    }
  }

  console.log('🎉 Turnaround time fix complete!');
}

main().catch(console.error);
