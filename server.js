const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* =============================
   1️⃣ Crear materia
============================= */
app.post("/subjects", (req, res) => {
  const { name, weeklyGoalHours } = req.body;

  const sql = "INSERT INTO subjects (name, weeklyGoalHours) VALUES (?, ?)";
  
  db.query(sql, [name, weeklyGoalHours], (err, result) => {
    if (err) {
      res.status(500).json(err);
    } else {
      res.json({
        id: result.insertId,
        name,
        weeklyGoalHours,
        totalHoursStudied: 0
      });
    }
  });
});

/* =============================
   2️⃣ Obtener materias
============================= */
app.get("/subjects", (req, res) => {
  db.query("SELECT * FROM subjects", (err, results) => {
    if (err) {
      res.status(500).json(err);
    } else {
      res.json(results);
    }
  });
});

/* =============================
   3️⃣ Registrar sesión
============================= */
app.post("/study-sessions", (req, res) => {
  const { subjectId, hours, date } = req.body;

  const sql = "INSERT INTO study_sessions (subjectId, hours, date) VALUES (?, ?, ?)";
  
  db.query(sql, [subjectId, hours, date], (err, result) => {
    if (err) {
      res.status(500).json(err);
    } else {

      // actualizar total horas
      db.query(
        "UPDATE subjects SET totalHoursStudied = totalHoursStudied + ? WHERE id = ?",
        [hours, subjectId]
      );

      res.json({
        message: "Sesión registrada",
        id: result.insertId
      });
    }
  });
});

/* =============================
   4️⃣ Progreso por materia
============================= */
app.get("/subjects/:id/progress", (req, res) => {
  const id = req.params.id;

  db.query("SELECT * FROM subjects WHERE id = ?", [id], (err, results) => {
    if (err) {
      res.status(500).json(err);
    } else if (results.length === 0) {
      res.status(404).json({ message: "Materia no encontrada" });
    } else {
      const subject = results[0];
      const progress =
        (subject.totalHoursStudied / subject.weeklyGoalHours) * 100;

      res.json({
        subjectId: subject.id,
        weeklyGoalHours: subject.weeklyGoalHours,
        totalHoursStudied: subject.totalHoursStudied,
        progressPercentage: progress.toFixed(2)
      });
    }
  });
});

app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});
/* =============================
   5️⃣ Eliminar materia
============================= */
app.delete("/subjects/:id", (req, res) => {
  const id = req.params.id;

  // Primero eliminar sesiones asociadas
  db.query("DELETE FROM study_sessions WHERE subjectId = ?", [id], (err) => {
    if (err) {
      return res.status(500).json(err);
    }

    // Luego eliminar materia
    db.query("DELETE FROM subjects WHERE id = ?", [id], (err) => {
      if (err) {
        res.status(500).json(err);
      } else {
        res.json({ message: "Materia eliminada correctamente" });
      }
    });
  });
});