// 音效管理器
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterVolume = 0.3;
        this.soundEnabled = true;
        this.sounds = {};
        
        // 初始化音频上下文
        this.initAudioContext();
        
        // 预生成音效
        this.generateSounds();
    }
    
    initAudioContext() {
        try {
            // 创建音频上下文
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 创建主音量控制
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.masterVolume;
            this.masterGain.connect(this.audioContext.destination);
            
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
            this.soundEnabled = false;
        }
    }
    
    // 恢复音频上下文（用户交互后）
    resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    generateSounds() {
        if (!this.soundEnabled) return;
        
        // 生成各种音效
        this.sounds = {
            shoot: this.generateShootSound(),
            explosion: this.generateExplosionSound(),
            powerup: this.generatePowerUpSound(),
            hit: this.generateHitSound(),
            enemyShoot: this.generateEnemyShootSound(),
            playerHit: this.generatePlayerHitSound(),
            bossAppear: this.generateBossAppearSound(),
            levelUp: this.generateLevelUpSound()
        };
    }
    
    // 生成射击音效
    generateShootSound() {
        return () => {
            if (!this.soundEnabled) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.1);
        };
    }
    
    // 生成爆炸音效
    generateExplosionSound() {
        return () => {
            if (!this.soundEnabled) return;
            
            // 低频爆炸声
            const oscillator1 = this.audioContext.createOscillator();
            const gainNode1 = this.audioContext.createGain();
            
            oscillator1.type = 'sawtooth';
            oscillator1.frequency.setValueAtTime(150, this.audioContext.currentTime);
            oscillator1.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.3);
            
            gainNode1.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode1.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            // 高频爆裂声
            const oscillator2 = this.audioContext.createOscillator();
            const gainNode2 = this.audioContext.createGain();
            
            oscillator2.type = 'square';
            oscillator2.frequency.setValueAtTime(1000, this.audioContext.currentTime);
            oscillator2.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.1);
            
            gainNode2.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode2.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            
            // 噪音效果
            const bufferSize = this.audioContext.sampleRate * 0.2;
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
            }
            
            const noiseSource = this.audioContext.createBufferSource();
            const noiseGain = this.audioContext.createGain();
            
            noiseSource.buffer = buffer;
            noiseGain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
            
            // 连接所有节点
            oscillator1.connect(gainNode1);
            oscillator2.connect(gainNode2);
            noiseSource.connect(noiseGain);
            
            gainNode1.connect(this.masterGain);
            gainNode2.connect(this.masterGain);
            noiseGain.connect(this.masterGain);
            
            // 播放
            oscillator1.start();
            oscillator2.start();
            noiseSource.start();
            
            oscillator1.stop(this.audioContext.currentTime + 0.3);
            oscillator2.stop(this.audioContext.currentTime + 0.1);
            noiseSource.stop(this.audioContext.currentTime + 0.2);
        };
    }
    
    // 生成道具音效
    generatePowerUpSound() {
        return () => {
            if (!this.soundEnabled) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
            oscillator.frequency.linearRampToValueAtTime(800, this.audioContext.currentTime + 0.1);
            oscillator.frequency.linearRampToValueAtTime(600, this.audioContext.currentTime + 0.2);
            oscillator.frequency.linearRampToValueAtTime(1000, this.audioContext.currentTime + 0.3);
            
            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.1);
            gainNode.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + 0.2);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.3);
        };
    }
    
    // 生成击中音效
    generateHitSound() {
        return () => {
            if (!this.soundEnabled) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(150, this.audioContext.currentTime + 0.05);
            
            gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.05);
        };
    }
    
    // 生成敌机射击音效
    generateEnemyShootSound() {
        return () => {
            if (!this.soundEnabled) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.08);
            
            gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.08);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.08);
        };
    }
    
    // 生成玩家受伤音效
    generatePlayerHitSound() {
        return () => {
            if (!this.soundEnabled) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
            oscillator.frequency.linearRampToValueAtTime(100, this.audioContext.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.2);
        };
    }
    
    // 生成Boss出现音效
    generateBossAppearSound() {
        return () => {
            if (!this.soundEnabled) return;
            
            // 低频震动
            const oscillator1 = this.audioContext.createOscillator();
            const gainNode1 = this.audioContext.createGain();
            
            oscillator1.type = 'sine';
            oscillator1.frequency.setValueAtTime(50, this.audioContext.currentTime);
            oscillator1.frequency.linearRampToValueAtTime(80, this.audioContext.currentTime + 1.0);
            
            gainNode1.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode1.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1.0);
            
            // 高频警报
            const oscillator2 = this.audioContext.createOscillator();
            const gainNode2 = this.audioContext.createGain();
            
            oscillator2.type = 'square';
            oscillator2.frequency.setValueAtTime(800, this.audioContext.currentTime);
            
            // 创建颤音效果
            const lfo = this.audioContext.createOscillator();
            const lfoGain = this.audioContext.createGain();
            
            lfo.type = 'sine';
            lfo.frequency.setValueAtTime(10, this.audioContext.currentTime);
            lfoGain.gain.setValueAtTime(50, this.audioContext.currentTime);
            
            lfo.connect(lfoGain);
            lfoGain.connect(oscillator2.frequency);
            
            gainNode2.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode2.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1.0);
            
            // 连接
            oscillator1.connect(gainNode1);
            oscillator2.connect(gainNode2);
            gainNode1.connect(this.masterGain);
            gainNode2.connect(this.masterGain);
            
            // 播放
            oscillator1.start();
            oscillator2.start();
            lfo.start();
            
            oscillator1.stop(this.audioContext.currentTime + 1.0);
            oscillator2.stop(this.audioContext.currentTime + 1.0);
            lfo.stop(this.audioContext.currentTime + 1.0);
        };
    }
    
    // 生成升级音效
    generateLevelUpSound() {
        return () => {
            if (!this.soundEnabled) return;
            
            // 上升音阶
            const frequencies = [261.63, 329.63, 392.00, 523.25]; // C, E, G, C
            
            frequencies.forEach((freq, index) => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime + index * 0.1);
                
                gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime + index * 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + index * 0.1 + 0.2);
                
                oscillator.connect(gainNode);
                gainNode.connect(this.masterGain);
                
                oscillator.start(this.audioContext.currentTime + index * 0.1);
                oscillator.stop(this.audioContext.currentTime + index * 0.1 + 0.2);
            });
        };
    }
    
    // 播放音效
    playSound(soundName) {
        if (!this.soundEnabled || !this.sounds[soundName]) return;
        
        try {
            this.resumeAudioContext();
            this.sounds[soundName]();
        } catch (e) {
            console.warn('Error playing sound:', e);
        }
    }
    
    // 设置主音量
    setMasterVolume(volume) {
        this.masterVolume = clamp(volume, 0, 1);
        if (this.masterGain) {
            this.masterGain.gain.value = this.masterVolume;
        }
    }
    
    // 获取主音量
    getMasterVolume() {
        return this.masterVolume;
    }
    
    // 切换音效开关
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        return this.soundEnabled;
    }
    
    // 检查音效是否启用
    isSoundEnabled() {
        return this.soundEnabled;
    }
    
    // 播放背景音乐（简单的循环音调）
    startBackgroundMusic() {
        if (!this.soundEnabled) return;
        
        this.stopBackgroundMusic();
        
        // 创建简单的背景音乐
        this.bgOscillator = this.audioContext.createOscillator();
        this.bgGain = this.audioContext.createGain();
        this.bgLfo = this.audioContext.createOscillator();
        this.bgLfoGain = this.audioContext.createGain();
        
        // 主音调
        this.bgOscillator.type = 'sine';
        this.bgOscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
        
        // LFO调制
        this.bgLfo.type = 'sine';
        this.bgLfo.frequency.setValueAtTime(0.5, this.audioContext.currentTime);
        this.bgLfoGain.gain.setValueAtTime(10, this.audioContext.currentTime);
        
        // 音量控制
        this.bgGain.gain.setValueAtTime(0.05, this.audioContext.currentTime);
        
        // 连接
        this.bgLfo.connect(this.bgLfoGain);
        this.bgLfoGain.connect(this.bgOscillator.frequency);
        this.bgOscillator.connect(this.bgGain);
        this.bgGain.connect(this.masterGain);
        
        // 开始播放
        this.bgOscillator.start();
        this.bgLfo.start();
    }
    
    // 停止背景音乐
    stopBackgroundMusic() {
        if (this.bgOscillator) {
            try {
                this.bgOscillator.stop();
                this.bgLfo.stop();
            } catch (e) {
                // 忽略已经停止的错误
            }
            this.bgOscillator = null;
            this.bgLfo = null;
            this.bgGain = null;
            this.bgLfoGain = null;
        }
    }
    
    // 清理资源
    destroy() {
        this.stopBackgroundMusic();
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

// 音效快捷播放函数
function playSound(soundName) {
    if (window.audioManager) {
        window.audioManager.playSound(soundName);
    }
} 