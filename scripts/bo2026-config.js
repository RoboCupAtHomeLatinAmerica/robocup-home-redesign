// Dados da competição bo2026 (Brazil Open 2026, João Pessoa), compartilhados pelos scripts
// setup-bo2026.js (emulador) e setup-bo2026-prod.js (projeto Firebase real).
// A agenda segue o Google Agenda do site (horário de Brasília): as 9 equipes rodam uma vez
// em cada prova (HRI, P&P, GPSR, DL) em cada um dos dias 25, 26 e 27/11.

// ── CONFIGURAÇÃO ────────────────────────────────────────────────────────────
export const COMP_ID = 'bo2026';
export const ARENA   = 'Arena 1';
// Árbitros que cobrem a arena: manhã = [0], tarde = [1]. Podem ser trocados por e-mails reais ao gerar os slots.
export const DEFAULT_REFEREES = ['arbitro1@local', 'arbitro2@local'];
export const DEFAULT_PIN = 'cbr2026';   // PIN do dashboard (TROQUE antes de usar em produção)

export const TEAMS = [
  {
    "tdp": "",
    "website": "",
    "country": "Brazil",
    "city": "Salvador",
    "name": "BahiaRT",
    "video": "",
    "institution": "University of the State of Bahia",
    "lat": -12.9714,
    "lng": -38.5014,
    "id": "30",
    "altNames": [],
    "parentTeams": [],
    "contact": ""
  },
  {
    "id": "cbr26-unip",
    "name": "UnipDroidians",
    "institution": "Universidade Paulista",
    "country": "Brazil",
    "city": "São José dos Campos",
    "lat": null,
    "lng": null,
    "website": "https://www.unipdroidians.com",
    "tdp": "",
    "video": "https://www.youtube.com/watch?v=-IOv1kArVSA",
    "contact": "",
    "altNames": [],
    "parentTeams": []
  },
  {
    "lng": -49.2733,
    "parentTeams": [],
    "institution": "Universidade Tecnológica Federal do Paraná",
    "video": "",
    "lat": -25.4284,
    "website": "https://github.com/UtBotsAtHome-UTFPR",
    "country": "Brazil",
    "id": "29",
    "contact": "",
    "name": "UTBots",
    "city": "Curitiba",
    "tdp": "",
    "altNames": []
  },
  {
    "contact": "",
    "parentTeams": [],
    "lat": -32.0346,
    "lng": -52.0986,
    "institution": "Universidade Federal do Rio Grande",
    "city": "Rio Grande",
    "id": "3",
    "tdp": "https://drive.google.com/open?id=1hSRVdKyajLkGcLWqaH8x-eK6uHhj2ef2",
    "name": "FBOT@Home",
    "country": "Brazil",
    "altNames": [],
    "website": "https://fbotwork.vercel.app/Fbothome",
    "video": ""
  },
  {
    "contact": "",
    "video": "https://youtu.be/CVDv0-60MxE",
    "tdp": "",
    "country": "Brazil",
    "altNames": [],
    "lng": null,
    "institution": "Universidade de São Paulo (USP)",
    "website": "https://wr.sc.usp.br/",
    "name": "Warthog@Home",
    "id": "89",
    "parentTeams": [],
    "city": "São Carlos",
    "lat": null
  },
  {
    "id": "cbr26-atena",
    "name": "ATENA",
    "institution": "USP",
    "country": "Brazil",
    "city": "",
    "lat": null,
    "lng": null,
    "website": "https://semear-remy.squarespace.com",
    "tdp": "",
    "video": "https://www.youtube.com/watch?v=3LlnOSIbcgI&t=1s",
    "contact": "",
    "altNames": [],
    "parentTeams": []
  },
  {
    "name": "Pequi Mecânico",
    "video": "",
    "city": "Goiânia",
    "id": "27",
    "tdp": "https://drive.google.com/file/d/1oPD8RCyi1rI-K8LdEFmV6zQMXUdSQD4U/view?usp=drive_link",
    "country": "Brazil",
    "website": "https://pequi-mecanico-home.github.io/",
    "parentTeams": [],
    "lng": -47.872,
    "contact": "",
    "altNames": [],
    "institution": "Universidade Federal de Goiás",
    "lat": -15.7654
  },
  {
    "id": "cbr26-robotecos",
    "name": "Robotecos",
    "institution": "Robotec",
    "country": "Brazil",
    "city": "",
    "lat": null,
    "lng": null,
    "website": "https://www.robotecsolutions.com/",
    "tdp": "",
    "video": "https://youtu.be/z4xsmRBajPw",
    "contact": "",
    "altNames": [],
    "parentTeams": []
  },
  {
    "institution": "FEI University Center",
    "tdp": "https://drive.google.com/open?id=142QxYnoy0nZHZ5Fxw_5MweOL3Er3S9Z7",
    "parentTeams": [],
    "video": "",
    "website": "https://fei.edu.br/robofei/athome/",
    "country": "Brazil",
    "altNames": [],
    "id": "7",
    "lat": -23.6978,
    "contact": "",
    "city": "São Bernardo do Campo",
    "lng": -46.5659,
    "name": "RoboFEI@Home"
  }
];

