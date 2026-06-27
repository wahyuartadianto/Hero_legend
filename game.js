// ===== HERO LEGEND - GAME ENGINE =====
'use strict';

// ============================
// GAME STATE & CONSTANTS
// ============================
const GRAVITY = 0.55;
const JUMP_FORCE = -14;
const DASH_FORCE = 10;
const ENEMY_TYPES = ['goblin', 'orc', 'skeleton', 'demon', 'wizard'];
const LEVEL_THEMES = [
    { name: 'Hutan Gelap', bg: ['#1a2a0a','#0a1a05','#0d1f08'], ground: '#2d4a1a', accent: '#4aff44' },
    { name: 'Gunung Api', bg: ['#2a0a0a','#1a0505','#2d0808'], ground: '#5a1a0a', accent: '#ff6b00' },
    { name: 'Gua Kristal', bg: ['#0a0a2a','#05051a','#080828'], ground: '#1a1a4a', accent: '#00d4ff' },
    { name: 'Kuil Kuno', bg: ['#1a1a0a','#1a1505','#252510'], ground: '#3a3010', accent: '#ffd700' },
    { name: 'Dimensi Iblis', bg: ['#1a002a','#0d0018','#18001f'], ground: '#2d004a', accent: '#ff00ff' },
];

const BOSSES = [
    { name: 'RAJA GOBLIN', color: '#22ff22', size: 70, hp: 400, atk: 20, speed: 2.2, emoji: '👺', phases: 2, reward: { weapon: { name: 'Pedang Besi', icon: '⚔️', atkBonus: 30, desc: '+30 ATK, Api merah' }, skill: { name: 'Tembakan Api', icon: '🔥', desc: 'Tembakkan bola api jauh', energyCost: 25 } } },
    { name: 'TITAN API', color: '#ff4400', size: 85, hp: 700, atk: 35, speed: 2.0, emoji: '🔥', phases: 2, reward: { weapon: { name: 'Tombak Api', icon: '🗡️', atkBonus: 50, desc: '+50 ATK, Serangan menembus' }, skill: { name: 'Badai Api', icon: '🌋', desc: 'Area serangan api besar', energyCost: 40 } } },
    { name: 'RAJA KRISTAL', color: '#00ddff', size: 80, hp: 1000, atk: 45, speed: 2.5, emoji: '💎', phases: 3, reward: { weapon: { name: 'Pedang Kristal', icon: '🔮', atkBonus: 70, desc: '+70 ATK, Serangan beku' }, skill: { name: 'Penjara Es', icon: '❄️', desc: 'Bekukan semua musuh', energyCost: 50 } } },
    { name: 'DEWA PERANG', color: '#ffd700', size: 90, hp: 1500, atk: 60, speed: 2.8, emoji: '⚡', phases: 3, reward: { weapon: { name: 'Petir Suci', icon: '⚡', atkBonus: 100, desc: '+100 ATK, Kilat berantai' }, skill: { name: 'Hujan Petir', icon: '🌩️', desc: 'Petir menghantam seluruh arena', energyCost: 60 } } },
    { name: 'IBLIS AGUNG', color: '#ff00ff', size: 100, hp: 2500, atk: 80, speed: 3.0, emoji: '👿', phases: 4, reward: { weapon: { name: 'Pedang Kehampaan', icon: '🌑', atkBonus: 150, desc: '+150 ATK, Daya kegelapan' }, skill: { name: 'Nova Kegelapan', icon: '🌑', desc: 'Ledakan kegelapan massif', energyCost: 80 } } },
];

const WEAPONS = [
    { name: 'Pedang Kayu', icon: '🪵', atk: 0 },
    { name: 'Pedang Besi', icon: '⚔️', atk: 30 },
    { name: 'Tombak Api', icon: '🗡️', atk: 50 },
    { name: 'Pedang Kristal', icon: '🔮', atk: 70 },
    { name: 'Petir Suci', icon: '⚡', atk: 100 },
    { name: 'Pedang Kehampaan', icon: '🌑', atk: 150 },
];

const BASE_SKILLS = [
    { name: 'Tebasan Kuat', icon: '💥', energyCost: 20, desc: 'Serangan kuat 2x lipat' },
];

// ============================
// AUDIO ENGINE (Web Audio API)
// ============================
class AudioEngine {
    constructor() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.4;
            this.masterGain.connect(this.ctx.destination);
            this.enabled = true;
        } catch(e) {
            this.enabled = false;
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    }

    playTone(freq, type, duration, vol = 0.3) {
        if (!this.enabled) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.7, this.ctx.currentTime + duration);
            gain.gain.setValueAtTime(vol, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
            osc.start(this.ctx.currentTime);
            osc.stop(this.ctx.currentTime + duration);
        } catch(e){}
    }

    attack() { this.playTone(220, 'sawtooth', 0.1, 0.3); }
    hit() { this.playTone(150, 'square', 0.15, 0.25); }
    jump() { this.playTone(440, 'sine', 0.12, 0.15); }
    dash() { this.playTone(330, 'sawtooth', 0.08, 0.2); }
    skill() { 
        this.playTone(550, 'sine', 0.05, 0.2);
        setTimeout(() => this.playTone(700, 'sine', 0.1, 0.2), 60);
        setTimeout(() => this.playTone(880, 'sine', 0.15, 0.3), 120);
    }
    hurt() { this.playTone(100, 'square', 0.2, 0.4); }
    bossHurt() { this.playTone(80, 'sawtooth', 0.25, 0.35); }
    pickup() {
        this.playTone(660, 'sine', 0.08, 0.15);
        setTimeout(() => this.playTone(880, 'sine', 0.08, 0.2), 80);
        setTimeout(() => this.playTone(1100, 'sine', 0.08, 0.25), 160);
    }
    levelUp() {
        [523, 659, 784, 1047].forEach((f,i) => setTimeout(() => this.playTone(f, 'sine', 0.3, 0.35), i*120));
    }
    die() {
        [300, 250, 200, 150, 100].forEach((f,i) => setTimeout(() => this.playTone(f, 'sawtooth', 0.15, 0.3), i*80));
    }
    bossDie() {
        [500, 600, 700, 800, 900, 1000].forEach((f,i) => setTimeout(() => this.playTone(f, 'sine', 0.2, 0.35), i*100));
    }
}

