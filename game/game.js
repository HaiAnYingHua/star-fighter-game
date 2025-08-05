// 主游戏类
class Game {
    constructor() {
        // 游戏状态
        this.state = 'start'; // start, playing, paused, gameOver, settings, levelUp, bossWarning
        this.score = 0;
        this.highScore = Storage.get('highScore', 0);
        this.level = 1;
        this.kills = 0;
        this.totalShots = 0;
        this.totalHits = 0;
        this.startTime = 0;
        this.survivalTime = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.comboTimer = 0;
        this.difficulty = 'normal';
        
        // 画布和上下文
        this.canvas = null;
        this.ctx = null;
        this.miniMapCanvas = null;
        this.miniMapCtx = null;
        
        // 游戏对象管理器
        this.player = null;
        this.bulletManager = new BulletManager();
        this.enemyManager = new EnemyManager();
        this.powerUpManager = new PowerUpManager();
        this.particleSystem = new ParticleSystem();
        this.audioManager = new AudioManager();
        
        // 技能系统
        this.skills = {
            superShot: { cooldown: 0, maxCooldown: 10000, active: false },
            timeWarp: { cooldown: 0, maxCooldown: 15000, active: false, duration: 0 },
            energyShield: { cooldown: 0, maxCooldown: 12000, active: false },
            clearBomb: { cooldown: 0, maxCooldown: 20000, active: false }
        };
        
        // 成就系统
        this.achievements = new Set();
        this.achievementDefinitions = {
            firstKill: { name: '首次击杀', desc: '击败第一个敌人', icon: '🎯' },
            combo10: { name: '连击高手', desc: '达成10连击', icon: '🔥' },
            combo50: { name: '连击大师', desc: '达成50连击', icon: '⚡' },
            survivor: { name: '生存专家', desc: '存活5分钟', icon: '⏰' },
            bossKiller: { name: 'Boss终结者', desc: '击败第一个Boss', icon: '👑' },
            collector: { name: '收集家', desc: '收集50个道具', icon: '🎁' },
            marksman: { name: '神枪手', desc: '命中率达到90%', icon: '🎯' }
        };
        
        // 输入管理
        this.input = {
            left: false,
            right: false,
            up: false,
            down: false,
            shoot: false,
            pause: false
        };
        
        // 触摸控制
        this.touchActive = false;
        this.touchX = 0;
        this.touchY = 0;
        
        // 游戏循环
        this.lastTime = 0;
        this.gameLoop = this.gameLoop.bind(this);
        
        // 性能监控
        this.performanceMonitor = new PerformanceMonitor();
        
        // 游戏记录管理器
        this.gameRecordManager = new GameRecordManager();
        
        // 背景效果
        this.stars = [];
        this.nebulae = [];
        this.meteors = [];
        this.meteorTimer = 0;
        
        // 屏幕震动
        this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
        this.screenShakeEnabled = true;
        
        // 粒子背景
        this.backgroundParticles = [];
        this.particleEffectsEnabled = true;
        
        // 警告系统
        this.warningActive = false;
        this.warningTimer = 0;
        
        // 时间减缓效果
        this.timeScale = 1.0;
        
        // 初始化游戏
        this.init();
    }
    
    init() {
        // 获取画布
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 获取迷你地图画布
        this.miniMapCanvas = document.getElementById('miniMap');
        this.miniMapCtx = this.miniMapCanvas.getContext('2d');
        this.miniMapCanvas.width = 120;
        this.miniMapCanvas.height = 160;
        
        // 设置画布大小
        this.resizeCanvas();
        
        // 创建玩家
        this.player = new Player(this.canvas.width / 2, this.canvas.height - 100);
        
        // 设置全局变量
        window.canvas = this.canvas;
        window.audioManager = this.audioManager;
        
        // 初始化背景粒子
        this.initBackgroundParticles();
        
        // 绑定事件
        this.bindEvents();
        
        // 显示主菜单
        this.showMainMenu();
        
        // 开始游戏循环
        requestAnimationFrame(this.gameLoop);
    }
    
    resizeCanvas() {
        const container = document.getElementById('gameContainer');
        const containerRect = container.getBoundingClientRect();
        
        // 计算合适的画布大小
        const aspectRatio = 3 / 4; // 宽高比
        let canvasWidth = Math.min(containerRect.width * 0.95, 600); // 增加最大宽度到600px，容器占比提高到95%
        let canvasHeight = canvasWidth / aspectRatio;
        
        if (canvasHeight > containerRect.height * 0.95) { // 容器占比提高到95%
            canvasHeight = containerRect.height * 0.95;
            canvasWidth = canvasHeight * aspectRatio;
        }
        
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        
        // 更新画布样式
        this.canvas.style.width = canvasWidth + 'px';
        this.canvas.style.height = canvasHeight + 'px';
        
        // 初始化星空背景（在画布尺寸设置后）
        this.initStars();
    }
    
