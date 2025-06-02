// ==UserScript==
// @name         LeetCode题单助手
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  LeetCode中英文站点增强工具，智能转换链接并显示做题状态
// @author       You
// @match        https://leetcode.cn/*
// @match        https://leetcode.com/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// @connect      leetcode.com
// @connect      leetcode.cn
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';
    
    const CONFIG = {
        STORAGE_KEY: 'leetcode_progress_data',
        LAST_SYNC_KEY: 'leetcode_last_sync',
        SETTINGS_KEY: 'leetcode_settings',
        CACHE_DURATION: 2 * 60 * 60 * 1000,
        VERSION: '3.0'
    };
    
    const DEFAULT_SETTINGS = {
        autoSync: true,
        showDifficulty: true,
        showProgress: true,
        compactMode: false,
        hideCompleted: false,
        customCSS: ''
    };
    
    const DIFFICULTY_MAP = {
        1: { text: 'Easy', color: '#00b8a3' },
        2: { text: 'Med.', color: '#ffc01e' },
        3: { text: 'Hard', color: '#ff375f' }
    };
    
    const STATUS_MAP = {
        'ac': { emoji: '✅', text: 'Solved', color: '#52c41a', bgColor: '#f6ffed' },
        'notac': { emoji: '❌', text: 'Attempted', color: '#ff4d4f', bgColor: '#fff2f0' },
        null: { emoji: '⭕', text: 'Not Attempted', color: '#8c8c8c', bgColor: '#fafafa' }
    };
    
    console.log('🚀 LeetCode题单助手启动，版本:', CONFIG.VERSION);
    
    GM_addStyle(`
        .lc-converted {
            padding-left: 8px !important;
            transition: all 0.3s ease;
        }
        
        .lc-converted:hover {
            background-color: #f0f8ff !important;
            transform: translateX(2px);
        }
        
        .lc-status-container {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            margin-right: 8px;
        }
        
        .lc-status-badge {
            display: inline-flex;
            align-items: center;
            padding: 2px 6px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 500;
            border: 1px solid #d9d9d9;
            transition: transform 0.2s ease;
        }
        
        .lc-status-badge:hover {
            transform: scale(1.1);
        }
        
        .lc-difficulty-badge {
            display: inline-flex;
            align-items: center;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            color: white;
            min-width: 32px;
            justify-content: center;
        }
        
        .lc-control-panel {
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 9999;
            background: #ffffff;
            color: #333333;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            overflow: hidden;
            min-width: 200px;
            transition: all 0.3s ease;
        }
        
        [data-theme="dark"] .lc-control-panel,
        .dark .lc-control-panel,
        body[class*="dark"] .lc-control-panel {
            background: #1f1f1f !important;
            color: #ffffff !important;
            border: 1px solid #333;
        }
        
        .lc-panel-header {
            background: linear-gradient(135deg, #1890ff, #40a9ff);
            color: white;
            padding: 12px 16px;
            font-weight: bold;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            cursor: pointer;
            user-select: none;
        }
        
        .lc-panel-toggle {
            font-size: 12px;
            opacity: 0.8;
            transition: transform 0.3s ease;
        }
        
        .lc-panel-toggle.collapsed {
            transform: rotate(180deg);
        }
        
        .lc-panel-content {
            padding: 12px;
            transition: all 0.3s ease;
            overflow: hidden;
        }
        
        .lc-control-panel.collapsed .lc-panel-content {
            max-height: 0;
            padding: 0 12px;
            opacity: 0;
        }
        
        .lc-control-panel:not(.collapsed) .lc-panel-content {
            max-height: 500px;
            opacity: 1;
        }
        
        .lc-button {
            width: 100%;
            padding: 8px 12px;
            margin-bottom: 8px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .lc-button-primary {
            background: #1890ff;
            color: white;
        }
        
        .lc-button-primary:hover {
            background: #40a9ff;
        }
        
        .lc-button-secondary {
            background: #f0f0f0;
            color: #333;
        }
        
        .lc-button-secondary:hover {
            background: #e0e0e0;
        }
        
        [data-theme="dark"] .lc-button-secondary,
        .dark .lc-button-secondary,
        body[class*="dark"] .lc-button-secondary {
            background: #333 !important;
            color: #fff !important;
        }
        
        [data-theme="dark"] .lc-button-secondary:hover,
        .dark .lc-button-secondary:hover,
        body[class*="dark"] .lc-button-secondary:hover {
            background: #444 !important;
        }
        
        .lc-stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
            margin: 8px 0;
            font-size: 10px;
        }
        
        .lc-stat-item {
            text-align: center;
            padding: 4px;
            border-radius: 4px;
            background: #f9f9f9;
            color: #333;
        }
        
        [data-theme="dark"] .lc-stat-item,
        .dark .lc-stat-item,
        body[class*="dark"] .lc-stat-item {
            background: #333 !important;
            color: #fff !important;
        }
        
        .lc-progress-bar {
            width: 100%;
            height: 6px;
            background: #f0f0f0;
            border-radius: 3px;
            overflow: hidden;
            margin: 8px 0;
        }
        
        .lc-progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #52c41a, #73d13d);
            transition: width 0.3s ease;
        }
        
        .lc-settings {
            border-top: 1px solid #f0f0f0;
            margin-top: 8px;
            padding-top: 8px;
        }
        
        [data-theme="dark"] .lc-settings,
        .dark .lc-settings,
        body[class*="dark"] .lc-settings {
            border-top-color: #444 !important;
        }
        
        .lc-setting-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 6px;
            font-size: 11px;
            color: inherit;
        }
        
        .lc-switch {
            position: relative;
            width: 32px;
            height: 18px;
            background: #ccc;
            border-radius: 9px;
            cursor: pointer;
            transition: background 0.2s;
        }
        
        .lc-switch.active {
            background: #1890ff;
        }
        
        .lc-switch::after {
            content: '';
            position: absolute;
            top: 2px;
            left: 2px;
            width: 14px;
            height: 14px;
            background: white;
            border-radius: 50%;
            transition: transform 0.2s;
        }
        
        .lc-switch.active::after {
            transform: translateX(14px);
        }
        
        .lc-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            background: white;
            border-left: 4px solid #52c41a;
            padding: 16px 20px;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-width: 300px;
            animation: slideIn 0.3s ease;
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        .lc-hidden {
            opacity: 0.3;
            filter: grayscale(50%);
        }
        
        .lc-jump-button {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 8px;
            margin-left: 12px;
            background: linear-gradient(135deg, #1890ff, #40a9ff);
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            text-decoration: none;
            box-shadow: 0 2px 4px rgba(24, 144, 255, 0.3);
        }
        
        .lc-jump-button:hover {
            background: linear-gradient(135deg, #40a9ff, #69c0ff);
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(24, 144, 255, 0.4);
            color: white;
            text-decoration: none;
        }
        
        .lc-jump-button:active {
            transform: translateY(0);
        }
    `);
    
    class LeetCodeUltimate {
        constructor() {
            this.settings = { ...DEFAULT_SETTINGS, ...GM_getValue(CONFIG.SETTINGS_KEY, {}) };
            this.progressData = GM_getValue(CONFIG.STORAGE_KEY, {});
            this.isInternational = window.location.hostname === 'leetcode.com';
            this.isChinese = window.location.hostname === 'leetcode.cn';
            this.stats = { total: 0, solved: 0, attempted: 0 };
            
            this.init();
        }
        
        init() {
            if (this.isInternational) {
                this.handleInternationalSite();
            } else if (this.isChinese) {
                if (this.isProblemsDetailPage()) {
                    this.addJumpButton();
                    return;
                }
                this.handleChineseSite();
            }
            
            if (this.settings.customCSS) {
                GM_addStyle(this.settings.customCSS);
            }
        }
        
        isProblemsDetailPage() {
            const path = window.location.pathname;
            return /^\/problems\/[^\/]+\/(description|solutions|discuss|submissions|editorial)/.test(path) ||
                   /^\/problems\/[^\/]+\/$/.test(path);
        }
        
        addJumpButton() {
            setTimeout(() => {
                this.insertJumpButton();
            }, 1500);
            
            const observer = new MutationObserver(() => {
                if (!document.querySelector('.lc-jump-button')) {
                    setTimeout(() => this.insertJumpButton(), 500);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
        
        insertJumpButton() {
            if (document.querySelector('.lc-jump-button')) {
                return;
            }
            
            const titleSelectors = [
                'h1[data-cy="question-title"]',
                '.question-title h1',
                '.question-content h1',
                '.css-v3d350',
                '[class*="title"]'
            ];
            
            let titleElement = null;
            for (const selector of titleSelectors) {
                try {
                    titleElement = document.querySelector(selector);
                    if (titleElement) break;
                } catch (e) {
                    continue;
                }
            }
            
            if (!titleElement) {
                const h1Elements = document.querySelectorAll('h1');
                for (const h1 of h1Elements) {
                    const text = h1.textContent.trim();
                    if (/^\d+\./.test(text) && text.length > 5) {
                        titleElement = h1;
                        break;
                    }
                }
            }
            
            if (!titleElement) {
                return;
            }
            
            const currentUrl = window.location.href;
            const targetUrl = this.getTargetUrl(currentUrl);
            
            if (!targetUrl) {
                return;
            }
            
            const jumpButton = document.createElement('a');
            jumpButton.className = 'lc-jump-button';
            jumpButton.href = targetUrl;
            jumpButton.target = '_blank';
            jumpButton.rel = 'noopener noreferrer';
            
            if (this.isChinese) {
                jumpButton.innerHTML = `
                    <span>🌍</span>
                    <span>English</span>
                `;
                jumpButton.title = '在LeetCode国际站打开 / Open on LeetCode.com';
            } else {
                jumpButton.innerHTML = `
                    <span>🇨🇳</span>
                    <span>中文</span>
                `;
                jumpButton.title = '在LeetCode中文站打开 / Open on LeetCode.cn';
            }
            
            titleElement.appendChild(jumpButton);
        }
        
        getTargetUrl(currentUrl) {
            try {
                const url = new URL(currentUrl);
                const pathname = url.pathname;
                const search = url.search;
                const hash = url.hash;
                
                if (this.isChinese) {
                    return `https://leetcode.com${pathname}${search}${hash}`;
                } else if (this.isInternational) {
                    return `https://leetcode.cn${pathname}${search}${hash}`;
                }
                
                return null;
            } catch (e) {
                return null;
            }
        }
        
        handleInternationalSite() {
            if (this.isProblemsDetailPage()) {
                this.addJumpButton();
                return;
            }
            
            setTimeout(() => {
                this.createControlPanel();
                if (this.settings.autoSync) {
                    this.checkAndAutoSync();
                }
            }, 2000);
        }
        
        createControlPanel() {
            const panel = document.createElement('div');
            panel.className = 'lc-control-panel';
            panel.innerHTML = `
                <div class="lc-panel-header">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span>📚</span>
                        <span>LeetCode Supporter / 题单助手</span>
                    </div>
                    <span class="lc-panel-toggle">▼</span>
                </div>
                <div class="lc-panel-content">
                    <button class="lc-button lc-button-primary" id="lc-sync-btn">
                        <span>📊</span>
                        <span>同步到中文站 / Sync to CN</span>
                    </button>
                    <button class="lc-button lc-button-secondary" id="lc-clear-btn">
                        <span>🗑️</span>
                        <span>清除缓存 / Clear Cache</span>
                    </button>
                    <div class="lc-stats" id="lc-stats">
                        <div class="lc-stat-item">
                            <div>📈 已同步 / Synced</div>
                            <div id="lc-sync-count">0</div>
                        </div>
                        <div class="lc-stat-item">
                            <div>⏰ 最后同步 / Last Sync</div>
                            <div id="lc-last-sync">未同步 / Not Synced</div>
                        </div>
                    </div>
                    <div class="lc-settings">
                        <div class="lc-setting-item">
                            <span>自动同步 / Auto Sync</span>
                            <div class="lc-switch ${this.settings.autoSync ? 'active' : ''}" data-setting="autoSync"></div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(panel);
            this.bindInternationalEvents(panel);
            this.updateSyncStats();
            
            this.addPanelToggle(panel);
        }
        
        bindInternationalEvents(panel) {
            panel.querySelector('#lc-sync-btn').onclick = () => this.syncProgress();
            panel.querySelector('#lc-clear-btn').onclick = () => this.clearCache();
            
            panel.querySelectorAll('.lc-switch').forEach(sw => {
                sw.onclick = () => this.toggleSetting(sw.dataset.setting, sw);
            });
        }
        
        async checkAndAutoSync() {
            const lastSync = GM_getValue(CONFIG.LAST_SYNC_KEY, 0);
            if (Date.now() - lastSync > CONFIG.CACHE_DURATION) {
                setTimeout(() => this.syncProgress(), 3000);
            }
        }
        
        async syncProgress() {
            const button = document.querySelector('#lc-sync-btn');
            const originalHTML = button.innerHTML;
            button.innerHTML = '<span>⏳</span><span>同步中...</span>';
            button.disabled = true;
            
            try {
                let data = await this.fetchFromAPI();
                if (!data) {
                    data = await this.parseFromPage();
                }
                if (!data) {
                    data = await this.extractFromLocalStorage();
                }
                
                if (data && Object.keys(data).length > 0) {
                    this.saveProgressData(data);
                    button.innerHTML = '<span>✅</span><span>同步成功</span>';
                    this.showNotification('同步成功！ / Sync Success!', `已同步 ${Object.keys(data).length} 个题目的状态 / Synced ${Object.keys(data).length} problems`, 'success');
                } else {
                    throw new Error('无法获取有效数据 / Cannot get valid data');
                }
                
            } catch (error) {
                console.error('❌ 同步失败:', error);
                button.innerHTML = '<span>❌</span><span>同步失败</span>';
                this.showNotification('同步失败 / Sync Failed', error.message || '同步过程中出现错误 / Error during sync', 'error');
            }
            
            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.disabled = false;
                this.updateSyncStats();
            }, 2000);
        }
        
        async fetchFromAPI() {
            return new Promise((resolve) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: 'https://leetcode.com/api/problems/all/',
                    headers: {
                        'User-Agent': navigator.userAgent,
                        'Referer': 'https://leetcode.com/problemset/all/'
                    },
                    timeout: 10000,
                    onload: (response) => {
                        try {
                            if (response.status === 200) {
                                const apiData = JSON.parse(response.responseText);
                                if (apiData.stat_status_pairs) {
                                    const data = {};
                                    apiData.stat_status_pairs.forEach(item => {
                                        const slug = item.stat.question__title_slug;
                                        data[slug] = {
                                            titleSlug: slug,
                                            status: item.status,
                                            frontendId: item.stat.frontend_question_id,
                                            difficulty: item.difficulty?.level || null,
                                            title: item.stat.question__title,
                                            _raw_difficulty: item.difficulty
                                        };
                                    });
                                    
                                    resolve(data);
                                    return;
                                }
                            }
                            resolve(null);
                        } catch (e) {
                            resolve(null);
                        }
                    },
                    onerror: () => {
                        resolve(null);
                    }
                });
            });
        }
        
        async parseFromPage() {
            const data = {};
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const selectors = [
                'div[role="row"]',
                'tr[data-cy="question-row"]',
                '.question-list-table tbody tr'
            ];
            
            for (const selector of selectors) {
                const rows = document.querySelectorAll(selector);
                if (rows.length > 0) {
                    rows.forEach((row) => {
                        try {
                            const link = row.querySelector('a[href*="/problems/"]');
                            if (!link) return;
                            
                            const slug = link.href.match(/\/problems\/([^\/\?]+)/)?.[1];
                            if (!slug) return;
                            
                            let status = null;
                            const statusElements = row.querySelectorAll('[data-cy="status"], .text-green-s, .text-yellow, .status, svg');
                            statusElements.forEach(el => {
                                const text = el.textContent?.toLowerCase() || '';
                                const classList = el.classList?.toString() || '';
                                
                                if (text.includes('✓') || classList.includes('text-green') || classList.includes('solved')) {
                                    status = 'ac';
                                } else if (text.includes('?') || classList.includes('text-yellow') || classList.includes('attempted')) {
                                    status = 'notac';
                                }
                            });
                            
                            let difficulty = null;
                            const difficultySelectors = [
                                '[data-cy="difficulty"]',
                                '.difficulty',
                                '[class*="difficulty"]',
                                'span[class*="text-"]',
                                '.text-green-s', '.text-yellow', '.text-red'
                            ];
                            
                            difficultySelectors.forEach(selector => {
                                const diffEl = row.querySelector(selector);
                                if (diffEl && !difficulty) {
                                    const diffText = diffEl.textContent?.toLowerCase() || '';
                                    const classList = diffEl.classList?.toString().toLowerCase() || '';
                                    
                                    if (diffText.includes('easy') || classList.includes('green')) {
                                        difficulty = 1;
                                    } else if (diffText.includes('medium') || classList.includes('yellow')) {
                                        difficulty = 2;
                                    } else if (diffText.includes('hard') || classList.includes('red')) {
                                        difficulty = 3;
                                    }
                                }
                            });
                            
                            data[slug] = {
                                titleSlug: slug,
                                status: status,
                                difficulty: difficulty,
                                title: link.textContent.trim(),
                                _source: 'page_parse'
                            };
                            
                        } catch (e) {
                        }
                    });
                    
                    if (Object.keys(data).length > 0) {
                        return data;
                    }
                }
            }
            
            return null;
        }
        
        async extractFromLocalStorage() {
            try {
                const keys = Object.keys(localStorage);
                for (const key of keys) {
                    if (key.includes('leetcode') || key.includes('question')) {
                        try {
                            const value = JSON.parse(localStorage.getItem(key));
                            if (value && typeof value === 'object') {
                                if (value.questionData || value.questions || value.stat_status_pairs) {
                                }
                            }
                        } catch (e) {
                        }
                    }
                }
            } catch (e) {
            }
            return null;
        }
        
        saveProgressData(data) {
            GM_setValue(CONFIG.STORAGE_KEY, data);
            GM_setValue(CONFIG.LAST_SYNC_KEY, Date.now());
            console.log(`💾 保存了 ${Object.keys(data).length} 个题目的数据`);
        }
        
        clearCache() {
            GM_setValue(CONFIG.STORAGE_KEY, {});
            GM_setValue(CONFIG.LAST_SYNC_KEY, 0);
            this.updateSyncStats();
            this.showNotification('缓存已清除 / Cache Cleared', '所有同步数据已删除 / All sync data deleted', 'info');
        }
        
        updateSyncStats() {
            const data = GM_getValue(CONFIG.STORAGE_KEY, {});
            const lastSync = GM_getValue(CONFIG.LAST_SYNC_KEY, 0);
            
            const countEl = document.querySelector('#lc-sync-count');
            const timeEl = document.querySelector('#lc-last-sync');
            
            if (countEl) countEl.textContent = Object.keys(data).length;
            if (timeEl) {
                timeEl.textContent = lastSync ? 
                    new Date(lastSync).toLocaleTimeString() : '未同步 / Not Synced';
            }
        }
        
        handleChineseSite() {
            setTimeout(() => {
                this.createChinesePanel();
                this.processPage();
                this.observeChanges();
            }, 1500);
        }
        
        createChinesePanel() {
            const data = GM_getValue(CONFIG.STORAGE_KEY, {});
            const panel = document.createElement('div');
            panel.className = 'lc-control-panel';
            panel.innerHTML = `
                <div class="lc-panel-header">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span>📚</span>
                        <span>LeetCode Supporter / 题单助手</span>
                    </div>
                    <span class="lc-panel-toggle">▼</span>
                </div>
                <div class="lc-panel-content">
                    <div class="lc-stats">
                        <div class="lc-stat-item">
                            <div>✅ 已解决 / Solved</div>
                            <div id="lc-solved">0</div>
                        </div>
                        <div class="lc-stat-item">
                            <div>❌ 尝试中 / Attempted</div>
                            <div id="lc-attempted">0</div>
                        </div>
                        <div class="lc-stat-item">
                            <div>⭕ 未尝试 / Not Attempted</div>
                            <div id="lc-not-attempted">0</div>
                        </div>
                        <div class="lc-stat-item">
                            <div>📊 总题数 / Total</div>
                            <div id="lc-total">0</div>
                        </div>
                    </div>
                    <div class="lc-progress-bar">
                        <div class="lc-progress-fill" id="lc-progress"></div>
                    </div>
                    <button class="lc-button lc-button-secondary" id="lc-refresh-btn">
                        <span>🔄</span>
                        <span>刷新状态 / Refresh</span>
                    </button>
                    <div class="lc-settings">
                        <div class="lc-setting-item">
                            <span>显示难度 / Show Difficulty</span>
                            <div class="lc-switch ${this.settings.showDifficulty ? 'active' : ''}" data-setting="showDifficulty"></div>
                        </div>
                        <div class="lc-setting-item">
                            <span>隐藏已完成 / Hide Solved</span>
                            <div class="lc-switch ${this.settings.hideCompleted ? 'active' : ''}" data-setting="hideCompleted"></div>
                        </div>
                    </div>
                    ${Object.keys(data).length === 0 ? `
                        <div style="text-align: center; margin: 12px 0; font-size: 11px; color: #999;">
                            <div>⚠️ 未找到同步数据 / No sync data found</div>
                            <a href="https://leetcode.com/problemset/all/" target="_blank" style="color: #1890ff;">
                                前往国际站同步 / Go to LeetCode.com to sync
                            </a>
                        </div>
                    ` : ''}
                </div>
            `;
            
            document.body.appendChild(panel);
            this.bindChineseEvents(panel);
            
            this.addPanelToggle(panel);
        }
        
        bindChineseEvents(panel) {
            panel.querySelector('#lc-refresh-btn')?.addEventListener('click', () => {
                this.processPage();
                this.showNotification('已刷新 / Refreshed', '状态显示已更新 / Status display updated', 'info');
            });
            
            panel.querySelectorAll('.lc-switch').forEach(sw => {
                sw.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleSetting(sw.dataset.setting, sw);
                });
            });
        }
        
        processPage() {
            const data = GM_getValue(CONFIG.STORAGE_KEY, {});
            
            if (Object.keys(data).length === 0) {
                return;
            }
            
            document.querySelectorAll('.lc-status-container').forEach(el => el.remove());
            
            document.querySelectorAll('.lc-hidden').forEach(el => {
                el.classList.remove('lc-hidden');
            });
            
            this.processLinks(data);
            this.updateStats();
        }
        
        processLinks(data) {
            const links = Array.from(document.querySelectorAll('a[href*="/problems/"]'));
            
            if (links.length === 0) {
                return;
            }
            
            let processed = 0;
            
            links.forEach(link => {
                if (this.processLink(link, data)) {
                    processed++;
                }
            });
            
            if (processed > 0) {
                this.updateStats();
            }
        }
        
        processLink(linkElement, data) {
            const originalHref = linkElement.href;
            
            if (!originalHref.includes('/problems/')) {
                return false;
            }
            
            const slug = this.extractProblemSlug(originalHref);
            if (!slug) return false;
            
            if (originalHref.includes('leetcode.cn')) {
                linkElement.href = originalHref.replace('leetcode.cn', 'leetcode.com');
                linkElement.target = '_blank';
            }
            linkElement.classList.add('lc-converted');
            
            const problemData = data[slug];
            const status = problemData?.status;
            
            this.addEnhancedBadges(linkElement, problemData);
            
            if (this.settings.hideCompleted && status === 'ac') {
                const parentElement = linkElement.closest('tr, div[role="row"], li, .question-item, .problem-item');
                if (parentElement) {
                    parentElement.classList.add('lc-hidden');
                }
            }
            
            return true;
        }
        
        addEnhancedBadges(linkElement, problemData) {
            const existingContainer = linkElement.parentNode.querySelector('.lc-status-container');
            if (existingContainer) {
                existingContainer.remove();
            }
            
            const container = document.createElement('div');
            container.className = 'lc-status-container';
            
            if (this.settings.showDifficulty) {
                const difficulty = problemData?.difficulty;
                
                if (difficulty && DIFFICULTY_MAP[difficulty]) {
                    const diffInfo = DIFFICULTY_MAP[difficulty];
                    const diffBadge = document.createElement('span');
                    diffBadge.className = 'lc-difficulty-badge';
                    diffBadge.textContent = diffInfo.text;
                    diffBadge.title = `难度: ${diffInfo.text}`;
                    diffBadge.style.backgroundColor = diffInfo.color;
                    diffBadge.style.color = 'white';
                    
                    container.appendChild(diffBadge);
                }
            }
            
            const status = problemData?.status;
            const statusInfo = STATUS_MAP[status] || STATUS_MAP[null];
            
            const statusBadge = document.createElement('span');
            statusBadge.className = 'lc-status-badge';
            statusBadge.textContent = statusInfo.text;
            statusBadge.title = `状态: ${statusInfo.text} - ${problemData?.titleSlug || 'unknown'}`;
            statusBadge.style.backgroundColor = statusInfo.bgColor;
            statusBadge.style.color = statusInfo.color;
            statusBadge.style.borderColor = statusInfo.color;
            
            container.appendChild(statusBadge);
            
            linkElement.parentNode.insertBefore(container, linkElement);
        }
        
        updateStats() {
            const data = GM_getValue(CONFIG.STORAGE_KEY, {});
            const links = document.querySelectorAll('.lc-converted');
            
            this.stats = { total: 0, solved: 0, attempted: 0, notAttempted: 0 };
            
            links.forEach(link => {
                const slug = this.extractProblemSlug(link.href);
                const problemData = data[slug];
                if (problemData) {
                    this.stats.total++;
                    if (problemData.status === 'ac') {
                        this.stats.solved++;
                    } else if (problemData.status === 'notac') {
                        this.stats.attempted++;
                    } else {
                        this.stats.notAttempted++;
                    }
                }
            });
            
            const solvedEl = document.querySelector('#lc-solved');
            const attemptedEl = document.querySelector('#lc-attempted');
            const notAttemptedEl = document.querySelector('#lc-not-attempted');
            const totalEl = document.querySelector('#lc-total');
            const progressEl = document.querySelector('#lc-progress');
            
            if (solvedEl) solvedEl.textContent = this.stats.solved;
            if (attemptedEl) attemptedEl.textContent = this.stats.attempted;
            if (notAttemptedEl) notAttemptedEl.textContent = this.stats.notAttempted;
            if (totalEl) totalEl.textContent = this.stats.total;
            if (progressEl && this.stats.total > 0) {
                const percentage = (this.stats.solved / this.stats.total) * 100;
                progressEl.style.width = percentage + '%';
            }
        }
        
        observeChanges() {
            let isProcessing = false;
            
            const observer = new MutationObserver((mutations) => {
                if (isProcessing) return;
                
                let shouldProcess = false;
                
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) {
                            if (node.classList?.contains('lc-status-container') ||
                                node.classList?.contains('lc-control-panel') ||
                                node.classList?.contains('lc-notification') ||
                                node.closest?.('.lc-status-container, .lc-control-panel, .lc-notification')) {
                                return;
                            }
                            
                            if (node.querySelector?.('a[href*="/problems/"]:not(.lc-converted)') ||
                                (node.matches?.('a[href*="/problems/"]') && !node.classList.contains('lc-converted'))) {
                                shouldProcess = true;
                            }
                        }
                    });
                });
                
                if (shouldProcess) {
                    isProcessing = true;
                    setTimeout(() => {
                        this.processPage();
                        isProcessing = false;
                    }, 1000);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
        
        extractProblemSlug(url) {
            const match = url.match(/\/problems\/([^\/\?]+)/);
            return match ? match[1] : null;
        }
        
        toggleSetting(key, switchEl) {
            this.settings[key] = !this.settings[key];
            switchEl.classList.toggle('active', this.settings[key]);
            GM_setValue(CONFIG.SETTINGS_KEY, this.settings);
            
            if (key === 'showDifficulty' || key === 'hideCompleted') {
                this.processPage();
            }
            
            const settingMessages = {
                'showDifficulty': {
                    on: '显示难度 / Show Difficulty',
                    off: '隐藏难度 / Hide Difficulty'
                },
                'hideCompleted': {
                    on: '隐藏已完成 / Hide Solved',
                    off: '显示已完成 / Show Solved'
                },
                'autoSync': {
                    on: '自动同步 / Auto Sync',
                    off: '手动同步 / Manual Sync'
                }
            };
            
            const message = settingMessages[key];
            if (message) {
                const statusText = this.settings[key] ? message.on : message.off;
                this.showNotification('设置已更新 / Settings Updated', statusText, 'info');
            }
        }
        
        showNotification(title, message, type = 'info') {
            const colors = {
                success: '#52c41a',
                error: '#ff4d4f',
                info: '#1890ff',
                warning: '#faad14'
            };
            
            const notification = document.createElement('div');
            notification.className = 'lc-notification';
            notification.style.borderLeftColor = colors[type];
            notification.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 4px;">${title}</div>
                <div style="font-size: 12px; color: #666;">${message}</div>
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideIn 0.3s ease reverse';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
        
        addPanelToggle(panel) {
            const header = panel.querySelector('.lc-panel-header');
            const toggle = panel.querySelector('.lc-panel-toggle');
            
            const isCollapsed = GM_getValue('panel_collapsed', false);
            if (isCollapsed) {
                panel.classList.add('collapsed');
                toggle.classList.add('collapsed');
            }
            
            header.addEventListener('click', () => {
                const collapsed = panel.classList.toggle('collapsed');
                toggle.classList.toggle('collapsed', collapsed);
                
                GM_setValue('panel_collapsed', collapsed);
            });
        }
        
        initHotkeys() {
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.shiftKey && e.key === 'L') {
                    e.preventDefault();
                    if (this.isInternational) {
                        this.syncProgress();
                    } else {
                        this.processPage();
                    }
                }
                
                if (e.ctrlKey && e.shiftKey && e.key === 'H') {
                    e.preventDefault();
                    if (this.isChinese) {
                        const switchEl = document.querySelector('[data-setting="hideCompleted"]');
                        if (switchEl) {
                            this.toggleSetting('hideCompleted', switchEl);
                        }
                    }
                }
            });
        }
    }
    
    function initialize() {
        const app = new LeetCodeUltimate();
        
        app.initHotkeys();
        
        const lastVersion = GM_getValue('last_version', '');
        if (lastVersion !== CONFIG.VERSION) {
            GM_setValue('last_version', CONFIG.VERSION);
            if (lastVersion) {
                app.showNotification(
                    '更新完成！', 
                    `LeetCode题单助手已更新到 v${CONFIG.VERSION}`, 
                    'success'
                );
            }
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        setTimeout(initialize, 500);
    }
    
})();