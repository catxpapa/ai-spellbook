// 前端主逻辑脚本文件。
/**
 * AI魔法书前端应用
 * 实现提示词组合器的核心功能
 */
class AISpellbook {
    constructor() {
        this.currentFormula = null;
        this.selectedSnippets = new Map(); // tag_slug -> snippet
        this.allTags = [];
        this.allModels = [];
        this.currentTagSlug = null;
        
        this.init();
    }

    /**
     * 初始化应用
     */
    async init() {
        try {
            // 绑定事件
            this.bindEvents();
            
            // 加载基础数据
            await this.loadModels();
            await this.loadTags();
            await this.loadFormulas();
            
            console.log('AI魔法书初始化完成');
        } catch (error) {
            console.error('初始化失败:', error);
            this.showError('应用初始化失败，请刷新页面重试');
        }
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 移动端菜单切换
        document.getElementById('mobileToggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
        });

        // 模型筛选
        document.getElementById('modelFilter').addEventListener('change', (e) => {
            this.filterFormulas(e.target.value);
        });

        // 搜索
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchFormulas(e.target.value);
        });

        // 编辑按钮
        document.getElementById('editBtn').addEventListener('click', () => {
            this.enterEditMode();
        });

        // 复制按钮
        document.getElementById('copyBtn').addEventListener('click', () => {
            this.copyFinalPrompt();
        });

        // 编辑模式按钮
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.showSaveModal();
        });

        document.getElementById('cancelEditBtn').addEventListener('click', () => {
            this.exitEditMode();
        });

        // 添加片段按钮
        document.getElementById('addSnippetBtn').addEventListener('click', () => {
            this.showAddModal();
        });

        // 弹窗事件
        this.bindModalEvents();
    }

    /**
     * 绑定弹窗事件
     */
    bindModalEvents() {
        // 添加片段弹窗
        document.getElementById('modalClose').addEventListener('click', () => {
            this.hideAddModal();
        });

        document.getElementById('cancelSnippet').addEventListener('click', () => {
            this.hideAddModal();
        });

        document.getElementById('submitSnippet').addEventListener('click', () => {
            this.submitNewSnippet();
        });

        // 保存公式弹窗
        document.getElementById('saveModalClose').addEventListener('click', () => {
            this.hideSaveModal();
        });

        document.getElementById('cancelFormula').addEventListener('click', () => {
            this.hideSaveModal();
        });

        document.getElementById('submitFormula').addEventListener('click', () => {
            this.submitNewFormula();
        });

        // 点击弹窗外部关闭
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    /**
     * 加载模型数据
     */
    async loadModels() {
        try {
            const response = await fetch('/api/models');
            const result = await response.json();
            
            if (result.success) {
                this.allModels = result.data;
                this.renderModelFilter();
            }
        } catch (error) {
            console.error('加载模型失败:', error);
        }
    }

    /**
     * 加载标签数据
     */
    async loadTags() {
        try {
            const response = await fetch('/api/tags');
            const result = await response.json();
            
            if (result.success) {
                this.allTags = result.data;
            }
        } catch (error) {
            console.error('加载标签失败:', error);
        }
    }

    /**
     * 加载公式数据
     */
    async loadFormulas(modelId = '', keyword = '') {
        try {
            let url = '/api/formulas';
            const params = new URLSearchParams();
            
            if (modelId) params.append('model_id', modelId);
            if (keyword) params.append('keyword', keyword);
            
            if (params.toString()) {
                url += '?' + params.toString();
            }

            const response = await fetch(url);
            const result = await response.json();
            
            if (result.success) {
                this.renderFormulas(result.data);
            }
        } catch (error) {
            console.error('加载公式失败:', error);
        }
    }

    /**
     * 渲染模型筛选器
     */
    renderModelFilter() {
        const select = document.getElementById('modelFilter');
        select.innerHTML = '<option value="">所有模型</option>';
        
        this.allModels.forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = `${model.name} ${model.version}`;
            select.appendChild(option);
        });
    }

    /**
     * 渲染公式列表
     */
    renderFormulas(formulas) {
        const container = document.getElementById('formulaList');
        
        if (formulas.length === 0) {
            container.innerHTML = '<div class="loading">暂无公式</div>';
            return;
        }

        container.innerHTML = '';
        
        formulas.forEach(formula => {
            const item = document.createElement('div');
            item.className = 'formula-item';
            item.dataset.formulaId = formula.id;
            
            item.innerHTML = `
                <h4>${formula.short_name}</h4>
                <div class="models">${formula.model_names || '通用'}</div>
            `;
            
            item.addEventListener('click', () => {
                this.selectFormula(formula);
            });
            
            container.appendChild(item);
        });
    }

    /**
     * 选择公式
     */
    selectFormula(formula) {
        // 更新选中状态
        document.querySelectorAll('.formula-item').forEach(item => {
            item.classList.remove('active');
        });
        
        document.querySelector(`[data-formula-id="${formula.id}"]`).classList.add('active');
        
        // 保存当前公式
        this.currentFormula = formula;
        this.selectedSnippets.clear();
        
        // 更新界面
        document.getElementById('currentFormulaName').textContent = formula.short_name;
        document.getElementById('editBtn').disabled = false;
        document.getElementById('copyBtn').disabled = false;
        
        // 渲染公式模板
        this.renderFormulaTemplate();
        
        // 清空片段区域
        this.clearSnippetsArea();
    }

    /**
     * 渲染公式模板
     */
    renderFormulaTemplate() {
        const display = document.getElementById('formulaDisplay');
        let template = this.currentFormula.template_text;
        
        // 解析并替换标签
        const tagRegex = /#(\w+)/g;
        template = template.replace(tagRegex, (match, tagSlug) => {
            const selectedSnippet = this.selectedSnippets.get(tagSlug);
            const displayText = selectedSnippet ? selectedSnippet.short_name : tagSlug;
            const className = selectedSnippet ? 'tag-button selected' : 'tag-button';
            
            return `<button class="${className}" data-tag-slug="${tagSlug}">${displayText}</button>`;
        });
        
        display.innerHTML = template;
        
        // 绑定标签按钮事件
        display.querySelectorAll('.tag-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const tagSlug = e.target.dataset.tagSlug;
                this.selectTag(tagSlug);
            });
        });
    }

    /**
     * 选择标签
     */
    async selectTag(tagSlug) {
        this.currentTagSlug = tagSlug;
        
        // 查找标签信息
        const tag = this.allTags.find(t => t.slug === tagSlug);
        const tagName = tag ? tag.display_name : tagSlug;
        
        // 更新标题
        document.getElementById('currentTagName').textContent = `${tagName} 片段`;
        
        // 加载片段
        await this.loadSnippetsByTag(tagSlug);
    }

    /**
     * 根据标签加载片段
     */
    async loadSnippetsByTag(tagSlug) {
        try {
            const response = await fetch(`/api/snippets/by-tag/${tagSlug}`);
            const result = await response.json();
            
            if (result.success) {
                this.renderSnippets(result.data);
            }
        } catch (error) {
            console.error('加载片段失败:', error);
        }
    }

    /**
     * 渲染片段列表
     */
    renderSnippets(snippets) {
        const container = document.getElementById('snippetsContent');
        
        if (snippets.length === 0) {
            container.innerHTML = '<div class="snippets-placeholder"><p>该标签下暂无片段</p></div>';
            return;
        }

        const grid = document.createElement('div');
        grid.className = 'snippets-grid';
        
        snippets.forEach(snippet => {
            const card = document.createElement('div');
            card.className = 'snippet-card';
            card.dataset.snippetId = snippet.id;
            
            // 检查是否已选中
            const isSelected = this.selectedSnippets.get(this.currentTagSlug)?.id === snippet.id;
            if (isSelected) {
                card.classList.add('selected');
            }
            
            card.innerHTML = `
                <h4>${snippet.short_name}</h4>
                <p>${snippet.content}</p>
            `;
            
            card.addEventListener('click', () => {
                this.selectSnippet(snippet);
            });
            
            grid.appendChild(card);
        });
        
        container.innerHTML = '';
        container.appendChild(grid);
    }

    /**
     * 选择片段
     */
    selectSnippet(snippet) {
        // 保存选择
        this.selectedSnippets.set(this.currentTagSlug, snippet);
        
        // 更新片段卡片选中状态
        document.querySelectorAll('.snippet-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        document.querySelector(`[data-snippet-id="${snippet.id}"]`).classList.add('selected');
        
        // 重新渲染公式模板
        this.renderFormulaTemplate();
    }

    /**
     * 清空片段区域
     */
    clearSnippetsArea() {
        document.getElementById('currentTagName').textContent = '片段列表';
        document.getElementById('snippetsContent').innerHTML = 
            '<div class="snippets-placeholder"><p>点击上方公式中的标签按钮来查看相关片段</p></div>';
    }

    /**
     * 进入编辑模式
     */
    enterEditMode() {
        const finalPrompt = this.generateFinalPrompt();
        
        document.getElementById('formulaDisplay').style.display = 'none';
        document.getElementById('editMode').style.display = 'block';
        document.getElementById('editTextarea').value = finalPrompt;
        
        document.getElementById('editBtn').disabled = true;
        document.getElementById('copyBtn').disabled = true;
    }

    /**
     * 退出编辑模式
     */
    exitEditMode() {
        document.getElementById('formulaDisplay').style.display = 'block';
        document.getElementById('editMode').style.display = 'none';
        
        document.getElementById('editBtn').disabled = false;
        document.getElementById('copyBtn').disabled = false;
    }

    /**
     * 生成最终提示词
     */
    generateFinalPrompt() {
        if (!this.currentFormula) return '';
        
        let prompt = this.currentFormula.template_text;
        
        // 替换所有标签
        const tagRegex = /#(\w+)/g;
        prompt = prompt.replace(tagRegex, (match, tagSlug) => {
            const selectedSnippet = this.selectedSnippets.get(tagSlug);
            return selectedSnippet ? selectedSnippet.content : match;
        });
        
        return prompt;
    }

    /**
     * 复制最终提示词
     */
    async copyFinalPrompt() {
        const finalPrompt = this.generateFinalPrompt();
        
        try {
            await navigator.clipboard.writeText(finalPrompt);
            this.showSuccess('提示词已复制到剪贴板');
        } catch (error) {
            console.error('复制失败:', error);
            this.showError('复制失败，请手动复制');
        }
    }

    /**
     * 筛选公式
     */
    filterFormulas(modelId) {
        this.loadFormulas(modelId);
    }

    /**
     * 搜索公式
     */
    searchFormulas(keyword) {
        const modelId = document.getElementById('modelFilter').value;
        this.loadFormulas(modelId, keyword);
    }

    /**
     * 显示添加片段弹窗
     */
    showAddModal() {
        document.getElementById('addModal').style.display = 'block';
        
        // 如果当前有选中的标签，自动填入
        if (this.currentTagSlug) {
            const tag = this.allTags.find(t => t.slug === this.currentTagSlug);
            if (tag) {
                document.getElementById('newTags').value = tag.display_name;
            }
        }
    }

    /**
     * 隐藏添加片段弹窗
     */
    hideAddModal() {
        document.getElementById('addModal').style.display = 'none';
        this.clearAddForm();
    }

    /**
     * 清空添加表单
     */
    clearAddForm() {
        document.getElementById('newTags').value = '';
        document.getElementById('newSnippetName').value = '';
        document.getElementById('newSnippetContent').value = '';
    }

    /**
     * 提交新片段
     */
    async submitNewSnippet() {
        const tags = document.getElementById('newTags').value.trim();
        const shortName = document.getElementById('newSnippetName').value.trim();
        const content = document.getElementById('newSnippetContent').value.trim();
        
        if (!tags || !shortName || !content) {
            this.showError('请填写完整信息');
            return;
        }
        
        try {
            // 这里简化处理，实际应该先处理标签创建
            const response = await fetch('/api/snippets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    short_name: shortName,
                    content: content,
                    tag_ids: [] // 简化处理
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showSuccess('片段添加成功');
                this.hideAddModal();
                
                // 如果当前有选中标签，重新加载片段
                if (this.currentTagSlug) {
                    this.loadSnippetsByTag(this.currentTagSlug);
                }
            } else {
                this.showError(result.message || '添加失败');
            }
        } catch (error) {
            console.error('添加片段失败:', error);
            this.showError('添加失败，请重试');
        }
    }

    /**
     * 显示保存公式弹窗
     */
    showSaveModal() {
        document.getElementById('saveModal').style.display = 'block';
    }

    /**
     * 隐藏保存公式弹窗
     */
    hideSaveModal() {
        document.getElementById('saveModal').style.display = 'none';
        document.getElementById('newFormulaName').value = '';
    }

    /**
     * 提交新公式
     */
    async submitNewFormula() {
        const formulaName = document.getElementById('newFormulaName').value.trim();
        const templateText = document.getElementById('editTextarea').value.trim();
        
        if (!formulaName || !templateText) {
            this.showError('请填写公式名称和内容');
            return;
        }
        
        try {
            const response = await fetch('/api/formulas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    short_name: formulaName,
                    template_text: templateText,
                    model_ids: []
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showSuccess('公式保存成功');
                this.hideSaveModal();
                this.exitEditMode();
                
                // 重新加载公式列表
                this.loadFormulas();
            } else {
                this.showError(result.message || '保存失败');
            }
        } catch (error) {
            console.error('保存公式失败:', error);
            this.showError('保存失败，请重试');
        }
    }

    /**
     * 显示成功消息
     */
    showSuccess(message) {
        // 简单的提示实现
        alert('✅ ' + message);
    }

    /**
     * 显示错误消息
     */
    showError(message) {
        // 简单的提示实现
        alert('❌ ' + message);
    }
}

// 应用启动
document.addEventListener('DOMContentLoaded', () => {
    new AISpellbook();
});