// Em cada prova, TODAS as equipes rodam uma vez por dia (25, 26 e 27/11).
export const slotTeams = list => list.map((t, i) => ({ teamId: t.id, teamName: t.name, order: i + 1 }));

// Provas dos dias 25, 26 e 27/11 (horário de Brasília). A ordem das equipes gira de dia em dia e de prova em prova.
const DAYS = ['2026-11-25', '2026-11-26', '2026-11-27'];
const TEST_BLOCKS = [
  { testId: 'hri_challenge',  times: ['09:00', '09:00', '09:00'] },
  { testId: 'pick_and_place', times: ['10:30', '10:30', '10:30'] },
  { testId: 'gpsr',           times: ['14:00', '14:00', '14:00'] },
  { testId: 'doing_laundry',  times: ['17:30', '15:30', '15:30'] },
];
const rotate = (list, k) => [...list.slice(k), ...list.slice(0, k)];

export function buildSlots(REFEREES = DEFAULT_REFEREES) {
  const refereeFor = time => (time < '13:00' ? REFEREES[0] : REFEREES[1]);
  const slots = [];
  const all = slotTeams(TEAMS);
  // 24/11: mapeamento da arena, inspeção e sessão de pôsteres
  slots.push({ type: 'mapping',    testId: null, label: 'Arena Mapping', date: '2026-11-24', time: '09:00', durationMinutes: 300, teams: all, referee: '' });
  slots.push({ type: 'inspection', testId: null, label: null, date: '2026-11-24', time: '17:00', durationMinutes: 60, teams: all, referee: REFEREES[1] });
  slots.push({ type: 'poster',     testId: null, label: null, date: '2026-11-24', time: '18:00', durationMinutes: 60, teams: all, referee: '' });
  // 25–27/11: HRI, Pick & Place, GPSR e Doing Laundry (as 9 equipes em cada dia; ~7 min cada, cabe no bloco de 90 min)
  TEST_BLOCKS.forEach((b, t) => DAYS.forEach((date, d) => {
    const time = b.times[d];
    slots.push({ type: 'test', testId: b.testId, label: null, date, time, durationMinutes: 90,
                 teams: slotTeams(rotate(TEAMS, (d * 3 + t) % TEAMS.length)), referee: refereeFor(time) });
  }));
  // 28/11: Restaurant (todas as equipes); 29/11: Finals (finalistas definidos pelo ranking)
  slots.push({ type: 'test', testId: 'restaurant', label: null, date: '2026-11-28', time: '14:00', durationMinutes: 180, teams: all, referee: REFEREES[1] });
  slots.push({ type: 'test', testId: 'finals',     label: null, date: '2026-11-29', time: '11:00', durationMinutes: 60,  teams: [],  referee: REFEREES[0] });
  return slots.map(s => ({ arena: ARENA, league: 'OPL', status: 'pending', ...s }));
}

export const COMP = (pin = DEFAULT_PIN) => ({
  id: COMP_ID, name: 'RoboCup@Home Brazil Open 2026', year: 2026,
  city: 'João Pessoa', country: 'Brazil', timezone: 'America/Sao_Paulo',
  startDate: '2026-11-23', endDate: '2026-11-29',
  active: true, adminCreated: true, arenas: [ARENA], refereePin: pin,
  finalResultSecs: 10, publicScoresheets: true, showResultsQr: true,
  participatingTeams: TEAMS.map(t => ({ teamId: t.id, teamName: t.name })),
});
