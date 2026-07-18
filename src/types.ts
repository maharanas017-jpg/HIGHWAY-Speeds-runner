/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type EnvironmentType = 'jungle' | 'mountain' | 'city' | 'desert' | 'rainy' | 'night';

export interface CarConfig {
  id: string;
  name: string;
  price: number;
  color: string;
  secondaryColor: string;
  speed: number; // 1-10 stat
  handling: number; // 1-10 stat
  drift: number; // 1-10 stat
  description: string;
  isSpecial?: boolean;
}

export interface PowerUpConfig {
  id: string;
  name: string;
  price: number;
  description: string;
  icon: string;
  duration: number; // in seconds
}

export interface AchievementConfig {
  id: string;
  title: string;
  description: string;
  target: number;
  type: 'distance' | 'coins' | 'obstacles' | 'cars_unlocked' | 'score';
  reward: number; // coins
}

export interface AchievementProgress {
  id: string;
  current: number;
  completed: boolean;
  claimed: boolean;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  distance: number;
  car: string;
  date: string;
  isUser?: boolean;
}

export interface GameSettings {
  soundOn: boolean;
  musicOn: boolean;
  vibrationOn: boolean;
}

export interface PlayerStats {
  coins: number;
  gems: number;
  highScore: number;
  bestDistance: number;
  totalDistanceDriven: number;
  totalCoinsCollected: number;
  obstaclesAvoided: number;
  unlockedCars: string[];
  activeCar: string;
  inventory: {
    nitro: number;
    shield: number;
    coinBooster: number;
    magnet: number;
  };
  unlockedSkins: string[]; // for car skins
  lastDailyRewardClaimed: string | null; // Date string
  dailyRewardStreak: number;
}
