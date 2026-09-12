import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createRng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEED = 20260412;
const rng = createRng(SEED);

function choice(arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

const PARTICIPANTS = [
  'Aarav',
  'Priya',
  'Kabir',
  'Rohan',
  'Sneha',
  'Ananya',
  'Vikram',
  'Neha'
];

const FILLERS = [
  'haan', 'lol', 'sahi hai', 'done scene', 'theek hai', 'accha', 'nahi yaar',
  'omg 😂', 'hnn', 'bilkul', 'kaafi sorted', 'pakka?', 'chalega', 'dekhlo',
  '<Media omitted>', 'Forwarded: Daily tech news briefing digest',
  '<Media omitted>', '😂🤣 dead', 'bro wtf', 'koi na', 'arrey yaar',
  'same here', 'mast', 'chalo badhiya', 'waah', 'kya scene hai?',
  'free ho call pe?', 'aaj kaafi meetings thi', 'chai peene chalte hain',
  'batao jaldi', 'kal milte hain', 'swiggy se order karlo',
  'ping me on slack', 'weekend ka kya plan hai?'
];

// All 40 Anchor Events explicitly mapped to distinct IDs
const ALL_40_ANCHORS = [
  // Hard 8 Zero-Word-Overlap Targets
  { id: 2195, sender: 'Aarav', text: 'bhai tickets ho gayi pack karlo sab', arc: 'Manali Trip', note: 'HARD 8 #1' },
  { id: 890, sender: 'Aarav', text: 'token amount 25k transfer kar diya owner ko', arc: 'Flat Hunting', note: 'HARD 8 #2' },
  { id: 3305, sender: 'Sneha', text: 'sony headphones mangwa liye, splitwise pe hisab daal diya', arc: 'Birthday Gift', note: 'HARD 8 #3' },
  { id: 1512, sender: 'Sneha', text: 'Bawarchi me 8 baje ka slot book kar diya maine', arc: 'Outing', note: 'HARD 8 #4' },
  { id: 2240, sender: 'Priya', text: 'group bana diya settle up wale app par sab enter kardo', arc: 'Manali Trip', note: 'HARD 8 #5' },
  { id: 905, sender: 'Rohan', text: 'owner bola 11 months ka standard stamp paper banega', arc: 'Flat Hunting', note: 'HARD 8 #6' },
  { id: 2225, sender: 'Vikram', text: 'Kashmere Gate se sleeper volvo pakadni hai raat 9 baje', arc: 'Manali Trip', note: 'HARD 8 #7' },
  { id: 3290, sender: 'Aarav', text: 'WH-1000XM5 black color wala card se swipe kiya tha', arc: 'Birthday Gift', note: 'HARD 8 #8' },

  // Warmup Decision Targets
  { id: 2210, sender: 'Neha', text: 'Chalo Manali fix hai 14 se 18 April bus tickets booked', arc: 'Manali Trip', note: 'Query 9' },
  { id: 2165, sender: 'Sneha', text: 'Pahadon me chalte hain Himachal ya Uttarakhand, weather mast rahega', arc: 'Manali Trip', note: 'Query 10' },
  { id: 2180, sender: 'Priya', text: 'Goa expensive padega flights 10k ki hain, Manali bus budget friendly hai', arc: 'Manali Trip', note: 'Query 11' },
  { id: 865, sender: 'Priya', text: 'broker bol raha hai rent 42k hai Indiranagar 3BHK ka but deposit 2 lakh maang raha hai', arc: 'Flat Hunting', note: 'Query 12' },
  { id: 882, sender: 'Aarav', text: 'Maine owner se bargain kiya, deposit 1.5L pe maan gaya hai', arc: 'Flat Hunting', note: 'Query 13' },
  { id: 3260, sender: 'Ananya', text: 'Kabir ka 25th birthday aa raha hai next week secret gift plan karna hai', arc: 'Birthday Gift', note: 'Query 14' },
  { id: 3275, sender: 'Rohan', text: 'wo kab se noise cancelling headphones lene ka soch raha tha gym aur travel ke liye', arc: 'Birthday Gift', note: 'Query 15' },
  { id: 540, sender: 'Ananya', text: 'Dune 2 PVR Forum Koramangala 7:30 PM show booked 6 tickets', arc: 'Movie Night', note: 'Query 16' },

  // Warmup Speaker Targets
  { id: 2780, sender: 'Priya', text: 'Mutual funds SIP amount badha diya 15k per month for disciplined savings', arc: 'Finance', note: 'Query 17' },
  { id: 11, sender: 'Sneha', text: 'Koramangala me naya cafe khula hai artisanal sourdough pizza', arc: 'Food', note: 'Query 18' },
  { id: 98, sender: 'Sneha', text: 'aaj biryani banayi ghar pe super spicy 🔥', arc: 'Food', note: 'Query 19' },
  { id: 53, sender: 'Sneha', text: 'dessert craving ho rahi hai brownie mangwa lete hain', arc: 'Food', note: 'Query 20' },
  { id: 291, sender: 'Rohan', text: 'new macbook update dekha kisi ne? battery life is insane', arc: 'Tech', note: 'Query 21' },
  { id: 274, sender: 'Rohan', text: 'docker memory leak ho raha hai firse, system hang', arc: 'Tech', note: 'Query 22' },
  { id: 8, sender: 'Rohan', text: 'mechanical keyboards are so addictive, tactile switches FTW', arc: 'Tech', note: 'Query 23' },
  { id: 2154, sender: 'Rohan', text: 'camera me 128GB card daal diya photos sorted', arc: 'Manali Trip', note: 'Query 24' },
  { id: 99, sender: 'Aarav', text: 'gym workout done for the day feeling energized', arc: 'Fitness', note: 'Query 25' },
  { id: 124, sender: 'Aarav', text: 'traffic today was insane silk board pe 45 mins stuck', arc: 'Commute', note: 'Query 26' },
  { id: 28, sender: 'Aarav', text: 'weekend drive pe chalna hai Nandi hills?', arc: 'Outing', note: 'Query 27' },
  { id: 65, sender: 'Aarav', text: 'cricket match score dekha? Rinku Singh finishes in style!', arc: 'Sports', note: 'Query 28' },
  { id: 248, sender: 'Ananya', text: 'concert tickets sold out in 3 minutes yaar crying', arc: 'Music', note: 'Query 29' },
  { id: 3, sender: 'Ananya', text: 'playlist update kardi Spotify pe checkout guys', arc: 'Music', note: 'Query 30' },
  { id: 47, sender: 'Ananya', text: 'look at this cute stray puppy outside office 🐶', arc: 'Life', note: 'Query 31' },
  { id: 29, sender: 'Vikram', text: 'just saw this messages, back to back sprint reviews the', arc: 'Work', note: 'Query 32' },
  { id: 15, sender: 'Vikram', text: 'production release tonight, fingers crossed', arc: 'Work', note: 'Query 33' },
  { id: 18, sender: 'Vikram', text: 'laptop screen flickering kar rahi hai IT support ko bulaya', arc: 'Tech', note: 'Query 34' },
  { id: 14, sender: 'Neha', text: 'booked badminton court for Saturday morning 7 AM', arc: 'Sports', note: 'Query 35' },
  { id: 27, sender: 'Neha', text: 'Amazon sale start ho gayi wishlist review karlo', arc: 'Shopping', note: 'Query 36' },
  { id: 93, sender: 'Neha', text: 'shared Google photos album link on email check it', arc: 'Photos', note: 'Query 37' },
  { id: 84, sender: 'Kabir', text: 'gaming tonight? Valorant custom room ready', arc: 'Gaming', note: 'Query 38' },
  { id: 74, sender: 'Kabir', text: 'bhai cold coffee order kardi', arc: 'Food', note: 'Query 39' },

  // Warmup Temporal Target
  { id: 1120, sender: 'Vikram', text: 'Q1 appraisal cycle discussion HR ne release kar diya hai portal par', arc: 'HR', note: 'Query 40' }
];

const START_DATE = new Date('2024-01-01T09:00:00.000Z').getTime();
const END_DATE = new Date('2024-06-30T23:30:00.000Z').getTime();
const TOTAL_DURATION = END_DATE - START_DATE;
const TOTAL_MESSAGES = 4200;

function generateTimestamp(index) {
  const baseTime = START_DATE + (index / TOTAL_MESSAGES) * TOTAL_DURATION;
  const jitterMinutes = randInt(-15, 15);
  return new Date(baseTime + jitterMinutes * 60 * 1000).toISOString();
}

function generateChat() {
  console.log(`[generateChat] Generating ${TOTAL_MESSAGES} messages across 6 months...`);
  
  const anchorMap = new Map();
  for (const anchor of ALL_40_ANCHORS) {
    anchorMap.set(anchor.id, anchor);
  }

  const messages = [];

  for (let i = 1; i <= TOTAL_MESSAGES; i++) {
    const timestamp = generateTimestamp(i);

    // If designated anchor
    if (anchorMap.has(i)) {
      const anchor = anchorMap.get(i);
      messages.push({
        id: i,
        sender: anchor.sender,
        timestamp,
        text: anchor.text,
        is_anchor: true,
        arc: anchor.arc,
        note: anchor.note
      });
      continue;
    }

    // Thread contexts around key decision arcs
    if (i >= 840 && i <= 930) {
      const flatVoices = [
        { sender: 'Priya', text: 'rent thoda high lag raha hai for 3BHK' },
        { sender: 'Aarav', text: 'location prime hai, 5 min walk from metro station' },
        { sender: 'Rohan', text: 'wifi connectivity aur power backup check kiya kya flat ka?' },
        { sender: 'Kabir', text: 'haan electricity backup mandatory hai' },
        { sender: 'Sneha', text: 'kitchen modular hai, sunlight bhi acchi aati hai' },
        { sender: 'Neha', text: 'deposit ka receipt zaroor lena signed' },
        { sender: 'Vikram', text: 'brokerage 1 month rent maang raha tha na?' },
        { sender: 'Aarav', text: 'brokerage half month negotiate kiya maine' }
      ];
      const item = choice(flatVoices);
      messages.push({ id: i, sender: item.sender, timestamp, text: item.text });
      continue;
    }

    if (i >= 2140 && i <= 2270) {
      const tripVoices = [
        { sender: 'Sneha', text: 'bhai pahadon ki photo dekh ke dil khush ho gaya' },
        { sender: 'Aarav', text: 'sleeper bus tickets check kar raha hu Redbus par' },
        { sender: 'Priya', text: 'hotel me breakfast included hona chahiye' },
        { sender: 'Ananya', text: 'cafe hopping karenge Old Manali me pack your jackets!' },
        { sender: 'Kabir', text: 'Solang valley me paragliding fix hai' },
        { sender: 'Vikram', text: 'office se 2 din ki leave approve ho gayi' },
        { sender: 'Neha', text: 'power banks charge karke rakhna subah tak' }
      ];
      const item = choice(tripVoices);
      messages.push({ id: i, sender: item.sender, timestamp, text: item.text });
      continue;
    }

    if (i >= 3240 && i <= 3370) {
      const giftVoices = [
        { sender: 'Ananya', text: 'shhh Kabir online mat aane dena is topic par' },
        { sender: 'Rohan', text: 'bhai sound quality and ANC of Sony is unmatched' },
        { sender: 'Sneha', text: 'cake kaunse bakery se order karna hai?' },
        { sender: 'Priya', text: 'total 8 logon me split hoga to 2.2k per person padega' },
        { sender: 'Aarav', text: 'delivery address office ka daal diya so he does not suspect' },
        { sender: 'Neha', text: 'card me message kya likhna hai?' },
        { sender: 'Vikram', text: 'Splitwise pe request aa gayi paying now' }
      ];
      const item = choice(giftVoices);
      messages.push({ id: i, sender: item.sender, timestamp, text: item.text });
      continue;
    }

    // Standard everyday chatter
    messages.push({
      id: i,
      sender: choice(PARTICIPANTS),
      timestamp,
      text: choice(FILLERS)
    });
  }

  const outputPath = path.join(__dirname, '../data/chat_corpus.json');
  fs.writeFileSync(outputPath, JSON.stringify(messages, null, 2), 'utf-8');

  const senderCounts = {};
  for (const msg of messages) {
    senderCounts[msg.sender] = (senderCounts[msg.sender] || 0) + 1;
  }

  const metadata = {
    total_messages: messages.length,
    seed: SEED,
    time_range: {
      start: messages[0].timestamp,
      end: messages[messages.length - 1].timestamp
    },
    participants: PARTICIPANTS,
    participant_distribution: senderCounts,
    anchors_count: ALL_40_ANCHORS.length
  };

  const metaPath = path.join(__dirname, '../data/metadata.json');
  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), 'utf-8');

  console.log(`[generateChat] Successfully generated ${messages.length} messages with ${ALL_40_ANCHORS.length} unique anchors.`);
}

generateChat();
