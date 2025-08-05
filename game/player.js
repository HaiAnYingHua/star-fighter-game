// 玩家飞机类
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 50;
        this.speed = 5;
        this.baseSpeed = 5;
        this.health = 3;
        this.maxHealth = 3;
        this.lives = 3;
        
        // 射击相关
        this.shootTimer = 0;
        this.shootInterval = 15; // 射击间隔
        this.baseShootInterval = 15;
        this.weaponLevel = 1;
        this.maxWeaponLevel = 5;
        
        // 状态
        this.invulnerable = false;
        this.invulnerableTimer = 0;
        this.invulnerableDuration = 120; // 2秒无敌时间
        
        // 护盾
        this.hasShield = false;
        this.shieldHealth = 0;
        this.maxShieldHealth = 3;
        
        // 能量护盾
        this.hasEnergyShield = false;
        this.energyShieldHealth = 0;
        this.maxEnergyShieldHealth = 5;
        
        // 动画
        this.animationFrame = 0;
        this.thrusterPhase = 0;
        
        // 移动相关
        this.targetX = x;
        this.targetY = y;
        this.smoothMovement = true;
        
        // 特效
        this.trail = [];
        this.maxTrailLength = 10;
    }
    
    update(input, powerUpManager) {
        // 处理移动
        this.handleMovement(input);
        
        // 更新射击计时器
        this.shootTimer++;
        
        // 更新无敌状态
        if (this.invulnerable) {
            this.invulnerableTimer--;
            if (this.invulnerableTimer <= 0) {
                this.invulnerable = false;
            }
        }
        
        // 更新动画
        this.animationFrame++;
        this.thrusterPhase += 0.3;
        
        // 更新拖尾效果
        this.trail.push({ x: this.x, y: this.y + this.height / 2 });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        // 应用道具效果
        this.applyPowerUpEffects(powerUpManager);
        
        // 限制在屏幕内
        this.x = clamp(this.x, this.width / 2, canvas.width - this.width / 2);
        this.y = clamp(this.y, this.height / 2, canvas.height - this.height / 2);
    }
    
    handleMovement(input) {
        if (this.smoothMovement) {
            // 平滑移动到目标位置
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 2) {
                const moveX = (dx / distance) * this.speed;
                const moveY = (dy / distance) * this.speed;
                this.x += moveX;
                this.y += moveY;
            }
        } else {
            // 直接键盘控制
            if (input.left) this.x -= this.speed;
            if (input.right) this.x += this.speed;
            if (input.up) this.y -= this.speed;
            if (input.down) this.y += this.speed;
        }
    }
    
    setTarget(x, y) {
        this.targetX = x;
        this.targetY = y;
    }
    
    shoot(bulletManager) {
        if (this.shootTimer >= this.shootInterval) {
            this.createBullets(bulletManager);
            this.shootTimer = 0;
        }
    }
    
    createBullets(bulletManager) {
        const bulletOptions = {
            damage: this.weaponLevel,
            type: this.getWeaponType()
        };
        
        switch (this.weaponLevel) {
            case 1:
                // 单发
                bulletManager.addBullet(new PlayerBullet(this.x, this.y - this.height / 2, bulletOptions));
                break;
            case 2:
                // 双发
                bulletManager.addBullet(new PlayerBullet(this.x - 8, this.y - this.height / 2, bulletOptions));
                bulletManager.addBullet(new PlayerBullet(this.x + 8, this.y - this.height / 2, bulletOptions));
                break;
            case 3:
                // 三发
                bulletManager.addBullet(new PlayerBullet(this.x, this.y - this.height / 2, bulletOptions));
                bulletManager.addBullet(new PlayerBullet(this.x - 12, this.y - this.height / 2, bulletOptions));
                bulletManager.addBullet(new PlayerBullet(this.x + 12, this.y - this.height / 2, bulletOptions));
                break;
            case 4:
                // 四发散射
                for (let i = 0; i < 4; i++) {
                    const angle = (i - 1.5) * 0.2;
                    const bullet = new PlayerBullet(this.x, this.y - this.height / 2, {
                        ...bulletOptions,
                        vx: Math.sin(angle) * 2,
                        vy: -8 + Math.cos(angle) * 2
                    });
                    bulletManager.addBullet(bullet);
                }
                break;
            case 5:
                // 五发扇形
                for (let i = 0; i < 5; i++) {
                    const angle = (i - 2) * 0.3;
                    const bullet = new PlayerBullet(this.x, this.y - this.height / 2, {
                        ...bulletOptions,
                        vx: Math.sin(angle) * 3,
                        vy: -8 + Math.cos(angle) * 2,
                        type: 'laser'
                    });
                    bulletManager.addBullet(bullet);
                }
                break;
        }
    }
    
    getWeaponType() {
        if (this.weaponLevel >= 4) return 'laser';
        if (this.weaponLevel >= 3) return 'plasma';
        return 'normal';
    }
    
    applyPowerUpEffects(powerUpManager) {
        // 重置到基础值
        this.speed = this.baseSpeed;
        this.shootInterval = this.baseShootInterval;
        
        // 应用速度增强
        if (powerUpManager.hasEffect('speed')) {
            this.speed = this.baseSpeed * 1.5;
        }
        
        // 应用快速射击
        if (powerUpManager.hasEffect('rapid_fire')) {
            this.shootInterval = Math.floor(this.baseShootInterval * 0.5);
        }
        
        // 应用护盾
        if (powerUpManager.hasEffect('shield') && !this.hasShield) {
            this.hasShield = true;
            this.shieldHealth = this.maxShieldHealth;
        }
        
        // 应用武器升级
        if (powerUpManager.hasEffect('weapon_upgrade')) {
            this.weaponLevel = Math.min(this.maxWeaponLevel, this.weaponLevel + 1);
        }
    }
    
    takeDamage(damage = 1) {
        if (this.invulnerable) return false;
        
        // 能量护盾优先承受伤害
        if (this.hasEnergyShield && this.energyShieldHealth > 0) {
            this.energyShieldHealth -= damage;
            if (this.energyShieldHealth <= 0) {
                this.hasEnergyShield = false;
                this.energyShieldHealth = 0;
            }
            this.startInvulnerability();
            return false; // 能量护盾吸收伤害
        }
        
        // 普通护盾承受伤害
        if (this.hasShield && this.shieldHealth > 0) {
            this.shieldHealth -= damage;
            if (this.shieldHealth <= 0) {
                this.hasShield = false;
                this.shieldHealth = 0;
            }
            this.startInvulnerability();
            return false; // 没有真正受伤
        }
        
        // 扣除生命值
        this.health -= damage;
        this.startInvulnerability();
        
        if (this.health <= 0) {
            this.health = 0;
            return true; // 死亡
        }
        
        return false;
    }
    
    activateEnergyShield() {
        this.hasEnergyShield = true;
        this.energyShieldHealth = this.maxEnergyShieldHealth;
    }
    
    heal(amount = 1) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
    
    addLife() {
        this.lives++;
    }
    
    respawn() {
        if (this.lives > 0) {
            this.lives--;
            this.health = this.maxHealth;
            this.x = canvas.width / 2;
            this.y = canvas.height - 100;
            this.weaponLevel = 1;
            this.hasShield = false;
            this.shieldHealth = 0;
            this.startInvulnerability();
            return true;
        }
        return false;
    }
    
    startInvulnerability() {
        this.invulnerable = true;
        this.invulnerableTimer = this.invulnerableDuration;
    }
    
    draw(ctx) {
        ctx.save();
        
        // 无敌状态闪烁效果
        if (this.invulnerable && Math.floor(this.invulnerableTimer / 5) % 2) {
            ctx.globalAlpha = 0.5;
        }
        
        // 绘制拖尾
        this.drawTrail(ctx);
        
        // 绘制飞机主体
        this.drawPlane(ctx);
        
        // 绘制推进器火焰
        this.drawThrusters(ctx);
        
        // 绘制护盾
        if (this.hasShield) {
            this.drawShield(ctx);
        }
        
        // 绘制能量护盾
        if (this.hasEnergyShield) {
            this.drawEnergyShield(ctx);
        }
        
        ctx.restore();
    }
    
    drawTrail(ctx) {
        if (this.trail.length > 1) {
            ctx.save();
            for (let i = 0; i < this.trail.length - 1; i++) {
                const alpha = i / this.trail.length;
                ctx.globalAlpha = alpha * 0.5;
                ctx.fillStyle = '#4ecdc4';
                ctx.beginPath();
                ctx.arc(this.trail[i].x, this.trail[i].y, 3 * alpha, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }
    
    drawPlane(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // 机身
        const gradient = ctx.createLinearGradient(0, -this.height/2, 0, this.height/2);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.5, '#4ecdc4');
        gradient.addColorStop(1, '#2c3e50');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.lineTo(-this.width / 4, this.height / 2);
        ctx.lineTo(this.width / 4, this.height / 2);
        ctx.closePath();
        ctx.fill();
        
        // 机翼
        ctx.fillStyle = '#34495e';
        ctx.fillRect(-this.width / 2, 0, this.width, 8);
        
        // 驾驶舱
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(0, -this.height / 4, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // 武器等级指示器
        if (this.weaponLevel > 1) {
            ctx.fillStyle = '#f39c12';
            for (let i = 0; i < this.weaponLevel - 1; i++) {
                ctx.fillRect(-8 + i * 4, this.height / 2 - 5, 2, 8);
            }
        }
        
        ctx.restore();
    }
    
    drawThrusters(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y + this.height / 2);
        
        // 主推进器
        const flameHeight = 15 + Math.sin(this.thrusterPhase) * 5;
        const gradient = ctx.createLinearGradient(0, 0, 0, flameHeight);
        gradient.addColorStop(0, '#ff6b6b');
        gradient.addColorStop(0.5, '#ffa500');
        gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(-4, 0);
        ctx.lineTo(4, 0);
        ctx.lineTo(2, flameHeight);
        ctx.lineTo(-2, flameHeight);
        ctx.closePath();
        ctx.fill();
        
        // 侧推进器
        ctx.fillStyle = '#ff8800';
        ctx.fillRect(-this.width / 2 + 2, 0, 3, 8);
        ctx.fillRect(this.width / 2 - 5, 0, 3, 8);
        
        ctx.restore();
    }
    
    drawShield(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // 护盾强度决定透明度
        const alpha = this.shieldHealth / this.maxShieldHealth;
        ctx.globalAlpha = alpha * 0.6;
        
        // 护盾颜色根据强度变化
        const hue = (this.shieldHealth / this.maxShieldHealth) * 240; // 从红到蓝
        ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.lineWidth = 3;
        
        // 旋转的护盾
        ctx.rotate(this.animationFrame * 0.05);
        
        // 绘制护盾环
        for (let i = 0; i < 3; i++) {
            const radius = 30 + i * 5;
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // 护盾粒子效果
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8 + this.animationFrame * 0.1;
            const x = Math.cos(angle) * 35;
            const y = Math.sin(angle) * 35;
            
            ctx.fillStyle = `hsl(${hue}, 100%, 70%)`;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
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
    
    // 获取碰撞检测用的圆形边界
    getCircleBounds() {
        return {
            x: this.x,
            y: this.y,
            radius: Math.min(this.width, this.height) / 3
        };
    }
    
    reset() {
        this.x = canvas.width / 2;
        this.y = canvas.height - 100;
        this.health = this.maxHealth;
        this.lives = 3;
        this.weaponLevel = 1;
        this.hasShield = false;
        this.shieldHealth = 0;
        this.hasEnergyShield = false;
        this.energyShieldHealth = 0;
        this.invulnerable = false;
        this.invulnerableTimer = 0;
        this.trail = [];
    }
    
    drawEnergyShield(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        const alpha = this.energyShieldHealth / this.maxEnergyShieldHealth;
        const radius = 35;
        
        // 外层能量环
        ctx.strokeStyle = `rgba(138, 43, 226, ${alpha * 0.8})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // 内层能量场
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        gradient.addColorStop(0, `rgba(138, 43, 226, ${alpha * 0.1})`);
        gradient.addColorStop(0.7, `rgba(138, 43, 226, ${alpha * 0.3})`);
        gradient.addColorStop(1, `rgba(138, 43, 226, ${alpha * 0.6})`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 能量脉冲效果
        const pulseRadius = radius + Math.sin(this.animationFrame * 0.2) * 5;
        ctx.strokeStyle = `rgba(138, 43, 226, ${alpha * 0.4})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, pulseRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }
} 