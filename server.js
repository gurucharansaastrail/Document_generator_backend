// // const express = require("express");
// // const carbone = require("carbone");
// // const cors = require("cors");
// // const multer = require("multer");
// // const fs = require("fs");
// // const path = require("path");
// // const { Console } = require("console");
// // const FormData = require("form-data");
// // // const multer = require("multer");
// // const app = express();
// // app.use(cors());
// // app.use(express.json());

// // // Explicit LibreOffice binary path (adjust if necessary)
// // carbone.settings = {
// //   officePath: "/usr/lib/libreoffice/program/soffice", // Full real path
// // };

// // // Multer config: save uploaded templates to /templates
// // const upload = multer({ dest: "templates/" });

// // app.post("/render", upload.single("template"), (req, res) => {
// //   console.log("---------second one --------------",)
// //   const outputFormat = req.body.outputFormat || "pdf";
// //   const templatePath = req.file?.path;

// //   let jsonData;
// //   try {
// //     jsonData = JSON.parse(req.body.data);
// //   } catch (err) {
// //     console.error("Invalid JSON data:", err);
// //     fs.unlinkSync(templatePath);
// //     return res.status(400).send("Invalid JSON format");
// //   }

// //   carbone.render(templatePath, jsonData, { convertTo: outputFormat }, (err, result) => {
// //     if (err) {
// //       console.error("Carbone render error:", err);
// //       fs.unlinkSync(templatePath);
// //       return res.status(500).send("Document generation failed");
// //     }

// //     const outputFile = path.join("templates", `result_${Date.now()}.${outputFormat}`);

// //     fs.writeFile(outputFile, result, (err) => {
// //       if (err) {
// //         console.error("Failed to write result:", err);
// //         fs.unlinkSync(templatePath);
// //         return res.status(500).send("File writing failed");
// //       }

// //       res.download(outputFile, (downloadErr) => {
// //         if (downloadErr) {
// //           console.error("Download error:", downloadErr);
// //         }

// //         // Clean up files after sending response
// //         try {
// //           fs.unlinkSync(templatePath);
// //           fs.unlinkSync(outputFile);
// //         } catch (cleanupErr) {
// //           console.warn("Cleanup warning:", cleanupErr);
// //         }
// //       });
// //     });
// //   });
// // });



// //   app.use(express.json({ limit: "10mb" })); // to handle big HTML strings
// //   app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// //   const uploade = multer(); // memory storage

  

// //   app.post("/html_render", upload.none(), async (req, res) => {
// //     console.log("REQ.BODY >>>", req.body);

// //     const { htmlCode, fileName, data, outputFormat = "pdf" } = req.body;

// //     if (!htmlCode || !fileName || !data) {
// //       return res.status(400).send("htmlCode, fileName and data are required");
// //     }

// //     // Step 1: Save HTML string as a template file
// //     const templatePath = path.join("templates", `${fileName}.html`);
// //     try {
// //       fs.writeFileSync(templatePath, htmlCode, "utf8");
// //     } catch (err) {
// //       console.error("Error writing HTML template:", err);
// //       return res.status(500).send("Failed to create template file");
// //     }

// //     // Step 2: Parse JSON data
// //     let jsonData;
// //     try {
// //       jsonData = typeof data === "string" ? JSON.parse(data) : data;
// //     } catch (err) {
// //       console.error("Invalid JSON data:", err);
// //       fs.unlinkSync(templatePath);
// //       return res.status(400).send("Invalid JSON format");
// //     }

// //     // Step 3: Render with Carbone
// //     carbone.render(templatePath, jsonData, { convertTo: outputFormat }, (err, result) => {
// //       if (err) {
// //         console.error("Carbone render error:", err);
// //         fs.unlinkSync(templatePath);
// //         return res.status(500).send("Document generation failed");
// //       }

// //       const outputFile = path.join("templates", `result_${Date.now()}.${outputFormat}`);

// //       fs.writeFile(outputFile, result, (err) => {
// //         if (err) {
// //           console.error("Failed to write result:", err);
// //           fs.unlinkSync(templatePath);
// //           return res.status(500).send("File writing failed");
// //         }

// //         res.download(outputFile, (downloadErr) => {
// //           if (downloadErr) {
// //             console.error("Download error:", downloadErr);
// //           }

// //           // Step 4: Cleanup temp files
// //           try {
// //             fs.unlinkSync(templatePath);
// //             fs.unlinkSync(outputFile);
// //           } catch (cleanupErr) {
// //             console.warn("Cleanup warning:", cleanupErr);
// //           }
// //         });
// //       });
// //     });
// //   });







// // const PORT = process.env.PORT || 3001;
// // app.listen(PORT, () => {
// //   console.log(`Server running on http://localhost:${PORT}`);
// // });
// // server.js
// const express = require("express");
// const carbone = require("carbone");
// const cors = require("cors");
// const multer = require("multer");
// const fs = require("fs");
// const fsp = require("fs/promises");
// const path = require("path");

