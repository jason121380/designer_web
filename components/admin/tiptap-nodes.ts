import { Node, mergeAttributes } from "@tiptap/core";

/**
 * Instagram 嵌入：以原子節點存放，輸出前台 embed.js 需要的 blockquote。
 * 同時能解析既有匯入內容中的 blockquote.instagram-media（編輯時不會被清掉）。
 */
export const InstagramEmbed = Node.create({
  name: "instagramEmbed",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      url: { default: null as string | null },
    };
  },

  parseHTML() {
    return [
      {
        tag: "blockquote.instagram-media",
        priority: 100,
        getAttrs: (el) => ({
          url: (el as HTMLElement).getAttribute("data-instgrm-permalink") || null,
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const url: string = HTMLAttributes.url || "";
    return [
      "blockquote",
      mergeAttributes({
        class: "instagram-media",
        "data-instgrm-permalink": url,
        "data-instgrm-version": "14",
        style: "width:100%;max-width:540px;margin:1em auto;",
      }),
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("div");
      dom.contentEditable = "false";
      dom.setAttribute("data-instagram-embed", "");
      dom.style.cssText = "margin:12px 0;";

      const url: string = node.attrs.url || "";

      if (!url) {
        dom.innerHTML =
          '<div style="border:1px dashed #C4837A;border-radius:8px;padding:14px;background:#FBF4F3;color:#A3635B;font-size:13px;text-align:center;">📷 Instagram 貼文（未設定網址）</div>';
        return { dom, ignoreMutation: () => true, stopEvent: () => true };
      }

      const bq = document.createElement("blockquote");
      bq.className = "instagram-media";
      bq.setAttribute("data-instgrm-permalink", url);
      bq.setAttribute("data-instgrm-version", "14");
      bq.style.cssText =
        "width:100%;max-width:540px;margin:1em auto;min-height:120px;border:1px solid #eee;border-radius:6px;background:#fafafa;";
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = "開啟 Instagram 貼文";
      a.style.cssText =
        "display:block;padding:18px;color:#A3635B;font-size:13px;text-align:center;word-break:break-all;";
      bq.appendChild(a);
      dom.appendChild(bq);

      const process = () => {
        try {
          (
            window as unknown as { instgrm?: { Embeds: { process: () => void } } }
          ).instgrm?.Embeds.process();
        } catch {
          /* ignore */
        }
      };

      const w = window as unknown as { instgrm?: unknown };
      if (w.instgrm) {
        process();
      } else if (!document.getElementById("instagram-embed-js")) {
        const s = document.createElement("script");
        s.id = "instagram-embed-js";
        s.src = "https://www.instagram.com/embed.js";
        s.async = true;
        s.onload = process;
        document.body.appendChild(s);
      } else {
        let tries = 0;
        const timer = setInterval(() => {
          if (w.instgrm) {
            process();
            clearInterval(timer);
          } else if (++tries > 20) {
            clearInterval(timer);
          }
        }, 400);
      }

      return {
        dom,
        // 讓 Instagram embed.js 自由把 blockquote 換成 iframe,ProseMirror 不要重繪
        ignoreMutation: () => true,
        stopEvent: () => true,
        update: (updated) => {
          if (updated.type.name !== node.type.name) return false;
          // 網址沒變就保留(避免重置已渲染的嵌入);變了則重建
          return (updated.attrs.url || "") === url;
        },
      };
    };
  },
});

/**
 * 目錄佔位：輸出 <div data-toc="true">，前台依文章 H2/H3 自動產生實際目錄。
 */
export const TableOfContents = Node.create({
  name: "tableOfContents",
  group: "block",
  atom: true,
  draggable: true,

  parseHTML() {
    return [{ tag: "div[data-toc]", priority: 100 }];
  },

  renderHTML() {
    return ["div", mergeAttributes({ "data-toc": "true" })];
  },

  addNodeView() {
    return () => {
      const dom = document.createElement("div");
      dom.contentEditable = "false";
      dom.style.cssText =
        "border:1px dashed #999;border-radius:8px;padding:14px;margin:12px 0;background:#f6f6f6;color:#555;font-size:13px;text-align:center;";
      dom.textContent = "📑 本文目錄（發佈後依文章標題自動產生）";
      return { dom };
    };
  },
});
