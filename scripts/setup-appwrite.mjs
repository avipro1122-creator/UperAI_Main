import { Client, Databases, Permission, Role } from 'node-appwrite';

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '6a79eb7d0027a520fe58';
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '6a79f6b70038d98dca2c';
const apiKey = process.env.APPWRITE_API_KEY || process.env.APPWRITE_KEY;

console.log('🚀 Starting Appwrite Database Provisioning...');
console.log(`📌 Endpoint: ${endpoint}`);
console.log(`📌 Project ID: ${projectId}`);
console.log(`📌 Database ID: ${databaseId}`);

if (!apiKey) {
  console.error('\n❌ APPWRITE_API_KEY is missing in environment variables!');
  console.error('Please create an API Key in Appwrite Console -> Project Settings -> API Keys (with Database scopes) and set APPWRITE_API_KEY in .env.local.');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);

// Ensure Database exists
try {
  await databases.get(databaseId);
  console.log(`\n✅ Database '${databaseId}' verified.`);
} catch {
  console.log(`\n⏳ Database '${databaseId}' not found. Creating database...`);
  await databases.create(databaseId, 'UperAI');
  console.log(`✅ Database '${databaseId}' created successfully.`);
}

const collectionsConfig = [
  {
    id: 'editor_profiles',
    name: 'Editor Profiles',
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ],
    attributes: [
      { key: 'user_id', type: 'string', size: 255, required: true },
      { key: 'full_name', type: 'string', size: 255, required: true },
      { key: 'display_name', type: 'string', size: 255, required: false },
      { key: 'name', type: 'string', size: 255, required: false },
      { key: 'headline', type: 'string', size: 500, required: false },
      { key: 'specialty_tag', type: 'string', size: 255, required: false },
      { key: 'base_rate', type: 'integer', required: false, default: 1500 },
      { key: 'rate_long', type: 'integer', required: false },
      { key: 'rate_short', type: 'integer', required: false },
      { key: 'min_rate', type: 'integer', required: false },
      { key: 'max_rate', type: 'integer', required: false },
      { key: 'currency', type: 'string', size: 10, required: false, default: 'INR' },
      { key: 'turnaround_time', type: 'string', size: 100, required: false },
      { key: 'turnaround_days', type: 'integer', required: false },
      { key: 'whatsapp', type: 'string', size: 50, required: false },
      { key: 'whatsapp_number', type: 'string', size: 50, required: false },
      { key: 'instagram_handle', type: 'string', size: 100, required: false },
      { key: 'instagram', type: 'string', size: 100, required: false },
      { key: 'youtube_url', type: 'string', size: 2000, required: false },
      { key: 'avatar_url', type: 'string', size: 2000, required: false },
      { key: 'preview_img', type: 'string', size: 2000, required: false },
      { key: 'bio', type: 'string', size: 2000, required: false },
      { key: 'handle', type: 'string', size: 255, required: false },
      { key: 'open_to_work', type: 'boolean', required: false, default: true },
      { key: 'is_hidden', type: 'boolean', required: false, default: false },
    ],
    indexes: [
      { key: 'user_id_idx', type: 'key', attributes: ['user_id'] },
      { key: 'is_hidden_idx', type: 'key', attributes: ['is_hidden'] },
    ],
  },
  {
    id: 'portfolio_items',
    name: 'Portfolio Items',
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ],
    attributes: [
      { key: 'editor_id', type: 'string', size: 255, required: true },
      { key: 'title', type: 'string', size: 500, required: false },
      { key: 'video_url', type: 'string', size: 2000, required: false },
      { key: 'youtube_url', type: 'string', size: 2000, required: false },
      { key: 'video_id', type: 'string', size: 255, required: false },
      { key: 'role_description', type: 'string', size: 2000, required: false },
      { key: 'role_explanation', type: 'string', size: 2000, required: false },
      { key: 'position', type: 'integer', required: false, default: 0 },
      { key: 'thumbnail_url', type: 'string', size: 2000, required: false },
      { key: 'is_short', type: 'boolean', required: false, default: false },
      { key: 'format', type: 'string', size: 50, required: false },
      { key: 'is_available', type: 'boolean', required: false, default: true },
    ],
    indexes: [
      { key: 'editor_id_idx', type: 'key', attributes: ['editor_id'] },
      { key: 'is_available_idx', type: 'key', attributes: ['is_available'] },
    ],
  },
  {
    id: 'users',
    name: 'Users',
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ],
    attributes: [
      { key: 'name', type: 'string', size: 255, required: false },
      { key: 'handle', type: 'string', size: 255, required: false },
      { key: 'role', type: 'string', size: 50, required: false, default: 'creator' },
      { key: 'bio', type: 'string', size: 1000, required: false },
      { key: 'city', type: 'string', size: 255, required: false },
      { key: 'last_active_at', type: 'string', size: 255, required: false },
      { key: 'avatar_url', type: 'string', size: 2000, required: false },
      { key: 'is_admin', type: 'boolean', required: false, default: false },
    ],
    indexes: [
      { key: 'handle_idx', type: 'key', attributes: ['handle'] },
    ],
  },
  {
    id: 'contact_clicks',
    name: 'Contact Clicks',
    permissions: [
      Permission.read(Role.users()),
      Permission.create(Role.any()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ],
    attributes: [
      { key: 'editor_id', type: 'string', size: 255, required: true },
      { key: 'clicked_at', type: 'string', size: 255, required: true },
    ],
    indexes: [
      { key: 'editor_id_click_idx', type: 'key', attributes: ['editor_id'] },
    ],
  },
];

