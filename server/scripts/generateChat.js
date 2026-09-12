import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Deterministic Pseudo-Random Generator (Mulberry32)
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

// Conversational filler and everyday Hinglish fragments
const FILLERS = [
  'haan', 'lol', 'sahi hai', 'done scene', 'theek hai', 'accha', 'nahi yaar',
  'omg 😂', 'hnn', 'bilkul', 'kaafi sorted', 'pakka?', 'chalega', 'dekhlo',
  '<Media omitted>', 'Forwarded: Daily tech news briefing digest',
  '<Media omitted>', '😂🤣 dead', 'bro wtf', 'koi na', 'arrey yaar',
  'same here', 'mast', 'chalo badhiya', 'waah', 'kya scene hai?',
  'free ho call pe?', 'aaj kaafi meetings thi', 'chai peene chalte hain',
  'batao jaldi', 'kal milte hain', 'swiggy se order karlo', 'biryani mangwa li',
  'ping me on slack', 'weekend ka kya plan hai?'
];

const GENERAL_TOPICS = [
  {
    sender: 'Rohan',
    texts: [
      'new macbook update dekha kisi ne? battery life is insane',
      'docker memory leak ho raha hai firse, system hang',
      'openai ka naya model benchmark test kiya kya?',
      'mechanical keyboards are so addictive, tactile switches FTW'
    ]
  },
  {
    sender: 'Priya',
    texts: [
      'guys splitwise check karo last month ka settling pending hai',
      'monthly budget track karna impossible ho raha hai Bangalore me',
      'swiggy instamart pe discounts chal rahe hain groceries par',
      'tax saving investment ka last date aa gaya sab dekhlo'
    ]
  },
  {
    sender: 'Sneha',
    texts: [
      'Koramangala me naya cafe khula hai artisanal sourdough pizza',
      'aaj biryani banayi ghar pe super spicy 🔥',
      'coffee walk anyone? 15 mins me nikal rahe hain',
      'dessert craving ho rahi hai brownie mangwa lete hain'
    ]
  },
  {
    sender: 'Aarav',
    texts: [
      'gym workout done for the day feeling energized',
      'weekend drive pe chalna hai Nandi hills?',
      'traffic today was insane silk board pe 45 mins stuck',
      'cricket match score dekha? Rinku Singh finishes in style!'
    ]
  },
  {
    sender: 'Ananya',
    texts: [
      'movie night plan karein Friday ko? Dune 2 IMAX tickets available',
      'concert tickets sold out in 3 minutes yaar crying',
      'playlist update kardi Spotify pe checkout guys',
      'look at this cute stray puppy outside office 🐶'
    ]
  },
  {
    sender: 'Vikram',
    texts: [
      'just saw this messages, back to back sprint reviews the',
      'production release tonight, fingers crossed',
      'quarterly goals discussion complete, kaafi workload aane wala hai',
      'laptop screen flickering kar rahi hai IT support ko bulaya'
    ]
  },
  {
    sender: 'Neha',
    texts: [
      'Amazon sale start ho gayi wishlist review karlo',
      'anyone coming to office tomorrow or all WFH?',
      'booked badminton court for Saturday morning 7 AM',
      'shared Google photos album link on email check it'
    ]
  },
  {
    sender: 'Kabir',
    texts: [
      'late utha aaj sleep schedule messed up',
      'gaming tonight? Valorant custom room ready',
      'headphones battery dead ho gayi travel karte time',
      'bhai cold coffee order kardi'
    ]
  }
];

