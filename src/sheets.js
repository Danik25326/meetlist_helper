const { google } = require("googleapis");

async function getClient(credentialsPath) {
  const auth = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

/**
 * Читає список учнів з аркуша.
 * Очікує що в першому стовпці — "Прізвище Ім'я" (або окремо у двох стовпцях).
 */
async function getRoster(sheets, sheetId, sheetName, startRow = 2) {
  // Беремо два стовпці — може бути "Прізвище" в A і "Ім'я" в B
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetName}!A${startRow}:B200`,
  });

  const rows = res.data.values || [];
  return rows
    .filter(row => row[0] && row[0].trim())
    .map(row => {
      // Якщо є другий стовпець — об'єднуємо
      if (row[1] && row[1].trim()) {
        return `${row[0].trim()} ${row[1].trim()}`;
      }
      return row[0].trim();
    });
}

function fmtTime(str) {
  if (!str) return "—";
  // Якщо вже HH:MM формат — повертаємо як є
  if (/^\d{1,2}:\d{2}/.test(str)) return str.substring(0, 5);
  // Якщо ISO дата
  try {
    return new Date(str).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return str;
  }
}

function fmtDate(str) {
  try {
    const d = new Date(str);
    if (isNaN(d)) return str;
    return d.toLocaleDateString("uk-UA");
  } catch {
    return str || new Date().toLocaleDateString("uk-UA");
  }
}

/**
 * Записує відвідуваність в окремий аркуш.
 * Колонки: Учень | Дата | Приєднався | Час у дзвінку | Статус | Ім'я в Meet
 */
async function writeAttendance(sheets, sheetId, attendanceSheet, attendance, date) {
  const dateStr = fmtDate(date);

  // Перевіряємо чи є заголовок
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${attendanceSheet}!A1:F1`,
  }).catch(() => ({ data: { values: [] } }));

  const hasHeader = headerRes.data.values && headerRes.data.values.length > 0;

  if (!hasHeader) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${attendanceSheet}!A1:F1`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [["Учень", "Дата", "Приєднався", "Час у дзвінку", "Статус", "Ім'я в Meet"]],
      },
    });
  }

  const rows = attendance.map(a => [
    a.student,
    dateStr,
    fmtTime(a.joinTime),
    a.duration || "—",
    a.present ? "✅ Присутній" : "❌ Відсутній",
    a.meetName || "",
  ]);

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${attendanceSheet}!A:F`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: rows },
  });
}

module.exports = { getClient, getRoster, writeAttendance };
