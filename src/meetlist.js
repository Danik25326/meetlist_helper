const axios = require("axios");

const BASE = "https://api.meetlist.io/v1";

/**
 * MeetList використовує Django REST Framework.
 * Токен тепер передається через Cookie (jwt_token).
 */
function makeClient(jwt) {
  return axios.create({
    baseURL: BASE,
    headers: {
      "Cookie": `jwt_token=${jwt}`,
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Origin": "https://meetlist.io",
      "Referer": "https://meetlist.io/",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    withCredentials: true
  });
}

/**
 * Отримує найновішу зустріч
 */
async function getLatestMeeting(jwt) {
  const client = makeClient(jwt);
  const res = await client.get("/meetings/", {
    params: { ordering: "-start_time", limit: 5 },
  });

  const data = res.data;
  // MeetList повертає { count, results: [...] } або просто масив
  const list = Array.isArray(data) ? data : (data.results || []);
  if (list.length === 0) return null;

  const m = list[0];
  return {
    id: m.id || m.uuid,
    name: m.name || m.title || "Зустріч",
    date: m.start_time || m.date || m.created_at || new Date().toISOString(),
    raw: m,
  };
}

/**
 * Отримує список учасників конкретної зустрічі через JSON API
 */
async function getParticipants(jwt, meetingId) {
  const client = makeClient(jwt);
  const res = await client.get(`/meetings/${meetingId}/participants/`);

  const data = res.data;
  const list = Array.isArray(data) ? data : (data.results || []);

  return list.map(p => ({
    // MeetList може використовувати різні назви полів — беремо всі варіанти
    name:      p.name || p.display_name || p.participant_name || p.email || "Unknown",
    joinTime:  p.join_time || p.first_seen_at || p.joined_at || p.start_time,
    leaveTime: p.leave_time || p.last_seen_at || p.left_at || p.end_time,
    duration:  p.duration || p.time_in_call || p.total_time,
  }));
}

/**
 * Скачує CSV (якщо JSON не спрацює — fallback)
 */
async function downloadCSV(jwt, meetingId) {
  const client = makeClient(jwt);
  const res = await client.get(`/meetings/${meetingId}/export/`, {
    params: { format: "csv" },
    headers: { Accept: "text/csv,*/*" },
    responseType: "text",
  });
  return res.data;
}

/**
 * Дебаг: виводить структуру відповіді щоб зрозуміти поля
 */
async function debugMeetings(jwt) {
  const client = makeClient(jwt);
  const res = await client.get("/meetings/", { params: { limit: 1 } });
  console.log("MEETINGS RESPONSE:", JSON.stringify(res.data, null, 2));

  const data = res.data;
  const list = Array.isArray(data) ? data : (data.results || []);
  if (list.length > 0) {
    const meetingId = list[0].id || list[0].uuid;
    console.log("\nFIRST MEETING ID:", meetingId);

    try {
      const pRes = await client.get(`/meetings/${meetingId}/participants/`);
      console.log("\nPARTICIPANTS RESPONSE:", JSON.stringify(pRes.data, null, 2));
    } catch (e) {
      console.log("\nPARTICIPANTS ERROR:", e.response?.status, e.response?.data);
    }
  }
}

module.exports = { getLatestMeeting, getParticipants, downloadCSV, debugMeetings };