// Ground truth anchor message specifications (including the Hard 8 zero-word-overlap pairs)
const ANCHOR_EVENTS = [
  // --- ARC 1: Flat Hunting & Agreement (Mid-February, approx index 850-920) ---
  {
    arc: 'Flat Hunting',
    id: 865,
    sender: 'Priya',
    text: 'broker bol raha hai rent 42k hai Indiranagar 3BHK ka but deposit 2 lakh maang raha hai',
    note: 'Priya initial quote on flat'
  },
  {
    arc: 'Flat Hunting',
    id: 882,
    sender: 'Aarav',
    text: 'Maine owner se bargain kiya, deposit 1.5L pe maan gaya hai',
    note: 'Aarav negotiating deposit'
  },
  {
    // HARD 8 #2: Query: "Who finalized the apartment security deposit payment?"
    // Zero-overlap words with target: "Aarav: token amount 25k transfer kar diya owner ko"
    arc: 'Flat Hunting',
    id: 890,
    sender: 'Aarav',
    text: 'token amount 25k transfer kar diya owner ko',
    note: 'HARD 8 #2 - Flat security deposit confirmation'
  },
  {
    // HARD 8 #6: Query: "What was decided about the rental lease duration?"
    // Zero-overlap words with target: "owner bola 11 months ka standard stamp paper banega"
    arc: 'Flat Hunting',
    id: 905,
    sender: 'Rohan',
    text: 'owner bola 11 months ka standard stamp paper banega',
    note: 'HARD 8 #6 - Rental lease duration'
  },

  // --- ARC 2: Manali Vacation Planning (Mid-April, approx index 2150-2260) ---
  {
    arc: 'Manali Trip',
    id: 2165,
    sender: 'Sneha',
    text: 'Pahadon me chalte hain Himachal ya Uttarakhand, weather mast rahega',
    note: 'Sneha proposing mountains'
  },
  {
    arc: 'Manali Trip',
    id: 2180,
    sender: 'Priya',
    text: 'Goa expensive padega flights 10k ki hain, Manali bus budget friendly hai',
    note: 'Priya comparing costs'
  },
  {
    // HARD 8 #1: Query: "When was the mountain vacation locked in?"
    // Zero-overlap words with target: "bhai tickets ho gayi pack karlo sab"
    arc: 'Manali Trip',
    id: 2195,
    sender: 'Aarav',
    text: 'bhai tickets ho gayi pack karlo sab',
    note: 'HARD 8 #1 - Mountain trip final consensus'
  },
  {
    arc: 'Manali Trip',
    id: 2210,
    sender: 'Neha',
    text: 'Chalo Manali fix hai 14 se 18 April bus tickets booked',
    note: 'Direct confirmation with dates'
  },
  {
    // HARD 8 #7: Query: "How will the group commute from Delhi to Himachal?"
    // Zero-overlap words with target: "Kashmere Gate se sleeper volvo pakadni hai raat 9 baje"
    arc: 'Manali Trip',
    id: 2225,
    sender: 'Vikram',
    text: 'Kashmere Gate se sleeper volvo pakadni hai raat 9 baje',
    note: 'HARD 8 #7 - Commute bus details'
  },
  {
    // HARD 8 #5: Query: "Where should everyone submit their trip expenses?"
    // Zero-overlap words with target: "group bana diya settle up wale app par sab enter kardo"
    arc: 'Manali Trip',
    id: 2240,
    sender: 'Priya',
    text: 'group bana diya settle up wale app par sab enter kardo',
    note: 'HARD 8 #5 - Expense tracking app'
  },

  // --- ARC 3: Kabir's Birthday Surprise Gift (Late-May, approx index 3250-3360) ---
  {
    arc: 'Birthday Gift',
    id: 3260,
    sender: 'Ananya',
    text: 'Kabir ka 25th birthday aa raha hai next week secret gift plan karna hai',
    note: 'Ananya initiating birthday secret'
  },
  {
    arc: 'Birthday Gift',
    id: 3275,
    sender: 'Rohan',
    text: 'wo kab se noise cancelling headphones lene ka soch raha tha gym aur travel ke liye',
    note: 'Rohan gift suggestion'
  },
  {
    // HARD 8 #8: Query: "Which audio headset did the group purchase?"
    // Zero-overlap words with target: "WH-1000XM5 black color wala card se swipe kiya tha"
    arc: 'Birthday Gift',
    id: 3290,
    sender: 'Aarav',
    text: 'WH-1000XM5 black color wala card se swipe kiya tha',
    note: 'HARD 8 #8 - Specific headset model purchased'
  },
  {
    // HARD 8 #3: Query: "What did we conclude regarding Kabir's birthday gift?"
    // Zero-overlap words with target: "sony headphones mangwa liye, splitwise pe hisab daal diya"
    arc: 'Birthday Gift',
    id: 3305,
    sender: 'Sneha',
    text: 'sony headphones mangwa liye, splitwise pe hisab daal diya',
    note: 'HARD 8 #3 - Birthday gift conclusion'
  },

  // --- OTHER SPECIFIC TARGETS (for queries and HARD 8 #4) ---
  {
    // HARD 8 #4: Query: "Did we reserve the dinner table for Friday evening?"
    // Zero-overlap words with target: "Bawarchi me 8 baje ka slot book kar diya maine"
    arc: 'Weekend Outing',
    id: 1512,
    sender: 'Sneha',
    text: 'Bawarchi me 8 baje ka slot book kar diya maine',
    note: 'HARD 8 #4 - Restaurant reservation'
  },
  {
    arc: 'Movie Night',
    id: 540,
    sender: 'Ananya',
    text: 'Dune 2 PVR Forum Koramangala 7:30 PM show booked 6 tickets',
    note: 'Movie booking details'
  },
  {
    arc: 'Office Discussion',
    id: 1120,
    sender: 'Vikram',
    text: 'Q1 appraisal cycle discussion HR ne release kar diya hai portal par',
    note: 'Vikram appraisal update'
  },
  {
    arc: 'Cricket Match',
    id: 1845,
    sender: 'Rohan',
    text: 'RCB match tickets mil gayi Chinnaswamy stadium stand D',
    note: 'IPL ticket announcement'
  },
  {
    arc: 'Priya Budget Advice',
    id: 2780,
    sender: 'Priya',
    text: 'Mutual funds SIP amount badha diya 15k per month for disciplined savings',
    note: 'Priya financial advice'
  }
];

