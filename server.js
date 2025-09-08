const express = require("express");
const carbone = require("carbone");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { Console } = require("console");
const FormData = require("form-data");
// const multer = require("multer");
const app = express();
app.use(cors());
app.use(express.json());

// Explicit LibreOffice binary path (adjust if necessary)
carbone.settings = {
  officePath: "/usr/lib/libreoffice/program/soffice", // Full real path
};

// Multer config: save uploaded templates to /templates
const upload = multer({ dest: "templates/" });

app.post("/render", upload.single("template"), (req, res) => {
  console.log("---------second one --------------",)
  const outputFormat = req.body.outputFormat || "pdf";
  const templatePath = req.file?.path;

  let jsonData;
  try {
    jsonData = JSON.parse(req.body.data);
  } catch (err) {
    console.error("Invalid JSON data:", err);
    fs.unlinkSync(templatePath);
    return res.status(400).send("Invalid JSON format");
  }

  carbone.render(templatePath, jsonData, { convertTo: outputFormat }, (err, result) => {
    if (err) {
      console.error("Carbone render error:", err);
      fs.unlinkSync(templatePath);
      return res.status(500).send("Document generation failed");
    }

    const outputFile = path.join("templates", `result_${Date.now()}.${outputFormat}`);

    fs.writeFile(outputFile, result, (err) => {
      if (err) {
        console.error("Failed to write result:", err);
        fs.unlinkSync(templatePath);
        return res.status(500).send("File writing failed");
      }

      res.download(outputFile, (downloadErr) => {
        if (downloadErr) {
          console.error("Download error:", downloadErr);
        }

        // Clean up files after sending response
        try {
          fs.unlinkSync(templatePath);
          fs.unlinkSync(outputFile);
        } catch (cleanupErr) {
          console.warn("Cleanup warning:", cleanupErr);
        }
      });
    });
  });
});

// app.post("/render", upload.single("template"), (req, res) => {
//   try {
//     const data = JSON.parse(req.body.data); // ✅ FIX: parse the JSON string

//     const options = {
//       convertTo: req.body.outputFormat || "pdf", // pdf, docx, etc.
//     };

//     const templatePath = req.file.path;

//     carbone.render(templatePath, data, options, function (err, result) {
//       if (err) {
//         console.error("Carbone render error:", err);
//         return res.status(500).send("Template render failed");
//       }

