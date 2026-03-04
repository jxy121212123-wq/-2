export interface DailyLog {
  id?: number;
  date: string;
  food: string;
  foodOption?: string;
  exercise: string;
  exerciseOption?: string;
  feeling: string;
  feelingNote?: string;
  feedback: string;
}

export interface WeightLog {
  id?: number;
  date: string;
  weight: number;
}

export type AnimalType = 'cat' | 'dog' | 'rabbit' | 'bear' | 'panda' | 'fox';
export type PersonalityType = 'strict' | 'happy' | 'gentle' | 'tsundere';

export interface CompanionConfig {
  animal: AnimalType;
  personality: PersonalityType;
  weightFrequency: number; // 1, 3, 7, 15
}

export const FEELINGS = [
  { label: '太爽了', icon: '🔥', value: 'awesome', color: 'bg-orange-100' },
  { label: '元气满满', icon: '✨', value: 'energetic', color: 'bg-yellow-100' },
  { label: '大满足', icon: '😋', value: 'satisfied', color: 'bg-pink-100' },
  { label: '成就感', icon: '🏆', value: 'accomplished', color: 'bg-purple-100' },
  { label: '平常心', icon: '🍃', value: 'calm', color: 'bg-green-100' },
  { label: '有点累', icon: '😫', value: 'tired', color: 'bg-blue-100' },
  { label: '负罪感', icon: '🍰', value: 'guilty', color: 'bg-gray-100' },
  { label: '想放弃', icon: '🏳️', value: 'giving_up', color: 'bg-slate-200' }
];

export const EXERCISE_OPTIONS = [
  { label: '有运动', icon: '🏃', value: 'active' },
  { label: '随便走走', icon: '🚶', value: 'light' },
  { label: '完全没动', icon: '🛌', value: 'none' }
];

export const FOOD_OPTIONS = [
  { label: '很清淡', icon: '🥗', value: 'clean' },
  { label: '正常吃', icon: '🍱', value: 'normal' },
  { label: '有点放飞', icon: '🍰', value: 'cheat' }
];

export const ANIMAL_DATA: Record<AnimalType, { icon: string, name: string }> = {
  cat: { icon: '🐱', name: '喵喵教练' },
  dog: { icon: '🐶', name: '汪汪教练' },
  rabbit: { icon: '🐰', name: '兔兔教练' },
  bear: { icon: '🐻', name: '熊熊教练' },
  panda: { icon: '🐼', name: '团团教练' },
  fox: { icon: '🦊', name: '狐狐教练' }
};
