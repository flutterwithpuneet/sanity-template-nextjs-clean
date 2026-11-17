import pg from 'pg'
const { Client } = pg

const client = new Client({
  host: '1m3ur6d1ukkdkt94.gateway01.us-east-1.prod.aws.pg.tidbcloud.com',
  port: 5432,
  user: '1m3ur6d1ukkdkt94.postgres',
  password: 'OI9j3fqXI41kT2ciiCLd9fm1Du2dHKwR',
  database: 'exam',
  ssl: { rejectUnauthorized: false }
})

const testSuites = [
  // Subject 1: CIT
  {
    title: 'Computer Fundamentals & Hardware Drill (Low Level)',
    slug: 'cit-practice-low-01',
    description: 'Basic level questions covering Computer Fundamentals, input/output devices, memory hierarchy and basics of MS Office.',
    subject_id: 1,
    topic_id: 101,
    difficulty_level: 'low',
    duration_minutes: 15,
    questions: [
      {
        text: 'कंप्यूटर का मस्तिष्क (Brain of Computer) किसे कहा जाता है?',
        difficulty: 'easy',
        explanation: 'CPU (Central Processing Unit) को कंप्यूटर का मस्तिष्क कहा जाता है क्योंकि यह सभी निर्देशों को प्रोसेस करता है।',
        options: [
          ['A', 'RAM', false],
          ['B', 'CPU', true],
          ['C', 'Hard Disk', false],
          ['D', 'Motherboard', false]
        ]
      },
      {
        text: 'निम्न में से कौन सा एक इनपुट डिवाइस (Input Device) का उदाहरण है?',
        difficulty: 'easy',
        explanation: 'Keyboard और Mouse इनपुट डिवाइस हैं जिनके द्वारा कंप्यूटर में डेटा प्रविष्ट किया जाता है।',
        options: [
          ['A', 'Monitor', false],
          ['B', 'Printer', false],
          ['C', 'Keyboard', true],
          ['D', 'Speaker', false]
        ]
      },
      {
        text: '1 बाइट (Byte) कितने बिट्स (Bits) के बराबर होता है?',
        difficulty: 'easy',
        explanation: '1 Byte = 8 Bits और 1 Nibble = 4 Bits होता है।',
        options: [
          ['A', '4 Bits', false],
          ['B', '8 Bits', true],
          ['C', '16 Bits', false],
          ['D', '32 Bits', false]
        ]
      },
      {
        text: 'MS Word में किसी दस्तावेज को सुरक्षित (Save) करने के लिए किस शॉर्टकट कुंजी का उपयोग किया जाता है?',
        difficulty: 'easy',
        explanation: 'Ctrl + S का प्रयोग फ़ाइल सुरक्षित (Save) करने के लिए किया जाता है।',
        options: [
          ['A', 'Ctrl + S', true],
          ['B', 'Ctrl + P', false],
          ['C', 'Ctrl + Z', false],
          ['D', 'Ctrl + V', false]
        ]
      },
      {
        text: 'ROM (Read Only Memory) किस प्रकार की मेमोरी है?',
        difficulty: 'easy',
        explanation: 'ROM एक Non-Volatile (अस्थिर नहीं) मेमोरी है जिसकी सामग्री बिजली जाने पर भी नष्ट नहीं होती।',
        options: [
          ['A', 'Volatile Memory', false],
          ['B', 'Non-Volatile Memory', true],
          ['C', 'Virtual Memory', false],
          ['D', 'Cache Memory', false]
        ]
      }
    ]
  },
  {
    title: 'Networking & Database Management (Medium Level)',
    slug: 'cit-practice-medium-01',
    description: 'Intermediate level assessment focusing on OSI layers, SQL queries, relational keys and TCP/IP protocol suite.',
    subject_id: 1,
    topic_id: 104,
    difficulty_level: 'medium',
    duration_minutes: 20,
    questions: [
      {
        text: 'OSI मॉडल की किस लेयर पर राउटर (Router) कार्य करता है?',
        difficulty: 'medium',
        explanation: 'Router नेटवर्क लेयर (Layer 3) पर IP एड्रेस के आधार पर पैकेट रूटिंग का कार्य करता है।',
        options: [
          ['A', 'Physical Layer', false],
          ['B', 'Data Link Layer', false],
          ['C', 'Network Layer', true],
          ['D', 'Transport Layer', false]
        ]
      },
      {
        text: 'रिलेशनल डेटाबेस में Primary Key की अनिवार्य विशेषता क्या होती है?',
        difficulty: 'medium',
        explanation: 'Primary key की वैल्यू Unique होनी चाहिए और यह NULL नहीं हो सकती (Unique + Not Null)।',
        options: [
          ['A', 'यह Null हो सकती है', false],
          ['B', 'यह Duplicate हो सकती है', false],
          ['C', 'यह प्रत्येक रिकॉर्ड को विशिष्ट (Unique) पहचानती है और Null नहीं हो सकती', true],
          ['D', 'यह केवल संख्यात्मक (Numeric) हो सकती है', false]
        ]
      },
      {
        text: 'HTTP और HTTPS प्रोटोकॉल में डिफ़ॉल्ट पोर्ट संख्या (Default Port Number) क्रमशः क्या हैं?',
        difficulty: 'medium',
        explanation: 'HTTP पोर्ट 80 का उपयोग करता है तथा HTTPS पोर्ट 443 का उपयोग करता है।',
        options: [
          ['A', '80 और 443', true],
          ['B', '21 और 25', false],
          ['C', '8080 और 80', false],
          ['D', '25 और 110', false]
        ]
      },
      {
        text: 'SQL में तालिका (Table) से सभी पंक्तियों को बिना लॉग में रिकॉर्ड किए तेजी से हटाने के लिए किस कमांड का प्रयोग होता है?',
        difficulty: 'medium',
        explanation: 'TRUNCATE कमांड DDL कमांड है जो बिना रोलबैक के सभी पंक्तियों को एक साथ हटा देता है।',
        options: [
          ['A', 'DELETE', false],
          ['B', 'TRUNCATE', true],
          ['C', 'DROP', false],
          ['D', 'REMOVE', false]
        ]
      },
      {
        text: 'IPv6 एड्रेस कितने बिट्स (Bits) का होता है?',
        difficulty: 'medium',
        explanation: 'IPv4 एड्रेस 32 बिट का होता है जबकि IPv6 एड्रेस 128 बिट (16 Bytes) का होता है।',
        options: [
          ['A', '32 Bits', false],
          ['B', '64 Bits', false],
          ['C', '128 Bits', true],
          ['D', '256 Bits', false]
        ]
      }
    ]
  },
  {
    title: 'Advanced Computer Architecture & Cyber Security (High Level)',
    slug: 'cit-practice-high-01',
    description: 'High-difficulty mock test covering complex concurrency, asymmetric cryptography, subnetting and B-Tree indexing.',
    subject_id: 1,
    topic_id: 106,
    difficulty_level: 'high',
    duration_minutes: 25,
    questions: [
      {
        text: 'Asymmetric (Public Key) Cryptography में संदेश को एन्क्रिप्ट करने के लिए प्रेषक किसका उपयोग करता है?',
        difficulty: 'hard',
        explanation: 'असिमेट्रिक एन्क्रिप्शन में प्रेषक प्राप्तकर्ता की Public Key से एन्क्रिप्ट करता है, और प्राप्तकर्ता अपनी Private Key से डिक्रिप्ट करता है।',
        options: [
          ['A', 'अपनी Private Key', false],
          ['B', 'प्राप्तकर्ता की Public Key', true],
          ['C', 'प्राप्तकर्ता की Private Key', false],
          ['D', 'साझा गुप्त कुंजी (Shared Secret Key)', false]
        ]
      },
      {
        text: 'क्लासलेस इंटर-डोमेन रूटिंग (CIDR) में सबनेट मास्क 255.255.255.240 के लिए /prefix नोटेशन और प्रयोग योग्य होस्ट (Usable Hosts) कितने होंगे?',
        difficulty: 'hard',
        explanation: '240 = 11110000 (4 bits), इसलिए /28। कुल होस्ट = 2^4 = 16, प्रयोज्य होस्ट = 16 - 2 = 14।',
        options: [
          ['A', '/28 और 14 होस्ट', true],
          ['B', '/27 और 30 होस्ट', false],
          ['C', '/29 और 6 होस्ट', false],
          ['D', '/26 और 62 होस्ट', false]
        ]
      },
      {
        text: 'डेटाबेस ट्रांजेक्शन में "Deadlock" की स्थिति से बचने या उसे तोड़ने के लिए Wait-Die स्कीम किस पर आधारित होती है?',
        difficulty: 'hard',
        explanation: 'Wait-Die स्कीम ट्रांजेक्शन के टाइमस्टैम्प (Timestamp-based non-preemptive) पर आधारित होती है जहाँ पुराना ट्रांजेक्शन प्रतीक्षा कर सकता है किंतु नया मर (Die) जाता है।',
        options: [
          ['A', 'ट्रांजेक्शन का आकार', false],
          ['B', 'ट्रांजेक्शन का टाइमस्टैम्प (Timestamp)', true],
          ['C', 'CPU बस्ट टाइम', false],
          ['D', 'Random Priority', false]
        ]
      },
      {
        text: 'कंप्यूटर पाइपलाइनिंग में "Branch Prediction Failure" किस प्रकार के हैजार्ड (Hazard) का कारण बनता है?',
        difficulty: 'hard',
        explanation: 'Branch instructions कंट्रोल फ्लो को बदलती हैं, इसलिए Branch Prediction फेल होने पर Control Hazard (या Branch Hazard) उत्पन्न होता है।',
        options: [
          ['A', 'Structural Hazard', false],
          ['B', 'Data Hazard (RAW)', false],
          ['C', 'Control Hazard', true],
          ['D', 'Memory Alignment Hazard', false]
        ]
      },
      {
        text: 'B+ Tree इंडेक्सिंग में सभी वास्तविक डेटा रिकॉर्ड पॉइंटर्स (Record Pointers) कहाँ संग्रहीत होते हैं?',
        difficulty: 'hard',
        explanation: 'B+ Tree की विशेषता है कि केवल Leaf Nodes में ही सभी डेटा पॉइंटर्स संग्रहीत होते हैं और लीफ नोड्स आपस में लिंक्ड लिस्ट से जुड़ी होती हैं।',
        options: [
          ['A', 'Root Node में केवल', false],
          ['B', 'Internal Nodes और Leaf Nodes दोनों में', false],
          ['C', 'केवल Leaf Nodes में', true],
          ['D', 'Secondary Overflow Area में', false]
        ]
      }
    ]
  },

  // Subject 2: Reasoning & Mental Ability
  {
    title: 'Reasoning: Direct Relations & Simple Coding (Low Level)',
    slug: 'reasoning-practice-low-01',
    description: 'Straightforward reasoning drill on family relations, simple alphabet shifts, and basic series completion.',
    subject_id: 2,
    topic_id: 201,
    difficulty_level: 'low',
    duration_minutes: 15,
    questions: [
      {
        text: 'यदि A, B का भाई है और B, C का पिता है, तो A का C से क्या संबंध है?',
        difficulty: 'easy',
        explanation: 'पिता का भाई चाचा (Uncle) कहलाता है। अतः A, C का चाचा है।',
        options: [
          ['A', 'पिता', false],
          ['B', 'चाचा', true],
          ['C', 'भाई', false],
          ['D', 'दादा', false]
        ]
      },
      {
        text: 'श्रृंखला को पूरा करें: 2, 4, 8, 16, 32, ?',
        difficulty: 'easy',
        explanation: 'प्रत्येक पद पिछले पद का 2 गुना है (2 × 2 = 4, 4 × 2 = 8... 32 × 2 = 64)।',
        options: [
          ['A', '48', false],
          ['B', '60', false],
          ['C', '64', true],
          ['D', '72', false]
        ]
      },
      {
        text: 'एक निश्चित कूट में CAT को 3120 लिखा जाता है, तो DOG को क्या लिखा जाएगा?',
        difficulty: 'easy',
        explanation: 'C=3, A=1, T=20। इसी प्रकार D=4, O=15, G=7 अर्थात 4157।',
        options: [
          ['A', '4157', true],
          ['B', '4147', false],
          ['C', '5157', false],
          ['D', '4167', false]
        ]
      },
      {
        text: 'रवि उत्तर की ओर 10 मीटर चलता है, फिर दाएं मुड़कर 5 मीटर चलता है। अब उसका मुख किस दिशा में है?',
        difficulty: 'easy',
        explanation: 'उत्तर की ओर चलते हुए दाएं मुड़ने पर व्यक्ति का मुख पूर्व (East) दिशा में होता है।',
        options: [
          ['A', 'पश्चिम', false],
          ['B', 'पूर्व', true],
          ['C', 'उत्तर', false],
          ['D', 'दक्षिण', false]
        ]
      },
      {
        text: 'विषम शब्द चुनिए: गाय, बकरी, शेर, भैंस',
        difficulty: 'easy',
        explanation: 'गाय, बकरी तथा भैंस शाकाहारी/पालतू पशु हैं, जबकि शेर मांसाहारी/जंगली हिंसक पशु है।',
        options: [
          ['A', 'गाय', false],
          ['B', 'बकरी', false],
          ['C', 'शेर', true],
          ['D', 'भैंस', false]
        ]
      }
    ]
  },
  {
    title: 'Reasoning: Coded Relations & Syllogism (Medium Level)',
    slug: 'reasoning-practice-medium-01',
    description: 'Moderate reasoning problems on symbol-coded relationships, venn diagram syllogisms and circular direction tracking.',
    subject_id: 2,
    topic_id: 202,
    difficulty_level: 'medium',
    duration_minutes: 20,
    questions: [
      {
        text: 'यदि P + Q का अर्थ "P, Q का पिता है", P - Q का अर्थ "P, Q की माता है", तो A + B - C में A का C से क्या संबंध है?',
        difficulty: 'medium',
        explanation: 'B, C की माता है और A, B का पिता है। माता का पिता नाना (Maternal Grandfather) होता है।',
        options: [
          ['A', 'दादा', false],
          ['B', 'नाना', true],
          ['C', 'चाचा', false],
          ['D', 'मामा', false]
        ]
      },
      {
        text: 'कथन: 1. सभी कप प्लेट हैं। 2. कुछ प्लेट चम्मच हैं। निष्कर्ष: I. कुछ कप चम्मच हैं। II. कुछ प्लेट कप हैं।',
        difficulty: 'medium',
        explanation: 'चूंकि "सभी कप प्लेट हैं", अतः निश्चित रूप से "कुछ प्लेट कप हैं" (निष्कर्ष II सत्य है)। कप और चम्मच का सीधा निश्चित संबंध नहीं है।',
        options: [
          ['A', 'केवल निष्कर्ष I निकलता है', false],
          ['B', 'केवल निष्कर्ष II निकलता है', true],
          ['C', 'दोनों निष्कर्ष निकलते हैं', false],
          ['D', 'कोई भी निष्कर्ष नहीं निकलता', false]
        ]
      },
      {
        text: '40 बच्चों की एक पंक्ति में, रमेश बाएं से 13वें स्थान पर है। दाएं छोर से उसका स्थान क्या होगा?',
        difficulty: 'medium',
        explanation: 'दाएं से स्थान = कुल छात्र - बाएं से स्थान + 1 = 40 - 13 + 1 = 28वां स्थान।',
        options: [
          ['A', '27वां', false],
          ['B', '28वां', true],
          ['C', '29वां', false],
          ['D', '26वां', false]
        ]
      },
      {
        text: 'घड़ी में जब 4:30 बजते हैं, तो घंटे और मिनट की सुइयों के बीच कितने डिग्री का कोण बनता है?',
        difficulty: 'medium',
        explanation: 'कोण = |30H - (11/2)M| = |30×4 - 5.5×30| = |120 - 165| = 45°।',
        options: [
          ['A', '30°', false],
          ['B', '45°', true],
          ['C', '60°', false],
          ['D', '75°', false]
        ]
      },
      {
        text: 'श्रृंखला में लुप्त संख्या ज्ञात करें: 3, 7, 15, 31, 63, ?',
        difficulty: 'medium',
        explanation: 'प्रतिरूप: ×2 + 1 (3×2+1=7, 7×2+1=15, ... 63×2+1 = 127)।',
        options: [
          ['A', '125', false],
          ['B', '127', true],
          ['C', '129', false],
          ['D', '131', false]
        ]
      }
    ]
  },
  {
    title: 'Reasoning: Advanced Seating & Multi-Constraint Logic (High Level)',
    slug: 'reasoning-practice-high-01',
    description: 'High complexity analytical reasoning including 8-person circular seating arrangement and conditional inequalities.',
    subject_id: 2,
    topic_id: 207,
    difficulty_level: 'high',
    duration_minutes: 25,
    questions: [
      {
        text: '8 व्यक्ति केंद्र की ओर मुख करके एक वृत्त में बैठे हैं। A, B के दाएं तीसरे स्थान पर है जो C के बाएं दूसरे स्थान पर है। D, A या B का पड़ोसी नहीं है। यदि E, F के ठीक दाएं है, तो C के सामने कौन बैठा है?',
        difficulty: 'hard',
        explanation: 'वृत्ताकार बैठक व्यवस्था के आरेखण से स्पष्ट होता है कि D, C के ठीक सम्मुख (Facing each other) स्थित होता है।',
        options: [
          ['A', 'A', false],
          ['B', 'B', false],
          ['C', 'D', true],
          ['D', 'E', false]
        ]
      },
      {
        text: 'कथन: P ≥ Q > R = S ≤ T < U। निष्कर्ष: I. P > S, II. Q < U',
        difficulty: 'hard',
        explanation: 'P ≥ Q > R = S से P > S निश्चित रूप से सत्य है। Q और U के बीच असमानता के चिह्न विपरीत दिशा (Q > R = S ≤ T < U) में हैं, अतः निश्चित संबंध नहीं निकल सकता। अतः केवल I सत्य है।',
        options: [
          ['A', 'केवल निष्कर्ष I सत्य है', true],
          ['B', 'केवल निष्कर्ष II सत्य है', false],
          ['C', 'दोनों I और II सत्य हैं', false],
          ['D', 'न तो I और न ही II सत्य है', false]
        ]
      },
      {
        text: 'कथन: 1. केवल कुछ मोबाइल लैपटॉप हैं। 2. कोई लैपटॉप टैबलेट नहीं है। निष्कर्ष: I. कुछ मोबाइल निश्चित रूप से टैबलेट नहीं हैं। II. सभी मोबाइल के लैपटॉप होने की संभावना है।',
        difficulty: 'hard',
        explanation: 'चूंकि केवल कुछ मोबाइल ही लैपटॉप हैं, अतः सभी मोबाइल कभी लैपटॉप नहीं हो सकते (II असत्य)। जो मोबाइल लैपटॉप हैं वे टैबलेट नहीं हो सकते, अतः निष्कर्ष I निश्चित रूप से सत्य है।',
        options: [
          ['A', 'केवल निष्कर्ष I निकलता है', true],
          ['B', 'केवल निष्कर्ष II निकलता है', false],
          ['C', 'दोनों निष्कर्ष निकलते हैं', false],
          ['D', 'कोई भी निष्कर्ष नहीं निकलता', false]
        ]
      },
      {
        text: 'एक परिवार में 6 सदस्य P, Q, R, S, T, U हैं। इसमें दो विवाहित जोड़े हैं। T, P की बहू है। R, Q की बहन है जो U का पिता है। P, S का पति है। परिवार में कितने पुरुष सदस्य हैं?',
        difficulty: 'hard',
        explanation: 'P (पुरुष) + S (महिला), उनका पुत्र Q (पुरुष) विवाहित T (महिला), R (महिला) Q की बहन, U की स्थिति के आधार पर न्यूनतम 3 पुरुष निश्चित हैं।',
        options: [
          ['A', '2', false],
          ['B', '3', true],
          ['C', '4', false],
          ['D', 'निर्धारित नहीं किया जा सकता', false]
        ]
      },
      {
        text: 'एक घन के विपरीत फलकों को क्रमशः लाल, हरे तथा नीले रंग से रंगा गया है। इसे 64 छोटे घनों में काटा गया। ऐसे कितने घन होंगे जिनके केवल एक फलक पर हरा रंग हो?',
        difficulty: 'hard',
        explanation: '64 छोटे घन = n³ = 64 ⇒ n = 4। केवल एक फलक रंगे घन = 6(n-2)² = 24। चूंकि 6 में से 2 फलक हरे हैं, 2 × (4-2)² = 2 × 4 = 8 घन।',
        options: [
          ['A', '8', true],
          ['B', '12', false],
          ['C', '16', false],
          ['D', '4', false]
        ]
      }
    ]
  },

  // Subject 3: Mathematics
  {
    title: 'Mathematics: Basic Percentages & Ratios (Low Level)',
    slug: 'math-practice-low-01',
    description: 'Foundational quantitative drill covering simple percentage values, ratio divisions and average calculations.',
    subject_id: 3,
    topic_id: 301,
    difficulty_level: 'low',
    duration_minutes: 15,
    questions: [
      {
        text: '500 का 25% कितना होगा?',
        difficulty: 'easy',
        explanation: '500 × 25 / 100 = 125।',
        options: [
          ['A', '100', false],
          ['B', '125', true],
          ['C', '150', false],
          ['D', '175', false]
        ]
      },
      {
        text: 'यदि दो संख्याओं का अनुपात 3:5 है और उनका योग 80 है, तो बड़ी संख्या क्या होगी?',
        difficulty: 'easy',
        explanation: '3x + 5x = 80 ⇒ 8x = 80 ⇒ x = 10। बड़ी संख्या = 5 × 10 = 50।',
        options: [
          ['A', '30', false],
          ['B', '40', false],
          ['C', '50', true],
          ['D', '60', false]
        ]
      },
      {
        text: 'प्रथम 5 प्राकृत संख्याओं (Natural Numbers) का औसत (Average) क्या होगा?',
        difficulty: 'easy',
        explanation: '(1 + 2 + 3 + 4 + 5) / 5 = 15 / 5 = 3।',
        options: [
          ['A', '2.5', false],
          ['B', '3', true],
          ['C', '3.5', false],
          ['D', '4', false]
        ]
      },
      {
        text: 'एक दुकानदार ₹200 की वस्तु को ₹250 में बेचता है। उसका लाभ प्रतिशत क्या है?',
        difficulty: 'easy',
        explanation: 'लाभ = 250 - 200 = ₹50। लाभ % = (50 / 200) × 100 = 25%।',
        options: [
          ['A', '20%', false],
          ['B', '25%', true],
          ['C', '30%', false],
          ['D', '15%', false]
        ]
      },
      {
        text: '₹1000 का 10% वार्षिक दर से 2 वर्ष का साधारण ब्याज (Simple Interest) कितना होगा?',
        difficulty: 'easy',
        explanation: 'SI = (P × R × T) / 100 = (1000 × 10 × 2) / 100 = ₹200।',
        options: [
          ['A', '₹100', false],
          ['B', '₹150', false],
          ['C', '₹200', true],
          ['D', '₹250', false]
        ]
      }
    ]
  },
  {
    title: 'Mathematics: Profit-Loss & Compound Interest (Medium Level)',
    slug: 'math-practice-medium-01',
    description: 'Intermediate quantitative problems on successive discounts, compound interest, and time & work equations.',
    subject_id: 3,
    topic_id: 302,
    difficulty_level: 'medium',
    duration_minutes: 20,
    questions: [
      {
        text: '20% और 10% के दो क्रमिक बट्टे (Successive Discounts) का एकल समतुल्य बट्टा क्या होगा?',
        difficulty: 'medium',
        explanation: 'समतुल्य छूट = (20 + 10 - (20 × 10 / 100))% = 30 - 2 = 28%।',
        options: [
          ['A', '30%', false],
          ['B', '28%', true],
          ['C', '25%', false],
          ['D', '22%', false]
        ]
      },
      {
        text: '₹5000 पर 10% वार्षिक दर से 2 वर्ष के चक्रवृद्धि ब्याज और साधारण ब्याज का अंतर (CI - SI) क्या होगा?',
        difficulty: 'medium',
        explanation: '2 वर्ष का अंतर = P(R/100)² = 5000 × (10/100)² = 5000 × (1/100) = ₹50।',
        options: [
          ['A', '₹40', false],
          ['B', '₹50', true],
          ['C', '₹60', false],
          ['D', '₹75', false]
        ]
      },
      {
        text: 'A किसी कार्य को 10 दिन में तथा B उसी कार्य को 15 दिन में पूरा कर सकता है। दोनों मिलकर उस कार्य को कितने दिन में पूरा करेंगे?',
        difficulty: 'medium',
        explanation: 'समय = (10 × 15) / (10 + 15) = 150 / 25 = 6 दिन।',
        options: [
          ['A', '5 दिन', false],
          ['B', '6 दिन', true],
          ['C', '7 दिन', false],
          ['D', '8 दिन', false]
        ]
      },
      {
        text: 'एक ट्रेन 72 किमी/घंटा की गति से चल रही है। 200 मीटर लंबे प्लेटफॉर्म को पार करने में उसे 15 सेकंड का समय लगता है। ट्रेन की लंबाई कितनी है?',
        difficulty: 'medium',
        explanation: 'चाल = 72 × (5/18) = 20 मी/सेकंड। दूरी = चाल × समय = 20 × 15 = 300 मीटर। ट्रेन की लंबाई = 300 - 200 = 100 मीटर।',
        options: [
          ['A', '80 मीटर', false],
          ['B', '100 मीटर', true],
          ['C', '120 मीटर', false],
          ['D', '150 मीटर', false]
        ]
      },
      {
        text: 'यदि A:B = 2:3 तथा B:C = 4:5 है, तो A:B:C का मान क्या होगा?',
        difficulty: 'medium',
        explanation: 'A:B:C = (2×4) : (3×4) : (3×5) = 8 : 12 : 15।',
        options: [
          ['A', '8:12:15', true],
          ['B', '6:12:15', false],
          ['C', '8:10:15', false],
          ['D', '2:4:5', false]
        ]
      }
    ]
  },
  {
    title: 'Mathematics: Complex Time-Work & Mixture Alligation (High Level)',
    slug: 'math-practice-high-01',
    description: 'High difficulty quant problems involving alternate day work with efficiency changes, pipe leaks and 3-vessel mixtures.',
    subject_id: 3,
    topic_id: 305,
    difficulty_level: 'high',
    duration_minutes: 25,
    questions: [
      {
        text: 'A, B तथा C एक कार्य को क्रमशः 12, 15 और 20 दिनों में कर सकते हैं। वे एक साथ कार्य प्रारंभ करते हैं किंतु A कार्य समाप्त होने से 2 दिन पहले और B कार्य समाप्त होने से 3 दिन पहले छोड़ देता है। संपूर्ण कार्य कितने दिनों में समाप्त होगा?',
        difficulty: 'hard',
        explanation: 'LCM(12,15,20)=60 इकाइयां। क्षमता: A=5, B=4, C=3। कुल माना दिन = D। 5(D-2) + 4(D-3) + 3D = 60 ⇒ 12D - 22 = 60 ⇒ 12D = 82 ⇒ D = 41/6 = 6.83 दिन (लगभग 7 दिन)।',
        options: [
          ['A', '6.83 दिन', true],
          ['B', '8 दिन', false],
          ['C', '9 दिन', false],
          ['D', '5.5 दिन', false]
        ]
      },
      {
        text: 'दो बर्तनों A और B में दूध और पानी का अनुपात क्रमशः 4:3 और 2:3 है। इन दोनों मिश्रणों को किस अनुपात में मिलाया जाए कि नए मिश्रण में आधा दूध और आधा पानी हो?',
        difficulty: 'hard',
        explanation: 'एलिगेशन नियम से: A में दूध = 4/7, B में = 2/5, वांछित = 1/2। (1/2 - 2/5) : (4/7 - 1/2) = (1/10) : (1/14) = 14 : 10 = 7 : 5।',
        options: [
          ['A', '7:5', true],
          ['B', '5:7', false],
          ['C', '3:2', false],
          ['D', '4:5', false]
        ]
      },
      {
        text: 'एक निश्चित राशि पर 3 वर्ष के लिए 10% वार्षिक दर से चक्रवृद्धि ब्याज और साधारण ब्याज का अंतर ₹155 है। मूलधन (Principal) ज्ञात कीजिए।',
        difficulty: 'hard',
        explanation: '3 वर्ष के अंतर का सूत्र: D = P(R/100)² × (300+R)/100 ⇒ 155 = P(1/100) × (310/100) ⇒ P = (155 × 100000) / 310 = ₹5000।',
        options: [
          ['A', '₹4500', false],
          ['B', '₹5000', true],
          ['C', '₹5500', false],
          ['D', '₹6000', false]
        ]
      },
      {
        text: 'एक नाव धारा के प्रतिकूल (Upstream) 24 किमी तथा धारा के अनुकूल (Downstream) 36 किमी जाने में कुल 6 घंटे लेती है। यदि धारा के प्रतिकूल 36 किमी तथा अनुकूल 24 किमी जाने में 6.5 घंटे लगते हैं, तो शांत जल में नाव की चाल क्या है?',
        difficulty: 'hard',
        explanation: 'समीकरण हल करने पर Downstream गति = 12 किमी/घंटा, Upstream गति = 8 किमी/घंटा। नाव की चाल = (12+8)/2 = 10 किमी/घंटा।',
        options: [
          ['A', '8 किमी/घंटा', false],
          ['B', '10 किमी/घंटा', true],
          ['C', '12 किमी/घंटा', false],
          ['D', '14 किमी/घंटा', false]
        ]
      },
      {
        text: 'नल A और B किसी टंकी को क्रमशः 12 और 16 मिनट में भर सकते हैं। दोनों को एक साथ खोला गया, परंतु टंकी भरने से 4 मिनट पहले नल A को बंद कर दिया गया। टंकी भरने में कुल कितना समय लगा?',
        difficulty: 'hard',
        explanation: 'कुल धारिता = 48 लीटर। A की गति = 4 ली/मि, B की = 3 ली/मि। अंतिम 4 मिनट में B अकेले 3×4 = 12 लीटर भरेगा। शेष 36 लीटर दोनों मिलकर 36/7 मिनट में भरेंगे। कुल समय = 36/7 + 4 = 64/7 = 9(1/7) मिनट।',
        options: [
          ['A', '9(1/7) मिनट', true],
          ['B', '8(2/7) मिनट', false],
          ['C', '10 मिनट', false],
          ['D', '7(3/7) मिनट', false]
        ]
      }
    ]
  },

  // Subject 4: General Knowledge (GK)
  {
    title: 'Rajasthan GK: Heritage & Geography (Low Level)',
    slug: 'gk-practice-low-01',
    description: 'Basic Rajasthan general knowledge questions regarding historical monuments, district capitals and major rivers.',
    subject_id: 4,
    topic_id: 401,
    difficulty_level: 'low',
    duration_minutes: 15,
    questions: [
      {
        text: 'राजस्थान की गुलाबी नगरी (Pink City) किस शहर को कहा जाता है?',
        difficulty: 'easy',
        explanation: 'जयपुर को गुलाबी नगरी (Pink City) कहा जाता है। 1876 में सवाई रामसिंह ने प्रिंस ऑफ वेल्स के स्वागत में इसे गुलाबी रंग से रंगवाया था।',
        options: [
          ['A', 'उदयपुर', false],
          ['B', 'जयपुर', true],
          ['C', 'जोधपुर', false],
          ['D', 'कोटा', false]
        ]
      },
      {
        text: 'राजस्थान का राज्य पशु (State Animal - Wild) कौन सा है?',
        difficulty: 'easy',
        explanation: 'राजस्थान का राज्य वन्य पशु चिंकारा (गजेला-गजेला) है तथा राज्य पालतू पशु ऊंट है।',
        options: [
          ['A', 'चिंकारा', true],
          ['B', 'बाघ', false],
          ['C', 'हिरण', false],
          ['D', 'गाय', false]
        ]
      },
      {
        text: 'राजस्थान में "झीलों की नगरी" (City of Lakes) के नाम से कौन सा शहर विख्यात है?',
        difficulty: 'easy',
        explanation: 'उदयपुर को पिछोला, फतेहसागर जैसी खूबसूरत झीलों के कारण झीलों की नगरी कहा जाता है।',
        options: [
          ['A', 'अजमेर', false],
          ['B', 'उदयपुर', true],
          ['C', 'बीकानेर', false],
          ['D', 'भरतपुर', false]
        ]
      },
      {
        text: 'प्रसिद्ध थार मरुस्थल का अधिकांश भाग किस राज्य में विस्तृत है?',
        difficulty: 'easy',
        explanation: 'थार मरुस्थल का लगभग 60% से अधिक भाग राजस्थान राज्य में अवस्थित है।',
        options: [
          ['A', 'गुजरात', false],
          ['B', 'पंजाब', false],
          ['C', 'राजस्थान', true],
          ['D', 'हरियाणा', false]
        ]
      },
      {
        text: 'मेहरानगढ़ दुर्ग (Mehrangarh Fort) राजस्थान के किस जिले में स्थित है?',
        difficulty: 'easy',
        explanation: 'मेहरानगढ़ दुर्ग जोधपुर में चिड़ियाटूँक पहाड़ी पर राव जोधा द्वारा बनवाया गया था।',
        options: [
          ['A', 'जैसलमेर', false],
          ['B', 'जोधपुर', true],
          ['C', 'चित्तौड़गढ़', false],
          ['D', 'कुंभलगढ़', false]
        ]
      }
    ]
  },
  {
    title: 'Rajasthan GK: Polity & Minerals (Medium Level)',
    slug: 'gk-practice-medium-01',
    description: 'Intermediate Rajasthan exam questions on Panchayati Raj origins, mineral reserves, wildlife sanctuaries and art schools.',
    subject_id: 4,
    topic_id: 405,
    difficulty_level: 'medium',
    duration_minutes: 20,
    questions: [
      {
        text: 'भारत में त्रिस्तरीय पंचायती राज व्यवस्था का शुभारंभ 2 अक्टूबर 1959 को राजस्थान के किस जिले से हुआ था?',
        difficulty: 'medium',
        explanation: 'पं. जवाहरलाल नेहरू ने 2 अक्टूबर 1959 को राजस्थान के नागौर जिले के बगदरी गांव से पंचायती राज का उद्घाटन किया था।',
        options: [
          ['A', 'सीकर', false],
          ['B', 'नागौर', true],
          ['C', 'बीकानेर', false],
          ['D', 'बाड़मेर', false]
        ]
      },
      {
        text: 'राजस्थान में "ताम्र नगरी" (Copper City) के रूप में प्रसिद्ध खेतड़ी किस जिले में आती है?',
        difficulty: 'medium',
        explanation: 'खेतड़ी हिंदुस्तान कॉपर लिमिटेड और तांबे के विशाल भंडारों के लिए प्रसिद्ध है (वर्तमान में नीम का थाना/झुंझुनू क्षेत्र)।',
        options: [
          ['A', 'झुंझुनू / नीम का थाना', true],
          ['B', 'भीलवाड़ा', false],
          ['C', 'अलवर', false],
          ['D', 'उदयपुर', false]
        ]
      },
      {
        text: 'प्रसिद्ध "बणी-ठणी" चित्रकला शैली का संबंध राजस्थान की किस चित्रशैली से है?',
        difficulty: 'medium',
        explanation: 'बणी-ठणी को भारत की मोनालिसा कहा जाता है, जिसका संबंध किशनगढ़ चित्रशैली (निहालचंद चित्रकार) से है।',
        options: [
          ['A', 'मेवाड़ शैली', false],
          ['B', 'किशनगढ़ शैली', true],
          ['C', 'बूंदी शैली', false],
          ['D', 'मारवाड़ शैली', false]
        ]
      },
      {
        text: 'राजस्थान में केवलादेव राष्ट्रीय उद्यान (घाना पक्षी विहार) किस जिले में स्थित है?',
        difficulty: 'medium',
        explanation: 'केवलादेव राष्ट्रीय उद्यान भरतपुर में स्थित है और यह साइबेरियन क्रेन के आगमन हेतु विश्व प्रसिद्ध यूनेस्को धरोहर है।',
        options: [
          ['A', 'सवाई माधोपुर', false],
          ['B', 'भरतपुर', true],
          ['C', 'अलवर', false],
          ['D', 'धौलपुर', false]
        ]
      },
      {
        text: 'राजस्थान लोक सेवा आयोग (RPSC) का मुख्यालय किस जिले में स्थित है?',
        difficulty: 'medium',
        explanation: 'RPSC का मुख्यालय अजमेर के घूघरा घाटी में स्थित है।',
        options: [
          ['A', 'जयपुर', false],
          ['B', 'अजमेर', true],
          ['C', 'जोधपुर', false],
          ['D', 'उदयपुर', false]
        ]
      }
    ]
  },
  {
    title: 'Rajasthan Administrative History & Inscriptions (High Level)',
    slug: 'gk-practice-high-01',
    description: 'High difficulty GK questions on ancient copper inscriptions, prajamandal treaties and constitutional provisions in Rajasthan.',
    subject_id: 4,
    topic_id: 403,
    difficulty_level: 'high',
    duration_minutes: 25,
    questions: [
      {
        text: 'बिजौलिया किसान आंदोलन के दौरान "ऊपरमाल पंच बोर्ड" की स्थापना किसके द्वारा और किस वर्ष की गई थी?',
        difficulty: 'hard',
        explanation: 'विजय सिंह पथिक ने 1917 में हरियाली अमावस्या के दिन ऊपरमाल पंच बोर्ड की स्थापना की थी जिसके सरपंच मन्ना पटेल बनाए गए थे।',
        options: [
          ['A', 'साधु सीताराम दास (1915)', false],
          ['B', 'विजय सिंह पथिक (1917)', true],
          ['C', 'माणिक्य लाल वर्मा (1920)', false],
          ['D', 'हरिभाऊ उपाध्याय (1922)', false]
        ]
      },
      {
        text: 'राजस्थान के एकीकरण के पंचम चरण (संयुक्त वृहत् राजस्थान - 15 मई 1949) में मत्स्य संघ का विलय किसकी सिफारिश पर किया गया था?',
        difficulty: 'hard',
        explanation: 'डॉ. शंकरराव देव समिति की सिफारिश पर मत्स्य संघ को संयुक्त राजस्थान में मिलाकर संयुक्त वृहत् राजस्थान का निर्माण किया गया।',
        options: [
          ['A', 'सत्यनारायण राव समिति', false],
          ['B', 'डॉ. शंकरराव देव समिति', true],
          ['C', 'फजल अली आयोग', false],
          ['D', 'के.एम. मुंशी समिति', false]
        ]
      },
      {
        text: 'गुहिल वंश के बप्पा रावल को किस शिलालेख में "विप्र" (ब्राह्मण) और "चकवे" (सार्वभौम शासक) कहा गया है?',
        difficulty: 'hard',
        explanation: 'कुंभलगढ़ प्रशस्ति (1460 ई.) में गुहिल शासकों को आनंदपुर के ब्राह्मण वंश से संबंधित बताया गया है।',
        options: [
          ['A', 'रणकपुर प्रशस्ति', false],
          ['B', 'कुंभलगढ़ प्रशस्ति', true],
          ['C', 'कीर्ति स्तम्भ प्रशस्ति', false],
          ['D', 'बिजौलिया शिलालेख', false]
        ]
      },
      {
        text: 'राजस्थान में 1857 की क्रांति के समय ब्रिटिश पॉलिटिकल एजेंटों का कौन सा युग्म सुमेलित नहीं है?',
        difficulty: 'hard',
        explanation: 'कोटा: मेजर बर्टन, मारवाड़ (जोधपुर): मॉक मेसन, मेवाड़: मेजर शावर्स, जयपुर: कर्नल ईडन। भरतपुर के मॉरिसन थे।',
        options: [
          ['A', 'कोटा - मेजर बर्टन', false],
          ['B', 'जोधपुर - मॉक मेसन', false],
          ['C', 'मेवाड़ - कर्नल ईडन', true],
          ['D', 'जयपुर - कर्नल ईडन', false]
        ]
      },
      {
        text: 'राजस्थान राज्य मानवाधिकार आयोग (RSHRC) के अध्यक्ष के रूप में केवल किसे नियुक्त किया जा सकता है?',
        difficulty: 'hard',
        explanation: '2019 के संशोधन के बाद, उच्च न्यायालय का मुख्य न्यायाधीश या कोई अन्य न्यायाधीश रहा व्यक्ति अध्यक्ष नियुक्त हो सकता है।',
        options: [
          ['A', 'केवल उच्चतम न्यायालय का अवकाश प्राप्त मुख्य न्यायाधीश', false],
          ['B', 'उच्च न्यायालय का सेवानिवृत्त मुख्य न्यायाधीश या न्यायाधीश', true],
          ['C', 'राज्यपाल द्वारा मनोनीत कोई भी वरिष्ठ विधि विशेषज्ञ', false],
          ['D', 'राज्य का सेवानिवृत्त मुख्य सचिव', false]
        ]
      }
    ]
  }
]

