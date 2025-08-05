// 道具基类
class PowerUp {
    constructor(x, y, type, options = {}) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = options.width || 30;
        this.height = options.height || 30;
        this.vx = options.vx || 0;
        this.vy = options.vy || 2;
        this.rotation = 0;
        this.rotationSpeed = options.rotationSpeed || 0.05;
        this.pulsePhase = 0;
        this.collected = false;
        
        // 道具配置
        this.config = this.getConfig(type);
        this.color = this.config.color;
        this.effect = this.config.effect;
        this.duration = this.config.duration;
    }
    
    getConfig(type) {
        const configs = {
            health: {
                color: '#ff4444',
                effect: 'heal',
                duration: 0,
                icon: '❤️'
            },
            weapon_upgrade: {
                color: '#00ff00',
                effect: 'weapon_upgrade',
                duration: 10000,
                icon: '⚡'
            },
            shield: {
                color: '#4444ff',
                effect: 'shield',
                duration: 8000,
                icon: '🛡️'
            },
            speed: {
                color: '#ffff00',
                effect: 'speed',
                duration: 6000,
                icon: '💨'
            },
            multi_shot: {
                color: '#ff00ff',
                effect: 'multi_shot',
                duration: 12000,
                icon: '🔫'
            },
            score_bonus: {
                color: '#00ffff',
                effect: 'score_bonus',
                duration: 0,
                icon: '💎'
            },
            rapid_fire: {
                color: '#ffa500',
                effect: 'rapid_fire',
                duration: 8000,
                icon: '🔥'
            },
            energy_shield: {
                color: '#9b59b6',
                effect: 'energy_shield',
                duration: 15000,
                icon: '⚡🛡️'
            },
            time_slow: {
                color: '#3498db',
                effect: 'time_slow',
                duration: 5000,
                icon: '⏰'
            }
        };
        return configs[type] || configs.health;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;
        this.pulsePhase += 0.1;
        
        // 检查是否超出屏幕
        return this.y < canvas.height + 50;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // 脉冲效果
        const pulse = 1 + Math.sin(this.pulsePhase) * 0.2;
        ctx.scale(pulse, pulse);
        
        // 外层光晕
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20;
        
        // 绘制道具主体
        this.drawPowerUp(ctx);
        
        ctx.restore();
        
        // 绘制图标
        this.drawIcon(ctx);
    }
    
    drawPowerUp(ctx) {
        // 外圈
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.stroke();
        
        // 内圈
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2 - 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        // 装饰线条
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const x1 = Math.cos(angle) * (this.width / 2 - 8);
            const y1 = Math.sin(angle) * (this.width / 2 - 8);
            const x2 = Math.cos(angle) * (this.width / 2 - 12);
            const y2 = Math.sin(angle) * (this.width / 2 - 12);
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
    }
    
    drawIcon(ctx) {
        ctx.save();
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeText(this.config.icon, this.x, this.y);
        ctx.fillText(this.config.icon, this.x, this.y);
        ctx.restore();
    }
    
    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }
    
    collect() {
        this.collected = true;
        return {
            type: this.effect,
            duration: this.duration
        };
    }
}

// 特殊道具类
class SpecialPowerUp extends PowerUp {
    constructor(x, y, type, options = {}) {
        super(x, y, type, options);
        this.specialTimer = 0;
    }
    
    update() {
        const alive = super.update();
        this.specialTimer++;
        
        // 特殊移动模式
        if (this.type === 'rare_weapon') {
            this.x += Math.sin(this.specialTimer * 0.05) * 2;
        }
        
        return alive;
    }
    
    drawPowerUp(ctx) {
        if (this.type === 'rare_weapon') {
            this.drawRareWeapon(ctx);
        } else {
            super.drawPowerUp(ctx);
        }
    }
    
    drawRareWeapon(ctx) {
        // 稀有武器道具特殊效果
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.width / 2);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.5, '#gold');
        gradient.addColorStop(1, '#ff6600');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 旋转的星形装饰
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI * 2) / 6 + this.rotation * 2;
            const x1 = Math.cos(angle) * (this.width / 2 - 5);
            const y1 = Math.sin(angle) * (this.width / 2 - 5);
            const x2 = Math.cos(angle) * (this.width / 2 - 15);
            const y2 = Math.sin(angle) * (this.width / 2 - 15);
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
    }
}

// 道具管理器
class PowerUpManager {
    constructor() {
        this.powerUps = [];
        this.spawnTimer = 0;
        this.spawnInterval = 600; // 10秒
        this.activePowerUps = new Map(); // 存储激活的道具效果
    }
    