// const app = express();

// // --- Basic hardening / middleware order ---
// app.disable("x-powered-by");
// app.use(cors()); // consider restricting origin in production
// app.use(express.json({ limit: "10mb" }));
// app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// // --- Paths & dirs ---
// const ROOT = __dirname;
// const TEMPLATES_DIR = path.join(ROOT, "templates");
// if (!fs.existsSync(TEMPLATES_DIR)) {
//   fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
// }

// // --- Carbone / LibreOffice path (Docker installs soffice here) ---
// carbone.settings = {
//   officePath: "/usr/bin/soffice",
// };

// // --- Multer config: save uploaded templates to /templates ---
// const upload = multer({ dest: TEMPLATES_DIR });

// // --- Small utilities ---
// async function safeUnlink(p) {
//   if (!p) return;
//   try {
//     await fsp.unlink(p);
//   } catch (e) {
//     if (e && e.code !== "ENOENT") {
//       console.warn("Cleanup warning for", p, e.message);
//     }
//   }
// }

// app.get("/healthz", (_req, res) => res.status(200).json({ ok: true }));

// // =============== File template render ===============
// app.post("/render", upload.single("template"), async (req, res) => {
//   const outputFormat = req.body?.outputFormat || "pdf";
//   const templatePath = req.file?.path;

//   if (!templatePath) {
//     return res.status(400).send('Missing "template" file upload');
//   }

//   let jsonData;
//   try {
//     jsonData = JSON.parse(req.body?.data || "{}");
//   } catch (err) {
//     console.error("Invalid JSON data:", err);
//     await safeUnlink(templatePath);
//     return res.status(400).send("Invalid JSON format");
//   }

//   carbone.render(
//     templatePath,
//     jsonData,
//     { convertTo: outputFormat },
//     async (err, result) => {
//       if (err) {
//         console.error("Carbone render error:", err);
//         await safeUnlink(templatePath);
//         return res.status(500).send("Document generation failed");
//       }

//       const outputFile = path.join(
//         TEMPLATES_DIR,
//         `result_${Date.now()}.${outputFormat}`
//       );

//       fs.writeFile(outputFile, result, async (writeErr) => {
//         if (writeErr) {
//           console.error("Failed to write result:", writeErr);
//           await safeUnlink(templatePath);
//           return res.status(500).send("File writing failed");
//         }

//         res.download(outputFile, async (downloadErr) => {
//           if (downloadErr) console.error("Download error:", downloadErr);
//           await Promise.all([safeUnlink(templatePath), safeUnlink(outputFile)]);
//         });
//       });
//     }
//   );
// });

// // =============== Inline HTML template render ===============
// app.post("/html_render", upload.none(), async (req, res) => {
//   const { htmlCode, fileName, data, outputFormat = "pdf" } = req.body || {};

//   if (!htmlCode || !fileName || !data) {
//     return res
//       .status(400)
//       .send("htmlCode, fileName and data are required");
//   }

//   const templatePath = path.join(TEMPLATES_DIR, `${fileName}.html`);
//   try {
//     fs.writeFileSync(templatePath, htmlCode, "utf8");
//   } catch (err) {
//     console.error("Error writing HTML template:", err);
//     return res.status(500).send("Failed to create template file");
//   }

//   let jsonData;
//   try {
//     jsonData = typeof data === "string" ? JSON.parse(data) : data;
//   } catch (err) {
//     console.error("Invalid JSON data:", err);
//     await safeUnlink(templatePath);
//     return res.status(400).send("Invalid JSON format");
//   }

//   carbone.render(
//     templatePath,
//     jsonData,
//     { convertTo: outputFormat },
//     async (err, result) => {
//       if (err) {
//         console.error("Carbone render error:", err);
//         await safeUnlink(templatePath);
//         return res.status(500).send("Document generation failed");
//       }

//       const outputFile = path.join(
//         TEMPLATES_DIR,
//         `result_${Date.now()}.${outputFormat}`
//       );

//       fs.writeFile(outputFile, result, async (writeErr) => {
//         if (writeErr) {
//           console.error("Failed to write result:", writeErr);
//           await safeUnlink(templatePath);
//           return res.status(500).send("File writing failed");
//         }

//         res.download(outputFile, async (downloadErr) => {
//           if (downloadErr) console.error("Download error:", downloadErr);
//           await Promise.all([safeUnlink(templatePath), safeUnlink(outputFile)]);
//         });
//       });
//     }
//   );
// });

// // --- Boot ---
// const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });
// server.js
const express = require("express");
const carbone = require("carbone");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const os = require("os");

const app = express();

app.disable("x-powered-by");
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// -------- Writable directories --------
// In Vercel Serverless, only /tmp is writable. In Docker, /app is writable.
const WRITABLE_BASE =
  process.env.WRITABLE_DIR || process.env.TMPDIR || os.tmpdir() || __dirname;

