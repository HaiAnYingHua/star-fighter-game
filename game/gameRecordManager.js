// 游戏记录管理器
class GameRecordManager {
    constructor() {
        this.records = [];
        this.maxRecords = 100; // 最多保存100条记录
        this.loadRecords();
    }
    
    // 加载存档记录
    loadRecords() {
        this.records = Storage.get('gameRecords', []);
        // 确保记录数量不超过限制
        if (this.records.length > this.maxRecords) {
            this.records = this.records.slice(-this.maxRecords);
            this.saveRecords();
        }
    }
    
    // 保存存档记录
    saveRecords() {
        Storage.set('gameRecords', this.records);
    }
    
    // 添加新的游戏记录
    addGameRecord(gameData) {
        const record = {
            id: Date.now(), // 使用时间戳作为唯一ID
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString('zh-CN'),
            time: new Date().toLocaleTimeString('zh-CN'),
            
            // 基础游戏数据
            score: gameData.score || 0,
            highScore: gameData.highScore || 0,
            level: gameData.level || 1,
            kills: gameData.kills || 0,
            survivalTime: gameData.survivalTime || 0,
            
            // 射击统计
            totalShots: gameData.totalShots || 0,
            totalHits: gameData.totalHits || 0,
            accuracy: gameData.totalShots > 0 ? Math.round((gameData.totalHits / gameData.totalShots) * 100) : 0,
            
            // 连击数据
            maxCombo: gameData.maxCombo || 0,
            
            // 游戏设置
            difficulty: gameData.difficulty || 'normal',
            
            // 成就数据
            achievements: Array.from(gameData.achievements || []),
            achievementCount: (gameData.achievements || []).length,
            
            // 游戏结束信息
            endReason: gameData.endReason || 'unknown', // 'death', 'quit', 'complete'
            playerLives: gameData.playerLives || 0,
            
            // 计算的统计数据
            survivalTimeFormatted: this.formatTime(gameData.survivalTime || 0),
            killsPerMinute: this.calculateKillsPerMinute(gameData.kills || 0, gameData.survivalTime || 0),
            scorePerMinute: this.calculateScorePerMinute(gameData.score || 0, gameData.survivalTime || 0),
            
            // 游戏版本信息（用于未来兼容性）
            gameVersion: '1.0.0'
        };
        
        this.records.push(record);
        
        // 保持记录数量在限制内
        if (this.records.length > this.maxRecords) {
            this.records.shift(); // 删除最旧的记录
        }
        
        this.saveRecords();
        return record;
    }
    
    // 获取所有记录
    getAllRecords() {
        return [...this.records].reverse(); // 返回副本，最新的在前
    }
    
    // 获取最近N条记录
    getRecentRecords(count = 10) {
        return this.records.slice(-count).reverse();
    }
    
    // 根据ID获取记录
    getRecordById(id) {
        return this.records.find(record => record.id === id);
    }
    
    // 删除记录
    deleteRecord(id) {
        const index = this.records.findIndex(record => record.id === id);
        if (index !== -1) {
            this.records.splice(index, 1);
            this.saveRecords();
            return true;
        }
        return false;
    }
    
    // 清空所有记录
    clearAllRecords() {
        this.records = [];
        this.saveRecords();
    }
    
