export const isDataUrl = (url: string) => url.startsWith("data:");

export const isColor = (str: string) => /^#([0-9A-F]{3}){1,2}$/i.test(str);

export const processImageUrl = (url: string, width = 1920, height = 1080) => {
  if (isDataUrl(url) || isColor(url)) return url;

  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set("auto", "format");
    urlObj.searchParams.set("fit", "crop");
    urlObj.searchParams.set("w", width.toString());
    urlObj.searchParams.set("h", height.toString());
    return urlObj.toString();
  } catch {
    return url;
  }
};

export const generateThumbnail = (src: string, maxWidth = 200, maxHeight = 200): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (isColor(src)) {
      resolve(src);
      return;
    }

    const img = document.createElement("img");
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round(height * (maxWidth / width));
            width = maxWidth;
          }
        } else if (height > maxHeight) {
          width = Math.round(width * (maxHeight / height));
          height = maxHeight;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
};

export const parseStoredBackground = (raw: string): string => {
  try {
    const parsed = JSON.parse(raw) as { url?: string };
    return parsed.url || raw;
  } catch {
    return raw;
  }
};
