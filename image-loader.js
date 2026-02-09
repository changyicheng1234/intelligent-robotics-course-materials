/**
 * ImageLoader - 通过 GitHub API 加载并解密仓库中的加密图片
 * 图片以 .dat 加密文件存储在仓库中，不部署到 GitHub Pages
 * 只有通过 Star 验证后才能解密查看
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

    // 获取解密密钥 (拆分存储，增加逆向难度)
    _getKey() {
        const p = ['R0b0t1cs', '@2026', '#Star!', 'Verify_', 'Key%Ex4m'];
        return p.join('');
    }

    /**
     * 通过 GitHub Contents API 加载加密图片并解密
     * 流程: API获取.dat → base64解码 → XOR解密 → Blob → 显示
     */
    async loadImage(imageName) {
        if (!this.isVerified()) {
            throw new Error('未验证，无法加载图片');
        }

        // 检查缓存
        if (this.imageCache.has(imageName)) {
            return this.imageCache.get(imageName);
        }

        // 将 .png 文件名转换为 .dat
        const encryptedName = imageName.replace(/\.png$/, '.dat');
        const apiUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${encodeURIComponent(encryptedName)}`;

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
            if (response.status === 404) {
                throw new Error('图片文件不存在');
            }
            throw new Error(`加载失败 (${response.status})`);
        }

        const data = await response.json();

        let encryptedBytes;

        if (data.content) {
            // GitHub API 返回 base64 编码的文件内容
            const base64Content = data.content.replace(/\n/g, '');
            encryptedBytes = this._base64ToBytes(base64Content);
        } else if (data.git_url) {
            // 文件太大 (>1MB)，需要用 Git Blob API
            encryptedBytes = await this._loadLargeFile(data.git_url);
        } else {
            throw new Error('无法解析文件数据');
        }

        // XOR 解密
        const decryptedBytes = this._xorDecrypt(encryptedBytes);

        // 创建 Blob URL
        const mimeType = this._getMimeType(imageName);
        const blob = new Blob([decryptedBytes], { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);

        // 缓存
        this.imageCache.set(imageName, blobUrl);
        return blobUrl;
    }

    // 加载大文件 (>1MB) 通过 Git Blob API
    async _loadLargeFile(gitUrl) {
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
            return this._base64ToBytes(data.content.replace(/\n/g, ''));
        }

        throw new Error('无法加载大文件');
    }

    // XOR 解密
    _xorDecrypt(encryptedBytes) {
        const key = new TextEncoder().encode(this._getKey());
        const decrypted = new Uint8Array(encryptedBytes.length);
        for (let i = 0; i < encryptedBytes.length; i++) {
            decrypted[i] = encryptedBytes[i] ^ key[i % key.length];
        }
        return decrypted;
    }

    // Base64 字符串转 Uint8Array
    _base64ToBytes(base64) {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
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

    // 清理验证数据和缓存
    logout() {
        sessionStorage.removeItem('gh_verify');
        localStorage.removeItem('star_verified_time');
        this.token = null;
        this.username = null;
        // 释放 Blob URLs
        this.imageCache.forEach(url => URL.revokeObjectURL(url));
        this.imageCache.clear();
    }
}

window.ImageLoader = ImageLoader;