const TEMPLATES_DIR = path.join(WRITABLE_BASE, "templates");
try {
  fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
} catch (e) {
  console.error("Failed to ensure templates dir:", TEMPLATES_DIR, e);
}

// -------- LibreOffice (Carbone) detection --------
const SOFFICE_CANDIDATES = [
  "/usr/bin/soffice",                        // Debian/Ubuntu (Dockerfile below installs this)
  "/usr/lib/libreoffice/program/soffice",    // alt path
];
const SOFFICE_PATH = SOFFICE_CANDIDATES.find((p) => fs.existsSync(p));
if (SOFFICE_PATH) {
  carbone.settings = { officePath: SOFFICE_PATH };
} else {
  console.warn(
    "[WARN] LibreOffice not found on this runtime. Carbone conversions will fail until you deploy with Docker."
  );
}

// -------- Multer storage to writable folder --------
const upload = multer({ dest: TEMPLATES_DIR });

// -------- Utils --------
async function safeUnlink(p) {
  if (!p) return;
  try {
    await fsp.unlink(p);
  } catch (e) {
    if (e?.code !== "ENOENT") console.warn("Cleanup warning for", p, e?.message);
  }
}

function ensureSofficeOrFail(res) {
  if (!SOFFICE_PATH) {
    return res.status(500).json({
      error:
        "LibreOffice (soffice) is not installed in this runtime. Deploy this project with the provided Dockerfile on Vercel to enable Carbone conversions.",
    });
  }
  return null;
}

app.get("/healthz", (_req, res) => {
  res.status(200).json({ ok: true, writableBase: WRITABLE_BASE });
});

// ========== /render (file template) ==========
app.post("/render", upload.single("template"), async (req, res) => {
  if (ensureSofficeOrFail(res)) return;

  const outputFormat = req.body?.outputFormat || "pdf";
  const templatePath = req.file?.path;
  if (!templatePath) return res.status(400).send('Missing "template" file upload');

  let jsonData;
  try {
    jsonData = JSON.parse(req.body?.data || "{}");
  } catch (err) {
    console.error("Invalid JSON data:", err);
    await safeUnlink(templatePath);
    return res.status(400).send("Invalid JSON format");
  }

  carbone.render(
    templatePath,
    jsonData,
    { convertTo: outputFormat },
    async (err, result) => {
      if (err) {
        console.error("Carbone render error:", err);
        await safeUnlink(templatePath);
        return res.status(500).send("Document generation failed");
      }

      const out = path.join(
        TEMPLATES_DIR,
        `result_${Date.now()}.${outputFormat}`
      );

      fs.writeFile(out, result, async (werr) => {
        if (werr) {
          console.error("Failed to write result:", werr);
          await safeUnlink(templatePath);
          return res.status(500).send("File writing failed");
        }

        res.download(out, async (derr) => {
          if (derr) console.error("Download error:", derr);
          await Promise.all([safeUnlink(templatePath), safeUnlink(out)]);
        });
      });
    }
  );
});

// ========== /html_render (inline HTML template) ==========
app.post("/html_render", upload.none(), async (req, res) => {
  if (ensureSofficeOrFail(res)) return;

  const { htmlCode, fileName, data, outputFormat = "pdf" } = req.body || {};
  if (!htmlCode || !fileName || !data) {
    return res.status(400).send("htmlCode, fileName and data are required");
  }

  const templatePath = path.join(TEMPLATES_DIR, `${fileName}.html`);
  try {
    fs.writeFileSync(templatePath, htmlCode, "utf8");
  } catch (err) {
    console.error("Error writing HTML template:", err);
    return res.status(500).send("Failed to create template file");
  }

  let jsonData;
  try {
    jsonData = typeof data === "string" ? JSON.parse(data) : data;
  } catch (err) {
    console.error("Invalid JSON data:", err);
    await safeUnlink(templatePath);
    return res.status(400).send("Invalid JSON format");
  }

  carbone.render(
    templatePath,
    jsonData,
    { convertTo: outputFormat },
    async (err, result) => {
      if (err) {
        console.error("Carbone render error:", err);
        await safeUnlink(templatePath);
        return res.status(500).send("Document generation failed");
      }

      const out = path.join(
        TEMPLATES_DIR,
        `result_${Date.now()}.${outputFormat}`
      );

      fs.writeFile(out, result, async (werr) => {
        if (werr) {
          console.error("Failed to write result:", werr);
          await safeUnlink(templatePath);
          return res.status(500).send("File writing failed");
        }

        res.download(out, async (derr) => {
          if (derr) console.error("Download error:", derr);
          await Promise.all([safeUnlink(templatePath), safeUnlink(out)]);
        });
      });
    }
  );
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on :${PORT} | writableBase=${WRITABLE_BASE}`);
});