//       // Send rendered file as response
//       res.setHeader("Content-Disposition", `attachment; filename=result.${options.convertTo}`);
//       res.setHeader("Content-Type", "application/octet-stream");
//       return res.send(result);
//     });
//   } catch (e) {
//     console.error("Error parsing data or rendering:", e);
//     return res.status(400).send("Invalid JSON or render error");
//   }
// });

  app.use(express.json({ limit: "10mb" })); // to handle big HTML strings
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  const uploade = multer(); // memory storage

  // app.post("/html_render", uploade.none(), async (req, res) => {
  //   console.log("REQ.BODY >>>", req.body);
  //   const { htmlCode, fileName, data, outputFormat = "pdf" } = req.body;

  //   if (!htmlCode || !fileName || !data) {
  //     return res.status(400).send("htmlCode, fileName and data are required");
  //   }

  //   // Save HTML string as file
  //   const templatePath = path.join("templates", fileName);
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
  //     fs.unlinkSync(templatePath);
  //     return res.status(400).send("Invalid JSON format");
  //   }

  //   // Render with Carbone
  //   carbone.render(templatePath, jsonData, { convertTo: outputFormat }, (err, result) => {
  //     if (err) {
  //       console.error("Carbone render error:", err);
  //       fs.unlinkSync(templatePath);
  //       return res.status(500).send("Document generation failed");
  //     }

  //     const outputFile = path.join("templates", `result_${Date.now()}.${outputFormat}`);

  //     fs.writeFile(outputFile, result, (err) => {
  //       if (err) {
  //         console.error("Failed to write result:", err);
  //         fs.unlinkSync(templatePath);
  //         return res.status(500).send("File writing failed");
  //       }

  //       res.download(outputFile, (downloadErr) => {
  //         if (downloadErr) {
  //           console.error("Download error:", downloadErr);
  //         }
  //         try {
  //           fs.unlinkSync(templatePath);
  //           fs.unlinkSync(outputFile);
  //         } catch (cleanupErr) {
  //           console.warn("Cleanup warning:", cleanupErr);
  //         }
  //       });
  //     });
  //   });
  // });

  app.post("/html_render", upload.none(), async (req, res) => {
    console.log("REQ.BODY >>>", req.body);

    const { htmlCode, fileName, data, outputFormat = "pdf" } = req.body;

    if (!htmlCode || !fileName || !data) {
      return res.status(400).send("htmlCode, fileName and data are required");
    }

    // Step 1: Save HTML string as a template file
    const templatePath = path.join("templates", `${fileName}.html`);
    try {
      fs.writeFileSync(templatePath, htmlCode, "utf8");
    } catch (err) {
      console.error("Error writing HTML template:", err);
      return res.status(500).send("Failed to create template file");
    }

    // Step 2: Parse JSON data
    let jsonData;
    try {
      jsonData = typeof data === "string" ? JSON.parse(data) : data;
    } catch (err) {
      console.error("Invalid JSON data:", err);
      fs.unlinkSync(templatePath);
      return res.status(400).send("Invalid JSON format");
    }

    // Step 3: Render with Carbone
    carbone.render(templatePath, jsonData, { convertTo: outputFormat }, (err, result) => {
      if (err) {
        console.error("Carbone render error:", err);
        fs.unlinkSync(templatePath);
        return res.status(500).send("Document generation failed");
      }

      const outputFile = path.join("templates", `result_${Date.now()}.${outputFormat}`);

      fs.writeFile(outputFile, result, (err) => {
        if (err) {
          console.error("Failed to write result:", err);
          fs.unlinkSync(templatePath);
          return res.status(500).send("File writing failed");
        }

        res.download(outputFile, (downloadErr) => {
          if (downloadErr) {
            console.error("Download error:", downloadErr);
          }

          // Step 4: Cleanup temp files
          try {
            fs.unlinkSync(templatePath);
            fs.unlinkSync(outputFile);
          } catch (cleanupErr) {
            console.warn("Cleanup warning:", cleanupErr);
          }
        });
      });
    });
  });



// app.post("/render", upload.single("template"), (req, res) => {
//   console.log("--------comming inside ----------")
//   try {
//     const data = JSON.parse(req.body.data); // ✅ parse JSON string

//     const options = {
//       convertTo: req.body.outputFormat || "pdf", // pdf, docx, etc.
//     };

//     const templatePath = req.file.path;

//     carbone.render(templatePath, data, options, function (err, result) {
//       if (err) {
//         console.error("Carbone render error:", err);

//         // ❌ Delete template if error happens
//         fs.unlink(templatePath, (unlinkErr) => {
//           if (unlinkErr) console.error("Error deleting template:", unlinkErr);
//         });

//         return res.status(500).send("Template render failed");
//       }

//       // Send rendered file as response
//       res.setHeader(
//         "Content-Disposition",
//         `attachment; filename=result.${options.convertTo}`
//       );
//       res.setHeader("Content-Type", "application/octet-stream");
//       res.send(result);

//       // ✅ Delete the uploaded template after sending response
//       fs.unlink(templatePath, (unlinkErr) => {
//         if (unlinkErr) console.error("Error deleting template:", unlinkErr);
//         else console.log("Template deleted:", templatePath);
//       });
//     });
//   } catch (e) {
//     console.error("Error parsing data or rendering:", e);

//     // ✅ Delete uploaded file if JSON parsing fails
//     if (req.file?.path) {
//       fs.unlink(req.file.path, (unlinkErr) => {
//         if (unlinkErr) console.error("Error deleting template:", unlinkErr);
//       });
//     }

//     return res.status(400).send("Invalid JSON or render error");
//   }
// });



const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
