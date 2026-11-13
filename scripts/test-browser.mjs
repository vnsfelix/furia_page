// Real local Chromium smoke test. Uses in-memory fixtures and blocks external requests.
// No packages are installed, no production data is read, no deployment is performed.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
import { createApp } from "../backend/src/app.js";
import { memoryRepository } from "../tests/helpers/memory-repository.js";
import { hashPassword } from "../backend/src/services/passwords.js";

const browserPath =
  process.env.FURIA_BROWSER_PATH ||
  [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  ].find((p) => fs.existsSync(p));
if (!browserPath)
  throw new Error("Chrome/Edge não encontrado. Configure FURIA_BROWSER_PATH.");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const repository = memoryRepository();
const senha = await hashPassword("test-password");
const accounts = {};
for (const role of ["admin", "tecnico", "funcionario"])
  accounts[role] = await repository.createUser({
    nome: `Teste ${role}`,
    email: `${role}@test.invalid`,
    role,
    department: "TI",
    senha,
  });
const config = { production: false, origin: "http://localhost:3000" };
const server = createApp({ repository, config }).listen(3000, "127.0.0.1");
await new Promise((resolve, reject) => {
  server.once("listening", resolve);
  server.once("error", reject);
});
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "furia-browser-"));
const chrome = spawn(
  browserPath,
  [
    "--headless=new",
    "--disable-gpu",
    "--remote-debugging-port=0",
    "--remote-debugging-address=127.0.0.1",
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-sync",
    "--no-proxy-server",
    "--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1",
    "about:blank",
  ],
  { windowsHide: true, stdio: "ignore" },
);
let launchError;
chrome.on("error", (error) => {
  launchError = error;
});
let ws;
let session;
const pending = new Map();
let sequence = 0;
const browserErrors = [];
function command(method, params = {}, browser = false) {
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`CDP timeout: ${method}`));
    }, 30000);
    pending.set(id, { resolve, reject, timeout });
    ws.send(
      JSON.stringify({
        id,
        method,
        params,
        ...(!browser && session ? { sessionId: session } : {}),
      }),
    );
  });
}
async function evaluate(expression) {
  const r = await command("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (r.exceptionDetails)
    throw new Error(
      r.exceptionDetails.text +
        ": " +
        r.exceptionDetails.exception?.description,
    );
  return r.result.value;
}
async function wait(expression, timeout = 12000) {
  const deadline = Date.now() + timeout;
  do {
    if (await evaluate(expression)) return;
    await sleep(100);
  } while (Date.now() < deadline);
  throw new Error(`Condição não alcançada: ${expression}`);
}
async function navigate(url) {
  await command("Page.navigate", { url: config.origin + url });
  await wait("document.readyState === 'complete'");
  await sleep(150);
}
async function login(role, destination) {
  await navigate("/index.html");
  await evaluate(
    `document.getElementById('email').value=${JSON.stringify(accounts[role].email)};document.getElementById('password').value='test-password';document.getElementById('loginForm').requestSubmit();`,
  );
  await wait(`location.pathname === ${JSON.stringify(destination)}`);
  await wait("document.readyState === 'complete'");
  await sleep(150);
}
async function logout() {
  await evaluate("Furia.logout()");
  await wait("location.pathname === '/index.html'");
}
async function screenshot(name) {
  fs.mkdirSync("tests/artifacts", { recursive: true });
  const r = await command("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  fs.writeFileSync(
    `tests/artifacts/${name}.png`,
    Buffer.from(r.data, "base64"),
  );
}
try {
  const deadline = Date.now() + 15000;
  const activePort = path.join(profile, "DevToolsActivePort");
  while (!fs.existsSync(activePort)) {
    if (launchError) throw launchError;
    if (Date.now() > deadline) throw new Error("Chromium não iniciou a tempo.");
    await sleep(100);
  }
  const [port, route] = fs
    .readFileSync(activePort, "utf8")
    .trim()
    .split(/\r?\n/);
  ws = new WebSocket(`ws://127.0.0.1:${port}${route}`);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id);
      pending.delete(msg.id);
      clearTimeout(p.timeout);
      if (msg.error) p.reject(new Error(msg.error.message));
      else p.resolve(msg.result);
    }
    if (msg.method === "Runtime.exceptionThrown")
      browserErrors.push(msg.params.exceptionDetails.text);
    if (msg.method === "Fetch.requestPaused") {
      const allowed =
        msg.params.request.url.startsWith(config.origin + "/") ||
        /^(data:|blob:|about:)/.test(msg.params.request.url);
      command(allowed ? "Fetch.continueRequest" : "Fetch.failRequest", {
        requestId: msg.params.requestId,
        ...(!allowed ? { errorReason: "BlockedByClient" } : {}),
      }).catch(() => {});
    }
  });
  const { targetId } = await command(
    "Target.createTarget",
    { url: "about:blank" },
    true,
  );
  session = (
    await command("Target.attachToTarget", { targetId, flatten: true }, true)
  ).sessionId;
  await command("Page.enable");
  await command("Runtime.enable");
  await command("Fetch.enable", { patterns: [{ urlPattern: "*" }] });
  await command("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await navigate("/index.html");
  await screenshot("login-desktop");
  assert.equal(
    await evaluate(
      "getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()",
    ),
    "#d4ff3f",
  );
  await login("admin", "/admin/index.html");
  await wait(
    "document.querySelectorAll('#usersList .user-item-row').length === 3",
  );
  console.log("PASS navegador: login e painel administrativo");
  await logout();
  await login("funcionario", "/inicial/index.html");
  await navigate("/problemas/index.html");
  await evaluate(
    "document.getElementById('categoria').value='sistema';document.getElementById('titulo').value='Chamado do navegador';document.getElementById('descricao').value='Fluxo local completo';document.getElementById('form-problema').requestSubmit();",
  );
  await wait("location.pathname === '/enviados/index.html'");
  await wait(
    "document.getElementById('ticketBadge')?.textContent.includes('TK-')",
  );
  await navigate("/chamados/index.html");
  await wait("document.querySelectorAll('.chamado-card').length === 1");
  console.log("PASS navegador: abertura e histórico do funcionário");
  await repository.createTicket(
    {
      tipo: "problemas",
      titulo: "Telegram simulado",
      descricao: "Inserção compartilhada",
      categoria: "sistema",
      urgencia: "media",
      origem: "telegram",
    },
    accounts.funcionario,
  );
  await wait("document.querySelectorAll('.chamado-card').length === 2", 20000);
  console.log("PASS navegador: atualização automática sem recarregar");
  await navigate("/conta/index.html");
  await wait(
    "document.getElementById('telegramStatus').textContent.includes('ainda')",
  );
  await screenshot("conta-desktop");
  assert.equal(
    await evaluate("document.getElementById('telegramLink').hidden"),
    true,
  );
  await evaluate(
    "document.getElementById('currentPassword').value='test-password';document.getElementById('newPassword').value='new-test-password';document.getElementById('passwordForm').requestSubmit();",
  );
  await wait(
    "document.getElementById('passwordStatus').textContent.includes('Senha atualizada')",
  );
  console.log("PASS navegador: conta, troca de senha e bot não configurado");
  await logout();
  await login("tecnico", "/tecnico/index.html");
  await wait(
    "document.querySelectorAll('#requestsList .status-select').length === 2",
  );
  await evaluate(
    "const select=document.querySelector('.status-select');select.value='Em andamento';select.dispatchEvent(new Event('change',{bubbles:true}));",
  );
  await wait(
    "document.querySelector('.status-select').dataset.status === 'Em andamento'",
  );
  assert.equal(
    [...repository.tickets.values()].some((t) => t.status === "Em andamento"),
    true,
  );
  await command("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await screenshot("tecnico-mobile");
  assert.equal(
    await evaluate(
      "getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()",
    ),
    "#d4ff3f",
  );
  assert.equal(browserErrors.length, 0, browserErrors.join("\n"));
  console.log("PASS navegador: painel técnico, status, tema e captura mobile");
  console.log(
    "5 fluxos reais no Chromium aprovados; screenshots em tests/artifacts. Transporte Supabase e Telegram reais não foram utilizados.",
  );
} finally {
  if (ws?.readyState === WebSocket.OPEN) {
    try {
      await command("Browser.close", {}, true);
    } catch {}
    ws.close();
  } else if (chrome.pid) chrome.kill();
  for (const p of pending.values()) clearTimeout(p.timeout);
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  // Isolated browser profile remains in the OS temporary directory for normal cleanup.
}
