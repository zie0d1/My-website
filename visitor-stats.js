// نظام إحصائيات الزوار - visitor-stats.js
class VisitorStatsSystem {
    constructor() {
        this.storageKey = 'vet_visitor_stats';
        this.uniqueKey = 'vet_unique_visitors';
        this.todayKey = 'vet_today_' + new Date().toDateString();
        this.visitStartTime = new Date();
        this.init();
    }
    
    init() {
        this.loadData();
        this.trackVisit();
        this.updateDisplay();
        this.startVisitTimer();
        this.detectBrowserInfo();
        this.detectIPAddress();
        this.setupEventListeners();
    }
    
    loadData() {
        this.data = JSON.parse(localStorage.getItem(this.storageKey)) || {
            totalVisits: 0,
            todayVisits: 0,
            uniqueVisitors: [],
            visitHistory: [],
            lastVisit: null
        };
        
        const todayData = JSON.parse(localStorage.getItem(this.todayKey)) || {
            count: 0,
            date: new Date().toDateString()
        };
        
        if (todayData.date === new Date().toDateString()) {
            this.data.todayVisits = todayData.count;
        } else {
            this.data.todayVisits = 0;
        }
    }
    
    trackVisit() {
        this.data.totalVisits++;
        this.data.todayVisits++;
        
        localStorage.setItem(this.todayKey, JSON.stringify({
            count: this.data.todayVisits,
            date: new Date().toDateString()
        }));
        
        const visitorId = this.generateVisitorId();
        if (!this.data.uniqueVisitors.includes(visitorId)) {
            this.data.uniqueVisitors.push(visitorId);
        }
        
        const visitInfo = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            dateTime: new Date().toLocaleString('ar-EG'),
            browser: this.getBrowserName(),
            os: this.getOSName(),
            screen: `${window.screen.width}x${window.screen.height}`,
            language: navigator.language,
            userAgent: navigator.userAgent.substring(0, 100)
        };
        
        this.data.visitHistory.unshift(visitInfo);
        if (this.data.visitHistory.length > 50) {
            this.data.visitHistory = this.data.visitHistory.slice(0, 50);
        }
        
        this.data.lastVisit = {
            timestamp: new Date().toISOString(),
            formatted: new Date().toLocaleString('ar-EG')
        };
        
