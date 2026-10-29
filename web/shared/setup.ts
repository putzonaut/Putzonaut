export const HOUSEHOLD_TYPES = [
  { id: 'family', label: 'Familie', description: 'Große und kleine Putzonauten', placeholder: 'Zum Beispiel: Die Chaoscrew', goal: 24 },
  { id: 'couple', label: 'Zu zweit', description: 'Gemeinsam mehr Freizeit', placeholder: 'Zum Beispiel: Team Feierabend', goal: 14 },
  { id: 'shared', label: 'WG', description: 'Fair verteilt, zusammen geschafft', placeholder: 'Zum Beispiel: Galaktische WG', goal: 21 },
  { id: 'solo', label: 'Für mich', description: 'Dein Zuhause, dein Abenteuer', placeholder: 'Zum Beispiel: Meine Raumstation', goal: 7 },
] as const;
export type HouseholdKind = typeof HOUSEHOLD_TYPES[number]['id'];
export const TASK_TEMPLATES = [
  { key: 'vacuum', title: 'Staubsaugen', room: 'Wohnen', icon: 'vacuum', minutes: 15, xp: 60, stars: 20, cadence: 'daily' },
  { key: 'dishes', title: 'Spülmaschine einräumen', room: 'Küche', icon: 'dishes', minutes: 8, xp: 40, stars: 15, cadence: 'daily' },
  { key: 'laundry', title: 'Wäsche aufhängen', room: 'Haushalt', icon: 'laundry', minutes: 10, xp: 50, stars: 15, cadence: 'daily' },
  { key: 'plant', title: 'Pflanzen gießen', room: 'Wohnen', icon: 'plant', minutes: 5, xp: 25, stars: 10, cadence: 'weekly' },
  { key: 'bath', title: 'Bad zum Strahlen bringen', room: 'Bad', icon: 'bath', minutes: 20, xp: 80, stars: 25, cadence: 'weekly' },
  { key: 'trash', title: 'Müll rausbringen', room: 'Haushalt', icon: 'trash', minutes: 5, xp: 25, stars: 10, cadence: 'daily' },
] as const;
