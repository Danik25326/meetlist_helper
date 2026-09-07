/**
 * Парсер CSV з MeetList.
 * Формат: Name, First Seen At, Time In Call (HH:MM:SS)
 * або:    Name, Join Time, Leave Time, Duration
 */
function parseCSV(csvText) {
  const lines = csvText.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return [];

  // Перший рядок — заголовки
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/"/g, ""));

  // Знаходимо індекси потрібних стовпців (гнучко)
  const nameIdx = headers.findIndex(h => h.includes("name"));
  const joinIdx = headers.findIndex(h =>
    h.includes("first seen") || h.includes("join") || h.includes("joined")
  );
  const leaveIdx = headers.findIndex(h =>
    h.includes("leave") || h.includes("left") || h.includes("last seen")
  );
  const durationIdx = headers.findIndex(h =>
    h.includes("duration") || h.includes("time in call")
  );

  const participants = [];

  for (let i = 1; i < lines.length; i++) {
    // Парсимо рядок з урахуванням лапок
    const cols = parseCSVLine(lines[i]);
    if (cols.length === 0) continue;

    const name = nameIdx >= 0 ? clean(cols[nameIdx]) : "";
    if (!name || name === "You") continue; // пропускаємо себе

    participants.push({
      name,
      joinTime: joinIdx >= 0 ? clean(cols[joinIdx]) : null,
      leaveTime: leaveIdx >= 0 ? clean(cols[leaveIdx]) : null,
      duration: durationIdx >= 0 ? clean(cols[durationIdx]) : null,
    });
  }

  return participants;
}

function clean(str) {
  return (str || "").trim().replace(/^"|"$/g, "");
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

module.exports = { parseCSV };
