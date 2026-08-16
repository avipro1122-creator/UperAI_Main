import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, collection, addDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCJJcShQUmx1voRFC9GkPEn04NV0Yck04w',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'uperai-ed941.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'uperai-ed941',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'uperai-ed941.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '120227432324',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:120227432324:web:a2d82aef2f616e280a3fd1',
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const initialEditors = [
  {
    id: 'avanishrai',
    user_id: 'avanishrai',
    full_name: 'Avanish Rai',
    display_name: 'Avanish Rai',
    name: 'Avanish Rai',
    handle: 'avanishrai',
    headline: 'I Edit Gaming & High-Retention Videos',
    specialty_tag: 'I Edit Gaming & High-Retention Videos',
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
    youtube_url: 'https://www.youtube.com/watch?v=xcLZwgQ8Uog',
    avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Avanish%20Rai',
    preview_img: 'https://img.youtube.com/vi/xcLZwgQ8Uog/hqdefault.jpg',
    bio: 'I create high-converting video edits that scale gaming and tech channels.',
    software: ['Premiere Pro', 'After Effects', 'Photoshop'],
    open_to_work: true,
    is_hidden: false,
    portfolio: [
      {
        title: 'High-Retention Gaming Edit',
        video_url: 'https://www.youtube.com/watch?v=xcLZwgQ8Uog',
        youtube_url: 'https://www.youtube.com/watch?v=xcLZwgQ8Uog',
        video_id: 'xcLZwgQ8Uog',
        role_description: 'Edited and color-graded under 48 hours',
        position: 0,
        thumbnail_url: 'https://img.youtube.com/vi/xcLZwgQ8Uog/hqdefault.jpg',
        is_short: false,
        is_available: true,
      },
    ],
  },
  {
    id: 'karan-editor',
    user_id: 'karan-editor',
    full_name: 'Karan Sharma',
    display_name: 'Karan Sharma',
    name: 'Karan Sharma',
    handle: 'karansharma',
    headline: 'Shorts & Reels Retention Specialist',
    specialty_tag: 'Shorts & Reels Retention Specialist',
    base_rate: 2000,
    rate_short: 2000,
    rate_long: 9000,
    min_rate: 2000,
    max_rate: 9000,
    currency: 'INR',
    turnaround_time: '1 Day',
    turnaround_days: 1,
    whatsapp: '919016047119',
    whatsapp_number: '919016047119',
    instagram: 'karancreates',
    instagram_handle: 'karancreates',
    youtube_url: 'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Karan%20Sharma',
    preview_img: '',
    bio: 'Specializing in fast-paced TikToks, Instagram Reels, and YouTube Shorts with custom sound design.',
    software: ['Premiere Pro', 'CapCut Pro', 'After Effects'],
    open_to_work: true,
    is_hidden: false,
    portfolio: [],
  },
  {
    id: 'swastik-vfx',
    user_id: 'swastik-vfx',
    full_name: 'Swastik Verma',
    display_name: 'Swastik Verma',
    name: 'Swastik Verma',
    handle: 'swastikverma',
    headline: '3D Motion Graphics & VFX Editor',
    specialty_tag: '3D Motion Graphics & VFX Editor',
    base_rate: 3500,
    rate_short: 3500,
    rate_long: 15000,
    min_rate: 3500,
    max_rate: 15000,
    currency: 'INR',
    turnaround_time: '3 Days',
    turnaround_days: 3,
    whatsapp: '919876543211',
    whatsapp_number: '919876543211',
    instagram: 'swastikvfx',
    instagram_handle: 'swastikvfx',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Swastik%20Verma',
    preview_img: '',
    bio: 'Motion graphics artist creating cinematic 3D trailers and YouTube intros.',
    software: ['After Effects', 'Blender', 'Cinema 4D', 'DaVinci Resolve'],
    open_to_work: true,
    is_hidden: false,
    portfolio: [],
  },
]

async function seed() {
  console.log('🌱 Seeding Firestore database via Web SDK...')
  for (const editor of initialEditors) {
    const { portfolio, ...profileData } = editor
    await setDoc(doc(db, 'editor_profiles', editor.id), profileData, { merge: true })
    console.log(`✅ Saved editor profile: ${editor.full_name} (${editor.handle})`)

    if (portfolio && portfolio.length > 0) {
      for (const item of portfolio) {
        await addDoc(collection(db, 'portfolio_items'), {
          ...item,
          editor_id: editor.user_id,
          createdAt: new Date().toISOString(),
        })
        console.log(`   + Added portfolio item: ${item.title}`)
      }
    }
  }
  console.log('🎉 Firestore Seeding Successfully Complete!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed error:', err)
  process.exit(1)
})