    // 获取统计数据
    getStatistics() {
        if (this.records.length === 0) {
            return {
                totalGames: 0,
                totalPlayTime: 0,
                totalScore: 0,
                totalKills: 0,
                averageScore: 0,
                averageKills: 0,
                averageSurvivalTime: 0,
                bestScore: 0,
                bestKills: 0,
                longestSurvival: 0,
                averageAccuracy: 0,
                bestCombo: 0,
                totalAchievements: 0,
                difficultyStats: {},
                recentTrend: 'stable'
            };
        }
        
        const totalGames = this.records.length;
        const totalPlayTime = this.records.reduce((sum, record) => sum + record.survivalTime, 0);
        const totalScore = this.records.reduce((sum, record) => sum + record.score, 0);
        const totalKills = this.records.reduce((sum, record) => sum + record.kills, 0);
        const totalShots = this.records.reduce((sum, record) => sum + record.totalShots, 0);
        const totalHits = this.records.reduce((sum, record) => sum + record.totalHits, 0);
        
        const bestScore = Math.max(...this.records.map(r => r.score));
        const bestKills = Math.max(...this.records.map(r => r.kills));
        const longestSurvival = Math.max(...this.records.map(r => r.survivalTime));
        const bestCombo = Math.max(...this.records.map(r => r.maxCombo));
        
        // 难度统计
        const difficultyStats = {};
        this.records.forEach(record => {
            if (!difficultyStats[record.difficulty]) {
                difficultyStats[record.difficulty] = {
                    games: 0,
                    totalScore: 0,
                    averageScore: 0,
                    bestScore: 0
                };
            }
            const stats = difficultyStats[record.difficulty];
            stats.games++;
            stats.totalScore += record.score;
            stats.averageScore = Math.round(stats.totalScore / stats.games);
            stats.bestScore = Math.max(stats.bestScore, record.score);
        });
        
        // 计算趋势（最近5局 vs 之前5局的平均分数）
        let recentTrend = 'stable';
        if (this.records.length >= 10) {
            const recent5 = this.records.slice(-5);
            const previous5 = this.records.slice(-10, -5);
            const recentAvg = recent5.reduce((sum, r) => sum + r.score, 0) / 5;
            const previousAvg = previous5.reduce((sum, r) => sum + r.score, 0) / 5;
            
            if (recentAvg > previousAvg * 1.1) {
                recentTrend = 'improving';
            } else if (recentAvg < previousAvg * 0.9) {
                recentTrend = 'declining';
            }
        }
        
        // 统计所有获得的成就
        const allAchievements = new Set();
        this.records.forEach(record => {
            record.achievements.forEach(achievement => allAchievements.add(achievement));
        });
        
        return {
            totalGames,
            totalPlayTime,
            totalPlayTimeFormatted: this.formatTime(totalPlayTime),
            totalScore,
            totalKills,
            averageScore: Math.round(totalScore / totalGames),
            averageKills: Math.round(totalKills / totalGames),
            averageSurvivalTime: Math.round(totalPlayTime / totalGames),
            averageSurvivalTimeFormatted: this.formatTime(Math.round(totalPlayTime / totalGames)),
            bestScore,
            bestKills,
            longestSurvival,
            longestSurvivalFormatted: this.formatTime(longestSurvival),
            averageAccuracy: totalShots > 0 ? Math.round((totalHits / totalShots) * 100) : 0,
            bestCombo,
            totalAchievements: allAchievements.size,
            difficultyStats,
            recentTrend,
            
            // 额外的有趣统计
            gamesPerDay: this.calculateGamesPerDay(),
            favoriteTime: this.getFavoritePlayTime(),
            improvementRate: this.calculateImprovementRate()
        };
    }
    
