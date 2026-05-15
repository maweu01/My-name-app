import Phaser from 'phaser';
import { io, Socket } from 'socket.io-client';
import { WeaponType, WEAPON_DATA } from './constants';

export default class MainScene extends Phaser.Scene {
  private socket?: Socket;
  private player?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private otherPlayers!: Phaser.Physics.Arcade.Group;
  private bullets!: Phaser.Physics.Arcade.Group;
  private bots!: Phaser.Physics.Arcade.Group;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private particles!: Phaser.GameObjects.Particles.ParticleEmitter;
  
  // Game State
  private health = 100;
  private fuel = 100;
  private ammo = 30;
  private currentWeapon: WeaponType = WeaponType.RIFLE;
  private lastFired = 0;
  private roomId = 'lobby-1';
  private kills = 0;

  constructor() {
    super('MainScene');
  }

  preload() {
    this.cameras.main.setBackgroundColor('#0f172a');
    
    // Create textures
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    
    // Player
    graphics.clear().fillStyle(0x3b82f6).fillRect(0, 0, 32, 48).generateTexture('player', 32, 48);
    // Other Player
    graphics.clear().fillStyle(0xef4444).fillRect(0, 0, 32, 48).generateTexture('otherPlayer', 32, 48);
    // Bot
    graphics.clear().fillStyle(0xf97316).fillRect(0, 0, 32, 48).generateTexture('bot', 32, 48);
    // Platform
    graphics.clear().fillStyle(0x334155).fillRect(0, 0, 100, 20).generateTexture('platform', 100, 20);
    // Bullet
    graphics.clear().fillStyle(0xfde047).fillRect(0, 0, 8, 4).generateTexture('bullet', 8, 4);
    // Crate
    graphics.clear().fillStyle(0x475569).fillRect(0, 0, 40, 40).generateTexture('crate', 40, 40);
    // Particle
    graphics.clear().fillStyle(0xffffff).fillRect(0, 0, 4, 4).generateTexture('particle', 4, 4);
  }

  create() {
    // 1. Initialize all groups immediately
    this.otherPlayers = this.physics.add.group();
    this.bullets = this.physics.add.group({ allowGravity: false });
    this.bots = this.physics.add.group();
    this.platforms = this.physics.add.staticGroup();

    // 2. Setup Map
    this.createMap();

    // 3. Setup Components
    this.setupParticles();
    this.setupPlayer();
    this.setupBots(3);
    this.setupControls();
    
    // 4. Start Networking ONLY after local setup is complete
    this.setupMultiplayer();
  }

  private createMap() {
    // Ground
    this.platforms.create(640, 710, 'platform').setScale(13, 1).refreshBody();
    
    // Layout
    const locations = [
      {x: 150, y: 450}, {x: 150, y: 300}, {x: 150, y: 150},
      {x: 1130, y: 450}, {x: 1130, y: 300}, {x: 1130, y: 150},
      {x: 640, y: 350}, {x: 500, y: 500}, {x: 780, y: 500}
    ];

    locations.forEach(loc => this.platforms.create(loc.x, loc.y, 'platform'));

    this.physics.add.collider(this.bullets, this.platforms, (obj1) => {
      const b = obj1 as any;
      this.createExplosion(b.x, b.y, 0x3b82f6);
      b.destroy();
    });
  }

