import { isFirefox } from "@constants/shared";
import type { CompressOptions } from "@/core/types";

export const compress = (() => {
  if (!isFirefox) return undefined;

  return {
    async icon(src: string, options?: CompressOptions) {
      if (!src || !src.startsWith("data:")) return src;

      // per call: a shared img/canvas would have its handlers and src
      // overwritten by a concurrent call, leaving the earlier promise pending
      const img = document.createElement("img");
      const ctx = document.createElement("canvas").getContext("2d");

      if (!ctx) return src;

      return new Promise<string>((resolve) => {
        img.src = src;
        img.onerror = () => resolve(src);
        img.onabort = () => resolve(src);
        img.onload = (event) => {
          if (event.currentTarget instanceof HTMLImageElement) {
            let { maxSize, quality } = options ?? {
              maxSize: 20,
              quality: 0.7,
            };

            if (!maxSize || maxSize >= event.currentTarget.naturalWidth) {
              maxSize = event.currentTarget.naturalWidth;
              quality = 1;
            }

            ctx.canvas.height = maxSize;
            ctx.canvas.width = maxSize;

            ctx.drawImage(event.currentTarget, 0, 0, maxSize, maxSize);

            const dataURL = ctx.canvas.toDataURL(options?.type, quality);

            resolve(src.length > dataURL.length ? dataURL : src);
          } else resolve(src);
        };
      });
    },
  };
})();
