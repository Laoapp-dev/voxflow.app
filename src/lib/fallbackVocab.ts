import { VocabularyWord } from '../types';

export function generateFallbackVocabulary(topic: string, level: string, count: number = 5): any[] {
  const normalizedTopic = topic.toLowerCase();

  let pool: Array<{
    word: string;
    phonetic: string;
    partOfSpeech: string;
    definition: string;
    example: string;
    translation: string;
    laoTranslation?: string;
    thaiTranslation?: string;
  }> = [];

  if (normalizedTopic.includes('ielts') || normalizedTopic.includes('academic') || normalizedTopic.includes('exam')) {
    pool = [
      {
        word: 'Meticulous',
        phonetic: '/məˈtɪkjələs/',
        partOfSpeech: 'adjective',
        definition: 'Showing great attention to detail; extremely careful and precise.',
        example: 'The researcher conducted a meticulous review of all experimental data.',
        translation: 'พิถีพิถัน / ລະອຽດລະອໍ',
        laoTranslation: 'ລະອຽດລະອໍ, ພິຖີພິຖັນ',
        thaiTranslation: 'พิถีพิถัน, ละเอียดลออ',
      },
      {
        word: 'Plausible',
        phonetic: '/ˈplɔːzəbl/',
        partOfSpeech: 'adjective',
        definition: 'Seeming reasonable or probable; believable.',
        example: 'The scientist offered a plausible explanation for the sudden climate anomaly.',
        translation: 'น่าเชื่อถือ / เป็นไปได้',
        laoTranslation: 'ເປັນໄປໄດ້, ເປັນຕານັບຖື',
        thaiTranslation: 'น่าเชื่อถือ, สมเหตุสมผล',
      },
      {
        word: 'Ameliorate',
        phonetic: '/əˈmiːliəreɪt/',
        partOfSpeech: 'verb',
        definition: 'To make something bad or unsatisfactory better; improve.',
        example: 'New infrastructure policies aim to ameliorate living conditions in rural regions.',
        translation: 'ปรับปรุงให้ดีขึ้น / 改善',
        laoTranslation: 'ปรับปรุงให้ดีขึ้น, ຟື້ນຟູ',
        thaiTranslation: 'ทอดทอด, ปรับปรุงให้ดีขึ้น',
      },
      {
        word: 'Ubiquitous',
        phonetic: '/juːˈbɪkwɪtəs/',
        partOfSpeech: 'adjective',
        definition: 'Present, appearing, or found everywhere simultaneously.',
        example: 'Smartphones have become ubiquitous in modern urban society.',
        translation: 'มีอยู่ทุกหนทุกแห่ง',
        laoTranslation: 'ມີຢູ່ທຸກບ່ອນ, ພົບເຫັນທົ່ວໄປ',
        thaiTranslation: 'แพร่หลาย, มีอยู่ทุกหนแห่ง',
      },
      {
        word: 'Eloquent',
        phonetic: '/ˈeləkwənt/',
        partOfSpeech: 'adjective',
        definition: 'Fluent or persuasive in speaking or writing.',
        example: 'She delivered an eloquent speech defending environmental preservation.',
        translation: 'พูดจาฉะฉาน / ເວົ້າເກັ່ງ',
        laoTranslation: 'ເວົ້າອ່ອນຫວານ, ມີສິລະປະໃນການເວົ້າ',
        thaiTranslation: 'พูดจาฉะฉาน, สละสลวย',
      },
      {
        word: 'Pragmatic',
        phonetic: '/præɡˈmætɪk/',
        partOfSpeech: 'adjective',
        definition: 'Dealing with things sensibly and realistically based on practical considerations.',
        example: 'We need a pragmatic solution to balance economic growth and carbon reduction.',
        translation: 'เน้นการปฏิบัติจริง',
        laoTranslation: 'เน้นการปฏิบัติจริง, อิงความจริง',
        thaiTranslation: 'เน้นการปฏิบัติจริง, ที่อิงความเป็นจริง',
      },
    ];
  } else if (normalizedTopic.includes('business') || normalizedTopic.includes('meeting') || normalizedTopic.includes('negotiat')) {
    pool = [
      {
        word: 'Synergy',
        phonetic: '/ˈsɪnədʒi/',
        partOfSpeech: 'noun',
        definition: 'Combined action or cooperation that produces a greater total effect than the sum of individual efforts.',
        example: 'The cross-departmental merger created valuable operational synergies.',
        translation: 'การทำงานร่วมกันอย่างมีประสิทธิภาพ',
        laoTranslation: 'การประสานพลังงาน, การร่วมมือ',
        thaiTranslation: 'การผนึกกำลัง, การทำงานร่วมกัน',
      },
      {
        word: 'Leverage',
        phonetic: '/ˈliːvərɪdʒ/',
        partOfSpeech: 'verb',
        definition: 'Use something to maximum advantage or opportunity.',
        example: 'Our team leveraged business analytics to expand market share.',
        translation: 'ใช้ประโยชน์ให้คุ้มค่าที่สุด',
        laoTranslation: 'นำมาใช้ประโยชน์สูงสุด',
        thaiTranslation: 'ใช้ประโยชน์สูงสุด, ต่อยอด',
      },
      {
        word: 'Consensus',
        phonetic: '/kənˈsensəs/',
        partOfSpeech: 'noun',
        definition: 'General agreement among a group of people.',
        example: 'After three rounds of discussion, the executive board reached a consensus.',
        translation: 'ฉันทามติ / ข้อตกลงร่วมกัน',
        laoTranslation: 'ความเห็นพ้องต้องกัน',
        thaiTranslation: 'ฉันทามติ, ความเห็นพ้อง',
      },
      {
        word: 'Pivot',
        phonetic: '/ˈpɪvət/',
        partOfSpeech: 'verb',
        definition: 'Shift strategic direction or business focus rapidly in response to market changes.',
        example: 'The tech startup pivoted from hardware production to subscription software.',
        translation: 'ปรับเปลี่ยนทิศทางธุรกิจ',
        laoTranslation: 'เปลี่ยนทิศทางยุทธศาสตร์',
        thaiTranslation: 'ปรับเปลี่ยนทิศทางยุทธศาสตร์',
      },
      {
        word: 'Mitigate',
        phonetic: '/ˈmɪtɪɡeɪt/',
        partOfSpeech: 'verb',
        definition: 'Make less severe, serious, or painful; reduce financial or operational risk.',
        example: 'Diversifying investments helps mitigate market volatility risks.',
        translation: 'บรรเทาความเสี่ยง',
        laoTranslation: 'ลดบรรเทาความเสี่ยง',
        thaiTranslation: 'บรรเทา, ลดความรุนแรง',
      },
    ];
  } else if (normalizedTopic.includes('tech') || normalizedTopic.includes('ai') || normalizedTopic.includes('software') || normalizedTopic.includes('cod')) {
    pool = [
      {
        word: 'Algorithm',
        phonetic: '/ˈælɡərɪðəm/',
        partOfSpeech: 'noun',
        definition: 'A step-by-step procedure or formula for solving a problem or calculating data.',
        example: 'The recommendation algorithm personalizes content feeds for millions of users.',
        translation: 'ขั้นตอนวิธีทางคอมพิวเตอร์',
        laoTranslation: 'อัลกอริทึม, กระบวนการคำนวณ',
        thaiTranslation: 'อัลกอริทึม, ขั้นตอนวิธี',
      },
      {
        word: 'Scalability',
        phonetic: '/ˌskeɪləˈbɪləti/',
        partOfSpeech: 'noun',
        definition: 'The capability of a system, network, or process to handle a growing amount of work.',
        example: 'Cloud architecture ensures high scalability during peak traffic events.',
        translation: 'ความสามารถในการขยายระบบ',
        laoTranslation: 'ขีดความสามารถในการขยายตัว',
        thaiTranslation: 'ความสามารถในการรองรับการขยายตัว',
      },
      {
        word: 'Latency',
        phonetic: '/ˈleɪtənsi/',
        partOfSpeech: 'noun',
        definition: 'The delay before a transfer of data begins following an instruction for its transfer.',
        example: 'Optimizing database queries reduced API response latency to under 50ms.',
        translation: 'ความล่าช้าในการส่งข้อมูล',
        laoTranslation: 'เวลาแฝง, ความล่าช้า',
        thaiTranslation: 'ความล่าช้า, ค่าความแฝง',
      },
      {
        word: 'Deterministic',
        phonetic: '/dɪˌtɜːmɪˈnɪstɪk/',
        partOfSpeech: 'adjective',
        definition: 'In computer science, a process that always produces the exact same output given the same input.',
        example: 'Unit test execution should ideally be deterministic and repeatable.',
        translation: 'แน่นอนไม่เปลี่ยนแปลง',
        laoTranslation: 'แน่นอน, คำนวณผลลัพธ์ได้แน่นอน',
        thaiTranslation: 'ที่แน่นอน, ทำนายผลได้แน่นอน',
      },
      {
        word: 'Asynchronous',
        phonetic: '/eɪˈsɪŋkrənəs/',
        partOfSpeech: 'adjective',
        definition: 'Not occurring at the same time; executing background tasks without blocking main operations.',
        example: 'The client sends an asynchronous request to fetch user notifications in background.',
        translation: 'ไม่ประสานเวลา / ทำงานเบื้องหลัง',
        laoTranslation: 'การทำงานแบบอซิงโครนัส',
        thaiTranslation: 'แบบไม่พร้อมกัน, อะซิงโครนัส',
      },
    ];
  } else if (normalizedTopic.includes('idiom') || normalizedTopic.includes('slang') || normalizedTopic.includes('colloquial')) {
    pool = [
      {
        word: 'Cut to the chase',
        phonetic: '/kʌt tuː ðə tʃeɪs/',
        partOfSpeech: 'idiom',
        definition: 'Come directly to the point without wasting time on trivial details.',
        example: 'Let’s cut to the chase and talk about the budget requirements.',
        translation: 'เข้าประเด็นเลย / ເວົ້າເຂົ້າປະເດັນ',
        laoTranslation: 'ເວົ້າເຂົ້າປະເດັນເລີຍ',
        thaiTranslation: 'เข้าเรื่องเลย, ไม่อ้อมค้อม',
      },
      {
        word: 'Bite the bullet',
        phonetic: '/baɪt ðə ˈbʊlɪt/',
        partOfSpeech: 'idiom',
        definition: 'Decide to do something difficult or unpleasant that one has been avoiding.',
        example: 'I decided to bite the bullet and complete the exam registration today.',
        translation: 'กัดฟันสู้ / อดทนทำ',
        laoTranslation: 'ອົດທົນສູ້, ອົດທົນເຮັດ',
        thaiTranslation: 'ยอมรับสภาพ, กัดฟันทำ',
      },
      {
        word: 'Break the ice',
        phonetic: '/breɪk ðə aɪs/',
        partOfSpeech: 'idiom',
        definition: 'Do or say something to relieve tension or get conversation going in an unfamiliar group.',
        example: 'The facilitator played a fun game to break the ice among new workshop attendees.',
        translation: 'ผ่อนคลายบรรยากาศ',
        laoTranslation: 'สร้างบรรยากาศเป็นกันเอง',
        thaiTranslation: 'ละลายพฤติกรรม, เริ่มสร้างความคุ้นเคย',
      },
      {
        word: 'On the fence',
        phonetic: '/ɒn ðə fens/',
        partOfSpeech: 'idiom',
        definition: 'Undecided or neutral between two choices or opinions.',
        example: 'She is still on the fence about whether to study abroad or take the job offer.',
        translation: 'ยังตัดสินใจไม่ได้ / สองจิตสองใจ',
        laoTranslation: 'ຍັງຕັດສິນໃຈບໍ່ໄດ້',
        thaiTranslation: 'ยังลังเล, สองจิตสองใจ',
      },
      {
        word: 'Hit the nail on the head',
        phonetic: '/hɪt ðə neɪl ɒn ðə hed/',
        partOfSpeech: 'idiom',
        definition: 'Describe exactly what is causing a situation or problem.',
        example: 'His analysis of why sales dropped hit the nail right on the head.',
        translation: 'พูดได้ถูกต้องแม่นยำ',
        laoTranslation: 'ເວົ້າຖືກປະເດັນແປ໊ະ',
        thaiTranslation: 'พูดได้ตรงประเด็นเป๊ะ',
      },
    ];
  } else {
    // General high-utility vocabulary
    pool = [
      {
        word: 'Resilient',
        phonetic: '/rɪˈzɪliənt/',
        partOfSpeech: 'adjective',
        definition: 'Able to withstand or recover quickly from difficult conditions or setbacks.',
        example: 'The community remained resilient despite the economic hardships.',
        translation: 'ยืดหยุ่นลุกขึ้นสู้ใหม่ได้ / ມີຄວາມຍືດຫຍຸ່ນ',
        laoTranslation: 'ມີຄວາມຍືດຫຍຸ່ນ, ລຸກຂຶ້ນສູ້ໃໝ່ໄດ້',
        thaiTranslation: 'มีความยืดหยุ่น, ฟื้นตัวได้เร็ว',
      },
      {
        word: 'Proactive',
        phonetic: '/prəʊˈæktɪv/',
        partOfSpeech: 'adjective',
        definition: 'Creating or controlling a situation rather than just responding to it after it happens.',
        example: 'Taking proactive measures prevents project delays before deadline.',
        translation: 'เชิงรุก / ເຮັດວຽກເຊິງລຸກ',
        laoTranslation: 'ເຮັດວຽກເຊິງລຸກ, ກະຕືລືລົ້ນ',
        thaiTranslation: 'เชิงรุก, กระตือรือร้น',
      },
      {
        word: 'Comprehensive',
        phonetic: '/ˌkɒmprɪˈhensɪv/',
        partOfSpeech: 'adjective',
        definition: 'Including or dealing with all or nearly all elements or aspects of something.',
        example: 'The course offers a comprehensive introduction to modern digital marketing.',
        translation: 'ครอบคลุมทุกด้าน',
        laoTranslation: 'ຄອບຄຸມທຸກດ້ານ, ສົມບູນ',
        thaiTranslation: 'ครอบคลุมทุกด้าน, ถี่ถ้วน',
      },
      {
        word: 'Versatile',
        phonetic: '/ˈvɜːsətaɪl/',
        partOfSpeech: 'adjective',
        definition: 'Able to adapt or be adapted to many different functions or activities.',
        example: 'She is a versatile professional who handles design, writing, and project leadership.',
        translation: 'หลากหลายคุณประโยชน์ / ຫຼາຍຄວາມສາມາດ',
        laoTranslation: 'ມີຄວາມສາມາດຫຼາກຫຼາຍ',
        thaiTranslation: 'สารพัดประโยชน์, มีความสามารถหลากหลาย',
      },
      {
        word: 'Empathy',
        phonetic: '/ˈempəθi/',
        partOfSpeech: 'noun',
        definition: 'The ability to understand and share the feelings of another person.',
        example: 'Effective leadership requires genuine empathy for team members.',
        translation: 'ความเห็นอกเห็นใจ',
        laoTranslation: 'ຄວາມເຫັນອົກເຫັນໃຈ',
        thaiTranslation: 'ความเห็นอกเห็นใจ, การเข้าอกเข้าใจ',
      },
    ];
  }

  return pool.slice(0, count).map((w, idx) => ({
    word: w.word,
    phonetic: w.phonetic,
    partOfSpeech: w.partOfSpeech,
    definition: w.definition,
    example: w.example,
    translation: w.translation,
    laoTranslation: w.laoTranslation,
    thaiTranslation: w.thaiTranslation,
    category: topic || 'General',
    tags: ['AI Pack', level || 'B2-C1'],
  }));
}
