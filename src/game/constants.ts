import Phaser from 'phaser';

export const GAME_CONFIG = {
  width: 1280,
  height: 720,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 1000 },
      debug: false
    }
  }
};

export enum WeaponType {
  PISTOL = 'pistol',
  RIFLE = 'rifle',
  SNIPER = 'sniper',
  SHOTGUN = 'shotgun',
  ROCKET = 'rocket'
}

export interface WeaponStats {
  damage: number;
  fireRate: number;
  bulletSpeed: number;
  ammoMax: number;
  recoil: number;
}

export const WEAPON_DATA: Record<WeaponType, WeaponStats> = {
  [WeaponType.PISTOL]: { damage: 15, fireRate: 400, bulletSpeed: 800, ammoMax: 12, recoil: 2 },
  [WeaponType.RIFLE]: { damage: 10, fireRate: 150, bulletSpeed: 1000, ammoMax: 30, recoil: 5 },
  [WeaponType.SNIPER]: { damage: 80, fireRate: 1500, bulletSpeed: 2000, ammoMax: 5, recoil: 20 },
  [WeaponType.SHOTGUN]: { damage: 12, fireRate: 800, bulletSpeed: 600, ammoMax: 8, recoil: 15 },
  [WeaponType.ROCKET]: { damage: 100, fireRate: 2000, bulletSpeed: 400, ammoMax: 3, recoil: 25 },
};
