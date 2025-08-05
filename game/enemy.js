// 敌机基类
class Enemy {
    constructor(x, y, type, options = {}) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = options.width || 30;
        this.height = options.height || 30;
        this.health = options.health || 1;
        this.maxHealth = this.health;
        this.speed = options.speed || 2;
        this.score = options.score || 100;
        
        // 移动相关
        this.vx = options.vx || 0;
        this.vy = options.vy || this.speed;
        this.angle = 0;
        this.rotationSpeed = options.rotationSpeed || 0.02;
        
        // 射击相关
        this.canShoot = options.canShoot || false;
        this.shootTimer = 0;
        this.shootInterval = options.shootInterval || 120;
        this.lastShootTime = 0;
        
        // AI相关
        this.aiTimer = 0;
        this.aiState = 'normal';
        this.targetX = x;
        this.targetY = y;
        
        // 动画
        this.animationFrame = 0;
        this.pulsePhase = 0;
        
        // 状态
        this.isDead = false;
        this.isOffScreen = false;
        
        // 特效
        this.trail = [];
        this.maxTrailLength = 5;
        
        // 根据类型设置属性
        this.setupByType();
    }
    
    setupByType() {
        switch (this.type) {
            case 'basic':
                this.color = '#ff6b6b';
                this.health = 1;
                this.speed = 2;
                this.score = 100;
                break;
            case 'fast':
                this.color = '#4ecdc4';
                this.health = 1;
                this.speed = 4;
                this.score = 150;
                break;
            case 'heavy':
                this.color = '#9b59b6';
                this.health = 3;
                this.speed = 1;
                this.score = 300;
                this.width = 40;
                this.height = 40;
                break;
            case 'shooter':
                this.color = '#f39c12';
                this.health = 2;
                this.speed = 1.5;
                this.score = 200;
                this.canShoot = true;
                this.shootInterval = 90;
                break;
            case 'zigzag':
                this.color = '#e74c3c';
                this.health = 2;
                this.speed = 2;
                this.score = 250;
                break;
            case 'stealth':
                this.color = '#34495e';
                this.health = 2;
                this.speed = 3;
                this.score = 400;
                this.canShoot = true;
                this.shootInterval = 120;
                this.stealthMode = true;
                this.stealthTimer = 0;
                this.stealthDuration = 180; // 3秒隐形
                this.visibleDuration = 120; // 2秒可见
                this.alpha = 0.3; // 隐形时的透明度
                break;
            case 'boss':
                this.color = '#2c3e50';
                this.health = 20;
                this.speed = 1;
                this.score = 2000;
                this.width = 80;
                this.height = 80;
                this.canShoot = true;
                this.shootInterval = 60;
                break;
        }
        this.maxHealth = this.health;
    }
    
    update(player, bulletManager) {
        // 更新AI
        this.updateAI(player);
        
        // 更新位置
        this.updateMovement();
        
        // 更新射击
        if (this.canShoot) {
            this.updateShooting(player, bulletManager);
        }
        
        // 更新动画
        this.animationFrame++;
        this.angle += this.rotationSpeed;
        this.pulsePhase += 0.1;
        
        // 更新隐形状态
        if (this.type === 'stealth') {
            this.updateStealthMode();
        }
        
        // 更新拖尾
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        // 检查是否超出屏幕
        this.checkBounds();
        
        return !this.isDead && !this.isOffScreen;
    }
    
    updateStealthMode() {
        this.stealthTimer++;
        
        if (this.stealthMode) {
            // 隐形模式
            this.alpha = 0.3;
            if (this.stealthTimer >= this.stealthDuration) {
                this.stealthMode = false;
                this.stealthTimer = 0;
            }
        } else {
            // 可见模式
            this.alpha = 1.0;
            if (this.stealthTimer >= this.visibleDuration) {
                this.stealthMode = true;
                this.stealthTimer = 0;
            }
        }
    }
    
    updateAI(player) {
        this.aiTimer++;
        
        switch (this.type) {
            case 'basic':
            case 'fast':
            case 'heavy':
                // 直线向下移动
                this.vy = this.speed;
                break;
                
            case 'shooter':
                // 缓慢向下移动，偶尔左右摆动
                this.vy = this.speed;
                if (this.aiTimer % 60 === 0) {
                    this.vx = random(-1, 1);
                }
                break;
                
            case 'zigzag':
                // Z字形移动
                this.vy = this.speed;
                this.vx = Math.sin(this.aiTimer * 0.1) * 2;
                break;
                
            case 'boss':
                this.updateBossAI(player);
                break;
        }
    }
    
    updateBossAI(player) {
        // Boss AI状态机
        switch (this.aiState) {
            case 'normal':
                // 跟随玩家X轴移动
                if (this.x < player.x - 10) {
                    this.vx = 1;
                } else if (this.x > player.x + 10) {
                    this.vx = -1;
                } else {
                    this.vx = 0;
                }
                
                // 保持在屏幕上方
                if (this.y < 100) {
                    this.vy = 0.5;
                } else if (this.y > 150) {
                    this.vy = -0.5;
                } else {
                    this.vy = 0;
                }
                
                // 切换到攻击状态
                if (this.aiTimer % 300 === 0) {
                    this.aiState = 'attack';
                    this.aiTimer = 0;
                }
                break;
                
            case 'attack':
                // 攻击状态：快速射击
                this.shootInterval = 20;
                if (this.aiTimer > 120) {
                    this.aiState = 'normal';
                    this.shootInterval = 60;
                    this.aiTimer = 0;
                }
                break;
        }
    }
    
    updateMovement() {
        this.x += this.vx;
        this.y += this.vy;
        
        // 限制在屏幕内（除了Y轴向下移动）
        this.x = clamp(this.x, this.width / 2, canvas.width - this.width / 2);
    }
    
    updateShooting(player, bulletManager) {
        this.shootTimer++;
        if (this.shootTimer >= this.shootInterval) {
            this.shoot(player, bulletManager);
            this.shootTimer = 0;
        }
    }
    
    shoot(player, bulletManager) {
        switch (this.type) {
            case 'shooter':
                // 向玩家射击
                bulletManager.addBullet(new EnemyBullet(
                    this.x, this.y + this.height / 2,
                    player.x, player.y,
                    { speed: 3 }
                ));
                break;
                
            case 'boss':
                this.bossShoot(player, bulletManager);
                break;
        }
    }
    
    bossShoot(player, bulletManager) {
        if (this.aiState === 'attack') {
            // 扇形射击
            for (let i = -2; i <= 2; i++) {
                const angle = Math.atan2(player.y - this.y, player.x - this.x) + i * 0.3;
                const speed = 4;
                bulletManager.addBullet(new EnemyBullet(
                    this.x, this.y + this.height / 2,
                    this.x + Math.cos(angle) * 100,
                    this.y + Math.sin(angle) * 100,
                    { speed: speed, type: 'energy' }
                ));
            }
        } else {
            // 普通射击
            bulletManager.addBullet(new EnemyBullet(
                this.x, this.y + this.height / 2,
                player.x, player.y,
                { speed: 3, type: 'energy' }
            ));
        }
    }
    
    checkBounds() {
        if (this.y > canvas.height + 50 || 
            this.x < -50 || this.x > canvas.width + 50) {
            this.isOffScreen = true;
        }
    }
    
    takeDamage(damage = 1) {
        this.health -= damage;
        if (this.health <= 0) {
            this.isDead = true;
            return true;
        }
        return false;
    }
    
    draw(ctx) {
        if (this.isDead) return;
        
        ctx.save();
        
        // 设置透明度（用于隐形敌机）
        if (this.alpha !== undefined) {
            ctx.globalAlpha = this.alpha;
        }
        
        // 绘制拖尾
        this.drawTrail(ctx);
        
        // 绘制敌机主体
        this.drawEnemy(ctx);
        
        // 绘制生命值条（多血量敌机）
        if (this.maxHealth > 1) {
            this.drawHealthBar(ctx);
        }
        
        ctx.restore();
    }
    
    drawTrail(ctx) {
        if (this.trail.length > 1) {
            ctx.save();
            for (let i = 0; i < this.trail.length - 1; i++) {
                const alpha = i / this.trail.length;
                ctx.globalAlpha = alpha * 0.3;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.trail[i].x, this.trail[i].y, 2 * alpha, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }
    
    drawEnemy(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        switch (this.type) {
            case 'basic':
                this.drawBasic(ctx);
                break;
            case 'fast':
                this.drawFast(ctx);
                break;
            case 'heavy':
                this.drawHeavy(ctx);
                break;
            case 'shooter':
                this.drawShooter(ctx);
                break;
            case 'zigzag':
                this.drawZigzag(ctx);
                break;
            case 'stealth':
                this.drawStealth(ctx);
                break;
            case 'boss':
                this.drawBoss(ctx);
                break;
        }
        
        ctx.restore();
    }
    
    drawBasic(ctx) {
        // 基础敌机 - 飞机造型
        // 机身
        const gradient = ctx.createLinearGradient(0, -this.height/2, 0, this.height/2);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.5, '#2c3e50');
        gradient.addColorStop(1, '#34495e');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, this.height / 2); // 机头向下
        ctx.lineTo(-this.width / 4, -this.height / 2);
        ctx.lineTo(this.width / 4, -this.height / 2);
        ctx.closePath();
        ctx.fill();
        
        // 机翼
        ctx.fillStyle = '#34495e';
        ctx.fillRect(-this.width / 2, -5, this.width, 6);
        
        // 驾驶舱
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(0, this.height / 4, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // 推进器
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(-2, -this.height / 2 - 5, 4, 8);
    }
    
    drawFast(ctx) {
        // 快速敌机 - 流线型战斗机
        // 机身
        const gradient = ctx.createLinearGradient(0, -this.height/2, 0, this.height/2);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.5, '#ffffff');
        gradient.addColorStop(1, '#2c3e50');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, this.height / 2); // 尖锐机头
        ctx.lineTo(-this.width / 6, 0);
        ctx.lineTo(-this.width / 4, -this.height / 2);
        ctx.lineTo(this.width / 4, -this.height / 2);
        ctx.lineTo(this.width / 6, 0);
        ctx.closePath();
        ctx.fill();
        
        // 后掠翼
        ctx.fillStyle = '#34495e';
        ctx.beginPath();
        ctx.moveTo(-this.width / 2, -8);
        ctx.lineTo(-this.width / 6, -2);
        ctx.lineTo(-this.width / 6, 4);
        ctx.lineTo(-this.width / 2, 2);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(this.width / 2, -8);
        ctx.lineTo(this.width / 6, -2);
        ctx.lineTo(this.width / 6, 4);
        ctx.lineTo(this.width / 2, 2);
        ctx.closePath();
        ctx.fill();
        
        // 双推进器
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(-3, -this.height / 2 - 6, 2, 10);
        ctx.fillRect(1, -this.height / 2 - 6, 2, 10);
    }
    
    drawHeavy(ctx) {
        // 重型敌机 - 重装战斗机
        // 厚重机身
        const gradient = ctx.createLinearGradient(0, -this.height/2, 0, this.height/2);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.5, '#34495e');
        gradient.addColorStop(1, '#2c3e50');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, this.height / 2);
        ctx.lineTo(-this.width / 3, this.height / 4);
        ctx.lineTo(-this.width / 3, -this.height / 2);
        ctx.lineTo(this.width / 3, -this.height / 2);
        ctx.lineTo(this.width / 3, this.height / 4);
        ctx.closePath();
        ctx.fill();
        
        // 装甲翼
        ctx.fillStyle = '#34495e';
        ctx.fillRect(-this.width / 2, -8, this.width, 12);
        
        // 装甲板细节
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(-this.width / 4, -this.height / 3, this.width / 2, this.height / 3);
        
        // 双管武器
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(-4, this.height / 2, 2, 10);
        ctx.fillRect(2, this.height / 2, 2, 10);
        
        // 重型推进器
        ctx.fillStyle = '#ff8800';
        ctx.fillRect(-6, -this.height / 2 - 4, 12, 6);
    }
    
    drawShooter(ctx) {
        // 射击敌机 - 攻击型战斗机
        // 机身
        const gradient = ctx.createLinearGradient(0, -this.height/2, 0, this.height/2);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.5, '#f39c12');
        gradient.addColorStop(1, '#2c3e50');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, this.height / 2);
        ctx.lineTo(-this.width / 5, this.height / 6);
        ctx.lineTo(-this.width / 4, -this.height / 3);
        ctx.lineTo(-this.width / 6, -this.height / 2);
        ctx.lineTo(this.width / 6, -this.height / 2);
        ctx.lineTo(this.width / 4, -this.height / 3);
        ctx.lineTo(this.width / 5, this.height / 6);
        ctx.closePath();
        ctx.fill();
        
        // 武器翼
        ctx.fillStyle = '#34495e';
        ctx.fillRect(-this.width / 2, 0, this.width, 5);
        
        // 武器挂载点
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(-this.width / 2 + 2, 0, 4, 8);
        ctx.fillRect(this.width / 2 - 6, 0, 4, 8);
        
        // 主炮
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(-2, this.height / 2, 4, 12);
        
        // 推进器
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(-3, -this.height / 2 - 5, 6, 8);
    }
    
    drawZigzag(ctx) {
        // Z字形敌机 - 机动型战斗机
        // 机身
        const gradient = ctx.createLinearGradient(0, -this.height/2, 0, this.height/2);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.5, '#e74c3c');
        gradient.addColorStop(1, '#2c3e50');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, this.height / 2);
        ctx.lineTo(-this.width / 6, this.height / 4);
        ctx.lineTo(-this.width / 4, 0);
        ctx.lineTo(-this.width / 6, -this.height / 2);
        ctx.lineTo(this.width / 6, -this.height / 2);
        ctx.lineTo(this.width / 4, 0);
        ctx.lineTo(this.width / 6, this.height / 4);
        ctx.closePath();
        ctx.fill();
        
        // 可变翼
        ctx.fillStyle = '#34495e';
        const wingAngle = Math.sin(this.pulsePhase) * 0.3;
        ctx.save();
        ctx.rotate(wingAngle);
        ctx.fillRect(-this.width / 2, -3, this.width, 6);
        ctx.restore();
        
        // 矢量推进器
        ctx.fillStyle = '#ff6b6b';
        const thrusterGlow = 1 + Math.sin(this.pulsePhase * 2) * 0.3;
        ctx.save();
        ctx.scale(thrusterGlow, 1);
        ctx.fillRect(-2, -this.height / 2 - 6, 4, 10);
        ctx.restore();
    }
    
    drawStealth(ctx) {
        // 隐形敌机 - 菱形，带有科幻感的边框
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // 主体
        ctx.fillStyle = this.stealthMode ? 'rgba(52, 73, 94, 0.3)' : this.color;
        ctx.strokeStyle = this.stealthMode ? 'rgba(52, 152, 219, 0.6)' : '#3498db';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.lineTo(this.width / 2, 0);
        ctx.lineTo(0, this.height / 2);
        ctx.lineTo(-this.width / 2, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // 隐形模式下的特殊效果
        if (this.stealthMode) {
            // 扫描线效果
            ctx.strokeStyle = 'rgba(52, 152, 219, 0.8)';
            ctx.lineWidth = 1;
            for (let i = -this.height / 2; i < this.height / 2; i += 4) {
                ctx.beginPath();
                ctx.moveTo(-this.width / 2, i);
                ctx.lineTo(this.width / 2, i);
                ctx.stroke();
            }
        }
        
        ctx.restore();
    }
    
    drawBoss(ctx) {
        // Boss - 巨型战舰
        // 主体机身
        const gradient = ctx.createLinearGradient(0, -this.height/2, 0, this.height/2);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.3, '#34495e');
        gradient.addColorStop(0.7, '#2c3e50');
        gradient.addColorStop(1, '#1a1a1a');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, this.height / 2);
        ctx.lineTo(-this.width / 3, this.height / 3);
        ctx.lineTo(-this.width / 2, 0);
        ctx.lineTo(-this.width / 3, -this.height / 2);
        ctx.lineTo(this.width / 3, -this.height / 2);
        ctx.lineTo(this.width / 2, 0);
        ctx.lineTo(this.width / 3, this.height / 3);
        ctx.closePath();
        ctx.fill();
        
        // 装甲层
        ctx.fillStyle = '#34495e';
        ctx.fillRect(-this.width / 3, -this.height / 3, this.width * 2/3, this.height * 2/3);
        
        // 指挥塔
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(-this.width / 6, -this.height / 4, this.width / 3, this.height / 2);
        
        // 核心反应堆
        const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 15);
        coreGradient.addColorStop(0, '#e74c3c');
        coreGradient.addColorStop(0.5, '#f39c12');
        coreGradient.addColorStop(1, '#c0392b');
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // 武器炮塔
        ctx.fillStyle = '#e67e22';
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI * 2) / 6;
            const x = Math.cos(angle) * (this.width / 2 - 8);
            const y = Math.sin(angle) * (this.height / 2 - 8);
            ctx.fillRect(x - 4, y - 4, 8, 8);
            
            // 炮管
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(x - 1, y + 4, 2, 12);
            ctx.fillStyle = '#e67e22';
        }
        
        // 推进器阵列
        ctx.fillStyle = '#3498db';
        for (let i = -2; i <= 2; i++) {
            ctx.fillRect(i * 8, -this.height / 2 - 8, 4, 12);
        }
        
        // 护盾效果（低血量时）
        if (this.health < this.maxHealth * 0.3) {
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 4;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(0, 0, this.width / 2 + 15, 0, Math.PI * 2);
            ctx.stroke();
            
            // 内层护盾
            ctx.strokeStyle = '#f39c12';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, this.width / 2 + 8, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    drawHealthBar(ctx) {
        const barWidth = this.width;
        const barHeight = 4;
        const barY = -this.height / 2 - 10;
        
        // 背景
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(this.x - barWidth / 2, this.y + barY, barWidth, barHeight);
        
        // 生命值
        const healthPercent = this.health / this.maxHealth;
        const healthColor = healthPercent > 0.6 ? '#27ae60' : 
                           healthPercent > 0.3 ? '#f39c12' : '#e74c3c';
        ctx.fillStyle = healthColor;
        ctx.fillRect(this.x - barWidth / 2, this.y + barY, barWidth * healthPercent, barHeight);
    }
    
    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }
    
    getCircleBounds() {
        return {
            x: this.x,
            y: this.y,
            radius: Math.min(this.width, this.height) / 2
        };
    }
}