    // 导出存档数据
    exportRecords() {
        const exportData = {
            version: '1.0.0',
            exportDate: new Date().toISOString(),
            recordCount: this.records.length,
            records: this.records,
            statistics: this.getStatistics()
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `星际战机存档_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.json`;
        link.click();
        
        return exportData;
    }
    
    // 导入存档数据
    importRecords(jsonData) {
        try {
            const importData = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            
            if (!importData.records || !Array.isArray(importData.records)) {
                throw new Error('无效的存档格式');
            }
            
            // 验证数据格式
            const validRecords = importData.records.filter(record => 
                record.id && record.timestamp && typeof record.score === 'number'
            );
            
            if (validRecords.length === 0) {
                throw new Error('没有找到有效的游戏记录');
            }
            
            // 合并记录，避免重复
            const existingIds = new Set(this.records.map(r => r.id));
            const newRecords = validRecords.filter(record => !existingIds.has(record.id));
            
            this.records.push(...newRecords);
            
            // 按时间戳排序
            this.records.sort((a, b) => a.id - b.id);
            
            // 保持记录数量限制
            if (this.records.length > this.maxRecords) {
                this.records = this.records.slice(-this.maxRecords);
            }
            
            this.saveRecords();
            
            return {
                success: true,
                imported: newRecords.length,
                total: this.records.length,
                message: `成功导入 ${newRecords.length} 条新记录`
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: `导入失败: ${error.message}`
            };
        }
    }
    
    // 工具方法：格式化时间
    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
        } else {
            return `${minutes.toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
        }
    }
    
    // 计算每分钟击杀数
    calculateKillsPerMinute(kills, survivalTime) {
        if (survivalTime <= 0) return 0;
        const minutes = survivalTime / 60000;
        return Math.round((kills / minutes) * 10) / 10; // 保留一位小数
    }
    
    // 计算每分钟得分
    calculateScorePerMinute(score, survivalTime) {
        if (survivalTime <= 0) return 0;
        const minutes = survivalTime / 60000;
        return Math.round(score / minutes);
    }
    
    // 计算每天游戏次数
    calculateGamesPerDay() {
        if (this.records.length === 0) return 0;
        
        const dates = new Set(this.records.map(record => record.date));
        return Math.round((this.records.length / dates.size) * 10) / 10;
    }
    
    // 获取最喜欢的游戏时间段
    getFavoritePlayTime() {
        if (this.records.length === 0) return '未知';
        
        const timeSlots = {
            '早晨 (6-12)': 0,
            '下午 (12-18)': 0,
            '晚上 (18-24)': 0,
            '深夜 (0-6)': 0
        };
        
        this.records.forEach(record => {
            const hour = new Date(record.timestamp).getHours();
            if (hour >= 6 && hour < 12) timeSlots['早晨 (6-12)']++;
            else if (hour >= 12 && hour < 18) timeSlots['下午 (12-18)']++;
            else if (hour >= 18 && hour < 24) timeSlots['晚上 (18-24)']++;
            else timeSlots['深夜 (0-6)']++;
        });
        
        return Object.keys(timeSlots).reduce((a, b) => timeSlots[a] > timeSlots[b] ? a : b);
    }
    
    // 计算进步率
    calculateImprovementRate() {
        if (this.records.length < 5) return 0;
        
        const firstFive = this.records.slice(0, 5);
        const lastFive = this.records.slice(-5);
        
        const firstAvg = firstFive.reduce((sum, r) => sum + r.score, 0) / 5;
        const lastAvg = lastFive.reduce((sum, r) => sum + r.score, 0) / 5;
        
        if (firstAvg === 0) return 0;
        return Math.round(((lastAvg - firstAvg) / firstAvg) * 100);
    }
    
    // 获取记录的搜索和过滤功能
    searchRecords(filters = {}) {
        let filteredRecords = [...this.records];
        
        // 按日期范围过滤
        if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            filteredRecords = filteredRecords.filter(record => 
                new Date(record.timestamp) >= startDate
            );
        }
        
        if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999); // 包含整天
            filteredRecords = filteredRecords.filter(record => 
                new Date(record.timestamp) <= endDate
            );
        }
        
        // 按难度过滤
        if (filters.difficulty) {
            filteredRecords = filteredRecords.filter(record => 
                record.difficulty === filters.difficulty
            );
        }
        
        // 按分数范围过滤
        if (filters.minScore !== undefined) {
            filteredRecords = filteredRecords.filter(record => 
                record.score >= filters.minScore
            );
        }
        
        if (filters.maxScore !== undefined) {
            filteredRecords = filteredRecords.filter(record => 
                record.score <= filters.maxScore
            );
        }
        
        // 按成就过滤
        if (filters.hasAchievement) {
            filteredRecords = filteredRecords.filter(record => 
                record.achievements.includes(filters.hasAchievement)
            );
        }
        
        // 排序
        if (filters.sortBy) {
            const sortField = filters.sortBy;
            const sortOrder = filters.sortOrder === 'desc' ? -1 : 1;
            
            filteredRecords.sort((a, b) => {
                if (a[sortField] < b[sortField]) return -1 * sortOrder;
                if (a[sortField] > b[sortField]) return 1 * sortOrder;
                return 0;
            });
        }
        
        return filteredRecords.reverse(); // 默认最新的在前
    }
} 