// Helper to convert index (0 to 4199) to timestamp spanning Jan 1 2024 to June 30 2024
const START_DATE = new Date('2024-01-01T09:00:00.000Z').getTime();
const END_DATE = new Date('2024-06-30T23:30:00.000Z').getTime();
const TOTAL_DURATION = END_DATE - START_DATE;
const TOTAL_MESSAGES = 4200;

function generateTimestamp(index) {
  // Approximate linear progression with jitter for natural conversation bursts
  const baseTime = START_DATE + (index / TOTAL_MESSAGES) * TOTAL_DURATION;
  const jitterMinutes = randInt(-15, 15);
  return new Date(baseTime + jitterMinutes * 60 * 1000).toISOString();
}

function generateChat() {
  console.log(`[generateChat] Generating ${TOTAL_MESSAGES} messages across 6 months...`);
  
  const anchorMap = new Map();
  for (const anchor of ANCHOR_EVENTS) {
    anchorMap.set(anchor.id, anchor);
  }

  const messages = [];

  let currentTopicSender = choice(PARTICIPANTS);
  let threadLengthRemaining = randInt(2, 6);

  for (let i = 1; i <= TOTAL_MESSAGES; i++) {
    const timestamp = generateTimestamp(i);

    // If this message is a designated ground truth anchor
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

    // Contextual threads around anchor events
    if (i >= 840 && i <= 930) {
      // Flat hunting thread context
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
      messages.push({
        id: i,
        sender: item.sender,
        timestamp,
        text: item.text
      });
      continue;
    }

    if (i >= 2140 && i <= 2270) {
      // Manali trip planning thread context
      const tripVoices = [
        { sender: 'Sneha', text: 'bhai pahadon ki photo dekh ke dil khush ho gaya' },
        { sender: 'Aarav', text: 'sleeper bus tickets check kar raha hu Redbus par' },
        { sender: 'Priya', text: 'hotel me breakfast included hona chahiye' },
        { sender: 'Ananya', text: 'cafe hopping karenge Old Manali me pack your jackets!' },
        { sender: 'Kabir', text: 'Solang valley me paragliding fix hai' },
        { sender: 'Vikram', text: 'office se 2 din ki leave approve ho gayi' },
        { sender: 'Neha', text: 'power banks charge karke rakhna subah tak' },
        { sender: 'Rohan', text: 'camera me 128GB card daal diya photos sorted' }
      ];
      const item = choice(tripVoices);
      messages.push({
        id: i,
        sender: item.sender,
        timestamp,
        text: item.text
      });
      continue;
    }

    if (i >= 3240 && i <= 3370) {
      // Kabir's surprise gift thread context (Kabir should rarely speak here!)
      const secretParticipants = PARTICIPANTS.filter(p => p !== 'Kabir');
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
      messages.push({
        id: i,
        sender: item.sender,
        timestamp,
        text: item.text
      });
      continue;
    }

    // Everyday chat distribution:
    // 60% realistic fillers / one-word replies / media omitted
    const randType = rng();
    if (randType < 0.35) {
      // Short filler or reaction
      messages.push({
        id: i,
        sender: choice(PARTICIPANTS),
        timestamp,
        text: choice(FILLERS)
      });
    } else if (randType < 0.60) {
      // Quick follow-up in thread
      if (threadLengthRemaining <= 0) {
        currentTopicSender = choice(PARTICIPANTS);
        threadLengthRemaining = randInt(2, 5);
      }
      threadLengthRemaining--;
      messages.push({
        id: i,
        sender: currentTopicSender,
        timestamp,
        text: choice(FILLERS)
      });
    } else {
      // Topic message by speaker
      const topicObj = choice(GENERAL_TOPICS);
      messages.push({
        id: i,
        sender: topicObj.sender,
        timestamp,
        text: choice(topicObj.texts)
      });
    }
  }

  // Write chat_corpus.json
  const outputPath = path.join(__dirname, '../data/chat_corpus.json');
  fs.writeFileSync(outputPath, JSON.stringify(messages, null, 2), 'utf-8');

  // Summary statistics
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
    decision_arcs: [
      { arc: 'Flat Hunting & Deposit', key_id: 890, timeframe: 'February 2024' },
      { arc: 'Manali Vacation Planning', key_id: 2195, timeframe: 'April 2024' },
      { arc: 'Kabir Birthday Surprise', key_id: 3305, timeframe: 'May 2024' }
    ]
  };

  const metaPath = path.join(__dirname, '../data/metadata.json');
  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), 'utf-8');

  console.log(`[generateChat] Successfully generated ${messages.length} messages.`);
  console.log(`[generateChat] Output saved to: ${outputPath}`);
  console.log(`[generateChat] Metadata saved to: ${metaPath}`);
}

generateChat();