// 敌机管理器
class EnemyManager {
    constructor() {
        this.enemies = [];
        this.spawnTimer = 0;
        this.spawnInterval = 120; // 2秒
        this.waveNumber = 1;
        this.enemiesInWave = 0;
        this.maxEnemiesInWave = 5;
        this.bossSpawned = false;
        this.difficultySettings = {
            enemySpeedMultiplier: 1.0,
            enemyHealthMultiplier: 1.0,
            playerLives: 3
        };
    }
    
    setDifficulty(settings) {
        this.difficultySettings = settings;
    }
    
    update(player, bulletManager) {
        // 更新所有敌机
        this.enemies = this.enemies.filter(enemy => enemy.update(player, bulletManager));
        
        // 生成新敌机
        this.spawnTimer++;
        if (this.spawnTimer >= this.spawnInterval && this.shouldSpawnEnemy()) {
            this.spawnEnemy();
            this.spawnTimer = 0;
        }
        
        // 检查是否需要生成Boss
        this.checkBossSpawn();
    }
    
    shouldSpawnEnemy() {
        return this.enemies.length < 8 && this.enemiesInWave < this.maxEnemiesInWave;
    }
    
    spawnEnemy() {
        const x = random(50, canvas.width - 50);
        const y = -30;
        
        // 根据波数决定敌机类型
        let type = 'basic';
        const rand = Math.random();
        
        if (this.waveNumber >= 5) {
            if (rand < 0.05) type = 'stealth';
            else if (rand < 0.15) type = 'heavy';
            else if (rand < 0.35) type = 'shooter';
            else if (rand < 0.55) type = 'zigzag';
            else if (rand < 0.75) type = 'fast';
            else type = 'basic';
        } else if (this.waveNumber >= 3) {
            if (rand < 0.1) type = 'heavy';
            else if (rand < 0.3) type = 'shooter';
            else if (rand < 0.5) type = 'zigzag';
            else if (rand < 0.7) type = 'fast';
            else type = 'basic';
        } else if (this.waveNumber >= 2) {
            if (rand < 0.2) type = 'shooter';
            else if (rand < 0.4) type = 'fast';
            else type = 'basic';
        }
        
        const enemy = new Enemy(x, y, type);
        // 应用难度设置
        enemy.speed *= this.difficultySettings.enemySpeedMultiplier;
        enemy.health = Math.ceil(enemy.health * this.difficultySettings.enemyHealthMultiplier);
        enemy.maxHealth = enemy.health;
        
        this.enemies.push(enemy);
        this.enemiesInWave++;
        
        // 调整生成间隔
        this.spawnInterval = Math.max(60, 120 - this.waveNumber * 10);
    }
    
