(function () {
  "use strict";

  const root = document.documentElement;
  const themeButtons = document.querySelectorAll("[data-theme-toggle]");

  function getStoredTheme() {
    try {
      return localStorage.getItem("engineering-notes-theme");
    } catch (_) {
      return null;
    }
  }

  function setStoredTheme(theme) {
    try {
      localStorage.setItem("engineering-notes-theme", theme);
    } catch (_) {
      // file:// 下部分浏览器可能禁止存储，当前页面主题仍可正常切换。
    }
  }

  function applyTheme(theme) {
    root.dataset.theme = theme;
    themeButtons.forEach(function (button) {
      button.setAttribute(
        "aria-label",
        theme === "dark" ? "切换到浅色主题" : "切换到深色主题"
      );
      button.textContent = theme === "dark" ? "☀" : "☾";
    });
  }

  const initialTheme =
    getStoredTheme() ||
    (window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light");
  applyTheme(initialTheme);

  themeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
      setStoredTheme(nextTheme);
      applyTheme(nextTheme);
    });
  });

  const menuButton = document.querySelector("[data-menu-toggle]");
  const siteNav = document.querySelector("[data-site-nav]");
  if (menuButton && siteNav) {
    menuButton.addEventListener("click", function () {
      const isOpen = siteNav.classList.toggle("is-open");
      menuButton.setAttribute("aria-expanded", String(isOpen));
    });
  }

  const docShell = document.querySelector(".doc-shell");
  if (document.body.classList.contains("doc-page") && docShell) {
    const docLayoutKey = "engineering-notes-doc-layout";
    const layoutButton = document.createElement("button");
    layoutButton.className = "doc-layout-toggle";
    layoutButton.type = "button";
    layoutButton.setAttribute("data-doc-layout-toggle", "");
    document.body.appendChild(layoutButton);

    function getStoredDocLayout() {
      try {
        return localStorage.getItem(docLayoutKey);
      } catch (_) {
        return null;
      }
    }

    function setStoredDocLayout(layout) {
      try {
        localStorage.setItem(docLayoutKey, layout);
      } catch (_) {
        // file:// 下部分浏览器可能禁止存储，当前页面布局仍可正常切换。
      }
    }

    function applyDocLayout(layout) {
      const isFocus = layout === "focus";
      if (isFocus) {
        root.dataset.docLayout = "focus";
      } else {
        delete root.dataset.docLayout;
      }
      layoutButton.setAttribute("aria-pressed", String(isFocus));
      layoutButton.setAttribute(
        "aria-label",
        isFocus ? "显示左右侧导航栏" : "隐藏左右侧导航栏，放大正文"
      );
      layoutButton.textContent = isFocus ? "显示左右栏" : "专注阅读";
    }

    applyDocLayout(getStoredDocLayout() === "focus" ? "focus" : "default");

    layoutButton.addEventListener("click", function () {
      const nextLayout = root.dataset.docLayout === "focus" ? "default" : "focus";
      setStoredDocLayout(nextLayout);
      applyDocLayout(nextLayout);
    });
  }

  function fallbackCopy(text, button) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      showCopied(button);
    } finally {
      textarea.remove();
    }
  }

  function showCopied(button) {
    const original = button.textContent;
    button.textContent = "已复制";
    window.setTimeout(function () {
      button.textContent = original;
    }, 1300);
  }

  document.querySelectorAll("[data-copy-code]").forEach(function (button) {
    button.addEventListener("click", function () {
      const frame = button.closest(".code-frame");
      const code = frame && frame.querySelector("code");
      if (!code) return;
      const text = code.textContent || "";
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () {
          showCopied(button);
        });
      } else {
        fallbackCopy(text, button);
      }
    });
  });

  const tocLinks = Array.from(document.querySelectorAll(".doc-toc a"));
  if ("IntersectionObserver" in window && tocLinks.length > 0) {
    const headings = tocLinks
      .map(function (link) {
        const id = decodeURIComponent(link.hash.slice(1));
        return document.getElementById(id);
      })
      .filter(Boolean);

    const linkById = new Map(
      tocLinks.map(function (link) {
        return [decodeURIComponent(link.hash.slice(1)), link];
      })
    );

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          tocLinks.forEach(function (link) {
            link.classList.remove("is-active");
          });
          const activeLink = linkById.get(entry.target.id);
          if (activeLink) activeLink.classList.add("is-active");
        });
      },
      { rootMargin: "-18% 0px -72% 0px" }
    );

    headings.forEach(function (heading) {
      observer.observe(heading);
    });
  }

  const backToTop = document.querySelector("[data-back-to-top]");
  if (backToTop) {
    window.addEventListener(
      "scroll",
      function () {
        backToTop.classList.toggle("is-visible", window.scrollY > 600);
      },
      { passive: true }
    );
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  async function renderMermaid() {
    const diagrams = document.querySelectorAll(".mermaid");
    if (diagrams.length === 0) return;

    if (!window.mermaid) {
      diagrams.forEach(function (diagram) {
        const wrap = diagram.closest(".mermaid-wrap");
        if (wrap) wrap.classList.add("mermaid-error");
      });
      return;
    }

    try {
      window.mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "base",
        fontFamily:
          'Inter, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
        themeVariables: {
          primaryColor: "#dff3f2",
          primaryTextColor: "#172126",
          primaryBorderColor: "#0c7c86",
          lineColor: "#61757c",
          secondaryColor: "#fff0e7",
          tertiaryColor: "#eef3f5",
          noteBkgColor: "#fff7d7",
          noteBorderColor: "#d7b95b"
        },
        flowchart: {
          curve: "basis",
          htmlLabels: true,
          useMaxWidth: true
        },
        sequence: {
          useMaxWidth: true,
          wrap: true
        }
      });
      await window.mermaid.run({ nodes: diagrams });
    } catch (error) {
      console.error("Mermaid render failed:", error);
      diagrams.forEach(function (diagram) {
        const wrap = diagram.closest(".mermaid-wrap");
        if (wrap && !diagram.querySelector("svg")) {
          wrap.classList.add("mermaid-error");
        }
      });
    }
  }

  renderMermaid();
})();