for (const config of collectionsConfig) {
  console.log(`\n📦 Processing collection '${config.id}'...`);
  let collection;
  try {
    collection = await databases.getCollection(databaseId, config.id);
    console.log(`  ✓ Collection '${config.id}' exists.`);
  } catch {
    console.log(`  ⏳ Creating collection '${config.id}'...`);
    collection = await databases.createCollection(
      databaseId,
      config.id,
      config.name,
      config.permissions
    );
    console.log(`  ✅ Collection '${config.id}' created.`);
  }

  // Get existing attributes
  const existingAttrs = new Set(collection.attributes.map((a) => a.key));

  for (const attr of config.attributes) {
    if (existingAttrs.has(attr.key)) {
      console.log(`  ✓ Attribute '${attr.key}' already exists.`);
      continue;
    }
    console.log(`  ⏳ Adding attribute '${attr.key}' (${attr.type})...`);
    try {
      if (attr.type === 'string') {
        await databases.createStringAttribute(
          databaseId,
          config.id,
          attr.key,
          attr.size || 255,
          attr.required,
          attr.default ?? undefined
        );
      } else if (attr.type === 'integer') {
        await databases.createIntegerAttribute(
          databaseId,
          config.id,
          attr.key,
          attr.required,
          undefined,
          undefined,
          attr.default ?? undefined
        );
      } else if (attr.type === 'boolean') {
        await databases.createBooleanAttribute(
          databaseId,
          config.id,
          attr.key,
          attr.required,
          attr.default ?? undefined
        );
      }
      console.log(`  ✅ Attribute '${attr.key}' created.`);
    } catch (err) {
      console.error(`  ❌ Failed to create attribute '${attr.key}':`, err.message);
    }
  }

  // Wait briefly for attributes to register before creating indexes
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Get existing indexes
  const existingIndexes = new Set((collection.indexes || []).map((i) => i.key));

  for (const idx of config.indexes) {
    if (existingIndexes.has(idx.key)) {
      console.log(`  ✓ Index '${idx.key}' already exists.`);
      continue;
    }
    console.log(`  ⏳ Creating index '${idx.key}' on [${idx.attributes.join(', ')}]...`);
    try {
      await databases.createIndex(
        databaseId,
        config.id,
        idx.key,
        idx.type,
        idx.attributes
      );
      console.log(`  ✅ Index '${idx.key}' created.`);
    } catch (err) {
      console.error(`  ❌ Failed to create index '${idx.key}':`, err.message);
    }
  }
}

console.log('\n🎉 Appwrite setup script completed successfully!');
