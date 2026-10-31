import type {TemplateCategory} from './setup.ts';

export const TASK_ICON_IDS=['sparkles','vacuum','dishes','laundry','plant','bath','trash','broom','spray','window','bed','sofa','fridge','cooking','shopping','pets','shower','toilet','tools'] as const;
export type TaskIconId=typeof TASK_ICON_IDS[number];
export const TASK_ICON_LABELS:Record<TaskIconId,string>={sparkles:'Sterne',vacuum:'Staubsauger',dishes:'Geschirr',laundry:'Wäsche',plant:'Pflanzen',bath:'Bad',trash:'Müll',broom:'Besen',spray:'Sprühflasche',window:'Fenster',bed:'Bett',sofa:'Sofa',fridge:'Kühlschrank',cooking:'Kochen',shopping:'Einkauf',pets:'Haustiere',shower:'Dusche',toilet:'Toilette',tools:'Werkzeug'};
export const TASK_ICON_CATEGORIES:Partial<Record<TaskIconId,TemplateCategory>>={vacuum:'tidy',dishes:'kitchen',laundry:'laundry',plant:'plants',bath:'bath',trash:'household',broom:'tidy',spray:'tidy',window:'tidy',bed:'tidy',sofa:'tidy',fridge:'kitchen',cooking:'kitchen',shopping:'household',pets:'pets',shower:'bath',toilet:'bath',tools:'household'};