async function seed() {
  await client.connect()
  console.log('Connected to DB. Cleaning up partial seeded tests...')
  await client.query("DELETE FROM assessments WHERE slug LIKE '%-practice-%'")
  console.log('Starting Subject & Difficulty Mock Test Seeding...')

  let questionCounter = 100 // starting custom ID for questions

  for (const suite of testSuites) {
    console.log(`\nInserting Test: "${suite.title}" [Subject ${suite.subject_id}, Level ${suite.difficulty_level}]`)

    // Check if test slug already exists
    const { rows: existingTests } = await client.query('SELECT id FROM assessments WHERE slug = $1', [suite.slug])
    let assessmentId
    if (existingTests.length > 0) {
      assessmentId = existingTests[0].id
      await client.query(`
        UPDATE assessments 
        SET difficulty_level = $1, subject_id = $2, duration_minutes = $3, total_questions = $4, total_marks = $5
        WHERE id = $6
      `, [suite.difficulty_level, suite.subject_id, suite.duration_minutes, suite.questions.length, suite.questions.length, assessmentId])
      console.log(`Updated assessment #${assessmentId}`)
    } else {
      const { rows: insTest } = await client.query(`
        INSERT INTO assessments 
        (title, slug, description, exam_id, subject_id, topic_id, assessment_type, duration_minutes, total_questions, total_marks, passing_percentage, difficulty_level, status, created_at)
        VALUES ($1, $2, $3, 1, $4, $5, 'mock', $6, $7, $8, 40.00, $9, 'published', NOW())
        RETURNING id
      `, [
        suite.title,
        suite.slug,
        suite.description,
        suite.subject_id,
        suite.topic_id,
        suite.duration_minutes,
        suite.questions.length,
        suite.questions.length,
        suite.difficulty_level
      ])
      assessmentId = insTest[0].id
      console.log(`Created assessment #${assessmentId}`)
    }

    // Insert questions and options
    let orderIdx = 1
    for (const q of suite.questions) {
      questionCounter++
      // Insert Question
      const { rows: insQ } = await client.query(`
        INSERT INTO questions 
        (subject_id, topic_id, question_text, question_type, difficulty, status, explanation, default_marks, default_negative_marks, language_code, source, created_at)
        VALUES ($1, $2, $3, 'single_choice', $4, 'approved', $5, 1.00, 0.25, 'hi', 'ExamForge Question Bank', NOW())
        RETURNING id
      `, [suite.subject_id, suite.topic_id, q.text, q.difficulty, q.explanation])

      const qId = insQ[0].id

      // Insert Options
      for (let i = 0; i < q.options.length; i++) {
        const [optKey, optText, isCorrect] = q.options[i]
        await client.query(`
          INSERT INTO question_options (question_id, option_key, option_text, is_correct, order_index)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT DO NOTHING
        `, [qId, optKey, optText, isCorrect ? 1 : 0, i + 1])
      }

      // Link to assessment
      await client.query(`
        INSERT INTO assessment_questions (assessment_id, section_id, question_id, order_index, marks, negative_marks)
        VALUES ($1, NULL, $2, $3, 1.00, 0.25)
        ON CONFLICT DO NOTHING
      `, [assessmentId, qId, orderIdx])

      orderIdx++
    }
  }

  console.log('\n=============================================')
  console.log('✅ All Subject & Difficulty Mock Tests Successfully Seeded!')
  console.log('=============================================')

  const countTests = await client.query('SELECT count(*) FROM assessments WHERE status = $1', ['published'])
  console.log(`Total Published Assessments: ${countTests.rows[0].count}`)

  await client.end()
}

seed().catch(console.error)
