import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";

const require = createRequire(import.meta.url);
const latexCompilerPackage = require("node-latex-compiler");
const mainTexFile = "main.tex";
const outputPdfFile = "main.pdf";

function compileError({ code, message, statusCode = 422, log = "" }) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  error.compileLog = log.slice(-8000);
  return error;
}

function normalizeLatexSource(source = "") {
  const latexSource = String(source).trim();

  if (!/\\documentclass\b/.test(latexSource) || !/\\begin\{document\}/.test(latexSource)) {
    throw compileError({
      code: "RESUME_PREVIEW_NOT_READY",
      message: "The current draft is not a complete LaTeX document yet.",
      statusCode: 400,
    });
  }

  return latexSource;
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      windowsHide: true,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(compileError({
        code: "PDF_COMPILE_TIMEOUT",
        message: "LaTeX compilation timed out.",
        statusCode: 504,
        log: `${stdout}\n${stderr}`,
      }));
    }, env.latexCompileTimeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (exitCode) => {
      clearTimeout(timer);
      resolve({ exitCode, stdout, stderr, log: `${stdout}\n${stderr}`.trim() });
    });
  });
}

async function commandExists(command) {
  const probe = process.platform === "win32" ? "where.exe" : "which";
  const result = await runCommand(probe, [command]).catch(() => null);
  return result?.exitCode === 0;
}

function tectonicPackageAvailable() {
  return latexCompilerPackage.isAvailable();
}

async function chooseCompiler() {
  if (env.latexCompiler !== "auto") {
    return env.latexCompiler;
  }

  if (tectonicPackageAvailable()) {
    return "node-tectonic";
  }

  if (await commandExists("latexmk")) {
    return "latexmk";
  }

  if (await commandExists("tectonic")) {
    return "tectonic";
  }

  if (await commandExists("pdflatex")) {
    return "pdflatex";
  }

  return "missing";
}

async function runLatexmk(workDir) {
  return runCommand("latexmk", [
    "-pdf",
    "-interaction=nonstopmode",
    "-halt-on-error",
    "-file-line-error",
    "-pdflatex=pdflatex -interaction=nonstopmode -halt-on-error -file-line-error -no-shell-escape %O %S",
    mainTexFile,
  ], { cwd: workDir });
}

function getNodeTectonicPath() {
  return latexCompilerPackage.platformResolver?.resolveTectonicExecutable?.({});
}

async function runNodeTectonic(workDir) {
  const tectonicPath = getNodeTectonicPath();

  if (!tectonicPath) {
    throw compileError({
      code: "PDF_COMPILER_NOT_CONFIGURED",
      message: "The bundled Tectonic compiler is not available.",
      statusCode: 503,
    });
  }

  return runCommand(tectonicPath, [
    join(workDir, mainTexFile),
    "--outdir",
    workDir,
  ], { cwd: workDir });
}

async function runTectonic(workDir) {
  return runCommand("tectonic", [
    "--keep-logs",
    "--keep-intermediates",
    "--synctex",
    "--outdir",
    workDir,
    join(workDir, mainTexFile),
  ], { cwd: workDir });
}

async function runPdfLatex(workDir) {
  let latestResult = null;

  for (let pass = 0; pass < 2; pass += 1) {
    latestResult = await runCommand("pdflatex", [
      "-interaction=nonstopmode",
      "-halt-on-error",
      "-file-line-error",
      "-no-shell-escape",
      mainTexFile,
    ], { cwd: workDir });

    if (latestResult.exitCode !== 0) {
      break;
    }
  }

  return latestResult;
}

async function runCompiler({ compiler, workDir }) {
  if (compiler === "node-tectonic") {
    return runNodeTectonic(workDir);
  }

  if (compiler === "latexmk") {
    return runLatexmk(workDir);
  }

  if (compiler === "tectonic") {
    return runTectonic(workDir);
  }

  if (compiler === "pdflatex") {
    return runPdfLatex(workDir);
  }

  throw compileError({
    code: "PDF_COMPILER_NOT_CONFIGURED",
    message: "No LaTeX compiler is configured on the server. Install the Node Tectonic compiler, TeX Live latexmk, Tectonic, or pdflatex.",
    statusCode: 503,
  });
}

export async function compileLatexToPdf({ latexSource, projectId, requestId }) {
  const source = normalizeLatexSource(latexSource);
  const workDir = await mkdtemp(join(tmpdir(), "udbhavi-latex-"));
  const compiler = await chooseCompiler();

  logger.info("latex.compile.started", {
    requestId,
    module: "render",
    projectId,
    compiler,
  });

  try {
    await writeFile(join(workDir, mainTexFile), source, "utf8");
    const result = await runCompiler({ compiler, workDir });
    const pdfPath = join(workDir, outputPdfFile);

    if (result.exitCode !== 0) {
      throw compileError({
        code: "PDF_COMPILE_FAILED",
        message: "LaTeX could not compile the current draft. Review the generated source and try again.",
        log: result.log,
      });
    }

    const pdf = result.pdfBuffer || (await access(pdfPath).then(() => readFile(pdfPath)));

    logger.info("latex.compile.completed", {
      requestId,
      module: "render",
      projectId,
      compiler,
      pdfBytes: pdf.length,
    });

    return {
      pdf,
      compiler,
      filename: `${basename(String(projectId || "resume"))}.pdf`,
    };
  } catch (error) {
    logger.warn("latex.compile.failed", {
      requestId,
      module: "render",
      projectId,
      compiler,
      code: error.code || "PDF_COMPILE_FAILED",
    });

    throw error;
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