    update() {
        // 更新道具
        this.powerUps = this.powerUps.filter(powerUp => powerUp.update());
        
        // 更新激活的道具效果
        for (let [effect, data] of this.activePowerUps) {
            data.remaining -= 16; // 假设60FPS
            if (data.remaining <= 0) {
                this.activePowerUps.delete(effect);
            }
        }
        
        // 生成新道具
        this.spawnTimer++;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnRandomPowerUp();
            this.spawnTimer = 0;
        }
    }
    
    draw(ctx) {
        this.powerUps.forEach(powerUp => powerUp.draw(ctx));
    }
    
    spawnRandomPowerUp() {
        const types = ['health', 'weapon_upgrade', 'shield', 'speed', 'multi_shot', 'score_bonus', 'rapid_fire', 'energy_shield', 'time_slow'];
        const type = types[randomInt(0, types.length - 1)];
        const x = random(50, canvas.width - 50);
        const y = -30;
        
        // 5%概率生成稀有道具
        if (Math.random() < 0.05) {
            this.powerUps.push(new SpecialPowerUp(x, y, 'rare_weapon'));
        } else {
            this.powerUps.push(new PowerUp(x, y, type));
        }
    }
    
    spawnPowerUp(x, y, type) {
        this.powerUps.push(new PowerUp(x, y, type));
    }
    
    checkCollisions(player) {
        const collectedPowerUps = [];
        
        this.powerUps = this.powerUps.filter(powerUp => {
            if (rectCollision(powerUp.getBounds(), player.getBounds())) {
                const effect = powerUp.collect();
                collectedPowerUps.push(effect);
                return false;
            }
            return true;
        });
        
        return collectedPowerUps;
    }
    
    applyEffect(effect) {
        switch (effect.type) {
            case 'heal':
                return { type: 'heal', value: 1 };
            case 'weapon_upgrade':
                this.activePowerUps.set('weapon_upgrade', { remaining: effect.duration });
                return { type: 'weapon_upgrade' };
            case 'shield':
                this.activePowerUps.set('shield', { remaining: effect.duration });
                return { type: 'shield' };
            case 'speed':
                this.activePowerUps.set('speed', { remaining: effect.duration });
                return { type: 'speed' };
            case 'multi_shot':
                this.activePowerUps.set('multi_shot', { remaining: effect.duration });
                return { type: 'multi_shot' };
            case 'score_bonus':
                return { type: 'score_bonus', value: 1000 };
            case 'rapid_fire':
                this.activePowerUps.set('rapid_fire', { remaining: effect.duration });
                return { type: 'rapid_fire' };
            case 'energy_shield':
                this.activePowerUps.set('energy_shield', { remaining: effect.duration });
                return { type: 'energy_shield' };
            case 'time_slow':
                this.activePowerUps.set('time_slow', { remaining: effect.duration });
                return { type: 'time_slow' };
        }
    }
    
    hasEffect(effectType) {
        return this.activePowerUps.has(effectType);
    }
    
    getEffectTimeRemaining(effectType) {
        const effect = this.activePowerUps.get(effectType);
        return effect ? effect.remaining : 0;
    }
    
    clear() {
        this.powerUps = [];
        this.activePowerUps.clear();
    }
    
    // 绘制激活效果的UI指示器
    drawActiveEffects(ctx) {
        let yOffset = 80;
        for (let [effect, data] of this.activePowerUps) {
            const timeLeft = Math.ceil(data.remaining / 1000);
            
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(10, yOffset, 120, 25);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.fillText(`${this.getEffectName(effect)}: ${timeLeft}s`, 15, yOffset + 17);
            
            // 进度条
            const progress = data.remaining / this.getEffectDuration(effect);
            ctx.fillStyle = this.getEffectColor(effect);
            ctx.fillRect(10, yOffset + 20, 120 * progress, 3);
            
            ctx.restore();
            yOffset += 30;
        }
    }
    
    getEffectName(effect) {
        const names = {
            weapon_upgrade: '武器强化',
            shield: '护盾',
            speed: '加速',
            multi_shot: '多重射击',
            rapid_fire: '快速射击'
        };
        return names[effect] || effect;
    }
    
    getEffectColor(effect) {
        const colors = {
            weapon_upgrade: '#00ff00',
            shield: '#4444ff',
            speed: '#ffff00',
            multi_shot: '#ff00ff',
            rapid_fire: '#ffa500'
        };
        return colors[effect] || '#ffffff';
    }
    
    getEffectDuration(effect) {
        const durations = {
            weapon_upgrade: 10000,
            shield: 8000,
            speed: 6000,
            multi_shot: 12000,
            rapid_fire: 8000
        };
        return durations[effect] || 5000;
    }
} 