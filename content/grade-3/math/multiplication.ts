import { Section } from '../../schema';

export const multiplicationSection: Section = {
  id: 'g3-math-multiplication',
  grade: 3,
  subject: 'math',
  section: 'multiplication',
  title: 'Таблиця множення',
  draft: true,
  lessons: [
    {
      id: 'g3-math-mult-2',
      title: 'Множення на 2',
      exercises: [
        { id: 'e-mult2-01', type: 'choice', prompt: '2 × 3 = ?', options: ['4', '6', '8'], answer: '6' },
        { id: 'e-mult2-02', type: 'choice', prompt: '2 × 5 = ?', options: ['8', '10', '12'], answer: '10' },
        { id: 'e-mult2-03', type: 'choice', prompt: '2 × 7 = ?', options: ['12', '14', '16'], answer: '14' },
        { id: 'e-mult2-04', type: 'type', prompt: 'Напиши: 2 × 4 = ', answer: '8' },
        { id: 'e-mult2-05', type: 'type', prompt: 'Напиши: 2 × 6 = ', answer: '12' },
        { id: 'e-mult2-06', type: 'match', pairs: [['2 × 2', '4'], ['2 × 3', '6'], ['2 × 4', '8']] },
        { id: 'e-mult2-07', type: 'choice', prompt: '2 × 8 = ?', options: ['14', '16', '18'], answer: '16' },
        { id: 'e-mult2-08', type: 'type', prompt: 'Напиши: 2 × 9 = ', answer: '18' },
      ],
    },
    {
      id: 'g3-math-mult-3',
      title: 'Множення на 3',
      exercises: [
        { id: 'e-mult3-01', type: 'choice', prompt: '3 × 2 = ?', options: ['5', '6', '7'], answer: '6' },
        { id: 'e-mult3-02', type: 'choice', prompt: '3 × 4 = ?', options: ['10', '12', '14'], answer: '12' },
        { id: 'e-mult3-03', type: 'type', prompt: 'Напиши: 3 × 3 = ', answer: '9' },
        { id: 'e-mult3-04', type: 'type', prompt: 'Напиши: 3 × 5 = ', answer: '15' },
        { id: 'e-mult3-05', type: 'match', pairs: [['3 × 2', '6'], ['3 × 3', '9'], ['3 × 4', '12']] },
        { id: 'e-mult3-06', type: 'choice', prompt: '3 × 6 = ?', options: ['16', '18', '20'], answer: '18' },
        { id: 'e-mult3-07', type: 'choice', prompt: '3 × 7 = ?', options: ['20', '21', '22'], answer: '21' },
        { id: 'e-mult3-08', type: 'type', prompt: 'Напиши: 3 × 8 = ', answer: '24' },
      ],
    },
    {
      id: 'g3-math-mult-4',
      title: 'Множення на 4',
      exercises: [
        { id: 'e-mult4-01', type: 'choice', prompt: '4 × 2 = ?', options: ['6', '8', '10'], answer: '8' },
        { id: 'e-mult4-02', type: 'choice', prompt: '4 × 3 = ?', options: ['10', '12', '14'], answer: '12' },
        { id: 'e-mult4-03', type: 'type', prompt: 'Напиши: 4 × 4 = ', answer: '16' },
        { id: 'e-mult4-04', type: 'type', prompt: 'Напиши: 4 × 5 = ', answer: '20' },
        { id: 'e-mult4-05', type: 'match', pairs: [['4 × 2', '8'], ['4 × 3', '12'], ['4 × 4', '16']] },
        { id: 'e-mult4-06', type: 'choice', prompt: '4 × 6 = ?', options: ['20', '24', '28'], answer: '24' },
        { id: 'e-mult4-07', type: 'choice', prompt: '4 × 7 = ?', options: ['24', '28', '32'], answer: '28' },
        { id: 'e-mult4-08', type: 'type', prompt: 'Напиши: 4 × 8 = ', answer: '32' },
      ],
    },
    {
      id: 'g3-math-mult-5',
      title: 'Множення на 5',
      exercises: [
        { id: 'e-mult5-01', type: 'choice', prompt: '5 × 2 = ?', options: ['8', '10', '12'], answer: '10' },
        { id: 'e-mult5-02', type: 'choice', prompt: '5 × 3 = ?', options: ['12', '15', '18'], answer: '15' },
        { id: 'e-mult5-03', type: 'type', prompt: 'Напиши: 5 × 4 = ', answer: '20' },
        { id: 'e-mult5-04', type: 'type', prompt: 'Напиши: 5 × 5 = ', answer: '25' },
        { id: 'e-mult5-05', type: 'match', pairs: [['5 × 2', '10'], ['5 × 3', '15'], ['5 × 4', '20']] },
        { id: 'e-mult5-06', type: 'choice', prompt: '5 × 6 = ?', options: ['25', '30', '35'], answer: '30' },
        { id: 'e-mult5-07', type: 'choice', prompt: '5 × 7 = ?', options: ['30', '35', '40'], answer: '35' },
        { id: 'e-mult5-08', type: 'type', prompt: 'Напиши: 5 × 8 = ', answer: '40' },
      ],
    },
  ],
};
