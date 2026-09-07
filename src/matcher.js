/**
 * Зіставляє учасників Meet (можуть бути латиницею або кирилицею)
 * зі списком учнів з Google Sheets (кирилиця).
 */

// Транслітераційна таблиця UK → Latin (і навпаки)
const CYR_TO_LAT = {
  "а":"a","б":"b","в":"v","г":"h","ґ":"g","д":"d","е":"e","є":"ye",
  "ж":"zh","з":"z","и":"y","і":"i","ї":"yi","й":"y","к":"k","л":"l",
  "м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u",
  "ф":"f","х":"kh","ц":"ts","ч":"ch","ш":"sh","щ":"shch","ь":"",
  "ю":"yu","я":"ya","ё":"yo","э":"e","ъ":"","ы":"y",
};

const LAT_TO_CYR = {
  "zh":"ж","kh":"х","ts":"ц","ch":"ч","sh":"ш","shch":"щ","yo":"є",
  "ye":"є","yi":"ї","yu":"ю","ya":"я","a":"а","b":"б","v":"в",
  "h":"г","g":"ґ","d":"д","e":"е","z":"з","y":"и","i":"і","k":"к",
  "l":"л","m":"м","n":"н","o":"о","p":"п","r":"р","s":"с","t":"т",
  "u":"у","f":"ф",
};

function cyrToLat(str) {
  return str.toLowerCase().split("").map(c => CYR_TO_LAT[c] ?? c).join("");
}

function latToCyr(str) {
  let result = str.toLowerCase();
  // Спочатку багатолітерні
  for (const [lat, cyr] of Object.entries(LAT_TO_CYR)) {
    if (lat.length > 1) result = result.replaceAll(lat, cyr);
  }
  // Потім однолітерні
  for (const [lat, cyr] of Object.entries(LAT_TO_CYR)) {
    if (lat.length === 1) result = result.replaceAll(lat, cyr);
  }
  return result;
}

function normalize(str) {
  return str.toLowerCase().trim().replace(/\s+/g, " ");
}

// Відстань Левенштейна
function lev(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({length: m+1}, (_, i) =>
    Array.from({length: n+1}, (_, j) => i === 0 ? j : j === 0 ? i : 0)
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

/**
 * Знаходить учня зі списку що найкраще відповідає імені учасника.
 * Враховує: кирилиця, латиниця, транслітерація, неповне ім'я.
 */
function findStudent(participantName, roster) {
  const pNorm = normalize(participantName);
  const pLat = cyrToLat(pNorm);       // якщо кирилиця → латиниця
  const pCyr = latToCyr(pNorm);       // якщо латиниця → кирилиця
  const pWords = pNorm.split(" ");

  let best = null;
  let bestScore = Infinity;

  for (const student of roster) {
    const sNorm = normalize(student);
    const sLat = cyrToLat(sNorm);
    const sWords = sNorm.split(" ");

    // Варіанти для порівняння
    const pairs = [
      [pNorm, sNorm],
      [pLat, sLat],
      [pCyr, sNorm],
      [pNorm, cyrToLat(sNorm)],
    ];

    let score = Infinity;

    for (const [a, b] of pairs) {
      // Точний збіг
      if (a === b) { score = 0; break; }

      // Одне слово учасника є в прізвищі/імені учня
      const bWords = b.split(" ");
      const aWords = a.split(" ");
      const wordMatch = aWords.some(aw =>
        aw.length >= 3 && bWords.some(bw => bw.startsWith(aw) || aw.startsWith(bw))
      );
      if (wordMatch) { score = Math.min(score, 1); continue; }

      // Левенштейн
      const d = lev(a, b);
      score = Math.min(score, d);
    }

    if (score < bestScore) {
      bestScore = score;
      best = student;
    }
  }

  // Поріг: допускаємо відстань до 4 (для довгих прізвищ) або 2 (для коротких)
  const threshold = best ? Math.max(2, Math.floor(normalize(best).length * 0.25)) : 2;
  return bestScore <= threshold ? { student: best, score: bestScore } : null;
}

/**
 * Головна функція: для кожного учня зі списку шукає чи він був у Meet.
 */
function buildAttendance(participants, roster) {
  return roster.map(student => {
    let matched = null;
    let bestScore = Infinity;

    for (const p of participants) {
      // Шукаємо учасника для цього учня
      const sNorm = normalize(student);
      const sLat = cyrToLat(sNorm);
      const sWords = sNorm.split(" ");

      const pNorm = normalize(p.name);
      const pCyr = latToCyr(pNorm);
      const pLat = cyrToLat(pNorm);

      let score = Infinity;

      const pairs = [
        [pNorm, sNorm],
        [pLat, sLat],
        [pCyr, sNorm],
      ];

      for (const [a, b] of pairs) {
        if (a === b) { score = 0; break; }
        const bWords = b.split(" ");
        const aWords = a.split(" ");
        if (aWords.some(aw => aw.length >= 3 && bWords.some(bw => bw.startsWith(aw) || aw.startsWith(bw)))) {
          score = Math.min(score, 1);
          continue;
        }
        score = Math.min(score, lev(a, b));
      }

      if (score < bestScore) {
        bestScore = score;
        matched = p;
      }
    }

    const threshold = Math.max(2, Math.floor(normalize(student).length * 0.25));

    if (matched && bestScore <= threshold) {
      return {
        student,
        present: true,
        joinTime: matched.joinTime,
        leaveTime: matched.leaveTime,
        duration: matched.duration,
        meetName: matched.name,
      };
    }

    return {
      student,
      present: false,
      joinTime: null,
      leaveTime: null,
      duration: null,
      meetName: null,
    };
  });
}

module.exports = { buildAttendance };
