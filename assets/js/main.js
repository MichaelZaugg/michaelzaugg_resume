// ---------- smart data + markdown loader ----------
async function tryFetch(path) {
  try {
    const res = await fetch(path, { cache: "no-cache" });
    if (!res.ok) throw new Error();
    return await res.text();
  } catch {
    return null;
  }
}

async function loadJSONSmart({ id, path }) {
  const txt = await tryFetch(path);
  if (txt) return JSON.parse(txt);
  const tag = document.getElementById(id);
  return tag ? JSON.parse(tag.textContent) : [];
}

async function loadMarkdownSmart({ id, path }) {
  const txt = await tryFetch(path);
  if (txt) return marked.parse(txt);
  const tag = document.getElementById(id);
  return tag ? marked.parse(tag.textContent) : "";
}

function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

// ---------- nav highlight ----------
(function () {
  const current = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".tabs a").forEach((a) => {
    const href = a.getAttribute("href").split("/").pop() || "index.html";
    a.classList.toggle("is-active", href === current);
  });
})();

// ---------- renderers ----------
function renderEducation(items, root = "educationList") {
  const r = document.getElementById(root);
  if (!r) return;
  r.innerHTML = "";
  items.forEach((e) => {
    const bullets = (e.highlights || []).map((h) => `<li>${h}</li>`).join("");
    r.appendChild(
      el(`<li>
        <div class="resume-item__title"><strong>${e.institution}</strong> — ${e.degree || ""}</div>
        <div class="resume-item__meta">${e.start || ""} – ${e.end || ""}${e.location ? ` · ${e.location}` : ""}</div>
        ${bullets ? `<ul class="resume-item__bullets">${bullets}</ul>` : ""}
      </li>`)
    );
  });
}

function renderExperience(items, root = "workList") {
  const r = document.getElementById(root);
  if (!r) return;
  r.innerHTML = "";
  items.forEach((w) => {
    const bullets = (w.highlights || []).map((h) => `<li>${h}</li>`).join("");
    r.appendChild(
      el(`<li>
        <div class="resume-item__title"><strong>${w.company}</strong> — ${w.position || ""}</div>
        <div class="resume-item__meta">${w.start || ""} – ${w.end || ""}${w.location ? ` · ${w.location}` : ""}</div>
        ${bullets ? `<ul class="resume-item__bullets">${bullets}</ul>` : ""}
      </li>`)
    );
  });
}

function renderProjects(items, root = "projectGrid", { limit = null } = {}) {
  const r = document.getElementById(root);
  if (!r) return;
  r.innerHTML = "";
  const list = limit ? items.slice(0, limit) : items;
  list.forEach((p) => {
    const media = p.video
      ? `<video src="${p.video}" autoplay muted loop playsinline></video>`
      : p.image
      ? `<img src="${p.image}" alt="${p.title || ""}">`
      : "";
    r.appendChild(
      el(`<article class="tile">
        ${media}
        <div class="tile__body">
          <div class="tile__title">${p.title || ""}</div>
          ${p.subtitle ? `<div class="tile__meta">${p.subtitle}</div>` : ""}
          ${p.link ? `<div style="margin-top:8px"><a class="btn" href="${p.link}" target="_blank">Open</a></div>` : ""}
        </div>
      </article>`)
    );
  });
}

// ---------- page logic ----------
(async () => {
  const page = document.body.dataset.page;
  try {
    if (page === "home") {
      const [edu, exp, pro, aboutHTML] = await Promise.all([
        loadJSONSmart({ id: "json-education", path: "data/education.json" }),
        loadJSONSmart({ id: "json-experience", path: "data/experience.json" }),
        loadJSONSmart({ id: "json-projects", path: "data/projects.json" }),
        loadMarkdownSmart({ id: "md-about", path: "content/about.md" }),
      ]);
      document.getElementById("about_md").innerHTML = aboutHTML;
      renderEducation(edu, "educationList_home");
      renderExperience(exp, "workList_home");
      renderProjects(pro, "projectGrid_home", { limit: 2 });
    }
    if (page === "education") {
      const [md, data] = await Promise.all([
        loadMarkdownSmart({ id: "md-education", path: "content/education.md" }),
        loadJSONSmart({ id: "json-education", path: "data/education.json" }),
      ]);
      document.getElementById("education_md").innerHTML = md;
      renderEducation(data, "educationList");
    }
    if (page === "projects") {
      const [md, data] = await Promise.all([
        loadMarkdownSmart({ id: "md-projects", path: "content/projects.md" }),
        loadJSONSmart({ id: "json-projects", path: "data/projects.json" }),
      ]);
      document.getElementById("projects_md").innerHTML = md;
      renderProjects(data, "projectGrid");
    }
    if (page === "work") {
      const [md, data] = await Promise.all([
        loadMarkdownSmart({ id: "md-work", path: "content/work.md" }),
        loadJSONSmart({ id: "json-experience", path: "data/experience.json" }),
      ]);
      document.getElementById("work_md").innerHTML = md;
      renderExperience(data, "workList");
    }
    if (page === "contact") {
      const md = await loadMarkdownSmart({ id: "md-contact", path: "content/contact.md" });
      document.getElementById("contact_md").innerHTML = md;
    }
  } catch (err) {
    console.error(err);
  }
})();
