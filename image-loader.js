/**
 * ImageLoader - 通过 GitHub API 加载仓库中的图片
 * 图片不部署到 GitHub Pages，只能通过 API + Token 获取
 */
class ImageLoader {
    constructor() {
        this.owner = 'changyicheng1234';
        this.repo = 'intelligent-robotics-course-materials';
        this.imageCache = new Map();
        this.token = null;
        this.username = null;
        this._loadVerifyData();
    }

    // 从 sessionStorage 加载验证数据
    _loadVerifyData() {
        try {
            const raw = sessionStorage.getItem('gh_verify');
            if (!raw) return;
            const data = JSON.parse(atob(raw));
            const elapsed = Date.now() - data.time;
            // 24小时有效期
            if (elapsed < 24 * 60 * 60 * 1000 && data.token) {
                this.token = data.token;
                this.username = data.username;
            }
        } catch (e) {
            console.error('加载验证数据失败:', e);
        }
    }

    // 检查是否已验证
    isVerified() {
        return !!this.token;
    }

    // 获取用户名
    getUsername() {
        return this.username || '未知用户';
    }

    /**
     * 通过 GitHub Contents API 加载图片
     * API: GET /repos/{owner}/{repo}/contents/{path}
     * 返回 base64 编码的文件内容
     */
    async loadImage(imageName) {
        if (!this.isVerified()) {
            throw new Error('未验证，无法加载图片');
        }

        // 检查缓存
        if (this.imageCache.has(imageName)) {
            return this.imageCache.get(imageName);
        }

        const apiUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${encodeURIComponent(imageName)}`;
        
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `token ${this.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error('Token 无效或已过期，请重新验证');
            }
            throw new Error(`加载失败 (${response.status})`);
        }

        const data = await response.json();

        if (data.encoding === 'base64' && data.content) {
            // GitHub API 返回 base64 编码的内容
            const base64Content = data.content.replace(/\n/g, '');
            const mimeType = this._getMimeType(imageName);
            const dataUrl = `data:${mimeType};base64,${base64Content}`;
            
            // 缓存
            this.imageCache.set(imageName, dataUrl);
            return dataUrl;
        } else {
            // 文件太大(>1MB)，GitHub 不返回内容，需要用 git blob API
            if (data.git_url) {
                return await this._loadLargeFile(data.git_url, imageName);
            }
            throw new Error('无法解析图片数据');
        }
    }

    // 加载大文件 (>1MB) 通过 Git Blob API
    async _loadLargeFile(gitUrl, imageName) {
        const response = await fetch(gitUrl, {
            headers: {
                'Authorization': `token ${this.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            throw new Error(`加载大文件失败 (${response.status})`);
        }

        const data = await response.json();
        if (data.encoding === 'base64' && data.content) {
            const base64Content = data.content.replace(/\n/g, '');
            const mimeType = this._getMimeType(imageName);
            const dataUrl = `data:${mimeType};base64,${base64Content}`;
            this.imageCache.set(imageName, dataUrl);
            return dataUrl;
        }

        throw new Error('无法加载大文件');
    }

    // 根据文件名获取 MIME 类型
    _getMimeType(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const mimeMap = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'svg': 'image/svg+xml',
            'bmp': 'image/bmp'
        };
        return mimeMap[ext] || 'image/png';
    }

    // 清理验证数据
    logout() {
        sessionStorage.removeItem('gh_verify');
        localStorage.removeItem('star_verified_time');
        this.token = null;
        this.username = null;
        this.imageCache.clear();
    }
}

window.ImageLoader = ImageLoader;
