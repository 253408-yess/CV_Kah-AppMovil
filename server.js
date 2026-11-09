const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const SECRET_KEY = "kahu_secret_key_super_segura";

app.use(cors());
app.use(express.json());

// Base de Datos Mock en Memoria
let users = [
  { id: "u1", name: "Alexandros Jose", email: "alexjo24@gmail.com", password: "yAK0124Jo", role: "DUEÑO" },
  { id: "u2", name: "Dra. Valeria Ríos", email: "vet@kahu.gmail.com", password: "CVKahu1234", role: "VETERINARIO" }
];

let pets = [
  { id: "p1", ownerId: "u1", name: "Juancho", species: "Perro", breed: "Mestizo", ageYears: 1, weightKg: 24.6 },
  { id: "p2", ownerId: "u1", name: "Kira", species: "Gato", breed: "Calico", ageYears: 2, weightKg: 6.5 }
];

let appointments = [
  {
    id: "c1",
    ownerId: "u1",
    petName: "Juancho",
    reason: "Vacunación anual y desparasitación",
    date: "2026-11-12",
    time: "10:00 AM",
    status: "Esperando",
    isUrgent: false,
    costEstimate: 450.0
  },
  {
    id: "c2",
    ownerId: "u1",
    petName: "Kira",
    reason: "Revisión de oídos",
    date: "2026-11-15",
    time: "04:30 PM",
    status: "En Atención",
    isUrgent: false,
    costEstimate: 300.0
  }
];

// Middleware para verificar Token JWT
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: "Acceso denegado. No se proporcionó token." });

  const token = authHeader.split(' ')[1];
  try {
    const verified = jwt.verify(token, SECRET_KEY);
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ message: "Token inválido o expirado." });
  }
};

// --- ENDPOINTS DE AUTENTICACIÓN ---

// Registro de Usuario
app.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Todos los campos son obligatorios." });
  }

  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ message: "El correo ya está registrado." });
  }

  const newUser = { id: `u${users.length + 1}`, name, email, password, role: "DUEÑO" };
  users.push(newUser);

  const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, SECRET_KEY, { expiresIn: '8h' });
  res.status(201).json({ token, user: newUser });
});

// Login
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ message: "Credenciales inválidas." });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '8h' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// --- ENDPOINTS DE RECURSOS ---

// Listar Mascotas
app.get('/pets', verifyToken, (req, res) => {
  res.json(pets);
});

// Listar Citas (READ)
app.get('/appointments', verifyToken, (req, res) => {
  res.json(appointments);
});

// Obtener una Cita por ID (READ)
app.get('/appointments/:id', verifyToken, (req, res) => {
  const appt = appointments.find(a => a.id === req.params.id);
  if (!appt) return res.status(404).json({ message: "Cita no encontrada." });
  res.json(appt);
});

// Crear Cita (CREATE)
app.post('/appointments', verifyToken, (req, res) => {
  const { petName, reason, date, time, isUrgent, costEstimate } = req.body;
  
  const newAppointment = {
    id: `c${appointments.length + 1}`,
    ownerId: req.user.id,
    petName,
    reason,
    date,
    time,
    status: "Esperando",
    isUrgent: isUrgent || false,
    costEstimate: costEstimate || 0.0
  };

  appointments.push(newAppointment);
  res.status(201).json(newAppointment);
});

// Actualizar Cita / Estado (UPDATE)
app.put('/appointments/:id', verifyToken, (req, res) => {
  const index = appointments.findIndex(a => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Cita no encontrada." });

  appointments[index] = { ...appointments[index], ...req.body };
  res.json(appointments[index]);
});

// Eliminar Cita (DELETE)
app.delete('/appointments/:id', verifyToken, (req, res) => {
  const index = appointments.findIndex(a => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Cita no encontrada." });

  appointments.splice(index, 1);
  res.json({ message: "Cita eliminada correctamente." });
});

app.listen(PORT, () => {
  console.log(`Servidor de KAHÚ ejecutándose en http://localhost:${PORT}`);
});