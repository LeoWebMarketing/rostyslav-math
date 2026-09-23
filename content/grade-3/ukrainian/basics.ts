import { Section } from '../../schema';

export const ukrainianBasicsSection: Section = {
  id: 'g3-ukrainian-basics',
  grade: 3,
  subject: 'ukrainian',
  section: 'basics',
  title: 'Голосні та приголосні',
  draft: true,
  lessons: [
    {
      id: 'g3-ua-vowels',
      title: 'Голосні звуки',
      exercises: [
        { id: 'e-vowels-01', type: 'choice', prompt: 'Який звук голосний?', options: ['м', 'а', 'к'], answer: 'а' },
        { id: 'e-vowels-02', type: 'choice', prompt: 'Виберіть голосний:', options: ['б', 'е', 'р'], answer: 'е' },
        { id: 'e-vowels-03', type: 'match', pairs: [['а', 'голосний'], ['м', 'приголосний'], ['и', 'голосний']] },
        { id: 'e-vowels-04', type: 'choice', prompt: 'Яка буква голосна?', options: ['с', 'о', 'п'], answer: 'о' },
        { id: 'e-vowels-05', type: 'choice', prompt: 'Який з цих звуків голосний?', options: ['н', 'у', 'д'], answer: 'у' },
        { id: 'e-vowels-06', type: 'fill', prompt: 'Буква ___ — голосна', answer: 'і', options: ['і', 'л', 'р'] },
        { id: 'e-vowels-07', type: 'choice', prompt: 'Голосний звук:', options: ['г', 'ю', 'х'], answer: 'ю' },
        { id: 'e-vowels-08', type: 'type', prompt: 'Напиши перший голосний звук: яблуко', answer: 'я' },
      ],
    },
    {
      id: 'g3-ua-stress',
      title: 'Наголос',
      exercises: [
        { id: 'e-stress-01', type: 'choice', prompt: 'Де наголос: МА|ма?', options: ['МА', 'ма'], answer: 'МА' },
        { id: 'e-stress-02', type: 'choice', prompt: 'Де наголос: ма|НА?', options: ['ма', 'НА'], answer: 'НА' },
        { id: 'e-stress-03', type: 'type', prompt: 'На яку букву наголос у слові "МОЛОКО"?', answer: 'о' },
        { id: 'e-stress-04', type: 'choice', prompt: 'На яку букву наголос у "КНИГА"?', options: ['и', 'а'], answer: 'и' },
        { id: 'e-stress-05', type: 'fill', prompt: 'У слові "олів___" наголос на другий звук', answer: 'ець', options: ['ець', 'ак', 'од'] },
        { id: 'e-stress-06', type: 'choice', prompt: 'Де наголос: ка|РА|дель?', options: ['ка', 'РА', 'дель'], answer: 'РА' },
        { id: 'e-stress-07', type: 'type', prompt: 'На яку букву наголос у "СОНЦЕ"?', answer: 'о' },
        { id: 'e-stress-08', type: 'choice', prompt: 'Наголос у слові:', options: ['рука', 'МАМА', 'мир'], answer: 'МАМА' },
      ],
    },
  ],
};