        this.saveData();
    }
    
    generateVisitorId() {
        const fingerprint = [
            navigator.userAgent,
            navigator.language,
            window.screen.width,
            window.screen.height,
            navigator.platform
        ].join('|');
        
        return btoa(fingerprint).substring(0, 32);
    }
    
    saveData() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        localStorage.setItem(this.uniqueKey, JSON.stringify(this.data.uniqueVisitors));
    }
    
    updateDisplay() {
        // تحديث الإحصائيات
        this.updateCounter('totalVisits', this.data.totalVisits);
        this.updateCounter('todayVisits', this.data.todayVisits);
        this.updateCounter('uniqueVisitors', this.data.uniqueVisitors.length);
        
        // تحديث تاريخ اليوم
        document.getElementById('todayDate').textContent = 
            new Date().toLocaleDateString('ar-EG', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        
        // تحديث آخر زيارة
        if (this.data.lastVisit) {
            const lastVisitDate = new Date(this.data.lastVisit.timestamp);
            document.getElementById('lastVisitTime').textContent = 
                lastVisitDate.toLocaleTimeString('ar-EG');
            document.getElementById('lastVisitDate').textContent = 
                lastVisitDate.toLocaleDateString('ar-EG');
        }
        
        // تحديث الجدول
        this.updateVisitsTable();
    }
    
    updateCounter(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            this.animateCounter(element, value);
        }
    }
    
    animateCounter(element, targetValue) {
        const current = parseInt(element.textContent.replace(/,/g, '')) || 0;
        if (current === targetValue) return;
        
        const duration = 1000;
        const startTime = Date.now();
        const difference = targetValue - current;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const currentValue = Math.floor(current + (difference * progress));
            
            element.textContent = currentValue.toLocaleString('ar-EG');
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    updateVisitsTable() {
        const tableBody = document.getElementById('visitsTableBody');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        this.data.visitHistory.forEach((visit, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${visit.dateTime}</td>
                <td>${visit.browser}</td>
                <td>${visit.os}</td>
                <td>${visit.screen}</td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    detectBrowserInfo() {
        document.getElementById('browserName').textContent = this.getBrowserName();
        document.getElementById('osName').textContent = this.getOSName();
        document.getElementById('screenRes').textContent = `${window.screen.width} × ${window.screen.height}`;
        document.getElementById('browserLang').textContent = navigator.language || 'غير معروف';
        document.getElementById('detailedBrowser').textContent = navigator.userAgent.substring(0, 50) + '...';
        document.getElementById('deviceInfo').textContent = `${navigator.platform} - ${navigator.hardwareConcurrency || '?'} نواة`;
        
        this.updateCurrentTime();
    }
    
    async detectIPAddress() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            document.getElementById('ipAddress').textContent = data.ip;
            
            // محاولة الحصول على الموقع
            this.getLocationFromIP(data.ip);
        } catch (error) {
            document.getElementById('ipAddress').textContent = 'غير متاح';
        }
    }
    
    async getLocationFromIP(ip) {
        try {
            const response = await fetch(`https://ipapi.co/${ip}/json/`);
            const data = await response.json();
            
            if (data.city && data.country_name) {
                document.getElementById('locationInfo').textContent = 
                    `${data.city}, ${data.country_name}`;
            }
        } catch (error) {
            // تجاهل الخطأ
        }
    }
    
    getBrowserName() {
        const ua = navigator.userAgent;
        if (ua.includes("Chrome") && !ua.includes("Edg")) return "Google Chrome";
        if (ua.includes("Firefox")) return "Mozilla Firefox";
        if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
        if (ua.includes("Edg")) return "Microsoft Edge";
        if (ua.includes("Opera")) return "Opera";
        return "متصفح آخر";
    }
    
    getOSName() {
        const ua = navigator.userAgent;
        if (ua.includes("Windows")) return "Windows";
        if (ua.includes("Mac")) return "macOS";
        if (ua.includes("Linux")) return "Linux";
        if (ua.includes("Android")) return "Android";
        if (ua.includes("iOS")) return "iOS";
        return "نظام غير معروف";
    }
    
    updateCurrentTime() {
        const now = new Date();
        document.getElementById('currentTime').textContent = 
            now.toLocaleTimeString('ar-EG');
        
        setTimeout(() => this.updateCurrentTime(), 1000);
    }
    
    startVisitTimer() {
        const startTime = this.visitStartTime;
        
        const updateDuration = () => {
            const now = new Date();
            const diff = Math.floor((now - startTime) / 1000);
            
            const hours = Math.floor(diff / 3600);
            const minutes = Math.floor((diff % 3600) / 60);
            const seconds = diff % 60;
            
            let duration = '';
            if (hours > 0) duration += `${hours} ساعة `;
            if (minutes > 0) duration += `${minutes} دقيقة `;
            duration += `${seconds} ثانية`;
            
            document.getElementById('visitDuration').textContent = duration;
            
            setTimeout(updateDuration, 1000);
        };
        
        updateDuration();
    }
    
    setupEventListeners() {
        // إغلاق نافذة التحليل
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAnalysisModal();
            }
        });
        
        document.getElementById('analysisModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'analysisModal') {
                this.closeAnalysisModal();
            }
        });
    }
    
    // وظائف التحكم
    exportVisitorData() {
        const exportData = {
            stats: this.data,
            exportInfo: {
                exportedAt: new Date().toISOString(),
                totalVisits: this.data.totalVisits,
                uniqueVisitors: this.data.uniqueVisitors.length,
                visitHistoryCount: this.data.visitHistory.length
            }
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `visitor_stats_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.showNotification('تم تصدير البيانات بنجاح', 'success');
    }
    
    analyzeVisitorPatterns() {
        let analysis = '<div class="analysis-grid">';
        
        // تحليل أوقات الزيارات
        const hours = this.data.visitHistory.map(v => new Date(v.timestamp).getHours());
        const hourCounts = {};
        hours.forEach(h => hourCounts[h] = (hourCounts[h] || 0) + 1);
        
        const peakHour = Object.keys(hourCounts).reduce((a, b) => hourCounts[a] > hourCounts[b] ? a : b, '0');
        
        // تحليل المتصفحات
        const browsers = this.data.visitHistory.map(v => v.browser);
        const browserCounts = {};
        browsers.forEach(b => browserCounts[b] = (browserCounts[b] || 0) + 1);
        const topBrowser = Object.keys(browserCounts).reduce((a, b) => browserCounts[a] > browserCounts[b] ? a : b, 'غير معروف');
        
        analysis += `
            <div class="analysis-card">
                <h4><i class="fas fa-clock"></i> توقيت الزيارات</h4>
                <p>أكثر الأوقات نشاطاً: <strong>الساعة ${peakHour}:00</strong></p>
                <p>إجمالي الزيارات المسجلة: <strong>${this.data.visitHistory.length}</strong></p>
            </div>
            
            <div class="analysis-card">
                <h4><i class="fas fa-globe"></i> أنماط المتصفحات</h4>
                <p>المتصفح الأكثر استخداماً: <strong>${topBrowser}</strong></p>
                <p>أنظمة تشغيل متنوعة: <strong>${new Set(this.data.visitHistory.map(v => v.os)).size}</strong></p>
            </div>
            
            <div class="analysis-card">
                <h4><i class="fas fa-chart-area"></i> إحصائيات عامة</h4>
                <p>الزيارات الكلية: <strong>${this.data.totalVisits.toLocaleString('ar-EG')}</strong></p>
                <p>الزوار الفريدون: <strong>${this.data.uniqueVisitors.length.toLocaleString('ar-EG')}</strong></p>
            </div>
        `;
        
        analysis += '</div>';
        
        document.getElementById('analysisResults').innerHTML = analysis;
        document.getElementById('analysisModal').style.display = 'block';
    }
    
    clearVisitsHistory() {
        if (confirm('هل أنت متأكد من رغبتك في مسح سجل الزيارات؟')) {
            localStorage.removeItem(this.storageKey);
            localStorage.removeItem(this.uniqueKey);
            localStorage.removeItem(this.todayKey);
            
            this.showNotification('تم مسح سجل الزيارات', 'info');
            setTimeout(() => location.reload(), 1500);
        }
    }
    
    closeAnalysisModal() {
        document.getElementById('analysisModal').style.display = 'none';
    }
    
    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#2ed573' : type === 'info' ? '#ffa502' : '#ff4757'};
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// جعل النظام متاحاً عالمياً
window.VisitorStatsSystem = VisitorStatsSystem;

// CSS إضافي للتحليل
const analysisStyles = `
.analysis-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 25px;
    margin-top: 30px;
}

.analysis-card {
    background: rgba(218, 44, 56, 0.15);
    padding: 25px;
    border-radius: 20px;
    border: 1px solid rgba(218, 44, 56, 0.3);
    transition: all 0.3s ease;
}

.analysis-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(218, 44, 56, 0.2);
}

.analysis-card h4 {
    color: #DA2C38;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 1.4rem;
}

.analysis-card p {
    margin-bottom: 12px;
    color: #e0e0e0;
    font-size: 1.1rem;
}

.analysis-card strong {
    color: #ffffff;
    font-weight: 700;
    font-family: 'IBM Plex Sans', monospace;
}

@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

@keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
}
`;

// إضافة الأنماط للتحليل
document.head.insertAdjacentHTML('beforeend', `<style>${analysisStyles}</style>`);
