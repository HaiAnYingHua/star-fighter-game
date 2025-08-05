// 工具函数集合

// 计算两点之间的距离
function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// 检测两个矩形是否碰撞
function rectCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// 检测圆形碰撞
function circleCollision(circle1, circle2) {
    const dist = distance(circle1.x, circle1.y, circle2.x, circle2.y);
    return dist < circle1.radius + circle2.radius;
}

// 限制数值在指定范围内
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// 生成随机数
function random(min, max) {
    return Math.random() * (max - min) + min;
}

// 生成随机整数
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 角度转弧度
function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

// 弧度转角度
function toDegrees(radians) {
    return radians * 180 / Math.PI;
}

// 线性插值
function lerp(start, end, factor) {
    return start + (end - start) * factor;
}

// 获取触摸位置（相对于画布）
function getTouchPos(canvas, touchEvent) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
        x: (touchEvent.clientX - rect.left) * scaleX,
        y: (touchEvent.clientY - rect.top) * scaleY
    };
}

// 获取鼠标位置（相对于画布）
function getMousePos(canvas, mouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
        x: (mouseEvent.clientX - rect.left) * scaleX,
        y: (mouseEvent.clientY - rect.top) * scaleY
    };
}

// 创建颜色渐变
function createGradient(ctx, x1, y1, x2, y2, colors) {
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    colors.forEach((color, index) => {
        gradient.addColorStop(index / (colors.length - 1), color);
    });
    return gradient;
}

// 绘制圆角矩形
function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

// 本地存储操作
const Storage = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn('无法保存到本地存储:', e);
        }
    },
    
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.warn('无法从本地存储读取:', e);
            return defaultValue;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn('无法从本地存储删除:', e);
        }
    }
};

// 性能监控
class PerformanceMonitor {
    constructor() {
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 60;
    }
    
    update() {
        this.frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - this.lastTime >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
            this.frameCount = 0;
            this.lastTime = currentTime;
        }
    }
    
    getFPS() {
        return this.fps;
    }
} 