    checkBossSpawn() {
        // 每5波生成一个Boss
        if (this.waveNumber % 5 === 0 && !this.bossSpawned && this.enemies.length === 0) {
            this.spawnBoss();
        }
        
        // 检查是否完成当前波
        if (this.enemiesInWave >= this.maxEnemiesInWave && this.enemies.length === 0) {
            this.nextWave();
        }
    }
    
    spawnBoss() {
        const x = canvas.width / 2;
        const y = -50;
        this.enemies.push(new Enemy(x, y, 'boss'));
        this.bossSpawned = true;
    }
    
    nextWave() {
        this.waveNumber++;
        this.enemiesInWave = 0;
        this.maxEnemiesInWave = Math.min(10, 5 + Math.floor(this.waveNumber / 2));
        this.bossSpawned = false;
    }
    
    draw(ctx) {
        this.enemies.forEach(enemy => enemy.draw(ctx));
    }
    
    checkCollisions(bullets) {
        const hits = [];
        
        bullets.forEach(bullet => {
            this.enemies.forEach(enemy => {
                if (!enemy.isDead && rectCollision(bullet.getBounds(), enemy.getBounds())) {
                    if (enemy.takeDamage(bullet.damage)) {
                        hits.push({
                            enemy: enemy,
                            bullet: bullet,
                            score: enemy.score
                        });
                    }
                    bullet.hit = true;
                }
            });
        });
        
        return hits;
    }
    
    checkPlayerCollisions(player) {
        for (let enemy of this.enemies) {
            if (!enemy.isDead && circleCollision(player.getCircleBounds(), enemy.getCircleBounds())) {
                return enemy;
            }
        }
        return null;
    }
    
    clear() {
        this.enemies = [];
        this.waveNumber = 1;
        this.enemiesInWave = 0;
        this.bossSpawned = false;
    }
    
    getEnemyCount() {
        return this.enemies.length;
    }
    
    getCurrentWave() {
        return this.waveNumber;
    }
    
    // 获取最近的敌机（用于道具生成等）
    getNearestEnemy(x, y) {
        let nearest = null;
        let minDistance = Infinity;
        
        this.enemies.forEach(enemy => {
            if (!enemy.isDead) {
                const dist = distance(x, y, enemy.x, enemy.y);
                if (dist < minDistance) {
                    minDistance = dist;
                    nearest = enemy;
                }
            }
        });
        
        return nearest;
    }
} 