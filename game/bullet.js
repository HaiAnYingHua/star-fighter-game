// 子弹基类
class Bullet {
    constructor(x, y, vx, vy, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.width = options.width || 4;
        this.height = options.height || 10;
        this.damage = options.damage || 1;
        this.color = options.color || '#ffff00';
        this.isPlayerBullet = options.isPlayerBullet || false;
        this.trail = [];
        this.maxTrailLength = options.maxTrailLength || 5;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        // 添加拖尾效果
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        // 检查是否超出屏幕
        return this.y > -50 && this.y < canvas.height + 50 && 
               this.x > -50 && this.x < canvas.width + 50;
    }
    
    draw(ctx) {
        // 绘制拖尾
        if (this.trail.length > 1) {
            ctx.save();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) {
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }
            ctx.stroke();
            ctx.restore();
        }
        
        // 绘制子弹主体
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        
        // 添加发光效果
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
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
}

// 玩家子弹类
class PlayerBullet extends Bullet {
    constructor(x, y, options = {}) {
        super(x, y, 0, -8, {
            width: 4,
            height: 12,
            damage: 1,
            color: '#00ff00',
            isPlayerBullet: true,
            maxTrailLength: 8,
            ...options
        });
        this.type = options.type || 'normal';
    }
    
    draw(ctx) {
        switch (this.type) {
            case 'laser':
                this.drawLaser(ctx);
                break;
            case 'plasma':
                this.drawPlasma(ctx);
                break;
            case 'missile':
                this.drawMissile(ctx);
                break;
            default:
                super.draw(ctx);
        }
    }
    
    drawLaser(ctx) {
        // 激光效果
        ctx.save();
        const gradient = ctx.createLinearGradient(this.x, this.y - this.height/2, this.x, this.y + this.height/2);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.5, '#00ffff');
        gradient.addColorStop(1, '#0088ff');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        
        // 外层光晕
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 15;
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        ctx.restore();
    }
    
    drawPlasma(ctx) {
        // 等离子体效果
        ctx.save();
        ctx.fillStyle = '#ff00ff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2);
        ctx.fill();
        
        // 内核
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // 光晕
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    drawMissile(ctx) {
        // 导弹效果
        ctx.save();
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        
        // 弹头
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.height / 2);
        ctx.lineTo(this.x - this.width / 2, this.y - this.height / 2 + 4);
        ctx.lineTo(this.x + this.width / 2, this.y - this.height / 2 + 4);
        ctx.closePath();
        ctx.fill();
        
        // 尾焰
        ctx.fillStyle = '#ff8800';
        ctx.fillRect(this.x - this.width / 4, this.y + this.height / 2, this.width / 2, 4);
        ctx.restore();
    }
}

// 敌机子弹类
class EnemyBullet extends Bullet {
    constructor(x, y, targetX, targetY, options = {}) {
        const angle = Math.atan2(targetY - y, targetX - x);
        const speed = options.speed || 4;
        super(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, {
            width: 6,
            height: 6,
            damage: 1,
            color: '#ff4444',
            isPlayerBullet: false,
            maxTrailLength: 6,
            ...options
        });
        this.type = options.type || 'normal';
        this.angle = angle;
    }
    
    draw(ctx) {
        switch (this.type) {
            case 'energy':
                this.drawEnergy(ctx);
                break;
            case 'homing':
                this.drawHoming(ctx);
                break;
            default:
                this.drawNormal(ctx);
        }
    }
    
    drawNormal(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 发光效果
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    drawEnergy(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // 能量球效果
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.width);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.5, '#ff00ff');
        gradient.addColorStop(1, '#8800ff');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 外层光环
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2 + 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
    
    drawHoming(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // 追踪导弹效果
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // 导引头
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(0, -this.height / 2, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 尾焰
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(-this.width / 4, this.height / 2, this.width / 2, 3);
        ctx.restore();
    }
}

// 特殊子弹类
class SpecialBullet extends PlayerBullet {
    constructor(x, y, type, options = {}) {
        super(x, y, { type, ...options });
        this.specialTimer = 0;
        this.rotationAngle = 0;
    }
    
    update() {
        const alive = super.update();
        this.specialTimer++;
        this.rotationAngle += 0.2;
        
        // 特殊行为
        if (this.type === 'wave') {
            this.x += Math.sin(this.specialTimer * 0.1) * 2;
        } else if (this.type === 'spiral') {
            const radius = this.specialTimer * 0.5;
            this.x += Math.cos(this.rotationAngle) * 0.5;
        }
        
        return alive;
    }
}

// 子弹管理器
class BulletManager {
    constructor() {
        this.bullets = [];
    }
    
    addBullet(bullet) {
        this.bullets.push(bullet);
        
        // 统计玩家射击次数
        if (bullet.isPlayerBullet && window.game) {
            window.game.totalShots++;
        }
    }
    
    update() {
        this.bullets = this.bullets.filter(bullet => bullet.update());
    }
    
    draw(ctx) {
        this.bullets.forEach(bullet => bullet.draw(ctx));
    }
    
    getPlayerBullets() {
        return this.bullets.filter(bullet => bullet.isPlayerBullet);
    }
    
    getEnemyBullets() {
        return this.bullets.filter(bullet => !bullet.isPlayerBullet);
    }
    
    clear() {
        this.bullets = [];
    }
    
    removeBullet(bullet) {
        const index = this.bullets.indexOf(bullet);
        if (index > -1) {
            this.bullets.splice(index, 1);
        }
    }
} 