    initStars() {
        // 创建背景星星 - 增强版本
        this.stars = [];
        
        // 远景小星星
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: random(0, this.canvas.width || 400),
                y: random(0, this.canvas.height || 600),
                size: random(0.5, 1.5),
                speed: random(0.2, 0.8),
                brightness: random(0.3, 0.7),
                twinkle: random(0, Math.PI * 2),
                twinkleSpeed: random(0.01, 0.03),
                color: '#ffffff',
                type: 'small'
            });
        }
        
        // 中景星星
        for (let i = 0; i < 60; i++) {
            this.stars.push({
                x: random(0, this.canvas.width || 400),
                y: random(0, this.canvas.height || 600),
                size: random(1.5, 3),
                speed: random(0.8, 1.5),
                brightness: random(0.5, 0.9),
                twinkle: random(0, Math.PI * 2),
                twinkleSpeed: random(0.02, 0.04),
                color: random() > 0.6 ? '#add8e6' : '#ffffff',
                type: 'medium'
            });
        }
        
        // 近景大星星
        for (let i = 0; i < 30; i++) {
            this.stars.push({
                x: random(0, this.canvas.width || 400),
                y: random(0, this.canvas.height || 600),
                size: random(2, 5),
                speed: random(1.5, 3),
                brightness: random(0.7, 1),
                twinkle: random(0, Math.PI * 2),
                twinkleSpeed: random(0.03, 0.06),
                color: ['#ffffff', '#add8e6', '#87ceeb', '#b0c4de', '#e6e6fa', '#f0f8ff'][Math.floor(random(0, 6))],
                type: 'large'
            });
        }
        
        // 银河系星云效果
        this.nebulae = [];
        for (let i = 0; i < 5; i++) {
            this.nebulae.push({
                x: random(0, this.canvas.width || 400),
                y: random(0, this.canvas.height || 600),
                size: random(100, 200),
                speed: random(0.05, 0.2),
                opacity: random(0.15, 0.4),
                color: ['#191970', '#483d8b', '#6a5acd', '#9370db', '#add8e6', '#87ceeb'][Math.floor(random(0, 6))],
                rotation: random(0, Math.PI * 2),
                rotationSpeed: random(-0.003, 0.003)
            });
        }
        
        // 流星
        this.meteors = [];
        this.meteorTimer = 0;
    }
    
    initBackgroundParticles() {
        const particleBg = document.getElementById('particleBg');
        
        // 清除现有粒子
        particleBg.innerHTML = '';
        
        // 创建不同类型的粒子
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            
            // 随机大小
            const size = Math.random() * 6 + 2;
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            
            // 随机动画延迟和持续时间
            particle.style.animationDelay = Math.random() * 10 + 's';
            particle.style.animationDuration = (Math.random() * 8 + 6) + 's';
            
            // 随机透明度
            particle.style.opacity = Math.random() * 0.8 + 0.2;
            
            particleBg.appendChild(particle);
        }
        
        // 添加一些特殊的大粒子
        for (let i = 0; i < 5; i++) {
            const bigParticle = document.createElement('div');
            bigParticle.className = 'particle';
            bigParticle.style.left = Math.random() * 100 + '%';
            bigParticle.style.top = Math.random() * 100 + '%';
            
            const size = Math.random() * 10 + 8;
            bigParticle.style.width = size + 'px';
            bigParticle.style.height = size + 'px';
            
            bigParticle.style.animationDelay = Math.random() * 15 + 's';
            bigParticle.style.animationDuration = (Math.random() * 12 + 10) + 's';
            bigParticle.style.opacity = Math.random() * 0.4 + 0.1;
            
            particleBg.appendChild(bigParticle);
        }
    }
    
    bindEvents() {
        // 键盘事件
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // 触摸事件
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // 鼠标事件（用于桌面测试）
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // 按钮事件
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('settingsBtn').addEventListener('click', () => this.showSettings());
        document.getElementById('backBtn').addEventListener('click', () => this.hideSettings());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('endGameBtn').addEventListener('click', () => this.endCurrentGame());
        document.getElementById('resumeBtn').addEventListener('click', () => this.resumeGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('mainMenuBtn').addEventListener('click', () => this.showMainMenu());
        document.getElementById('playAgainBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('shareBtn').addEventListener('click', () => this.shareScore());
        document.getElementById('backToMenuBtn').addEventListener('click', () => this.showMainMenu());
        
        // 游戏记录相关按钮
        document.getElementById('recordsBtn').addEventListener('click', () => this.showGameRecords());
        document.getElementById('exportRecordsBtn').addEventListener('click', () => this.exportGameRecords());
        document.getElementById('importRecordsBtn').addEventListener('click', () => this.importGameRecords());
        document.getElementById('clearRecordsBtn').addEventListener('click', () => this.clearGameRecords());
        document.getElementById('backFromRecordsBtn').addEventListener('click', () => this.hideGameRecords());
        
        // 记录过滤和排序
        document.getElementById('recordsFilter').addEventListener('change', () => this.updateGameRecordsDisplay());
        document.getElementById('recordsSort').addEventListener('change', () => this.updateGameRecordsDisplay());
        
        // 技能按钮事件
        document.getElementById('skill1').addEventListener('click', () => this.useSkill('superShot'));
        document.getElementById('skill2').addEventListener('click', () => this.useSkill('timeWarp'));
        document.getElementById('skill3').addEventListener('click', () => this.useSkill('energyShield'));
        document.getElementById('skill4').addEventListener('click', () => this.useSkill('clearBomb'));
        
        // 升级按钮事件
        document.querySelectorAll('.upgrade-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectUpgrade(e.target.dataset.upgrade));
        });
        
        // 设置控件事件
        document.getElementById('volumeSlider').addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            this.audioManager.setMasterVolume(volume);
            document.getElementById('volumeValue').textContent = e.target.value + '%';
        });
        
        document.getElementById('particleToggle').addEventListener('change', (e) => {
            this.particleEffectsEnabled = e.target.checked;
        });
        
        document.getElementById('screenShakeToggle').addEventListener('change', (e) => {
            this.screenShakeEnabled = e.target.checked;
        });
        
        document.getElementById('difficultySelect').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
        });
        
        // 窗口大小变化
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // 防止页面滚动
        document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    }
    
    handleKeyDown(e) {
        switch (e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                this.input.left = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.input.right = true;
                break;
            case 'ArrowUp':
            case 'KeyW':
                this.input.up = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.input.down = true;
                break;
            case 'Space':
                this.input.shoot = true;
                e.preventDefault();
                break;
            case 'KeyP':
            case 'Escape':
                this.togglePause();
                break;
            case 'Digit1':
                this.useSkill('superShot');
                break;
            case 'Digit2':
                this.useSkill('timeWarp');
                break;
            case 'Digit3':
                this.useSkill('energyShield');
                break;
            case 'Digit4':
                this.useSkill('clearBomb');
                break;
            case 'KeyQ':
                if (e.ctrlKey) { // Ctrl+Q 结束游戏
                    this.endCurrentGame();
                    e.preventDefault();
                }
                break;
        }
    }
    
    handleKeyUp(e) {
        switch (e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                this.input.left = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.input.right = false;
                break;
            case 'ArrowUp':
            case 'KeyW':
                this.input.up = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.input.down = false;
                break;
            case 'Space':
                this.input.shoot = false;
                break;
        }
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        this.touchActive = true;
        const touch = e.touches[0];
        const pos = getTouchPos(this.canvas, touch);
        this.touchX = pos.x;
        this.touchY = pos.y;
        this.player.setTarget(pos.x, pos.y);
        
        // 恢复音频上下文
        this.audioManager.resumeAudioContext();
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        if (this.touchActive) {
            const touch = e.touches[0];
            const pos = getTouchPos(this.canvas, touch);
            this.touchX = pos.x;
            this.touchY = pos.y;
            this.player.setTarget(pos.x, pos.y);
        }
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        this.touchActive = false;
    }
    
    handleMouseDown(e) {
        const pos = getMousePos(this.canvas, e);
        this.touchX = pos.x;
        this.touchY = pos.y;
        this.player.setTarget(pos.x, pos.y);
        this.touchActive = true;
        
        // 恢复音频上下文
        this.audioManager.resumeAudioContext();
    }
    
    handleMouseMove(e) {
        if (this.touchActive) {
            const pos = getMousePos(this.canvas, e);
            this.touchX = pos.x;
            this.touchY = pos.y;
            this.player.setTarget(pos.x, pos.y);
        }
    }
    
    handleMouseUp(e) {
        this.touchActive = false;
    }
    
    startGame() {
        this.state = 'playing';
        this.hideAllScreens();
        document.getElementById('gameControls').classList.remove('hidden');
        document.getElementById('skillBar').classList.remove('hidden');
        
        // 重置游戏状态
        this.score = 0;
        this.level = 1;
        this.kills = 0;
        this.totalShots = 0;
        this.totalHits = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.comboTimer = 0;
        this.startTime = Date.now();
        this.achievements.clear();
        
        // 重置技能冷却
        Object.keys(this.skills).forEach(skill => {
            this.skills[skill].cooldown = 0;
            this.skills[skill].active = false;
            this.skills[skill].duration = 0;
        });
        
        this.player.reset();
        this.bulletManager.clear();
        this.enemyManager.clear();
        this.powerUpManager.clear();
        this.particleSystem.clear();
        
        // 应用难度设置
        this.applyDifficulty();
        
        // 开始背景音乐
        this.audioManager.startBackgroundMusic();
        
        this.updateUI();
    }
    
    applyDifficulty() {
        const difficultySettings = {
            easy: { enemySpeedMultiplier: 0.7, enemyHealthMultiplier: 0.8, playerLives: 5 },
            normal: { enemySpeedMultiplier: 1.0, enemyHealthMultiplier: 1.0, playerLives: 3 },
            hard: { enemySpeedMultiplier: 1.3, enemyHealthMultiplier: 1.2, playerLives: 2 },
            nightmare: { enemySpeedMultiplier: 1.6, enemyHealthMultiplier: 1.5, playerLives: 1 }
        };
        
        const settings = difficultySettings[this.difficulty];
        this.enemyManager.setDifficulty(settings);
        this.player.lives = settings.playerLives;
        this.player.health = this.player.maxHealth;
    }
    
    showSettings() {
        this.hideAllScreens();
        document.getElementById('settingsScreen').classList.remove('hidden');
    }
    
    hideSettings() {
        document.getElementById('settingsScreen').classList.add('hidden');
        document.getElementById('startScreen').classList.remove('hidden');
    }
    
    showMainMenu() {
        this.state = 'start';
        this.hideAllScreens();
        document.getElementById('startScreen').classList.remove('hidden');
        document.getElementById('gameControls').classList.add('hidden');
        document.getElementById('skillBar').classList.add('hidden');
        this.audioManager.stopBackgroundMusic();
    }
    
    togglePause() {
        if (this.state === 'playing') {
            this.pauseGame();
        } else if (this.state === 'paused') {
            this.resumeGame();
        }
    }
    
    pauseGame() {
        this.state = 'paused';
        document.getElementById('pauseScreen').classList.remove('hidden');
        this.audioManager.stopBackgroundMusic();
        
        // 更新暂停界面统计
        this.updatePauseStats();
    }
    
    updatePauseStats() {
        document.getElementById('pauseScore').textContent = this.score;
        document.getElementById('pauseKills').textContent = this.kills;
        document.getElementById('pauseTime').textContent = this.formatTime(Date.now() - this.startTime);
    }
    
    resumeGame() {
        this.state = 'playing';
        document.getElementById('pauseScreen').classList.add('hidden');
        this.audioManager.startBackgroundMusic();
    }
    
    restartGame() {
        this.hideAllScreens();
        this.startGame();
    }
    
    endCurrentGame() {
        if (this.state !== 'playing') return;
        
        // 显示确认对话框
        if (confirm('确定要结束当前游戏吗？\n当前进度将会丢失，但会保存游戏记录。')) {
            // 计算当前游戏时间
            this.survivalTime = Date.now() - this.startTime;
            
            // 保存游戏记录，标记为主动退出
            this.saveGameRecord('quit');
            
            // 显示简化的游戏结束界面
            this.showQuickGameOver();
        }
    }
    
    showQuickGameOver() {
        this.state = 'gameOver';
        document.getElementById('gameControls').classList.add('hidden');
        document.getElementById('skillBar').classList.add('hidden');
        
        // 计算命中率
        const accuracy = this.totalShots > 0 ? Math.round((this.totalHits / this.totalShots) * 100) : 0;
        
        // 检查成就
        this.checkFinalAchievements(accuracy);
        
        // 显示游戏结束界面
        document.getElementById('finalScoreValue').textContent = this.score.toLocaleString();
        document.getElementById('highScoreValue').textContent = this.highScore.toLocaleString();
        document.getElementById('totalKillsValue').textContent = this.kills.toLocaleString();
        document.getElementById('survivalTimeValue').textContent = this.formatTime(this.survivalTime);
        document.getElementById('accuracyValue').textContent = `${accuracy}%`;
        
        // 显示获得的成就
        this.displayAchievements();
        
        // 添加主动结束的提示
        const gameOverScreen = document.getElementById('gameOverScreen');
        const gameOverTitle = gameOverScreen.querySelector('.game-over-title');
        if (gameOverTitle) {
            gameOverTitle.textContent = '游戏结束';
        }
        
        // 设置结束原因
        const endReasonElement = document.getElementById('endReason');
        if (endReasonElement) {
            endReasonElement.textContent = '✨ 主动结束游戏';
            endReasonElement.style.display = 'block';
        }
         
         gameOverScreen.classList.remove('hidden');
        
        // 停止背景音乐
        this.audioManager.stopBackgroundMusic();
        
        // 显示通知
        this.showNotification('游戏记录已保存！');
    }
    
    gameOver() {
        this.state = 'gameOver';
        document.getElementById('gameControls').classList.add('hidden');
        document.getElementById('skillBar').classList.add('hidden');
        
        this.survivalTime = Date.now() - this.startTime;
        
        // 更新最高分
        if (this.score > this.highScore) {
            this.highScore = this.score;
            Storage.set('highScore', this.highScore);
        }
        
        // 计算命中率
        const accuracy = this.totalShots > 0 ? Math.round((this.totalHits / this.totalShots) * 100) : 0;
        
        // 检查成就
        this.checkFinalAchievements(accuracy);
        
        // 保存游戏记录
        this.saveGameRecord('death');
        
        // 显示游戏结束界面
        document.getElementById('finalScoreValue').textContent = this.score.toLocaleString();
        document.getElementById('highScoreValue').textContent = this.highScore.toLocaleString();
        document.getElementById('totalKillsValue').textContent = this.kills.toLocaleString();
        document.getElementById('survivalTimeValue').textContent = this.formatTime(this.survivalTime);
        document.getElementById('accuracyValue').textContent = `${accuracy}%`;
        
        // 显示获得的成就
        this.displayAchievements();
        
        // 重置游戏结束界面的标题和结束原因
        const gameOverScreen = document.getElementById('gameOverScreen');
        const gameOverTitle = gameOverScreen.querySelector('.game-over-title');
        if (gameOverTitle) {
            gameOverTitle.textContent = '战机坠毁';
        }
        
        // 设置结束原因
        const endReasonElement = document.getElementById('endReason');
        if (endReasonElement) {
            endReasonElement.textContent = '任务失败';
            endReasonElement.style.display = 'block';
        }
        
        document.getElementById('gameOverScreen').classList.remove('hidden');
        
        // 停止背景音乐
        this.audioManager.stopBackgroundMusic();
    }
    
    checkFinalAchievements(accuracy) {
        if (this.survivalTime >= 300000) { // 5分钟
            this.unlockAchievement('survivor');
        }
        if (accuracy >= 90) {
            this.unlockAchievement('marksman');
        }
    }
    
    displayAchievements() {
        const achievementsContainer = document.getElementById('achievements');
        achievementsContainer.innerHTML = '';
        
        this.achievements.forEach(achievementId => {
            const achievement = this.achievementDefinitions[achievementId];
            if (achievement) {
                const badge = document.createElement('div');
                badge.className = 'achievement-badge';
                badge.textContent = `${achievement.icon} ${achievement.name}`;
                badge.title = achievement.desc;
                achievementsContainer.appendChild(badge);
            }
        });
    }
    
    shareScore() {
        const text = `我在星际战机中获得了 ${this.score} 分！击杀了 ${this.kills} 个敌人，存活了 ${this.formatTime(this.survivalTime)}！`;
        
        if (navigator.share) {
            navigator.share({
                title: '星际战机 - 我的战绩',
                text: text,
                url: window.location.href
            });
        } else {
            // 复制到剪贴板
            navigator.clipboard.writeText(text).then(() => {
                this.showNotification('战绩已复制到剪贴板！');
            });
        }
    }
    
    hideAllScreens() {
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('settingsScreen').classList.add('hidden');
        document.getElementById('pauseScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('levelUpScreen').classList.add('hidden');
        document.getElementById('bossWarning').classList.add('hidden');
        document.getElementById('gameRecordsScreen').classList.add('hidden');
    }
    
    updateUI() {
        document.getElementById('score').textContent = `分数: ${this.score}`;
        document.getElementById('lives').textContent = `生命: ${this.player.lives}`;
        document.getElementById('level').textContent = `等级: ${this.level}`;
        document.getElementById('combo').textContent = `连击: ${this.combo}`;
    }
    
    // 技能系统
    useSkill(skillName) {
        if (this.state !== 'playing') return;
        
        const skill = this.skills[skillName];
        if (skill.cooldown > 0) return;
        
        switch (skillName) {
            case 'superShot':
                this.activateSuperShot();
                break;
            case 'timeWarp':
                this.activateTimeWarp();
                break;
            case 'energyShield':
                this.activateEnergyShield();
                break;
            case 'clearBomb':
                this.activateClearBomb();
                break;
        }
        
        skill.cooldown = skill.maxCooldown;
        this.audioManager.playSound('powerup');
    }
    
    activateSuperShot() {
        // 发射强力子弹扇形
        for (let i = -4; i <= 4; i++) {
            const angle = i * 0.2;
            const bullet = new PlayerBullet(this.player.x, this.player.y - this.player.height / 2, {
                vx: Math.sin(angle) * 3,
                vy: -10 + Math.cos(angle) * 2,
                damage: 3,
                type: 'laser',
                width: 6,
                height: 15
            });
            this.bulletManager.addBullet(bullet);
        }
        this.addScreenShake(5, 200);
    }
    
    activateTimeWarp() {
        this.timeScale = 0.3;
        this.skills.timeWarp.duration = 3000;
        this.skills.timeWarp.active = true;
    }
    
    activateEnergyShield() {
        this.player.hasShield = true;
        this.player.shieldHealth = this.player.maxShieldHealth * 2;
        this.skills.energyShield.active = true;
    }
    
    activateClearBomb() {
        // 清除所有敌机和敌机子弹
        this.enemyManager.enemies.forEach(enemy => {
            this.particleSystem.createExplosion(enemy.x, enemy.y, 10);
            this.score += enemy.score;
            this.kills++;
        });
        this.enemyManager.clear();
        
        // 清除敌机子弹
        const enemyBullets = this.bulletManager.getEnemyBullets();
        enemyBullets.forEach(bullet => {
            this.particleSystem.createStars(bullet.x, bullet.y, 3);
            this.bulletManager.removeBullet(bullet);
        });
        
        this.addScreenShake(15, 500);
        this.audioManager.playSound('explosion');
    }
    
    // 连击系统
    addCombo() {
        this.combo++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        this.comboTimer = 180; // 3秒
        
        // 显示连击
        if (this.combo >= 5) {
            this.showCombo();
        }
        
        // 检查连击成就
        if (this.combo === 10) {
            this.unlockAchievement('combo10');
        } else if (this.combo === 50) {
            this.unlockAchievement('combo50');
        }
        
        // 连击奖励分数
        if (this.combo > 1) {
            this.score += Math.floor(this.combo * 10);
        }
    }
    
    resetCombo() {
        this.combo = 0;
        this.comboTimer = 0;
    }
    
    showCombo() {
        const comboDisplay = document.getElementById('comboDisplay');
        comboDisplay.textContent = `COMBO x${this.combo}`;
        comboDisplay.classList.add('show');
        
        setTimeout(() => {
            comboDisplay.classList.remove('show');
        }, 1000);
    }
    
    // 成就系统
    unlockAchievement(achievementId) {
        if (this.achievements.has(achievementId)) return;
        
        this.achievements.add(achievementId);
        const achievement = this.achievementDefinitions[achievementId];
        
        if (achievement) {
            this.showAchievementNotification(achievement);
            this.audioManager.playSound('levelUp');
        }
    }
    
    showAchievementNotification(achievement) {
        const notification = document.getElementById('achievementNotification');
        notification.querySelector('.achievement-title').textContent = `🏆 ${achievement.name}`;
        notification.querySelector('.achievement-desc').textContent = achievement.desc;
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    // 屏幕震动
    addScreenShake(intensity, duration) {
        if (!this.screenShakeEnabled) return;
        
        this.screenShake.intensity = intensity;
        this.screenShake.duration = duration;
    }
    
    updateScreenShake() {
        if (this.screenShake.duration > 0) {
            this.screenShake.duration -= 16;
            this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity;
            
            if (this.screenShake.duration <= 0) {
                this.screenShake.x = 0;
                this.screenShake.y = 0;
            }
        }
    }
    
    // 警告系统
    showWarning(duration = 2000) {
        this.warningActive = true;
        this.warningTimer = duration;
        document.getElementById('warningOverlay').classList.remove('hidden');
    }
    
    hideWarning() {
        this.warningActive = false;
        this.warningTimer = 0;
        document.getElementById('warningOverlay').classList.add('hidden');
    }
    
    // 工具函数
    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    showNotification(message) {
        // 简单的通知显示
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 255, 255, 0.9);
            color: #000;
            padding: 15px 25px;
            border-radius: 10px;
            font-family: 'Orbitron', sans-serif;
            font-weight: bold;
            z-index: 1000;
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 2000);
    }
    
    update() {
        if (this.state !== 'playing') return;
        
        // 帧计数器用于性能优化
        this.frameCount = (this.frameCount || 0) + 1;
        
        const deltaTime = 16 * this.timeScale; // 考虑时间缩放
        
        // 更新屏幕震动
        this.updateScreenShake();
        
        // 更新警告系统
        if (this.warningActive) {
            this.warningTimer -= 16;
            if (this.warningTimer <= 0) {
                this.hideWarning();
            }
        }
        
        // 更新技能冷却和效果
        this.updateSkills();
        
        // 更新连击计时器
        if (this.comboTimer > 0) {
            this.comboTimer--;
            if (this.comboTimer <= 0) {
                this.resetCombo();
            }
        }
        
        // 更新背景星星
        this.updateStars();
        
        // 更新玩家
        this.player.update(this.input, this.powerUpManager);
        
        // 玩家自动射击
        this.player.shoot(this.bulletManager);
        
        // 更新子弹
        this.bulletManager.update();
        
        // 更新敌机
        this.enemyManager.update(this.player, this.bulletManager);
        
        // 更新道具（降低频率以提升性能）
        if (this.frameCount % 2 === 0) {
            this.powerUpManager.update();
        }
        
        // 更新粒子系统（降低频率以提升性能）
        if (this.particleEffectsEnabled && this.frameCount % 2 === 0) {
            this.particleSystem.update();
        }
        
        // 碰撞检测
        this.handleCollisions();
        
        // 更新等级
        this.updateLevel();
        
        // 更新UI
        this.updateUI();
        
        // 更新性能监控
        this.performanceMonitor.update();
    }
    
    updateSkills() {
        Object.keys(this.skills).forEach(skillName => {
            const skill = this.skills[skillName];
            
            // 更新冷却
            if (skill.cooldown > 0) {
                skill.cooldown -= 16;
                if (skill.cooldown < 0) skill.cooldown = 0;
            }
            
            // 更新技能效果持续时间
            if (skill.active && skill.duration !== undefined) {
                skill.duration -= 16;
                if (skill.duration <= 0) {
                    skill.active = false;
                    
                    // 结束技能效果
                    if (skillName === 'timeWarp') {
                        this.timeScale = 1.0;
                    }
                }
            }
            
            // 更新UI
            this.updateSkillUI(skillName, skill);
        });
    }
    
    updateSkillUI(skillName, skill) {
        const skillButton = document.getElementById(`skill${Object.keys(this.skills).indexOf(skillName) + 1}`);
        const overlay = skillButton.querySelector('.cooldown-overlay');
        
        if (skill.cooldown > 0) {
            skillButton.classList.add('cooldown');
            const progress = skill.cooldown / skill.maxCooldown;
            overlay.style.background = `conic-gradient(from 0deg, transparent ${(1-progress)*100}%, rgba(255, 0, 0, 0.7) 100%)`;
        } else {
            skillButton.classList.remove('cooldown');
            overlay.style.background = 'transparent';
        }
    }
    
    updateStars() {
        // 更新星星
        this.stars.forEach(star => {
            star.y += star.speed * this.timeScale;
            star.twinkle += star.twinkleSpeed;
            
            // 重置超出屏幕的星星
            if (star.y > this.canvas.height) {
                star.y = -10;
                star.x = random(0, this.canvas.width);
            }
        });
        
        // 更新星云
        if (this.nebulae) {
            this.nebulae.forEach(nebula => {
                nebula.y += nebula.speed * this.timeScale;
                nebula.rotation += nebula.rotationSpeed;
                
                // 重置超出屏幕的星云
                if (nebula.y > this.canvas.height + nebula.size) {
                    nebula.y = -nebula.size;
                    nebula.x = random(0, this.canvas.width);
                }
            });
        }
        
        // 更新流星
        if (this.meteors) {
            this.meteors = this.meteors.filter(meteor => {
                meteor.x += meteor.vx * this.timeScale;
                meteor.y += meteor.vy * this.timeScale;
                meteor.life -= 0.02;
                
                return meteor.life > 0 && meteor.x > -50 && meteor.x < this.canvas.width + 50;
            });
            
            // 随机生成流星
            this.meteorTimer += 16; // 假设60fps
            if (this.meteorTimer > 3000 + random(0, 5000)) { // 3-8秒随机生成
                this.createMeteor();
                this.meteorTimer = 0;
            }
        }
    }
    
    handleCollisions() {
        // 玩家子弹击中敌机
        const playerBullets = this.bulletManager.getPlayerBullets();
        const enemyHits = this.enemyManager.checkCollisions(playerBullets);
        
        enemyHits.forEach(hit => {
            this.totalHits++;
            
            // 播放音效
            this.audioManager.playSound('hit');
            
            // 创建爆炸效果
            if (this.particleEffectsEnabled) {
                this.particleSystem.createExplosion(hit.enemy.x, hit.enemy.y);
            }
            
            // 增加分数和连击
            this.score += hit.score;
            this.kills++;
            this.addCombo();
            
            // 移除子弹
            this.bulletManager.removeBullet(hit.bullet);
            
            // 检查首次击杀成就
            if (this.kills === 1) {
                this.unlockAchievement('firstKill');
            }
            
            // 有概率掉落道具
            if (Math.random() < 0.3) {
                const powerUpTypes = ['health', 'weapon_upgrade', 'shield', 'speed', 'multi_shot', 'score_bonus', 'rapid_fire', 'energy_shield', 'time_slow'];
                const randomType = powerUpTypes[randomInt(0, powerUpTypes.length - 1)];
                this.powerUpManager.spawnPowerUp(hit.enemy.x, hit.enemy.y, randomType);
            }
            
            // Boss死亡特效
            if (hit.enemy.type === 'boss') {
                if (this.particleEffectsEnabled) {
                    this.particleSystem.createExplosion(hit.enemy.x, hit.enemy.y, 30);
                }
                this.audioManager.playSound('explosion');
                this.addScreenShake(20, 800);
                this.unlockAchievement('bossKiller');
            }
        });
        
        // 敌机子弹击中玩家
        const enemyBullets = this.bulletManager.getEnemyBullets();
        enemyBullets.forEach(bullet => {
            if (rectCollision(bullet.getBounds(), this.player.getBounds())) {
                if (this.player.takeDamage()) {
                    // 玩家死亡
                    this.handlePlayerDeath();
                } else {
                    // 玩家受伤
                    this.audioManager.playSound('playerHit');
                    if (this.particleEffectsEnabled) {
                        this.particleSystem.createSparks(this.player.x, this.player.y);
                    }
                    this.addScreenShake(8, 300);
                    this.resetCombo();
                }
                this.bulletManager.removeBullet(bullet);
            }
        });
        
        // 敌机撞击玩家
        const collidedEnemy = this.enemyManager.checkPlayerCollisions(this.player);
        if (collidedEnemy) {
            if (this.player.takeDamage()) {
                this.handlePlayerDeath();
            } else {
                this.audioManager.playSound('playerHit');
                if (this.particleEffectsEnabled) {
                    this.particleSystem.createSparks(this.player.x, this.player.y);
                }
                this.addScreenShake(10, 400);
                this.resetCombo();
            }
            // 敌机也受伤
            collidedEnemy.takeDamage(999); // 直接摧毁
            if (this.particleEffectsEnabled) {
                this.particleSystem.createExplosion(collidedEnemy.x, collidedEnemy.y);
            }
        }
        
        // 玩家收集道具
        const collectedPowerUps = this.powerUpManager.checkCollisions(this.player);
        collectedPowerUps.forEach(powerUp => {
            const effect = this.powerUpManager.applyEffect(powerUp);
            this.handlePowerUpEffect(effect);
            this.audioManager.playSound('powerup');
            if (this.particleEffectsEnabled) {
                this.particleSystem.createStars(this.player.x, this.player.y);
            }
        });
    }
    
    handlePlayerDeath() {
        // 创建死亡特效
        if (this.particleEffectsEnabled) {
            this.particleSystem.createExplosion(this.player.x, this.player.y, 20);
        }
        this.audioManager.playSound('explosion');
        this.addScreenShake(15, 600);
        this.resetCombo();
        
        // 尝试重生
        if (this.player.respawn()) {
            // 重生成功，继续游戏
            if (this.particleEffectsEnabled) {
                this.particleSystem.createStars(this.player.x, this.player.y, 15);
            }
        } else {
            // 游戏结束
            this.gameOver();
        }
    }
    
    handlePowerUpEffect(effect) {
        switch (effect.type) {
            case 'heal':
                this.player.heal(effect.value);
                break;
            case 'score_bonus':
                this.score += effect.value;
                break;
            case 'weapon_upgrade':
                this.audioManager.playSound('levelUp');
                break;
            case 'energy_shield':
                this.player.activateEnergyShield();
                this.audioManager.playSound('powerUp');
                break;
            case 'time_slow':
                this.timeScale = 0.5;
                setTimeout(() => {
                    this.timeScale = 1.0;
                }, 5000);
                this.audioManager.playSound('powerUp');
                break;
        }
    }
    
    updateLevel() {
        const newLevel = Math.floor(this.score / 2000) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.audioManager.playSound('levelUp');
            
            // 等级提升奖励
            this.player.heal(1);
            if (this.particleEffectsEnabled) {
                this.particleSystem.createStars(this.player.x, this.player.y, 20);
            }
            
            // 每5级显示Boss警告
            if (this.level % 5 === 0) {
                this.showBossWarning();
            }
        }
    }
    
    showBossWarning() {
        this.state = 'bossWarning';
        document.getElementById('bossWarning').classList.remove('hidden');
        this.audioManager.playSound('bossAppear');
        
        setTimeout(() => {
            this.state = 'playing';
            document.getElementById('bossWarning').classList.add('hidden');
        }, 3000);
    }
    
    draw() {
        // 应用屏幕震动
        this.ctx.save();
        this.ctx.translate(this.screenShake.x, this.screenShake.y);
        
        // 清空画布 - 深邃的太空背景
        this.ctx.fillStyle = 'rgba(8, 8, 32, 0.15)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制银河系背景
        this.drawGalaxyBackground();
        
        if (this.state === 'playing' || this.state === 'paused' || this.state === 'bossWarning') {
            // 绘制游戏对象
            if (this.particleEffectsEnabled) {
                this.particleSystem.draw(this.ctx);
            }
            this.bulletManager.draw(this.ctx);
            this.enemyManager.draw(this.ctx);
            this.powerUpManager.draw(this.ctx);
            this.player.draw(this.ctx);
            
            // 绘制道具效果UI
            this.powerUpManager.drawActiveEffects(this.ctx);
            
            // 绘制迷你地图
            this.drawMiniMap();
            
            // 绘制调试信息
            if (window.location.hash === '#debug') {
                this.drawDebugInfo();
            }
        }
        
        this.ctx.restore();
    }
    
    drawGalaxyBackground() {
        this.ctx.save();
        
        // 绘制银河系主体
        this.drawGalaxyCore();
        
        // 绘制星云
        if (this.nebulae) {
            this.nebulae.forEach(nebula => {
                this.ctx.save();
                this.ctx.translate(nebula.x, nebula.y);
                this.ctx.rotate(nebula.rotation);
                this.ctx.globalAlpha = nebula.opacity;
                
                // 创建径向渐变
                const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, nebula.size);
                gradient.addColorStop(0, nebula.color);
                gradient.addColorStop(0.3, nebula.color + '60');
                gradient.addColorStop(0.7, nebula.color + '20');
                gradient.addColorStop(1, 'transparent');
                
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(-nebula.size, -nebula.size, nebula.size * 2, nebula.size * 2);
                this.ctx.restore();
            });
        }
        
        // 绘制星星
        this.stars.forEach(star => {
            const twinkle = Math.sin(star.twinkle) * 0.3 + 0.7;
            this.ctx.globalAlpha = star.brightness * twinkle;
            this.ctx.fillStyle = star.color;
            
            // 为大星星添加光晕效果
            if (star.type === 'large') {
                this.ctx.shadowColor = star.color;
                this.ctx.shadowBlur = star.size * 3;
            }
            
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 重置阴影
            this.ctx.shadowBlur = 0;
        });
        
        // 绘制流星
        if (this.meteors) {
            this.meteors.forEach(meteor => {
                this.ctx.globalAlpha = meteor.life;
                this.ctx.strokeStyle = meteor.color;
                this.ctx.lineWidth = meteor.size;
                this.ctx.lineCap = 'round';
                
                this.ctx.beginPath();
                this.ctx.moveTo(meteor.x, meteor.y);
                this.ctx.lineTo(meteor.x - meteor.vx * 10, meteor.y - meteor.vy * 10);
                this.ctx.stroke();
                
                // 流星头部光点
                this.ctx.fillStyle = meteor.color;
                this.ctx.beginPath();
                this.ctx.arc(meteor.x, meteor.y, meteor.size, 0, Math.PI * 2);
                this.ctx.fill();
            });
        }
        
        this.ctx.restore();
    }
    
    drawGalaxyCore() {
        // 绘制银河系核心带
        this.ctx.save();
        
        // 银河系主带 - 横跨屏幕的亮带
        const centerY = this.canvas.height * 0.3;
        const bandHeight = this.canvas.height * 0.4;
        
        // 创建银河系渐变
        const galaxyGradient = this.ctx.createLinearGradient(0, centerY - bandHeight/2, 0, centerY + bandHeight/2);
        galaxyGradient.addColorStop(0, 'rgba(25, 25, 112, 0.1)'); // 深蓝边缘
        galaxyGradient.addColorStop(0.2, 'rgba(72, 61, 139, 0.3)'); // 紫色
        galaxyGradient.addColorStop(0.4, 'rgba(123, 104, 238, 0.5)'); // 亮紫色
        galaxyGradient.addColorStop(0.5, 'rgba(173, 216, 230, 0.6)'); // 银河核心
        galaxyGradient.addColorStop(0.6, 'rgba(123, 104, 238, 0.5)'); // 亮紫色
        galaxyGradient.addColorStop(0.8, 'rgba(72, 61, 139, 0.3)'); // 紫色
        galaxyGradient.addColorStop(1, 'rgba(25, 25, 112, 0.1)'); // 深蓝边缘
        
        this.ctx.fillStyle = galaxyGradient;
        this.ctx.fillRect(0, centerY - bandHeight/2, this.canvas.width, bandHeight);
        
        // 添加银河系尘埃效果
        this.ctx.globalCompositeOperation = 'screen';
        for (let i = 0; i < 50; i++) {
            const x = random(0, this.canvas.width);
            const y = centerY + random(-bandHeight/3, bandHeight/3);
            const size = random(1, 4);
            const alpha = random(0.1, 0.4);
            
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = '#ADD8E6'; // 淡蓝色尘埃
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.restore();
    }
    
    createMeteor() {
        if (!this.meteors) return;
        
        const meteor = {
            x: random(-50, this.canvas.width + 50),
            y: -20,
            vx: random(-2, 2),
            vy: random(3, 8),
            size: random(1, 3),
            life: 1.0,
            color: ['#ffffff', '#ffff00', '#ff6b6b', '#87ceeb'][Math.floor(random(0, 4))]
        };
        
        this.meteors.push(meteor);
    }
    
    drawMiniMap() {
        if (!this.miniMapCtx) return;
        
        // 清空迷你地图
        this.miniMapCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.miniMapCtx.fillRect(0, 0, this.miniMapCanvas.width, this.miniMapCanvas.height);
        
        // 计算缩放比例
        const scaleX = this.miniMapCanvas.width / this.canvas.width;
        const scaleY = this.miniMapCanvas.height / this.canvas.height;
        
        // 绘制玩家
        this.miniMapCtx.fillStyle = '#00ff00';
        this.miniMapCtx.fillRect(
            this.player.x * scaleX - 2,
            this.player.y * scaleY - 2,
            4, 4
        );
        
        // 绘制敌机
        this.miniMapCtx.fillStyle = '#ff0000';
        this.enemyManager.enemies.forEach(enemy => {
            this.miniMapCtx.fillRect(
                enemy.x * scaleX - 1,
                enemy.y * scaleY - 1,
                2, 2
            );
        });
        
        // 绘制道具
        this.miniMapCtx.fillStyle = '#ffff00';
        this.powerUpManager.powerUps.forEach(powerUp => {
            this.miniMapCtx.fillRect(
                powerUp.x * scaleX - 1,
                powerUp.y * scaleY - 1,
                2, 2
            );
        });
    }
    
    drawDebugInfo() {
        this.ctx.save();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px monospace';
        this.ctx.fillText(`FPS: ${this.performanceMonitor.getFPS()}`, 10, this.canvas.height - 80);
        this.ctx.fillText(`Enemies: ${this.enemyManager.getEnemyCount()}`, 10, this.canvas.height - 65);
        this.ctx.fillText(`Bullets: ${this.bulletManager.bullets.length}`, 10, this.canvas.height - 50);
        this.ctx.fillText(`Particles: ${this.particleSystem.getCount()}`, 10, this.canvas.height - 35);
        this.ctx.fillText(`Combo: ${this.combo} (Max: ${this.maxCombo})`, 10, this.canvas.height - 20);
        this.ctx.fillText(`Time Scale: ${this.timeScale.toFixed(2)}`, 10, this.canvas.height - 5);
        this.ctx.restore();
    }
    
    gameLoop(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // 更新游戏
        this.update();
        
        // 绘制游戏
        this.draw();
        
        // 继续循环
        requestAnimationFrame(this.gameLoop);
    }
    
    // 游戏记录相关方法
    saveGameRecord(endReason = 'unknown') {
        const gameData = {
            score: this.score,
            highScore: this.highScore,
            level: this.level,
            kills: this.kills,
            survivalTime: this.survivalTime,
            totalShots: this.totalShots,
            totalHits: this.totalHits,
            maxCombo: this.maxCombo,
            difficulty: this.difficulty,
            achievements: this.achievements,
            endReason: endReason,
            playerLives: this.player.lives
        };
        
        const record = this.gameRecordManager.addGameRecord(gameData);
        console.log('游戏记录已保存:', record);
        return record;
    }
    
    showGameRecords() {
        this.hideAllScreens();
        document.getElementById('gameRecordsScreen').classList.remove('hidden');
        this.updateGameRecordsDisplay();
    }
    
    hideGameRecords() {
        document.getElementById('gameRecordsScreen').classList.add('hidden');
        document.getElementById('startScreen').classList.remove('hidden');
    }
    
    updateGameRecordsDisplay() {
        const statistics = this.gameRecordManager.getStatistics();
        
        // 获取过滤和排序选项
        const filterValue = document.getElementById('recordsFilter').value;
        const sortValue = document.getElementById('recordsSort').value;
        
        // 应用过滤和排序
        let filteredRecords = this.gameRecordManager.getAllRecords();
        
        // 过滤
        if (filterValue !== 'all') {
            filteredRecords = filteredRecords.filter(record => record.difficulty === filterValue);
        }
        
        // 排序
        switch (sortValue) {
            case 'score':
                filteredRecords.sort((a, b) => b.score - a.score);
                break;
            case 'kills':
                filteredRecords.sort((a, b) => b.kills - a.kills);
                break;
            case 'survival':
                filteredRecords.sort((a, b) => b.survivalTime - a.survivalTime);
                break;
            default: // date
                filteredRecords.sort((a, b) => b.id - a.id);
                break;
        }
        
        // 限制显示数量
        const recentRecords = filteredRecords.slice(0, 20);
        
        // 更新统计信息
        document.getElementById('totalGamesPlayed').textContent = statistics.totalGames;
        document.getElementById('totalPlayTime').textContent = statistics.totalPlayTimeFormatted;
        document.getElementById('averageScore').textContent = statistics.averageScore;
        document.getElementById('bestScore').textContent = statistics.bestScore;
        document.getElementById('totalKillsStats').textContent = statistics.totalKills;
        document.getElementById('averageAccuracyStats').textContent = statistics.averageAccuracy + '%';
        document.getElementById('bestComboStats').textContent = statistics.bestCombo;
        document.getElementById('longestSurvivalStats').textContent = statistics.longestSurvivalFormatted;
        document.getElementById('gamesPerDay').textContent = statistics.gamesPerDay;
        document.getElementById('favoriteTime').textContent = statistics.favoriteTime;
        document.getElementById('improvementRate').textContent = statistics.improvementRate + '%';
        
        // 更新趋势显示
        const trendElement = document.getElementById('recentTrend');
        const trendText = {
            'improving': '📈 进步中',
            'declining': '📉 下降中',
            'stable': '📊 稳定'
        };
        trendElement.textContent = trendText[statistics.recentTrend] || '📊 稳定';
        trendElement.className = `trend ${statistics.recentTrend}`;
        
        // 更新难度统计
        const difficultyStatsContainer = document.getElementById('difficultyStats');
        difficultyStatsContainer.innerHTML = '';
        Object.entries(statistics.difficultyStats).forEach(([difficulty, stats]) => {
            const difficultyDiv = document.createElement('div');
            difficultyDiv.className = 'difficulty-stat';
            difficultyDiv.innerHTML = `
                <span class="difficulty-name">${this.getDifficultyDisplayName(difficulty)}</span>
                <span class="difficulty-games">${stats.games}局</span>
                <span class="difficulty-avg">${stats.averageScore}分</span>
                <span class="difficulty-best">${stats.bestScore}分</span>
            `;
            difficultyStatsContainer.appendChild(difficultyDiv);
        });
        
        // 更新最近游戏记录
        const recordsContainer = document.getElementById('recentRecordsList');
        recordsContainer.innerHTML = '';
        
        if (recentRecords.length === 0) {
            recordsContainer.innerHTML = '<div class="no-records">暂无游戏记录</div>';
        } else {
            recentRecords.forEach(record => {
                const recordDiv = document.createElement('div');
                recordDiv.className = 'game-record-item';
                recordDiv.innerHTML = `
                    <div class="record-header">
                        <span class="record-date">${record.date} ${record.time}</span>
                        <span class="record-difficulty ${record.difficulty}">${this.getDifficultyDisplayName(record.difficulty)}</span>
                    </div>
                    <div class="record-stats">
                        <div class="stat">
                            <span class="stat-label">分数</span>
                            <span class="stat-value">${record.score}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">击杀</span>
                            <span class="stat-value">${record.kills}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">存活</span>
                            <span class="stat-value">${record.survivalTimeFormatted}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">命中率</span>
                            <span class="stat-value">${record.accuracy}%</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">连击</span>
                            <span class="stat-value">${record.maxCombo}</span>
                        </div>
                    </div>
                    ${record.achievements.length > 0 ? `
                        <div class="record-achievements">
                            <span class="achievements-label">成就:</span>
                            ${record.achievements.map(achievement => {
                                const def = this.achievementDefinitions[achievement];
                                return def ? `<span class="achievement-badge">${def.icon} ${def.name}</span>` : '';
                            }).join('')}
                        </div>
                    ` : ''}
                `;
                recordsContainer.appendChild(recordDiv);
            });
        }
    }
    
    getDifficultyDisplayName(difficulty) {
        const names = {
            'easy': '简单',
            'normal': '普通',
            'hard': '困难',
            'nightmare': '噩梦'
        };
        return names[difficulty] || difficulty;
    }
    
    exportGameRecords() {
        try {
            const exportData = this.gameRecordManager.exportRecords();
            this.showNotification('游戏记录已导出到下载文件夹！');
        } catch (error) {
            console.error('导出失败:', error);
            this.showNotification('导出失败: ' + error.message);
        }
    }
    
    importGameRecords() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const result = this.gameRecordManager.importRecords(e.target.result);
                        this.showNotification(result.message);
                        if (result.success) {
                            this.updateGameRecordsDisplay();
                        }
                    } catch (error) {
                        console.error('导入失败:', error);
                        this.showNotification('导入失败: ' + error.message);
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }
    
    clearGameRecords() {
        if (confirm('确定要清空所有游戏记录吗？此操作不可撤销！')) {
            this.gameRecordManager.clearAllRecords();
            this.updateGameRecordsDisplay();
            this.showNotification('所有游戏记录已清空！');
        }
    }
}

// 游戏初始化
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    window.game = game; // 用于调试
}); 