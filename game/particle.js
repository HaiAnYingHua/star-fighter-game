// 粒子类
class Particle {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = options.vx || random(-2, 2);
        this.vy = options.vy || random(-2, 2);
        this.life = options.life || 1.0;
        this.maxLife = this.life;
        this.size = options.size || random(2, 6);
        this.color = options.color || '#ff6b6b';
        this.gravity = options.gravity || 0;
        this.friction = options.friction || 0.98;
        this.alpha = 1.0;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        this.life -= 0.02;
        this.alpha = this.life / this.maxLife;
        
        return this.life > 0;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// 粒子系统管理器
class ParticleSystem {
    constructor() {
        this.particles = [];
    }
    
    // 创建爆炸效果
    createExplosion(x, y, count = 15, options = {}) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = random(2, 8);
            const particle = new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: random(0.5, 1.5),
                size: random(3, 8),
                color: options.color || (Math.random() > 0.5 ? '#ff6b6b' : '#ffa500'),
                friction: 0.95,
                ...options
            });
            this.particles.push(particle);
        }
    }
    
    // 创建火花效果
    createSparks(x, y, count = 8, options = {}) {
        for (let i = 0; i < count; i++) {
            const particle = new Particle(x, y, {
                vx: random(-4, 4),
                vy: random(-4, 4),
                life: random(0.3, 0.8),
                size: random(1, 3),
                color: options.color || '#ffff00',
                gravity: 0.1,
                friction: 0.99,
                ...options
            });
            this.particles.push(particle);
        }
    }
    
    // 创建烟雾效果
    createSmoke(x, y, count = 5, options = {}) {
        for (let i = 0; i < count; i++) {
            const particle = new Particle(x, y, {
                vx: random(-1, 1),
                vy: random(-3, -1),
                life: random(1.0, 2.0),
                size: random(5, 12),
                color: options.color || '#666666',
                friction: 0.98,
                ...options
            });
            this.particles.push(particle);
        }
    }
    
    // 创建星星效果
    createStars(x, y, count = 10, options = {}) {
        for (let i = 0; i < count; i++) {
            const angle = random(0, Math.PI * 2);
            const speed = random(1, 4);
            const particle = new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: random(0.8, 1.5),
                size: random(2, 5),
                color: options.color || '#4ecdc4',
                friction: 0.97,
                ...options
            });
            this.particles.push(particle);
        }
    }
    
    // 创建拖尾效果
    createTrail(x, y, options = {}) {
        const particle = new Particle(x, y, {
            vx: random(-0.5, 0.5),
            vy: random(0.5, 2),
            life: random(0.2, 0.5),
            size: random(2, 4),
            color: options.color || '#ffffff',
            friction: 0.95,
            ...options
        });
        this.particles.push(particle);
    }
    
    update() {
        this.particles = this.particles.filter(particle => particle.update());
    }
    
    draw(ctx) {
        this.particles.forEach(particle => particle.draw(ctx));
    }
    
    clear() {
        this.particles = [];
    }
    
    getCount() {
        return this.particles.length;
    }
}

// 特殊粒子效果类
class SpecialParticle extends Particle {
    constructor(x, y, type, options = {}) {
        super(x, y, options);
        this.type = type;
        this.angle = 0;
        this.rotationSpeed = options.rotationSpeed || random(-0.2, 0.2);
        this.pulseSpeed = options.pulseSpeed || 0.1;
        this.baseSize = this.size;
    }
    
    update() {
        const alive = super.update();
        this.angle += this.rotationSpeed;
        
        // 脉冲效果
        if (this.type === 'pulse') {
            this.size = this.baseSize + Math.sin(Date.now() * this.pulseSpeed) * 2;
        }
        
        return alive;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        switch (this.type) {
            case 'star':
                this.drawStar(ctx);
                break;
            case 'diamond':
                this.drawDiamond(ctx);
                break;
            case 'cross':
                this.drawCross(ctx);
                break;
            default:
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.fill();
        }
        
        ctx.restore();
    }
    
    drawStar(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5;
            const x = Math.cos(angle) * this.size;
            const y = Math.sin(angle) * this.size;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            
            const innerAngle = ((i + 0.5) * Math.PI * 2) / 5;
            const innerX = Math.cos(innerAngle) * this.size * 0.5;
            const innerY = Math.sin(innerAngle) * this.size * 0.5;
            ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();
    }
    
    drawDiamond(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, -this.size);
        ctx.lineTo(this.size, 0);
        ctx.lineTo(0, this.size);
        ctx.lineTo(-this.size, 0);
        ctx.closePath();
        ctx.fill();
    }
    
    drawCross(ctx) {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-this.size, 0);
        ctx.lineTo(this.size, 0);
        ctx.moveTo(0, -this.size);
        ctx.lineTo(0, this.size);
        ctx.stroke();
    }
} 