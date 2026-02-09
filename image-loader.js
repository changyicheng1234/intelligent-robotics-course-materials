// 图片加载器 - 通过 API 动态加载图片
// 增加直接访问的难度

class ImageLoader {
    constructor() {
        this.imageCache = new Map();
        this.baseUrl = window.location.origin;
    }

    // 检查用户是否已验证
    isVerified() {
        const verified = localStorage.getItem('star_verified');
        const verifiedTime = localStorage.getItem('star_verified_time');
        if (!verified || verifiedTime) {
            const now = Date.now();
            const timeDiff = now - parseInt(verifiedTime);
            // 24小时有效期
            if (timeDiff > 24 * 60 * 60 * 1000) {
                return false;
            }
        }
        return verified === 'true';
    }

    // 加载图片（通过 base64 编码增加难度）
    async loadImage(imageName) {
        if (!this.isVerified()) {
            throw new Error('未验证，无法加载图片');
        }

        // 如果缓存中有，直接返回
        if (this.imageCache.has(imageName)) {
            return this.imageCache.get(imageName);
        }

        try {
            // 尝试加载图片
            const response = await fetch(`${this.baseUrl}/${imageName}`, {
                method: 'GET',
                headers: {
                    'Referer': window.location.href
                }
            });

            if (!response.ok) {
                throw new Error('无法加载图片');
            }

            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);
            
            // 缓存图片 URL
            this.imageCache.set(imageName, imageUrl);
            
            return imageUrl;
        } catch (error) {
            console.error('加载图片失败:', error);
            throw error;
        }
    }

    // 清理缓存
    clearCache() {
        this.imageCache.forEach(url => {
            URL.revokeObjectURL(url);
        });
        this.imageCache.clear();
    }
}

// 导出
window.ImageLoader = ImageLoader;
