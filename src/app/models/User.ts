// import { Models } from 'appwrite';
import { Models } from 'src/app/extras/sdk/src';
import { Language } from './Language';
import { Streak } from './Streaks';

export type User = Models.Document & {
  name: string;
  country: string;
  countyCode: string;
  gender: string;
  birthdate: Date;
  languageArray?: string[];
  badges?: string[];
  languages?: Language[];
  aboutMe?: string;
  lastSeen?: Date;
  totalUnseen?: number;
  totalUnseenArchived?: number;
  notifications?: string[];
  notificationsArray?: string[];
  blockedUsers?: string[];
  archivedRooms?: string[];
  privacy?: string[];
  contributors?: string[];
  sponsor: boolean;
  streaks?: Streak;
  profilePic?: string;
  otherPics?: string[];
};
