import type { Platform } from '../types'

export type Device = 'android' | 'iphone' | 'computer'

export const DEVICES: { id: Device; label: string }[] = [
  { id: 'iphone', label: 'iPhone' },
  { id: 'android', label: 'Android' },
  { id: 'computer', label: 'Computer' },
]

export interface GuideStep {
  /** Text. Put the app's own button names in **double stars**; they show in bold. */
  text: string
  /** Optional screenshot in public/guide/, for example "tiktok-iphone-3.webp". */
  image?: string
  /** A step that people often get wrong. It shows with a warning color. */
  important?: boolean
}

export interface StepSet {
  steps: GuideStep[]
  /** What happens after the request: where the file arrives and how to get it. */
  next: string[]
  /** Date the steps were checked against the real app (YYYY-MM-DD). Empty: not yet checked. */
  checked?: string
  /** Where the steps come from, when not from a real device. */
  source?: string
}

export interface PlatformGuide {
  wait: string
  /** Steps for each device. YouTube uses "all": the same website on every device. */
  sets: Partial<Record<Device | 'all', StepSet>>
  tip: string
}

// Android steps: checked against the owner's screen recordings on 2026-11-19.
const TIKTOK_PHONE: GuideStep[] = [
  { text: 'Open the TikTok app and tap **Profile** at the bottom right.' },
  { text: 'Tap the **☰** menu at the top right, then tap **Settings and privacy**.', image: 'tiktok-android-2.webp' },
  { text: 'Below **Account**, tap **Account**.', image: 'tiktok-android-3.webp' },
  { text: 'Tap **Download your data**.', image: 'tiktok-android-4.webp' },
  {
    text: 'Tap **File format** and select **JSON** (it starts on TXT). Then tap **Select all**: at first, nothing is selected (“0/10 selected”).',
    image: 'tiktok-android-5.webp',
    important: true,
  },
  { text: 'Make sure it says **10/10 selected**, then tap **Request data**.', image: 'tiktok-android-6.webp' },
  { text: 'TikTok shows “Your data request is being processed”. Your request is now in the **Download data** tab.', image: 'tiktok-android-7.webp' },
]

const TIKTOK_NEXT = [
  'TikTok sends you a notification when the file is ready.',
  'Go to **Download your data** again and open the **Download data** tab. Tap **Download**.',
  'The file is available for **4 days**. If you make a new request, the old file expires.',
]

const INSTAGRAM_PHONE: GuideStep[] = [
  { text: 'Open Instagram and tap your **profile picture** at the bottom right.' },
  { text: 'Tap the **☰** menu at the top right. “Settings and activity” opens.' },
  { text: 'Below **Your account**, tap **Meta Account** (older versions name it **Accounts Center**).', image: 'instagram-android-2.webp' },
  { text: 'Tap **Your information and permissions**, then **Export your information**.', image: 'instagram-android-3.webp' },
  { text: 'Tap **Create export**.', image: 'instagram-android-4.webp' },
  { text: 'Select your **Instagram** profile (not the Facebook one).' },
  { text: 'Tap **Export to device**.', image: 'instagram-android-5.webp' },
  { text: 'On “Confirm your export”, tap **Format**. It starts on **HTML**, and Glimpse needs JSON.', image: 'instagram-android-6.webp', important: true },
  { text: 'Select **JSON**, then tap **Save**. Check that “Format” now says **JSON**.', image: 'instagram-android-7.webp', important: true },
  { text: 'Optional: tap **Media quality** and select **Lower quality** to make the file smaller. Keep **All available information**.' },
  { text: 'Tap **Start export**. Enter your password and tap **Continue**.' },
]

// iPhone: the same screens, checked against public iPhone screen recordings on 2026-11-20.
// Differences: the menu item is named "Accounts Center" on some versions, and the
// profile choice shows only when you have more than one profile.
const INSTAGRAM_IPHONE: GuideStep[] = INSTAGRAM_PHONE.map((step) => {
  if (step.text.startsWith('Below **Your account**'))
    return { text: 'Below **Your account**, tap **Accounts Center** (newer versions name it **Meta Account**).' }
  if (step.text.startsWith('Select your **Instagram** profile'))
    return { text: 'If Instagram asks you to choose a profile, select your **Instagram** profile (not the Facebook one).' }
  if (step.text.startsWith('Optional: tap **Media quality**'))
    return { text: 'Optional: tap **Date range** and keep **Last year** (**All time** takes longer). Tap **Media quality** and select **Lower quality** for a smaller file.' }
  return step
})

const INSTAGRAM_NEXT = [
  'Instagram shows “Your information is being prepared for export”. It notifies you, and sends an email, when the file is ready.',
  'Go to **Export your information** again. Below **Available downloads**, tap **Download**.',
  'You have **4 days** to download the file. Check that the line says **JSON**, not HTML.',
]

