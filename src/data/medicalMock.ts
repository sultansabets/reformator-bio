export interface MedicalSection {
  id: string;
  title: string;
  lastUpdated?: string;
  content: (
    | { type: "pdf"; url: string }
    | { type: "image"; url: string }
    | { type: "text"; text: string }
  )[];
}

export const medicalSections: MedicalSection[] = [
  {
    id: "analyses",
    title: "Результаты анализов",
    lastUpdated: "2026-02-20",
    content: [
      {
        type: "pdf",
        url: "/medical/analyses/blood-urine.pdf"
      }
    ]
  },

  {
    id: "uzi",
    title: "УЗИ",
    lastUpdated: "2026-02-23",
    content: [
      {
        type: "image",
        url: "/medical/uzi/uzi1.jpg"
      },
      {
        type: "image",
        url: "/medical/uzi/uzi2.jpg"
      },
      {
        type: "image",
        url: "/medical/uzi/uzi3.jpg"
      },
      {
        type: "image",
        url: "/medical/uzi/uzi4.jpg"
      },
      {
        type: "image",
        url: "/medical/uzi/uzi5.jpg"
      },

      {
        type: "text",
        text: `
Дата исследования: 23.02.2026

Щитовидная железа:
Левая доля: 2,4 × 2,0 см
Правая доля: 2,3 × 2,2 см
Эхогенность: однородная

Печень:
Размеры: 17,8 × 16,0 см
Структура: однородная
Эхогенность: диффузно повышена

Желчный пузырь:
Стенка не утолщена
Застоя желчи нет

Почки:
Без патологий

Предстательная железа:
Объем 18 см³
Структура однородная

Заключение:
Патологических изменений не выявлено.
`
      }
    ]
  },

  {
    id: "main-doctor",
    title: "Главный врач",
    lastUpdated: "2026-02-22",
    content: [
      {
        type: "text",
        text: `
Общее состояние удовлетворительное.
Клинически значимых отклонений не выявлено.
Рекомендовано динамическое наблюдение, контроль массы тела и метаболических показателей.
`
      }
    ]
  },

  {
    id: "sport-doctor",
    title: "Спортивный врач",
    lastUpdated: "2026-02-21",
    content: [
      {
        type: "image",
        url: "/medical/sport/medass.jpg"
      },
      {
        type: "text",
        text: `
Биоимпеданс показал выраженный избыток жировой массы при хорошо развитой мышечной системе.
Рекомендовано снижение веса до 95–100 кг с сохранением мышечной массы.
`
      }
    ]
  },

  {
    id: "rehab",
    title: "Реабилитолог",
    lastUpdated: "2026-02-19",
    content: [
      {
        type: "text",
        text: `
Опорно-двигательный аппарат без выраженных нарушений.
Рекомендованы силовые тренировки с контролем техники, работа с осанкой и мобильностью тазобедренных суставов.
`
      }
    ]
  },

  {
    id: "psychotherapist",
    title: "Психотерапевт",
    lastUpdated: "2026-02-18",
    content: [
      {
        type: "text",
        text: `
Умеренно повышенная внутренняя напряжённость.
Выражены механизмы компенсации и рационализации.
Рекомендована работа с осознаванием эмоций и снижением уровня внутреннего контроля.
`
      }
    ]
  }
];

