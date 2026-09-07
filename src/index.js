require("dotenv").config();
const args = require("minimist")(process.argv.slice(2));
const classes = require("../config/classes.js");
const { getLatestMeeting, getParticipants, downloadCSV, debugMeetings } = require("./meetlist.js");
const { parseCSV } = require("./parser.js");
const { buildAttendance } = require("./matcher.js");
const { getClient, getRoster, writeAttendance } = require("./sheets.js");

const JWT = process.env.MEETLIST_JWT;
const CREDENTIALS_PATH = process.env.GOOGLE_SERVICE_ACCOUNT_PATH || "./credentials/service-account.json";

// Режим дебагу: node src/index.js --debug
// Показує що повертає MeetList API без запису в таблиці
if (args.debug) {
  if (!JWT) { console.error("❌ Немає MEETLIST_JWT у .env"); process.exit(1); }
  debugMeetings(JWT).catch(e => console.error(e.message));
  return;
}

async function processClass(sheets, classKey, meetingData) {
  const cls = classes[classKey];
  if (!cls) { console.error(`❌ Клас "${classKey}" не знайдено`); return; }

  console.log(`\n📋 Клас ${cls.name}`);

  const roster = await getRoster(sheets, cls.sheetId, cls.rosterSheet, cls.startRow);
  console.log(`   Учнів: ${roster.length} → ${roster.slice(0,3).join(", ")}...`);

  const attendance = buildAttendance(meetingData.participants, roster);
  const present = attendance.filter(a => a.present).length;
  console.log(`   Присутніх: ${present}/${roster.length}`);

  // Показуємо збіги для перевірки
  attendance.filter(a => a.present).forEach(a => {
    const diff = a.meetName !== a.student ? ` (в Meet: "${a.meetName}")` : "";
    console.log(`   ✅ ${a.student}${diff} — з ${a.joinTime || "?"}`);
  });

  await writeAttendance(sheets, cls.sheetId, cls.attendanceSheet, attendance, meetingData.date);
  console.log(`   → Записано в Google Sheets`);
}

async function main() {
  if (!JWT) {
    console.error(`
❌ Немає MEETLIST_JWT у .env файлі!

Як отримати токен:
1. Зайди на meetlist.io
2. F12 → Network → Fetch/XHR
3. Знайди запит "me/"
4. Headers → Request Headers → Cookie
5. Скопіюй значення після "jwt_token=" (до наступної ";")
6. Постав в .env як MEETLIST_JWT=eyJ...
    `);
    process.exit(1);
  }

  console.log("🔍 Шукаємо останню зустріч...");
  const meeting = await getLatestMeeting(JWT);
  if (!meeting) {
    console.error("❌ Зустрічей не знайдено у MeetList");
    process.exit(1);
  }
  console.log(`📅 Зустріч: "${meeting.name}" (ID: ${meeting.id})`);
  console.log(`   Дата: ${meeting.date}`);

  // Отримуємо учасників через JSON API
  console.log("⬇️  Завантажуємо учасників...");
  let participants;
  try {
    participants = await getParticipants(JWT, meeting.id);
  } catch (e) {
    // Fallback: пробуємо CSV
    console.log("   JSON не спрацював, пробуємо CSV...");
    const csv = await downloadCSV(JWT, meeting.id);
    const { parseCSV } = require("./parser.js");
    participants = parseCSV(csv);
  }

  console.log(`   Учасників: ${participants.length}`);
  participants.forEach(p => console.log(`   - ${p.name} | ${p.joinTime}`));

  const meetingData = { participants, date: meeting.date };
  const sheets = await getClient(CREDENTIALS_PATH);

  const classKeys = args.all
    ? Object.keys(classes)
    : [(args.class || args.c || "7A")];

  for (const key of classKeys) {
    await processClass(sheets, key, meetingData);
  }

  console.log("\n✅ Готово!");
}

main().catch(err => {
  console.error("💥", err.message);
  if (err.response?.status) console.error(`   HTTP ${err.response.status}:`, JSON.stringify(err.response.data));
  process.exit(1);
});