export const GUIDES: Record<Platform, PlatformGuide> = {
  tiktok: {
    wait: 'Usually a few hours, sometimes a few days',
    tip: 'TikTok keeps your full list of watched videos. This gives the most real feed.',
    sets: {
      android: { checked: '2026-11-19', steps: TIKTOK_PHONE, next: TIKTOK_NEXT },
      // iPhone screens are the same as Android (checked against public iPhone screen recordings).
      iphone: { checked: '2026-11-20', steps: TIKTOK_PHONE, next: TIKTOK_NEXT, source: 'The screenshots come from Android; the iPhone screens are the same.' },
      // Checked against a Windows (Chrome) screen recording on 2026-11-19.
      computer: {
        checked: '2026-11-19',
        steps: [
          { text: 'Go to **tiktok.com** in your browser and log in.' },
          { text: 'Click your **profile picture** at the top right, then **View profile**.' },
          { text: 'On your profile, click the **settings** icon (the circle next to **Promote post**).' },
          { text: 'Scroll down to **Privacy**. Below **Data**, click **Download your data**.' },
          { text: 'On the **Request data** tab, below **Select file format**, select **JSON** (it starts on TXT).', important: true },
          { text: 'Below **Select data to download**, click **Select all**. At first, nothing is selected (“0/10 selected”).', important: true },
          { text: 'Click **Request data**. TikTok shows “Your data request is being processed”.' },
        ],
        next: TIKTOK_NEXT,
      },
    },
  },
  instagram: {
    wait: 'Usually under a day, sometimes a few days',
    tip: 'Keep “All available information”. Instagram puts its list of topics for you in it, and we use that list for your interest map.',
    sets: {
      android: { checked: '2026-11-19', steps: INSTAGRAM_PHONE, next: INSTAGRAM_NEXT },
      iphone: { checked: '2026-11-20', steps: INSTAGRAM_IPHONE, next: INSTAGRAM_NEXT, source: 'The screenshots come from Android; the iPhone screens are almost the same.' },
      // Checked against a Windows (Chrome) screen recording on 2026-11-19.
      computer: {
        checked: '2026-11-19',
        steps: [
          { text: 'Go to **instagram.com** in your browser and log in.' },
          { text: 'Click **More** (☰) at the bottom left, then **Settings**.' },
          { text: 'Below **Your account**, click **Meta Account**.' },
          { text: 'In the menu on the left, click **Your information and permissions**, then **Export your information**.' },
          { text: 'Click **Create export**, then select your **Instagram** profile (not the Facebook one).' },
          { text: 'Click **Export to device**.' },
          { text: 'On “Confirm your export”, click **Format**, select **JSON**, and click **Save**. It starts on HTML.', important: true },
          { text: 'Optional: click **Media quality**, select **Lower quality**, and click **Save**. Keep **All available information**.' },
          { text: 'Click **Start export**. Enter your password and click **Continue**.' },
        ],
        next: INSTAGRAM_NEXT,
      },
    },
  },
  youtube: {
    wait: 'Minutes to a few days. Most people get it the same day.',
    tip: 'Google Takeout is a website, so the steps are the same on a phone and a computer. A computer is easier.',
    sets: {
      // Checked against a Windows (Chrome) screen recording and Google's help page on 2026-11-19.
      all: {
        checked: '2026-11-19',
        steps: [
          { text: 'Go to **takeout.google.com** in your browser and sign in.' },
          { text: 'Below **Create a new export**, find **Select data to include**. Click **Deselect all**.', important: true },
          { text: 'Scroll down to **YouTube and YouTube Music** and select its box. The top now says “1 of … selected”.' },
          { text: 'Optional: click **Multiple formats** and set **history** to **JSON**. HTML also works in Glimpse.' },
          { text: 'Optional: click **All YouTube data included** and clear **videos**. This makes the file much smaller.' },
          { text: 'Click **Next step**.' },
          { text: 'Keep **Send download link via email**, **Export once**, **.zip**, and **2 GB**.' },
          { text: 'Click **Create export**. Google shows “Google is creating a copy of data from YouTube and YouTube Music”.' },
        ],
        next: [
          'Google emails you when the export is ready. Most people get it the same day.',
          'In the email, click **Download archive**. You have **one week** to download the file.',
        ],
      },
    },
  },
}

/** The device from the browser. People can change it on the guide screen. */
export function detectDevice(userAgent: string): Device {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iphone'
  if (/Android/i.test(userAgent)) return 'android'
  return 'computer'
}

export function stepSet(guide: PlatformGuide, device: Device): StepSet {
  return guide.sets[device] ?? guide.sets.all!
}

/** Split "Tap **Profile**" into plain and bold parts. */
export function boldParts(text: string): { text: string; bold: boolean }[] {
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((p) => (p.startsWith('**') ? { text: p.slice(2, -2), bold: true } : { text: p, bold: false }))
}
