import type { Exercise, Lesson, Section } from '../../schema';

type ExerciseWithoutId = Exercise extends infer Item
  ? Item extends Exercise ? Omit<Item, 'id'> : never
  : never;

function lesson(number: number, title: string, exercises: ExerciseWithoutId[]): Lesson {
  return {
    id: `g3-en-tp-l${number}`,
    title,
    exercises: exercises.map((exercise, index) => ({
      ...exercise,
      id: `g3-en-tp-l${number}-e${String(index + 1).padStart(2, '0')}`,
    })) as Exercise[],
  };
}

export const testPrepSection: Section = {
  id: 'g3-english-test-prep',
  grade: 3,
  subject: 'english',
  section: 'test-prep',
  title: 'Підготовка до контрольної',
  lessons: [
    lesson(1, 'Привітання і кольори', [
      { type: 'learn', title: 'Вітаємося та знайомимося', rows: [['Hello! / Hi!', 'Привіт!'], ["I'm Tom. What's your name?", 'Я Том. Як тебе звати?'], ['How are you? — Fine, thank you.', 'Як справи? — Добре, дякую.'], ['Goodbye! / Bye!', 'До побачення! / Бувай!']], note: 'I’m = I am. Щоб назвати себе, кажемо I’m + ім’я.' },
      { type: 'learn', title: 'Кольори й числа від 1 до 10', rows: [['black / white / grey', 'чорний / білий / сірий'], ['red / orange / yellow', 'червоний / помаранчевий / жовтий'], ['green / blue / purple / pink / brown', 'зелений / синій / фіолетовий / рожевий / коричневий'], ['one / two / three / four / five', 'один / два / три / чотири / п’ять'], ['six / seven / eight / nine / ten', 'шість / сім / вісім / дев’ять / десять'], ['My favourite colour is green.', 'Мій улюблений колір — зелений.']], note: 'Purple пишемо з двома p: pur-ple.' },
      { type: 'order', explain: "Щоб спитати ім’я, кажемо What’s your name?", prompt: 'Склади запитання до нового друга: «Як тебе звати?»', tokens: ['your', 'What\'s', 'name?', 'How'], answer: ['What\'s', 'your', 'name?'], speak: true },
      { type: 'choice', explain: "На How are you? відповідь Fine, thank you означає «Добре, дякую».", prompt: 'Тобі кажуть: «How are you?» Що відповіси, якщо все добре?', options: ['Fine, thank you.', 'Goodbye.', 'What\'s your name?'], answer: 'Fine, thank you.', speak: true },
      { type: 'match', explain: "Hello і Hi — привітання; Goodbye і Bye — прощання.", pairs: [['Hello!', 'Привіт!'], ['Goodbye!', 'До побачення!'], ['Hi, I\'m Tom.', 'Привіт, я Том.'], ['Bye!', 'Бувай!']], speak: true },
      { type: 'fill', explain: "I’m — скорочення від I am, тобто «я є».", prompt: 'Hi, ___ Vlad. (Привіт, я Влад.)', answer: 'I\'m', accept: ['I am'], speak: true },
      { type: 'match', explain: "Purple — фіолетовий, grey — сірий, brown — коричневий, pink — рожевий.", pairs: [['purple', 'фіолетовий'], ['grey', 'сірий'], ['brown', 'коричневий'], ['pink', 'рожевий']], speak: true },
      { type: 'type', explain: "Жовтий англійською — yellow: y-e-l-l-o-w.", prompt: 'Напиши англійською: жовтий.', answer: 'yellow', speak: true },
      { type: 'fill', explain: "У слові purple після r стоїть p: pur-ple.", prompt: 'Допиши назву фіолетового кольору: PUR_LE', answer: 'P', speak: true },
      { type: 'choice', explain: "Зелений англійською — green.", prompt: 'Мій улюблений колір — зелений. Доповни: «My favourite colour is ...»', options: ['green', 'red', 'blue'], answer: 'green', speak: true },
      { type: 'match', explain: "Two — 2, four — 4, six — 6, eight — 8.", pairs: [['2', 'two'], ['4', 'four'], ['6', 'six'], ['8', 'eight']], speak: true },
      { type: 'type', explain: "Число 7 англійською — seven.", prompt: 'Напиши англійською число 7.', answer: 'seven', speak: true },
      { type: 'choice', explain: "Ten означає число 10.", prompt: 'Яке слово означає число 10?', options: ['ten', 'one', 'three'], answer: 'ten', speak: true },
      { type: 'match', explain: "Black — чорний, white — білий, orange — помаранчевий, blue — синій.", pairs: [['black', 'чорний'], ['white', 'білий'], ['orange', 'помаранчевий'], ['blue', 'синій']], speak: true },
    ]),
    lesson(2, 'Have got / has got', [
      { type: 'learn', title: 'Хто має? Have got чи has got', rows: [["I / you / we / they have got (’ve got)", 'я / ти / ми / вони маємо'], ["he / she / it has got (’s got)", 'він / вона / воно має'], ["We haven’t got a doll.", 'Ми не маємо ляльки.'], ["She hasn’t got a cat.", 'Вона не має кота.']], note: 'Для he, she, it вживаємо has; для I, you, we, they — have.' },
      { type: 'learn', title: 'Запитання, відповіді й опис', rows: [['Have we got toys? — Yes, we have. / No, we haven’t.', 'Чи маємо ми іграшки? — Так. / Ні.'], ['Has she got a cat? — Yes, she has. / No, she hasn’t.', 'Чи має вона кота? — Так. / Ні.'], ['straight hair / curly hair / long hair', 'пряме / кучеряве / довге волосся'], ['pretty / ugly', 'красивий / бридкий (негарний)']], note: 'У запитанні ставимо Have або Has на початок; у короткій відповіді got не повторюємо.' },
      { type: 'choice', explain: "He — це «він», тому has got.", prompt: 'Яке слово потрібне: «He ___ got a dog»?', options: ['has', 'have', 'can'], answer: 'has', speak: true },
      { type: 'fill', explain: "We — це «ми», тому заперечення haven’t got.", prompt: 'We ___ a doll. (У нас немає ляльки.)', answer: 'haven\'t got', accept: ['have not got'], speak: true },
      { type: 'order', explain: "She — це «вона»: запитання починаємо з Has.", prompt: 'Склади запитання: «Чи має вона кота?»', tokens: ['a cat?', 'she', 'Has', 'got', 'Have'], answer: ['Has', 'she', 'got', 'a cat?'], speak: true },
      { type: 'choice', explain: "На Has she...? ствердна коротка відповідь — Yes, she has.", prompt: 'Вона має кота. Дай коротку відповідь на «Has she got a cat?»', options: ['Yes, she has.', 'Yes, she have.', 'No, she hasn\'t.'], answer: 'Yes, she has.', speak: true },
      { type: 'choice', explain: "На Have we...? заперечна коротка відповідь — No, we haven’t.", prompt: 'У нас немає іграшок. Як відповісти на «Have we got toys?»', options: ['No, we haven\'t.', 'No, we hasn\'t.', 'Yes, we have.'], answer: 'No, we haven\'t.', speak: true },
      { type: 'type', explain: "She — це «вона», тому has got.", prompt: 'Напиши англійською: «Вона має ляльку.»', answer: 'She has got a doll', accept: ["She's got a doll"], speak: true },
      { type: 'type', explain: "They — це «вони», тому have got.", prompt: 'Напиши англійською: «Вони мають іграшки.»', answer: 'They have got toys', accept: ["They've got toys"], speak: true },
      { type: 'type', explain: "He — це «він», тому has got.", prompt: 'Переклади: «Він має м\'яч.»', answer: 'He has got a ball', accept: ["He's got a ball"], speak: true },
      { type: 'fill', explain: "He — це «він», тому заперечення hasn’t got.", prompt: 'He ___ a basketball. (Він не має баскетбольного м\'яча.)', answer: 'hasn\'t got', accept: ['has not got'], speak: true },
      { type: 'match', explain: "Straight — пряме, curly — кучеряве, long — довге волосся.", pairs: [['straight hair', 'пряме волосся'], ['curly hair', 'кучеряве волосся'], ['long hair', 'довге волосся'], ['pretty', 'красивий'], ['ugly', 'бридкий']], speak: true },
      { type: 'choice', explain: "She — це «вона», тому has got; curly — кучеряве.", prompt: 'Як сказати: «Вона має довге кучеряве волосся»?', options: ['She has got long curly hair.', 'She have got long curly hair.', 'She has got straight hair.'], answer: 'She has got long curly hair.', speak: true },
      { type: 'order', explain: "We — це «ми»: запитання починаємо з Have.", prompt: 'Склади запитання: «Чи маємо ми сім\'ю?»', tokens: ['got', 'we', 'a family?', 'Have', 'Has'], answer: ['Have', 'we', 'got', 'a family?'], speak: true },
    ]),
    lesson(3, 'Повторення: can / can\'t', [
      { type: 'learn', title: 'Речі та дії', rows: [['shells / puzzles / teddy bears', 'мушлі / пазли / плюшеві ведмедики'], ['do karate / play basketball', 'займатися карате / грати в баскетбол'], ['sing / dance / paint / dive', 'співати / танцювати / малювати фарбами / пірнати']] },
      { type: 'learn', title: 'Can — вмію, can’t — не вмію', rows: [['We can paint. / We can’t paint.', 'Ми вміємо / не вміємо малювати фарбами.'], ['She can dance. / She can’t dive.', 'Вона вміє танцювати / не вміє пірнати.'], ['Can you sing?', 'Чи вмієш ти співати?'], ['Yes, I can. / No, I can’t.', 'Так, вмію. / Ні, не вмію.']], note: 'Після can і can’t дію пишемо без змін: can sing, can paint.' },
      { type: 'match', explain: "Shells — мушлі, puzzles — пазли, teddy bears — плюшеві ведмедики.", pairs: [['shells', 'мушлі'], ['puzzles', 'пазли'], ['teddy bears', 'плюшеві ведмедики']], speak: true },
      { type: 'choice', explain: "Do karate означає «займатися карате».", prompt: 'Яка дія означає «займатися карате»?', options: ['do karate', 'play basketball', 'dive'], answer: 'do karate', speak: true },
      { type: 'match', explain: "Sing — співати, dance — танцювати, paint — малювати, dive — пірнати.", pairs: [['sing', 'співати'], ['dance', 'танцювати'], ['paint', 'малювати фарбами'], ['dive', 'пірнати']], speak: true },
      { type: 'order', explain: "Can означає «вміємо»; після нього дію пишемо без змін.", prompt: 'Склади речення: «Ми вміємо малювати фарбами.»', tokens: ['paint', 'We', 'can', 'can\'t'], answer: ['We', 'can', 'paint'], speak: true },
      { type: 'fill', explain: "Can’t означає «не вміє»; після нього пишемо dive.", prompt: 'She ___ dive. (Вона не вміє пірнати.)', answer: 'can\'t', accept: ['cannot'], speak: true },
      { type: 'choice', explain: "Щоб спитати про вміння, ставимо Can на початок: Can you sing?", prompt: 'Яке запитання означає «Чи вмієш ти співати?»', options: ['Can you sing?', 'Can he sing?', 'Have you got a song?'], answer: 'Can you sing?', speak: true },
      { type: 'type', explain: "На Can you dive? заперечна коротка відповідь — No, I can’t.", prompt: 'Ти не вмієш пірнати. Дай коротку відповідь на «Can you dive?»', answer: 'No, I can\'t', accept: ['No, I cannot'], speak: true },
      { type: 'fill', explain: "Can означає «вміє»; He can play basketball.", prompt: 'He ___ play basketball. (Він уміє грати в баскетбол.)', answer: 'can', speak: true },
      { type: 'order', explain: "У запитанні Can стоїть перед she.", prompt: 'Склади запитання: «Чи вміє вона танцювати?»', tokens: ['dance?', 'she', 'Can', 'can'], answer: ['Can', 'she', 'dance?'], speak: true },
      { type: 'choice', explain: "They can sing означає «Вони вміють співати».", prompt: 'Вони вміють співати. Вибери правильне речення.', options: ['They can sing.', 'They can\'t sing.', 'They has sing.'], answer: 'They can sing.', speak: true },
      { type: 'type', explain: "Для «не вміє» вживаємо can’t: He can’t dive.", prompt: 'Напиши англійською: «Він не вміє пірнати.»', answer: 'He can\'t dive', accept: ['He cannot dive'], speak: true },
    ]),
    lesson(4, 'Повторення: дати й числа', [
      { type: 'learn', title: 'День, число та місяць', rows: [['Monday / Tuesday / Wednesday / Thursday', 'понеділок / вівторок / середа / четвер'], ['Friday / Saturday / Sunday', 'п’ятниця / субота / неділя'], ['January / May / September / December', 'січень / травень / вересень / грудень'], ['Tuesday, the 22nd of September', 'Вівторок, 22 вересня'], ['first / second / third / fifth', 'перший / другий / третій / п’ятий'], ['eighth / ninth / twelfth / twentieth', 'восьмий / дев’ятий / дванадцятий / двадцятий']], note: 'У даті: день тижня, the + порядкове число + of + місяць. День і місяць — з великої літери.' },
      { type: 'learn', title: 'Числа словами та слова в зошиті', rows: [['ten / eleven / twelve', '10 / 11 / 12'], ['thirteen / fourteen / fifteen', '13 / 14 / 15'], ['sixteen / seventeen / eighteen / nineteen', '16 / 17 / 18 / 19'], ['thirteen / thirty', '13 / 30'], ['twenty / thirty / forty / fifty', '20 / 30 / 40 / 50'], ['sixty / seventy / eighty / ninety', '60 / 70 / 80 / 90'], ['thirty-two / forty-five', '32 / 45'], ['Classwork / Homework', 'класна робота / домашня робота'], ['Ex. / P.', 'вправа / сторінка']], note: 'Forty пишемо без u. Між десятками й одиницями ставимо дефіс: thirty-two.' },
      { type: 'match', explain: "Monday — понеділок, Thursday — четвер, Saturday — субота, Sunday — неділя.", pairs: [['Monday', 'понеділок'], ['Thursday', 'четвер'], ['Saturday', 'субота'], ['Sunday', 'неділя']], speak: true },
      { type: 'match', explain: "January — січень, May — травень, September — вересень, December — грудень.", pairs: [['January', 'січень'], ['May', 'травень'], ['September', 'вересень'], ['December', 'грудень']], speak: true },
      { type: 'match', explain: "1st — first, 5th — fifth, 12th — twelfth, 20th — twentieth, 30th — thirtieth.", pairs: [['1st', 'the first'], ['5th', 'the fifth'], ['12th', 'the twelfth'], ['20th', 'the twentieth'], ['30th', 'the thirtieth']], speak: true },
      { type: 'type', explain: "Дванадцятий — twelfth: у слові є f, а не ve.", prompt: 'Напиши англійською словами: «дванадцятий».', answer: 'the twelfth', accept: ['twelfth'], speak: true },
      { type: 'order', explain: "Порядок дати: день, the + число + of + місяць.", prompt: 'Склади рядок дати: вівторок, 22 вересня.', tokens: ['22nd', 'September', 'of', 'Tuesday,', 'the'], answer: ['Tuesday,', 'the', '22nd', 'of', 'September'], speak: true },
      { type: 'fill', explain: "Між числом і місяцем у даті пишемо of.", prompt: 'Friday, the 18th ___ September', answer: 'of', speak: true },
      { type: 'match', explain: "Classwork — класна робота, Homework — домашня, Ex. — вправа, P. — сторінка.", pairs: [['Classwork', 'класна робота'], ['Homework', 'домашня робота'], ['Ex.', 'вправа'], ['P.', 'сторінка']], speak: true },
      { type: 'match', explain: "32 — thirty-two; 45 — forty-five; 67 — sixty-seven; 86 — eighty-six.", pairs: [['32', 'thirty-two'], ['45', 'forty-five'], ['67', 'sixty-seven'], ['86', 'eighty-six']], speak: true },
      { type: 'type', explain: "Forty пишемо без літери u.", prompt: 'Напиши англійською число 40.', answer: 'forty', speak: true },
      { type: 'choice', explain: "Thirteen — 13; thirty — 30.", prompt: 'Яке число означає «thirteen»?', options: ['13', '30', '3'], answer: '13', speak: true },
      { type: 'type', explain: "У числі 76 між десятками й одиницями ставимо дефіс: seventy-six.", prompt: 'Напиши англійською число 76.', answer: 'seventy-six', accept: ['seventy six'], speak: true },
      { type: 'choice', explain: "Третє число — third, тому 3rd; у даті потрібні the та of.", prompt: 'Вибери правильний запис: «четвер, 3 вересня».', options: ['Thursday, the 3rd of September', 'Thursday, the 3th of September', 'Thursday the 3rd September'], answer: 'Thursday, the 3rd of September', speak: true },
    ]),
    lesson(5, 'Контрольна-тренування', [
      { type: 'type', explain: "У даті ставимо день, the + порядкове число + of + місяць.", prompt: 'Запиши англійською рядок дати: «п\'ятниця, 11 вересня».', answer: 'Friday, the 11th of September', accept: ['Friday the 11th of September', 'Friday, the eleventh of September', 'Friday the eleventh of September'], speak: true },
      { type: 'type', explain: "45 — forty-five; forty пишемо без u, між частинами — дефіс.", prompt: 'Запиши число 45 англійською словами.', answer: 'forty-five', accept: ['forty five'], speak: true },
      { type: 'type', explain: "Кучеряве волосся — curly hair.", prompt: 'Переклади англійською: «кучеряве волосся».', answer: 'curly hair', speak: true },
      { type: 'choice', explain: "She — це «вона», тому has got.", prompt: 'Вибери слово: «She ___ got a pretty doll».', options: ['has', 'have', 'can'], answer: 'has', speak: true },
      { type: 'fill', explain: "Can’t означає «не вміємо»; після нього дія без змін.", prompt: 'We ___ paint. (Ми не вміємо малювати фарбами.)', answer: 'can\'t', accept: ['cannot'], speak: true },
      { type: 'type', explain: "На Can you sing? ствердна коротка відповідь — Yes, I can.", prompt: 'Ти вмієш співати. Відповідай коротко на «Can you sing?»', answer: 'Yes, I can', speak: true },
      { type: 'order', explain: "Привітання Hi, далі I’m + ім’я: Hi, I’m Tom.", prompt: 'Склади відповідь Тома, коли він вітається і називає себе.', tokens: ['Tom.', 'I\'m', 'Hi,', 'Bye,'], answer: ['Hi,', 'I\'m', 'Tom.'], speak: true },
      { type: 'choice', explain: "Bye! означає «Бувай!» — так прощаємося.", prompt: 'Що сказати на прощання?', options: ['Bye!', 'How are you?', 'Hi!'], answer: 'Bye!', speak: true },
      { type: 'fill', explain: "Фіолетовий англійською — purple.", prompt: 'My favourite colour is ___. (Мій улюблений колір — фіолетовий.)', answer: 'purple', speak: true },
      { type: 'match', explain: "One — 1, three — 3, five — 5, nine — 9.", pairs: [['1', 'one'], ['3', 'three'], ['5', 'five'], ['9', 'nine']], speak: true },
      { type: 'order', explain: "He — це «він», тому has got.", prompt: 'Склади речення: «Він має собаку.»', tokens: ['a dog.', 'He', 'has got', 'have got'], answer: ['He', 'has got', 'a dog.'], speak: true },
      { type: 'fill', explain: "She — це «вона», тому заперечення hasn’t got.", prompt: 'She ___ a cat. (Вона не має кота.)', answer: 'hasn\'t got', accept: ['has not got'], speak: true },
      { type: 'choice', explain: "Teddy bears — плюшеві ведмедики.", prompt: 'Яке слово означає «плюшеві ведмедики»?', options: ['teddy bears', 'shells', 'puzzles'], answer: 'teddy bears', speak: true },
      { type: 'type', explain: "Число 30 англійською — thirty.", prompt: 'Напиши англійською число 30.', answer: 'thirty', speak: true },
      { type: 'choice', explain: "Wednesday — середа.", prompt: 'Яке слово означає «середа»?', options: ['Wednesday', 'Thursday', 'Tuesday'], answer: 'Wednesday', speak: true },
    ]),
  ],
};

export default testPrepSection;
