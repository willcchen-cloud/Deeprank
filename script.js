(() => {
  const starCanvas = document.getElementById("starCanvas");
  const dustCanvas = document.getElementById("galaxyDustCanvas");
  const starCtx = starCanvas?.getContext("2d", { alpha: true });
  const dustCtx = dustCanvas?.getContext("2d", { alpha: true });
  const root = document.documentElement;
  root.classList.add("js");

  const coordinateLayer = document.querySelector(".coordinate-layer");
  const nodes = [...document.querySelectorAll("[data-zone]")];
  const capabilityOrbit = document.querySelector(".capability-orbit");
  const capabilityNodes = [...document.querySelectorAll(".capability-node")];
  const revealSections = [...document.querySelectorAll(".reveal")];
  const langToggle = document.querySelector(".lang-toggle");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const i18n = {
    en: {
      meta: {
        title: "DeepRank Tech | Reliable Data for Reliable AI",
        description:
          "DeepRank Tech provides high-quality data collection, annotation, quality inspection, and secure delivery services for autonomous driving, robotics, multimodal AI, and industrial vision.",
      },
      brand: {
        name: "DeepRank",
        sub: "DeepRank Tech",
      },
      nav: {
        about: "ABOUT",
        technology: "TECHNOLOGY",
        services: "SERVICES",
        contact: "CONTACT",
      },
      hero: {
        eyebrow: "DeepRank Tech",
        title: "Reliable Data\nfor Reliable AI",
        subtitle: "Reliable data infrastructure for AI",
        body: "DeepRank Tech provides high-quality data collection, annotation, quality inspection, and secure delivery services for autonomous driving, robotics, multimodal AI, and industrial vision.",
        cta: "Enter the Data Universe",
      },
      heroNodes: {
        umi: { label: "UMI Capture", zh: "", note: "Stable grasp trajectory capture" },
        ego: { label: "Ego-view Capture", zh: "", note: "Context-aware operation footage" },
        cleaning: { label: "Cleaning", zh: "", note: "Noise removal and schema alignment" },
        qa: { label: "QA", zh: "", note: "Review loops and anomaly return" },
        annotation: { label: "Annotation", zh: "", note: "Semantic labels for multimodal data" },
        delivery: { label: "Delivery", zh: "", note: "Secure package and acceptance record" },
      },
      pipeline: {
        kicker: "02 — DATA PIPELINE",
        title: "From Raw Capture\nto Deliverable Dataset",
        subtitle: "An integrated production workflow from task definition to validated dataset delivery.",
        body: "Standardized workflows, quality gates, and multi-stage validation keep every dataset ready for high-quality delivery.",
        nodes: {
          task: { title: "Task Definition", sub: "", note: "Define goals, scenes, standards, and delivery format." },
          protocol: { title: "Capture Protocol", sub: "", note: "Design SOPs, device settings, capture actions, and sampling checks." },
          field: { title: "Field Collection", sub: "", note: "Execute UMI, ego-view, video, and multimodal capture tasks." },
          ingestion: { title: "Data Ingestion", sub: "", note: "Normalize naming, organization, backup, and version control." },
          cleaning: { title: "Cleaning", sub: "", note: "Remove abnormal, duplicate, corrupted, or low-quality records." },
          annotation: { title: "Annotation", sub: "", note: "Complete annotation, review, and consistency checks." },
          quality: { title: "Quality Review", sub: "", note: "Control quality through sampling, feedback loops, and acceptance review." },
          delivery: { title: "Delivery", sub: "", note: "Deliver datasets, annotation files, QA records, and delivery checklists." },
        },
      },
      capabilities: {
        kicker: "Capability Orbit",
        title: "Capabilities Across the Data Universe",
        subtitle: "Data collection, cleaning, quality inspection, annotation, and secure delivery in one production system.",
        core: { title: "DeepRank", sub: "Data Production System" },
        nodes: {
          umi: { label: "UMI Capture", zh: "", detail: "Capture hand operations, object interaction, and robot imitation learning data." },
          ego: { label: "Ego-view Capture", zh: "", detail: "Record first-person workflows, behavior traces, and scene context." },
          collection: { label: "Data Collection", zh: "", detail: "Define workflows, teams, devices, scenes, and quality standards for each task." },
          cleaning: { label: "Data Cleaning", zh: "", detail: "Filter abnormal samples, repeated clips, low-quality records, and non-compliant data." },
          inspection: { label: "Quality Inspection", zh: "", detail: "Use sampling, anomaly feedback, and pre-delivery review to ensure usability." },
          annotation: { label: "Annotation", zh: "", detail: "Support image, video, trajectory, keypoint, box, segmentation, and multimodal labeling." },
          delivery: { label: "Secure Delivery", zh: "", detail: "Deliver datasets through checklists, version control, and permission management." },
        },
      },
      capture: {
        sectionLabel: "03 — CAPTURE SYSTEMS",
        title: "Capture Systems\nfor Embodied Intelligence",
        subtitle: "Dedicated capture workflows for robotic manipulation, ego-view recording, and multimodal data production.",
        umi: {
          title: "UMI Gripper Capture",
          body: "Human hand-object interaction capture for robotic manipulation, imitation learning, and action sequence datasets.",
          bullets: [
            "Hand-object interaction recording",
            "Gripper trajectory and motion sequence capture",
            "Multi-object, multi-scene task collection",
            "Data for robotic imitation learning",
          ],
        },
        ego: {
          title: "Ego-view Capture",
          body: "First-person task recording for human behavior, procedure context, and long-horizon multimodal understanding.",
          bullets: [
            "First-person task process recording",
            "Human operation and behavior context capture",
            "Long-horizon, multi-scene task support",
            "Data for multimodal reasoning and task planning",
          ],
        },
      },
      quality: {
        sectionLabel: "04 — QUALITY LAYER",
        title: "Quality Before Scale",
        subtitle: "SOP, sampling, review, and feedback loops for stable data delivery.",
        nodes: [
          "01 SOP Defined",
          "02 Sampling Enabled",
          "03 Cleaning Applied",
          "04 Multi-stage Review",
          "05 Consistency Check",
          "06 Error Feedback",
          "07 Delivery Ready",
        ],
        status: ["Delivery Ready", "Validation Complete", "Review Passed"],
      },
      confidential: {
        sectionLabel: "05 — CONFIDENTIAL DELIVERY",
        title: "Built for Confidential\nData Workflows",
        subtitle: "Verifiable delivery workflows without exposing sensitive client data.",
        body: "Client datasets and project outputs are often protected by confidentiality agreements. DeepRank does not display sensitive client work publicly. Instead, we make delivery quality verifiable through standardized workflows, task-level SOPs, quality records, delivery checklists, and permission-controlled handoff.",
        features: [
          { title: "Encryption", body: "Data protection during storage, transfer, and delivery." },
          { title: "Access Control", body: "Role-based project permissions and controlled data access." },
          { title: "Audit Trail", body: "Delivery records, quality logs, and review history." },
          { title: "Data Isolation", body: "Project-level separation for sensitive data workflows." },
          { title: "Delivery Checklist", body: "Structured handoff with files, versions, and validation records." },
        ],
        flow: ["Collect", "Process", "Validate", "Secure", "Deliver"],
      },
      final: {
        sectionLabel: "06 — CONTACT",
        title: "Build Your Next Dataset\nwith DeepRank",
        subtitle: "Bring high-quality data production into a controlled, verifiable workflow.",
        body: "If you are building robotics, embodied intelligence, multimodal models, autonomous driving, or industrial vision systems, DeepRank can support your data workflow from collection and cleaning to annotation, quality inspection, and secure delivery.",
        primaryCta: "Contact DeepRank",
        secondaryCta: "Discuss a Data Project",
        keywords: ["Data Collection", "Annotation", "Quality Inspection", "Secure Delivery"],
        footerBrand: "DeepRank Tech",
        footerServices: "Data Collection · Annotation · Quality Inspection · Secure Delivery",
        copyright: "© DeepRank Tech. 版权所有。",
      },
      footer: {
        name: "DeepRank Tech",
        scope: "Data Collection · Annotation · Quality Inspection · Secure Delivery",
      },
    },
    cn: {
      meta: {
        title: "深序科技有限公司 | DeepRank Tech",
        description: "深序科技为智能驾驶、机器人、多模态 AI 与工业视觉提供高质量数据采集、标注、质检与安全交付服务。",
      },
      brand: {
        name: "深序科技",
        sub: "DeepRank Tech",
      },
      nav: {
        about: "关于我们",
        technology: "技术能力",
        services: "服务内容",
        contact: "联系我们",
      },
      hero: {
        eyebrow: "深序科技",
        title: "为 AI 构建\n可靠的数据基础设施",
        subtitle: "面向智能系统的高质量数据生产能力",
        body: "深序科技为智能驾驶、机器人、多模态 AI 与工业视觉提供高质量数据采集、标注、质检与安全交付服务。",
        cta: "进入数据宇宙",
      },
      heroNodes: {
        umi: { label: "夹抓采集", zh: "", note: "稳定记录夹抓轨迹与操作片段" },
        ego: { label: "第一视角采集", zh: "", note: "采集任务上下文与人类操作流程" },
        cleaning: { label: "数据清洗", zh: "", note: "清除噪声并统一数据结构" },
        qa: { label: "质量检测", zh: "", note: "多轮复核与异常回流" },
        annotation: { label: "数据标注", zh: "", note: "面向多模态任务的语义标签" },
        delivery: { label: "成品交付", zh: "", note: "交付清单、版本与权限控制" },
      },
      pipeline: {
        kicker: "02 — 数据生产流程",
        title: "从原始采集\n到可交付数据集",
        subtitle: "从任务定义到成品交付的一体化数据生产流程。",
        body: "通过标准化流程、质量控制与多轮校验，确保每一份数据集都符合高质量交付要求。",
        nodes: {
          task: { title: "任务定义", sub: "", note: "明确目标、场景、标准与交付格式。" },
          protocol: { title: "采集方案设计", sub: "", note: "设计 SOP、设备配置、采集动作与抽检方式。" },
          field: { title: "现场数据采集", sub: "", note: "执行 UMI、Ego、视频、多模态等采集任务。" },
          ingestion: { title: "原始数据接收", sub: "", note: "统一命名、整理、备份与版本管理。" },
          cleaning: { title: "数据清洗", sub: "", note: "过滤异常、重复、损坏与低质量记录。" },
          annotation: { title: "数据标注", sub: "", note: "完成标注、复核与一致性检查。" },
          quality: { title: "质量检测", sub: "", note: "通过抽检、错误回流与验收控制质量。" },
          delivery: { title: "成品交付", sub: "", note: "输出数据集、标注文件、质检记录与交付清单。" },
        },
      },
      capabilities: {
        kicker: "能力星轨",
        title: "覆盖数据生产全流程的能力体系",
        subtitle: "覆盖采集、清洗、质检、标注与安全交付的一体化数据生产能力。",
        core: { title: "深序科技", sub: "数据生产系统" },
        nodes: {
          umi: { label: "UMI 夹抓采集", zh: "", detail: "手部操作、物体交互、机器人模仿学习数据采集。" },
          ego: { label: "Ego 第一视角采集", zh: "", detail: "头戴式第一视角记录人类操作流程、行为轨迹与场景上下文。" },
          collection: { label: "数据采集", zh: "", detail: "根据任务定义采集流程、人员、设备、场景与质量标准。" },
          cleaning: { label: "数据清洗", zh: "", detail: "过滤异常样本、重复片段、低质量记录与不符合规范的数据。" },
          inspection: { label: "质量检测", zh: "", detail: "多轮抽检、异常回流、交付前验收，确保数据可用性。" },
          annotation: { label: "数据标注", zh: "", detail: "支持图像、视频、轨迹、关键点、检测框、分割、多模态标注等任务。" },
          delivery: { label: "安全交付", zh: "", detail: "以标准化交付清单、版本管理和权限控制完成数据集交付。" },
        },
      },
      capture: {
        sectionLabel: "03 — 采集系统",
        title: "面向具身智能的\n数据采集系统",
        subtitle: "面向机器人操作、第一视角记录与多模态任务的数据采集流程。",
        umi: {
          title: "UMI 夹抓采集",
          body: "面向机器人操作和模仿学习，采集人手与物体交互过程、夹抓轨迹与动作序列数据。",
          bullets: [
            "手部与物体交互过程采集",
            "夹抓轨迹与动作序列记录",
            "支持多物体、多任务、多场景采集",
            "用于机器人模仿学习数据构建",
          ],
        },
        ego: {
          title: "Ego 第一视角采集",
          body: "通过头戴式第一视角设备记录人类任务过程、行为上下文和长流程操作数据。",
          bullets: [
            "第一视角任务过程记录",
            "人类操作流程与行为上下文采集",
            "支持长流程、多场景任务",
            "用于多模态理解与任务规划",
          ],
        },
      },
      quality: {
        sectionLabel: "04 — 质量控制体系",
        title: "质量先于规模",
        subtitle: "通过 SOP、抽检、复核与异常回流构建稳定交付质量。",
        nodes: ["01 SOP 已定义", "02 过程抽检", "03 数据清洗", "04 多轮复核", "05 一致性检查", "06 异常回流", "07 交付就绪"],
        status: ["交付就绪", "验收完成", "复核通过"],
      },
      confidential: {
        sectionLabel: "05 — 保密与安全交付",
        title: "为保密数据流程而设计",
        subtitle: "在不展示敏感客户数据的前提下，建立可验证、可追踪、可验收的交付流程。",
        body: "客户数据和项目成果通常受到保密协议保护，深序科技不会在官网展示真实客户数据、成品样例或项目细节。我们通过标准化流程、任务级 SOP、质检记录、交付清单和权限控制，让客户在不暴露敏感数据的前提下确认交付质量。",
        features: [
          { title: "加密保护", body: "覆盖存储、传输与交付环节的数据保护。" },
          { title: "权限控制", body: "按角色和项目范围管理数据访问权限。" },
          { title: "审计记录", body: "保留交付记录、质检日志与复核历史。" },
          { title: "数据隔离", body: "面向敏感项目的数据分区和权限隔离。" },
          { title: "交付清单", body: "按文件、版本、标注结果和验收记录完成结构化交付。" },
        ],
        flow: ["采集", "处理", "验证", "加密", "交付"],
      },
      final: {
        sectionLabel: "06 — 合作联系",
        title: "与深序科技构建\n下一份高质量数据集",
        subtitle: "让高质量数据生产进入可控、可验证、可交付的流程。",
        body: "如果你正在构建机器人、具身智能、多模态模型、智能驾驶或工业视觉系统，深序科技可以为你提供从采集、清洗、标注到质检交付的一体化数据生产支持。",
        primaryCta: "联系深序科技",
        secondaryCta: "咨询数据项目",
        keywords: ["数据采集", "数据标注", "质量检测", "安全交付"],
        footerBrand: "深序科技有限公司",
        footerServices: "数据采集 · 数据标注 · 质量检测 · 安全交付",
        copyright: "© DeepRank Tech. All rights reserved.",
      },
      footer: {
        name: "深序科技有限公司 / DeepRank Tech",
        scope: "数据采集 · 数据标注 · 质量检测 · 安全交付",
      },
    },
  };

  setupLanguage();

  if (!starCtx && !dustCtx) return;

  let width = 1;
  let height = 1;
  let dpr = 1;
  let frame = 0;
  let running = false;
  let lastTime = 0;
  let stars = [];
  let dust = [];
  let flows = [];

  const pointer = {
    x: 0.5,
    y: 0.5,
    tx: 0.5,
    ty: 0.5,
  };

  const galaxy = {
    centerX: 0,
    centerY: 0,
    radius: 0,
    arms: 3,
    flatten: 0.48,
    spiral: 5.45,
    tilt: -0.34,
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, n) => a + (b - a) * n;
  const rand = (min, max) => min + Math.random() * (max - min);

  function getI18nValue(path, lang) {
    return path.split(".").reduce((value, key) => {
      if (value == null) return "";
      return value[key];
    }, i18n[lang]);
  }

  function renderI18n(lang) {
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const value = getI18nValue(element.dataset.i18n, lang);
      const text = value == null ? "" : String(value);
      element.innerHTML = text.replace(/\n/g, "<br />");
    });

    document.documentElement.lang = lang === "cn" ? "zh-CN" : "en";
    document.body.classList.toggle("is-cn", lang === "cn");
    document.body.classList.toggle("is-en", lang === "en");
    document.title = i18n[lang].meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", i18n[lang].meta.description);

    if (langToggle) {
      const nextLang = lang === "en" ? "cn" : "en";
      langToggle.textContent = nextLang.toUpperCase();
      langToggle.setAttribute("aria-label", lang === "en" ? "Switch to Chinese" : "切换到英文");
    }
  }

  function setupLanguage() {
    const storageKey = "deeprank-lang";
    let currentLang = "en";

    try {
      const savedLang = localStorage.getItem(storageKey);
      if (savedLang === "en" || savedLang === "cn") currentLang = savedLang;
    } catch (error) {
      currentLang = "en";
    }

    renderI18n(currentLang);

    langToggle?.addEventListener("click", () => {
      currentLang = currentLang === "en" ? "cn" : "en";
      renderI18n(currentLang);

      try {
        localStorage.setItem(storageKey, currentLang);
      } catch (error) {
        // Ignore storage failures; the visible language has already changed.
      }
    });
  }

  function sizeCanvas(canvas, ctx) {
    if (!canvas || !ctx) return;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function resize() {
    const rect = (starCanvas || dustCanvas).getBoundingClientRect();
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    sizeCanvas(starCanvas, starCtx);
    sizeCanvas(dustCanvas, dustCtx);

    const mobile = width < 680;
    const tablet = width < 980;
    galaxy.centerX = width * (mobile ? 0.66 : 0.62);
    galaxy.centerY = height * (mobile ? 0.38 : tablet ? 0.43 : 0.48);
    galaxy.radius = Math.min(width, height) * (mobile ? 0.54 : tablet ? 0.62 : 0.66);

    createStars();
    createDust();
  }

  function createStars() {
    const mobile = width < 680;
    const count = mobile ? 40 : 78;

    stars = Array.from({ length: count }, () => {
      const rightWeighted = Math.random() < 0.78;
      const x = rightWeighted ? rand(0.38, 0.98) : rand(0.05, 0.38);
      const y = rand(0.08, 0.92);
      const calmTextArea = x < 0.42 && y > 0.28 && y < 0.78;

      return {
        x,
        y,
        depth: rand(0.35, 1.65),
        radius: rand(0.35, mobile ? 1 : 1.18),
        alpha: calmTextArea ? rand(0.02, 0.065) : rand(0.035, 0.18),
        phase: rand(0, Math.PI * 2),
        hue: Math.random() < 0.18 ? "205,222,235" : "238,243,246",
      };
    });
  }

  function createDust() {
    const mobile = width < 680;
    const tablet = width < 980;
    const count = mobile ? 620 : tablet ? 1050 : 1780;
    const flowCount = mobile ? 16 : tablet ? 24 : 34;

    dust = Array.from({ length: count }, () => {
      const radiusNorm = 0.11 + Math.pow(Math.random(), 0.72) * 0.89;
      const armIndex = Math.floor(Math.random() * galaxy.arms);
      const armOffset = ((Math.PI * 2) / galaxy.arms) * armIndex;
      const armSpread = (1 - radiusNorm) * 0.58 + 0.08;
      const warm = Math.random() < 0.028;

      return {
        radiusNorm,
        armIndex,
        armOffset,
        angle: rand(-armSpread, armSpread),
        depth: rand(0.45, 1.55),
        size: rand(0.3, mobile ? 0.95 : 1.1),
        alpha: rand(0.12, 0.45) * (0.76 + radiusNorm * 0.2),
        speed: rand(0.00008, 0.00022) * (1.16 - radiusNorm * 0.62),
        wobble: rand(0.6, 4.8) * (0.65 + radiusNorm),
        wobbleSpeed: rand(0.00012, 0.00034),
        phase: rand(0, Math.PI * 2),
        hue: warm ? "255,185,130" : Math.random() < 0.35 ? "182,203,222" : "226,238,246",
      };
    });

    flows = Array.from({ length: flowCount }, () => createFlow(true));
  }

  function createFlow(initial = false) {
    const radiusNorm = rand(0.22, 0.88);
    const armIndex = Math.floor(Math.random() * galaxy.arms);

    return {
      radiusNorm,
      armIndex,
      armOffset: ((Math.PI * 2) / galaxy.arms) * armIndex,
      angle: rand(-0.24, 0.24),
      speed: rand(0.00034, 0.00072) * (1.12 - radiusNorm * 0.45),
      length: rand(0.035, 0.072),
      life: initial ? Math.random() : 0,
      lifeSpeed: rand(0.0022, 0.0044),
      wait: initial ? rand(0, 180) : rand(110, 520),
      alpha: rand(0.16, 0.34),
      width: rand(0.38, 0.76),
      phase: rand(0, Math.PI * 2),
    };
  }

  function projectParticle(item, time, angleOffset = 0, radiusOffset = 0) {
    const radiusNorm = clamp(item.radiusNorm + radiusOffset, 0.04, 1.08);
    const theta = item.angle + item.armOffset + radiusNorm * galaxy.spiral + angleOffset;
    const radius = radiusNorm * galaxy.radius;
    const wobble = Math.sin(time * item.wobbleSpeed + item.phase) * (item.wobble || 0);
    const rawX = Math.cos(theta) * radius + wobble;
    const rawY = Math.sin(theta) * radius * galaxy.flatten + wobble * 0.28;
    const cos = Math.cos(galaxy.tilt);
    const sin = Math.sin(galaxy.tilt);
    const mx = (pointer.x - 0.5) * 8 * (item.depth || 1);
    const my = (pointer.y - 0.5) * 5 * (item.depth || 1);

    return {
      x: galaxy.centerX + rawX * cos - rawY * sin + mx,
      y: galaxy.centerY + rawX * sin + rawY * cos + my,
    };
  }

  function edgeFade(x, y) {
    const left = clamp((x - width * 0.36) / (width * 0.2), 0, 1);
    const top = clamp((y - height * 0.04) / (height * 0.14), 0, 1);
    const bottom = clamp((height * 0.96 - y) / (height * 0.14), 0, 1);
    const right = clamp((width * 1.02 - x) / (width * 0.16), 0, 1);
    return left * top * bottom * right;
  }

  function drawStarLayer(time) {
    if (!starCtx) return;
    starCtx.clearRect(0, 0, width, height);

    const mx = pointer.x - 0.5;
    const my = pointer.y - 0.5;

    stars.forEach((star) => {
      const drift = Math.sin(time * 0.00018 + star.phase) * 2.2;
      const x = star.x * width + mx * 44 * star.depth + drift;
      const y = star.y * height + my * 28 * star.depth + drift * 0.4;
      const pulse = 0.72 + Math.sin(time * 0.001 + star.phase) * 0.28;
      const alpha = clamp(star.alpha * pulse, 0.015, 0.24);

      starCtx.beginPath();
      starCtx.fillStyle = `rgba(${star.hue},${alpha})`;
      starCtx.arc(x, y, star.radius, 0, Math.PI * 2);
      starCtx.fill();

      if (star.radius > 0.9 && alpha > 0.08) {
        const glow = starCtx.createRadialGradient(x, y, 0, x, y, star.radius * 6);
        glow.addColorStop(0, `rgba(${star.hue},${alpha * 0.24})`);
        glow.addColorStop(1, `rgba(${star.hue},0)`);
        starCtx.fillStyle = glow;
        starCtx.beginPath();
        starCtx.arc(x, y, star.radius * 6, 0, Math.PI * 2);
        starCtx.fill();
      }
    });
  }

  function drawDustLayer(time, delta) {
    if (!dustCtx) return;
    dustCtx.clearRect(0, 0, width, height);
    dustCtx.save();
    dustCtx.globalCompositeOperation = "screen";

    dust.forEach((particle) => {
      particle.angle += particle.speed * delta;
      const p = projectParticle(particle, time);
      const fade = edgeFade(p.x, p.y);
      if (fade <= 0.01) return;

      const shimmer = 0.82 + Math.sin(time * 0.00042 + particle.phase) * 0.18;
      const alpha = clamp(particle.alpha * shimmer * fade, 0.02, 0.45);

      dustCtx.fillStyle = `rgba(${particle.hue},${alpha})`;
      dustCtx.beginPath();
      dustCtx.arc(p.x, p.y, particle.size, 0, Math.PI * 2);
      dustCtx.fill();
    });

    flows.forEach((flow, index) => {
      if (flow.wait > 0) {
        flow.wait -= delta;
        return;
      }

      flow.angle += flow.speed * delta;
      flow.life += flow.lifeSpeed * delta;

      if (flow.life >= 1) {
        flows[index] = createFlow(false);
        return;
      }

      if (flow.life < 0.1 || flow.life > 0.86) return;

      const localLife = (flow.life - 0.1) / 0.76;
      const fade = Math.sin(localLife * Math.PI);
      const points = [];

      for (let i = 0; i < 6; i += 1) {
        const trail = i / 5;
        points.push(projectParticle(flow, time, -flow.length * trail, -trail * 0.012));
      }

      const head = points[0];
      const tail = points[points.length - 1];
      const mask = edgeFade(head.x, head.y) * edgeFade(tail.x, tail.y);
      if (mask <= 0.01) return;

      const alpha = flow.alpha * fade * mask;
      const gradient = dustCtx.createLinearGradient(head.x, head.y, tail.x, tail.y);
      gradient.addColorStop(0, `rgba(242,248,252,${alpha})`);
      gradient.addColorStop(0.4, `rgba(174,204,226,${alpha * 0.52})`);
      gradient.addColorStop(1, "rgba(174,204,226,0)");

      dustCtx.strokeStyle = gradient;
      dustCtx.lineWidth = flow.width;
      dustCtx.beginPath();
      points.forEach((point, pointIndex) => {
        if (pointIndex === 0) dustCtx.moveTo(point.x, point.y);
        else dustCtx.lineTo(point.x, point.y);
      });
      dustCtx.stroke();
    });

    dustCtx.restore();
  }

  function clearCanvases() {
    starCtx?.clearRect(0, 0, width, height);
    dustCtx?.clearRect(0, 0, width, height);
  }

  function animate(time = 0) {
    if (!running) return;

    const delta = lastTime ? clamp((time - lastTime) / 16.67, 0.2, 2.2) : 1;
    lastTime = time;

    pointer.x = lerp(pointer.x, pointer.tx, 0.065);
    pointer.y = lerp(pointer.y, pointer.ty, 0.065);

    root.style.setProperty("--mx", (pointer.x - 0.5).toFixed(4));
    root.style.setProperty("--my", (pointer.y - 0.5).toFixed(4));

    drawStarLayer(time);
    drawDustLayer(time, delta);

    frame = requestAnimationFrame(animate);
  }

  function startAnimation() {
    if (running || reducedMotion.matches || document.hidden) return;
    running = true;
    lastTime = 0;
    frame = requestAnimationFrame(animate);
  }

  function stopAnimation(shouldClear = false) {
    running = false;
    cancelAnimationFrame(frame);
    if (shouldClear) clearCanvases();
  }

  function syncAnimationState() {
    if (reducedMotion.matches || document.hidden) {
      stopAnimation(reducedMotion.matches);
      return;
    }

    startAnimation();
  }

  function updatePointer(event) {
    pointer.tx = clamp(event.clientX / width, 0, 1);
    pointer.ty = clamp(event.clientY / height, 0, 1);
  }

  function setActiveNode(node) {
    coordinateLayer?.classList.add("is-focusing");
    nodes.forEach((item) => item.classList.toggle("is-active", item === node));
  }

  function clearActiveNode() {
    coordinateLayer?.classList.remove("is-focusing");
    nodes.forEach((item) => item.classList.remove("is-active"));
  }

  function setupNodes() {
    nodes.forEach((node) => {
      node.addEventListener("mouseenter", () => setActiveNode(node));
      node.addEventListener("focus", () => setActiveNode(node));
      node.addEventListener("mouseleave", clearActiveNode);
      node.addEventListener("blur", clearActiveNode);
    });
  }

  function setupCapabilityOrbit() {
    if (!capabilityOrbit) return;

    const setActiveCapability = (node) => {
      capabilityOrbit.classList.add("is-focusing");
      capabilityNodes.forEach((item) => item.classList.toggle("is-active", item === node));
    };

    const clearActiveCapability = () => {
      capabilityOrbit.classList.remove("is-focusing");
      capabilityNodes.forEach((item) => item.classList.remove("is-active"));
    };

    capabilityNodes.forEach((node) => {
      node.addEventListener("mouseenter", () => setActiveCapability(node));
      node.addEventListener("focus", () => setActiveCapability(node));
      node.addEventListener("mouseleave", clearActiveCapability);
      node.addEventListener("blur", clearActiveCapability);
    });
  }

  function setupScrollReveal() {
    if (!revealSections.length) return;

    if (!("IntersectionObserver" in window)) {
      revealSections.forEach((section) => section.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -12% 0px",
      },
    );

    revealSections.forEach((section) => observer.observe(section));
  }

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("pointermove", updatePointer, { passive: true });
  document.addEventListener("visibilitychange", syncAnimationState);
  reducedMotion.addEventListener("change", () => {
    resize();
    syncAnimationState();
  });

  window.__deepRankGalaxy = {
    get dustCount() {
      return dust.length;
    },
    get flowCount() {
      return flows.length;
    },
    get running() {
      return running;
    },
  };

  resize();
  setupNodes();
  setupCapabilityOrbit();
  setupScrollReveal();
  syncAnimationState();
})();