// ============================
// PARTICLE SYSTEM
// ============================
class Particle {
    constructor(x, y, vx, vy, color, size, life, type = 'circle') {
        this.x = x; this.y = y;
        this.vx = vx; this.vy = vy;
        this.color = color; this.size = size;
        this.life = life; this.maxLife = life;
        this.type = type;
        this.alpha = 1;
        this.gravity = type === 'spark' ? 0.2 : 0.05;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= 0.96;
        this.life--;
        this.alpha = this.life / this.maxLife;
        this.size *= 0.97;
        return this.life > 0 && this.size > 0.3;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        if (this.type === 'star') {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 4;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

class ParticleSystem {
    constructor() { this.particles = []; }

    emit(x, y, count, config = {}) {
        for (let i = 0; i < count; i++) {
            const angle = config.angle !== undefined ? config.angle + (Math.random() - 0.5) * (config.spread || Math.PI * 2) : Math.random() * Math.PI * 2;
            const speed = config.speed || 3 + Math.random() * 3;
            const color = Array.isArray(config.color) ? config.color[Math.floor(Math.random() * config.color.length)] : (config.color || '#ff6600');
            this.particles.push(new Particle(
                x + (Math.random() - 0.5) * 10,
                y + (Math.random() - 0.5) * 10,
                Math.cos(angle) * speed * (Math.random() * 0.5 + 0.5),
                Math.sin(angle) * speed * (Math.random() * 0.5 + 0.5),
                color,
                config.size || 4 + Math.random() * 3,
                config.life || 30 + Math.random() * 20,
                config.type || 'circle'
            ));
        }
    }

    update() {
        this.particles = this.particles.filter(p => p.update());
    }

    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
    }

    explosion(x, y, color = '#ff6600') {
        this.emit(x, y, 20, { color: [color, '#ffaa00', '#fff'], speed: 6, size: 5, life: 40, type: 'spark' });
        this.emit(x, y, 10, { color: [color, '#ff000044'], speed: 3, size: 8, life: 25 });
    }

    hitEffect(x, y, color = '#ffffff') {
        this.emit(x, y, 8, { color: [color, '#ffff00'], speed: 4, size: 3, life: 20, type: 'spark' });
    }

    skillEffect(x, y, color) {
        this.emit(x, y, 30, { color: [color, '#ffffff', '#ffff00'], speed: 8, size: 6, life: 50, type: 'star' });
    }
}

// ============================
// HERO CLASS
// ============================
class Hero {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.w = 40; this.h = 56;
        this.vx = 0; this.vy = 0;
        this.onGround = false;
        this.facing = 1;
        this.state = 'idle';
        this.stateTimer = 0;
        this.prevState = 'idle';

        // Continuous animation time (used for smooth sine-wave animations)
        this.animTime = 0;
        // Legacy frame counter kept for compatibility
        this.animFrame = 0;
        this.animTimer = 0;

        // ── Squash & Stretch ──────────────────────────────────────────
        this.scaleX = 1;        // current horizontal scale
        this.scaleY = 1;        // current vertical scale
        this.targetScaleX = 1;
        this.targetScaleY = 1;

        // ── Landing / Coyote ─────────────────────────────────────────
        this.landingTimer   = 0;   // plays squash on land
        this.wasOnGround    = false;
        this.coyoteTimer    = 0;   // allows jump briefly after walking off edge
        this.jumpBufferTimer = 0;  // buffer so pressing jump early still works

        // ── Tilt / Lean ───────────────────────────────────────────────
        this.bodyTilt   = 0;   // body rotation when running / dashing
        this.headBob    = 0;   // vertical head oscillation

        // ── Limb angles (IK-style, in radians) ────────────────────────
        this.leftArmAngle  = 0;
        this.rightArmAngle = 0;
        this.leftLegAngle  = 0;
        this.rightLegAngle = 0;
        this.foreArmAngle  = 0;   // forearm relative to upper-arm
        this.weaponAngle   = 0;   // weapon swing angle
        this.capeFlap      = 0;   // cape wave phase

        // ── Attack combo ──────────────────────────────────────────────
        this.attackPhase   = 0;   // 0=windup 1=strike 2=followthru
        this.attackTime    = 0;   // time inside current attack

        // ── Hurt / knockback ─────────────────────────────────────────
        this.hurtShake     = 0;

        // ── Skill cast ───────────────────────────────────────────────
        this.skillChargeGlow = 0; // 0-1 glow during skill windup

        // Stats
        this.maxHp = 200; this.hp = 200;
        this.baseAtk = 60;
        this.weaponAtk = 0;
        this.def = 10;
        this.speed = 5;
        this.maxEnergy = 100; this.energy = 100;
        this.energyRegen = 0.15;

        // Skills & Weapons
        this.weaponIndex = 0;
        this.skills = [{ ...BASE_SKILLS[0] }];
        this.activeSkillIndex = 0;
        this.skillCooldown = 0;
        this.skillCooldownMax = 60;

        // Combat
        this.attackCooldown = 0;
        this.attackCooldownMax = 22;
        this.hitbox = null;
        this.invincible = 0;
        this.dashCooldown = 0;
        this.dashTimer = 0;
        this.isDashing = false;
        this.jumpCount = 0;
        this.maxJumps = 2;

        // Combo
        this.comboCount = 0;
        this.comboTimer = 0;

        // Trail effect
        this.trail = [];

        // Stats tracking
        this.enemiesKilled = 0;
    }

    get atk() { return this.baseAtk + this.weaponAtk; }

    jump(audio) {
        if (this.jumpCount < this.maxJumps) {
            this.vy = JUMP_FORCE * (this.jumpCount === 0 ? 1 : 0.85);
            const isDouble = this.jumpCount === 1;
            this.jumpCount++;
            this.onGround = false;
            this.state = 'jump';
            this.stateTimer = 15;
            audio.jump();

            if (!isDouble) {
                // First jump — launch squash: splat wide then snap tall
                this.targetScaleX = 1.4;
                this.targetScaleY = 0.65;
                this.landingTimer = 6;
            } else {
                // Double jump — quick burst expansion
                this.targetScaleX = 0.72;
                this.targetScaleY = 1.45;
                this.landingTimer = 9;
                // Snap limbs for dramatic double-jump silhouette
                this.leftArmAngle  = -1.1;
                this.rightArmAngle = -1.1;
                this.leftLegAngle  =  0.7;
                this.rightLegAngle = -0.7;
                this.foreArmAngle  =  0.9;
            }
        }
    }

    dash(audio) {
        if (this.dashCooldown > 0 || this.energy < 15) return;
        this.isDashing = true;
        this.dashTimer = 14;
        this.vx = this.facing * DASH_FORCE;
        this.dashCooldown = 50;
        this.energy = Math.max(0, this.energy - 15);
        this.invincible = 16;
        this.state = 'dash';
        audio.dash();
        // Dash lean squash
        this.targetScaleX = 1.5;
        this.targetScaleY = 0.6;
        this.landingTimer = 6;
    }

    attack(particles, audio) {
        if (this.attackCooldown > 0) return null;
        this.attackCooldown = this.attackCooldownMax;
        this.state = 'attack';
        this.stateTimer = 18;
        this.comboCount++;
        this.comboTimer = 40;
        const isCrit = Math.random() < 0.2 + this.comboCount * 0.05;
        const dmg = Math.floor(this.atk * (1 + (this.comboCount - 1) * 0.15) * (isCrit ? 2 : 1));
        const ax = this.x + (this.facing > 0 ? this.w : -20);
        const ay = this.y + 10;
        particles.hitEffect(ax + 20, ay + 20, isCrit ? '#ffd700' : '#fff');
        audio.attack();
        return {
            x: this.x + (this.facing > 0 ? this.w : -50),
            y: this.y,
            w: 60, h: this.h,
            dmg, isCrit
        };
    }

    useSkill(particles, audio) {
        const skill = this.skills[this.activeSkillIndex];
        if (!skill || this.skillCooldown > 0 || this.energy < skill.energyCost) return null;
        this.energy = Math.max(0, this.energy - skill.energyCost);
        this.skillCooldown = this.skillCooldownMax;
        this.state = 'skill';
        this.stateTimer = 30;
        audio.skill();
        particles.skillEffect(this.x + this.w / 2, this.y + this.h / 2, '#ff6b35');
        return { type: skill.name, index: this.activeSkillIndex, atk: this.atk * 2.5, dir: this.facing };
    }

    takeDamage(dmg, particles, audio) {
        if (this.invincible > 0 || this.isDashing) return false;
        const actual = Math.max(1, dmg - this.def);
        this.hp = Math.max(0, this.hp - actual);
        this.invincible = 30;
        this.hurtShake = 8;
        this.state = 'hurt';
        this.stateTimer = 18;
        this.vx = -this.facing * 4;
        // Landing squash on hurt
        this.targetScaleX = 1.3;
        this.targetScaleY = 0.75;
        this.landingTimer = 8;
        particles.explosion(this.x + this.w / 2, this.y + this.h / 2, '#ff3355');
        audio.hurt();
        return actual;
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    update(groundY, canvasW) {
        // ── Timers ──────────────────────────────────────────────────
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.skillCooldown   > 0) this.skillCooldown--;
        if (this.stateTimer      > 0) this.stateTimer--;
        if (this.invincible      > 0) this.invincible--;
        if (this.dashCooldown    > 0) this.dashCooldown--;
        if (this.hurtShake       > 0) this.hurtShake--;
        if (this.landingTimer    > 0) this.landingTimer--;
        if (this.dashTimer > 0) { this.dashTimer--; if (this.dashTimer === 0) this.isDashing = false; }
        if (this.comboTimer > 0) { this.comboTimer--; if (this.comboTimer === 0) this.comboCount = 0; }
        if (this.stateTimer === 0 && !['idle','run','jump'].includes(this.state)) {
            this.state = this.onGround ? 'idle' : 'jump';
        }

        // Energy regen
        this.energy = Math.min(this.maxEnergy, this.energy + this.energyRegen);

        // Gravity
        if (!this.onGround) this.vy += GRAVITY;

        // Position
        this.x += this.vx;
        this.y += this.vy;
        if (!this.isDashing) this.vx *= 0.8;

        // Ground check — landing squash
        this.wasOnGround = this.onGround;
        if (this.y + this.h >= groundY) {
            if (!this.wasOnGround && Math.abs(this.vy) > 4) {
                // Hard landing squash
                const impact = Math.min(Math.abs(this.vy) / 18, 1);
                this.targetScaleX = 1 + impact * 0.45;
                this.targetScaleY = 1 - impact * 0.35;
                this.landingTimer = 12;
            }
            this.y = groundY - this.h;
            this.vy = 0;
            this.onGround = true;
            this.jumpCount = 0;
            this.coyoteTimer = 8;
            if (this.state === 'jump') this.state = 'idle';
        } else {
            this.onGround = false;
            if (this.coyoteTimer > 0) this.coyoteTimer--;
        }

        // Bounds
        this.x = Math.max(5, Math.min(canvasW - this.w - 5, this.x));

        // ── State transitions ──────────────────────────────────────
        if (this.onGround) {
            if (Math.abs(this.vx) > 0.5 && this.state === 'idle') this.state = 'run';
            if (Math.abs(this.vx) < 0.5 && this.state === 'run')  this.state = 'idle';
        }

        // ── Squash & Stretch easing toward target ──────────────────
        if (this.landingTimer > 0) {
            // Spring back to normal
            this.scaleX += (this.targetScaleX - this.scaleX) * 0.35;
            this.scaleY += (this.targetScaleY - this.scaleY) * 0.35;
        } else {
            // Jump stretch
            if (!this.onGround) {
                const stretch = this.vy < 0 ? 0.88 : (this.vy > 6 ? 1.12 : 1);
                this.scaleX += (1 / stretch - this.scaleX) * 0.12;
                this.scaleY += (stretch - this.scaleY) * 0.12;
            } else {
                this.scaleX += (1 - this.scaleX) * 0.18;
                this.scaleY += (1 - this.scaleY) * 0.18;
            }
        }
        // Clamp
        this.scaleX = Math.max(0.6, Math.min(1.6, this.scaleX));
        this.scaleY = Math.max(0.6, Math.min(1.6, this.scaleY));

        // ── Continuous animation time ──────────────────────────────
        this.animTime += 1;
        this.animTimer++;
        if (this.animTimer >= 6) { this.animTimer = 0; this.animFrame = (this.animFrame + 1) % 4; }

        // ── Body tilt (lean forward when running / dashing) ─────────
        let targetTilt = 0;
        if (this.state === 'run')    targetTilt = this.facing * 0.18;
        if (this.isDashing)          targetTilt = this.facing * 0.42;
        if (this.state === 'attack') targetTilt = this.facing * 0.12;
        this.bodyTilt += (targetTilt - this.bodyTilt) * 0.18;

        // ── Head bob (breathing in idle, run bounce) ────────────────
        const runSpeed = Math.abs(this.vx) / this.speed;
        if (this.state === 'run') {
            this.headBob = Math.sin(this.animTime * 0.38) * 3.5 * runSpeed;
        } else if (this.state === 'idle') {
            this.headBob = Math.sin(this.animTime * 0.055) * 1.4; // slow breathing
        } else {
            this.headBob *= 0.85;
        }

        // ── Cape flap ──────────────────────────────────────────────
        this.capeFlap += this.isDashing ? 0.35 : (this.state === 'run' ? 0.22 : 0.07);

        // ── Limb IK solve ──────────────────────────────────────────
        this._updateLimbs(runSpeed);

        // ── Dash trail ─────────────────────────────────────────────
        if (this.isDashing) {
            this.trail.push({ x: this.x, y: this.y, scaleX: this.scaleX, scaleY: this.scaleY });
            if (this.trail.length > 8) this.trail.shift();
        } else {
            if (this.trail.length) this.trail.shift(); // fade out
        }

        // ── Skill charge glow ─────────────────────────────────────
        if (this.state === 'skill') {
            this.skillChargeGlow = Math.min(1, this.skillChargeGlow + 0.06);
        } else {
            this.skillChargeGlow *= 0.88;
        }
    }

    _updateLimbs(runSpeed) {
        const t = this.animTime;

        switch (this.state) {
            // ── IDLE – gentle breathing sway ─────────────────────────
            case 'idle': {
                const breathe = Math.sin(t * 0.055);
                this.leftArmAngle  += (breathe * 0.12 - this.leftArmAngle)  * 0.1;
                this.rightArmAngle += (-breathe * 0.08 - this.rightArmAngle) * 0.1;
                this.leftLegAngle  += (0 - this.leftLegAngle)  * 0.1;
                this.rightLegAngle += (0 - this.rightLegAngle) * 0.1;
                this.foreArmAngle  += (0.15 - this.foreArmAngle) * 0.08;
                this.weaponAngle   += (-0.1 - this.weaponAngle) * 0.1;
                break;
            }
            // ── RUN – full alternating run cycle ─────────────────────
            case 'run': {
                const cycle = t * 0.32;
                const swing = Math.sin(cycle) * 0.7 * runSpeed;
                this.leftArmAngle  = -swing;
                this.rightArmAngle = swing;
                // Legs swing opposite to arms
                this.leftLegAngle  = swing * 0.9;
                this.rightLegAngle = -swing * 0.9;
                // Knee bend (forearm doubles as knee here)
                this.foreArmAngle  = Math.abs(Math.sin(cycle)) * 0.5 + 0.1;
                // Weapon bobs with run rhythm
                this.weaponAngle   = Math.sin(cycle * 0.5) * 0.15;
                break;
            }
            // ── JUMP ─────────────────────────────────────────────────
            case 'jump': {
                const rising = this.vy < 0;
                const tgt    = rising ? -0.6 : 0.5;
                this.leftArmAngle  += ((-tgt * 0.8) - this.leftArmAngle)  * 0.18;
                this.rightArmAngle += ((tgt) - this.rightArmAngle) * 0.18;
                // Tuck legs up on rise, extend on fall
                const legTgt = rising ? -0.5 : 0.3;
                this.leftLegAngle  += (legTgt  - this.leftLegAngle)  * 0.2;
                this.rightLegAngle += (-legTgt - this.rightLegAngle) * 0.2;
                this.foreArmAngle  += (0.3 - this.foreArmAngle) * 0.15;
                this.weaponAngle   += (0.2 - this.weaponAngle)  * 0.12;
                break;
            }
            // ── ATTACK – 3-phase combo ────────────────────────────────
            case 'attack': {
                this.attackTime++;
                const maxT = this.attackCooldownMax;
                const prog = 1 - this.attackCooldown / maxT;
                const combo = this.comboCount % 3;

                if (combo === 0) {
                    // Overhead downward slash
                    if (prog < 0.25) { // wind-up
                        this.rightArmAngle += (-1.4 - this.rightArmAngle) * 0.3;
                        this.foreArmAngle  += (0.9  - this.foreArmAngle)  * 0.3;
                        this.weaponAngle   += (-1.1 - this.weaponAngle)   * 0.3;
                    } else {           // strike
                        this.rightArmAngle += (0.9  - this.rightArmAngle) * 0.45;
                        this.foreArmAngle  += (-0.2 - this.foreArmAngle)  * 0.45;
                        this.weaponAngle   += (0.5  - this.weaponAngle)   * 0.45;
                    }
                    this.leftArmAngle  += (-0.4 - this.leftArmAngle)  * 0.2;
                } else if (combo === 1) {
                    // Rising upper cut
                    if (prog < 0.25) {
                        this.rightArmAngle += (1.0  - this.rightArmAngle) * 0.3;
                        this.foreArmAngle  += (-0.6 - this.foreArmAngle)  * 0.3;
                        this.weaponAngle   += (0.8  - this.weaponAngle)   * 0.3;
                    } else {
                        this.rightArmAngle += (-0.7 - this.rightArmAngle) * 0.45;
                        this.foreArmAngle  += (0.1  - this.foreArmAngle)  * 0.45;
                        this.weaponAngle   += (-0.6 - this.weaponAngle)   * 0.45;
                    }
                    this.leftArmAngle  += (0.3 - this.leftArmAngle) * 0.2;
                } else {
                    // Spinning horizontal sweep
                    const spin = prog * Math.PI * 1.5;
                    this.rightArmAngle = Math.sin(spin) * 1.2;
                    this.foreArmAngle  = 0.3 + Math.cos(spin) * 0.3;
                    this.weaponAngle   = Math.cos(spin) * 0.8;
                    this.leftArmAngle  = -Math.sin(spin) * 0.6;
                }
                // Feet stay mostly planted
                this.leftLegAngle  += (0.1  - this.leftLegAngle)  * 0.15;
                this.rightLegAngle += (-0.1 - this.rightLegAngle) * 0.15;
                break;
            }
            // ── SKILL – charge then burst pose ───────────────────────
            case 'skill': {
                const charge = this.skillChargeGlow;
                // Both arms raise and spread during charge
                this.leftArmAngle  += ((-0.8 - charge * 0.6) - this.leftArmAngle)  * 0.2;
                this.rightArmAngle += ((-0.8 - charge * 0.6) - this.rightArmAngle) * 0.2;
                this.foreArmAngle  += ((0.4 + charge * 0.8) - this.foreArmAngle)   * 0.2;
                this.weaponAngle   += ((-0.3 - charge * 0.4) - this.weaponAngle)   * 0.2;
                // Legs in power stance
                this.leftLegAngle  += (0.2  - this.leftLegAngle)  * 0.15;
                this.rightLegAngle += (-0.2 - this.rightLegAngle) * 0.15;
                break;
            }
            // ── HURT – recoil snap ────────────────────────────────────
            case 'hurt': {
                this.leftArmAngle  += (0.8  - this.leftArmAngle)  * 0.35;
                this.rightArmAngle += (-0.8 - this.rightArmAngle) * 0.35;
                this.foreArmAngle  += (0.6  - this.foreArmAngle)  * 0.35;
                this.leftLegAngle  += (0.4  - this.leftLegAngle)  * 0.2;
                this.rightLegAngle += (-0.4 - this.rightLegAngle) * 0.2;
                this.weaponAngle   += (0.3  - this.weaponAngle)   * 0.3;
                break;
            }
            // ── DASH – streamlined ────────────────────────────────────
            case 'dash': {
                this.leftArmAngle  += (-0.9 - this.leftArmAngle)  * 0.3;
                this.rightArmAngle += (-0.7 - this.rightArmAngle) * 0.3;
                this.foreArmAngle  += (0.6  - this.foreArmAngle)  * 0.3;
                this.leftLegAngle  += (-0.4 - this.leftLegAngle)  * 0.3;
                this.rightLegAngle += (0.6  - this.rightLegAngle) * 0.3;
                this.weaponAngle   += (-0.4 - this.weaponAngle)   * 0.3;
                break;
            }
        }
    }

    draw(ctx) {
        // ── Dash afterimage trail ───────────────────────────────────
        this.trail.forEach((t, i) => {
            const ratio = i / Math.max(this.trail.length, 1);
            ctx.save();
            ctx.globalAlpha = ratio * 0.45;
            ctx.translate(t.x + this.w / 2, t.y + this.h / 2);
            if (this.facing === -1) ctx.scale(-1, 1);
            ctx.scale(t.scaleX || 1, t.scaleY || 1);
            // Ghost silhouette
            ctx.fillStyle = '#00d4ff';
            ctx.beginPath();
            ctx.roundRect(-12, -14, 24, 38, 6);
            ctx.fill();
            // Ghost head
            ctx.beginPath();
            ctx.ellipse(0, -22, 11, 13, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // ── Blink when invincible ──────────────────────────────────
        ctx.save();
        if (this.invincible > 0 && Math.floor(this.invincible / 3) % 2 === 0) {
            ctx.globalAlpha = 0.35;
        }

        // Hurt shake offset
        const shakeX = this.hurtShake > 0 ? (Math.random() - 0.5) * 5 : 0;

        // Root transform
        ctx.translate(this.x + this.w / 2 + shakeX, this.y + this.h / 2);
        if (this.facing === -1) ctx.scale(-1, 1);

        // Squash & stretch + body tilt
        ctx.scale(this.scaleX, this.scaleY);
        ctx.rotate(this.bodyTilt);

        // ── Dynamic shadow (scales with squash) ────────────────────
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#000';
        ctx.scale(1 / this.scaleX, 1);  // keep shadow flat
        ctx.beginPath();
        ctx.ellipse(0, this.h / 2 - 2, 16 * this.scaleX, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        const bob = this.headBob;
        const wi  = this.weaponIndex;

        // ─────────────────────────────────────────────────────────
        // CAPE  (drawn behind body)
        // ─────────────────────────────────────────────────────────
        this._drawCape(ctx, bob);

        // ─────────────────────────────────────────────────────────
        // LEFT ARM  (behind torso)
        // ─────────────────────────────────────────────────────────
        this._drawArm(ctx, -10, -4 + bob, this.leftArmAngle, this.foreArmAngle, false, wi);

        // ─────────────────────────────────────────────────────────
        // LEGS
        // ─────────────────────────────────────────────────────────
        this._drawLeg(ctx, -5, 10 + bob, this.leftLegAngle,  wi, false);
        this._drawLeg(ctx,  5, 10 + bob, this.rightLegAngle, wi, true);

        // ─────────────────────────────────────────────────────────
        // TORSO
        // ─────────────────────────────────────────────────────────
        this._drawTorso(ctx, bob, wi);

        // ─────────────────────────────────────────────────────────
        // RIGHT ARM + WEAPON  (in front of torso)
        // ─────────────────────────────────────────────────────────
        this._drawArm(ctx, 10, -4 + bob, this.rightArmAngle, this.foreArmAngle, true, wi);

        // ─────────────────────────────────────────────────────────
        // HEAD
        // ─────────────────────────────────────────────────────────
        this._drawHead(ctx, bob, wi);

        // ─────────────────────────────────────────────────────────
        // SKILL GLOW aura
        // ─────────────────────────────────────────────────────────
        if (this.skillChargeGlow > 0.05) {
            ctx.save();
            ctx.globalAlpha = this.skillChargeGlow * 0.5;
            const glowColor = ['#ff6b35','#ff4400','#00eeff','#ffdd00','#ff00ff'][Math.min(wi, 4)];
            ctx.fillStyle = glowColor;
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 30;
            ctx.beginPath();
            ctx.arc(0, 0, 22 + this.skillChargeGlow * 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        ctx.restore(); // main save
    }

    // ── Cape ───────────────────────────────────────────────────────
    _drawCape(ctx, bob) {
        const capeColors = [
            ['#552200','#7a3311'],
            ['#552200','#7a3311'],
            ['#aa4400','#cc6622'],
            ['#3a0088','#5500aa'],
            ['#440088','#6600cc'],
            ['#220044','#440077'],
        ];
        const [dark, mid] = capeColors[Math.min(this.weaponIndex, 5)];
        const flap  = Math.sin(this.capeFlap) * 3;
        const flap2 = Math.sin(this.capeFlap * 0.7 + 1) * 2;
        ctx.save();
        // Main cape body
        ctx.fillStyle = dark;
        ctx.beginPath();
        ctx.moveTo(-6, -10 + bob);
        ctx.quadraticCurveTo(-20 + flap, 2 + bob, -16 + flap2, 22 + bob);
        ctx.quadraticCurveTo(-12 + flap, 28 + bob, -8, 20 + bob);
        ctx.closePath();
        ctx.fill();
        // Cape shine
        ctx.fillStyle = mid;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(-7, -8 + bob);
        ctx.quadraticCurveTo(-14 + flap * 0.5, 0 + bob, -12 + flap2 * 0.5, 14 + bob);
        ctx.lineTo(-8, 12 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // ── Single arm (upper arm + forearm) ───────────────────────────
    _drawArm(ctx, ox, oy, upperAngle, foreAngle, isRight, wi) {
        const skinColors  = ['#cc9966','#cc9966','#cc8855','#aa7744','#cc9966','#cc9966'];
        const gloveColors = ['#553322','#884422','#662211','#224455','#553300','#330033'];
        const skin  = skinColors[Math.min(wi, 5)];
        const glove = gloveColors[Math.min(wi, 5)];
        const armorCol = ['#445566','#886622','#225566','#886600','#440088','#330066'][Math.min(wi, 5)];

        ctx.save();
        ctx.translate(ox, oy);
        ctx.rotate(upperAngle);

        // Upper arm
        ctx.fillStyle = armorCol;
        ctx.beginPath();
        ctx.roundRect(-4, 0, 8, 12, 3);
        ctx.fill();
        // Skin strip
        ctx.fillStyle = skin;
        ctx.fillRect(-2, 3, 4, 6);

        // Forearm pivot at end of upper arm
        ctx.translate(0, 12);
        ctx.rotate(foreAngle * (isRight ? 1 : -1));

        // Forearm
        ctx.fillStyle = skin;
        ctx.beginPath();
        ctx.roundRect(-3, 0, 7, 10, 2);
        ctx.fill();

        // Glove
        ctx.fillStyle = glove;
        ctx.beginPath();
        ctx.roundRect(-4, 8, 9, 6, 3);
        ctx.fill();

        // Weapon only on right arm
        if (isRight) {
            ctx.translate(0, 12);
            ctx.rotate(this.weaponAngle);
            this._drawWeaponShape(ctx, wi);
        }

        ctx.restore();
    }

    // ── Single leg (thigh + shin + foot) ───────────────────────────
    _drawLeg(ctx, ox, oy, angle, wi, isRight) {
        const pantColors = ['#4444aa','#4455aa','#445588','#3a3a88','#3a1a66','#220044'];
        const bootColors = ['#332211','#554411','#332222','#222244','#220011','#110022'];
        const pants = pantColors[Math.min(wi, 5)];
        const boots = bootColors[Math.min(wi, 5)];
        const bootAccent = ['#6655aa','#8877cc','#6655aa','#5555aa','#550066','#440055'][Math.min(wi, 5)];

        ctx.save();
        ctx.translate(ox, oy);
        ctx.rotate(angle);

        // Thigh
        ctx.fillStyle = pants;
        ctx.beginPath();
        ctx.roundRect(-5, 0, 10, 12, 3);
        ctx.fill();

        // Knee cap
        ctx.fillStyle = bootAccent;
        ctx.beginPath();
        ctx.arc(0, 12, 4, 0, Math.PI * 2);
        ctx.fill();

        // Shin — bent with foreArmAngle reused as knee-bend proxy
        ctx.translate(0, 12);
        ctx.rotate(this.foreArmAngle * (isRight ? -0.5 : 0.5));

        ctx.fillStyle = pants;
        ctx.beginPath();
        ctx.roundRect(-4, 0, 9, 10, 2);
        ctx.fill();

        // Boot
        ctx.fillStyle = boots;
        ctx.beginPath();
        ctx.roundRect(-5, 8, 12, 7, 3);
        ctx.fill();
        // Boot highlight
        ctx.fillStyle = bootAccent;
        ctx.globalAlpha = 0.4;
        ctx.fillRect(-4, 9, 6, 3);
        ctx.globalAlpha = 1;

        ctx.restore();
    }

    // ── Torso ──────────────────────────────────────────────────────
    _drawTorso(ctx, bob, wi) {
        const bodyColors   = ['#222244','#222244','#441100','#1a1a44','#220044','#110033'];
        const armorColors  = ['#445566','#886622','#225566','#886600','#440088','#330066'];
        const accentColors = ['rgba(255,255,255,0.15)','rgba(255,200,0,0.15)','rgba(255,100,0,0.15)',
                              'rgba(0,200,255,0.15)','rgba(255,220,0,0.15)','rgba(200,0,255,0.15)'];
        const body   = bodyColors[Math.min(wi, 5)];
        const armor  = armorColors[Math.min(wi, 5)];
        const accent = accentColors[Math.min(wi, 5)];

        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.roundRect(-11, -12 + bob, 22, 24, 5);
        ctx.fill();

        // Chest plate
        ctx.fillStyle = armor;
        ctx.beginPath();
        ctx.roundRect(-9, -10 + bob, 18, 13, 4);
        ctx.fill();

        // Belly / waist
        ctx.fillStyle = body;
        ctx.fillRect(-7, 2 + bob, 14, 4);
        ctx.fillStyle = '#111';
        ctx.fillRect(-7, 4 + bob, 14, 2);

        // Chest highlight
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.roundRect(-8, -9 + bob, 9, 6, 3);
        ctx.fill();

        // Chest emblem (varies per weapon)
        const emblems = ['⚔','⚔','🔥','❄','⚡','🌑'];
        ctx.save();
        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        ctx.globalAlpha = 0.8;
        ctx.fillText(emblems[Math.min(wi, 5)], 0, -2 + bob);
        ctx.restore();

        // Belt buckle
        ctx.fillStyle = '#cc9900';
        ctx.fillRect(-4, 6 + bob, 8, 4);
        ctx.fillStyle = '#ffdd00';
        ctx.fillRect(-2, 7 + bob, 4, 2);
    }

    // ── Head ──────────────────────────────────────────────────────
    _drawHead(ctx, bob, wi) {
        const helmetColors = ['#554433','#554433','#775500','#005577','#776600','#440077'];
        const visorColors  = ['#7788aa','#7788aa','#cc8800','#0088cc','#ccaa00','#8800cc'];
        const visorGlows   = ['#aabbdd','#aabbdd','#ffcc00','#00ccff','#ffee00','#cc00ff'];
        const helmet = helmetColors[Math.min(wi, 5)];
        const visor  = visorColors[Math.min(wi, 5)];
        const vglow  = visorGlows[Math.min(wi, 5)];

        // Head-bob and hurt tilt
        const headTiltExtra = this.state === 'hurt' ? 0.25 : 0;

        ctx.save();
        ctx.translate(0, -22 + bob);
        ctx.rotate(headTiltExtra * this.facing * -1);

        // Neck
        ctx.fillStyle = '#bb8855';
        ctx.fillRect(-4, 9, 8, 5);

        // Head base (skin)
        ctx.fillStyle = '#cc9966';
        ctx.beginPath();
        ctx.ellipse(0, 4, 11, 13, 0, 0, Math.PI * 2);
        ctx.fill();
        // Chin shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(0, 10, 8, 5, 0, 0, Math.PI);
        ctx.fill();

        // Helmet dome
        ctx.fillStyle = helmet;
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 10, 0, Math.PI, 0); // top half only
        ctx.fill();
        // Helmet rim
        ctx.fillStyle = visor;
        ctx.fillRect(-12, -1, 24, 4);

        // Plume / crest on helmet
        ctx.fillStyle = '#cc2200';
        for (let i = -6; i <= 6; i += 3) {
            const ph = 3 + Math.sin(this.capeFlap * 2 + i) * 2;
            ctx.fillRect(i - 1, -10 - ph, 2, ph + 2);
        }

        // Visor slit
        ctx.fillStyle = visor;
        ctx.shadowColor = vglow;
        ctx.shadowBlur  = this.state === 'attack' ? 12 : (this.state === 'skill' ? 20 : 5);
        ctx.fillRect(-9, 1, 18, 5);
        ctx.shadowBlur = 0;

        // Eye glow through visor
        const eyeCol = this.state === 'skill'  ? '#ff3300' :
                       this.state === 'attack' ? '#ffee00' :
                       this.state === 'hurt'   ? '#ff2255' : vglow;
        ctx.fillStyle = eyeCol;
        ctx.shadowColor = eyeCol;
        ctx.shadowBlur  = 8;
        ctx.fillRect(-7, 2, 5, 3);
        ctx.fillRect(2,  2, 5, 3);
        ctx.shadowBlur = 0;

        // Helmet side plates
        ctx.fillStyle = helmet;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(-12, -1);
        ctx.lineTo(-14, 5);
        ctx.lineTo(-12, 9);
        ctx.lineTo(-11, 5);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(12, -1);
        ctx.lineTo(14, 5);
        ctx.lineTo(12, 9);
        ctx.lineTo(11, 5);
        ctx.closePath();
        ctx.fill();

        // Helmet highlight
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.beginPath();
        ctx.ellipse(-2, -5, 6, 4, -0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // ── Weapon shape ──────────────────────────────────────────────
    _drawWeaponShape(ctx, wi) {
        const glows = ['#ccccff','#ff4400','#ff8800','#00ddff','#ffdd00','#dd00ff'];
        ctx.shadowColor = glows[Math.min(wi, 5)];
        ctx.shadowBlur  = this.state === 'attack' ? 20 : (this.state === 'skill' ? 30 : 10);

        switch (wi) {
            case 0: { // Wooden sword
                ctx.fillStyle = '#8b6914';
                ctx.fillRect(-2, -28, 5, 28);
                // Guard
                ctx.fillStyle = '#aa8833';
                ctx.fillRect(-6, -5, 13, 4);
                // Handle wrap
                ctx.fillStyle = '#554411';
                ctx.fillRect(-1, -3, 3, 4);
                break;
            }
            case 1: { // Iron sword
                // Blade
                ctx.fillStyle = '#ccd5e0';
                ctx.beginPath();
                ctx.moveTo(-2, -34);
                ctx.lineTo(3, -34);
                ctx.lineTo(4, 0);
                ctx.lineTo(-3, 0);
                ctx.closePath();
                ctx.fill();
                // Blade edge
                ctx.fillStyle = '#eef0ff';
                ctx.fillRect(-1, -32, 2, 28);
                // Guard
                ctx.fillStyle = '#cc9900';
                ctx.fillRect(-7, -4, 15, 5);
                // Pommel
                ctx.fillStyle = '#886600';
                ctx.beginPath();
                ctx.arc(0, 6, 5, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
            case 2: { // Fire spear
                // Shaft
                ctx.fillStyle = '#663311';
                ctx.fillRect(-2, -38, 5, 48);
                // Tip flame
                ctx.fillStyle = '#ff4400';
                ctx.shadowBlur = 18;
                ctx.beginPath();
                ctx.moveTo(0, -38);
                ctx.lineTo(-6, -24);
                ctx.lineTo(7, -24);
                ctx.closePath();
                ctx.fill();
                // Inner flame
                ctx.fillStyle = '#ffcc00';
                ctx.beginPath();
                ctx.moveTo(0, -38);
                ctx.lineTo(-2, -28);
                ctx.lineTo(3, -28);
                ctx.closePath();
                ctx.fill();
                // Flames flicker
                ctx.globalAlpha = 0.6;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(0, -32, 2 + Math.sin(this.capeFlap * 3) * 1.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
                break;
            }
            case 3: { // Crystal sword
                // Crystal blade
                ctx.fillStyle = 'rgba(136,220,255,0.9)';
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.moveTo(0, -36);
                ctx.lineTo(-5, -10);
                ctx.lineTo(0, -4);
                ctx.lineTo(6, -10);
                ctx.closePath();
                ctx.fill();
                // Inner glow
                ctx.fillStyle = 'rgba(0,240,255,0.7)';
                ctx.beginPath();
                ctx.moveTo(0, -33);
                ctx.lineTo(-2, -12);
                ctx.lineTo(0, -7);
                ctx.lineTo(3, -12);
                ctx.closePath();
                ctx.fill();
                // Sparkles
                ctx.fillStyle = '#ffffff';
                for (let s = 0; s < 3; s++) {
                    const sx = Math.sin(this.capeFlap * 2 + s * 2.1) * 5;
                    const sy = -28 + s * 10;
                    ctx.globalAlpha = 0.6 + Math.sin(this.capeFlap + s) * 0.4;
                    ctx.beginPath();
                    ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
                // Guard
                ctx.fillStyle = '#55aacc';
                ctx.fillRect(-8, -6, 17, 4);
                break;
            }
            case 4: { // Lightning sword
                // Chain lightning blade
                ctx.strokeStyle = '#ffff00';
                ctx.lineWidth = 3;
                ctx.shadowBlur = 22;
                ctx.shadowColor = '#ffff00';
                ctx.beginPath();
                ctx.moveTo(0, -36);
                for (let seg = 0; seg < 6; seg++) {
                    const jitter = Math.sin(this.capeFlap * 5 + seg) * 3;
                    ctx.lineTo(jitter, -36 + (seg + 1) * 8);
                }
                ctx.stroke();
                // Outer blade shape
                ctx.fillStyle = '#aadd00';
                ctx.globalAlpha = 0.7;
                ctx.beginPath();
                ctx.moveTo(-3, -36);
                ctx.lineTo(-2, -10);
                ctx.lineTo(3, -10);
                ctx.lineTo(4, -36);
                ctx.closePath();
                ctx.fill();
                ctx.globalAlpha = 1;
                // Guard with bolts
                ctx.fillStyle = '#ccaa00';
                ctx.fillRect(-9, -8, 19, 5);
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(-8, -6); ctx.lineTo(-5, -4); ctx.lineTo(-7, -2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(8, -6); ctx.lineTo(5, -4); ctx.lineTo(7, -2);
                ctx.stroke();
                break;
            }
            case 5: { // Void blade
                // Dark matter blade
                ctx.fillStyle = '#1a0033';
                ctx.shadowColor = '#cc00ff';
                ctx.shadowBlur = 25;
                ctx.beginPath();
                ctx.moveTo(0, -40);
                ctx.bezierCurveTo(-8, -25, -5, -10, 0, -3);
                ctx.bezierCurveTo(5, -10, 8, -25, 0, -40);
                ctx.closePath();
                ctx.fill();
                // Void energy
                ctx.fillStyle = '#8800ff';
                ctx.globalAlpha = 0.8;
                ctx.beginPath();
                ctx.moveTo(0, -38);
                ctx.bezierCurveTo(-4, -25, -2, -12, 0, -6);
                ctx.bezierCurveTo(2, -12, 4, -25, 0, -38);
                ctx.fill();
                ctx.globalAlpha = 1;
                // Orbiting void orbs
                for (let o = 0; o < 3; o++) {
                    const oa = this.capeFlap * 2.5 + (o * Math.PI * 2 / 3);
                    ctx.fillStyle = ['#ff00ff','#8800ff','#4400cc'][o];
                    ctx.globalAlpha = 0.8;
                    ctx.shadowColor = '#ff00ff';
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.arc(Math.cos(oa) * 8, -20 + Math.sin(oa) * 6, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
                // Crossguard
                ctx.fillStyle = '#330055';
                ctx.fillRect(-10, -5, 21, 5);
                ctx.fillStyle = '#660088';
                ctx.fillRect(-9, -4, 19, 3);
                break;
            }
        }
        ctx.shadowBlur = 0;
    }
}

// ============================
// ENEMY CLASS
// ============================
class Enemy {
    constructor(x, y, type, level, difficultyMult) {
        this.x = x; this.y = y;
        this.type = type;
        this.w = 36; this.h = 50;
        this.vx = 0; this.vy = 0;
        this.onGround = false;
        this.facing = -1;
        this.state = 'idle'; // idle, patrol, run, attack, windup, hurt, dead
        this.stateTimer = 0;

        // ── Continuous animation time ──────────────────────────────
        this.animTime = 0;
        this.animFrame = 0;
        this.animTimer = 0;

        // ── Squash & Stretch ───────────────────────────────────────
        this.scaleX = 1; this.scaleY = 1;
        this.targetScaleX = 1; this.targetScaleY = 1;
        this.landingTimer = 0;

        // ── Body tilt / bob ────────────────────────────────────────
        this.bodyTilt = 0;
        this.headBob  = 0;

        // ── Limb angles ────────────────────────────────────────────
        this.leftArmAngle  = 0;
        this.rightArmAngle = 0;
        this.leftLegAngle  = 0;
        this.rightLegAngle = 0;
        this.foreArmAngle  = 0.2;
        this.weaponAngle   = 0;

        // ── Death tumble ───────────────────────────────────────────
        this.deathSpin   = 0;
        this.deathSpinV  = 0;

        // ── Personality (per-type movement flavour) ────────────────
        // runFreq: leg cycle speed, runAmp: swing width, jumpChance: frequency
        const personality = {
            goblin:   { runFreq: 0.44, runAmp: 0.85, jumpChance: 0.008, aggroRange: 280, attackCD: 55 },
            orc:      { runFreq: 0.22, runAmp: 0.60, jumpChance: 0.003, aggroRange: 260, attackCD: 80 },
            skeleton: { runFreq: 0.36, runAmp: 0.75, jumpChance: 0.005, aggroRange: 300, attackCD: 50 },
            demon:    { runFreq: 0.32, runAmp: 0.95, jumpChance: 0.010, aggroRange: 340, attackCD: 45 },
            wizard:   { runFreq: 0.28, runAmp: 0.55, jumpChance: 0.002, aggroRange: 380, attackCD: 90 },
        };
        this.pers = personality[type] || personality.goblin;

        const mult = 1 + (level - 1) * 0.35 * difficultyMult;
        this.maxHp = Math.floor((60 + level * 25) * mult);
        this.hp    = this.maxHp;
        this.atk   = Math.floor((15 + level * 8) * mult);
        this.speed = (1.5 + level * 0.2) * Math.min(difficultyMult, 2.5);
        this.attackRange    = 58;
        this.attackCooldown = 0;
        this.attackCooldownMax = Math.max(25, this.pers.attackCD - level * 2);
        this.aggroRange = this.pers.aggroRange;
        this.isDead     = false;
        this.deathTimer = 0;
        this.score = 10 + level * 5;

        // ── Wizard-specific spell charge ───────────────────────────
        this.spellCharge = 0;
        this.isCharging  = false;

        // ── Patrol state ───────────────────────────────────────────
        this.patrolDir   = Math.random() < 0.5 ? 1 : -1;
        this.patrolTimer = 60 + Math.random() * 80;
        this.isPatrolling = false;
        this.wasOnGround  = false;
    }

    update(heroX, heroY, groundY, canvasW) {
        this.animTime++;
        this.animTimer++;
        if (this.animTimer >= 7) { this.animTimer = 0; this.animFrame = (this.animFrame + 1) % 4; }

        // ── Death tumble ────────────────────────────────────────────
        if (this.isDead) {
            this.deathTimer++;
            this.deathSpin += this.deathSpinV;
            this.deathSpinV *= 0.94;
            this.vy += GRAVITY * 0.6;
            this.y  += this.vy;
            this.x  += this.vx;
            this.vx *= 0.88;
            if (this.y + this.h > groundY) { this.y = groundY - this.h; this.vy *= -0.25; this.vx *= 0.6; }
            return;
        }

        if (this.stateTimer > 0) { this.stateTimer--; }
        if (this.attackCooldown > 0) this.attackCooldown--;

        // ── AI decision ─────────────────────────────────────────────
        const dx   = heroX - (this.x + this.w / 2);
        const dist = Math.abs(dx);

        if (dist < this.aggroRange) {
            this.isPatrolling = false;
            this.facing = dx > 0 ? 1 : -1;

            if (this.stateTimer <= 0) {
                if (dist > this.attackRange + 10) {
                    this.state = 'run';
                    this.vx    = this.facing * this.speed;
                } else {
                    this.state = 'idle';
                    this.vx   *= 0.7;
                    // Wind up before attack
                    if (this.attackCooldown <= 0) {
                        this.state = 'windup';
                        this.stateTimer = 14;
                    }
                }
            }

            // Random jump (goblin & demon jump more)
            if (this.onGround && Math.random() < this.pers.jumpChance) {
                this.vy = JUMP_FORCE * (0.75 + Math.random() * 0.2);
                this.onGround = false;
                this.targetScaleX = 1.35; this.targetScaleY = 0.7; this.landingTimer = 5;
            }
        } else {
            // Patrol when idle
            if (this.onGround) {
                this.patrolTimer--;
                if (this.patrolTimer <= 0) {
                    this.patrolDir   = -this.patrolDir;
                    this.patrolTimer = 60 + Math.random() * 80;
                    this.isPatrolling = !this.isPatrolling;
                }
                if (this.isPatrolling) {
                    this.facing = this.patrolDir;
                    this.vx = this.patrolDir * this.speed * 0.4;
                    this.state = 'run';
                } else {
                    this.state = 'idle';
                    this.vx  *= 0.7;
                }
            }
        }

        // ── Physics ─────────────────────────────────────────────────
        this.vy += GRAVITY;
        this.x  += this.vx;
        this.y  += this.vy;

        this.wasOnGround = this.onGround;
        if (this.y + this.h >= groundY) {
            if (!this.wasOnGround && Math.abs(this.vy) > 4) {
                const impact = Math.min(Math.abs(this.vy) / 18, 1);
                this.targetScaleX = 1 + impact * 0.35;
                this.targetScaleY = 1 - impact * 0.28;
                this.landingTimer = 8;
            }
            this.y = groundY - this.h;
            this.vy = 0;
            this.onGround = true;
        } else {
            this.onGround = false;
        }
        this.x = Math.max(5, Math.min(canvasW - this.w - 5, this.x));

        // ── Squash & Stretch easing ─────────────────────────────────
        if (this.landingTimer > 0) {
            this.scaleX += (this.targetScaleX - this.scaleX) * 0.4;
            this.scaleY += (this.targetScaleY - this.scaleY) * 0.4;
            this.landingTimer--;
        } else {
            const stretchY = !this.onGround ? (this.vy < 0 ? 1.12 : 1.06) : 1;
            this.scaleX += (1 / stretchY - this.scaleX) * 0.1;
            this.scaleY += (stretchY     - this.scaleY) * 0.1;
        }
        this.scaleX = Math.max(0.65, Math.min(1.55, this.scaleX));
        this.scaleY = Math.max(0.65, Math.min(1.55, this.scaleY));

        // ── Body tilt ───────────────────────────────────────────────
        let targetTilt = 0;
        if (this.state === 'run') targetTilt = this.facing * 0.14;
        if (this.state === 'windup' || this.state === 'attack') targetTilt = this.facing * 0.22;
        this.bodyTilt += (targetTilt - this.bodyTilt) * 0.15;

        // ── Head bob ────────────────────────────────────────────────
        const spd = Math.abs(this.vx) / this.speed;
        if (this.state === 'run') {
            this.headBob = Math.sin(this.animTime * this.pers.runFreq) * 2.8 * spd;
        } else if (this.state === 'idle') {
            this.headBob = Math.sin(this.animTime * 0.06) * 1.2;
        } else {
            this.headBob *= 0.82;
        }

        // ── Limb update ─────────────────────────────────────────────
        this._updateLimbs(spd);

        // ── Wizard spell charge ─────────────────────────────────────
        if (this.type === 'wizard' && this.state === 'windup') {
            this.spellCharge = Math.min(1, this.spellCharge + 0.07);
        } else {
            this.spellCharge *= 0.9;
        }
    }

    _updateLimbs(spd) {
        const t = this.animTime;
        switch (this.state) {
            case 'idle': {
                // Gentle idle sway — orcs sway slowly, goblins faster
                const freq  = this.type === 'orc' ? 0.04 : 0.07;
                const breathe = Math.sin(t * freq);
                this.leftArmAngle  += (breathe * 0.15  - this.leftArmAngle)  * 0.08;
                this.rightArmAngle += (-breathe * 0.10 - this.rightArmAngle) * 0.08;
                this.leftLegAngle  += (0 - this.leftLegAngle)  * 0.1;
                this.rightLegAngle += (0 - this.rightLegAngle) * 0.1;
                this.foreArmAngle  += (0.18 - this.foreArmAngle) * 0.07;
                this.weaponAngle   += (-0.05 - this.weaponAngle) * 0.08;
                break;
            }
            case 'run': {
                // Each type has a different run rhythm
                const cycle = t * this.pers.runFreq;
                const amp   = this.pers.runAmp;
                const swing = Math.sin(cycle) * amp * Math.max(spd, 0.4);
                this.leftArmAngle  = swing * 0.9;
                this.rightArmAngle = -swing * 0.9;
                this.leftLegAngle  = -swing;
                this.rightLegAngle = swing;
                this.foreArmAngle  = Math.abs(Math.sin(cycle)) * 0.45 + 0.1;
                this.weaponAngle   = Math.sin(cycle * 0.5) * 0.2;
                break;
            }
            case 'windup': {
                // Raise weapon arm back before striking
                const prog = 1 - this.stateTimer / 14;
                if (this.type === 'wizard') {
                    // Wizard charges both hands forward
                    this.rightArmAngle += (-1.2 - this.rightArmAngle) * 0.25;
                    this.leftArmAngle  += (-1.0 - this.leftArmAngle)  * 0.25;
                    this.foreArmAngle  += (1.1  - this.foreArmAngle)  * 0.25;
                } else if (this.type === 'orc') {
                    // Orc raises club high and slow
                    this.rightArmAngle += (-1.5 - this.rightArmAngle) * 0.2;
                    this.foreArmAngle  += (0.8  - this.foreArmAngle)  * 0.2;
                    this.weaponAngle   += (-0.9 - this.weaponAngle)   * 0.2;
                    this.leftArmAngle  += (-0.3 - this.leftArmAngle)  * 0.15;
                } else {
                    // Standard wind-up
                    this.rightArmAngle += (-1.3 - this.rightArmAngle) * 0.28;
                    this.foreArmAngle  += (0.7  - this.foreArmAngle)  * 0.28;
                    this.weaponAngle   += (-0.8 - this.weaponAngle)   * 0.28;
                    this.leftArmAngle  += (0.2  - this.leftArmAngle)  * 0.2;
                }
                this.leftLegAngle  += (0.15  - this.leftLegAngle)  * 0.15;
                this.rightLegAngle += (-0.15 - this.rightLegAngle) * 0.15;
                break;
            }
            case 'attack': {
                // Snap arm forward on strike
                const prog = 1 - this.stateTimer / 18;
                if (this.type === 'wizard') {
                    this.rightArmAngle += (0.5  - this.rightArmAngle) * 0.4;
                    this.leftArmAngle  += (0.3  - this.leftArmAngle)  * 0.4;
                    this.foreArmAngle  += (-0.2 - this.foreArmAngle)  * 0.4;
                } else {
                    this.rightArmAngle += (1.0  - this.rightArmAngle) * 0.45;
                    this.foreArmAngle  += (-0.3 - this.foreArmAngle)  * 0.45;
                    this.weaponAngle   += (0.6  - this.weaponAngle)   * 0.45;
                    this.leftArmAngle  += (-0.4 - this.leftArmAngle)  * 0.3;
                }
                break;
            }
            case 'hurt': {
                // Snap both arms out on hit
                this.leftArmAngle  += (1.0  - this.leftArmAngle)  * 0.4;
                this.rightArmAngle += (-0.8 - this.rightArmAngle) * 0.4;
                this.foreArmAngle  += (0.5  - this.foreArmAngle)  * 0.4;
                this.leftLegAngle  += (0.3  - this.leftLegAngle)  * 0.25;
                this.rightLegAngle += (-0.3 - this.rightLegAngle) * 0.25;
                break;
            }
        }
    }

    canAttack(heroX, heroY) {
        if (this.isDead || this.attackCooldown > 0) return false;
        const dist = Math.abs((this.x + this.w / 2) - heroX);
        return dist < this.attackRange + 20;
    }

    doAttack() {
        this.attackCooldown = this.attackCooldownMax;
        this.state      = 'attack';
        this.stateTimer = 18;
        // Attack squash
        this.targetScaleX = 1.3; this.targetScaleY = 0.75; this.landingTimer = 5;
        return this.atk;
    }

    takeDamage(dmg) {
        if (this.isDead) return;
        this.hp = Math.max(0, this.hp - dmg);
        this.state      = 'hurt';
        this.stateTimer = 10;
        // Hurt squash
        this.targetScaleX = 1.4; this.targetScaleY = 0.7; this.landingTimer = 6;
        this.vx = -this.facing * 2.5;
        if (this.hp <= 0) this.die();
    }

    die() {
        this.isDead    = true;
        this.deathTimer = 0;
        this.vy = -(4 + Math.random() * 3);
        this.vx =  this.facing * -(1 + Math.random() * 2);
        this.deathSpinV = (Math.random() - 0.5) * 0.3;
    }

    draw(ctx) {
        if (this.isDead && this.deathTimer > 45) return;

        // Colour palette per type
        const PAL = {
            goblin:   { body:'#1a8c1a', skin:'#2db82d', armor:'#145214', eye:'#ff2200', wpn:'#778866' },
            orc:      { body:'#2a6e2a', skin:'#3a9a3a', armor:'#1a4a1a', eye:'#ffaa00', wpn:'#886644' },
            skeleton: { body:'#c8b89a', skin:'#ddd0b8', armor:'#7a7a8a', eye:'#ff0000', wpn:'#aaaaaa' },
            demon:    { body:'#8c1a1a', skin:'#b82222', armor:'#5a0a0a', eye:'#ff4400', wpn:'#551111' },
            wizard:   { body:'#5a1a8c', skin:'#7a2ab0', armor:'#3a0a5a', eye:'#ffdd00', wpn:'#8844cc' },
        };
        const p = PAL[this.type] || PAL.goblin;

        ctx.save();

        if (this.isDead) {
            // Fade and spin on death
            ctx.globalAlpha = Math.max(0, 1 - this.deathTimer / 45);
            ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
            ctx.rotate(this.deathSpin);
            ctx.scale(1, 1);
        } else {
            ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
            if (this.facing === -1) ctx.scale(-1, 1);
            ctx.scale(this.scaleX, this.scaleY);
            ctx.rotate(this.bodyTilt);
        }

        const bob = this.headBob;

        // ── Shadow ──────────────────────────────────────────────────
        if (!this.isDead) {
            ctx.save();
            ctx.globalAlpha = 0.22;
            ctx.fillStyle = '#000';
            ctx.scale(1 / this.scaleX, 1);
            ctx.beginPath();
            ctx.ellipse(0, this.h / 2 - 2, 14 * this.scaleX, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // ── Back arm ────────────────────────────────────────────────
        this._drawEnemyArm(ctx, -9, -3 + bob, this.leftArmAngle, this.foreArmAngle, false, p);

        // ── Legs ────────────────────────────────────────────────────
        this._drawEnemyLeg(ctx, -5,  9 + bob, this.leftLegAngle,  p, false);
        this._drawEnemyLeg(ctx,  5,  9 + bob, this.rightLegAngle, p, true);

        // ── Torso ───────────────────────────────────────────────────
        this._drawEnemyTorso(ctx, bob, p);

        // ── Front arm + weapon ──────────────────────────────────────
        this._drawEnemyArm(ctx,  9, -3 + bob, this.rightArmAngle, this.foreArmAngle, true, p);

        // ── Head ────────────────────────────────────────────────────
        this._drawEnemyHead(ctx, bob, p);

        // ── Wizard spell glow ───────────────────────────────────────
        if (this.type === 'wizard' && this.spellCharge > 0.05) {
            ctx.save();
            ctx.globalAlpha = this.spellCharge * 0.6;
            ctx.fillStyle   = '#aa44ff';
            ctx.shadowColor = '#dd88ff';
            ctx.shadowBlur  = 25;
            ctx.beginPath();
            ctx.arc(0, 0, 18 + this.spellCharge * 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        ctx.restore();

        // ── HP bar ──────────────────────────────────────────────────
        if (!this.isDead && this.hp < this.maxHp) {
            const barW = this.w + 12;
            const barX = this.x + this.w / 2 - barW / 2;
            const barY = this.y - 12;
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.beginPath();
            ctx.roundRect(barX, barY, barW, 5, 2);
            ctx.fill();
            const pct = this.hp / this.maxHp;
            ctx.fillStyle = pct > 0.5 ? '#33ff33' : pct > 0.25 ? '#ffaa00' : '#ff2222';
            ctx.beginPath();
            ctx.roundRect(barX, barY, barW * pct, 5, 2);
            ctx.fill();
        }
    }

    _drawEnemyArm(ctx, ox, oy, upperAngle, foreAngle, isRight, p) {
        ctx.save();
        ctx.translate(ox, oy);
        ctx.rotate(upperAngle);

        // Upper arm
        ctx.fillStyle = p.armor;
        ctx.beginPath();
        ctx.roundRect(-4, 0, 8, 11, 3);
        ctx.fill();
        ctx.fillStyle = p.skin;
        ctx.fillRect(-2, 2, 4, 6);

        ctx.translate(0, 11);
        ctx.rotate(foreAngle * (isRight ? 1 : -1));

        // Forearm
        ctx.fillStyle = p.skin;
        ctx.beginPath();
        ctx.roundRect(-3, 0, 7, 9, 2);
        ctx.fill();

        // Fist
        ctx.fillStyle = p.skin;
        ctx.beginPath();
        ctx.roundRect(-4, 7, 9, 6, 3);
        ctx.fill();

        if (isRight) {
            ctx.translate(0, 10);
            ctx.rotate(this.weaponAngle);
            this._drawEnemyWeapon(ctx, p);
        }

        ctx.restore();
    }

    _drawEnemyLeg(ctx, ox, oy, angle, p, isRight) {
        ctx.save();
        ctx.translate(ox, oy);
        ctx.rotate(angle);

        // Thigh
        ctx.fillStyle = p.armor;
        ctx.beginPath();
        ctx.roundRect(-4, 0, 9, 11, 3);
        ctx.fill();

        ctx.translate(0, 11);
        ctx.rotate(this.foreArmAngle * (isRight ? -0.4 : 0.4));

        // Shin
        ctx.fillStyle = p.body;
        ctx.beginPath();
        ctx.roundRect(-4, 0, 8, 9, 2);
        ctx.fill();

        // Boot
        ctx.fillStyle = '#221100';
        ctx.beginPath();
        ctx.roundRect(-5, 7, 11, 6, 2);
        ctx.fill();

        ctx.restore();
    }

    _drawEnemyTorso(ctx, bob, p) {
        // Main torso
        ctx.fillStyle = p.body;
        ctx.beginPath();
        ctx.roundRect(-10, -10 + bob, 20, 21, 4);
        ctx.fill();

        // Chest
        ctx.fillStyle = p.armor;
        ctx.beginPath();
        ctx.roundRect(-8, -8 + bob, 16, 12, 3);
        ctx.fill();

        // Waist
        ctx.fillStyle = '#111';
        ctx.fillRect(-7, 4 + bob, 14, 2);

        // Chest highlight
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.roundRect(-7, -7 + bob, 8, 5, 2);
        ctx.fill();
    }

    _drawEnemyHead(ctx, bob, p) {
        ctx.save();
        const hurtTilt = this.state === 'hurt' ? 0.3 : 0;
        ctx.translate(0, -22 + bob);
        ctx.rotate(hurtTilt * -this.facing);

        // Neck
        ctx.fillStyle = p.skin;
        ctx.fillRect(-3, 8, 6, 5);

        if (this.type === 'goblin') {
            // Small pointy-eared head
            ctx.fillStyle = p.skin;
            ctx.beginPath();
            ctx.ellipse(0, 4, 9, 11, 0, 0, Math.PI * 2);
            ctx.fill();
            // Ears
            ctx.beginPath();
            ctx.moveTo(-9, 0); ctx.lineTo(-14, -5); ctx.lineTo(-8, -4); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(9, 0);  ctx.lineTo(14, -5);  ctx.lineTo(8, -4);  ctx.fill();
            // Eyes (red glow)
            ctx.fillStyle = p.eye;
            ctx.shadowColor = p.eye; ctx.shadowBlur = 6;
            ctx.fillRect(-6, 0, 4, 3);
            ctx.fillRect(2,  0, 4, 3);
            ctx.shadowBlur = 0;
            // Snout
            ctx.fillStyle = '#1a7a1a';
            ctx.beginPath();
            ctx.ellipse(0, 7, 5, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.fillRect(-3, 6, 2, 2); ctx.fillRect(1, 6, 2, 2);

        } else if (this.type === 'orc') {
            // Big brutish head with tusks
            ctx.fillStyle = p.skin;
            ctx.beginPath();
            ctx.ellipse(0, 4, 12, 13, 0, 0, Math.PI * 2);
            ctx.fill();
            // Brow ridge
            ctx.fillStyle = p.armor;
            ctx.beginPath();
            ctx.roundRect(-11, -3, 22, 6, 2);
            ctx.fill();
            // Eyes
            ctx.fillStyle = p.eye;
            ctx.shadowColor = p.eye; ctx.shadowBlur = 5;
            ctx.fillRect(-7, -2, 5, 4);
            ctx.fillRect(2, -2, 5, 4);
            ctx.shadowBlur = 0;
            // Tusks
            ctx.fillStyle = '#eeddaa';
            ctx.beginPath();
            ctx.moveTo(-5, 9); ctx.lineTo(-7, 16); ctx.lineTo(-3, 16); ctx.closePath(); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(5, 9);  ctx.lineTo(7, 16);  ctx.lineTo(3, 16);  ctx.closePath(); ctx.fill();

        } else if (this.type === 'skeleton') {
            // Skull
            ctx.fillStyle = p.skin;
            ctx.beginPath();
            ctx.ellipse(0, 2, 10, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            // Jaw
            ctx.fillStyle = p.body;
            ctx.fillRect(-7, 8, 14, 5);
            ctx.fillStyle = '#000';
            for (let t = -5; t <= 5; t += 4) ctx.fillRect(t - 1, 9, 2, 4);
            // Eye sockets
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.ellipse(-4, 1, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(4,  1, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
            // Glowing eye
            ctx.fillStyle = p.eye;
            ctx.shadowColor = p.eye; ctx.shadowBlur = 8;
            ctx.beginPath(); ctx.arc(-4, 1, 2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(4,  1, 2, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
            // Nose hole
            ctx.fillStyle = '#888';
            ctx.beginPath(); ctx.ellipse(0, 5, 2, 2.5, 0, 0, Math.PI * 2); ctx.fill();

        } else if (this.type === 'demon') {
            // Horned demon head
            ctx.fillStyle = p.skin;
            ctx.beginPath();
            ctx.ellipse(0, 3, 11, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            // Horns
            ctx.fillStyle = '#440000';
            ctx.beginPath(); ctx.moveTo(-7,-6); ctx.lineTo(-12,-18); ctx.lineTo(-2,-8); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(7,-6);  ctx.lineTo(12,-18);  ctx.lineTo(2,-8);  ctx.closePath(); ctx.fill();
            // Eyes
            ctx.fillStyle = p.eye;
            ctx.shadowColor = p.eye; ctx.shadowBlur = 10;
            ctx.beginPath(); ctx.ellipse(-5, 1, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(5,  1, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(-5, 1, 2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(5,  1, 2, 0, Math.PI * 2); ctx.fill();
            // Fangs
            ctx.fillStyle = '#ffeecc';
            ctx.beginPath(); ctx.moveTo(-4,10); ctx.lineTo(-5,15); ctx.lineTo(-2,15); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(4,10);  ctx.lineTo(5,15);  ctx.lineTo(2,15);  ctx.closePath(); ctx.fill();

        } else if (this.type === 'wizard') {
            // Wizard head + hat
            ctx.fillStyle = p.skin;
            ctx.beginPath();
            ctx.ellipse(0, 4, 9, 11, 0, 0, Math.PI * 2);
            ctx.fill();
            // Long beard
            ctx.fillStyle = '#ccccdd';
            ctx.beginPath();
            ctx.moveTo(-5, 10); ctx.quadraticCurveTo(-6, 20, -2, 22);
            ctx.lineTo(2, 22); ctx.quadraticCurveTo(6, 20, 5, 10); ctx.closePath();
            ctx.fill();
            // Tall hat
            ctx.fillStyle = p.armor;
            ctx.beginPath();
            ctx.moveTo(-11, -4); ctx.lineTo(11, -4);
            ctx.lineTo(7, -22); ctx.lineTo(-7, -22); ctx.closePath();
            ctx.fill();
            // Hat brim
            ctx.fillStyle = p.body;
            ctx.fillRect(-12, -6, 24, 4);
            // Hat star
            ctx.fillStyle = '#ffdd00';
            ctx.shadowColor = '#ffdd00'; ctx.shadowBlur = 6;
            ctx.font = '9px Arial'; ctx.textAlign = 'center';
            ctx.fillText('★', 0, -12);
            ctx.shadowBlur = 0;
            // Eyes
            ctx.fillStyle = p.eye;
            ctx.shadowColor = p.eye; ctx.shadowBlur = 8;
            ctx.fillRect(-5, 0, 4, 3);
            ctx.fillRect(1, 0, 4, 3);
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    }

    _drawEnemyWeapon(ctx, p) {
        ctx.shadowColor = p.wpn;
        ctx.shadowBlur  = this.state === 'attack' ? 15 : 6;

        switch (this.type) {
            case 'goblin': {
                // Short rusty dagger
                ctx.fillStyle = '#887755';
                ctx.fillRect(-2, -18, 4, 16);
                ctx.fillStyle = '#aaa';
                ctx.fillRect(-1, -20, 3, 6);
                ctx.fillStyle = '#553300';
                ctx.fillRect(-3, -5, 7, 3);
                break;
            }
            case 'orc': {
                // Heavy club / axe
                ctx.fillStyle = '#663300';
                ctx.fillRect(-2, -22, 5, 26);
                ctx.fillStyle = '#888';
                ctx.beginPath();
                ctx.moveTo(3, -22); ctx.lineTo(12, -16); ctx.lineTo(12, -8); ctx.lineTo(3, -10);
                ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#aaa';
                ctx.fillRect(3, -20, 5, 4);
                break;
            }
            case 'skeleton': {
                // Bone sword
                ctx.fillStyle = '#ddd0b8';
                ctx.fillRect(-2, -24, 5, 24);
                ctx.fillStyle = '#bba';
                ctx.fillRect(-5, -5, 11, 3);
                ctx.beginPath();
                ctx.arc(0, -24, 3, 0, Math.PI * 2); ctx.fill();
                break;
            }
            case 'demon': {
                // Dark trident
                ctx.fillStyle = '#330000';
                ctx.fillRect(-2, -26, 4, 28);
                ctx.fillStyle = '#880000';
                ctx.fillRect(-6, -26, 4, 8);
                ctx.fillRect(2, -26, 4, 8);
                ctx.fillRect(-2, -30, 4, 8);
                ctx.fillStyle = '#ff3300';
                ctx.shadowBlur = 12;
                ctx.fillRect(-1, -30, 2, 5);
                ctx.fillRect(-5, -26, 2, 4);
                ctx.fillRect(3, -26, 2, 4);
                ctx.shadowBlur = 0;
                break;
            }
            case 'wizard': {
                // Magic staff with orb
                ctx.fillStyle = '#5500aa';
                ctx.fillRect(-2, -30, 4, 34);
                ctx.fillStyle = '#aa44ff';
                ctx.shadowColor = '#dd88ff';
                ctx.shadowBlur = 14 + Math.sin(this.animTime * 0.1) * 5;
                ctx.beginPath();
                ctx.arc(0, -30, 6 + Math.sin(this.animTime * 0.08) * 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.globalAlpha = 0.7;
                ctx.beginPath();
                ctx.arc(-2, -32, 2, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 1;
                ctx.shadowBlur = 0;
                break;
            }
        }
        ctx.shadowBlur = 0;
    }
}

// ============================
// BOSS CLASS
// ============================
class Boss {
    constructor(bossData, level, difficultyMult, x, groundY) {
        this.data = bossData;
        this.x = x;
        this.groundY = groundY;
        this.w = bossData.size;
        this.h = bossData.size * 1.2;
        this.y = groundY - this.h;
        this.vx = 0;
        this.vy = 0;
        this.onGround = true;
        this.facing = -1;

        const mult = difficultyMult * (1 + (level - 1) * 0.2);
        this.maxHp = Math.floor(bossData.hp * mult);
        this.hp = this.maxHp;
        this.atk = Math.floor(bossData.atk * mult);
        this.speed = bossData.speed * Math.min(mult, 2.5);

        this.phase = 1;
        this.maxPhases = bossData.phases;
        this.attackCooldown = 0;
        this.attackCooldownMax = 60;
        this.specialCooldown = 0;
        this.specialCooldownMax = 180;
        this.isDead = false;
        this.deathTimer = 0;
        this.animFrame = 0;
        this.animTimer = 0;
        this.projectiles = [];
        this.isEnraged = false;
        this.enrageTimer = 0;
        this.jumpTimer = 0;
    }

    update(heroX, heroY, canvasW) {
        if (this.isDead) {
            this.deathTimer++;
            return;
        }

        // Phase check
        const hpPct = this.hp / this.maxHp;
        if (this.maxPhases >= 2 && hpPct < 0.5 && this.phase < 2) { this.phase = 2; this.isEnraged = true; }
        if (this.maxPhases >= 3 && hpPct < 0.25 && this.phase < 3) { this.phase = 3; }
        if (this.maxPhases >= 4 && hpPct < 0.1 && this.phase < 4) { this.phase = 4; }

        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.specialCooldown > 0) this.specialCooldown--;
        if (this.jumpTimer > 0) this.jumpTimer--;
        if (this.enrageTimer > 0) this.enrageTimer--;

        // Movement
        const dx = heroX - (this.x + this.w / 2);
        this.facing = dx > 0 ? 1 : -1;
        const dist = Math.abs(dx);
        const speedMult = this.isEnraged ? 1.5 : 1;

        if (dist > 80) {
            this.vx = this.facing * this.speed * speedMult;
        } else {
            this.vx *= 0.8;
        }

        // Jump attack
        if (this.onGround && this.jumpTimer <= 0 && dist > 150 && Math.random() < 0.01 * this.phase) {
            this.vy = JUMP_FORCE * 1.2;
            this.onGround = false;
            this.jumpTimer = 120;
        }

        // Physics
        this.vy += GRAVITY * 0.9;
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.85;

        if (this.y + this.h >= this.groundY) {
            this.y = this.groundY - this.h;
            this.vy = 0;
            this.onGround = true;
        }

        this.x = Math.max(10, Math.min(canvasW - this.w - 10, this.x));

        // Projectiles update
        this.projectiles = this.projectiles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            return p.life > 0 && p.x > 0 && p.x < canvasW;
        });

        // Animation
        this.animTimer++;
        if (this.animTimer >= 5) { this.animTimer = 0; this.animFrame = (this.animFrame + 1) % 4; }
    }

    canAttack(heroX, heroY) {
        if (this.isDead || this.attackCooldown > 0) return false;
        const dist = Math.abs((this.x + this.w / 2) - heroX);
        return dist < 80 + this.w / 2;
    }

    doAttack() {
        this.attackCooldown = Math.max(20, this.attackCooldownMax - this.phase * 10);
        return this.atk * (this.isEnraged ? 1.3 : 1);
    }

    canSpecial() {
        return !this.isDead && this.specialCooldown <= 0 && this.phase >= 2;
    }

    doSpecial(heroX, heroY) {
        this.specialCooldown = this.specialCooldownMax;
        const count = this.phase === 4 ? 8 : this.phase === 3 ? 5 : 3;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
            this.projectiles.push({
                x: this.x + this.w / 2,
                y: this.y + this.h / 2,
                vx: Math.cos(angle) * 5,
                vy: Math.sin(angle) * 5,
                dmg: this.atk * 0.6,
                color: this.data.color,
                life: 80,
                r: 8,
            });
        }
    }

    takeDamage(dmg) {
        if (this.isDead) return;
        this.hp = Math.max(0, this.hp - dmg);
        this.enrageTimer = 10;
        if (this.hp <= 0) { this.isDead = true; this.deathTimer = 0; }
    }

    draw(ctx) {
        const c = this.data.color;
        const bob = Math.sin(this.animFrame * Math.PI / 2) * (this.isEnraged ? 4 : 2);
        const enrageGlow = this.enrageTimer > 0 ? this.enrageTimer / 10 : 0;

        ctx.save();
        ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
        if (this.facing === -1) ctx.scale(-1, 1);

        // Glow effect
        ctx.shadowColor = c;
        ctx.shadowBlur = 20 + enrageGlow * 30;

        // Death animation
        if (this.isDead) {
            ctx.globalAlpha = Math.max(0, 1 - this.deathTimer / 60);
            ctx.scale(1 + this.deathTimer * 0.02, 1 + this.deathTimer * 0.02);
        }

        // Phase aura
        if (this.phase >= 2) {
            ctx.save();
            ctx.globalAlpha = 0.3 + Math.sin(this.animFrame) * 0.1;
            ctx.fillStyle = c;
            ctx.beginPath();
            ctx.arc(0, 0, this.w * 0.7, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        if (this.phase >= 3) {
            ctx.save();
            ctx.globalAlpha = 0.2;
            ctx.strokeStyle = c;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, this.w + 5 + Math.sin(Date.now() * 0.01) * 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Body based on boss type
        const bossIndex = BOSSES.indexOf(this.data) % BOSSES.length;
        this.drawBossBody(ctx, bossIndex, c, bob);

        ctx.restore();

        // Draw projectiles
        this.projectiles.forEach(p => {
            ctx.save();
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 15;
            ctx.globalAlpha = p.life / 80;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            // Inner glow
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    drawBossBody(ctx, bossIndex, c, bob) {
        const s = this.w / 70;
        ctx.scale(s, s);
        ctx.fillStyle = c;

        switch (bossIndex % 5) {
            case 0: { // Goblin King
                // Crown
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.moveTo(-20, -40 + bob);
                ctx.lineTo(-25, -55 + bob);
                ctx.lineTo(-12, -45 + bob);
                ctx.lineTo(0, -58 + bob);
                ctx.lineTo(12, -45 + bob);
                ctx.lineTo(25, -55 + bob);
                ctx.lineTo(20, -40 + bob);
                ctx.closePath();
                ctx.fill();
                // Body
                ctx.fillStyle = '#22bb22';
                ctx.beginPath();
                ctx.roundRect(-20, -15 + bob, 40, 35, 6);
                ctx.fill();
                // Belly
                ctx.fillStyle = '#33cc33';
                ctx.beginPath();
                ctx.ellipse(0, 5 + bob, 12, 10, 0, 0, Math.PI * 2);
                ctx.fill();
                // Arms
                ctx.fillStyle = '#22bb22';
                ctx.fillRect(-30, -10 + bob, 12, 22);
                ctx.fillRect(18, -10 + bob, 12, 22);
                // Legs
                ctx.fillStyle = '#1a991a';
                ctx.fillRect(-16, 20 + bob, 13, 20);
                ctx.fillRect(3, 20 + bob, 13, 20);
                // Head
                ctx.fillStyle = '#22dd22';
                ctx.beginPath();
                ctx.ellipse(0, -32 + bob, 22, 20, 0, 0, Math.PI * 2);
                ctx.fill();
                // Eyes
                ctx.fillStyle = '#ff0000';
                ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 8;
                ctx.fillRect(-10, -37 + bob, 8, 7);
                ctx.fillRect(2, -37 + bob, 8, 7);
                ctx.shadowBlur = 0;
                // Teeth
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-8, -20 + bob, 4, 6);
                ctx.fillRect(4, -20 + bob, 4, 6);
                break;
            }
            case 1: { // Fire Titan
                // Body
                ctx.fillStyle = '#ff4400';
                ctx.beginPath();
                ctx.roundRect(-25, -20 + bob, 50, 45, 8);
                ctx.fill();
                // Lava cracks
                ctx.strokeStyle = '#ffff00';
                ctx.lineWidth = 2;
                ctx.shadowColor = '#ff8800'; ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.moveTo(-15, -5 + bob);
                ctx.lineTo(0, 5 + bob);
                ctx.lineTo(15, -8 + bob);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(-10, 10 + bob);
                ctx.lineTo(10, 18 + bob);
                ctx.stroke();
                ctx.shadowBlur = 0;
                // Arms (boulder)
                ctx.fillStyle = '#cc3300';
                ctx.beginPath();
                ctx.arc(-32, 0 + bob, 16, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(32, 0 + bob, 16, 0, Math.PI * 2);
                ctx.fill();
                // Legs
                ctx.fillStyle = '#882200';
                ctx.fillRect(-20, 25 + bob, 16, 22);
                ctx.fillRect(4, 25 + bob, 16, 22);
                // Head
                ctx.fillStyle = '#ff6600';
                ctx.beginPath();
                ctx.arc(0, -35 + bob, 22, 0, Math.PI * 2);
                ctx.fill();
                // Fire hair
                ctx.fillStyle = '#ffff00';
                ctx.shadowColor = '#ff8800'; ctx.shadowBlur = 10;
                for (let i = -15; i <= 15; i += 10) {
                    ctx.beginPath();
                    ctx.moveTo(i, -54 + bob);
                    ctx.lineTo(i - 5, -45 + bob);
                    ctx.lineTo(i + 5, -45 + bob);
                    ctx.fill();
                }
                ctx.shadowBlur = 0;
                // Eyes
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-10, -40 + bob, 8, 7);
                ctx.fillRect(2, -40 + bob, 8, 7);
                break;
            }
            case 2: { // Crystal King
                // Crystal body
                ctx.fillStyle = '#88ddff';
                ctx.beginPath();
                ctx.moveTo(0, -55 + bob);
                ctx.lineTo(-28, -10 + bob);
                ctx.lineTo(-22, 30 + bob);
                ctx.lineTo(0, 40 + bob);
                ctx.lineTo(22, 30 + bob);
                ctx.lineTo(28, -10 + bob);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#00eeff';
                ctx.lineWidth = 2;
                ctx.shadowColor = '#00eeff'; ctx.shadowBlur = 20;
                ctx.stroke();
                // Inner crystal
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.beginPath();
                ctx.moveTo(0, -40 + bob);
                ctx.lineTo(-15, 0 + bob);
                ctx.lineTo(0, 10 + bob);
                ctx.lineTo(15, 0 + bob);
                ctx.closePath();
                ctx.fill();
                // Eye
                ctx.fillStyle = '#00ffff';
                ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.arc(0, -15 + bob, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#000066';
                ctx.beginPath();
                ctx.arc(0, -15 + bob, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                // Arms (crystal shards)
                ctx.fillStyle = '#55ccff';
                ctx.shadowColor = '#00eeff'; ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.moveTo(-28, -15 + bob);
                ctx.lineTo(-45, -25 + bob);
                ctx.lineTo(-40, 5 + bob);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(28, -15 + bob);
                ctx.lineTo(45, -25 + bob);
                ctx.lineTo(40, 5 + bob);
                ctx.closePath();
                ctx.fill();
                ctx.shadowBlur = 0;
                break;
            }
            case 3: { // War God
                // Body (golden armor)
                ctx.fillStyle = '#cc9900';
                ctx.beginPath();
                ctx.roundRect(-24, -22 + bob, 48, 48, 5);
                ctx.fill();
                ctx.fillStyle = '#ffcc00';
                ctx.fillRect(-20, -20 + bob, 40, 20);
                // Lightning bolts
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;
                ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.moveTo(-8, -15 + bob);
                ctx.lineTo(-2, -5 + bob);
                ctx.lineTo(-6, -5 + bob);
                ctx.lineTo(0, 8 + bob);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(8, -15 + bob);
                ctx.lineTo(2, -5 + bob);
                ctx.lineTo(6, -5 + bob);
                ctx.lineTo(0, 8 + bob);
                ctx.stroke();
                ctx.shadowBlur = 0;
                // Arms
                ctx.fillStyle = '#886600';
                ctx.fillRect(-34, -15 + bob, 12, 28);
                ctx.fillRect(22, -15 + bob, 12, 28);
                // Legs
                ctx.fillStyle = '#664400';
                ctx.fillRect(-18, 26 + bob, 14, 22);
                ctx.fillRect(4, 26 + bob, 14, 22);
                // Head (helmet)
                ctx.fillStyle = '#cc9900';
                ctx.beginPath();
                ctx.arc(0, -36 + bob, 22, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffcc00';
                ctx.fillRect(-22, -42 + bob, 44, 14);
                // Visor glow
                ctx.fillStyle = '#ffff00';
                ctx.shadowColor = '#ffff00'; ctx.shadowBlur = 12;
                ctx.fillRect(-15, -40 + bob, 30, 8);
                ctx.shadowBlur = 0;
                break;
            }
            case 4: { // Arch Demon
                // Wings
                ctx.fillStyle = '#330033';
                ctx.beginPath();
                ctx.moveTo(-5, -20 + bob);
                ctx.bezierCurveTo(-40, -50 + bob, -60, -10 + bob, -50, 20 + bob);
                ctx.lineTo(-5, 0 + bob);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(5, -20 + bob);
                ctx.bezierCurveTo(40, -50 + bob, 60, -10 + bob, 50, 20 + bob);
                ctx.lineTo(5, 0 + bob);
                ctx.fill();
                ctx.strokeStyle = '#ff00ff';
                ctx.lineWidth = 1;
                ctx.shadowColor = '#ff00ff'; ctx.shadowBlur = 8;
                ctx.stroke();
                ctx.shadowBlur = 0;
                // Body
                ctx.fillStyle = '#440044';
                ctx.beginPath();
                ctx.roundRect(-22, -20 + bob, 44, 50, 6);
                ctx.fill();
                // Dark energy
                ctx.fillStyle = 'rgba(255,0,255,0.15)';
                ctx.beginPath();
                ctx.ellipse(0, 5 + bob, 15, 18, 0, 0, Math.PI * 2);
                ctx.fill();
                // Arms
                ctx.fillStyle = '#330033';
                ctx.fillRect(-32, -12 + bob, 12, 25);
                ctx.fillRect(20, -12 + bob, 12, 25);
                // Claws
                ctx.fillStyle = '#220022';
                for (let i = -1; i <= 1; i++) {
                    ctx.beginPath();
                    ctx.moveTo(-32 + i * 4, 14 + bob);
                    ctx.lineTo(-34 + i * 4, 22 + bob);
                    ctx.lineTo(-30 + i * 4, 22 + bob);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.moveTo(26 + i * 4, 14 + bob);
                    ctx.lineTo(24 + i * 4, 22 + bob);
                    ctx.lineTo(28 + i * 4, 22 + bob);
                    ctx.fill();
                }
                // Legs
                ctx.fillStyle = '#330033';
                ctx.fillRect(-18, 30 + bob, 14, 22);
                ctx.fillRect(4, 30 + bob, 14, 22);
                // Head
                ctx.fillStyle = '#550055';
                ctx.beginPath();
                ctx.arc(0, -35 + bob, 22, 0, Math.PI * 2);
                ctx.fill();
                // Horns
                ctx.fillStyle = '#880088';
                ctx.beginPath();
                ctx.moveTo(-10, -50 + bob);
                ctx.lineTo(-18, -68 + bob);
                ctx.lineTo(-2, -52 + bob);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(10, -50 + bob);
                ctx.lineTo(18, -68 + bob);
                ctx.lineTo(2, -52 + bob);
                ctx.fill();
                // Eyes
                ctx.fillStyle = '#ff00ff';
                ctx.shadowColor = '#ff00ff'; ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.arc(-8, -38 + bob, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(8, -38 + bob, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(-8, -38 + bob, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(8, -38 + bob, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                break;
            }
        }
    }
}

// ============================
// PROJECTILE CLASS (Hero)
// ============================
class HeroProjectile {
    constructor(x, y, vx, color, dmg, type) {
        this.x = x; this.y = y;
        this.vx = vx; this.vy = 0;
        this.color = color;
        this.dmg = dmg;
        this.type = type;
        this.r = type === 'nova' ? 60 : 12;
        this.life = type === 'nova' ? 30 : 100;
        this.maxLife = this.life;
        this.hit = false;
    }

    update() {
        this.x += this.vx;
        this.life--;
        return this.life > 0 && !this.hit;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20;
        if (this.type === 'nova') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r * (1 - this.life / this.maxLife + 0.3), 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

// ============================
// PICKUP CLASS (HP, Energy)
// ============================
class Pickup {
    constructor(x, y, type) {
        this.x = x; this.y = y;
        this.type = type; // 'hp' or 'energy'
        this.vy = -3;
        this.life = 300;
        this.collected = false;
        this.bob = Math.random() * Math.PI * 2;
    }

    update(groundY) {
        this.vy += 0.2;
        this.y += this.vy;
        if (this.y + 15 > groundY) { this.y = groundY - 15; this.vy = 0; }
        this.life--;
        this.bob += 0.08;
        return this.life > 0 && !this.collected;
    }

    draw(ctx) {
        const bobY = Math.sin(this.bob) * 3;
        ctx.save();
        ctx.shadowColor = this.type === 'hp' ? '#ff3355' : '#00d4ff';
        ctx.shadowBlur = 12;
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.type === 'hp' ? '❤️' : '⚡', this.x, this.y + bobY);
        ctx.restore();
    }
}

// ============================
// BACKGROUND RENDERER
// ============================
class BackgroundRenderer {
    constructor() {
        this.stars = Array.from({length: 60}, () => ({
            x: Math.random(), y: Math.random() * 0.6,
            size: Math.random() * 2 + 0.5,
            twinkle: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.02 + 0.01,
        }));
        this.clouds = Array.from({length: 4}, () => ({
            x: Math.random(),
            y: 0.1 + Math.random() * 0.2,
            w: 80 + Math.random() * 100,
            speed: 0.0001 + Math.random() * 0.0001,
        }));
        this.bgLayers = [
            { elems: Array.from({length: 8}, () => ({ x: Math.random(), size: 30 + Math.random() * 50 })), speed: 0.2 },
            { elems: Array.from({length: 5}, () => ({ x: Math.random(), size: 60 + Math.random() * 80 })), speed: 0.4 },
        ];
        this.scrollX = 0;
    }

    scroll(dx) { this.scrollX += dx * 0.3; }

    draw(ctx, w, h, theme, time) {
        // Sky gradient
        const sky = ctx.createLinearGradient(0, 0, 0, h * 0.75);
        sky.addColorStop(0, theme.bg[0]);
        sky.addColorStop(0.5, theme.bg[1]);
        sky.addColorStop(1, theme.bg[2]);
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h * 0.75);

        // Stars / particles
        this.stars.forEach(s => {
            s.twinkle += s.speed;
            const alpha = 0.4 + Math.sin(s.twinkle) * 0.3;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = theme.accent;
            ctx.shadowColor = theme.accent;
            ctx.shadowBlur = 4;
            ctx.beginPath();
            ctx.arc(s.x * w + (this.scrollX * 0.1) % w, s.y * h * 0.6, s.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // Background mountains/structures
        this.bgLayers.forEach((layer, li) => {
            layer.elems.forEach(el => {
                const x = ((el.x * w + this.scrollX * layer.speed) % (w + el.size * 2)) - el.size;
                ctx.save();
                ctx.fillStyle = li === 0 ? theme.bg[2] : 'rgba(0,0,0,0.3)';
                ctx.globalAlpha = 0.6;
                // Mountain shape
                ctx.beginPath();
                ctx.moveTo(x - el.size / 2, h * 0.75);
                ctx.lineTo(x, h * 0.75 - el.size);
                ctx.lineTo(x + el.size / 2, h * 0.75);
                ctx.fill();
                ctx.restore();
            });
        });

        // Ground
        const gY = h * 0.75;
        const groundGrad = ctx.createLinearGradient(0, gY, 0, h);
        groundGrad.addColorStop(0, theme.ground);
        groundGrad.addColorStop(0.3, this.darken(theme.ground, 0.6));
        groundGrad.addColorStop(1, '#000');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, gY, w, h - gY);

        // Ground detail line
        ctx.strokeStyle = theme.accent;
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, gY);
        ctx.lineTo(w, gY);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Ground texture
        ctx.fillStyle = `rgba(255,255,255,0.05)`;
        for (let i = 0; i < w; i += 40) {
            const rx = ((i + this.scrollX * 1) % (w + 40)) - 20;
            ctx.fillRect(rx, gY + 5, 20, 3);
        }
    }

    darken(hex, factor) {
        const r = parseInt(hex.slice(1,3), 16) * factor;
        const g = parseInt(hex.slice(3,5), 16) * factor;
        const b = parseInt(hex.slice(5,7), 16) * factor;
        return `rgb(${r|0},${g|0},${b|0})`;
    }
}

// ============================
// MAIN GAME CLASS
// ============================
class HeroLegendGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.menuCanvas = document.getElementById('menu-hero-canvas');
        this.menuCtx = this.menuCanvas.getContext('2d');

        this.audio = new AudioEngine();
        this.particles = new ParticleSystem();
        this.bg = new BackgroundRenderer();

        this.state = 'menu'; // menu, playing, paused, gameover, upgrade, victory
        this.currentLevel = 1;
        this.currentWave = 1;
        this.totalWaves = 3;
        this.score = 0;
        this.totalEnemiesKilled = 0;
        this.difficultyMult = 1;
        this.endlessRound = 0; // after level 5

        this.hero = null;
        this.enemies = [];
        this.boss = null;
        this.pickups = [];
        this.heroProjectiles = [];
        this.isBossWave = false;
        this.bossDefeated = false;
        this.waveClearing = false;
        this.waveTimer = 0;
        this.spawnTimer = 0;
        this.spawnInterval = 90;
        this.maxEnemies = 4;
        this.enemiesToSpawn = 8;
        this.enemiesSpawned = 0;

        this.keys = {};
        this.touches = {};

        this.groundY = 0;
        this.lastTime = 0;
        this.rafId = null;

        this.initDOM();
        this.setupEvents();
        this.resizeCanvas();
        this.createMenuParticles();
        this.animateMenu();

        // Show menu
        this.showScreen('main-menu');
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.groundY = this.canvas.height * 0.75;
    }

    initDOM() {
        this.screens = {
            menu: document.getElementById('main-menu'),
            game: document.getElementById('game-screen'),
            help: document.getElementById('help-screen'),
            upgrade: document.getElementById('upgrade-screen'),
            gameover: document.getElementById('gameover-screen'),
            victory: document.getElementById('victory-screen'),
        };

        this.hudHP = document.getElementById('hp-bar');
        this.hudHPText = document.getElementById('hp-text');
        this.hudEnergy = document.getElementById('energy-bar');
        this.hudLevelNum = document.getElementById('level-num');
        this.hudWaveNum = document.getElementById('wave-num');
        this.hudScore = document.getElementById('score-num');
        this.hudWeapon = document.getElementById('weapon-name');
        this.bossHud = document.getElementById('boss-hud');
        this.bossHPBar = document.getElementById('boss-hp-bar');
        this.bossHPText = document.getElementById('boss-hp-text');
        this.bossNameEl = document.getElementById('boss-name');
        this.waveAnnounce = document.getElementById('wave-announcement');
        this.waveText = document.getElementById('wave-text');
        this.damageNumbers = document.getElementById('damage-numbers');
        this.pauseMenu = document.getElementById('pause-menu');
        this.skillSlots = Array.from(document.querySelectorAll('.skill-slot'));
    }

    showScreen(name) {
        Object.values(this.screens).forEach(s => {
            s.classList.remove('active');
            s.style.display = 'none';
        });

        const key = this.screenKey(name);
        const screen = this.screens[key];
        if (!screen) return;

        if (key === 'game') {
            screen.style.display = 'block';
        } else {
            screen.style.display = 'flex';
        }
        screen.classList.add('active');
    }

    screenKey(name) {
        const map = {
            'main-menu': 'menu',
            'help-screen': 'help',
            'upgrade-screen': 'upgrade',
            'gameover-screen': 'gameover',
            'victory-screen': 'victory',
            'game': 'game',
            'menu': 'menu',
            'help': 'help',
            'upgrade': 'upgrade',
            'gameover': 'gameover',
            'victory': 'victory',
        };
        return map[name] || name;
    }

    setupEvents() {
        // Menu buttons
        document.getElementById('btn-play').onclick = () => { this.audio.resume(); this.startNewGame(); };
        document.getElementById('btn-help').onclick = () => { this.showScreen('help-screen'); };
        document.getElementById('btn-back-help').onclick = () => { this.showScreen('main-menu'); };
        document.getElementById('btn-next-level').onclick = () => { this.audio.resume(); this.startLevel(); };
        document.getElementById('btn-retry').onclick = () => { this.audio.resume(); this.startNewGame(); };
        document.getElementById('btn-menu').onclick = () => { this.stopGame(); this.showScreen('main-menu'); };
        document.getElementById('btn-continue-endless').onclick = () => { this.audio.resume(); this.startLevel(); };
        document.getElementById('btn-pause').onclick = () => { this.togglePause(); };
        document.getElementById('btn-resume').onclick = () => { this.togglePause(); };
        document.getElementById('btn-quit').onclick = () => { this.stopGame(); this.showScreen('main-menu'); };

        // Virtual controls
        const controls = document.getElementById('virtual-controls');
        const handleControl = (e, isStart) => {
            e.preventDefault();
            const touches = e.changedTouches || [e];
            for (const touch of touches) {
                const target = touch.target || e.target;
                if (!target) continue;
                const action = target.dataset.action;
                if (action) {
                    this.keys[action] = isStart;
                    if (isStart) {
                        target.classList.add('pressed');
                        this.audio.resume();
                        if (action === 'jump') { if (this.hero) this.hero.jump(this.audio); }
                        if (action === 'skill') { this.handleSkill(); }
                        if (action === 'dash') { if (this.hero) this.hero.dash(this.audio); }
                    } else {
                        target.classList.remove('pressed');
                    }
                }
            }
        };

        controls.addEventListener('touchstart', e => handleControl(e, true), { passive: false });
        controls.addEventListener('touchend', e => handleControl(e, false), { passive: false });
        controls.addEventListener('touchcancel', e => handleControl(e, false), { passive: false });
        controls.addEventListener('mousedown', e => handleControl(e, true));
        controls.addEventListener('mouseup', e => handleControl(e, false));

        // Keyboard
        document.addEventListener('keydown', e => {
            this.keys[e.key] = true;
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { if (this.hero) this.hero.jump(this.audio); }
            if (e.key === 'z' || e.key === 'Z') { this.handleSkill(); }
            if (e.key === 'x' || e.key === 'X' || e.key === 'Shift') { if (this.hero) this.hero.dash(this.audio); }
            if (e.key === 'Escape') this.togglePause();
        });
        document.addEventListener('keyup', e => { this.keys[e.key] = false; });

        window.addEventListener('resize', () => { this.resizeCanvas(); });
    }

    handleSkill() {
        if (!this.hero || this.state !== 'playing') return;
        const result = this.hero.useSkill(this.particles, this.audio);
        if (!result) return;

        const skillName = result.type;
        const dir = result.dir;
        const atk = result.atk;

        // Different skill effects
        if (skillName === 'Tebasan Kuat') {
            const hb = { x: this.hero.x + (dir > 0 ? this.hero.w : -80), y: this.hero.y, w: 80, h: this.hero.h, dmg: atk, isCrit: true };
            this.checkHitWithHitbox(hb);
        } else if (skillName === 'Tembakan Api') {
            this.heroProjectiles.push(new HeroProjectile(
                this.hero.x + this.hero.w / 2, this.hero.y + this.hero.h / 2,
                dir * 9, '#ff4400', atk, 'fire'
            ));
        } else if (skillName === 'Badai Api') {
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    if (!this.hero) return;
                    this.heroProjectiles.push(new HeroProjectile(
                        this.hero.x + this.hero.w / 2, this.hero.y + this.hero.h / 2 - 20,
                        (dir > 0 ? 1 : -1) * (7 + i * 1.5), '#ff6600', atk * 0.5, 'fire'
                    ));
                }, i * 100);
            }
        } else if (skillName === 'Penjara Es') {
            // Freeze all enemies
            this.enemies.forEach(en => { if (!en.isDead) { en.attackCooldown = 150; en.stateTimer = 120; } });
            if (this.boss) { this.boss.attackCooldown = 120; this.boss.specialCooldown = 180; }
            this.particles.skillEffect(this.hero.x + this.hero.w / 2, this.hero.y + this.hero.h / 2, '#00eeff');
        } else if (skillName === 'Hujan Petir') {
            // AOE lightning
            const targets = [...this.enemies, this.boss].filter(Boolean);
            targets.forEach(t => {
                const dmg = Math.floor(atk * 0.8);
                if (!t.isDead && t.hp > 0) {
                    t.takeDamage(dmg);
                    this.showDamageNumber(t.x + (t.w||50)/2, t.y, dmg, 'crit');
                    this.particles.explosion(t.x + (t.w||50)/2, t.y + (t.h||50)/2, '#ffdd00');
                }
            });
        } else if (skillName === 'Nova Kegelapan') {
            this.heroProjectiles.push(new HeroProjectile(
                this.hero.x + this.hero.w / 2, this.hero.y + this.hero.h / 2,
                0, '#8800ff', atk * 1.5, 'nova'
            ));
        }

        this.updateSkillHUD();
    }

    checkHitWithHitbox(hb) {
        this.enemies.forEach(en => {
            if (en.isDead) return;
            if (this.rectsOverlap(hb, en)) {
                en.takeDamage(Math.floor(hb.dmg));
                this.showDamageNumber(en.x + en.w/2, en.y, Math.floor(hb.dmg), hb.isCrit ? 'crit' : 'enemy-dmg');
                this.particles.hitEffect(en.x + en.w/2, en.y + en.h/2, '#fff');
            }
        });
        if (this.boss && !this.boss.isDead) {
            if (this.rectsOverlap(hb, this.boss)) {
                const dmg = Math.floor(hb.dmg);
                this.boss.takeDamage(dmg);
                this.showDamageNumber(this.boss.x + this.boss.w/2, this.boss.y, dmg, hb.isCrit ? 'crit' : 'enemy-dmg');
                this.particles.hitEffect(this.boss.x + this.boss.w/2, this.boss.y + this.boss.h/2, '#ff0055');
                this.audio.bossHurt();
            }
        }
    }

    rectsOverlap(a, b) {
        return a.x < b.x + (b.w || 50) && a.x + (a.w || 10) > b.x &&
               a.y < b.y + (b.h || 50) && a.y + (a.h || 10) > b.y;
    }

    startNewGame() {
        this.currentLevel = 1;
        this.currentWave = 1;
        this.score = 0;
        this.totalEnemiesKilled = 0;
        this.difficultyMult = 1;
        this.endlessRound = 0;
        this.hero = new Hero(100, this.groundY - 60);
        this.startLevel();
    }

    startLevel() {
        const levelIndex = ((this.currentLevel - 1) % 5);
        this.currentWave = 1;
        this.isBossWave = false;
        this.bossDefeated = false;
        this.enemies = [];
        this.boss = null;
        this.pickups = [];
        this.heroProjectiles = [];
        this.enemiesToSpawn = 5 + this.currentLevel * 2;
        this.enemiesSpawned = 0;
        this.spawnTimer = 0;
        this.spawnInterval = Math.max(40, 90 - this.currentLevel * 5);
        this.maxEnemies = Math.min(8, 3 + Math.floor(this.currentLevel / 2));
        this.waveClearing = false;

        if (this.hero) {
            this.hero.x = 100;
            this.hero.y = this.groundY - this.hero.h;
            this.hero.vx = 0; this.hero.vy = 0;
            this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + this.hero.maxHp * 0.3);
            this.hero.energy = this.hero.maxEnergy;
        }

        this.showScreen('game');
        this.state = 'playing';
        this.hudLevelNum.textContent = this.currentLevel;
        this.bossHud.style.display = 'none';

        this.showWaveAnnouncement(this.endlessRound > 0 
            ? `♾️ ENDLESS ROUND ${this.endlessRound} - LEVEL ${this.currentLevel}`
            : `⚔️ LEVEL ${this.currentLevel} - ${LEVEL_THEMES[levelIndex].name}`);

        // Start first wave
        setTimeout(() => this.startWave(), 2000);
        this.startGameLoop();
    }

    startWave() {
        this.waveClearing = false;
        this.enemiesSpawned = 0;
        this.spawnTimer = 0;
        this.enemiesToSpawn = 4 + this.currentWave * 2 + Math.floor(this.currentLevel * this.difficultyMult);
        this.maxEnemies = Math.min(10, 3 + this.currentWave + Math.floor(this.currentLevel / 2));
        this.hudWaveNum.textContent = this.currentWave;
        this.showWaveAnnouncement(`🌊 GELOMBANG ${this.currentWave}`);
    }

    startBossWave() {
        this.isBossWave = true;
        this.enemies = [];
        const bossIndex = (this.currentLevel - 1) % 5;
        this.boss = new Boss(BOSSES[bossIndex], this.currentLevel, this.difficultyMult, this.canvas.width - 150, this.groundY);
        this.bossHud.style.display = 'block';
        this.bossNameEl.textContent = `${BOSSES[bossIndex].emoji} ${BOSSES[bossIndex].name}`;
        this.updateBossHUD();
        this.showWaveAnnouncement(`⚠️ BOX MUNCUL!\n${BOSSES[bossIndex].name} ⚠️`);
        this.audio.skill();
        // Boss entrance particles
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                if (this.boss) this.particles.explosion(this.boss.x + this.boss.w/2, this.boss.y + this.boss.h/2, this.boss.data.color);
            }, i * 300);
        }
    }

    showWaveAnnouncement(text) {
        this.waveText.textContent = text;
        this.waveAnnounce.style.display = 'block';
        setTimeout(() => { this.waveAnnounce.style.display = 'none'; }, 2500);
    }

    spawnEnemy() {
        if (this.enemiesSpawned >= this.enemiesToSpawn) return;
        if (this.enemies.filter(e => !e.isDead).length >= this.maxEnemies) return;

        const side = Math.random() > 0.5 ? 1 : -1;
        const x = side > 0 ? this.canvas.width - 50 : 50;
        const levelIndex = (this.currentLevel - 1) % 5;
        const typeIndex = Math.floor(Math.random() * Math.min(levelIndex + 2, ENEMY_TYPES.length));
        const type = ENEMY_TYPES[typeIndex];
        const enemy = new Enemy(x, this.groundY - 55, type, this.currentLevel, this.difficultyMult);
        this.enemies.push(enemy);
        this.enemiesSpawned++;
    }

    startGameLoop() {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.lastTime = performance.now();
        const loop = (time) => {
            if (this.state === 'playing') {
                const dt = Math.min((time - this.lastTime) / 16.67, 3);
                this.update(dt);
                this.draw();
            }
            this.lastTime = time;
            this.rafId = requestAnimationFrame(loop);
        };
        this.rafId = requestAnimationFrame(loop);
    }

    stopGame() {
        if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; }
        this.state = 'stopped';
    }

    update(dt) {
        if (!this.hero) return;

        // Hero movement
        let moveX = 0;
        if (this.keys['left'] || this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) { moveX = -1; this.hero.facing = -1; }
        if (this.keys['right'] || this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) { moveX = 1; this.hero.facing = 1; }
        if (this.keys['attack'] || this.keys[' '] || this.keys['j'] || this.keys['J']) {
            const hb = this.hero.attack(this.particles, this.audio);
            if (hb) this.checkHitWithHitbox(hb);
        }

        if (!this.hero.isDashing) this.hero.vx = moveX * this.hero.speed;
        this.hero.update(this.groundY, this.canvas.width);
        this.bg.scroll(this.hero.vx);

        // Hero projectiles
        this.heroProjectiles = this.heroProjectiles.filter(p => {
            const alive = p.update();
            if (!alive) return false;
            // Check hit
            const targets = this.isBossWave && this.boss ? [this.boss, ...this.enemies] : this.enemies;
            for (const t of targets) {
                if (t.isDead) continue;
                const tx = t.x; const ty = t.y; const tw = t.w || 50; const th = t.h || 60;
                if (p.x > tx && p.x < tx + tw && p.y > ty && p.y < ty + th) {
                    const dmg = Math.floor(p.dmg);
                    t.takeDamage(dmg);
                    this.showDamageNumber(p.x, p.y - 20, dmg, 'crit');
                    this.particles.explosion(p.x, p.y, p.color);
                    this.audio.hit();
                    if (t === this.boss) this.audio.bossHurt();
                    p.hit = true;
                    return false;
                }
            }
            return true;
        });

        // Enemy updates & spawning
        if (!this.isBossWave) {
            this.spawnTimer++;
            if (this.spawnTimer >= this.spawnInterval && this.enemiesSpawned < this.enemiesToSpawn) {
                this.spawnEnemy();
                this.spawnTimer = 0;
            }
        }

        this.enemies.forEach(en => {
            en.update(this.hero.x + this.hero.w / 2, this.hero.y, this.groundY, this.canvas.width);
            if (!en.isDead && en.canAttack(this.hero.x + this.hero.w / 2, this.hero.y)) {
                const dmg = en.doAttack();
                const actual = this.hero.takeDamage(dmg, this.particles, this.audio);
                if (actual) this.showDamageNumber(this.hero.x + this.hero.w/2, this.hero.y, actual, 'player-dmg');
            }
            if (en.isDead && en.deathTimer === 1) {
                this.score += en.score;
                this.totalEnemiesKilled++;
                this.hero.enemiesKilled++;
                // Drop pickup
                if (Math.random() < 0.3) {
                    this.pickups.push(new Pickup(en.x + en.w/2, en.y, Math.random() < 0.6 ? 'hp' : 'energy'));
                }
                this.particles.explosion(en.x + en.w/2, en.y + en.h/2, '#ffaa00');
                this.audio.pickup();
            }
        });
        this.enemies = this.enemies.filter(en => !(en.isDead && en.deathTimer > 60));

        // Boss update
        if (this.boss && !this.boss.isDead) {
            this.boss.update(this.hero.x + this.hero.w / 2, this.hero.y, this.canvas.width);
            this.updateBossHUD();

            if (this.boss.canAttack(this.hero.x + this.hero.w / 2, this.hero.y)) {
                const dmg = this.boss.doAttack();
                const actual = this.hero.takeDamage(dmg, this.particles, this.audio);
                if (actual) this.showDamageNumber(this.hero.x + this.hero.w/2, this.hero.y, actual, 'player-dmg');
            }
            if (this.boss.canSpecial()) {
                this.boss.doSpecial(this.hero.x + this.hero.w/2, this.hero.y);
            }
            // Boss projectile collision
            this.boss.projectiles.forEach(p => {
                const dist = Math.hypot(p.x - (this.hero.x + this.hero.w/2), p.y - (this.hero.y + this.hero.h/2));
                if (dist < p.r + 15) {
                    const actual = this.hero.takeDamage(Math.floor(p.dmg), this.particles, this.audio);
                    if (actual) this.showDamageNumber(this.hero.x + this.hero.w/2, this.hero.y, actual, 'player-dmg');
                    p.life = 0;
                }
            });
        } else if (this.boss && this.boss.isDead && !this.bossDefeated) {
            this.bossDefeated = true;
            this.score += 500 + this.currentLevel * 100;
            this.audio.bossDie();
            this.particles.explosion(this.boss.x + this.boss.w/2, this.boss.y + this.boss.h/2, this.boss.data.color);
            setTimeout(() => this.onBossDefeated(), 2000);
        }

        // Wave progression
        if (!this.isBossWave && !this.waveClearing) {
            const aliveEnemies = this.enemies.filter(e => !e.isDead).length;
            const allSpawned = this.enemiesSpawned >= this.enemiesToSpawn;
            if (allSpawned && aliveEnemies === 0) {
                this.waveClearing = true;
                this.waveTimer = 60;
            }
        }

        if (this.waveClearing && !this.isBossWave) {
            this.waveTimer--;
            if (this.waveTimer <= 0) {
                this.waveClearing = false;
                if (this.currentWave < this.totalWaves) {
                    this.currentWave++;
                    this.startWave();
                } else {
                    this.startBossWave();
                }
            }
        }

        // Pickups
        this.pickups = this.pickups.filter(pk => {
            const alive = pk.update(this.groundY);
            if (!alive) return false;
            const dx = (this.hero.x + this.hero.w/2) - pk.x;
            const dy = (this.hero.y + this.hero.h/2) - pk.y;
            if (Math.hypot(dx, dy) < 30) {
                if (pk.type === 'hp') {
                    const healAmt = Math.floor(this.hero.maxHp * 0.15);
                    this.hero.heal(healAmt);
                    this.showDamageNumber(pk.x, pk.y, '+'+healAmt, 'heal');
                } else {
                    this.hero.energy = Math.min(this.hero.maxEnergy, this.hero.energy + 30);
                    this.showDamageNumber(pk.x, pk.y, '+⚡', 'heal');
                }
                pk.collected = true;
                this.audio.pickup();
                return false;
            }
            return true;
        });

        // Particles
        this.particles.update();

        // Update HUD
        this.updateHUD();

        // Hero death
        if (this.hero.hp <= 0) {
            this.audio.die();
            this.state = 'gameover';
            setTimeout(() => this.showGameOver(), 1000);
        }

        this.hudScore.textContent = this.score;
    }

    draw() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const levelIndex = (this.currentLevel - 1) % 5;
        const theme = LEVEL_THEMES[levelIndex];

        ctx.clearRect(0, 0, w, h);
        this.bg.draw(ctx, w, h, theme, Date.now());
        this.particles.draw(ctx);

        // Draw pickups
        this.pickups.forEach(pk => pk.draw(ctx));

        // Draw enemies
        this.enemies.forEach(en => en.draw(ctx));

        // Draw boss
        if (this.boss) this.boss.draw(ctx);

        // Draw hero projectiles
        this.heroProjectiles.forEach(p => p.draw(ctx));

        // Draw hero
        if (this.hero) this.hero.draw(ctx);

        // Level theme name (subtle)
        ctx.save();
        ctx.font = '700 12px Rajdhani, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.textAlign = 'right';
        ctx.fillText(theme.name.toUpperCase(), w - 10, h - 10);
        ctx.restore();
    }

    updateHUD() {
        if (!this.hero) return;
        const hpPct = (this.hero.hp / this.hero.maxHp) * 100;
        this.hudHP.style.width = hpPct + '%';
        this.hudHPText.textContent = `${Math.ceil(this.hero.hp)}/${this.hero.maxHp}`;
        this.hudHP.style.background = hpPct < 25 ? 'linear-gradient(90deg,#ff0000,#ff4400)' : (hpPct < 50 ? 'linear-gradient(90deg,#ff4400,#ffaa00)' : 'linear-gradient(90deg,#ff1744,#ff6b35)');
        this.hudEnergy.style.width = (this.hero.energy / this.hero.maxEnergy * 100) + '%';
        this.hudWeapon.textContent = WEAPONS[this.hero.weaponIndex].icon + ' ' + WEAPONS[this.hero.weaponIndex].name;
    }

    updateBossHUD() {
        if (!this.boss) return;
        const pct = (this.boss.hp / this.boss.maxHp) * 100;
        this.bossHPBar.style.width = pct + '%';
        this.bossHPText.textContent = `${Math.ceil(this.boss.hp)}/${this.boss.maxHp}`;
        if (this.boss.isEnraged) {
            this.bossHPBar.style.background = 'linear-gradient(90deg,#ff0000,#ff00ff)';
        }
    }

    updateSkillHUD() {
        this.skillSlots.forEach((slot, i) => {
            const skill = this.hero?.skills[i];
            if (skill) {
                slot.textContent = skill.icon;
                slot.classList.add('active');
            } else {
                slot.textContent = '🔒';
                slot.classList.remove('active');
            }
        });
    }

    showDamageNumber(x, y, value, type) {
        const el = document.createElement('div');
        el.className = `dmg-num ${type}`;
        el.textContent = typeof value === 'number' ? (value > 0 ? (type === 'player-dmg' ? '-'+value : value) : value) : value;
        const rect = this.canvas.getBoundingClientRect();
        el.style.left = (x - rect.left) + 'px';
        el.style.top = (y - rect.top) + 'px';
        this.damageNumbers.appendChild(el);
        setTimeout(() => el.remove(), 1000);
    }

    onBossDefeated() {
        this.bossHud.style.display = 'none';
        const bossIndex = (this.currentLevel - 1) % 5;
        const reward = BOSSES[bossIndex].reward;

        // Apply weapon upgrade
        this.hero.weaponIndex = Math.min(this.currentLevel, WEAPONS.length - 1);
        this.hero.weaponAtk = WEAPONS[this.hero.weaponIndex].atk;

        // Add skill
        if (!this.hero.skills.find(s => s.name === reward.skill.name)) {
            this.hero.skills.push({ ...reward.skill });
        }
        this.hero.activeSkillIndex = this.hero.skills.length - 1;

        // Stat upgrades
        this.hero.maxHp += 30;
        this.hero.hp = this.hero.maxHp;
        this.hero.def += 5;
        this.hero.maxEnergy += 10;

        this.audio.levelUp();
        this.updateSkillHUD();

        if (this.currentLevel === 5 && this.endlessRound === 0) {
            this.showVictory();
        } else {
            this.showUpgradeScreen(reward);
            this.currentLevel++;
            if (this.currentLevel > 5) {
                this.difficultyMult *= 1.4;
                if (this.currentLevel % 5 === 1) this.endlessRound++;
            }
        }
    }

    showUpgradeScreen(reward) {
        this.state = 'upgrade';
        document.getElementById('upgrade-title').textContent =
            this.endlessRound > 0 ? '⭐ ENDLESS REWARD ⭐' : `⭐ LEVEL ${this.currentLevel} SELESAI ⭐`;
        document.getElementById('reward-weapon-icon').textContent = reward.weapon.icon;
        document.getElementById('reward-weapon-name').textContent = reward.weapon.name;
        document.getElementById('reward-weapon-desc').textContent = reward.weapon.desc;
        document.getElementById('reward-skill-icon').textContent = reward.skill.icon;
        document.getElementById('reward-skill-name').textContent = reward.skill.name;
        document.getElementById('reward-skill-desc').textContent = reward.skill.desc;
        document.getElementById('stat-atk').textContent = this.hero.atk;
        document.getElementById('stat-def').textContent = this.hero.def;
        document.getElementById('stat-spd').textContent = this.hero.speed;
        document.getElementById('stat-hp').textContent = this.hero.maxHp;
        this.showScreen('upgrade-screen');
    }

    showGameOver() {
        this.state = 'gameover';
        document.getElementById('go-level').textContent = this.currentLevel;
        document.getElementById('go-enemies').textContent = this.totalEnemiesKilled;
        document.getElementById('go-skills').textContent = this.hero?.skills.length || 0;
        this.showScreen('gameover-screen');
    }

    showVictory() {
        this.state = 'victory';
        this.currentLevel = 6;
        this.endlessRound = 1;
        this.difficultyMult = 1.5;
        this.showScreen('victory-screen');
    }

    togglePause() {
        if (this.state === 'playing') {
            this.state = 'paused';
            this.pauseMenu.style.display = 'flex';
        } else if (this.state === 'paused') {
            this.state = 'playing';
            this.pauseMenu.style.display = 'none';
            this.lastTime = performance.now();
        }
    }

    // ===== MENU ANIMATION =====
    createMenuParticles() {
        const container = document.getElementById('menu-particles');
        for (let i = 0; i < 20; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            const size = 2 + Math.random() * 6;
            const colors = ['#ff6b35', '#f7c948', '#00d4ff', '#ff3355', '#ffffff'];
            p.style.cssText = `
                left: ${Math.random() * 100}%;
                width: ${size}px; height: ${size}px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                animation-duration: ${4 + Math.random() * 6}s;
                animation-delay: ${Math.random() * 5}s;
                box-shadow: 0 0 ${size * 2}px currentColor;
            `;
            container.appendChild(p);
        }
    }

    animateMenu() {
        const animate = () => {
            if (this.state !== 'playing') {
                const ctx = this.menuCtx;
                const w = this.menuCanvas.width;
                const h = this.menuCanvas.height;
                const t = Date.now() * 0.002;

                ctx.clearRect(0, 0, w, h);

                // Draw animated hero on menu
                ctx.save();
                ctx.translate(w/2, h/2 + Math.sin(t) * 5);

                // Glow ring
                const grd = ctx.createRadialGradient(0, 0, 30, 0, 0, 80);
                grd.addColorStop(0, 'rgba(255,107,53,0.2)');
                grd.addColorStop(1, 'transparent');
                ctx.fillStyle = grd;
                ctx.beginPath();
                ctx.arc(0, 0, 80, 0, Math.PI * 2);
                ctx.fill();

                // Orbiting orbs
                for (let i = 0; i < 5; i++) {
                    const angle = t + (i / 5) * Math.PI * 2;
                    const ox = Math.cos(angle) * 55;
                    const oy = Math.sin(angle) * 55;
                    ctx.fillStyle = ['#ff6b35','#f7c948','#00d4ff','#ff3355','#ff00ff'][i];
                    ctx.shadowColor = ctx.fillStyle;
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.arc(ox, oy, 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }

                // Simple hero body
                ctx.shadowColor = '#ff6b35';
                ctx.shadowBlur = 20;
                ctx.fillStyle = '#223366';
                ctx.fillRect(-14, -20, 28, 35);
                ctx.fillStyle = '#4455aa';
                ctx.fillRect(-12, -20, 24, 15);
                ctx.fillStyle = '#cc8844';
                ctx.beginPath();
                ctx.arc(0, -30, 14, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#445566';
                ctx.beginPath();
                ctx.arc(0, -36, 14, Math.PI, 0);
                ctx.fill();
                ctx.fillStyle = '#aabbcc';
                ctx.fillRect(0, -22, 4, 30);
                ctx.fillStyle = '#ddddff';
                ctx.fillRect(-2, -22, 8, 5);
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 5;
                ctx.fillRect(4, -33, 4, 3);
                ctx.shadowBlur = 0;

                ctx.restore();
            }
            requestAnimationFrame(animate);
        };
        animate();
    }
}

// ============================
// INIT
// ============================
window.addEventListener('load', () => {
    // Prevent context menu on long press
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });

    const game = new HeroLegendGame();
    window.game = game; // debug access
});
