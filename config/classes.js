/**
 * Налаштування класів.
 *
 * rosterSheet  — назва аркуша де список учнів
 * attendanceSheet — назва аркуша куди писати відвідуваність
 * startRow — з якого рядка починається список (зазвичай 2, бо перший — заголовок)
 *
 * Відкрий кожну таблицю і перевір як називаються аркуші (вкладки внизу).
 * Якщо аркуш зветься "Аркуш1" або "Sheet1" — заміни нижче.
 */
module.exports = {
  "7A": {
    name: "7-А",
    sheetId: "16gC0cnt24OrSdcmaS8GDKZSaoDTyj4VJ_pgcyZZVwR4",
    rosterSheet: "Аркуш1",      // ← змінити якщо треба
    attendanceSheet: "Відвідуваність",
    startRow: 2,
  },
  "7B": {
    name: "7-Б",
    sheetId: "1bSV-y4cvVktbsbPZr8O4gAAMKRfGmu4n-683el1UcaM",
    rosterSheet: "Аркуш1",
    attendanceSheet: "Відвідуваність",
    startRow: 2,
  },
  "7C": {
    name: "7-В",
    sheetId: "1m15ETrXG4q82tp_Fc1qJWGb1x_4x94UDCvIocSAv1_0",
    rosterSheet: "Аркуш1",
    attendanceSheet: "Відвідуваність",
    startRow: 2,
  },
  "7D": {
    name: "7-Г",
    sheetId: "1XqUUU7dAFypAHTPg60AyF6_uEyYrVpWtQ2-OmI-ADs0",
    rosterSheet: "Аркуш1",
    attendanceSheet: "Відвідуваність",
    startRow: 2,
  },
};