  private setupPlayer() {
    this.player = this.physics.add.sprite(100, 450, 'player');
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.platforms);
  }

  private setupParticles() {
    this.particles = this.add.particles(0, 0, 'particle', {
      speed: { min: -100, max: 100 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      blendMode: 'ADD',
      lifespan: 600,
      active: false
    });
  }

  private createExplosion(x: number, y: number, color: number) {
    if (this.particles) {
      this.particles.setParticleTint(color);
      this.particles.explode(15, x, y);
    }
  }

  private setupBots(count: number) {
    for (let i = 0; i < count; i++) {
        const bot = this.physics.add.sprite(300 + (i * 250), 100, 'bot');
        this.bots.add(bot);
        bot.setCollideWorldBounds(true);
        this.physics.add.collider(bot, this.platforms);
        
        (bot as any).lastShot = 0;
        (bot as any).dir = 1;
    }

    this.physics.add.overlap(this.bullets, this.bots, (obj1, obj2) => {
        const b = obj1 as any;
        const target = obj2 as any;
        if (b.isLocal) {
            this.createExplosion(target.x, target.y, 0xf97316);
            target.destroy();
            b.destroy();
            this.kills++;
            this.events.emit('update-kills', this.kills);
        }
    });
  }

  private setupMultiplayer() {
    this.socket = io();

    this.socket.on('connect', () => {
      if (!this.player) return;
      this.socket?.emit('join-room', this.roomId, {
        x: this.player.x, y: this.player.y,
        health: this.health, weapon: this.currentWeapon
      });
    });

    this.socket.on('current-players', (players: any[]) => {
      if (!Array.isArray(players)) return;
      players.forEach(p => {
        if (p && p.id && p.id !== this.socket?.id) this.addOtherPlayer(p);
      });
    });

    this.socket.on('player-joined', (p: any) => {
      if (p && p.id && p.id !== this.socket?.id) this.addOtherPlayer(p);
    });

    this.socket.on('player-moved', (p: any) => {
      const remote = this.otherPlayers.getChildren().find((op: any) => op.id === p.id) as any;
      if (remote) {
        remote.setPosition(p.x, p.y);
        remote.setFlipX(p.flipX);
      }
    });

    this.socket.on('player-disconnected', (id: string) => {
      const remote = this.otherPlayers.getChildren().find((op: any) => op.id === id);
      if (remote) remote.destroy();
    });

    this.socket.on('bullet-fired', (data: any) => {
      if (data) this.fireBullet(data.x, data.y, data.angle, false);
    });

    this.socket.on('damage-applied', (data: any) => {
      if (data && data.targetId === this.socket?.id) this.takeDamage(data.damage);
    });
  }

  private addOtherPlayer(p: any) {
    const exists = this.otherPlayers.getChildren().some((op: any) => op.id === p.id);
    if (exists) return;

    const remote = this.physics.add.sprite(p.x, p.y, 'otherPlayer');
    (remote as any).id = p.id;
    this.otherPlayers.add(remote);
    this.physics.add.collider(remote, this.platforms);
  }

  private setupControls() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.handleShoot(pointer));
  }

  update(time: number) {
    if (!this.player || !this.player.active) return;

    const body = this.player.body;
    if (!body) return;

    // Movement
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-220);
      this.player.setFlipX(true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(220);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    if (this.cursors.up.isDown && body.touching.down) {
      this.player.setVelocityY(-550);
    }

    // Jetpack
    if (this.cursors.space.isDown && this.fuel > 0) {
      this.player.setVelocityY(-350);
      this.fuel = Math.max(0, this.fuel - 0.6);
      this.events.emit('update-fuel', this.fuel);
    } else if (this.fuel < 100) {
      this.fuel = Math.min(100, this.fuel + 0.25);
      this.events.emit('update-fuel', this.fuel);
    }

    // Network Sync
    if (this.socket) {
      this.socket.emit('player-movement', {
        x: this.player.x, y: this.player.y, flipX: this.player.flipX
      });
    }

    // Bots AI
    this.updateBots(time);
  }

  private updateBots(time: number) {
    this.bots.getChildren().forEach((b: any) => {
        if (!b.body) return;
        
        if (b.body.blocked.left) b.dir = 1;
        if (b.body.blocked.right) b.dir = -1;
        b.setVelocityX(120 * b.dir);
        b.setFlipX(b.dir === -1);

        if (this.player && this.player.active) {
            const dist = Phaser.Math.Distance.Between(b.x, b.y, this.player.x, this.player.y);
            if (dist < 450 && time - b.lastShot > 1200) {
                const angle = Phaser.Math.Angle.Between(b.x, b.y, this.player.x, this.player.y);
                this.fireBullet(b.x, b.y, angle, false);
                b.lastShot = time;
            }
        }
    });
  }

  private handleShoot(p: Phaser.Input.Pointer) {
    const now = this.time.now;
    const stats = WEAPON_DATA[this.currentWeapon];
    if (now - this.lastFired > stats.fireRate && this.ammo > 0 && this.player) {
      const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, p.worldX, p.worldY);
      this.fireBullet(this.player.x, this.player.y, angle, true);
      this.lastFired = now;
      this.ammo--;
      this.events.emit('update-ammo', this.ammo);
      this.socket?.emit('player-shoot', { x: this.player.x, y: this.player.y, angle });
    }
  }

  private fireBullet(x: number, y: number, angle: number, isLocal: boolean) {
    const bullet = this.physics.add.sprite(x, y, 'bullet');
    if (!bullet) return;
    
    this.bullets.add(bullet);
    const stats = WEAPON_DATA[this.currentWeapon];
    bullet.setVelocity(Math.cos(angle) * stats.bulletSpeed, Math.sin(angle) * stats.bulletSpeed);
    bullet.setRotation(angle);
    (bullet as any).isLocal = isLocal;

    if (isLocal) {
        this.physics.add.overlap(bullet, this.otherPlayers, (b, target: any) => {
            this.socket?.emit('player-hit', { targetId: target.id, damage: stats.damage, shooterId: this.socket.id });
            b.destroy();
        });
    } else {
        this.physics.add.overlap(bullet, this.player!, (b) => {
            b.destroy();
        });
    }

    this.time.delayedCall(1500, () => { if (bullet.active) bullet.destroy(); });
  }

  private takeDamage(amount: number) {
    this.health = Math.max(0, this.health - amount);
    this.events.emit('update-health', this.health);
    if (this.health <= 0) this.respawn();
  }

  private respawn() {
    this.health = 100;
    this.player?.setPosition(100, 450);
    this.player?.setVelocity(0, 0);
    this.events.emit('update-health', this.health);
  }
}
