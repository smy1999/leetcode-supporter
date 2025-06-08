# LeetCode题单助手

> 🚀 为LeetCode刷题者量身定制的浏览器脚本，实现中英文站点智能同步，让刷题更高效！

[![Version](https://img.shields.io/badge/version-1.1-blue.svg)](https://github.com/yourusername/leetcode-helper)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Greasy Fork](https://img.shields.io/badge/Greasy%20Fork-安装脚本-orange.svg)](https://greasyfork.org/zh-CN/scripts/538105-leetcode%E9%A2%98%E5%8D%95%E5%8A%A9%E6%89%8B)
[![JavaScript](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://github.com/yourusername/leetcode-helper)

## 📖 项目简介

LeetCode题单助手是一个功能强大的用户脚本，专为LeetCode刷题用户设计。它解决了在LeetCode国际站（leetcode.com）和中文站（leetcode.cn）之间切换时无法同步进度的痛点，提供智能的数据同步和可视化增强功能。

**🆕 v1.1 新增一键复制功能！**

[Greasy Fork安装地址](https://greasyfork.org/zh-CN/scripts/538105-leetcode%E9%A2%98%E5%8D%95%E5%8A%A9%E6%89%8B)

### 🎯 解决的问题

- ❌ 中英文站点进度不同步
- ❌ 无法快速了解题单完成状态  
- ❌ 中英文题目跳转不便
- ❌ 缺乏直观的进度可视化

### ✅ 提供的解决方案

- ✅ 智能同步国际站做题进度到中文站
- ✅ 可视化显示题目状态和难度
- ✅ 一键中英文站点跳转
- ✅ 实时进度统计和追踪
- ✅ **一键复制题目标题、描述、代码**
- ✅ **保持Markdown格式的题目描述复制**

## 🌟 核心功能

### 🔄 智能数据同步
- **自动同步**：从LeetCode.com获取完整的做题状态
- **多源备份**：支持API接口、页面解析、本地存储等多种数据源
- **缓存机制**：智能缓存减少重复请求，提升性能

### 🎨 可视化增强
- **状态标识**：
  - ✅ 已解决 (Solved)
  - ❌ 尝试中 (Attempted) 
  - ⭕ 未尝试 (Not Attempted)
- **难度标识**：Easy / Medium / Hard 彩色标签
- **进度统计**：实时显示解题数量和完成率
- **进度条**：直观的可视化进度展示

### 🚀 便捷操作
- **智能跳转**：题目详情页一键中英文站点切换
- **链接转换**：自动将中文站链接转为国际站，新窗口打开
- **智能隐藏**：可选隐藏已完成题目，专注未完成内容

### ⚙️ 个性化定制
- **显示选项**：自由控制状态、难度标识的显示
- **主题适配**：完美支持LeetCode的亮色/暗色主题
- **面板控制**：可折叠的控制面板，节省屏幕空间

## 🛠️ 安装使用

### 前置要求
- 现代浏览器（Chrome、Firefox、Edge等）
- 用户脚本管理器（推荐Tampermonkey）

### 安装步骤

#### 方法一：从Greasy Fork安装（推荐）
1. 安装 [Tampermonkey](https://tampermonkey.net/) 扩展
2. 访问 [Greasy Fork页面](https://greasyfork.org/zh-CN/scripts/538105-leetcode%E9%A2%98%E5%8D%95%E5%8A%A9%E6%89%8B)
3. 点击「安装此脚本」按钮
4. 确认安装即可

#### 方法二：手动安装
1. 下载本仓库的 `leetcode-helper.js` 文件
2. 打开Tampermonkey管理面板
3. 点击「新建脚本」，粘贴代码并保存

### 使用方法

#### 🔧 首次设置
1. **数据同步**：首先访问 [LeetCode.com](https://leetcode.com/problemset/all/) 
2. **同步操作**：点击右侧面板的「同步到中文站」按钮
3. **等待完成**：等待同步完成提示

#### 📈 日常使用
1. **查看进度**：在 [LeetCode.cn](https://leetcode.cn) 题单页面查看题目状态
2. **跟踪进度**：实时查看统计面板了解完成情况
3. **快速跳转**：点击题目链接自动跳转到国际站
4. **定期同步**：建议每周同步一次最新状态

## 🎯 使用场景

### 👥 适合人群
- 🌍 在LeetCode国际站刷题的用户
- 🔄 经常需要中英文对照的学习者
- 🎯 使用中文题单但想在国际站做题的用户

## 📈 版本更新

### 🆕 v1.1 更新内容
- ✨ **新增一键复制功能**
  - 📋 题目标题复制（自动移除编号）
  - 📄 题目描述复制（保持Markdown格式）  
  - 💻 代码解答复制（完整保留格式）

### v1.0 基础功能
- 🔄 中英文站点数据同步
- 🎨 题目状态可视化
- 🚀 智能链接跳转
- ⚙️ 个性化设置选项

## 🔒 隐私与安全

### 数据处理
- 📱 **本地存储**：所有数据仅存储在浏览器本地
- 🚫 **无数据收集**：不收集或上传任何个人信息
- 🔗 **官方API**：仅访问LeetCode官方公开API接口
- 📋 **剪贴板权限**：仅在用户主动点击复制按钮时访问

---

<div align="center">

**觉得有用？给个 ⭐ Star 支持一下！**

[报告问题](https://github.com/smy1999/leetcode-supporter/issues) · [功能建议](https://github.com/smy1999/leetcode-supporter/issues) · [贡献代码](https://github.com/smy1999/leetcode-supporter/pulls)

</div>